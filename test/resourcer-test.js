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

vows.describe('resourcer').addVows({
    "Resource()": {
        topic: function () {
            return resourcer.Resource();
        },
        "returns a Resource factory": {
            "which is a function": function (Factory) {
                assert.typeOf (Factory, 'function');
            },
            "and has the create/get/all/find methods": function (Factory) {
                assert.isFunction (Factory.create);
                assert.isFunction (Factory.get);
                assert.isFunction (Factory.all);
                assert.isFunction (Factory.find);
            },
            "which can be called": {
                topic: function (Factory) {
                    return new(Factory);
                },
                "to return Resource instances which have prototype methods": function (resource) {
                    assert.isFunction (resource.save);
                    assert.isFunction (resource.update);
                    assert.isFunction (resource.destroy);
                }
            }
        }
    },
    "Resource('article') with a function": {
        topic: function () {
            return resourcer.Resource('article', function () {
                this.data = 42; 
            });
        },
        "returns an Article factory": {
            "with the resource name set": function (Article) {
                assert.equal (Article.name, 'Article');
            },
            "and access to the `data` attribute": function (Article) {
                assert.equal (Article.data, 42);
            },
            "which can be called": {
                topic: function (Article) {
                    this.constructor = Article;
                    Article.prototype.data = 41;
                    return new(Article);
                },
                "returning Article instances": function (article) {
                    assert.isObject (article);
                    assert.equal    (article.constructor, this.constructor);
                    assert.equal    (article.data, 41);
                },
                "returning an object which inherits from Resource's prototype": function (article) {
                    assert.isFunction (article.save);
                    assert.isFunction (article.update);
                    assert.isFunction (article.destroy);
                }
            }
        }
    }
}).addVows({ // API
    "Default Resource instances": {
        topic: function () {
            return resourcer.Resource();
        },
        "have the `resource`, `property` and `define` methods": function (r) {
            assert.isFunction (r.resource);
            assert.isFunction (r.property);
            assert.isFunction (r.define);
        },
        "the `properties` accessor returns an object with only the 'id' property": function (r) {
            assert.isObject (r.properties);
            assert.length   (Object.keys(r.properties), 1);
            assert.include  (r.properties, 'id');
        },
        // Should it be a pointer to the 'id' property instead?
        "the `key` accessor is set to 'id' by default": function (r) {
            assert.equal (r.key, 'id');
        }
    }
}).addVows({ // property
    "A Resource with a couple of properties": {
        topic: function () {
            var r = resourcer.Resource();
            r.property('title');
            r.property('kind');
            return r;
        },
        "adds them to `Resource.properties`": function (r) {
            assert.length  (Object.keys(r.properties), 3);
            assert.include (r.properties, 'title');
            assert.include (r.properties, 'kind');
        },
    },
    "A Resource with duplicate properties": {
        topic: function () {
            var r = resourcer.Resource();
            r.property('dup');
            r.property('dup');
            return r;
        },
        "only keeps the last copy": function (r) {
            assert.length (Object.keys(r.properties), 2); // 'dup' & 'id'
        },
    },
    "The `property()` method": {
        topic: function () {
            this.Resource = resourcer.Resource();    
            return this.Resource.property('kind');
        },
        "returns an object which implements": {
            "requires": function (p) {},
            "type": function (p) {
                p.type('integer');
                assert.equal  (p.property.type, "integer");
                assert.throws (function () { p.type('unknwon') }, Error);
            },
            "optional": function (p) {
                p.optional(true);
                assert.equal  (p.property.optional, true);
                assert.throws (function () { p.optional(1) }, Error);
            },
            "unique": function (p) {
                p.unique(true);
                assert.equal  (p.property.unique, true);
                assert.throws (function () { p.unique(1) }, Error);
            },
            "title": function (p) {
                p.title("the title");
                assert.equal  (p.property.title, "the title");
                assert.throws (function () { p.title(false) }, Error);
            },
            "description": function (p) {
                p.description("the description");
                assert.equal  (p.property.description, "the description");
                assert.throws (function () { p.title(false) }, Error);
            },
            "format": function (p) {
                p.format("email");
                assert.equal  (p.property.format, "email");
                assert.throws (function () { p.format("unknown") }, Error);
            },
            "storageName": function (p) {
                p.storageName("_kind");
                assert.equal  (p.property.storageName, "_kind");
                assert.throws (function () { p.storageName(21) }, Error);
            },
            "conform": function (p) {
                p.conform(function (kind) { kind !== "banana" });
                assert.isFunction  (p.property.conform);
                assert.throws      (function () { p.conform("banana") }, Error);
            },
            "lazy": function (p) {
                p.lazy(true);
                assert.equal  (p.property.lazy, true);
                assert.throws (function () { p.lazy(1) }, Error);
            },
        },
        "with a 'string' type": {
            topic: function () {
                this.Resource = resourcer.Resource();    
                return this.Resource.property('kind', String);
            },
            "returns an object which implements": {
                "pattern": function (p) {},
                "minLength": function (p) {},
                "maxLength": function (p) {},
                "length": function (p) {},
            }
        },
        "with a 'number' type": {
            topic: function () {
                this.Resource = resourcer.Resource();    
                return this.Resource.property('size', Number);
            },
            "returns an object which implements": {
                "minimum": function (p) {},
                "maximum": function (p) {},
                "within": function (p) {},
            },
            "return an object which doesn't implement String 'definers'": function (p) {
                assert.ok (! p.pattern);
                assert.ok (! p.minLength);
            }
        }
    }
}).addVows({
    "Defining a Resource schema": {
        "with `property()`": {
            topic: function () {
                var r = resourcer.Resource();    
                r.property('title', String, { maxLength: 16 });
                r.property('description', { maxLength: 32 });
                return r;
            },
            "should add an entry to `properties`": function (r) {
                assert.equal (r.properties.title.maxLength, 16); 
                assert.equal (r.properties.description.maxLength, 32);
            },
            "should default to type:'string'": function (r) {
                assert.equal (r.properties.title.type, "string"); 
                assert.equal (r.properties.description.type, "string"); 
            }
        },
        "with `define()`": {
            topic: function () {
                var r = resourcer.Resource();    
                r.define({
                    properties: {
                        title: {
                            type: "string",
                            maxLength: 16
                        },
                        description: {
                            type: "string",
                            maxLength: 32
                        } 
                    }
                });
                return r;
            },
            "should add entries to `properties`": function (r) {
                assert.equal (r.properties.title.maxLength, 16); 
                assert.equal (r.properties.description.maxLength, 32);
            }
        },
        "by chaining attribute setters": {
            topic: function () {
                var r = resourcer.Resource();
                r.property('title').type('string')
                                   .maxLength(16)
                                   .minLength(0);
                return r;
            },
            "should work just the same": function (r) {
                assert.equal (r.properties.title.type, "string"); 
                assert.equal (r.properties.title.maxLength, 16); 
                assert.equal (r.properties.title.minLength, 0); 
            }
        }
    }
}).addVows({
    "Storage engines": {
    
    
    }
}).addVows({ // CRUD
    "CRUD operations": {
        topic: function () {
            resourcer.use(resourcer.engines.memory).connect(); 
            resourcer.connection.put("bob", { id: 42 }, function () {});
        },
        "on the Resource factory": {
            topic: function () {
                return resourcer.Resource();
            },
            "a get request": {
                "when successful": {
                    topic: function (r) {
                        return r.get("bob");
                    },
                    "should respond with a Resource instance": function (e, obj) {
                        assert.isObject (obj);
                        assert.ok       (obj instanceof resourcer.resources.Resource);
                        assert.equal    (obj.constructor, resourcer.resources.Resource);
                    },
                    "should respond with the right object": function (e, obj) {
                        assert.equal (obj.id, 42);
                    }
                },
                "when unsuccessful": {
                    topic: function (r) {
                        return r.get("david");
                    },
                    "should respond with an error": function (e, obj) {
                        assert.equal  (e.status, 404);
                        assert.typeOf (obj, "undefined");
                    }
                }
            }
        },
        "on a Resource instance": {
            topic: function () {
                return resourcer.Resource();
            },
            "a find request": {
                topic: function (r) {
                    //return r.get()
                }
            }
        }
    }
});


