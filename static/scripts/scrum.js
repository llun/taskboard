// View event binding
_.init = function() {
  
  _.persistent = new LocalStoragePersistent();
  
  // Load data
  var current = _.persistent.get('current');
  if (!current) {
    _.project = Project.create();
    
    var current = {id: 'current', key: _.project.id};
    _.persistent.save(current);
  } else {
    _.project = Project.get(current.key);
  }
  
  var iteration = Iteration.get(_.project.currentIteration());
  for (var taskID in iteration.tasks) {

    if (iteration.tasks[taskID]) {
      var task = Task.get(taskID);
      if (task) {
        $('#' + task.status).append(_.tmpl('task', task));
        $('#' + task.id).attr('draggable', true);
      }
      
    }
    
  }
  
  $('#iteration-name').text(iteration.name);
  
  if (_.project.iterations.length > 1) {
    $('#iterations-list-menu').append('<li class="divider"></li>');
    
    var iterations = _.project.iterations;
    for (var index = 0; index < iterations.length - 1; index++) {
      var iteration = Iteration.get(iterations[index]);
      var list = _.tmpl('iteration_list', iteration);
      $('#iterations-list-menu').append(list);
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
  
  $('#end-iteration-button').click(function(event) {
    window.location.hash = 'iteration/end';
  });
  
  $('.dropdown').click(function(event) {
    var open = false;
    if (!$(this).hasClass('open')) {
      open = true;
    }
    $('.dropdown').removeClass('open');
    
    if (open) {
      $(this).addClass('open');
    }
  });
  
  // Generate client id
  _.client = Util.uuid();

  // Update event
  $(applicationCache).bind('updateready', function (e) {
    if (applicationCache.status == applicationCache.UPDATEREADY) {
      window.location.hash = 'update/ready';
    }
  });
  
  // Sync data to server if online
  if (navigator.onLine) {
    now.ready(function() {
      
      $('#sync-status').text('Online');
      
      // Task real-time synchronization
      now.create = function (from, task) {
        console.log ('server-debug(create): (' + from + ',' + task.id + ') ' + task.detail);
        if (from == _.client) { return; }
        
        if (!Task.get(task.id)) {
          Task.save(task);
          
          var iteration = Iteration.get(_.project.currentIteration());
          iteration.addTask(task);
          Iteration.save(iteration);

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
          
          var iteration = Iteration.get(_.project.currentIteration());
          iteration.removeTask(id);
          Iteration.save(iteration);
        }
        
      }
      
      // Iteration real-time synchronization
      now.endIteration = function () {
        
      }
      
      var iteration = Iteration.get(_.project.currentIteration());
      var prepareSync = [];
      var tasks = iteration.tasks;
      
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
      
      $('#sync-status').text('Syncing');
      now.syncAll(prepareSync, prepareRemove, function() {
        $('#sync-status').text('Online');
      });
      
    });
  }
  
  // Online/Offline event
  $(window).bind('online', function (e) {
    console.log ('Online');
    window.location.reload()
  });
  
  $(window).bind('offline', function(e) {
    console.log ('Offline');
    $('#sync-status').text('Offline');
  });
  
}