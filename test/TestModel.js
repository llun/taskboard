var TestIt = require('test_it');

var mongodb = require('mongodb');
var server = new mongodb.Server("127.0.0.1", 27017, {});
var client = null;
new mongodb.Db('test', server, {}).open(function (error, connectclient) {
  if (error) throw error;
  client = connectclient;
});

var Model = require('../model/model.js').Model;
var taskModel = null;

TestIt('testTaskModel', {
  'before all': function(test) {
    test.waitFor(function(){
      return client !== null;
    }, begin);
    
    this.before = {
      create: false,
      edit: false,
      list: false,
      count: false,
      remove: false,
      exists: false
    }
    
    this.created = [];
    var created = this.created;
    
    this.fixtures = [{
      id: '1',
      detail: 'testT#1',
      status: 'todo',
      updated: new Date().getTime()
    },{
      id: '2',
      detail: 'testT#2',
      status: 'inprogress',
      updated: new Date().getTime()
    },{
      id: '3',
      detail: 'testT#3',
      status: 'done',
      updated: new Date().getTime()
    }];
    var fixtures = this.fixtures;
    var done = false;
    
    function begin(){
      taskModel = new Model('task', client);      
      var collection = new mongodb.Collection(client, 'task_collection');
      
      collection.drop(function(){
        collection.insert(fixtures, {safe:true}, function(err, objects) {
          for(var i in objects){
            created.push(objects[i]);
          }
          done = true;
        });
      });
    }
    
    test.waitFor(function(){
      return done;
    }, function(){
      console.log('data prepare done.');
    });
  },
  'testList': function(test){
    var before = this.before;
    
    var error;
    var data;
    taskModel.list(0, 50, function (err, docs){
      error = err;
      data = docs;
      before.list = true;
    });
    
    test.waitFor(function(){
      return before.list;
    }, function(){
      test.assert(!error);
      test.assertEqual(3, data.length);
    });
  },
  'testCount': function(test) {
    var before = this.before;
    
    var error = null;
    var count = null;
    
    test.waitFor(function(){
      return before.list;
    }, begin);
    
    function begin(){
      taskModel.count(function(err, data){
        error = err;
        count = data;
        before.count = true;
      });
    }
    
    
    test.waitFor(function(){
      return before.count;
    }, function(){
      test.assert(!error);
      test.assertEqual(3, count);
    });
  },
  'testCreate': function(test){
    var before = this.before;
    
    var error;
    var createdTask;
    test.waitFor(function(){
      return before.count;
    }, begin);
    
    function begin(){
      var task = {
        id: '4',
        detail: 'task ja !',
        updated: new Date().getTime()
      }
      taskModel.create(task, function(err, data){
        error = err;
        createdTask = data;
        before.create = true;
      });
    }
    
    
    test.waitFor(function(){
      return before.create;
    }, function(){
      test.assert(!error);
      test.assert(createdTask);
    });
  },
  'testEdit': function(test){
    var before = this.before;
    var created = this.created;
    var error;
    var result;
    
    test.waitFor(function(){
      return before.create;
    }, begin);

    function begin(){
      var task = {
        summary: 'iteration#100',
        updated: new Date().getTime()
      }
      
      taskModel.edit(created[0]._id, task, function(err, data){
        error = err;
        result = data;
        before.edit = true;
      });
    }
    test.waitFor(function(){
      return before.edit;
    }, function(){
      test.assert(!error);
      test.assert(result);
    });
  },
  'testRemove': function(test){
    var before = this.before;
    var created = this.created;
    var error;
    var result;
    
    test.waitFor(function(){
      return before.create;
    }, begin);

    function begin(){
      var iteration = {
        name: 'iteration#100'
      }
      
      taskModel.remove(created[0]._id, function(err, data){
        error = err;
        result = data;
        before.remove = true;
      });
    }
    test.waitFor(function(){
      return before.remove;
    }, function(){
      test.assert(!error);
      test.assert(result);
    });
  },
  'testExists': function(test){
    var before = this.before;
    var created = this.created;
    var error;
    var result;
    
    var error2;
    var result2;
    
    test.waitFor(function(){
      return before.create;
    }, begin);

    function begin(){
      var iteration = {
        name: 'iteration#100'
      }
      
      taskModel.exists(created[1]._id, function(err, data){
        error = err;
        result = data;
        taskModel.exists('4e5c6bf676fec90d04000002', function(err, data){
          error2 = err;
          result2 = data;
          before.exists = true;
        });
      });
    }
    test.waitFor(function(){
      return before.exists;
    }, function(){
      test.assert(!error);
      test.assert(result);
      
      test.assert(!error2);
      test.assert(!result2);
    });
  },
});
