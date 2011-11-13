var crypto = require ('crypto'),
    log4js = require ('log4js'),
    oauth = require('oauth').OAuth,
    path = require ('path');

var model = require('../model/model.js').Model;

var _log = log4js.getLogger('oauth');
var _config = null;
var _services = {};

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

var _getService = function (name) {

  if (!_services[name]) {
    var config = _loadConfig()[name];
    var service = new oauth(config.request, 
                            config.access,
                            config.consumerKey,
                            config.consumerSecret, 
                            config.version,
                            config.callback, 
                            config.signature);
    _services[name] = service;
  }
  
  return _services[name];

}

var services = {

  'twitter': function (request, response, store) {
  
    var service = _getService('twitter');          
    service.getOAuthRequestToken(
      function (error, oauth_token, oauth_token_secret, results) {
        if(error) {
          _log.debug(error);
    			response.writeHead(200, {});
    			response.end('error');
    		} else { 
    			// redirect the user to authorize the token
    			response.writeHead(302, {
    			  'Location': 'https://api.twitter.com/oauth/authenticate?oauth_token=' + oauth_token
    			});
    			response.end();
    	  }
    	});
          
  },
  
  'twitter/callback': function (request, response, store) {
  
    var config = _loadConfig().twitter;
    var service = _getService('twitter');
    service.getProtectedResource(
      'https://api.twitter.com/1/account/verify_credentials.json',
      'GET',
      config.token,
      config.tokenSecret,
      function (error, data, serviceResponse) {
                                   
        _log.trace(JSON.parse(data));
        var user = JSON.parse(data);
                                   
        var users = model.get('user', store.getClient());      
        users.find({username: { $regex : '^' + user.screen_name + '$' }}, 
          function (items) {
                                   
            if (items.length == 0) {
              _log.debug ('Create user: ' + user.screen_name);
              // Create user and return to index
              users.create({ 
                username: user.screen_name,
                image: user.profile_image_url,
                updated: 0,
                anonymous: false }, 
                function (error, user) {
                  _log.trace (user);
                                             
                  response.writeHead(301, {
                    'Location': '/index.html#user/login/' + user._id });
                  response.end('');                               
                });
            } else {
              // Get first user and return to index
              _log.debug (items[0]);
                                         
              response.writeHead(301, {
                'Location': '/index.html#user/login/' + items[0]._id });
              response.end('');                               
            }
                                     
          });
          // End verify credentials                           
        
      });
    
  },

  'authenticate': function (request, response, store) {
  
    var method = null;
    for (var service in services) {
      _log.debug ('url: ' + request.url + ' pattern: ' + pattern);
      var pattern = new RegExp(service + '(\\?.*){0,1}$', 'i');
      if (pattern.test(request.url)) {
        method = services[service];
        break;
      }
    }

    if (method) {
      method(request, response, store);
    } else {
      response.writeHead(301, { 'Location': '/notfound' });
      response.end();
    }
  
  }

}

exports.oauth = services;