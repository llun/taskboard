TestIt('TestTask', {
  'before each': function(test) {
    
    this.fixture = new Task('Hello, world +book');
    
  },
  
  'testCreate': function(test) {
    
    var task = new Task('Hello, World');
    test.assert(task.getDetail(), 'Task must have detail');
    
  },
  
  'testCreateWithOwner': function(test) {
    
    var task = new Task('Hello, World +llun +book');

    var responders = task.getResponders();
        
    var expectResponders = 2;
    var totalResponders = responders.length;
    
    test.assertEqual(expectResponders, totalResponders, 'Task should have ' + 
      expectResponders + ' responders. (' + totalResponders + ')');
      
    var expectSet = {};
    for (var i = 0; i < totalResponders; i++) {
      expectSet[responders[i]] = true;
    }
    
    test.assert(expectSet['+llun'], 'llun should live in responders');
    test.assert(expectSet['+book'], 'book should live in responders');
    
  },
  
  'testCreateMultilineWithOwner': function(test) {

    var task = new Task('Hello, World +book\nThis is a new line\n+llun');
    
    var responders = task.getResponders();
    
    var expectResponders = 2;
    var totalResponders = responders.length;
    test.assertEqual(expectResponders, totalResponders, 'Task should have ' + 
      expectResponders + ' responders. (' + totalResponders + ')');
      
    var expectSet = {};
    for (var i = 0; i < totalResponders; i++) {
      expectSet[responders[i]] = true;
    }
    
    test.assert(expectSet['+llun'], 'llun should live in responders');
    test.assert(expectSet['+book'], 'book should live in responders');
    
  },
  
  'testUpdate': function(test) {
    
    var fixture = this.fixture;
    
    fixture.setDetail('Hello, World');
    
    var responders = fixture.getResponders();
    var totalResponders = responders.length;
    
    test.assertEqual('Hello, World', fixture.getDetail());
    test.assertEqual(0, totalResponders, 
      'After update theirs should not have any responders anymore. (' + 
      totalResponders + ')');
    
  },
  
  'testUpdateWithResponder': function(test) {
    
    var fixture = this.fixture;
    
    fixture.setDetail('Hello, World +llun');
    
    var responders = fixture.getResponders();

    var expectResponders = 1;
    var totalResponders = responders.length;
    
    test.assertEqual(expectResponders, totalResponders, 
      'After update task should have ' + expectResponders + ' responders. ('
      + totalResponders + ')');
      
    var expectSet = {};
    for (var i = 0; i < totalResponders; i++) {
      expectSet[responders[i]] = true;
    }

    test.assert(expectSet['+llun'], 'llun should live in responders');
    test.assert(!expectSet['+book'], 'book should not live in responders');
  }
});