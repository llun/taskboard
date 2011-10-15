var log4js = require('log4js');

var _log = log4js.getLogger('user');
    _model = require('../model/model.js').Model;

var UserHandler = {

  initial: function(now, everyone, store) {
  
    everyone.user = function (id, callback) {
      _log.debug ('request session: ' + id);
      
      var client = store.getClient();
      var ObjectID = client.bson_serializer.ObjectID;
    
      var users = _model.get('user', store.getClient());
      var user = users.find({ _id: new ObjectID(id) }, function (cursor) {
      
        cursor.toArray(function (error, items) {
        
          if (items.length > 0) {
            var output = items[0];
            output.id = items[0]._id;
            
            callback(output);
          } else {
            callback(null);
          }
        
        });
      
      });
      
    }
  
  }
  
}

exports.initial = UserHandler.initial;