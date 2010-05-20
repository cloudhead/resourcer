var path = require('path'),
    sys = require('sys'),
    assert = require('assert'),
    events = require('events'),
    http = require('http'),
    fs = require('fs');

require.paths.unshift(path.join(__dirname, '..', 'lib'),
                      path.join(__dirname, 'vendor', 'vows', 'lib'));

var cradle = require('vendor/cradle/lib/cradle');

var vows = require('vows');

var resourcer = require('resourcer');

var numberOfArticles = 5;

resourcer.env = 'test';

vows.describe('resourcer/resource/filter').addVows({
    "A database containing articles and other resources": {
        topic: function () {
            resourcer.use('database');
            var promise = new(events.EventEmitter);
            var db = new(cradle.Connection)().database('test');
            db.destroy(function () {
                db.create(function () {
                    db.insert([
                        { resource: 'Article', title: 'The Great Gatsby', published: true,  author: 'fitzgerald', tags: ['classic'] },    
                        { resource: 'Article', title: 'Finding vim',      published: false, author: 'cloudhead', tags: ['hacking', 'vi'] },    
                        { resource: 'Article', title: 'On Writing',       published: true,  author: 'cloudhead', tags: ['writing'] },    
                        { resource: 'Article', title: 'vi Zen',           published: false, author: 'cloudhead', tags: ['vi', 'zen'] },    
                        { resource: 'Article', title: 'Channeling force', published: true,  author: 'yoda',      tags: ['force', 'zen'] },    
                        { resource: 'Body',    name: 'fitzgerald' }
                    ], function () {
                        promise.emit('success');
                    });
                });
            })
            return promise;
        },
        "Is created": function () {}
    }
}).addVows({
    "A Resource definition with filters": {
        topic: function () {
            return resourcer.defineResource('Article', function () {
                this.use('database');
                this.property('author');
                this.property('title');
                this.property('published', Boolean);

                this.filter('all', {});
                this.filter('published', { published: true });
                this.filter('by', function (author) { return { author: author } });
            }).register();
        }, 
        "should respond to the filters": function (R) {
            assert.equal(R.connection.protocol, 'database');
            assert.isFunction (R.published);
            assert.isFunction (R.all);
            assert.isFunction (R.by);
        },
        "can be used to query the database:": {
            "<published>": {
                topic: function (Article) {
                    return Article.published();
                },
                "should return an array of all published Articles": function (res) {
                    assert.isArray (res);
                    assert.length  (res, 3);
                }
            },
            "<published>": {
                topic: function (Article) {
                    return Article.published();
                },
                "should return an array of all Article records": function (res) {
                    assert.isArray (res);
                    assert.length  (res, 3);
                }
            }
        
        
        }
    }
    





});


