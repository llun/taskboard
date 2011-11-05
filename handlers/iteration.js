var log4js = require('log4js'),
    step = require('step'),
    util = require('util');

var _log = log4js.getLogger('iteration');

var IterationHandler = {

  initial: function(now, everyone, store) {
  
    everyone.syncIterations = function (client, user, iterations, callback) {
      _log.debug ('Sync iterations: ' + client + ', ' + util.inspect(iterations));
      
      callback = callback || function () {};
      
      var push = {};
      var models = _model.get('iteration', store.getClient());
      
      var process = function (clientIteration) {
      
        models.get(clientIteration.id, function (serverIteration) {
          
          if (serverIteration) {
            if (serverIteration > clientIteration.updated) {
              _log.debug ('Push iteration: ' + serverIteration.id);
              push[serverIteration.id] = serverIteration;
            } else {
              _log.debug ('Update iteration: ' + serverIteration.id);
              models.edit(serverIteration.id, clientIteration);
            }
          } else {
            // Create iteration
            _log.debug ('Create iteration: ' + clientIteration.id);
            _log.trace (clientIteration);
            
            clientIteration._id = clientIteration.id;
            models.create(clientIteration);
          }
          
          index++;
          if (index < iterations.length) {
            process(iterations[index]);
          } else {
            callback({ status: 'update', data: push });
          }
          
        });
      
      }
      
      var index = 0;
      if (index < iterations.length) {
        process(iterations[index]);
      } else {
        callback({ status: 'keep' });
      }
      
    }
    
    everyone.syncIteration = function (client, clientIteration) {
    
      _log.debug ('Sync iteration: ' + client + ', ' + util.inspect(clientIteration));
      
      var models = _model.get('iteration', store.getClient());
      models.get(clientIteration.id, function (serverIteration) {
          
        if (serverIteration) {
          if (serverIteration.updated > clientIteration.updated ||
              serverIteration.modified > clientIteration.modified) {
            _log.debug ('Push iteration: ' + serverIteration.id);
            push[serverIteration.id] = serverIteration;
          } else {
            _log.debug ('Update iteration: ' + serverIteration.id);
            models.edit(serverIteration.id, clientIteration);
            
            var iterationGroup = now.getGroup(serverIteration.id);
            var iterationNow = iterationGroup.now;
            iterationNow.clientUpdateIteration(client, clientIteration);
          }
        } else {
          // Create iteration
          _log.debug ('Create iteration: ' + clientIteration.id);
          _log.trace (clientIteration);
          
          clientIteration._id = clientIteration.id;
          models.create(clientIteration);
          
          var userGroup = now.getGroup(clientProject.owner);
          var userNow = userGroup.now;
          userNow.clientCreateProject(client, clientProject);
          
          var userGroup = now.getGroup(clientIteration.owner);
          var userNow = iterationGroup.now;
          userNow.clientCreateProject(client, clientIteration);
        }
                
      });
    
    
    }
    
  }
  
}

exports.initial = IterationHandler.initial;