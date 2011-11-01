var log4js = require('log4js'),
    util = require('util');

var _log = log4js.getLogger('project');
    _model = require('../model/model.js').Model;
    
var ProjectHandler = {

  initial: function (now, everyone, store) {
  
    everyone.syncProjects = function (client, projects, callback) {
      _log.debug ('Sync projects: ' + client + ', ' + util.inspect(projects));
    
      callback = callback || function () {};
    
      var push = {};
      var models = _model.get('project', store.getClient());
      var process = function (clientProject) {
      
        models.get(clientProject.id, function (serverProject) {
          if (serverProject) {
            if (serverProject.updated > clientProject.updated) {
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
          
          index++;
          if (index < projects.length) {
            process(projects[index]);
          } else {
            callback({ status: 'update', data: push });
          }
        });
      
      }
      
      var index = 0;
      if (index < projects.length) {
        process(projects[index]);
      } else {
        callback({ status: 'keep' });
      } 

    }
      
  }

}

exports.initial = ProjectHandler.initial;