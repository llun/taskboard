TestIt('TestProject', {
  'before each': function(test) {
    
    this.project = new Project('test', '1');
    
    var iteration = Iteration.create();
    this.project.iterations.push(iteration.id);
    
    var task = Task.create('test');
    iteration.addTask(task);
    
  },
  
  'testEndIteration': function (test) {
    var project = this.project;
    project.endIteration();
    
    test.assertEqual(3, project.iterations.length, 
      'End iteration should create new iteration');
    test.assertEqual(project.currentIteration(), project.iterations[2],
      'Last iteration and current iteration should be the same');
      
    var iteration = Iteration.get(project.iterations[1]);
    test.assert(iteration.end, 'Iteration should have end time.');

    for (var key in iteration.tasks) {
      var task = Task.get(key);
      test.assertEqual(Task.status.DONE, task.status, 
        'All task in ended iteration should be done');
    }
  },
  
  'testCancelIteration': function (test) {
    var project = this.project;
    var previous = project.currentIteration();
    
    project.cancelIteration();
    test.assertEqual(2, project.iterations.length, 
      'Cancel iteration should replace current iteration with new one');
    test.assert(previous != project.currentIteration(),
      'Current iteration should not the same at previous');
  }
  
});