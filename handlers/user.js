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
                if (userNow.updateUser) {
                  userNow.updateUser(clientUser);
                }
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
     * Fetch all share projects and iteration for current user.
     *
     * @param {String} user, user id
     */
    everyone.shares = function (user, callback) {
    
      var client = store.getClient();
      var ObjectID = client.bson_serializer.ObjectID;
    
      var users = _model.get('user', client);
      var projects = _model.get('project', client);
      var iterations = _model.get('iteration', client);
      var tasks = _model.get('task', client);
      var shares = _model.get('share', client);
      
      var output = {};
    
      step(
        function init() {
          users.get(new ObjectID(user), this);
        },
        function getUser(item) {
          if (item) {
            shares.find({ owner: item.username }, this);
          }
        },
        function listShares(items) {
        
          var shareProjects = [];
          var count = 0;
        
          for (var index in items) {
            shareProjects.push({ id: items[index].project });
          }
          
          if (shareProjects.length > 0) {
            projects.find({ $or: shareProjects }, this);
          }
        
        },
        function listIterations(items) {
        
          output.projects = items;
          var shareIterations = [];
        
          for (var index in items) {
            var project = items[index];
            for (var key in project.iterations) {
              shareIterations.push({ id: project.iterations[key] });
            }
          }
          
          iterations.find({ $or: shareIterations }, this);
        
        },
        function listTasks(items) {
          
          output.iterations = items;
          var shareIterations = [];
          
          for (var index in items) {
            var iteration = items[index];
            shareIterations.push({ owner: iteration.id });
          }
          
          tasks.find({ $or: shareIterations }, this);
          
        },
        function aggregate(items) {
          output.tasks = items;
          callback(output);
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
    
    everyone.kick = function (project, user, callback) {
      
      var client = store.getClient();
      var ObjectID = client.bson_serializer.ObjectID;
      
      var local = {};
      
      var shares = _model.get('share', store.getClient());
      var projects = _model.get('project', client);
      var users = _model.get('user', client);
      
      step(
        function init() {
          users.find({ username: user }, this);
        },
        function getProject(items) {
          if (items.length > 0) {
            local.user = items[0];
            projects.get(project, this);
          }
        },
        function removeMember(item) {
          if (item) {
            local.project = item;
            
            var target = -1;
            var members = item.members;
            for (var index in members) {
              var member = members[index];
              if (member.username == user) {
                target = index;
                break;
              }
            }
            
            if (target >= 0) {
              var member = members[target];
              local.action = member.status;
              
              var front = members.slice(0, target);
              var tail = members.slice(target + 1, members.length);
              
              members = front.concat(tail);
              item.members = members;
              
              item.updated++;
              item.modified = new Date().getTime();
              
              projects.edit(item.id, item, this);
            }
            
          }
          
        },
        function getShare(error) {
          if (!error) {
            if (local.action == 'accepted') {
              shares.find({ owner: user, project: project }, this);
            } else {
              var invites = _model.get('invite', client);
              invites.find({ to: user, target: project }, function (items) {
                if (items.length > 0) {
                  invites.remove(items[0]._id);
                  
                  var userGroup = now.getGroup(local.user.id);
                  var userNow = userGroup.now;
                  userNow.notifyUser({ type: 'kick',
                                       user: local.user.username,
                                       project: local.project.name,
                                       target: local.project.id });
                }
              });
              
              callback({ status: 'removed', user: user, project: local.project });
            }
          } else {
            _log.debug(error);
          }
        },
        function removeShare(items) {
          if (items.length > 0) {
            shares.remove(items[0]._id, this);
          } else {
            console.log ('dont found share');
          }
        },
        function notifyUser(error) {
          if (!error) {
            var projectGroup = now.getGroup(local.project.id);
            var projectNow = projectGroup.now;
            projectNow.clientUpdate('server', local.project.type, local.project);
            
            var userGroup = now.getGroup(local.user.id);
            var userNow = userGroup.now;
            userNow.notifyUser({ type: 'kick',
                                 user: local.user.username,
                                 project: local.project.name,
                                 target: local.project.id });
                                 
            userNow.clientKick(local.project.id);
            
            callback({ status: 'removed', user: user, project: local.project });
                                 
          }
        });
      
    }
    
    everyone.accept = function (invite, callback) {
    
      var client = store.getClient();
      var ObjectID = client.bson_serializer.ObjectID;
    
      var projects = _model.get('project', client);
      var invites = _model.get('invite', client);
      
      var local = {};
    
      step(
        function init() {
          projects.get(invite.target, this);
        },
        function gotProject(item) {
        
          if (item) {
            
            var members = item.members;
            for (var index in members) {
              var member = members[index];
              if (member.username == invite.to) {
                member.status = 'accepted';
                item.updated++;
                item.modified = new Date().getTime();
                
                projects.edit(item.id, item);
                var projectGroup = now.getGroup(item.id);
                var projectNow = projectGroup.now;
                projectNow.clientUpdate('server', item.type, item);
                
                local.project = item;
                
                break;
              }
            }
            
            invites.remove(new ObjectID(invite._id), this);
            
          }
        
        },
        function removeInvite(error) {
        
          var shares = _model.get('share', store.getClient());
          shares.create({ owner: invite.to, project: invite.target }, this);
          
        },
        function createShare(error) {
          
          if (!error) {
            var iterations = _model.get('iteration', store.getClient());
            
            var project = local.project;
            var shareIterations = [];
            
            for (var index in project.iterations) {
              var iteration = project.iterations[index];
              shareIterations.push({ id: iteration });
            }

            iterations.find({ $or: shareIterations }, this);
          }
          
        },
        function fetchIterations(items) {
        
          var shareIterations = [];
          for (var index in items) {
            var iteration = items[index];
            shareIterations.push({ owner: iteration.id });
          }
          
          local.iterations = items;
          
          var tasks = _model.get('task', store.getClient());
          tasks.find({ $or: shareIterations }, this);
        
        },
        function fetchTasks(items) {
          
          local.tasks = items;
          callback({ status: 'ok', data: local, input: invite });
          
        });
    
    }
    
    everyone.reject = function (invite, callback) {
    
      var client = store.getClient();
      var ObjectID = client.bson_serializer.ObjectID;
    
      var projects = _model.get('project', client);
      var invites = _model.get('invite', client);
    
      step(
        function init() {
          projects.get(invite.target, this);
        },
        function gotProject(item) {
        
          if (item) {
            
            var members = item.members;
            for (var index in members) {
              var member = members[index];
              if (member.username == invite.to) {
              
                var front = members.slice(0, index);
                var tail = members.slice(index + 1);
                
                item.members = front.concat(tail);
                item.updated++;
                item.modified = new Date().getTime();
                
                projects.edit(item.id, item);
                var projectGroup = now.getGroup(item.id);
                var projectNow = projectGroup.now;
                projectNow.clientUpdate('server', item.type, item);
                
                break;
              }
            }
            
            invites.remove(new ObjectID(invite._id), this);
            
          }
        
        },
        function removeInvite(error) {
          if (error) {
            callback({ error: error });
          } else {
            callback({ status: 'ok', input: invite });
          }
        });
    
    }
    
  }
  
}

exports.initial = UserHandler.initial;