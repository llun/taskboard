/**
 * Task model constructor
 *
 * @param {String} detail Task detail.
 */
var Task = function(iteration, detail) {
  // Private properties
  var _responders = [];

  this.type = 'task';
  
  // Public properties
  this.detail = detail;
  this.status = Task.status.TODO;
  this.owner = iteration;
  
  this.updated = 0;
  this.modified = new Date().getTime();
  
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
Task.create = function(iteration, detail, push) {
  task = new Task(iteration, detail);
  
  _.persistent.save(task);
  
  if (push) {
    if (navigator.onLine && now.syncModel) {
      now.syncModel(_.client, task);
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
    task = new Task(object.iteration, object.detail);
    task.id = object.id;
    task.status = object.status;
    task.sync = object.sync;
    task.updated = object.updated;
    task.modified = object.modified;
    task.owner = object.owner;
  }
  
  return task;
}
Task.save = function(task, push) {
  
  task.updated++;
  task.modified = new Date().getTime();
  
  if (push) {
    if (navigator.onLine && now.syncModel) {
      now.syncModel(_.client, task);
    }
  }
  
  _.persistent.save(task);
  
}
Task.remove = function(id, push) {
  var task = Task.get(id);
  
  task.updated++;
  task.modified = new Date().getTime();
  task.delete = true;
  
  if (push) {
    if (navigator.onLine && now.syncModel) {
      now.syncModel(_.client, task);
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

  this.type = 'iteration';
  
  // Public variable
  this.begin = new Date(); // Begin time
  this.end = null; // End time
  this.tasks = {}; // All tasks
  
  this.name = name || 'New Iteration'; // Iteration name
  
  this.updated = 0;
  this.modified = new Date().getTime();
  
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
  if (_.user) {
    iteration.owner = _.user.id;
  }
  
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
    iteration.owner = object.owner;
    iteration.updated = object.updated;
    iteration.modified = object.modified;
  }
  
  return iteration;
}
Iteration.save = function (iteration, push) {
  iteration.updated += 1;
  iteration.modified = new Date().getTime();
  _.persistent.save(iteration);
  
  if (navigator.onLine && now.syncModel && push) {
    now.syncModel(_.client, iteration);
  }
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

  this.type = 'project';

  // Public properties
  this.name = name;
  this.iterations = [];
  this.updated = 0;
  this.modified = new Date().getTime();
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
Project.create = function (name, owner, sync) {
  var iteration = Iteration.create('Iteration 1');
  var project = new Project(name, iteration.id);
  project.owner = owner;
  project.sync = sync;
  _.persistent.save(project);
  
  if (navigator.onLine && now.syncModel && project.sync) {
    now.syncModel(_.client, project);
  }
  
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
    project.owner = object.owner;
    project.modified = object.modified;
  }
  
  return project;
}
Project.save = function (project, push) {
  console.log ('Save project.');
  console.trace();

  project.updated += 1;
  project.modified = new Date().getTime();
  
  _.persistent.save(project);
  
  if (navigator.onLine && now.syncModel && project.sync && push) {
    now.syncModel(_.client, project);
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

  this.type = 'user';

  // Public properties
  this.username = username;
  this.anonymous = anonymous;
  this.image = image;
  this.projects = [];
  this.members = [];
  this.updated = 0;
  this.modified = new Date().getTime();
  this.defaultProject = null;

  // Private method
  var _constructor = function () {
    if (project) {
      _self.projects.push(project.id);
      _self.defaultProject = project.id;
    }
  }
  
  this.createProject = function (name, sync) {
    var project = Project.create(name, _self.id, sync);
    _self.projects.push(project.id);
    
    User.save(_self, true);
    
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
  var user = new User(username, image, anonymous);
  _.persistent.save(user);
  
  var project = Project.create('Project 1', user.id);
  user.defaultProject = project.id;
  user.projects.push(project.id);
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
    user.modified = object.modified;
  }
  
  return user;
}

User.save = function (user, push) {
  user.updated += 1;
  user.modified = new Date().getTime();
  _.persistent.save(user);
  
  if (navigator.onLine && now.syncUser && !user.anonymouse && push) {
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