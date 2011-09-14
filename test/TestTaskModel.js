var TestIt = require('test_it');

var mongodb = require('mongodb');
var server = new mongodb.Server("127.0.0.1", 27017, {});
var client = null;
new mongodb.Db('test', server, {}).open(function (error, connectclient) {
  if (error) throw error;
  client = connectclient;
});

var IterationModel = require('../model/IterationModel').IterationModel;
var TaskModel = require('../model/TaskModel').TaskModel;
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
      remove: false,
      exists: false
    }
    
    this.created = [];
    var created = this.created;
    
    this.fixtures = [{
      summary: 'testT#1',
      state: 'todo'
    },{
      summary: 'testT#2',
      state: 'doing'
    },{
      summary: 'testT#3',
      state: 'done'
    }];
    var fixtures = this.fixtures;
    var done = false;
    
    function begin(){
      taskModel = new TaskModel(client);      
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
  'testCreate': function(test){
    var before = this.before;
    
    var error;
    var createdTask;
    test.waitFor(function(){
      return before.list;
    }, begin);
    
    function begin(){
      var task = {
        summary: 'task ja !'
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
        summary: 'iteration#100'
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
