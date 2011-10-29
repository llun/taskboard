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

      users.get(new ObjectID(id), function (user) {
      
        if (user) {
        
          user.id = user._id;
        
          // Send user and project back to client
          var projects = _model.get('project', store.getClient());
          projects.find({ owner: id }, function (items) {
            callback ({ user: user, projects: items });
          });
        
        } else {
        
          callback ({ error: 'notfound' });
        
        }
      
      });
            
    }
    
    everyone.syncUser = function (user, callback) {
      _log.debug ('Sync user');
    
      callback = callback || function () {};
    
      var client = store.getClient();
      var ObjectID = client.bson_serializer.ObjectID;
    
      var users = _model.get('user', store.getClient());
      users.get(new ObjectID(user.id), function (item) {
        if (item) {
        
          var serverUser = item;
          var clientUser = user;
          
          _log.debug ('Client user: ' + util.inspect(clientUser));
          _log.debug ('Server user: ' + util.inspect(serverUser));
          
          if (serverUser.updated > clientUser.updated) {
            _log.debug ('Update client user.');
            callback ({ status: 'update', data: serverUser });
          } else {
            _log.debug ('Update server user.');
            delete clientUser._id;
            
            users.edit(new ObjectID(clientUser.id), clientUser,
              function(error) {
                callback ({ status: 'keep' });
              
                var userGroup = now.getGroup(user.id);
                var userNow = userGroup.now;
                userNow.clientUpdateUser(clientUser);
              });
            
          }
        
        } else {
        
          _log.debug ('user not found: ' + util.inspect(user));
          callback({ error: 'notfound' });
        
        }
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