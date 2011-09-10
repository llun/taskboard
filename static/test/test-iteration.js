TestIt('TestIteration', {
  
  'before each': function(test) {
    var persistent = new MemoryPersistent();
    var iteration = new Iteration();
    var todo = iteration.getTodo();
    var tasks = iteration.getTasks();
    
    var task = new Task('First Task');
    
    
    this.iteration = iteration;
  },
  
  'testAddTask': function(test) {
    var iteration = this.iteration();
    
  },
  
  'testRemoveTask': function(test) {
    
  },
  
  'testChangeTaskStatus': function(test) {
    
  }
  
});