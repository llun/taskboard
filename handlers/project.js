var log4js = require('log4js'),
    util = require('util');

var _log = log4js.getLogger('project');
    _model = require('../model/model.js').Model;
    
var ProjectHandler = {

  initial: function (now, everyone, store) {
  
    everyone.syncProject = function (project, callback) {
    }
  
  }

}

exports.initial = ProjectHandler.initial;