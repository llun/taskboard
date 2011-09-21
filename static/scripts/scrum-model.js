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
  this.updated = new Date().getTime();
  
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
    
    var pattern = /(^\+\w+|\s+\+\w+|\s+\+\w+$)/ig;
    var matches = detail.match(pattern);

    if (matches) {
      for (var i = 0; i < matches.length; i++) {
        _responders.push(matches[i].replace(/^\s*([\S\s]*)\b\s*$/, '$1'));
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
  INPROGRESS: 'inprogress',
  VERIFY: 'verify',
  DONE: 'done',
  OTHER: 'other'
};

// CRUD for Task
Task.create = function(detail, push) {
  var task = null;
  if (detail.length > 0) {
    task = new Task(detail);
    _.persistent.save(task);
    
    if (push) {
      if (navigator.onLine && now.sync) {
        now.sync(_.client, task);
        task.sync = true;
        _.persistent.save(task);
      }
    }
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
    task.sync = object.sync;
    task.updated = object.updated;
  }
  
  return task;
}
Task.save = function(task, push) {
  
  if (push) {
    task.updated = new Date().getTime();
    
    if (navigator.onLine && now.sync) {
      now.sync(_.client, task);
    }
  }
  
  _.persistent.save(task);
  
}
Task.remove = function(id, push) {
  _.persistent.remove(id);
  
  var removed = _.persistent.get('removed');
  if (!removed) {
    removed = { id: 'removed', list: [] };    
  }
  
  removed.list.push(id);
  _.persistent.save(removed)
  
  if (push) {
    if (navigator.onLine && now.sync) {
      now.sync(_.client, {id: id, removed: true});
    }
  }
}

var Iteration = function(name) {
  
  // Private variable
  var _self = this;
  
  // Public variable
  this.begin = null; // Begin time
  this.tasks = {}; // All tasks
  this.name = name || 'New Iteration'; // Iteration name
  
  this.addTask = function createTask(task, push) {
    if (!_self.tasks[task.id]) {
      _self.tasks[task.id] = true;
    }
  }
  
  this.removeTask = function removeTask(id, push) {
    _self.tasks[id] = false;
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
  
  var removed = _.persistent.get('removed');
  if (!removed) {
    removed = { id: 'removed', list: [] };
  }
  
  removed.list.push(id);
  _.persistent.save(removed)
}