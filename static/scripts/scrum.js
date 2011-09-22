// Route table
_.table = {
  'task/new': function() {
    $('#new-task-modal').show();
  },
  'task/edit': function(hash) {
    $('#edit-task-modal').show();
    
    var id = hash.substring('#task/edit'.length + 1);
    var task = Task.get(id);
    
    $('#edit-task-detail').val(task.getDetail(true));
    $('#edit-task-save-button').attr('href', '#task/save/' + id);
  },
  'task/save': function(hash) {
    
    if (hash) {
      // Save old task
      var id = hash.substring('#task/edit'.length + 1);
      
      var task = Task.get(id);
      task.setDetail($('#edit-task-detail').val());
      Task.save(task, true);
      
      console.log ('client(update): ' + task.id + ', ' + task.status + ', ' + task.detail);
      
      $('#' + id + '_detail').html(task.getDetail());
      $('#' + id + '_responders').text(task.getResponders().toString());
      
      $('#edit-task-detail').val('');
      $('#edit-task-save-button').attr('href', '');
      $('#edit-task-modal').hide();
    } else {
      // Save new task
      // Store it to local memory and render new task in todo
      var detail = $('#new-task-detail').val();

      var task = Task.create(detail, true);
      if (task) {
        _.iteration.addTask(task);
        Iteration.save(_.iteration);
        
        $('#todo').append(_.tmpl('task', task));
        $('#' + task.id).attr('draggable', true);
        
        console.log ('client(create): ' + task.id + ', ' + task.status + ', ' + task.detail);

        // Clear form and close
        $('#new-task-detail').val('');
        $('#new-task-modal').hide();
      }
    }
    
  },
  'task/remove': function(hash) {
    var id = hash.substring('#task/remove'.length + 1);
    Task.remove(id, true);
    _.iteration.removeTask(id);
    Iteration.save(_.iteration);
    
    console.log ('client(remove): ' + id);
    
    $('#' + id).remove();
    
    window.location.hash = '';
  },
  'task/clear': function(hash) {
    $('#clear-task-modal').show();
  },
  'task/clear/confirm': function(hash) {
    var tasks = _.iteration.tasks;
    for (var taskID in tasks) {
      Task.remove(taskID);
      _.iteration.removeTask(taskID);
    }
    Iteration.save(_.iteration);
    
    console.log ('client(clear)');
    
    $('.task').remove();
    $('#clear-task-modal').hide();
    
    window.location.hash = '';
  },
  
  'update/ready': function() {
    $('#update-modal').show();
  },
  'update/confirm': function() {
    $('#update-modal').hide();
    
    _.persistent.clear();
    
    console.log ('client(clear)');
    
    applicationCache.swapCache();
    window.location.reload();
  },
  
  // Default state
  '': function() {
    $('#new-task-detail').val('');
    $('#edit-task-detail').val('');
    $('#edit-task-save-button').attr('href', '');
    
    $('#new-task-modal').hide();
    $('#edit-task-modal').hide();
    $('#update-modal').hide();
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
  
  for (var taskID in _.iteration.tasks) {

    if (_.iteration.tasks[taskID]) {
      var task = Task.get(taskID);
      if (task) {
        $('#' + task.status).append(_.tmpl('task', task));
        $('#' + task.id).attr('draggable', true);
      }
    }
  }
  
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
      task.status = status;
      Task.save(task, true);
      
      console.log ('client(update): ' + task.status + ', ' + task.detail);
      
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

  // Generate client id
  _.client = Util.uuid();

  // Sync data to server if online
  if (navigator.onLine) {
    now.ready(function() {
      
      now.create = function (from, task) {
        console.log ('server-debug(create): (' + from + ',' + task.id + ') ' + task.detail);
        if (from == _.client) { return; }
        
        if (!Task.get(task.id)) {
          Task.save(task);
          _.iteration.addTask(task);
          Iteration.save(_.iteration);

          var _task = Task.get(task.id);
          $('#' + _task.status).append(_.tmpl('task', _task));
          $('#' + _task.id).attr('draggable', true);
          console.log ('server(create): ' + _task.status + ', ' + _task.detail);
        }
        
      };
      
      now.update = function (from, task) {
        console.log ('server-debug(update): (' + from + ',' + task.id + ') '  + task.detail);
        if (from == _.client) { return; }
        
        var _task = Task.get(task.id);
        _task.setDetail(task.detail);
        _task.updated = task.updated;
        _task.status = task.status;
        Task.save(_task);
        
        console.log ('server(update): ' + _task.status + ', ' + _task.detail);
        
        $('#' + _task.id).remove();
        $('#' + _task.status).append(_.tmpl('task', _task));
        $('#' + _task.id).attr('draggable', true);
      }
      
      now.remove = function (from, id) {
        console.log ('server-debug(remove): (' + from + ',' + id + ')');
        if (from == _.client) { return; }
        
        console.log ('server(remove): ' + id);
        
        if ($('#' + id).length > 0) {
          $('#' + id).remove();
          Task.remove(id);
          _.iteration.removeTask(id);
          Iteration.save(_.iteration);
        }
        
      }
      
      var prepareSync = [];
      var tasks = _.iteration.tasks;
      
      for (var taskID in tasks) {
        var task = Task.get(taskID);
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
  
  // Update event
  $(applicationCache).bind('updateready', function (e) {
    if (applicationCache.status == applicationCache.UPDATEREADY) {
      window.location.hash = 'update/ready';
    }
  });
  
}