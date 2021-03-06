var fs = require('fs'),
    http = require('http'),
    log4js = require('log4js'),
    nowjs = require('now'),
    path = require('path'),
    util = require('util');
    
// Parse configuration
var config_file = '';
var config = null;
var reload = function (current, previous) {
  var _current = current.mtime.getTime();
  var _previous = previous.mtime.getTime();
  
  if (_current != _previous) {
    var config_path = path.join(__dirname, config_file);
    delete require.cache[config_path];
    
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

// Initial store
var Store = require('./model/store.js').store;
var store = new Store(config.mongo);

// Initial router
var Router = require('./router.js').router;
var router = new Router(config.base, config.routes, store);

// Initial server and now.js
var httpServer = http.createServer(router.route);
httpServer.listen(config.port);
console.info ('Listen to ' + config.port);

var everyoneLogger = log4js.getLogger('socketio');
var everyone = nowjs.initialize(httpServer, 
  { host: config.host,
    socketio: { 
      transports: config.transports,
      logger: { log: everyoneLogger.log, 
                info: everyoneLogger.info, 
                debug: everyoneLogger.debug,
                warn: everyoneLogger.warn,
                error: everyoneLogger.error,
                isLevelEnabled: function(otherLevel) {
                  return everyoneLogger.level.isLessThanOrEqualTo(otherLevel);
                },
                emit: function(level, event) {
                  event.categoryName = everyoneLogger.category;
                  everyoneLogger.emit(level, event);
                } } } });

// Initial everyone
for (var index = 0; index < config.everyone.length; index++) {
  config.everyone[index] (nowjs, everyone.now, store);
}

console.info ('Everyone is listen to everybody, ready!');
