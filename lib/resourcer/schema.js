//
// Schema/Definition
//
this.definers = {
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

function enforceType(val, type) {
    if (typeof(val) !== type) {
        throw new(Error)({name:"ArgumentError"});
    }
}

