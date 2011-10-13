var mongodb = require('mongodb'),
    log4js = require('log4js');

var _log = log4js.getLogger('model');

var Model = function(name, client){
  this.client = client;
  this.collection = new mongodb.Collection(client, name + '_collection');
}

Model.prototype.list = function(offset, limit, callback){
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

Model.prototype.count = function(callback) {
  callback = callback || function() {};
  
  var collection = this.collection;
  collection.count(callback);
}

Model.prototype.find = function(query, callback) {
  callback = callback || function(){};
  
  if (!query) {
    callback('invalid query');
    return;
  }
  
  var collection = this.collection;
  var cursor = collection.find(query);
  
  callback(cursor);
}

Model.prototype.create = function(object, callback){
  callback = callback || function(){};
  
  if(!object){
    callback('invalid args');
    return;
  }
  
  object._id = object.id;
  
  var collection = this.collection;
  collection.insert(object, {safe:true},
                    function(err, objects) {
    if (err){
      _log.warn(err.message);
      callback(err.message);
    }else{
      callback(null, objects[0] || null);
    }
  });
}

Model.prototype.edit = function(id, object, callback){
  callback = callback || function(){};
  
  if(!id || !object){
    callback('invalid args - id:'+id+', model:'+object);
    return;
  }
  
  var client = this.client;
  
  var collection = this.collection;
  collection.update({ '_id': id}, {'$set': object}, {safe:true},
                    function(err, objects) {
    if (err){
      _log.warn(err.message);
      callback(err.message);
    }else{
      callback(null, objects);
    }
  });
}

Model.prototype.remove = function(id, callback){
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

Model.prototype.exists = function(id, callback){
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

var _models = {};
Model.get = function (type, client) {
  if (!_models[type]) {
    _models[type] = new Model(type, client);
  }
  
  return _models[type];
}

exports.Model = Model;