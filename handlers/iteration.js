var log4js = require('log4js');

var _log = log4js.getLogger('iteration');

var IterationHandler = {

  initial: function(now, everyone, store) {
  
    everyone.join = function (client, iteration, callback) {
      var group = now.getGroup(iteration);
      group.addUser(client);
      
      if (callback) {
        callback();
      }
    }
    
    everyone.endIteration = function (client, oldIteration, newIteration, callback) {
    }
  
  }
  
}

exports.initial = IterationHandler.initial;