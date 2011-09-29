TestIt('TestProject', {
  'before each': function(test) {
    
    var iteration = Iteration.create();
    
    this.project = new Project('test');
    this.project.currentIteration = iteration.id;
    this.project.iterations.push(iteration.id);
    
  },
  
  'testEndIteration': function (test) {
    var project = this.project;
    project.endIteration();
    
    test.assertEqual(3, project.iterations.length, 
      'End iteration should create new iteration');
    test.assertEqual(project.currentIteration, project.iterations[2],
      'Last iteration and current iteration should be the same');
  },
  
  'testCancelIteration': function (test) {
    var project = this.project;
    var previous = project.currentIteration;
    
    project.cancelIteration();
    test.assertEqual(2, project.iterations.length, 
      'Cancel iteration should replace current iteration with new one');
    test.assert(previous != project.currentIteration,
      'Current iteration should not the same at previous');
  }
  
});