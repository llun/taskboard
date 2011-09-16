var mongodb = require('mongodb');

var _log = console.logger('store');

var Store = function(config) {
  
  var _server = new mongodb.Server(config.server, config.port, config.serverOption);
  var _db = new mongodb.Db(config.database, _server, config.databaseOption);
  var _client = null;
  
  _db.open(function (error, client) {
    if (error) {
      _log.error ("Can't connect to database");
      process.exit(1);
    } 
    
    _client = client;
  });
  
  this.getClient = function () {
    return _client;
  }
  
}

exports.store = Store;