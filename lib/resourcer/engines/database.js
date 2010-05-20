var sys = require('sys')
var path = require('path');

var resourcer = require('resourcer'),
    cradle = require('cradle/lib/cradle');

this.Connection = function (host, port, config) {
    this.connection = new(cradle.Connection)({
        host: '127.0.0.1',
        port: port || 5984,
        raw: true
    }).database(resourcer.env); 
};

this.Connection.prototype = {
    protocol: 'database',
    request: function (method) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this[method].apply(this, args);
    },
    get: function () {
        return this.connection.get.apply(this.connection, arguments);
    },
    insert: function () {
        return this.connection.insert.apply(this.connection, arguments);
    },
    destroy: function () {
    
    },
    view: function (path, opts, callback) {
        return this.connection.view.call(this.connection, path, opts, function (e, res) {
            if (e) { callback(e) }
            else {
                callback(null, res.rows.map(function (r) { return r.value }));
            }
        });
    }
};
