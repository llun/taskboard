var log4js = require('log4js'),
    util = require('util');

var _log = log4js.getLogger('user');
    _model = require('../model/model.js').Model;

var UserHandler = {

  initial: function(now, everyone, store) {
  
    everyone.user = function (id, callback) {
      _log.debug ('request session: ' + id);
      
      var client = store.getClient();
      var ObjectID = client.bson_serializer.ObjectID;
    
      var users = _model.get('user', store.getClient());
      users.find({ _id: new ObjectID(id) }, function (cursor) {
      
        cursor.toArray(function (error, items) {
        
          if (items.length > 0) {
            var user = items[0];
            user.id = items[0]._id;
            
            var projects = _model.get('project', store.getClient());
            
            
            callback(user);
          } else {
            callback(null);
          }
        
        });
      
      });
      
    }
    
    everyone.syncUser = function (user, callback) {
      callback = callback || function () {};
    
      var client = store.getClient();
      var ObjectID = client.bson_serializer.ObjectID;
    
      var users = _model.get('user', store.getClient());
      users.find({ _id: new ObjectID(user.id) }, function (cursor) {
      
        cursor.toArray(function (error, items) {
        
          if (items.length > 0) {
          
            var found = items[0];
          
            _log.debug ('client user: ' + util.inspect(user));
            _log.debug ('server user: ' + util.inspect(found));
            
            if (found.updated > user.updated) {
              // Force user use all data from server
              callback({ status: 'update', data: found });
            } else {
              _log.debug ('user: ' + user.id + ' ' + util.inspect(user));
            
              // Update user on server
              users.edit(new ObjectID(user.id), user, function (error) {
                callback({ status: 'keep' });
                
                var userGroup = now.getGroup(user.id);
                var userNow = userGroup.now;
                userNow.clientUpdateUser(user);
              });
            }
            
          
          } else {
            _log.debug ('user not found: ' + util.inspect(user));
          
            callback({ error: 'notfound' });
          }
        
        });
      
      });
    
    }
  
    everyone.joinGroups = function (client, groups, callback) {
    
      groups.forEach(function (group) {
        var nowGroup = now.getGroup(group);
        nowGroup.addUser(client);
        
        _log.debug(client + ' joined ' + group);
      });
      
      if (callback) {
        callback();
      }
    
    }
  
  }
  
}

exports.initial = UserHandler.initial;