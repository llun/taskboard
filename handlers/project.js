var log4js = require('log4js'),
    util = require('util');

var _log = log4js.getLogger('project');
    _model = require('../model/model.js').Model;
    
var ProjectHandler = {

  initial: function (now, everyone, store) {
  
    everyone.syncProjects = function (projects, callback) {
    
      var models = _model.get('project', store.getClient());
    
      for (var index = 0; index < projects.length; index++) {
        var project = projects[index];
        models.exists(project.id, function (error, output) {
          if (!output) {
            // Save to models
            models.create(project, function (error, output) {
            });
          } else {
            // Check updated number
          }
        });
      }
    
    }
  
  }

}

exports.initial = ProjectHandler.initial;