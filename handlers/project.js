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
      var process = function (project) {
      
        models.find ({ _id: project.id }, function (cursor) {
          cursor.toArray(function (error, items) {
            if (!error) {
              if (items.length > 0) {
                var found = items[0];
                if (found.updated > project.updated) {
                  _log.debug ('Push project: ' + project.id);
                  push[found.id] = found;
                } else {
                  _log.debug ('Update project: ' + project.id);
                  models.edit(project.id, project);
                }
              } else {
                _log.debug ('Create project: ' + project.id);
                project._id = project.id;
                models.create(project);
                callback({ status: 'keep' });
              }  
            }
            
            index++;
            if (index < projects.length) {
              process(projects[index]);
            } else {
              callback({ status: 'update', data: push });
            }
          });
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