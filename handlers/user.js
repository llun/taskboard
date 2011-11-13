var log4js = require('log4js'),
    step = require('step'),
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
      var output = {};

      step(
        function () {
          users.get(new ObjectID(id), this);
        },
        function (user) {
          if (user) {
            user.id = user._id;
            
            output.user = user;
            
            // Load projects
            var projects = _model.get('project', store.getClient());
            projects.find({ owner: id }, this);
          } else {
            callback ({ error: 'notfound' });
          }
        },
        function (projects) {
          output.projects = projects;
          
          var iterations = _model.get('iteration', store.getClient());
          iterations.find({ owner: id }, this);
        },
        function (iterations) {
          output.iterations = iterations;
          output.tasks = [];
          
          _log.trace ('Total iteration: ' + iterations.length);
          if (iterations.length > 0) {
            var count = 0;
            var tasks = _model.get('task', store.getClient());
            for (var key in iterations) {
              tasks.find({ owner: iterations[key].id }, function (tasks) {
              
                for (var index in tasks) {
                  var task = tasks[index];
                  if (!task.delete) {
                    output.tasks.push(task);
                  }
                }
              
                count++;
                if (count == iterations.length) {
                  _log.trace(output);
                  callback(output);
                }
              
              });
            }
          
          } else {

            _log.trace(output);
            callback(output);
          
          }
          
          
        }
      );

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
          
          if (serverUser.updated > clientUser.updated ||
              serverUser.modified > clientUser.modified) {
            _log.debug ('Update client user.');
            callback ({ status: 'update', data: serverUser });
          } else {
            _log.debug ('Update server user.');
            
            users.edit(new ObjectID(clientUser.id), clientUser,
              function(error) {
                callback ({ status: 'keep' });
              
                var userGroup = now.getGroup(serverUser.id);
                var userNow = userGroup.now;
                userNow.updateUser(clientUser);
              });
            
          }
          
          var invites = _model.get('invite', store.getClient());
          invites.find({target: serverUser.username}, function (items) {
            var userGroup = now.getGroup(serverUser.id);
            var userNow = userGroup.now;
            userNow.notifyUser(items);
          });
        
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
  
    /**
     * Invite someone to join project.
     *
     * @param {String} from username
     * @param {String} to username
     * @param {String} project id
     * @param {Function} callback
     */
    everyone.invite = function (from, to, project, callback) {
    
      var projects = _model.get('project', store.getClient());
      projects.get(project, function (item) {
        if (item) {
        
          var invites = _model.get('invite', store.getClient());
          var invite = { type: 'invite',
                         from: user,
                         to: to,
                         project: item.name,
                         target: item.id };
                         
           
          invites.find({to: to, target: item.id}, function (item) {
          
            if (items.length == 0) {
              
              invites.create(invite, function (error, object) {
                if (!error) {
                
                  var users = _model.get('user', store.getClient());
                  users.find({username: to}, function(items) {
                  
                    if (items.length > 0) {
                      var user = items[0];
                      
                      var userGroup = now.getGroup(user.id);
                      var userNow = userGroup.now;
                      userNow.notifyUser([invite]);
                      
                      callback({ status: 'invited', who: to });
                    }
                  
                  });
                
                }
              });
              
            }
            
          });
        }
      });
      
    }
    
    everyone.accept = function (project) {
    }
    
    everyone.invites = function (user) {
    }
  
  }
  
}

exports.initial = UserHandler.initial;