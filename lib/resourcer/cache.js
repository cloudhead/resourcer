
var resourcer = require('resourcer');

this.Cache = function (options) {
    this.size = 0;
    this.store = {};
};

this.Cache.prototype = {
    get: function (id) {
        return this.store[id.toString()];
    },
    put: function (id, obj) {
        if (! this.has(id)) { this.size ++ }
        this.store[id] = obj;
    },
    clear: function (id) {
        if (id) { delete(this.store[id]) }
        else    { this.store = {} }
    },
    has: function (id) {
        return id in this.store;
    }
};
