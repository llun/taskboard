var Task = require('../model/task.js').TaskModel,
    util = require('util');
    
var _log = console.logger('task');

var TaskHandler = {
  
  /**
   * Sync server and client list
   */
  syncAll: function (server, client) {
    var output = { server: { add: [], remove: [], update: [] },
                   client: { add: [], remove: [], update: [] } };
    
    // Generate server/client task set
    var _server = {};
    var _client = {};
    
    for (var index = 0; index < server.length; index++) {
      _server[server[index].id] = server[index];
    }
    
    for (var index = 0; index < client.length; index++) {
      _client[client[index].id] = client[index];
    }
    
    // Process server list
    for (var index = 0; index < client.length; index++) {
      if (!client[index].sync && !client[index].removed) {
        output.server.add.push(client[index]);
      } else if (client[index].removed) {
        output.server.remove.push(client[index]);
      } else if (_server[client[index].id]) {
        
        var onClient = client[index];
        var onServer = _server[client[index].id];
        
        if (onClient.updated > onServer.updated) {
          output.server.update.push(onClient);
        }
        
      } else if (!_server[client[index].id]) {
        output.client.remove.push(client[index]);
      }
    }
    
    // Process client list
    for (var index = 0; index < server.length; index++) {
      if (!_client[server[index].id]) {
        output.client.add.push(server[index]);
      } else if (_client[server[index].id]) {
        
        var onClient = _client[server[index].id];
        var onServer = server[index];
        
        if (onServer.updated > onClient.updated) {
          output.client.update.push(onServer);
        }
        
      }
    }
    
    return output;
  },
  
  everyone: function(now, store) {
    
    now.sync = function(from, task) {
      var _task = Task.get(store.getClient());
      if (task.removed) {
        // Remove task
        _task.remove(task.id);
        now.remove(from, task.id);
        
        _log.debug ('sync(remove): (' + from + ') ' + util.inspect(task));
      } else if (!task.sync) {
        // Create task
        task.sync = true;
        
        _task.create(task);
        now.create(from, task);
        
        _log.debug ('sync(create): (' + from + ') ' + util.inspect(task));
      } else {
        // Update task
        _task.edit(task.id, task);
        now.update(from, task);
        
        _log.debug ('sync(update): (' + from + ') ' + util.inspect(task));
      }
    }
    
    now.syncAll = function (tasks, removed) {
      _log.debug ('sync all tasks');
      
      var _task = Task.get(store.getClient());
      _task.count(function (error, count) {
        
        _task.list(0, count, function (error, data) {
          
          var master = 'master';
          
          var server = data;
          var client = tasks;
          
          _log.debug ('server: ' + util.inspect(server));
          _log.debug ('client: ' + util.inspect(client));
          
          for (var index = 0; index < removed.length; index++ ) {
            client.push ({ id: removed[index], removed: true });
          }
          
          var object = TaskHandler.syncAll(server, client);
          var _server = object.server;
          var _client = object.client;
          
          _log.debug ('after sync(server): ' + util.inspect(_server));
          _log.debug ('after sync(client): ' + util.inspect(_client));
          
          // Add to server
          for (var index = 0; index < _server.add.length; index++) {
            _server.add[index].sync = true;
            
            _task.create(_server.add[index]);
            
            _log.debug ('sync(create): (' + master + ') ' + util.inspect(_server.add[index]));
            now.create(master, _server.add[index]);
          }
          
          // Remove from server
          for (var index = 0; index < _server.remove.length; index++) {
            _task.remove(_server.remove[index].id);
            
            _log.debug ('sync(remove): (' + master + ') ' + util.inspect(_server.remove[index]));
            now.remove(master, _server.remove[index].id);
          }
          
          // Update on server
          for (var index = 0; index < _server.update.length; index++) {
            _task.edit(_server.update[index].id, _server.update[index]);
            
            _log.debug ('sync(update): (' + master + ') ' + util.inspect(_server.update[index]));
            now.update(master, _server.update[index]);
          }
          
          // Add to client
          for (var index = 0; index < _client.add.length; index++) {
            _log.debug ('sync(create): (' + master + ') ' + util.inspect(_client.add[index]));
            now.create(master, _client.add[index]);
          }
          
          // Remove from client
          for (var index = 0; index < _client.remove.length; index++) {
            _log.debug ('sync(remove): (' + master + ') ' + util.inspect(_client.remove[index]));
            now.remove(master, _client.remove[index].id);
          }
          
          // Update on client
          for (var index = 0; index < _client.update.length; index++) {
            _log.debug ('sync(update): (' + master + ') ' + util.inspect(_client.add[index]));
            now.update(master, _client.update[index]);
          }
          
        });
        
      });
      
    }
    
  }
  
}

exports.TaskHandler = TaskHandler;
exports.everyone = TaskHandler.everyone;