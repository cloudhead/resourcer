var path = require('path'),
    sys = require('sys'),
    assert = require('assert'),
    events = require('events'),
    http = require('http'),
    fs = require('fs');

require.paths.unshift(path.join(__dirname, '..', 'lib'),
                      path.join(__dirname, 'vendor', 'vows', 'lib'));

var vows = require('vows');

var resourcer = require('resourcer');
var validator = require('resourcer/validator');

vows.describe('resourcer/validator').addVows({
    "A schema": {
        topic: {
            name: 'Article',
            properties: {
                title: {
                    type: 'string',
                    maxLength: 140,
                    optional: true,
                    conditions: {
                        optional: function () {
                            return !this.published;
                        }
                    }
                },
                date: { type: 'string', format: 'date' },
                body: { type: 'string' },
                tags: {
                    type: 'array',
                    items: {
                        type: 'string',
                        pattern: /[a-z ]+/
                    }
                },
                author:    { type: 'string' },
                published: { type: 'boolean', 'default': false },
                category:  { type: 'array' }
            }
        },
        "and a conforming object": {
            topic: {
                title: 'Gimme some Gurus',
                date: new(Date)().toUTCString(),
                body: "And I will pwn your codex.",
                tags: ['energy drinks', 'code'],
                author: 'cloudhead',
                published: true,
                category: 'misc'
            },
            "can be validated with `validator.validate`": {
                topic: function (object, schema) {
                    return validator.validate(object, schema);
                },
                "and return an object with the `valid` property set to true": function (res) {
                    assert.isObject (res);
                    assert.ok       (res.valid);
                },
                "and return an object with the `errors` property as an empty array": function (res) {
                    assert.isArray (res.errors);
                    assert.isEmpty (res.errors);
                }
            }
        }
    }
});
