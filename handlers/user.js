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
     * Fetch notifications event for user
     *
     * @param {String} user, user id
     * @param {Function} callback
     */
    everyone.fetchNotifications = function (user, callback) {
    
      var _callback = callback || function () {};
      var notifications = [];
    
      var client = store.getClient();
      var ObjectID = client.bson_serializer.ObjectID;
    
      var users = _model.get('user', client);
      var invites = _model.get('invite', client);
      
      step(
        function () {
          users.get(new ObjectID(user), this);
        },
        function (item) {
          if (item) {
            _log.trace ('Fetch invite for user: ' + item.username);
            invites.find({ to: item.username }, this);
          } else {
            _callback({ error: 'notfound' });
          }
        },
        function (items) {
          _log.trace (items);
          notifications = notifications.concat(items);
          _callback({ status: 'ok', data: notifications });
        });
      
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
    
      var local = {};
      
      var client = store.getClient();
      var ObjectID = client.bson_serializer.ObjectID;
      
      var projects = _model.get('project', client);
      var users = _model.get('user', client);
      var invites = _model.get('invite', client);
      
      step(
        function () {
          projects.get(project, this);
        },
        function (projectInstance) {
          _log.trace ('Found project: ' + util.inspect(projectInstance));
          if (projectInstance) {
            var invite = { type: 'invite',
                           from: from,
                           to: to,
                           project: projectInstance.name,
                           target: projectInstance.id };
          
          
            local.project = projectInstance;
            local.invite = invite;
            
            users.get(new ObjectID(projectInstance.owner), this);
          }
        },
        function (user) {
          _log.trace ('Found user: ' + user);
          if (user) {
            local.user = user;
            if (user.username != to) {
              invites.find({to: to, target: local.project.id}, this);
            }
          }
        },
        function (items) {
          _log.trace (items);
          if (items.length == 0) {
            invites.create(local.invite, this);
          }
        },
        function (error, object) {
          if (!error) {
            users.find({username: to}, this);
          }
        },
        function (items) {
          if (items.length > 0) {
            var user = items[0];
            
            var userGroup = now.getGroup(user.id);
            var userNow = userGroup.now;
            userNow.notifyUser(local.invite);
            
            callback({ status: 'invited', who: to });
          }
        }
      );
          
    }
    
    everyone.accept = function (project) {
    }
    
    everyone.invites = function (user) {
    }
  
  }
  
}

exports.initial = UserHandler.initial;