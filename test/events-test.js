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

vows.describe('resourcer/events').addVows({
    "an Article": {
        topic: function () {
            return resourcer.defineResource("article", function () {
                this.property('title');
            });
        },
        "with a 'success' watcher on `save`": {
            topic: function (A) {
                var that = this;
                this.callback = function (obj) {
                    that.obj = obj;
                };
                A.addListener('postCreate', this.callback);
                return A;
            },
            "should add the bound method to factory's `listeners` array": function (A) {
                 assert.isArray (A.listeners('postCreate'));
                 assert.equal   (A.emitter.listeners('postCreate')[0], this.callback);
            },
            "when calling save() on an instance of Article": {
                topic: function (A) {
                    return new(A)({ id: 64, title: 'an Article' }).save();
                },
                "should trigger the bound function": function () {
                    assert.isObject (this.obj);
                }
            
            }
            
        }
    }
});
