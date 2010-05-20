var path = require('path');

require.paths.unshift(__dirname, path.join(__dirname, 'vendor'));

var resourcer = exports;

resourcer.defineResource = require('resourcer/core').defineResource;
resourcer.use            = require('resourcer/core').use;
resourcer.connect        = require('resourcer/core').connect;
resourcer.connection     = require('resourcer/core').connection;
resourcer.mixin          = require('resourcer/core').mixin;
resourcer.clone          = require('resourcer/core').clone;
resourcer.engine         = require('resourcer/engines').memory;
resourcer.engines        = require('resourcer/engines');
resourcer.resources      = {
    Resource: new(resourcer.defineResource)
};
