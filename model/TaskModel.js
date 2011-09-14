var mongodb = require('mongodb');

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
      console.warn(err.message);
      callback(err.message);
    }else{
      callback(null, docs);
    }
    
  });
}

TaskModel.prototype.create = function(task, callback){
  callback = callback || function(){};
  
  if(!task){
    callback('invalid args');
    return;
  }
  
  var newTask = {}
  
  if(task.summary) newTask.summary = task.summary;
  if(task.description) newTask.description = task.description;
  if(task.state) newTask.state = task.state;
  if(task.owner) newTask.owner = task.owner;
  if(task.priority) newTask.priority = task.priority;
  if(task.endTime) newTask.endTime = task.endTime;
  
  var collection = this.collection;
  collection.insert(task, {safe:true},
                    function(err, objects) {
    if (err){
      console.warn(err.message);
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
  
  var newTask = {}
  if(task.summary) newTask.summary = task.summary;
  if(task.description) newTask.description = task.description;
  if(task.state) newTask.state = task.state;
  if(task.owner) newTask.owner = task.owner;
  if(task.priority) newTask.priority = task.priority;
  if(task.endTime) newTask.endTime = task.endTime;
  
  var client = this.client;
  id = new client.bson_serializer.ObjectID(id+'');
  
  var collection = this.collection;
  collection.update({ '_id': id}, {'$set': newTask}, {safe:true},
                    function(err, objects) {
    if (err){
      console.warn(err.message);
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
  id = new client.bson_serializer.ObjectID(id+'');
  
  var collection = this.collection;
  collection.findAndModify({ '_id': id},[], {}, {remove:true},
                    function(err, objects) {
    if (err){
      console.warn(err.message);
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
  id = new client.bson_serializer.ObjectID(id+'');
  
  var collection = this.collection;
  collection.find({ '_id': id}).count(function(err, objects) {
    if (err){
      console.warn(err.message);
      callback(err.message);
    }else{
      callback(null, objects !== 0);
    }
  });
}

exports.TaskModel = TaskModel;