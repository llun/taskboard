var log4js = require('log4js'),
    step = require('step'),
    util = require('util');

var _log = log4js.getLogger('project');
    _model = require('../model/model.js').Model;
    
var ProjectHandler = {

  initial: function (now, everyone, store) {
  
    everyone.syncProjects = function (client, user, clientProjects, callback) {
      _log.debug ('Sync projects: ' + client + ', ' + util.inspect(clientProjects));
    
      callback = callback || function () {};
    
      var models = _model.get('project', store.getClient());
      step(
        function() {
          models.find({ owner: user }, this);
        },
        function(serverProjects) {
        
          var pushList = [];
          var createList = [];
          
          // Prepare result and send it via callback
          var clientOnlyList = {};
          
          // Prepare result and create on server
          var serverOnlyList = {};
          
          // Prepare result live on both side.
          var bothList = {};
          
          for (var key in clientProjects) {
            var clientProject = clientProjects[key];
            clientOnlyList[clientProject.id] = clientProject;
          }
          
          for (var key in serverProjects) {
            var serverProject = serverProjects[key];
            serverOnlyList[serverProject.id] = serverProject;
          }
          
          // Find both side result
          for (var key in clientProjects) {
            var clientProject = clientProjects[key];
            if (serverOnlyList[clientProject.id]) {
              bothList[clientProject.id] = { client: clientProject,
                                             server: serverOnlyList[clientProject.id] };
              
              delete serverOnlyList[clientProject.id];
            }
          }
          
          for (var key in serverProjects) {
            var serverProject = serverProjects[key];
            if (clientOnlyList[serverProject.id]) {
              bothList[serverProject.id] = { client: clientOnlyList[serverProject.id],
                                             server: serverProject };
              
              delete clientOnlyList[serverProject.id];
            }
          }
          
          
          // Add project to push list from serverOnlyList
          for (var key in serverOnlyList) {
            var serverProject = serverOnlyList[key];
            pushList.push(serverProject);
          }
          
          // Create project from clientOnlyList
          for (var key in clientOnlyList) {
            var clientProject = clientOnlyList[key];
            
            _log.debug ('Create project: ' + clientProject.id);
            _log.trace (clientProject);
            
            clientProject._id = clientProject.id;
            models.create(clientProject);
            
            var userGroup = now.getGroup(clientProject.owner);
            var userNow = userGroup.now;
            userNow.clientCreateProject(client, clientProject);
            
          }
        
          // Update project lives on both side.
          for (var key in bothList) {
            var object = bothList[key];
            
            var clientObject = object.client;
            var serverObject = object.server;
            
            if (serverObject.updated > clientObject.updated ||
                serverObject.modified > clientObject.modified) {
              _log.debug ('Push project: ' + serverObject.id);
              pushList.push(serverObject);
            } else {
              _log.debug ('Update project: ' + clientObject.id);
              models.edit(serverObject.id, clientObject);
              
              var projectGroup = now.getGroup(serverObject.id);
              var projectNow = projectGroup.now;
              projectNow.clientUpdateProject(client, clientObject);
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
      
    everyone.syncProject = function (client, clientProject) {
    
      _log.debug ('Sync projects: ' + client + ', ' + util.inspect(clientProject));
      
      var models = _model.get('project', store.getClient());
      models.get(clientProject.id, function (serverProject) {
        if (serverProject) {
          if (serverProject.updated > clientProject.updated ||
              serverProject.modified > clientProject.modified) {
            _log.debug ('Push project: ' + serverProject.id);
            push[serverProject.id] = serverProject;
          } else {
            _log.debug ('Update project: ' + serverProject.id);
            models.edit(serverProject.id, clientProject);
            
            var projectGroup = now.getGroup(serverProject.id);
            var projectNow = projectGroup.now;
            projectNow.clientUpdateProject(client, clientProject);
          }
        } else {
          // Create project
          _log.debug ('Create project: ' + clientProject.id);
          _log.trace (clientProject);
          
          clientProject._id = clientProject.id;
          models.create(clientProject);
          
          var userGroup = now.getGroup(clientProject.owner);
          var userNow = userGroup.now;
          userNow.clientCreateProject(client, clientProject);
        }
      });
      
    }

  }

}

exports.initial = ProjectHandler.initial;