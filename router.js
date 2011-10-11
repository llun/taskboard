var log4js = require('log4js');

var _log = log4js.getLogger('router');

var Router = function(routes) {
  
  var _self = this;
  var _map = {
    get: {},
    post: {}
  };
  
  var _pattern = /^(post|get|*):[\w.-_\/]+$/i;
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
    _log.debug ('route to: ' + request.method.toLowerCase() + ' - ' + request.url);
  
    var method = _map[request.method.toLowerCase()][request.url];
    if (method) {
      method(request, response, _self.everyone, _self.store);
    } else {
      _self.notfound(request, response);
    }
  }
  
  _parse(routes);
}

exports.router = Router;