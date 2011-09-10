/**
 * Task model constructor
 *
 * @param {String} detail string.
 */
var Task = function(detail) {
  // Private properties
  var _detail = detail;
  var _responders = [];
  
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
    return _detail;
  }
  
  /**
   * Set task detail method.
   *
   * @param {String} detail string
   */
  this.setDetail = function setDetail(detail) {
    _parseResponders(detail);
    _detail = detail;
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
  var task = new Task(detail);
  _.persistent.save(task);
  return task;
}
Task.get = function(id) {
  _.persistent.get(id);
}
Task.save = function(task) {
  _.persistent.save(task);
}
Task.remove = function(id) {
  _.persistent.remove(id);
}

var Iteration = function(name) {
  
  // Iteration name
  this.name = name || 'New Iteration';
  
  // Begin time
  var _begin = null;
  
  // Task state
  var _todo = [];
  var _working = [];
  var _review = [];
  var _done = [];
  
  // All tasks
  var _tasks = [];
 
  // Public methods
  this.getTodo = function getTodo() { return _todo; }
  this.getWorking = function getWorking() { return _working; }
  this.getReview = function getReview() { return _review; }
  this.getDone = function getDone() { return _done; }
  this.getTasks = function getTasks() { return _tasks; }
  
  this.createTask = function createTask(detail) {
    if (!_begin) {
      _begin = new Date().getTime();
    }
    
    var task = Task.create(detail);
    
    _tasks.push(task.id);
    _todo.push(_tasks.length);
    
    return task;
  }
  
  this.removeTask = function removeTask(task) {
    
  }
}
