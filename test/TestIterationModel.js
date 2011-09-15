var TestIt = require('test_it');

var mongodb = require('mongodb');
var server = new mongodb.Server("127.0.0.1", 27017, {});
var client = null;
new mongodb.Db('test', server, {}).open(function (error, connectclient) {
  if (error) throw error;
  client = connectclient;
});

var IterationModel = require('../model/iteration.js').IterationModel;
var iterationModel = null;
var TaskModel = require('../model/task.js').TaskModel;
var taskModel = null;

TestIt('testIterationModel', {
  'before all': function(test) {
    test.waitFor(function(){
      return client !== null;
    }, beginTask);
    
    this.before = {
      create: false,
      edit: false,
      list: false,
      remove: false,
      addTask: false,
      removeTask: false
    }
    
    this.created = [];
    var created = this.created;
    
    this.createdTask = [];
    var createdTask = this.createdTask;
    
    this.fixtures = [{
      name: 'testI#1',
      startTime: 1,
      endTime: 2,
      task: []
    },{
      name: 'testI#2',
      startTime: 1,
      endTime: 2,
      task: []
    },{
      name: 'testI#3',
      startTime: 1,
      endTime: 2,
      task: []
    }];
    var fixtures = this.fixtures;
    
    this.fixturesTask = [{
      summary: 'testT#1',
      state: 'todo'
    },{
      summary: 'testT#2',
      state: 'doing'
    },{
      summary: 'testT#3',
      state: 'done'
    }];
    var fixturesTask = this.fixturesTask;
    
    var done = false;
    var doneTask = false;
    var addTask = false;
    
    function begin(){
      taskModel = new TaskModel(client);      
      
      iterationModel = new IterationModel(client, taskModel);
      var collection = new mongodb.Collection(client, 'iteration_collection');
      
      collection.drop(function(){
        collection.insert(fixtures, {safe:true}, function(err, objects) {
          for(var i in objects){
            created.push(objects[i]);
          }
          done = true;
        });
      });
    }
    
    function beginTask(){
      var collection = new mongodb.Collection(client, 'task_collection');
      
      collection.drop(function(){
        collection.insert(fixturesTask, {safe:true}, function(err, objects) {
          for(var i in objects){
            createdTask.push(objects[i]);
          }
          fixtures[0].task.push(createdTask[0]._id);
          fixtures[0].task.push(createdTask[2]._id);
          doneTask = true;
        });
      });
    }
    test.waitFor(function(){
      return doneTask;
    }, begin);
    
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
    iterationModel.list(0, 50, function (err, docs){
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
    var iteration;
    test.waitFor(function(){
      return before.list;
    }, begin);
    
    function begin(){
      iterationModel.create('iteration#1', '1', '2', function(err, data){
        error = err;
        iteration = data;
        before.create = true;
      });
    }
    
    
    test.waitFor(function(){
      return before.create;
    }, function(){
      test.assert(!error);
      test.assert(iteration);
    });
  },
  'testEdit': function(test){
    var before = this.before;
    var created = this.created;
    var error;
    var result;
    
    test.waitFor(function(){
      return before.list;
    }, begin);

    function begin(){
      var iteration = {
        name: 'iteration#100'
      }
      
      iterationModel.edit(created[0]._id, iteration, function(err, data){
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
      return before.list;
    }, begin);

    function begin(){
      var iteration = {
        name: 'iteration#100'
      }
      
      iterationModel.remove(created[2]._id, function(err, data){
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
  'testAddTask': function(test){
    var before = this.before;
    var created = this.created;
    var createdTask = this.createdTask;
    var error;
    var result;
    test.waitFor(function(){
      return before.list;
    }, begin);

    function begin(){
      iterationModel.addTask(created[1]._id, ''+createdTask[1]._id, function(err, data){
        error = err;
        result = data;
        before.addTask = true;
      });
    }
    test.waitFor(function(){
      return before.addTask;
    }, function(){
      // console.log(error);
      test.assert(!error);
      test.assert(result);
      // console.log('add '+createdTask[1].summary+' to '+created[1].name);
      // console.log('add '+createdTask[1]._id+' to '+created[1]._id);
    });
  },
  'testRemoveTask': function(test){
    var before = this.before;
    var created = this.created;
    var createdTask = this.createdTask;
    var error;
    var result;
    
    test.waitFor(function(){
      return before.list;
    }, begin);

    function begin(){
      iterationModel.removeTask(created[0]._id, ''+createdTask[0]._id, function(err, data){
        error = err;
        result = data;
        before.removeTask = true;
      });
    }
    test.waitFor(function(){
      return before.removeTask;
    }, function(){
      // console.log('remove '+createdTask[0].summary+' from '+created[0].name);
      test.assert(!error);
      test.assert(result);
    });
  },
});
