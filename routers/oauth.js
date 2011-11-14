var crypto = require ('crypto'),
    log4js = require ('log4js'),
    oauth = require ('oauth').OAuth,
    path = require ('path'),
    step = require('step'),
    url = require ('url');

var model = require('../model/model.js').Model;

var _log = log4js.getLogger('oauth');
var _config = null;
var _services = {};
var _tokens = {};

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
    		
    		  var config = _loadConfig()['twitter'];
    		  _log.trace (config.token + ', ' + config.tokenSecret);
    		  _log.trace (oauth_token + ', ' + oauth_token_secret);
    		  
    		  _tokens[oauth_token] = oauth_token_secret;
    		  
    			// redirect the user to authorize the token
    			response.writeHead(302, {
    			  'Location': 'https://api.twitter.com/oauth/authenticate?oauth_token=' + oauth_token
    			});
    			response.end();
    	  }
    	});
          
  },
  
  'twitter/callback': function (request, response, store) {
  
    var service = _getService('twitter');
    step(
      function () {
      
        _log.trace (request.url);
        
        var twitterCallback = url.parse(request.url, true).query;
        
        _log.trace (twitterCallback);
        
        var token = twitterCallback.oauth_token;
        var verifier = twitterCallback.oauth_verifier;
        
        var secret = _tokens[token];
        
        _log.trace (token + ', ' + secret + ', ' + verifier);
        service.getOAuthAccessToken(token, secret, verifier, this);
      
      },
      function (error, oauth_token, oauth_token_secret, results) {
        _log.trace (error);
        _log.trace (results);
        
        if (!error) {
        
          service.getProtectedResource(
            'https://api.twitter.com/1/account/verify_credentials.json',
            'GET', oauth_token, oauth_token_secret, this);
        
        } else {
          response.writeHead(301, {
            'Location': '/'
          });
          response.end();
        }
      },
      function (error, data, serviceResponse) {
      
        if (!error) {
        
          _log.trace(JSON.parse(data));
          
          var user = JSON.parse(data);
                                     
          var users = model.get('user', store.getClient());      
          users.find({username: user.screen_name}, 
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
        
        } else {
          response.writeHead(301, {
            'Location': '/'
          });
          response.end();
        }
      
      }
    );
      
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