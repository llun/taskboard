// Route table
_.table = {
  'task/new': function() {
    $('#new-task-modal').show();
  },
  'task/edit': function(hash) {
    $('#edit-task-modal').show();
    
    var id = hash.substring('#task/edit'.length + 1);
    var task = Task.get(id);
    
    $('#edit-task-detail').val(task.getDetail());
    $('#edit-task-save-button').attr('href', '#task/save/' + id);
  },
  'task/save': function(hash) {
    
    if (hash) {
      // Save old task
      var id = hash.substring('#task/edit'.length + 1);
      
      var task = Task.get(id);
      console.log ('Client update: ' + task.detail);
      
      task.setDetail($('#edit-task-detail').val());
      Task.save(task);
      
      if (navigator.onLine) {
        now.sync(task);
      }
      
      $('#' + id + '_detail').text(task.getDetail());
      $('#' + id + '_responders').text(task.getResponders().toString());
      
      $('#edit-task-detail').val('');
      $('#edit-task-save-button').attr('href', '');
      $('#edit-task-modal').hide();
    } else {
      // Save new task
      // Store it to local memory and render new task in todo
      var detail = $('#new-task-detail').val();
      console.log ('Client create: ' + detail);

      var task = _.iteration.createTask(detail);
      if (task) {
        $('#todo').append(_.tmpl('task', task));
        $('#' + task.id).attr('draggable', true);
        
        if (navigator.onLine) {
          now.sync(task);
        }

        // Clear form and close
        $('#new-task-detail').val('');
        $('#new-task-modal').hide();
      }
    }
    
  },
  'task/remove': function(hash) {
    var id = hash.substring('#task/remove'.length + 1);
    var task = Task.get(id);
    console.log ('Client remove: ' + task.detail);
    
    _.iteration.removeTask(id);
    $('#' + id).remove();
    
    if (navigator.onLine) {
      now.sync({id: id, removed: true});
    }
    
    window.location.hash = '';
  },
  'task/clear': function(hash) {
    $('#clear-task-modal').show();
  },
  'task/clear/confirm': function(hash) {
    console.log ('Client clear');
    var tasks = _.iteration.tasks;
    for (var index = 0; index < tasks.length; index++) {
      if (navigator.onLine) {
        now.sync({id: tasks[index], removed: true});
      }
    }
    
    $('.task').remove();
    $('#clear-task-modal').hide();
    
    _.persistent.clear();
    
    window.location.hash = '';
  },
  
  // Default state
  '': function() {
    $('#new-task-detail').val('');
    $('#edit-task-detail').val('');
    $('#edit-task-save-button').attr('href', '');
    
    $('#new-task-modal').hide();
    $('#edit-task-modal').hide();
  }
}

// View event binding
_.init = function() {
  _.persistent = new LocalStoragePersistent();
  
  // Load data
  var current = _.persistent.get('current');
  if (!current) {
    _.iteration = Iteration.create();
    
    var current = {id: 'current', key: _.iteration.id};
    _.persistent.save(current);
  } else {
    _.iteration = Iteration.get(current.key);
  }
  
  var types = ['todo', 'inprogress', 'verify', 'done'];
  $.each(types, function (index, type) {
    
    $.each(_.iteration[type], function (index, value) {
      var task = Task.get(_.iteration.tasks[value]);
      if (task) {
        console.log ('Load: ' + task.detail);
        $('#' + type).append(_.tmpl('task', task));
        $('#' + task.id).attr('draggable', true);
      } else {
        console.log ('Task is not found: ' + id);
        
        var id = _.iteration.tasks[value];
        _.iteration.removeTask(id);
        
      }
    });
    
  });
  
  // Bind drag & drop on wall
  $('.wall').bind({
    dragenter: function (ev) {
      $(this).addClass('over');
    },
    dragover: function (ev) {
      if (ev.preventDefault) {
        ev.preventDefault();
      }
      
      return false;
    },
    dragleave: function (ev) {
      $(this).removeClass('over');
    },
    drop: function (ev) {
      $(this).removeClass('over');
      
      var dt = ev.originalEvent.dataTransfer;
      var target = dt.getData('Text');
      
      $('#' + target).remove();
      var task = Task.get(target);
      $(this).append(_.tmpl('task', task));
      $('#' + task.id).attr('draggable', true);
      
      var status = $(this)[0].id;
      _.iteration.changeStatus(task.id, status);
      
      if (navigator.onLine) {
        task = Task.get(task.id);
        now.sync(task);
      }
      
      console.log ('Update: ' + task.detail);
      
      return false;
    }
  });
  
  // Bind drag & drop on task
  $('.task').live({
    dragstart: function (ev) {
      var dt = ev.originalEvent.dataTransfer;
      dt.setData('Text', $(this).attr('id'));
    },
    dblclick: function (ev) {
      window.location.hash = 'task/edit/' + $(this).attr('id');
    }
  });
  
  $('#new-task-button').click(function(event) {
    window.location.hash = 'task/new';
  });
  
  $('#clear-task-button').click(function(event) {
    window.location.hash = 'task/clear';
  });
  
  $('#user-menu').click(function(event) {
    $(this).toggleClass('open');
  });

  // Sync data to server if online
  if (navigator.onLine) {
    now.ready(function() {
      
      now.create = function (task) {
        var clientTask = Task.get(task.id);
        if (clientTask) {
          clientTask.sync = true;
          Task.save(clientTask);
        } else {
          _.iteration.saveTask(task);
          
          clientTask = Task.get(task.id);
          
          console.log ('Remote create: ' + task.detail);
          
          $('#todo').append(_.tmpl('task', clientTask));
          $('#' + clientTask.id).attr('draggable', true);
        }
      };
      
      now.update = function (task) {
        var clientTask = Task.get(task.id);
        
        clientTask.setDetail(task.detail);
        clientTask.updated = task.updated;
        
        Task.save(clientTask);
        _.iteration.changeStatus(task.id, task.status);
        
        $('#' + task.id).remove();
        
        clientTask = Task.get(task.id);
        
        console.log ('Remote update: ' + clientTask.detail);
        
        $('#' + clientTask.status).append(_.tmpl('task', clientTask));
        $('#' + clientTask.id).attr('draggable', true);
      }
      
      now.remove = function (id) {
        var task = Task.get(id);
        console.log ('Remote remove: ' + task.detail);
        
        $('#' + id).remove();
        _.iteration.removeTask(id);
      }
      
      var prepareSync = [];
      var tasks = _.iteration.tasks;
      
      for (var index = 0; index < tasks.length; index++) {
        var task = Task.get(tasks[index]);
        if (task) {
          prepareSync.push(task);
        }
      }
      
      var prepareRemove = [];
      var removed = _.persistent.get('removed');
      
      if (removed) {
        prepareRemove = removed.list;
        _.persistent.remove('removed');
      }
      
      now.syncAll(prepareSync, prepareRemove);
      
    });
  }
  
}