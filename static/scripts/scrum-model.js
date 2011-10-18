/**
 * Task model constructor
 *
 * @param {String} detail Task detail.
 */
var Task = function(detail) {
  // Private properties
  var _responders = [];
  
  // Public properties
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
  this.getDetail = function getDetail(edit) {
    var output = '';
    
    if (!edit) {
      var paragraphs = this.detail.split('\n');
      for (var line in paragraphs) {
        // Trim space
        var paragraph = paragraphs[line].replace(/^\s+|\s+$/, '');
        
        // Remove html tag from text.
        paragraph = paragraph.replace(/<\w+>|<\/\w+>/ig, '');

        if (paragraph.length > 0) {
          output += '<p>' + paragraph + '</p>\n';
        }
      }
    } else {
      output = this.detail;
    }
    
    return output;
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
  task = new Task(detail);
  _.persistent.save(task);
  
  if (push) {
    if (navigator.onLine && now.syncTask) {
      now.syncTask(_.project.currentIteration(), _.client, task);
      task.sync = true;
      _.persistent.save(task);
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
    
    if (navigator.onLine && now.syncTask) {
      now.syncTask(_.project.currentIteration(), _.client, task);
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
    if (navigator.onLine && now.syncTask) {
      now.syncTask(_.project.currentIteration(), _.client, 
                   {id: id, removed: true});
    }
  }
}

/**
 * Iteration model constructor
 *
 * @param {String} name Iteration name.
 */
var Iteration = function(name) {
  
  // Private variable
  var _self = this;
  
  // Public variable
  this.begin = new Date(); // Begin time
  this.end = null; // End time
  this.tasks = {}; // All tasks
  this.name = name || 'New Iteration'; // Iteration name
  
  this.addTask = function addTask(task, push) {
    if (!_self.tasks[task.id]) {
      _self.tasks[task.id] = true;
    }
  }
  
  this.removeTask = function removeTask(id, push) {
    _self.tasks[id] = false;
  }
 
}

// CRUD for Iteration
Iteration.create = function (name) {
  var iteration = new Iteration(name);
  _.persistent.save(iteration);
  
  return iteration;
}
Iteration.get = function (id) {
  var iteration = null;
  
  var object = _.persistent.get(id);
  if (object) {
    iteration = new Iteration();
    iteration.id = object.id;
    
    iteration.begin = object.begin;
    iteration.end = object.end;
    iteration.tasks = object.tasks;
    iteration.name = object.name;
  }
  
  return iteration;
}
Iteration.save = function (iteration) {
  _.persistent.save(iteration);
}
Iteration.remove = function (id, push) {
  var iteration = Iteration.get(id);
  var tasks = iteration.tasks;
  for (var index = 0; index < tasks.length; index++) {
    var task = tasks[index];
    Task.remove(task, push);
  }
  
  _.persistent.remove(id);
  
  var removed = _.persistent.get('removed');
  if (!removed) {
    removed = { id: 'removed', list: [] };
  }
  
  removed.list.push(id);
  _.persistent.save(removed)
  
  if (push) {
    if (navigator.onLine && now.syncTask) {
      now.syncTask(id, _.client, {id: id, removed: true});
    }
  }
}

/**
 * Project model constructor
 *
 * @param {String} name Project name.
 * @param {Object} iteration First iteration object.
 */
var Project = function (name, iteration) {

  // Private properties
  var _self = this;

  // Public properties
  this.name = name;
  this.iterations = [];
  this.updated = 0;
  this.sync = false;
  
  // Private method
  var _constructor = function () {
    if (iteration) {
      _self.iterations.push(iteration);
    }
  }
  
  // Public method
  this.currentIteration = function currentIteration() {
    return _self.iterations[_self.iterations.length - 1];
  }
  
  this.endIteration = function endIteration() {
    var iteration = Iteration.get(_self.currentIteration());
    iteration.end = new Date();
    Iteration.save(iteration);
    
    for (var key in iteration.tasks) {
      var task = Task.get(key);
      if (task) {
        task.status = Task.status.DONE;
        Task.save(task);
      }
    }
    
    iteration = Iteration.create('Iteration ' + (_self.iterations.length + 1));
    _self.iterations.push(iteration.id);
    
    Project.save(_self);
  }
  
  this.cancelIteration = function cancelIteration() {
    Iteration.remove(_self.currentIteration());
    
    var iteration = Iteration.create();
    _self.iterations[_self.iterations.length - 1] = iteration.id;
    
    Project.save(_self);
  }
  
  // Constructor part
  _constructor();
}

// CRUD for Project
Project.create = function (name) {
  var iteration = Iteration.create('Iteration 1');
  var project = new Project(name, iteration.id);
  _.persistent.save(project);
  
  return project;
}
Project.get = function (id) {
  var project = null;
  
  var object = _.persistent.get(id);
  if (object) {
    project = new Project(object.name);
    project.id = object.id;
    project.iterations = object.iterations;
    project.sync = object.sync;
    project.updated = object.updated;
  }
  
  return project;
}
Project.save = function (project) {
  project.updated += 1;
  _.persistent.save(project);
  
  if (navigator.onLine && now.syncProjects && project.sync) {
    now.syncProjects([project]);
  }
}
Project.remove = function (id) {
  _.persistent.remove(id);
  
  var removed = _.persistent.get('removed');
  if (!removed) {
    removed = { id: 'removed', list: [] };
  }
  
  removed.list.push(id);
  _.persistent.save(removed)
}

/**
 * User model constructor
 *
 * @param {String} username
 * @param {Object} project First project object
 */
var User = function (username, image, anonymous, project) {

  // Private properties
  var _self = this;

  // Public properties
  this.username = username;
  this.anonymous = anonymous;
  this.image = image;
  this.projects = [];
  this.members = [];
  this.updated = 0;
  this.defaultProject = null;

  // Private method
  var _constructor = function () {
    if (project) {
      _self.projects.push(project.id);
      _self.defaultProject = project.id;
    }
  }
  
  this.createProject = function (name) {
    var project = Project.create(name);
    _self.projects.push(project.id);
    
    User.save(_self);
    
    return project;
  }
  
  this.removeProject = function (id) {
  
    var projects = _self.projects;
    
    var found = false;
    var index = 0;
    for (; index < projects.length; index++) {
      if (projects[index] == id) {
        found = true;
        break;
      }
    }
    
    if (found) {
      // Remove project;
      Project.remove(projects[index]);
      
      var firstSet = [];
      var secondSet = [];
      
      firstSet = projects.slice(0, index);
      if (index < projects.length - 1) {
        secondSet = projects.slice(index + 1);
      }
      
      _self.projects = firstSet.concat(secondSet);
      User.save(_self);
    }
  
  }
  
  _constructor();

}

// CRUD for User
User.create = function (username, image, anonymous) {
  var project = Project.create('Project 1');
  var user = new User(username, image, anonymous, project);
  _.persistent.save(user);
  
  return user;
}

User.get = function (id) {
  var user = null;
  
  var object = _.persistent.get(id);
  if (object) {
    user = new User(object.username);
    user.id = object.id;
    user.projects = object.projects;
    user.members = object.members;
    user.defaultProject = object.defaultProject;
    user.anonymous = object.anonymous;
    user.image = object.image;
    user.updated = object.updated;
  }
  
  return user;
}

User.save = function (user) {
  user.updated += 1;
  _.persistent.save(user);
  
  if (navigator.onLine && now.syncUser && !user.anonymouse) {
    now.syncUser(user);
  }
}

User.remove = function (id) {
  _.persistent.remove(id);
  
  var removed = _.persistent.get('removed');
  if (!removed) {
    removed = { id: 'removed', list: [] };
  }
  
  removed.list.push(id);
  _.persistent.save(removed)
}