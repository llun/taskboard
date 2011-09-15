var http = require('http'),
    nowjs = require('now'),
    path = require('path'),
    fs = require('fs'),
    mime = require('mime'),
    log4js = require('log4js');

// Parse configuration
var config_file = '';
var config = null;
var reload = function (current, previous) {
  if (current.mtime != previous.mtime) {
    config = require(config_file).config;
    log4js.configure(config.log);
    
    console.info ('Reload log configuration success');
  }
}

if (path.existsSync('config.js')) {
  config = require('./config.js').config;
  config_file = './config.js';
  fs.watchFile('config.js', reload);
  
  log4js.configure(config.log);
} else {
  config = require('./config-default.js').config;
  config_file = './config-default.js';
  fs.watchFile('config-default.js', reload);
  
  log4js.configure(config.log);
}

// Initial router
var Router = require('./router.js').router;
var router = new Router(config.routes);

// Initial store
var Store = require('./model/store.js').store;
var store = new Store(config.mongo);
router.store = store;

// Initial server and now.js
var httpServer = http.createServer(
  function(request, response) {
    
    var incoming = request.headers['x-forwarded-for'] || 
                   request.connection.remoteAddress;
    console.log ('(' + incoming + ') request: ' + request.url);
    
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
console.info ('Listen to ' + config.port);

var everyone = nowjs.initialize(httpServer);
router.everyone = everyone;

// Initial everyone
for (var index = 0; index < config.everyone.length; index++) {
  config.everyone[index] (everyone.now, store);
}
console.info ('Everyone is listen to everybody, ready!');
