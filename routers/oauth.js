var crypto = require ('crypto'),
    https = require ('https'),
    log4js = require ('log4js'),
    oauth = require('oauth').OAuth,
    path = require ('path');

var _log = log4js.getLogger('oauth');
var _config = null;

var loadConfig = function () {
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

var services = {

  twitter: function (request, response) {
  
    var config = loadConfig().twitter;
    var service = new oauth('https://api.twitter.com/oauth/request_token', 
                            'https://api.twitter.com/oauth/access_token',
                            config.consumerKey,
                            config.consumerSecret, '1.0',
                            null, 'HMAC-SHA1');
                            
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

  authenticate: function (request, response) {
  
    var method = null;
    for (var service in services) {
      var pattern = new RegExp(service + '$', 'i');
      if (pattern.test(request.url)) {
        method = services[service];
        break;
      }
    }

    if (method) {
      method(request, response);
    } else {
      response.writeHead(301, { 'Location': '/notfound' });
      response.end();
    }
  
  }

}

exports.oauth = services;