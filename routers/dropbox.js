var crypto = require ('crypto'),
    log4js = require ('log4js'),
    oauth = require ('oauth').OAuth,
    path = require ('path'),
    step = require('step'),
    url = require ('url');

var model = require('../model/model.js').Model;

var _log = log4js.getLogger('oauth');
var _config = null;
var _service = null;
var _tokens = {};

var _fbStates = {};

var _loadConfig = function () {
  if (!_config) {
  
    var configPath = path.resolve(__dirname, '../config-oauth.js');
    _log.debug ('Configuration path: ' + configPath);
    if (path.existsSync(configPath)) {
      _log.info ('Load oauth config');
      _config = require(configPath).config;
    } else {
      configPath = path.resolve(__dirname, '../config-oauth-default.js');
      _log.info ('Load default oauth config');
      _config = require(configPath).config;
    }
  
  }
  
  return _config;
  
}

var _getService = function () {

  if (!_service) {
    var config = _loadConfig()['dropbox'];
    if (config) {
      _service = new oauth(config.request, 
                          config.access,
                          config.consumerKey,
                          config.consumerSecret, 
                          config.version,
                          config.callback, 
                          config.signature);
    }
    
  }
                      
  return _service;
}

var dropbox = {

  'authenticate': function (request, response, store) {
    response.writeHead(200, {});
    response.end('Hello, World');
  }

}

exports.dropbox = dropbox;