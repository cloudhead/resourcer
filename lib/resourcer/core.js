require.paths.unshift(require('path').join(__dirname, '..'));

var sys = require('sys'),
    events = require('events');

var resourcer = exports;

function pp(obj) {
  sys.puts(sys.inspect(obj));
}

resourcer.env = 'development';

resourcer.resources  = {};
resourcer.Resource   = require('resourcer/resource').Resource;
resourcer.engines    = require('resourcer/engines');
resourcer.connection = new(resourcer.engines.memory.Connection);


//
// Select a storage engine
//
resourcer.use = function (engine, options) {
    if (typeof(engine) === "string") {
        if (engine in resourcer.engines) {
            this.engine = resourcer.engines[engine];
        } else {
            throw new(Error)("unrecognised engine");
        }
    } else if (engine && engine.Connection) {
        this.engine = engine;
    } else {
        throw new(Error)("invalid engine");
    }
    this.connect(null, options || {});
    return this;
};
//
// Connect to the resource's storage engine, or one specified by the URI protocol
//
resourcer.connect = function (uri, port, options) {
    var m, protocol = uri && (m = uri.match(/^([a-z]+):\/\//)) && m[1],
        engine = protocol ? resourcer.engines[protocol] : this.engine;

    var store = protocol ? uri.replace(protocol + '://', '') : uri;

    this.connection = (function () {
        switch (engine.Connection.length) {
            case 0:
            case 3: return new(engine.Connection)(store, port, options);
            case 2: return new(engine.Connection)(store, options);
            case 1: return new(engine.Connection)(options);
        }
    })();

    return this;
};

//
// Factory
//
resourcer.define = function (name, definition) {
    if (typeof(name) === "function" && !definition) {
        definition = name;
        name = definition.name;
    }

    name = capitalize(name || 'resource');

    var F = function Resource(attrs) {
        var that = this;

        Object.defineProperty(this, '_properties', {
            value: {},
            enumerable: false
        });

        Object.keys(F.properties).forEach(function (k) {
            that._properties[k] = undefined;
        });

        if (attrs) {
            Object.keys(attrs).forEach(function (k) {
                that._properties[k] = attrs[k];
            });
        }

        this._properties.resource = name;

        Object.keys(this._properties).forEach(function (k) {
            Object.defineProperty(that, k, {
                get: function () {
                    return this.readProperty(k);
                },
                set: function (val) {
                    return this.writeProperty(k, val);
                },
                enumerable: true
            });
        });
    };

    // Setup inheritance
    F.__proto__           = resourcer.Resource;
    F.prototype.__proto__ = resourcer.Resource.prototype;

    F.resource = name;
    F.key      = '_id';
    F.emitter  = new(events.EventEmitter);
    F.emitter.addListener('error', function (e) {
        // Logging
    });

    F.schema = {
        name: name,
        properties: {
            _id: { type: 'string', unique: true }
        },
        links: []
    };

    Object.keys(events.EventEmitter.prototype).forEach(function (k) {
        F[k] = function () {
            return F['emitter'][k].apply(F['emitter'], arguments);
        };
    });

    (definition || function () {}).call(F);

    F.sync(function () {
        F.init();
    });

    return F;
};
resourcer.defineResource = resourcer.define;

resourcer.register = function (name, Factory) {
    return this.resources[name] = Factory;
};
resourcer.unregister = function (name) {
    delete this.resources[name];
};

resourcer.mixin = function (target) {
    var objs = Array.prototype.slice.call(arguments, 1);
    objs.forEach(function (o) {
        Object.keys(o).forEach(function (k) {
            target[k] = o[k];
        });
    });
    return target;
};

resourcer.clone = function (object) {
    return Object.keys(object).reduce(function (obj, k) {
        obj[k] = object[k];
        return obj;
    }, {});
};

resourcer.typeOf = function (value) {
    var s = typeof(value);

    if (Array.isArray(value)) {
        return 'array';
    } else if (s === 'object') {
        if (s) { return 'object' }
        else   { return 'null' }
    } else if (s === 'function') {
        if (s instanceof RegExp) { return 'regexp' }
        else                     { return 'function' }
    } else {
        return s;
    }
};

//
// Utilities
//
function capitalize(str) {
    return str && str[0].toUpperCase() + str.slice(1);
}
