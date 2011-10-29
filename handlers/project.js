var log4js = require('log4js'),
    util = require('util');

var _log = log4js.getLogger('project');
    _model = require('../model/model.js').Model;
    
var ProjectHandler = {

  initial: function (now, everyone, store) {
  
    everyone.syncProjects = function (projects, callback) {
      callback = callback || function () {};
    
      var push = {};
      var models = _model.get('project', store.getClient());
      var process = function (clientProject) {
      
        models.get(clientProject, function (serverProject) {
          if (serverProject) {
            if (serverProject.updated > clientProject.updated) {
              _log.debug ('Push project: ' + serverProject.id);
              push[serverProject.id] = serverProject;
            } else {
              _log.debug ('Update project: ' + serverProject.id);
              models.edit(serverProject.id, clientProject);
            }
          } else {
            // Create project
            _log.debug ('Create project: ' + clientProject.id);
            _log.trace (clientProject);
            
            clientProject._id = clientProject.id;
            models.create(clientProject);
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
    
    everyone.syncProject = function (project, callback) {
      
    }
  
  }

}

exports.initial = ProjectHandler.initial;