var events = require('events');
var Resource = require('resourcer/resource').Resource;

var render = function (template, attributes) {
    return ['map', 'reduce', 'rereduce'].reduce(function (view, f) {
        if (template[f]) {
            view[f] = Object.keys(attributes).reduce(function (str, k) {
                return str.replace('$' + k, attributes[k]); 
            }, template[f].toString());
            return view;
        } else {
            return view;
        }
    }, {});
};

//
// Define a Resource filter
//
this.filter = function (name, filter) {
    this.addListener('init', function (R) {
        var view;

        if (R.connection.protocol === 'database') {
            if (typeof(filter) === 'object') {
                R.views[name] = render({
                    map: function (doc) {
                        var object = $object;
                        if (doc.resource === $resource) {
                            if (Object.keys(object).every(function (k) {
                                return object[k] === doc[k]; 
                            })) {
                                emit(doc._id, doc);
                            }; 
                        }
                    }
                }, { object: JSON.stringify(filter), resource: JSON.stringify(R.resourceName) });
            } else if (typeof(filter) === 'function') {
            
            } else { throw new(TypeError)("last argument must be an object or function") }

            // Here we create the named filter method on the Resource
            R[name] = function () {
                var that = this,
                    args = Array.prototype.slice.call(arguments),
                    params = {},
                    callback = args.pop(),
                    promise = new(events.EventEmitter);

                if      (args.length === 1) { params = { key: args[0] } }
                else if (args.length > 1)   { params = { key: args } }

                // Make sure our _design document is up to date
                this.reload(function () {
                    that.connection.view([that.resourceName, name].join('/'), params, function (e, res) {
                        if (typeof(callback) === 'function') {
                            callback(res);
                        } else {
                            promise.emit('success', res);
                        }
                    });
                });
                return typeof(callback) === 'function' ? null : promise;
            };
        }
    });
};

//
// Get the Resource's _design document.
//
Resource.__defineGetter__('_design', function () {
    var that = this,
        design = ["_design", this.resourceName].join('/'),
        promise;

    if (this.__design) {
        return this.__design;
    } else {
        promise = new(events.EventEmitter);
        // Get the _design doc from the database.
        this.connection.get(design, function (e, doc) {
            // If there was an error, such as a 404,
            // we need to initialize the document, and save
            // it to the database.
            if (e) {
                that._design = {
                    _id: design,
                    views: that.views || {}
                };
                that.connection.insert(that._design, function (e, res) {
                    if (e) {}
                    // We might not need to wait for the document to be
                    // persisted, before returning it. If for whatever reason
                    // the insert fails, it'll just re-attempt it. For now though,
                    // to be on the safe side, we wait.
                    promise.emit('success', that._design);
                });
            } else {
                promise.emit('success', that._design = doc);
            }
        });
        return promise;
    }
});
//
// Set the Resource's _design document.
//
Resource.__defineSetter__('_design', function (obj) {
    return this.__design = obj;
});

this.view = function () {


};



