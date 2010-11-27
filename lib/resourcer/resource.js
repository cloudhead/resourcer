require.paths.unshift(require('path').join(__dirname, '..'));

var events = require('events');

var definers  = require('resourcer/schema').definers;
var resourcer = require('resourcer');

//
// CRUD
//
this.Resource = function () {};

this.Resource.filter = require('resourcer/resource/view').filter;

this.Resource.views = {};

this.Resource.init = function () {
    this.emit('init', this);
};
this.Resource.register = function () {
    return resourcer.register(this.resource, this);
};
this.Resource.unregister = function () {
    return resourcer.unregister(this.resource);
};
this.Resource._request = function (/* method, [key, obj], callback */) {
    var args     = Array.prototype.slice.call(arguments),
        that     = this,
        callback = args.pop(),
        method   = args.shift(),
        key      = args.shift(),
        obj      = args.shift();

    key && args.push(key);
    obj && args.push(obj.properties ? obj.properties : obj);

    this.emit(method + "Begin", obj);

    args.push(function (e, result) {
        var Factory;

        if (e) {
            if (e.status >= 500) {
                throw new(Error)(e);
            } else {
                that.emit("error", e, obj);
                callback(e);
            }
        } else {
            if (Array.isArray(result)) {
                result = result.map(function (r) {
                    return resourcer.instantiate.call(that, r);
                });
            } else {
                if (['get', 'find', 'view'].indexOf(method) !== -1) {
                    result = resourcer.instantiate.call(that, result);
                } else {
                    that.connection.cache.put(key, obj);
                }
            }
            that.emit(method + "End", result, obj);
            callback(null, result);
        }
    });
    this.connection[method].apply(this.connection, args);
};
this.Resource.get = function (id, callback) {
    return this._request("get", id, callback);
};
this.Resource.create = function (attrs, callback) {
    var instance = new(this)(attrs);
    instance.save(function (e, res) {
        if (res) {
            instance._id  = instance._id || res.id;
            res.rev && (instance._rev = res.rev);
        }
        callback(e, instance);
    });
};
this.Resource.save = function (obj, callback) {
    return this._request("save", obj.key, obj, callback);
};
this.Resource.destroy = function (key, callback) {
    return this._request("destroy", key, callback);
};
this.Resource.update = function (key, obj, callback) {
    return this._request("update", key, obj, callback);
};
this.Resource.all = function (callback) {
    return this._request("all", callback);
};
this.Resource.view = function (path, params, callback) {
    return this._request("view", path, params, callback);
};
this.Resource.find = function (conditions, callback) {
    if (typeof(conditions) !== "object") {
        throw new(TypeError)("`find` takes an object as first argument.");
    }
    return this._request("find", conditions, callback);
};
this.Resource.__defineGetter__('connection', function () {
    return this._connection || resourcer.connection;
});
this.Resource.__defineSetter__('connection', function (val) {
    return this._connection = val;
});
this.Resource.__defineGetter__('engine', function () {
    return this._engine || resourcer.engine;
});
this.Resource.__defineSetter__('engine', function (val) {
    return this._engine = val;
});
this.Resource.use     = function () { return resourcer.use.apply(this, arguments) };
this.Resource.connect = function () { return resourcer.connect.apply(this, arguments) };

this.Resource.__defineGetter__('resource', function () {
    return this._resource;
});
this.Resource.__defineSetter__('resource', function (name) {
    return this._resource = name;
});
this.Resource.property = function (name, typeOrSchema, schema) {
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
    
    resourcer.mixin(definer, definers.all, definers[schema.type] || {});

    return definer;
};

this.Resource.define = function (schema) {
    return resourcer.mixin(this.schema, schema);
};
this.Resource.__defineGetter__('properties', function () {
    return this.schema.properties;
});
this.Resource.__defineSetter__('key', function (val) { return this._key = val });
this.Resource.__defineGetter__('key', function ()    { return this._key });

this.Resource.delegate = function (method, property) {
    var that = this;
    this[method] = function () {
        return that[property][method].apply(that[property], arguments);
    };
};

//
// Reload a Resource's _design document from the database.
//
this.Resource.reload = function (callback) {
    var design, that = this;

    if (this.connection.protocol === 'database') {
        design = this._design;
        if (design instanceof events.EventEmitter) {
            design.addListener('success', function (doc) {
                callback.call(that);
            });
        } else {
            callback.call(this);
        }
    } else {
        callback.call(this);
    }
};

//
// Prototype
//
this.Resource.prototype = {
    save: function (callback) {
        var that = this;
        if (this.isValid) {
            this.constructor.save(this, function (e, res) {
                if (!e) { that.isNewRecord = false }
                callback(e, res);
            });
        } else {
        }
    },
    update: function (obj, callback) {
        this.properties = obj;
        return this.save(callback);
    },
    destroy: function () {},
    isNewRecord: true,
    readProperty: function (k) {
        return this._properties[k];
    },
    writeProperty: function (k, val) {
        return this._properties[k] = val;
    },

    get key () {
        return this[this.constructor.key];
    },
    get id () {
        if (this.constructor.key === '_id') { return this._id }
        else                                { return undefined }
    },
    get isValid () {
        return true;
    },

    get properties () {
        return this._properties;
    },
    set properties (props) {
        var that = this;
        Object.keys(props).forEach(function (k) {
            that[k] = props[k];
        });
        return props;
    },
    toJSON: function () {
        return resourcer.clone(this._properties);
    },
    toString: function () {
        return JSON.stringify(this._properties);
    }
};
    }
};

resourcer.instantiate = function (obj) {
    var instance;

    obj.resource = obj.resource || this.resource;

    if (instance = this.connection.cache.get(obj[this.key])) {
        return instance;
    } else if (Factory = resourcer.resources[obj.resource]) {
        return new(Factory)(obj);
    } else {
        throw new(Error)("unrecognised resource '" + obj.resource + "'");
    }
};

//
// Utilities
//
function capitalize(str) {
    return str && str[0].toUpperCase() + str.slice(1);
}
