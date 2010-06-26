var path = require('path'),
    sys = require('sys'),
    assert = require('assert'),
    events = require('events'),
    http = require('http'),
    fs = require('fs');

require.paths.unshift(path.join(__dirname, '..', 'lib'));

var vows = require('vows');
var eyes = require('eyes');
var cradle = require('cradle');

var resourcer = require('resourcer');

vows.describe('resourcer/engines/database').addVows({
	  "A database containing default resources": {
        topic: function () {
						resourcer.env = 'test';
            resourcer.use('database');
            var promise = new(events.EventEmitter);
            var db = new(cradle.Connection)().database('test');
            db.destroy(function () {
                db.create(function () {
                    db.insert([
                        { _id: 'bob', age: 35, hair: 'black'},
                        { _id: 'tim', age: 16, hair: 'brown'},
                        { _id: 'mat', age: 29, hair: 'black'}
                    ], function () {
                        promise.emit('success');
                    });
                });
            })
            return promise;
        },
        "is created": function () {}
    }
}).addVows({
		"A default Resource factory" : {
				topic: function() {
					return resourcer.defineResource(function () {
						this.use('database');
					});
				},
				"a create() request": {
						topic: function (r) {
		          	r.create({ _id: 99, age: 30, hair: 'red'}, this.callback);
		      	},
		      	"should respond with a `201`": function (e, res) {
		          	assert.equal (res.status, 201);
		      	},
		      	"should create the record in the db": function (e, res) {
		          	assert.isObject (resourcer.connection.store[99]);
		          	assert.equal    (resourcer.connection.store[99].age, 30);
		      	}
				},
				/*"a get() request": {
						"when successful": {
								topic: function (r) {
										return r.get('bob', this.callback);
								},
			      		"should respond with a Resource instance": function (e, obj) {
										assert.isObject   (obj);
			          		assert.instanceOf (obj, resourcer.resources.Resource);
			          		assert.equal      (obj.constructor, resourcer.resources.Resource);
			      		},
			      		"should respond with the right object": function (e, obj) {
			          		assert.equal (obj._id, 'bob');
			      		}
			  		},
			  		"when unsuccessful": {
			      		topic: function (r) {
			          		r.get("david", this.callback);
			      		},
			      		"should respond with an error": function (e, obj) {
										// Remark: Getting e.status === undefined instead of 404
										assert.equal       (e.status, 404);
			          		assert.isUndefined (obj);
			      		}
			  		}
				},*/
				/*"a find() request": {
						// Remark: Database engine currently doesn't support 'find', should we add it?
            "when successful": {
                topic: function (r) {
                    r.find({ hair: "black" }, this.callback);
                },
                "should respond with an array of length 2": function (e, obj) {
                    assert.length (obj, 2);
                },
                "should respond with an array of Resource instances": function (e, obj) {
                    assert.isArray    (obj);
                    assert.instanceOf (obj[0], resourcer.resources.Resource);
                    assert.instanceOf (obj[1], resourcer.resources.Resource);
                }
            },
            "when unsuccessful": {
                topic: function (r) { r.find({ hair: "blue" }, this.callback); },
                "should respond with an empty array": function (e, obj) {
                    assert.isArray (obj);
                    assert.length  (obj, 0)
                }
            }
        },
        "an all() request": {
            // Remark: Database engine currently doesn't support 'all', should we add it?
						topic: function (r) {
                r.all(this.callback);
            },
            "should respond with an array of all records": function (e, obj) {
                assert.isArray (obj);
                assert.length  (obj, 3);
            }
        },*/
		}
}).export(module);