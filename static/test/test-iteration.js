TestIt('TestIteration', {
  'before each': function(test) {
    
    this.iteration = new Iteration('test');
    this.iteration.tasks['1'] = true;
    this.iteration.tasks['2'] = false;
    
  },
  
  'testAddTask': function (test) {
    var task = new Task('Hello, world');
    task.id = '3';
    
    this.iteration.addTask(task);
    
    var count = 0;
    for (var item in this.iteration.tasks) {
      if (this.iteration.tasks[item]) count++;
    }
    
    test.assertEqual(2, count);
  },
  
  'testAddDuplicateTask': function (test) {
    var task = new Task('Hello, world');
    task.id = '1';
    
    this.iteration.addTask(task);
    
    var count = 0;
    for (var item in this.iteration.tasks) {
      if (this.iteration.tasks[item]) count++;
    }
    
    test.assertEqual(1, count);
  },
  
  'testRemoveTask': function (test) {
    this.iteration.removeTask(1);
    test.assertEqual(false, this.iteration.tasks['1']);
  }
  
});