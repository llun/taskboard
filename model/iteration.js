var mongodb = require('mongodb');

var IterationModel = function(client, taskModel){
  this.client = client;
  this.collection = new mongodb.Collection(client, 'iteration_collection');
  this.taskModel = taskModel;
}

IterationModel.prototype.list = function(offset, limit, callback){
  callback = callback || function(){};
  offset = offset || 0;
  limit = limit || 10;
  
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

IterationModel.prototype.create = function(name, beginTime, endTime, callback){
  callback = callback || function(){};
  
  if(!name){
    callback('invalid args');
    return;
  }
  
  var iteration = {
    name: name,
    beginTime: beginTime || new Date().getTime(),
    //task: []
  }
  
  if(endTime){
    iteration.endTime = endTime;
  }
  
  var collection = this.collection;
  collection.insert(iteration, {safe:true},
                    function(err, objects) {
    if (err){
      console.warn(err.message);
      callback(err.message);
    }else{
      callback(null, objects[0] || null);
    }
  });
}

/**
 * iteration.name
 * iteration.startTime
 * iteration.endTime
 */
IterationModel.prototype.edit = function(id, iteration, callback){
  callback = callback || function(){};
  
  if(!id || !iteration){
    callback('invalid args - id:'+id+', iteration:'+iteration);
    return;
  }
  
  var client = this.client;
  id = new client.bson_serializer.ObjectID(id+'');
  
  var iterationSet = {}
  if(iteration.name){
    iterationSet.name = iteration.name;
  }
  
  if(iteration.startTime){
    iterationSet.startTime = iteration.startTime;
  }
  
  if(iteration.endTime){
    iterationSet.endTime = iteration.endTime;
  }
  
  var collection = this.collection;
  collection.update({ '_id': id}, {'$set': iterationSet}, {safe:true},
                    function(err, objects) {
    if (err){
      console.warn(err.message);
      callback(err.message);
    }else{
      callback(null, objects);
    }
  });
}

IterationModel.prototype.remove = function(id, callback){
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

IterationModel.prototype.addTask = function(iterationId, taskId, callback){
  callback = callback || function(){};
  
  if(!iterationId || !taskId){
    callback('invalid args - iterationId:'+iterationId+', taskId:'+taskId);
    return;
  }
  
  var client = this.client;
  var collection = this.collection;
  var taskModel = this.taskModel;
  
  taskModel.exists(taskId, function(err, data){
    if(err){
      callback(err.message);
    }else{
      if(!data){
        callback('non-exist taskId: '+taskId);
      }else{
        collection.update({ '_id': iterationId}, {'$push': {task:new client.bson_serializer.ObjectID(taskId)}}, {safe:true},
                        function(err, objects) {
        if (err){
          console.warn(err.message);
          callback(err.message);
        }else{
          callback(null, objects);
        }
      });
      }
    }
  });
}

IterationModel.prototype.removeTask = function(iterationId, taskId, callback){
  callback = callback || function(){};
  
  if(!iterationId || !taskId){
    callback('invalid args - iterationId:'+iterationId+', taskId:'+taskId);
    return;
  }
  
  var client = this.client;
  var collection = this.collection;
  var taskModel = this.taskModel;
  
  collection.update({ '_id': iterationId}, {'$pull': {task:new client.bson_serializer.ObjectID(taskId)}}, {safe:true},
                  function(err, objects) {
    if (err){
      console.warn(err.message);
      callback(err.message);
    }else{
      callback(null, objects);
    }
  });
}

exports.IterationModel = IterationModel;