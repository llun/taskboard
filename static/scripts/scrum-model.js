/**
 * Task model constructor
 *
 * @param {String} detail string.
 */
var Task = function(detail) {
  // Private properties
  var _responders = [];
  
  // Public propoerties
  this.detail = detail;
  this.status = Task.status.TODO;
  
  // Private methods
  /**
   * Parse detail for responders. Responders should live in form +name.
   * In future responder may have domain after name to tell which node
   * they are coming from.
   *
   * @param {String} detail text need to parse for get responders.
   */
  var _parseResponders = function(detail) {
    _responders = [];
    
    var pattern = /\W+\+\w+/ig;
    var matches = detail.match(pattern);

    if (matches) {
      for (var i = 0; i < matches.length; i++) {
        _responders.push(matches[i].slice(1));
      }      
    }
  }
  
  // Public methods
  /**
   * Get task detail method.
   *
   * @return {String} detail string.
   */
  this.getDetail = function getDetail() {
    return this.detail;
  }
  
  /**
   * Set task detail method.
   *
   * @param {String} detail string
   */
  this.setDetail = function setDetail(detail) {
    _parseResponders(detail);
    
    this.detail = detail;
  }
  
  /**
   * Get task responders
   *
   * @return {Array.String} array of responders string
   */
  this.getResponders = function getResponders() {
    return _responders;
  }
  
  /**
   * List of index attributes
   */
  this.getIndex = function getIndex() {
    return ['responders'];
  }
  
  // Constructor part
  _parseResponders(detail);
}

/**
 * Task status
 */
Task.status = {
  TODO: 'todo',
  WORKING: 'working',
  REVIEW: 'review',
  DONE: 'done'
};

// CRUD for Task
Task.create = function(detail) {
  var task = null;
  if (detail.length > 0) {
    task = new Task(detail);
    _.persistent.save(task);
  }
  return task;
}
Task.get = function(id) {
  var task = null;
  
  var object = _.persistent.get(id);
  if (object) {
    task = new Task(object.detail);
    task.id = object.id;
    task.status = object.status;
  }
  
  return task;
}
Task.save = function(task) {
  _.persistent.save(task);
}
Task.remove = function(id) {
  _.persistent.remove(id);
}

var Iteration = function(name) {
  
  var _self = this;
  
  // Begin time
  this.begin = null;
  
  // Task state
  this.todo = [];
  this.working = [];
  this.review = [];
  this.done = [];
  
  // All tasks
  this.tasks = [];
  
  // Iteration name
  this.name = name || 'New Iteration';
 
  // Private methods
  var _listFromTask = function _listFromTask(taskID) {
    var task = Task.get(taskID);
    var list = task.status == Task.status.TODO ? _self.todo : 
               task.status == Task.status.WORKING ? _self.working : 
               task.status == Task.status.REVIEW ? _self.review :
               task.status == Task.status.DONE ? _self.done : null;
               
    return list;
  }
  
  var _taskIndexInList = function _taskIndexInList(list, taskID) {
    var target = null;
    
    for (var key in list) {
      var object = _self.tasks[list[key]];
      if (object === taskID) {
        target = key;
        break;
      }
    }
    
    return target;
  }
 
  // Public methods
  this.getTodo = function getTodo() { return _self.todo; }
  this.getWorking = function getWorking() { return _self.working; }
  this.getReview = function getReview() { return _self.review; }
  this.getDone = function getDone() { return _self.done; }
  this.getTasks = function getTasks() { return _self.tasks; }
  
  /**
   * Create task and add it to iteration
   *
   * @param {String} detail task detail
   *
   * @return {Object} task object
   */
  this.createTask = function createTask(detail) {
    if (!_self.begin) {
      _self.begin = new Date().getTime();
    }

    var task = Task.create(detail);
    if (task) {
      _self.todo.push(_self.tasks.length);
      _self.tasks.push(task.id);
    }
    
    Iteration.save(_self);
    
    return task;
  }
  
  /**
   * Remove task from iteration and persistent
   *
   * @param {String} taskID
   */
  this.removeTask = function removeTask(taskID) {
    var list = _listFromTask(taskID);
               
    if (list) {
      var target = _taskIndexInList(list, taskID);
      
      if (target) {
        var position = list[target];
        delete _self.tasks[position];
        delete list[target];
        
        _self.tasks.length--;
        list.length--;
        
        Task.remove(taskID);
      }
      
    }
    
    Iteration.save(_self);
    
  }
  
  /**
   * Change task to new status
   *
   * @param {String} taskID
   * @param {String} status
   */
  this.changeStatus = function changeStatus(taskID, status) {
    var list = _listFromTask(taskID);
    
    if (list) {
      var target = _taskIndexInList(list, taskID);
      
      if (target) {
        var task = Task.get(taskID);
        var position = list[target];
        
        task.status = status;
        delete list[target];
        list.length--;
        
        Task.save(task);
        
        list = _listFromTask(taskID);
        list.push(position);
      }
    }
    
    Iteration.save(_self);
  }
}

// CRUD for Iteration
Iteration.create = function create() {
  var iteration = new Iteration();
  _.persistent.save(iteration);
  
  return iteration;
}
Iteration.get = function get(id) {
  var iteration = null;
  
  var object = _.persistent.get(id);
  if (object) {
    iteration = new Iteration();
    iteration.id = object.id;
    
    iteration.begin = object.begin;

    iteration.todo = object.todo;
    iteration.working = object.working;
    iteration.review = object.review;
    iteration.done = object.done;

    iteration.tasks = object.tasks;

    iteration.name = object.name;
  }
  
  return iteration;
}
Iteration.save = function save(iteration) {
  _.persistent.save(iteration);
}
Iteration.remove = function remove(id) {
  _.persistent.remove(id);
}