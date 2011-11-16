var fs = require('fs'),
    mime = require('mime'),
    path = require('path'),
    log4js = require('log4js'),
    url = require('url');

var _log = log4js.getLogger('router');

var Router = function(base, routes, store) {
  
  var _self = this;
  
  var _base = base;
  var _store = store;
  var _map = {
    get: {},
    post: {}
  };
  
  var _pattern = /^(post|get|\*):[\w.-_\/]+$/i;
  var _parse = function (routes) {
    for (var key in routes) {
      if (_pattern.test(key)) {
        var paths = key.split(':');
        
        var method = paths[0].toLowerCase();
        var path = paths[1];
        
        if (method == '*') {
          for (var type in _map) {
            _map[type][path] = routes[key];
          }
        } else {          
          _map[method][path] = routes[key];
        }
        
      }
    }
    
  }
  
  this.notfound = function(request, response) {
    response.writeHead(404, {})
    response.end("Not found")
  }
  
  this.route = function route(request, response) {
  
    var incoming = request.headers['x-forwarded-for'] || 
                   request.connection.remoteAddress;
    _log.info ('(' + incoming + ') request: ' + request.url);
    _log.debug ('route to: ' + request.method.toLowerCase() + ' - ' + request.url);
    
    var target = request.url == '/' ? '/index.html' : request.url;
    var filePath = path.join(__dirname, _base, url.parse(target).pathname);
        
    if (path.existsSync(filePath)) {
      // Serve static file
      var stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        _self.notfound(request, response);
      } else {
        response.writeHead(200, {
          'Content-Type': mime.lookup(filePath),
          'Content-Length': stat.size
        });

        var stream = fs.createReadStream(filePath);
        stream.on('data', function (data) {
          response.write(data);
        });

        stream.on('end', function() {
          response.end();
        });
      }
      
    } else {
    
      var method = _map[request.method.toLowerCase()][request.url];
      if (method) {
        method(request, response, _store);
      } else {
      
        var methods = _map[request.method.toLowerCase()];
        var match = null;
        for (var key in methods) {
        
          var pattern = new RegExp('^' + key + '.*$', 'i');
          _log.debug ('url: ' + request.url + ' pattern: ' + pattern);
          if (pattern.test(request.url)) {
            match = methods[key];
            break;
          }
        
        }
        
        if (match) {
          match(request, response, _store);
        } else {
          _self.notfound(request, response);
        }
        
      }  
    }
    
  }
  
  _parse(routes);
}

exports.router = Router;