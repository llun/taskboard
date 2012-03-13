var crypto = require ('crypto'),
    log4js = require ('log4js'),
    oauth = require ('oauth').OAuth,
    oauth2 = require('oauth').OAuth2,
    path = require ('path'),
    step = require('step'),
    url = require ('url');

var model = require('../model/model.js').Model;

var _log = log4js.getLogger('oauth');
var _config = null;
var _services = {};
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

var _getService = function (name) {

  if (!_services[name]) {
    var config = _loadConfig()[name];
    var service = null;
    
    if (config.version == '1.0') {
      service = new oauth(config.request, 
                          config.access,
                          config.consumerKey,
                          config.consumerSecret, 
                          config.version,
                          config.callback, 
                          config.signature);
    } else if (config.version == '2.0') {
      service = new oauth2(config.id,
                           config.secret,
                           config.base,
                           config.authorize,
                           config.access_token);
    }
    
    _services[name] = service;
  }
  
  return _services[name];

}

var services = {

  'twitter': function (request, response, store) {
  
    var loginQuery = url.parse(request.url, true).query;
    var service = _getService('twitter');          
    service.getOAuthRequestToken(
      function (error, oauth_token, oauth_token_secret, results) {
        if(error) {
          _log.debug(error);
    			response.writeHead(200, {});
    			response.end('error');
    		} else { 
    		
    		  var config = _loadConfig()['twitter'];
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
        
        delete _tokens[token];
      
      },
      function (error, oauth_token, oauth_token_secret, results) {
        _log.trace (error);
        _log.trace (results);
        
        if (!error) {
        
          service.getProtectedResource(
            'https://api.twitter.com/1/account/verify_credentials.json',
            'GET', oauth_token, oauth_token_secret, this);
          
        
        } else {
          response.writeHead(302, {
            'Location': '/'
          });
          response.end();
        }
      },
      function (error, data, serviceResponse) {
      
        if (!error) {
        
          var user = JSON.parse(data);
          _log.trace(user);
                                     
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
                                           
                response.writeHead(302, {
                  'Location': '/index.html#user/login/' + items[0]._id });
                response.end('');                               
              }
                                       
            });
            // End verify credentials          
        
        } else {
          response.writeHead(302, {
            'Location': '/'
          });
          response.end();
        }
      
      }
    );
      
  },
  
  'github': function (request, response, store) {
  
    var loginQuery = url.parse(request.url, true).query;
    if (loginQuery.invite == _loadConfig().key) {
    
      var config = _loadConfig()['github'];
      var service = _getService('github');
      response.writeHead(301, {
        'Location': service.getAuthorizeUrl({ redirect_uri: config.callback })
      });
      response.end();
      
    } else {
      response.writeHead(302, {
        'Location': '/'
      });
      response.end();
    }  
  
  },
  
  'github/callback': function (request, response, store) {
    var code = url.parse(request.url, true).query.code;
    
    var service = _getService('github');
    
    step(
      function init() {
        service.getOAuthAccessToken(code, null, this);
      },
      function gotAccessToken(error, access_token, refresh_token) {
        if (!error) {
          service.get('https://api.github.com/user', access_token, this);    
        } else {
          response.writeHead(302, {
            'Location': '/'
          });
          response.end();
        }
      },
      function gotUser(error, result) {
      
        if (!error) {
          var user = JSON.parse(result);
          _log.trace(user);
          
          var users = model.get('user', store.getClient());      
          users.find({username: user.login}, 
            function (items) {
                                     
              if (items.length == 0) {
                _log.debug ('Create user: ' + user.login);
                // Create user and return to index
                users.create({ 
                  username: user.login,
                  image: user.avatar_url,
                  updated: 0,
                  anonymous: false }, 
                  function (error, user) {
                    _log.trace (user);
                                               
                    response.writeHead(302, {
                      'Location': '/index.html#user/login/' + user._id });
                    response.end('');                               
                  });
              } else {
                // Get first user and return to index
                _log.debug (items[0]);
                                           
                response.writeHead(302, {
                  'Location': '/index.html#user/login/' + items[0]._id });
                response.end('');                               
              }
                                       
            });
            // End verify credentials   
        } else {
          response.writeHead(302, {
            'Location': '/'
          });
          response.end();
        }
      
        
      });
  
  },
  
  'dropbox': function (request, response, store) {
  
    var loginQuery = url.parse(request.url, true).query;
    var service = _getService('dropbox');          
    service.getOAuthRequestToken(
      function (error, oauth_token, oauth_token_secret, results) {
        if(error) {
          _log.debug(error);
    			response.writeHead(200, {});
    			response.end('error');
    		} else { 
    		
    		  var config = _loadConfig()['dropbox'];
    		  _log.trace (oauth_token + ', ' + oauth_token_secret);
    		  _log.trace (config.callback);
    		  
    		  _tokens[oauth_token] = oauth_token_secret;
    		  
    			// redirect the user to authorize the token
    			response.writeHead(302, {
    			  'Location': 'https://www.dropbox.com/1/oauth/authorize?oauth_token=' + oauth_token +
    			              '&oauth_callback=' + config.callback
    			});
    			response.end();
    	  }
    	});
       
  },
  
  'dropbox/callback': function (request, response, store) {
  
    var service = _getService('dropbox');
    step(
      function () {
      
        _log.trace (request.url);
        
        var dropboxCallback = url.parse(request.url, true).query;
        
        _log.trace (dropboxCallback);
        
        var token = dropboxCallback.oauth_token;
        var verifier = dropboxCallback.oauth_verifier;
        
        var secret = _tokens[token];
        
        _log.trace (token + ', ' + secret + ', ' + verifier);
        service.getOAuthAccessToken(token, secret, verifier, this);
        
        delete _tokens[token];
      
      },
      function (error, oauth_token, oauth_token_secret, results) {
        _log.trace (error);
        _log.trace (results);
        
        if (!error) {

          response.writeHead(302, {
            'Location': '/#dropbox/authorize/' + results.uid
          });
          response.end();
        
        } else {
          response.writeHead(302, {
            'Location': '/'
          });
          response.end();
        }
      }
    );
      
  },

  'menome': function (request, response, store) {

    var loginQuery = url.parse(request.url, true).query;
    if (loginQuery.invite == _loadConfig().key) {

      var config = _loadConfig()['menome'];
      var service = _getService('menome');
      response.writeHead(302, {
        //'Location': config.base + "&client_id=" + config.id
        'Location': service.getAuthorizeUrl({ response_type: "code" })
      });
      response.end();

    } else {
      response.writeHead(302, {
        'Location': '/'
      });
      response.end();
    }  

  },

  'menome/callback': function (request, response, store) {
    var code = url.parse(request.url, true).query.code;

    var service = _getService('menome');

    step(
      function init() {
        service.getOAuthAccessToken(code, null, this);
      },
      function gotAccessToken(error, access_token, refresh_token) {
        if (!error) {
          service.get('https://menomeapi.sunburn.in.th/1/user/user.json', access_token, this);    
        } else {
          response.writeHead(302, {
            'Location': '/'
          });
          response.end();
        }
      },
      function gotUser(error, result) {

        if (!error) {
          var user = JSON.parse(result);
          _log.trace(user);

          var users = model.get('user', store.getClient());      
          users.find({username: user.id}, 
            function (items) {

              if (items.length == 0) {
                _log.debug ('Create user: ' + user.id);
                // Create user and return to index
                users.create({ 
                  username: user.id,
                  image: user.avatar,
                  updated: 0,
                  anonymous: false }, 
                  function (error, user) {
                    _log.trace (user);

                    response.writeHead(302, {
                      'Location': '/index.html#user/login/' + user._id });
                    response.end('');                               
                  });
              } else {
                // Get first user and return to index
                _log.debug (items[0]);

                response.writeHead(302, {
                  'Location': '/index.html#user/login/' + items[0]._id });
                response.end('');                               
              }

            });
            // End verify credentials   
        } else {
          response.writeHead(302, {
            'Location': '/'
          });
          response.end();
        }


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
      response.writeHead(302, { 'Location': '/notfound' });
      response.end();
    }
  
  }

}

exports.oauth = services;