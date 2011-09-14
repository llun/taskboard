var Router = function(routes) {
  
  var _self = this;
  var _map = {
    get: {},
    post: {}
  };
  
  var _pattern = /^\w+:[\w.-_\/]+$/i;
  var _parse = function (routes) {
    for (var key in routes) {
      if (_pattern.test(key)) {
        var paths = key.split(':');
        
        var method = paths[0].toLowerCase();
        var path = paths[1];
        
        _map[method][path] = routes[key];
      }
    }
    
  }
  
  this.notfound = function(request, response) {
    response.writeHead(404, {})
    response.end("Not found")
  }
  
  this.route = function route(request, response) {
    var method = _map[request.method.toLowerCase()][request.url];
    if (method) {
      method(request, response, _self.everyone);
    } else {
      _self.notfound(request, response);
    }
  }
  
  _parse(routes);
}

exports.router = Router;