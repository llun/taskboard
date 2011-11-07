var log4js = require('log4js'),
    step = require('step'),
    util = require('util');

var _log = log4js.getLogger('task'),
    _model = require('../model/model.js').Model;

var TaskHandler = {
  
  initial: function(now, everyone, store) {
    
    everyone.syncTask = function(iteration, from, task) {
      _log.debug('Iteration: ' + iteration);
      _log.debug('Task: ' + util.inspect(task));
      
      var group = now.getGroup(iteration).now;
      
      var _task = model.get('task', store.getClient());
      if (task.removed) {
        // Remove task
        _task.remove(task.id);
        group.clientRemoveTask(from, task.id);
        
        _log.debug ('sync(remove): (' + from + ') ' + util.inspect(task));
      } else if (!task.sync) {
        // Create task
        task.sync = true;
        
        _task.create(task);
        group.clientCreateTask(from, task);
        
        _log.debug ('sync(create): (' + from + ') ' + util.inspect(task));
      } else {
        // Update task
        _task.edit(task.id, task);
        group.clientUpdateTask(from, task);
        
        _log.debug ('sync(update): (' + from + ') ' + util.inspect(task));
      }
    }
    
    everyone.syncTasks = function (client, iteration, clientTasks, callback) {
          _log.debug ('Sync tasks: ' + client + ', ' + util.inspect(clientTasks));
        
          callback = callback || function () {};
        
          var models = _model.get('task', store.getClient());
          step(
            function() {
              models.find({ iteration: iteration }, this);
            },
            function(serverTasks) {
            
              var pushList = [];
              var createList = [];
              
              // Prepare result and send it via callback
              var clientOnlyList = {};
              
              // Prepare result and create on server
              var serverOnlyList = {};
              
              // Prepare result live on both side.
              var bothList = {};
              
              for (var key in clientTasks) {
                var clientTask = clientTasks[key];
                clientOnlyList[clientTask.id] = clientTask;
              }
              
              for (var key in serverTasks) {
                var serverTask = serverTasks[key];
                serverOnlyList[serverTask.id] = serverTask;
              }
              
              // Find both side result
              for (var key in clientTasks) {
                var clientTask = clientTasks[key];
                if (serverOnlyList[clientTask.id]) {
                  bothList[clientTask.id] = { client: clientTask,
                                                 server: serverOnlyList[clientTask.id] };
                  
                  delete serverOnlyList[clientTask.id];
                }
              }
              
              for (var key in serverTasks) {
                var serverTask = serverTasks[key];
                if (clientOnlyList[serverTask.id]) {
                  bothList[serverTask.id] = { client: clientOnlyList[serverTask.id],
                                                 server: serverTask };
                  
                  delete clientOnlyList[serverTask.id];
                }
              }
              
              
              // Add project to push list from serverOnlyList
              for (var key in serverOnlyList) {
                var serverTask = serverOnlyList[key];
                pushList.push(serverTask);
              }
              
              // Create project from clientOnlyList
              for (var key in clientOnlyList) {
                var clientTask = clientOnlyList[key];
                
                _log.debug ('Create task: ' + clientTask.id);
                _log.trace (clientTask);
                
                clientTask._id = clientTask.id;
                models.create(clientTask);
                
                var iterationGroup = now.getGroup(clientIteration.id);
                var iterationNow = iterationGroup.now;
                iterationNow.clientCreateTask(client, clientTask);
                
              }
            
              // Update project lives on both side.
              for (var key in bothList) {
                var object = bothList[key];
                
                var clientObject = object.client;
                var serverObject = object.server;
                
                if (serverObject.updated > clientObject.updated ||
                    serverObject.modified > clientObject.modified) {
                  _log.debug ('Push task: ' + serverObject.id);
                  pushList.push(serverObject);
                } else {
                  _log.debug ('Update task: ' + clientObject.id);
                  models.edit(serverObject.id, clientObject);
                  
                  var iterationGroup = now.getGroup(serverObject.iteration);
                  var iterationNow = iterationGroup.now;
                  iterationNow.clientUpdateTask(client, clientObject);
                }
                
              }
              
              if (pushList.length > 0) {
                callback({ status: 'update', data: pushList});
              } else {
                callback({ status: 'keep' });
              }
            
            }
          );
    
        }
    
  }
  
}

exports.TaskHandler = TaskHandler;
exports.initial = TaskHandler.initial;