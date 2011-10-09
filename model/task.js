var mongodb = require('mongodb'),
    log4js = require('log4js');

var _log = log4js.getLogger('task');

var TaskModel = function(client){
  this.client = client;
  this.collection = new mongodb.Collection(client, 'task_collection');
}

TaskModel.prototype.list = function(offset, limit, callback){
  callback = callback || function(){};
  offset = offset || 0;
  limit = limit || 25;
  
  var collection = this.collection;
  collection.find({}, {skip:offset, limit:limit}).toArray(function(err, docs) {
    if(err){
      _log.warn(err.message);
      callback(err.message);
    }else{
      callback(null, docs);
    }
    
  });
}

TaskModel.prototype.count = function(callback) {
  callback = callback || function() {};
  
  var collection = this.collection;
  collection.count(callback);
}

TaskModel.prototype.create = function(task, callback){
  callback = callback || function(){};
  
  if(!task){
    callback('invalid args');
    return;
  }
  
  task._id = task.id;
  
  var collection = this.collection;
  collection.insert(task, {safe:true},
                    function(err, objects) {
    if (err){
      _log.warn(err.message);
      callback(err.message);
    }else{
      callback(null, objects[0] || null);
    }
  });
}

TaskModel.prototype.edit = function(id, task, callback){
  callback = callback || function(){};
  
  if(!id || !task){
    callback('invalid args - id:'+id+', task:'+task);
    return;
  }
  
  var client = this.client;
  
  var collection = this.collection;
  collection.update({ '_id': id}, {'$set': task}, {safe:true},
                    function(err, objects) {
    if (err){
      _log.warn(err.message);
      callback(err.message);
    }else{
      callback(null, objects);
    }
  });
}

TaskModel.prototype.remove = function(id, callback){
  callback = callback || function(){};
  
  if(!id){
    callback('invalid args - id:'+id);
    return;
  }
  
  var client = this.client;
  
  var collection = this.collection;
  collection.findAndModify({ '_id': id},[], {}, {remove:true},
                    function(err, objects) {
    if (err){
      _log.warn(err.message);
      callback(err.message);
    }else{
      callback(null, objects);
    }
  });
}

TaskModel.prototype.exists = function(id, callback){
  callback = callback || function(){};
  
  if(!id){
    callback('invalid args - id:'+id);
    return;
  }
  
  var client = this.client;
  
  var collection = this.collection;
  collection.find({ '_id': id}).count(function(err, objects) {
    if (err){
      _log.warn(err.message);
      callback(err.message);
    }else{
      callback(null, objects !== 0);
    }
  });
}

var _model = null;
TaskModel.get = function (client) {
  if (!_model) {
    _model = new TaskModel(client);
  }
  
  return _model;
}

exports.TaskModel = TaskModel;