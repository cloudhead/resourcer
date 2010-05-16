
var errors;

this.defaultMessages = {
    optional: "",
    pattern: "",
    maximum: "",
    minimum: "",
    maxLength: "",
    minLength: "",
    requires: "",
    unique: ""
};

this.validate = function (object, schema) {
    errors = [];

    if (typeof(object) !== 'object' || typeof(schema) !== 'object') {
        throw new(Error)("`validate` takes two objects as arguments");
    }

    this.validateObject(object, schema);
};

this.validateObject = function (object, schema) {
    var that = this;
    Object.keys(object).forEach(function (k) {
        that.validateProperty(object, k, schema.properties[k])
    });
};

this.checkType = function (val, type) {
    switch (type) {
        case 'string':
            return typeof(val) === 'string';
        case 'array':
            return Array.isArray(val);
        case 'object':
            return typeof(val) === 'object' && !Array.isArray(val);
        case 'number':
            return typeof(val) === 'number';
        case 'integer':
            return typeof(val) === 'number' && (val % 1 === 0);
    }
};

this.validateProperty = function (object, property, schema) {
    var type, value = object[property];

    if (this.checkType(value), schema.type) {
        switch (schema.type) {
            case 'string':
                constrain('minLength', value.length, function (a, e) { return a > e });
                constrain('maxLength', value.length, function (a, e) { return a < e });
                constrain('pattern',   value,        function (a, e) { return e.test(a) });
                break;
            case 'number':
                constrain('minimum',   value, function (a, e) { return a > e });
                constrain('maximum',   value, function (a, e) { return a < e });
        }
    } else {

    }

    function constrain(name, value, assert) {
        if ((name in schema) && !assert(value, schema[name])) {
            error(name, property, value, schema);
        }
    }
};

function error(attribute, property, actual, schema) {
    var message = schema.messages && schema.messages[property] || "no default message";

    errors.push({
        attribute: attribute,
        property: property,
        expected: schema[attribute],
        actual: actual,
        message: message
    });
}

