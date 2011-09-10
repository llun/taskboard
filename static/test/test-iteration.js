TestIt('TestIteration', {
  
  'before each': function(test) {
    var iteration = new Iteration();
    var todo = iteration.getTodo();
    var tasks = iteration.getTasks();
    
    var task = Task.create('First Task');
    tasks.push(task.id);
    todo.push(0);
    
    this.iteration = iteration;
    this.task = task.id;
  },
  
  'testCreateTask': function(test) {
    var iteration = this.iteration;
    var task = iteration.createTask('Second Task');
    
    var tasks = iteration.getTasks();
    var todo = iteration.getTodo();
    
    test.assertEqual(2, tasks.length, 
      'Iteration should have 2 tasks (' + tasks.length + ')');
    test.assertEqual(2, todo.length,
      'Todo should have 2 tasks (' + todo.length + ')');
    test.assert(task, 'Create task should return task');
    test.assert(_.persistent.get(task.id), 'Task should persist');
    
  },
  
  'testRemoveTask': function(test) {
    var iteration = this.iteration;
    iteration.removeTask(this.task);
    
    var todo = iteration.getTodo();
    var tasks = iteration.getTasks();
    
    test.assertEqual(0, tasks.length,
      'Iteration should not have any tasks (' + tasks.length + ')');
    test.assertEqual(0, todo.length,
      'Todo should not have any tasks (' + todo.length + ')');
    
    var persistent = _.persistent;
    var task = persistent.get(this.task);
    test.assert(task === undefined, 'Task should be undefined');
  },
  
  'testChangeTaskStatus': function(test) {
    
  }
  
});