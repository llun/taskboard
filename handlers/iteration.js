var log4js = require('log4js'),
    step = require('step'),
    util = require('util');

var _log = log4js.getLogger('iteration'),
    _model = require('../model/model.js').Model;

var IterationHandler = {

  initial: function(now, everyone, store) {
  
    everyone.syncIterations = function (client, user, clientIterations, callback) {
      _log.debug ('Sync iterations: ' + client + ', ' + util.inspect(clientIterations));
      
      callback = callback || function () {};
      
      var models = _model.get('iteration', store.getClient());
      step(
        function() {
          models.find({ owner: user }, this);
        },
        function(serverIterations) {
        
          var pushList = [];
          var createList = [];
          
          // Prepare result and send it via callback
          var clientOnlyList = {};
          
          // Prepare result and create on server
          var serverOnlyList = {};
          
          // Prepare result live on both side.
          var bothList = {};
          
          for (var key in clientIterations) {
            var clientIteration = clientIterations[key];
            clientOnlyList[clientIteration.id] = clientIteration;
          }
          
          for (var key in serverIterations) {
            var serverIteration = serverIterations[key];
            serverOnlyList[serverIteration.id] = serverIteration;
          }
          
          // Find both side result
          for (var key in clientIterations) {
            var clientIteration = clientIterations[key];
            if (serverOnlyList[clientIteration.id]) {
              bothList[clientIteration.id] = { client: clientIteration,
                                               server: serverOnlyList[clientIteration.id] };
              
              delete serverOnlyList[clientIteration.id];
            }
          }
          
          for (var key in serverIterations) {
            var serverIteration = serverIterations[key];
            if (clientOnlyList[serverIteration.id]) {
              bothList[serverIteration.id] = { client: clientOnlyList[serverIteration.id],
                                               server: serverIteration };
              
              delete clientOnlyList[serverIteration.id];
            }
          }
          
          
          // Add iteration to push list from serverOnlyList
          for (var key in serverOnlyList) {
            var serverIteration = serverOnlyList[key];
            pushList.push(serverIteration);
          }
          
          // Create iteration from clientOnlyList
          for (var key in clientOnlyList) {
            var clientIteration = clientOnlyList[key];
            
            _log.debug ('Create iteration: ' + clientIteration.id);
            _log.trace (clientIteration);
            
            clientIteration._id = clientIteration.id;
            models.create(clientIteration);
            
            var userGroup = now.getGroup(clientIteration.owner);
            var userNow = userGroup.now;
            userNow.clientCreateIteration(client, clientIteration);
            
          }
        
          // Update iteration lives on both side.
          for (var key in bothList) {
            var object = bothList[key];
            
            var clientObject = object.client;
            var serverObject = object.server;
            
            if (serverObject.updated > clientObject.updated ||
                serverObject.modified > clientObject.modified) {
              _log.debug ('Push iterationt: ' + serverObject.id);
              pushList.push(serverObject);
            } else {
              _log.debug ('Update iteration: ' + clientObject.id);
              models.edit(serverObject.id, clientObject);
              
              var iterationGroup = now.getGroup(serverObject.id);
              var iterationNow = iterationGroup.now;
              iterationNow.clientUpdateIteration(client, clientObject);
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
          
          var userGroup = now.getGroup(clientIteration.owner);
          var userNow = userGroup.now;
          userNow.clientCreateProject(client, clientIteration);
        }
                
      });
    
    
    }
    
    everyone.endIteration = function (client, clientIteration) {
    }
    
  }
  
}

exports.initial = IterationHandler.initial;