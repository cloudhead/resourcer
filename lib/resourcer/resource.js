require.paths.unshift(require('path').join(__dirname, '..'));

var events = require('events');

var definers  = require('resourcer/schema').definers;
var resourcer = require('resourcer');

//
// CRUD
//
this.Resource = function () {};
this.Resource._request = function (method, attrs) {
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

    this.connection.request(method, attrs, function (e, result) {
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
this.Resource.get = function (id, callback) {
    return this._request("get", [id]).addCallbacks(callback);
};
this.Resource.create = function (obj, callback) {
    return this._request("put", [obj.key, obj.properties]).addCallbacks(callback);
};
this.Resource.update = function (key, obj, callback) {
    return this._request("update", [key, obj]).addCallbacks(callback);
};
this.Resource.all = function (callback) {
    return this._request("all", []).addCallbacks(callback);
};
this.Resource.find = function (conditions, callback) {
    if (typeof(conditions) !== "object") {
        throw new(Error)("ArgumentError: `find` takes an object hash");
    }
    return this._request("find", [conditions]).addCallbacks(callback);
};
this.Resource.__defineGetter__('connection', function () {
    return this._connection || resourcer.connection;
});
this.Resource.__defineSetter__('connection', function (val) {
    return this._connection = val;
});
this.Resource.resource = function (name) {
    return this.resourceName = name;
};
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
    
    resourcer.mixin(definer, definers.all, definers[schema.type]);

    return definer;
};


this.Resource.define = function (schema) {
    return resourcer.mixin(this.schema, schema);
};
this.Resource.__defineGetter__('properties', function () {
    return this.schema.properties;
});
this.Resource.__defineSetter__('key', function (val) {
    return this._key = val;
});
this.Resource.__defineGetter__('key', function () {
    return this._key;
});

//
// Prototype
//
this.Resource.prototype = {
    save: function (callback) {
        if (this.isValid()) {
            if (this.isNewRecord()) {
                this.constructor.create(this, callback);
            } else {
                this.update(this, callback);
            }
        } else {
        }
    },
    update: function (obj, callback) {
        this.properties = obj;
        return this.save(callback);
    },
    destroy: function () {},
    isValid: function () {
        return true;
    },
    isNewRecord: function () {
        return true;
    },
    readProperty: function (k) {
        return this._properties[k];
    },
    writeProperty: function (k, val) {
        return this._properties[k] = val;
    }
};
this.Resource.prototype.__defineGetter__('key', function () {
    return this[this.constructor.key];
});
//
// Up
//
this.Resource.prototype.__defineGetter__('properties', function () {
    return this._properties;
});
this.Resource.prototype.__defineSetter__('properties', function (props) {
    var that = this;
    Object.keys(props).forEach(function (k) {
        that[k] = props[k];
    });
    return props;
});

resourcer.resourcefy = function (obj) {
    obj.resource = obj.resource || "Resource";
    if (Factory = this.resources[obj.resource]) {
        return new(Factory)(obj);
    } else {
        throw new(Error)("unrecognised resource");
    }
};

