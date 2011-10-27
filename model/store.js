var mongodb = require('mongodb'),
    log4js = require('log4js');

var _log = log4js.getLogger('store');

var Store = function(config) {
  
  var _server = new mongodb.Server(config.server, config.port, config.serverOption);
  var _db = new mongodb.Db(config.database, _server, config.databaseOption);
  
  var _client = null;
  
  _db.open(function (error, client) {
    
    if (error) {
      _log.error ("Can't open database");
      _log.debug (error);
      process.exit(1);
    }
    
    var username = config.authentication ? config.authentication.username : null;
    var password = config.authentication ? config.authentication.password : null;
    
    _log.debug ("User: " + (username ? username : 'no user') + 
                " Pass: " + (password ? password : 'no password'));
    
    if (username || password) {

      _db.authenticate(username, password,
        function (error, data) {

          if (error) {
            _log.error ("Authentication fail");
            process.exit(1);
          } else {
            _log.debug ("Authentication success");
            _log.info ("Connect database success");
            _client = client;
          }

        });
    } else {
      _log.info ("Connect database success");
      _client = client;
    }
    
  });
  
  this.getClient = function () {
    return _client;
  }
  
}

exports.store = Store;