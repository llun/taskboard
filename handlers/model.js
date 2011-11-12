var log4js = require('log4js'),
    step = require('step'),
    util = require('util');

var _log = log4js.getLogger('sync'),
    _models = require('../model/model.js').Model;


var SyncHandler = {
  
  initial: function (now, everyone, store) {
    
    /**
     * Batch sync models
     *
     * @param {String} client, browser tab/window id
     * @param {String} type, model type
     * @param {Object} parent, key-value map for search model group
     * @param {Array(Object)} clientModels, group of object want to sync
     * @param {Function} callback
     */
    everyone.syncModels = function (client, type, parent, clientModels, callback) {
      _log.debug ('Sync: ' + '(' + type + ') ' + util.inspect(parent) +
                  ' ' + client + ', ' + util.inspect(clientModels));

      callback = callback || function() {};

      var models = _models.get(type, store.getClient());
      step(
        function () {
          models.find(parent, this);
        },
        function(serverModels) {
          
          var pushList = [];
          var createList = [];

          // Prepare result and send it via callback
          var clientOnlyList = {};
          
          // Prepare result and create on server
          var serverOnlyList = {};

          // Prepare delete list for remove object from client
          var deleteList = {};
          
          // Prepare result live on both side.
          var bothList = {};
          
          for (var key in clientModels) {
            var clientModel = clientModels[key];
            clientOnlyList[clientModel.id] = clientModel;
          }
          
          for (var key in serverModels) {
            var serverModel = serverModels[key];
            serverOnlyList[serverModel.id] = serverModel;
          }
          
          // Find both side result
          for (var key in clientModels) {
            var clientModel = clientModels[key];
            if (serverOnlyList[clientModel.id]) {
              bothList[clientModel.id] = { client: clientModel,
                                           server: serverOnlyList[clientModel.id] };
              
              delete serverOnlyList[clientModel.id];
            }
          }
          
          for (var key in serverModels) {
            var serverModel = serverModels[key];
            if (clientOnlyList[serverModel.id]) {
              bothList[serverModel.id] = { client: clientOnlyList[serverModel.id],
                                           server: serverModel };
              
              delete clientOnlyList[serverModel.id];
            }
          }
          
          
          // Add model to push list from serverOnlyList
          for (var key in serverOnlyList) {
            var serverModel = serverOnlyList[key];
            pushList.push(serverModel);
          }
          
          // Create model from clientOnlyList
          for (var key in clientOnlyList) {
            var clientModel = clientOnlyList[key];
            
            _log.debug ('Create: (' + clientModel.type + ') ' + clientModel.id);
            _log.trace (clientModel);
            
            models.create(clientModel);
            
            var parentGroup = now.getGroup(parent.owner);
            var parentNow = parentGroup.now;
            parentNow.clientCreate(client, type, clientModel);
            
          }
        
          // Update project lives on both side.
          for (var key in bothList) {
            var object = bothList[key];
            
            var clientObject = object.client;
            var serverObject = object.server;
            
            if (serverObject.updated > clientObject.updated ||
                serverObject.modified > clientObject.modified) {
              _log.debug ('Push: (' + serverObject.type + ') ' + serverObject.id);
              pushList.push(serverObject);
            } else {
              _log.debug ('Update: (' + clientObject.type + ') ' + clientObject.id);
              models.edit(serverObject.id, clientObject);
              
              // Special case
              var modelGroup = null;
              var modelNow = null;
              if (serverObject.type == 'task') {
                modelGroup = now.getGroup(serverObject.owner);
              } else {
                modelGroup = now.getGroup(serverObject.id);
              }

              modelNow = modelGroup.now;
              modelNow.clientUpdate(client, type, clientObject);
            }
            
          }
          
          if (pushList.length > 0) {
            callback({ status: 'update', owner: parent.owner, data: pushList});
          } else {
            callback({ status: 'keep' });
          }

        });
    }

    /**
     * Sync single model
     *
     * @param {String} client, browser tab/window id
     * @param {Object} clientModel, object want to sync
     */
    everyone.syncModel = function (client, clientModel) {
      _log.debug ('Sync: ' + client + ', ' + util.inspect(clientModel));

      var models = _models.get(clientModel.type, store.getClient());
      models.get(clientModel.id, function (serverModel) {
        if (serverModel) {
          if (serverModel.updated > clientModel.updated ||
              serverModel.modified > clientModel.modified) {
            _log.debug ('Push: ' + serverModel.id);
            push[serverModel.id] = serverModel;
          } else {
            _log.debug ('Update: ' + serverModel.id);
            models.edit(serverModel.id, clientModel);
            
            var modelGroup = null;
            if (serverModel.type == 'task') {
              modelGroup = now.getGroup(serverModel.owner);
            } else {
              modelGroup = now.getGroup(serverModel.id);
            }

            var modelNow = modelGroup.now;
            modelNow.clientUpdate(client, serverModel.type, clientModel);
          }
        } else {
          _log.debug ('Create: ' + clientModel.id);
          _log.trace (clientModel);
          
          models.create(clientModel);
          
          var modelGroup = null;
          if (clientModel.type == 'task') {
            _log.debug ('Create task on group: ' + clientModel.owner);
            modelGroup = now.getGroup(clientModel.owner);
          } else {
            modelGroup = now.getGroup(clientModel.id);
          }

          var modelNow = modelGroup.now;
          modelNow.clientCreate(client, clientModel.type, clientModel);
        }
      });
    }  
  }

}

exports.initial = SyncHandler.initial;