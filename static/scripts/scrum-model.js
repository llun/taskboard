/**
 * Task model constructor
 *
 * @param {String} detail string.
 */
var Task = function(detail) {
  // Private properties
  var _detail = detail;
  var _responders = [];
  
  // Public propoerties
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
  return _.persistent.get(id);
}
Task.save = function(task) {
  _.persistent.save(task);
}
Task.remove = function(id) {
  _.persistent.remove(id);
}

var Iteration = function(name) {
  
  // Begin time
  var _begin = null;
  
  // Task state
  var _todo = [];
  var _working = [];
  var _review = [];
  var _done = [];
  
  // All tasks
  var _tasks = [];
  
  // Iteration name
  this.name = name || 'New Iteration';
 
  // Private methods
  var _listFromTask = function _listFromTask(taskID) {
    var task = Task.get(taskID);
    var list = task.status == Task.status.TODO ? _todo : 
               task.status == Task.status.WORKING ? _working : 
               task.status == Task.status.REVIEW ? _review :
               task.status == Task.status.DONE ? _done : null;
    return list;
  }
  
  var _taskIndexInList = function _taskIndexInList(list, taskID) {
    var target = null;
    
    for (var key in list) {
      var object = _tasks[list[key]];
      if (object === taskID) {
        target = key;
        break;
      }
    }
    
    return target;
  }
 
  // Public methods
  this.getTodo = function getTodo() { return _todo; }
  this.getWorking = function getWorking() { return _working; }
  this.getReview = function getReview() { return _review; }
  this.getDone = function getDone() { return _done; }
  this.getTasks = function getTasks() { return _tasks; }
  
  /**
   * Create task and add it to iteration
   *
   * @param {String} detail task detail
   *
   * @return {Object} task object
   */
  this.createTask = function createTask(detail) {
    if (!_begin) {
      _begin = new Date().getTime();
    }
    
    var task = Task.create(detail);
    
    _tasks.push(task.id);
    _todo.push(_tasks.length);
    
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
        delete _tasks[position];
        delete list[target];
        
        _tasks.length--;
        list.length--;
        
        Task.remove(taskID);
      }
      
    }
    
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
  }
}

// CRUD for Iteration
Iteration.create = function create() {
  
}
Iteration.get = function get(id) {
  
}
Iteration.save = function save(iteration) {
  
}
Iteration.remove = function remove(id) {
  
}