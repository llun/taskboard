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
    if (project) {
      var list = _.tmpl('project_list', project);
      $('#projects-list-menu').append(list);
    }
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
    
      _.client = now.core.clientId;
    
      $('#logging-in-menu').hide();
      
      if (_.user.anonymous) {
        $('#logged-out-menu').css('display', 'block');
        
        if (_.oldHash) {
          // Parse login
          if (/^#user\/login/i.test(_.oldHash)) {
            window.location.hash = _.oldHash;        
          }
        }
      } else {
        
        var joinList = [];
        
        // If user already login it should sync user.
        now.syncUser(_.user, function(object) {
        
          console.log ('Sync user success: ' + object.error);
          // How to handler error ?
          if (!object.error) {
          
            joinList.push(_.user.id);
          
            $('#logged-in-user').text(_.user.username);
            $('#logged-in-image').attr('src', _.user.image);
            
            $('#logged-in-menu').css('display', 'block');
            $('#logged-in-status').css('display', 'block');
          
            if (object.status == 'update') {
              var data = object.data;
              User.save(data);
            }
            
            // Prepare project need to sync
            var projects = _.user.projects;
            var prepare = [];
            projects.forEach(function (projectID) {
              var project = Project.get(projectID);
              if (project.sync) {
                prepare.push(project);
              }
            });
            
            now.syncProjects(_.client, prepare, function () {
            
              prepare.forEach(function (project) {
                joinList.push(project.id);
              });
              
              now.joinGroups(_.client, joinList, function () {
                console.log ('Join projects success');
              });
            });
            
          } else {
          
            _.persistent.clear();
            location.reload();
          
          }
        
        });
      }
      
      $('#sync-status').text('Online');
      
      // User real-time synchronization
      now.clientUpdateUser = function (user) {
      
        if (user.updated > _.user.updated) {    
          User.save(user);
        }
        
      }
      
      // Project real-time synchronization
      now.clientCreateProject = function (serverProject) {
        Project.save(serverProject);
        now.joinGroups(_.client, [serverProject.id]);
      }
      
      now.clientUpdateProject = function (client, serverProject) {
      
        console.log ('server-debug(update): project - ' + 
                     serverProject.id + ', ' + 
                     serverProject.updated + ', ' +
                     serverProject.modified);
      
        var clientProject = Project.get(serverProject.id);
        if (serverProject.updated > clientProject.updated ||
            serverProject.modified != clientProject.modified) {
          Project.save(serverProject);
        }
        
        clientProject = Project.get(serverProject.id);
        $('#project-menu-' + clientProject.id).text(clientProject.name);
        
        if (_.project.id == clientProject.id) {
          $('#project-name').text(clientProject.name);
          _.project = clientProject;
        }
        
      }
      
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
      
      now.joinGroups(_.client, [iteration.id], function() {
      
        $('#sync-status').text('Syncing');
        now.syncAllTask(iteration.id , prepareSync, prepareRemove, function() {
          $('#sync-status').text('Online');
        });
      
      });
      
    });
  } else {
    
    $('#logging-in-menu').hide();
    if (_.user.anonymous) {
      $('#logged-out-menu').hide();
    } else {
      $('#logged-in-status').css('display', 'block');
      $('#logged-in-user').text(_.user.username);
    
      $('#logged-in-menu').css('display', 'block');
      $('#log-out-menu').remove();
      
      if (_.project.sync) {
        $('#end-iteration-button').attr('disabled', true);
      }
    }
    
  }
  
  // Online/Offline event
  $(window).bind('online', function (e) {
    console.log ('Online');
    window.location.reload()
  });
  
  $(window).bind('offline', function(e) {
    console.log ('Offline');
    $('#sync-status').text('Offline');
    
    if (_.project.sync) {
      $('#end-iteration-button').attr('disabled', true);
    }
  });
  
}