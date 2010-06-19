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
				/*"a create() request": {
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
				},*/
				"a get() request": {
						topic: function (r) {
								return r.get('bob', this.callback);
						},
						"when successful": {
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
			          		assert.equal       (e.status, 404);
			          		assert.isUndefined (obj);
			      		}
			  		}
				}
		}
}).export(module);