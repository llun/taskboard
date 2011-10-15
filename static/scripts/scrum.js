// View event binding
_.init = function() {
  
  _.persistent = new LocalStoragePersistent();
  
  // Load data
  var current = _.persistent.get('current');
  if (!current) {
    _.user = User.create('anonymous', '', true);
    _.project = Project.get(_.user.defaultProject);
    
    var current = {id: 'current', key: _.user.id};
    _.persistent.save(current);
  } else {
    _.user = User.get(current.key);
    _.project = Project.get(_.user.defaultProject);
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

  $('#project-name').text(_.project.name);
  $('#iteration-name').text(iteration.name);
  
  // List projects
  var projects = _.user.projects;
  for (var index = 0; index < projects.length; index++) {
    var project = Project.get(projects[index]);
    var list = _.tmpl('project_list', project);
    $('#projects-list-menu').append(list);
  }
  
  // List iterations
  var iterations = _.project.iterations.slice(0).reverse()
  for (var index = 0; index < iterations.length; index++) {
    var iteration = Iteration.get(iterations[index]);
    var list = _.tmpl('iteration_list', iteration);
    $('#iterations-list-menu').append(list);
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

  // Update event
  $(applicationCache).bind('updateready', function (e) {
    if (applicationCache.status == applicationCache.UPDATEREADY) {
      window.location.hash = 'update/ready';
    }
  });
  
  // Sync data to server if online
  if (navigator.onLine) {
    now.ready(function() {
    
      $('#signing-in-menu').hide();
      
      if (_.user.anonymous) {
        $('#signed-out-menu').show();
      } else {
        $('#signed-in-user').text(_.user.username);
        $('#sigend-in-image').attr('src', _.user.image);
      
        $('#signed-in-menu').show();
      }
      
      
      if (_.oldHash) {
        // Parse login
        if (/^#user\/login/i.test(_.oldHash)) {
          window.location.hash = _.oldHash;        
        }
      }
    
      _.client = now.core.clientId;
      $('#sync-status').text('Online');
      
      // Task real-time synchronization
      now.clientCreateTask = function (from, task) {
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
      
      now.clientUpdateTask = function (from, task) {
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
      
      now.clientRemoveTask = function (from, id) {
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
      
      now.join(_.client, iteration.id, function() {
      
        $('#sync-status').text('Syncing');
        now.syncAllTask(iteration.id , prepareSync, prepareRemove, function() {
          $('#sync-status').text('Online');
        });
      
      });
      
    });
  } else {
    $('#signed-out-menu').show();
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