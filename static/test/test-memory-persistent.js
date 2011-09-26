TestIt('TestMemoryPersistent', {
  'before each': function(test) {
    this.store = new MemoryPersistent();
    
    var task = new Task('First Task');
    this.store.save(task);
    this.fixture = task.id;
  },
  
  'testSaveNewTask': function(test) {
    
    var task = new Task('Sample Task +book +llun');
    this.store.save(task);
    test.assert(task.id, 'Task must have an ID after save to persistent');
    
    var objects = this.store.getObjects();
    test.assertEqual(2, objects.length,
      'Persistent should have 2 object (' + objects.length + ')');
    
  },
  
  'testSaveOldTask': function(test) {
        
    var second = new Task('Hello, World');
    second.id = this.fixture;
    this.store.save(second);
    
    var objects = this.store.getObjects();
    var target = objects[this.fixture];
    
    test.assertEqual(second, target, 
      'Second object and target object must be the same');
      
  },
  
  'testGetTask': function(test) {
    
    var task = this.store.get(this.fixture);
    test.assert(task.id, 'Task should have ID');
    test.assertEqual(this.fixture, task.id, 
      'Task ID must equal to fixture (' + task.id + ')');
    test.assertEqual('<p>First Task</p>\n', task.getDetail(), 
      'Task get from store must have "First Task" in detail. (' + 
      task.getDetail() + ')');
    
  },
  
  'testGetInvalidTask': function(test) {
    
    var task = this.store.get('noid');
    test.assert(!task, 'Task should be null or undefined');
    
  },
  
  'testRemove': function(test) {
    
    var objects = this.store.getObjects();
    this.store.remove(this.fixture);
    
    var task = this.store.get(this.fixture);
    
    test.assertEqual(0, objects.length, 
      'Store should not have any objects (' + objects.length + ')');
    test.assert(task === undefined, 'Store should return undefined')

    
  },
  
  'testRemoveUndefined': function(test) {
    
    var objects = this.store.getObjects();
    this.store.remove('noid');
    
    test.assertEqual(1, objects.length,
      'Persistent should have 1 object (' + objects.length + ')');
      
  }
  
});