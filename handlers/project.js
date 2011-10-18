var log4js = require('log4js'),
    util = require('util');

var _log = log4js.getLogger('project');
    _model = require('../model/model.js').Model;
    
var ProjectHandler = {

  initial: function (now, everyone, store) {
  
    everyone.syncProjects = function (projects, callback) {
      callback = callback || function () {};
    
      var models = _model.get('project', store.getClient());
      for (var index = 0; index < projects.length; index++) {
        var project = projects[index];
        models.exists(project.id, function (error, output) {

          if (!output) {
            // Save to models
            _log.debug ('Create project: ' + project.id);
            project._id = project.id;
            models.create(project);
          } else {
            // Check updated number
            _log.debug ('Project exists: ' + project.id);
            models.find({ _id: project.id }, function (cursor) {
              cursor.toArray(function (error, items) {
              
                if (!error) {
                  if (items.length > 0) {
                  
                    _log.debug ('Found: ' + util.inspect(items[0]));
                  
                    var found = items[0];
                    if (found.updated < project.updated) {
                      models.edit(project.id, project, function (error) {
                        callback({ status: 'keep' });
                      });
                    } 
                     
                  } 
                } 
              
              });
            });
          }
          
        });
        
      }
      
      callback({ status: 'done' });

    }
  
  }

}

exports.initial = ProjectHandler.initial;