var http = require('http'),
    nowjs = require('now'),
    path = require('path'),
    fs = require('fs'),
    mime = require('mime');

// Parse configuration
var config = null;
if (path.existsSync('config.js')) {
  config = require('./config.js').config;
} else {
  config = require('./config-default.js').config;
}

// Initial router
var Router = new require('./router.js').router;
var router = new Router(config.routes);

// Initial server and now.js
var httpServer = http.createServer(
  function(request, response) {
    
    var url = request.url == '/' ? '/index.html' : request.url;
    var filePath = path.join(__dirname, config.base, url);
    
    if (path.existsSync(filePath)) {
      // Serve static file
      var stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        router.notfound(request, response);
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
      router.route(request, response);
    }
    
  });
httpServer.listen(config.port);

var everyone = nowjs.initialize(httpServer);
router.everyone = everyone;

