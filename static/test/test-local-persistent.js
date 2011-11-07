TestIt('TestLocalStoragePersistent', {

  'before all': function (test) {
    this.store = new LocalStoragePersistent();
    
    var task1 = new Task('', 'First Task');
    task1.id = Util.uuid();
    localStorage.setItem(JSON.stringify(task1.id), JSON.stringify(task1));
    
    var task2 = new Task('', 'Second Task');
    task2.id = Util.uuid();
    localStorage.setItem(JSON.stringify(task2.id), JSON.stringify(task2));
    
    var task3 = new Task('', 'Third Task');
    task3.id = Util.uuid();
    localStorage.setItem(JSON.stringify(task3.id), JSON.stringify(task3));
    
    this.fixtures = [ task1.id, task2.id, task3.id ];
    
  },
  
  'after all': function (test) {
    localStorage.clear();
  },
  
  'testSaveNewTask': function(test) {

    var task = new Task('', 'Sample Task +book +llun');
    this.store.save(task);
    test.assert(task.id, 'Task must have an ID after save to persistent');
    
    var expect = JSON.parse(localStorage.getItem(JSON.stringify(task.id)));
    
    test.assertEqual(task.detail, expect.detail, 'Prototype and stored task' +
      ' should have same detail');
    test.assertEqual(task.id, expect.id, 'Prototype and stored task should' +
      ' have same id');
    test.assertEqual(task.status, expect.status, 'Prototype and stored ' +
      'task should have same status');
    
  },
  
  'testSaveOldTask': function(test) {

    var fixtures = this.fixtures;

    var task = new Task('', 'Hello, World');
    task.id = fixtures[0];
    this.store.save(task);
    
    var expect = JSON.parse(localStorage.getItem(JSON.stringify(fixtures[0])));
    
    test.assertEqual(task.detail, expect.detail, 'Prototype and stored task' +
      ' should have same detail');
    test.assertEqual(task.id, expect.id, 'Prototype and stored task should' +
      ' have same id');
    test.assertEqual(task.status, expect.status, 'Prototype and stored ' +
      'task should have same status');
      
  },
  
  'testGetTask': function(test) {
    
    var fixtures = this.fixtures;
    
    var task = this.store.get(fixtures[1]);
    test.assert(task.id, 'Task should have ID');
    test.assertEqual(fixtures[1], task.id, 
      'Task ID must equal to fixture (' + task.id + ')');
    test.assertEqual('Second Task', task.detail, 
      'Task get from store must have "Second Task" in detail. (' + 
      task.detail + ')');
    
  },
  
  'testGetInvalidTask': function(test) {

    var task = this.store.get('noid');
    test.assert(!task, 'Task should be null or undefined');

  },
  
  'testRemove': function(test) {

    var fixtures = this.fixtures;
    
    this.store.remove(fixtures[2]);
    var task = localStorage.getItem(fixtures[2]);
    
    test.assert(!task, 'Store should be null or undefined')

  }
  
});