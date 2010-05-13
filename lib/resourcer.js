var sys = require('sys'),
    events = require('events');

var resourcer = exports;

function pp(obj) {
  sys.puts(sys.inspect(obj));
}

resourcer.resources = {};
resourcer.engines = {};
resourcer.engines.memory = {
    stores: {}
};

// Default engine
resourcer.engine = resourcer.engines.memory;
//
// Select a storage engine
//
resourcer.use = function (engine) {
    if (typeof(engine) === "string") {
        if (engine in this.engines) {
            this.engine = this.engines[engine];
        } else {
            throw new(Error)("unrecognised engine");
        }
    } else if (engine && engine.Connection) {
        this.engine = engine;
    } else {
        throw new(Error)("invalid engine");
    }
    return this;
};
//
// Connect to the default storage engine
//
resourcer.connect = function (uri, port, options) {
    var protocol = uri && uri.match(/^([a-z]+):\/\//)[1],
        engine = protocol ? this.engines[protocol] : this.engine;

    return this.connection = (function () {
        switch (engine.Connection.length) {
            case 0:
            case 3: return new(engine.Connection)(uri, port, options);
            case 2: return new(engine.Connection)(uri, options);
            case 1: return new(engine.Connection)(options);
        }
    })();
};

resourcer.engines.memory.Connection = function (uri, options) {
    if (typeof(uri) === "string") {
        // Application-wide store
        this.store = resourcer.engines.memory.stores[uri] = {};
    } else {
        // Connection-wise store
        this.store = {};
    }
};
resourcer.engines.memory.Connection.prototype = {
    load: function (data) {
        this.store = data;
        return this;
    },
    request: function (method, attrs, callback) {
        var that = this;
        process.nextTick(function () {
            that[method].apply(that, attrs.concat(callback));
        });
    },
    put: function (key, val, callback) {
        var update = key in this.store;
        this.store[key] = val;
        callback(null, { status: update ? 200 : 201 });
    },
    get: function (key, callback) {
        if (key in this.store) {
            callback(null, this.store[key]);
        } else {
            callback({ status: 404 });
        }
    },
    find: function (conditions, callback) {
        var store = this.store;
        this.filter(function (obj) {
            return Object.keys(conditions).every(function (k) {
                return conditions[k] ===  obj[k];
            });
        }, callback);
    },
    filter: function (filter, callback) {
        var result = [], store = this.store;
        Object.keys(this.store).forEach(function (k) {
            if (filter(store[k])) {
                result.push(store[k]);
            }
        });
        callback(null, result);
    }
};

//
// Factory
//
resourcer.Resource = function (name, definition) {
    var init = function (that) {
        for (var k in attrs) {
            that[k] = attrs[k];
        }
    };
    var F = new(Function)("return function "              +
                         (capitalize(name) || "Resource") +
                         "(attrs) { (" +  init.toString() + ")(this) }")();

    F.__proto__           = resourcer.Resource;
    F.prototype.__proto__ = resourcer.Resource.prototype;

    F.schema = {
        name: name,
        properties: {
            id: { type: 'string', unique: true }
        },
        links: []
    };
    F.key = 'id';

    (definition || function () {}).call(F);

    return F;
};
resourcer.resources.Resource = new(resourcer.Resource);

//
// CRUD
//
resourcer.Resource._request = function (method, attrs) {
    var promise = new(events.EventEmitter);
    
    promise.addCallbacks = function (callback) {
        if (callback) {
            this.addListener("success", function (res) {
                callback(null, res);
            });
            this.addListener("error", function (e) {
                callback(e);
            });
        } else {
            return this; 
        }
    };

    resourcer.connection.request(method, attrs, function (e, result) {
        var Factory;

        if (e) {
            if (e.status >= 500) {
                throw new(Error)(e);
            } else {
                promise.emit("error", e);
            }
        } else {
            if (Array.isArray(result)) {
                result = result.map(function (r) {
                    return resourcer.resourcefy(r);
                });
            } else {
                result = resourcer.resourcefy(result);
            }
            promise.emit("success", result);
        }
    });
    return promise;
};
resourcer.resourcefy = function (obj) {
    obj.resource = obj.resource || "Resource";
    if (Factory = this.resources[obj.resource]) {
        return new(Factory)(obj);
    } else {
        throw new(Error)("unrecognised resource");
    }
};
resourcer.Resource.get = function (id, callback) {
    return this._request("get", [id]).addCallbacks(callback);
};
resourcer.Resource.create = function (obj, callback) {
    return this._request("put", [obj.key, obj]).addCallbacks(callback);
};
resourcer.Resource.all = function (callback) {
    return this._request("all", []).addCallbacks(callback);
};
resourcer.Resource.find = function (conditions, callback) {
    if (typeof(conditions) !== "object") {
        throw new(Error)("ArgumentError: `find` takes an object hash");
    }
    return this._request("find", [conditions]).addCallbacks(callback);
};

function enforceType(val, type) {
    if (typeof(val) !== type) {
        throw new(Error)({name:"ArgumentError"});
    }
}

//
// Schema/Definition
//
var definers = {
    all: {
        define: function (attr, val /*, condition, options */) {
            var args = Array.prototype.slice.call(arguments, 2),
                condition, options;

            this.property[attr] = val;

            if (typeof(args[0]) === "function") {
                condition = args[0];
                options = args[1] || {};
            } else {
                options = args[0] || {};
            }

            if (options.message)   { this.property.messages[attr] = options.message }
            if (options.condition) { this.property.conditions[attr] = condition }

            return this;
        },
        requires: function () {},
        type: function (val) {
            var valid = [
                'string',  'number', 'integer',
                'boolean', 'object', 'array',
                'null',    'any'
            ];
            if (valid.indexOf(val) !== -1) {
                this.property.type = val;
            } else {
                throw new(Error)({name:"ArgumentError"});
            }
            return this;
        },
        optional: function (val, condition, options) {
            enforceType(val, "boolean");
            return this.define("optional", val, condition, options);
        },
        unique: function (val, condition, options) {
            enforceType(val, "boolean");
            return this.define("unique", val, condition, options);
        },
        title: function (val) {
            enforceType(val, "string");
            this.property.title = val;
        
            return this;
        },
        description: function (val) {
            enforceType(val, "string");
            this.property.description = val;
        
            return this;
        },
        format: function (val, condition, options) {
            var valid = [
                'date',       'time',   'utc-millisec',
                'regex',      'color',  'style',
                'phone',      'uri',    'email',
                'ip-address', 'ipv6',   'street-adress',
                'country',    'region', 'postal-code',
                'locality'
            ];
            if (valid.indexOf(val) !== -1) {
                return this.define("format", val, condition, options);
            } else {
                throw new(Error)({name:"ArgumentError"});
            }
        },
        storageName: function (val) {
            enforceType(val, "string");
            this.property.storageName = val;
        
            return this;
        },
        conform: function (val, condition, options) {
            enforceType(val, "function");
            return this.define("conform", val, condition, options);
        },
        lazy: function (val, condition, options) {
            enforceType(val, "boolean");
            return this.define("lazy", val, condition, options);
        },
    },
    string: {
        pattern: function (val) {
            enforceType(val, "regexp");
            this.property.pattern = val;
            return this;
        },
        minLength: function (val) {
            enforceType(val, "number");
            this.property.minLength = val;
            return this;
        },
        maxLength: function (val) {
            enforceType(val, "number");
            this.property.maxLength = val;
            return this;
        },
        length: function () {},
    },
    number: {
        minimum: function () {
        
        
        
        },
        maximum: function () {
        
        
        },
        within: function () {},
    }
};
resourcer.Resource.resource = function () {
};
resourcer.Resource.property = function (name, typeOrSchema, schema) {
    var definer = {};
    var type = (function () {
        switch (typeof(typeOrSchema)) {
            case "string":    return typeOrSchema;
            case "function":  return typeOrSchema.name.toLowerCase();
            case "object":    schema = typeOrSchema;
            case "undefined": return "string";
            default:          throw new(Error)("Argument Error"); 
        }
    })();

    schema = schema || {};
    schema.type = schema.type || type;

    this.schema.properties[name] = definer.property = schema;
    
    mixin(definer, definers.all, definers[schema.type]);

    return definer;
};


resourcer.Resource.define = function (schema) {
    return mixin(this.schema, schema);
};
resourcer.Resource.__defineGetter__('properties', function () {
    return this.schema.properties;
});
resourcer.Resource.__defineSetter__('key', function (val) {
    return this._key = val;
});
resourcer.Resource.__defineGetter__('key', function () {
    return this._key;
});

//
// Prototype
//
resourcer.Resource.prototype = {
    save: function () {},
    update: function () {},
    destroy: function () {},
    isValid: function () {},
    isNewRecord: function () {}
};

//
// Utilities
//
function mixin(target) {
    var objs = Array.prototype.slice.call(arguments, 1);
    objs.forEach(function (o) {
        Object.keys(o).forEach(function (k) {
            target[k] = o[k];
        });
    });
    return target;
}
function capitalize(str) {
    return str && str[0].toUpperCase() + str.slice(1);
}
