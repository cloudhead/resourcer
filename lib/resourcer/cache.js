
var resourcer = require('resourcer');

resourcer.cache = {
    stores: [],
    push: function (store) {
        return this.stores.push(store);
    },
    clear: function () {
        this.stores.forEach(function (s) { s.clear() });
        return this;
    }
};

this.Cache = function (options) {
    this.size = 0;
    this.store = {};

    resourcer.cache.push(this);
};

this.Cache.prototype = {
    get: function (id) {
        var that = this;

        if (! id) { return }
        else if (Array.isArray(id)) {
            return id.map(function (k) {
                return that.store[k.toString()];
            });
        } else {
            return this.store[id.toString()];
        }
    },
    put: function (id, obj) {
        if (! this.has(id)) { this.size ++ }
        this.store[id] = obj;
    },
    update: function (id, obj) {
        if (id in this.store) {
            for (var k in obj) {
                this.store[id][k] = obj[k];
            }
        }
    },
    clear: function (id) {
        if (id) {
            this.size --;
            delete(this.store[id]);
        } else {
            this.size = 0;
            this.store = {};
        }
    },
    has: function (id) {
        return id in this.store;
    }
};
