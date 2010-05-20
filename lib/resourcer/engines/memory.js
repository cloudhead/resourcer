var resourcer = require('resourcer');
//
// In-memory JSON store
//
this.stores = {};
this.Connection = function (uri, options) {
    if (typeof(uri) === "string") {
        // Application-wide store
        this.store = exports.stores[uri] = {};
    } else {
        // Connection-wise store
        this.store = {};
    }
};
this.Connection.prototype = {
    protocol: 'memory',
    load: function (data) {
        this.store = data;
        return this;
    },
    request: function (method, key, obj, callback) {
        var that = this,
            args = Array.prototype.slice.call(arguments, 1);

        process.nextTick(function () {
            that[method].apply(that, args);
        });
    },
    save: function (key, val, callback) {
        var update = key in this.store;
        this.store[key] = val;
        callback(null, { status: update ? 200 : 201 });
    },
    create: function () {
        this.save.apply(this, arguments);
    },
    //update: function (key, obj, callback) {
    //    this.put(key, resourcer.mixin({}, this.store[key], obj), callback);
    //},
    get: function (key, callback) {
        key = key.toString();
        if (key in this.store) {
            callback(null, this.store[key]);
        } else {
            callback({ status: 404 });
        }
    },
    all: function (callback) {
        this.find({}, callback);
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
