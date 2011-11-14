// Route table
_.table = {
  // Task controllers
  'task/new': function() {
    $('#new-task-modal').show();
    $('#new-task-detail').focus();
  },
  'task/edit': function(hash) {
    $('#edit-task-modal').show();

    var id = null;    
    var matches = hash.match(/[0-9a-fA-F-]{36}/);
    if (matches) {
      id = matches[0];
    }
    
    if (id) {
    
      var task = Task.get(id);
      
      var value = task.getDetail(true);
      $('#edit-task-detail').val(value);
      $('#edit-task-detail').focus();
      
      var textArea = $('#edit-task-detail').get(0);
      textArea.setSelectionRange(value.length, value.length);
      
      $('#edit-task-save-button').attr('href', '#task/save/' + id);
      
    }
    
  },
  'task/save': function(hash) {
    
    var id = null;
    if (hash) {
      var matches = hash.match(/[0-9a-fA-F-]{36}/);
      if (matches) {
        id = matches[0];
      }
    }
    
    if (id) {
      // Validate value
      var taskDetail = $('#edit-task-detail').val();
      taskDetail = taskDetail.replace(/^\s+|\s+$/,'');
      
      if (taskDetail.length > 0) {
      
        // Save old task
        var task = Task.get(id);
        task.setDetail(taskDetail);
        Task.save(task, true);
        
        console.log ('client(update): ' + task.id + ', ' + task.status + ', ' + task.detail);
        
        $('#' + id + '_detail').html(task.getDetail());
        $('#' + id + '_responders').text(task.getResponders().toString());
        
        $('#edit-task-detail').val('');
        $('#edit-task-save-button').attr('href', '');
        $('#edit-task-modal').hide();
        
        $('.edit-task-detail').removeClass('error');
        $('#edit-task-help').text('');
        $('#edit-task-save-button').attr('href', '#task/save');
        
      } else {
      
        $('.edit-task-detail').addClass('error');
        $('#edit-task-help').text('Task detail cannot empty');
        $('#edit-task-save-button').attr('href', '#task/save/' + id + '?' + new Date().getTime());
      
      }
      
    } else {
      // Save new task
      // Store it to local memory and render new task in todo
      var taskDetail = $('#new-task-detail').val();
      taskDetail = taskDetail.replace(/^\s+|\s+$/, '');
      
      if (taskDetail.length > 0) {
      
        var iteration = Iteration.get(_.project.currentIteration());
        
        var task = Task.create(iteration.id, taskDetail, true);
        iteration.addTask(task);
        Iteration.save(iteration, true);
        
        $('#todo').append(_.tmpl('task', task));
        $('#' + task.id).attr('draggable', true);
        
        console.log ('client(create): ' + task.id + ', ' + task.status + ', ' + task.detail);

        // Clear form and close
        $('#new-task-detail').val('');
        $('#new-task-modal').hide();
        
        $('.new-task-detail').removeClass('error');
        $('#new-task-help').text('');
        $('#new-task-save-button').attr('href', '#task/save');
        
      } else {
      
        $('.new-task-detail').addClass('error');
        $('#new-task-help').text('Task detail cannot empty');
        $('#new-task-save-button').attr('href', '#task/save?' + new Date().getTime());
      
      }
      
    }
    
  },
  'task/remove': function(hash) {
    var iteration = Iteration.get(_.project.currentIteration());
    
    var id = null;    
    var matches = hash.match(/[0-9a-fA-F-]{36}/);
    if (matches) {
      id = matches[0];
    }
    
    if (id) {
    
      Task.remove(id, true);
      iteration.removeTask(id);
      Iteration.save(iteration, true);
      
      console.log ('client(remove): ' + id);
      
      $('#' + id).remove();
      
      window.location.hash = '';
      
    }
    
  },
  'task/clear': function(hash) {
    $('#clear-task-modal').show();
  },
  'task/clear/confirm': function(hash) {
    _.persistent.clear();
    
    console.log ('client(clear)');
    
    $('.task').remove();
    $('#clear-task-modal').hide();
    
    window.location.hash = '';
  },
  
  // Iteration controllers
  'iteration/show': function(hash) {
  
    var id = null;    
    var matches = hash.match(/[0-9a-fA-F-]{36}/);
    if (matches) {
      id = matches[0];
    }
    
    if (id) {
    
      var isCurrent = id == _.project.currentIteration();
    
      $('.task').remove();
      var iteration = Iteration.get(id);
      for (var taskID in iteration.tasks) {
  
        if (iteration.tasks[taskID]) {
          var task = Task.get(taskID);
          if (task) {
            $('#' + task.status).append(_.tmpl('task', task));
          }
  
        }
  
      }
      
      $('#iteration-name').text(iteration.name);
      
      if (isCurrent) {
        // Show new task and end iteration button
        $('#iteration-actions').show();
        $('#board-name-edit').show();
        $('.task').attr('draggable', true);
      } else {
        // Hide new task and end iteration button
        $('#iteration-actions').hide();
        $('#board-name-edit').hide();
        $('.task-action').hide();
      }
      
      window.location.hash = '';
    
    }
    
  },
  'iteration/end': function() {
    $('#end-iteration-modal').show();
  },
  'iteration/end/confirm': function() {
    _.project.endIteration();
    
    var iteration = Iteration.get(_.project.currentIteration());
    
    $('.task').remove();
    $('#iteration-name').text(iteration.name);
    
    $('.iteration-list-menu-item').remove();
    
    var iterations = _.project.iterations.slice(0).reverse()
    for (var index = 0; index < iterations.length; index++) {
      var iteration = Iteration.get(iterations[index]);
      var list = _.tmpl('iteration_list', iteration);
      $('#iterations-list-menu').append(list);
    }
    
    window.location.hash = '';
  },
  
  // Project controllers
  'project/show': function (hash) {
  
    var id = null;    
    var matches = hash.match(/[0-9a-fA-F-]{36}/);
    if (matches) {
      id = matches[0];
    }
    
    if (id) {
    
      var user = _.user;
      
      var project = Project.get(id);
      if (user.anonymous || (!user.anonymous && project.sync)) {
        user.defaultProject = id;
        User.save(user, true);
      } 
      
      var iteration = Iteration.get(project.currentIteration());
      
      _.project = project;
      
      $('.task').remove();
      
      $('#project-name').text(project.name);
      $('#iteration-name').text(iteration.name);
      
      _.table['iteration/show']('#iteration/show/' + iteration.id);
      
      if (_.project.sync && !navigator.onLine && !now.endIteration) {
        $('#end-iteration-button').attr('disabled', true);
      } else {
        $('#end-iteration-button').removeAttr('disabled');
      }
      
      $('.iteration-list-menu-item').remove();
      for (var index in project.iterations) {
        var iteration = Iteration.get(project.iterations[index]);
        var list = _.tmpl('iteration_list', iteration);
        $('#iterations-list-menu').append(list);
      }
    
    }
  
  },
  'project/new': function () {
    $('#new-project-modal').show();
  },
  'project/save': function () {
    var name = $('#new-project-name').val();
    var isSync = $('#new-project-sync-option').attr('checked') ? true : false;
    $('#new-project-sync-option').removeAttr('checked');
    $('#new-project-sync-option').removeAttr('disabled');
    
    var pattern = /^[\w\d ]+$/;
    if (pattern.test(name)) {
    
      var project = _.user.createProject(name, isSync);
      var list = _.tmpl('project_list', project);
      $('#projects-list-menu').append(list);
      
      $('#new-project-modal').hide();      
      $('#new-project-save-button').attr('href', '#project/save?' + new Date().getTime());
      
      if (_.project.sync && !navigator.onLine && !now.endIteration) {
        $('#end-iteration-button').attr('disabled', true);
      } else {
        $('#end-iteration-button').removeAttr('disabled');
      }
      
      window.location.hash = '';
      
    } else {
    
      $('.new-project-name').addClass('error');
      $('#new-project-help').text('Project name can contains only alphabet' +
                                  ', numeric or white space');
      $('#new-project-save-button').attr('href', '#project/save?' + new Date().getTime());
    
    }
    
  },
  
  // Update controllers
  'update/ready': function() {
    $('#update-modal').show();
  },
  'update/confirm': function() {
    $('#update-modal').hide();
    
    _.persistent.clear();
    
    console.log ('client(clear)');
    
    applicationCache.swapCache();
  },
  
  // Board controllers.
  'board/edit': function() {
  
    $('#edit-board-modal').show();
    
    var project = _.project;
    $('#edit-project-name').val(project.name);
    $('#edit-project-name').focus();
    
    if (project.sync) {
      $('#edit-project-sync-option').attr('checked', true);
      $('#edit-project-sync-option').attr('disabled', true);
      
      if (now.invite) {
        $('#share-user-list-input').removeAttr('disabled');
      }
      
    }
    
    var members = project.members;
    for (var index in members) {
      var member = members[index];
      member.id = project.id;
      
      $('#share-user-list-icons').append(_.tmpl('share_list', member));
    }
    
    var iteration = Iteration.get(_.project.currentIteration());
    $('#edit-iteration-name').val(iteration.name);
    
    var input = $('#edit-project-name')[0];
    input.setSelectionRange(0, project.name.length);
    
  },
  'board/save': function () {
    
    // Validate input
    var pattern = /^[\w\d ]+$/i;
    
    var projectName = $('#edit-project-name').val();
    var iterationName = $('#edit-iteration-name').val();
    
    var projectPass = pattern.test(projectName);
    var iterationPass = pattern.test(iterationName);
        
    if (projectPass && iterationPass) {
    
      var isSyncProject = $('#edit-project-sync-option').attr('checked') ? true : false;
      $('#edit-project-sync-option').removeAttr('checked');
      $('#edit-project-sync-option').removeAttr('disabled');
    
      // Persist input
      var project = _.project;
      project.name = projectName;
      project.sync = isSyncProject;
      
      Project.save(project, true);
      
      $('#project-name').text(project.name);
      $('#edit-project-name').val('');      
      
      $('#project-menu-' + project.id).text(project.name);
      
      $('.edit-project-name').removeClass('error');
      $('#project-name-help').text('');
      
      var iteration = Iteration.get(_.project.currentIteration());
      iteration.name = iterationName;
      Iteration.save(iteration, true);
      
      $('#iteration-name').text(iteration.name);
      $('#edit-iteration-name').val('');
      
      $('.edit-iteration-name').removeClass('error');
      $('#iteration-name-help').text('');
      
      $('#edit-board-modal').hide();
      
      $('#share-user-list-input').attr('disabled', true);
      $('#share-user-list-input').val('');
      $('.share-user-list-icon').remove();
      
      $('#edit-board-save-button').attr('href', '#board/save');
      
      window.location.hash = '';
    } else {
    
      if (!projectPass) {
        $('.edit-project-name').addClass('error');
        $('#project-name-help').text('Project name can contains only alphabet' +
                                     ', numeric or white space');
      }
      
      if (!iterationPass) {
        $('.edit-iteration-name').addClass('error');
        $('#iteration-name-help').text('Iteration name can contains only alphabet' +
                                       ', numeric or white space');
      }
      
      $('#edit-board-save-button').attr('href', '#board/save?'+ (new Date()).getTime());
    
    }
    
  },
  
  // User controllers
  'user/login': function(hash) {
    var hashes = hash.split('/');
    now.user(hashes[2], function (data) {
      
      if (!data.error) {
        $('.project-list-menu-item').remove();
      
        $('#logged-in-menu').css('display', 'block');
        $('#logged-out-menu').hide();
        
        $('#sync-status').text('Syncing');
      
        var user = data.user;
        
        // Sync user.  
        var anonymous = _.user;  
        User.remove(anonymous.id);
        
        var joinGroups = [];
        joinGroups.push(user.id);
        
        // New user
        if (!user.defaultProject) {
          user.defaultProject = anonymous.defaultProject;
          user.projects = anonymous.projects;
          
          var projects = user.projects;
          var pushProjects = [];
          
          for (var key in projects) {
            var project = Project.get(projects[key]);
            
            if (project) {
            
              var list = _.tmpl('project_list', project);
              $('#projects-list-menu').append(list);
            
              if (project.id == user.defaultProject && !project.sync) {
                project.sync = true;
              }
              
              if (project.sync) {
                joinGroups.push(project.id);
              
                // Prepare iteration sync to server
                var iterations = project.iterations;
                for (var key in iterations) {
                  var iteration = Iteration.get(iterations[key]);
                  if (iteration) {
                  
                    joinGroups.push(iteration.id);
                  
                    iteration.owner = user.id;
                    Iteration.save(iteration, true);
                    
                    var tasks = iteration.tasks;
                    var pushTasks = [];
                    for (var key in tasks) {
                      var task = Task.get(key);
                      if (task) {
                        pushTasks.push(task);
                      }
                      
                    }
                    
                    now.syncModels(_.client, 'task', { owner: iteration.id } , pushTasks);
                    
                  }
                  
                }
              }
              
              project.owner = user.id;
              Project.save(project, true);
              
            }
            
          }
                    
        }
        
        User.save(user, true);
        
        for (var key in data.projects) {
          var project = data.projects[key];
          Project.save(project);
          
          var list = _.tmpl('project_list', project);
          $('#projects-list-menu').append(list);
          
          joinGroups.push(project.id);
        }
        
        for (var key in data.iterations) {
          var iteration = data.iterations[key];
          Iteration.save(iteration);
          
          var list = _.tmpl('iteration_list', iteration);
          $('#iterations-list-menu').append(list);
          
          joinGroups.push(iteration.id);
        }
        
        for (var key in data.tasks) {
          var task = data.tasks[key];
          Task.save(task);
        }
        
        _.user = User.get(user.id);
        _.project = Project.get(_.user.defaultProject);
        
        var current = _.persistent.get('current');
        current.key = user.id;
        _.persistent.save(current);
        
        var iteration = Iteration.get(_.project.currentIteration());
        $('#project-name').text(_.project.name);
        $('#iteration-name').text(iteration.name);
        
        for (var taskID in iteration.tasks) {
        
          if (iteration.tasks[taskID]) {
            var task = Task.get(taskID);
            if (task && !task.delete) {
              $('#' + task.status).append(_.tmpl('task', task));
              $('#' + task.id).attr('draggable', true);
            }
              
          }
            
        }
        
        now.joinGroups(_.client, joinGroups, function() {
          $('#logged-in-status').css('display', 'block');
          
          $('#logged-in-user').text(user.username);
          $('#logged-in-image').attr('src', user.image);
          
          $('#notification-menu').show();
          $('#sync-status').text('Online');
        });
        
        // Fetch notifications
        now.fetchNotifications(_.user.id, function (status) {
          if (!status.error) {
          
            console.log (status);
          
            _.notifications = [];
            
            var notifications = status.data;
            notifications.reverse();
            _.notifications = _.notifications.concat(notifications);
            
            $('.notification-list-item').remove();
            
            if (_.notifications.length > 0) {
              for (var index in _.notifications) {
                var notification = _.notifications[index];
                if (notification.type == 'invite') {
                  $('#notification-list').append(_.tmpl('notification_list', 
                    { action: 'share/invite/show/' + index,
                      message: notification.from + 
                               ' invite you to join ' + 
                               notification.project }));
                }
              }
              
              $('#notification-list').append('<li class="divider notification-list-item"></li>');
              $('#notification-list').append('<li class="notification-list-item">' +
                '<a href="#share/all">See all notifications</a></li>');
                
              $('#notification-status').addClass('alert');
              $('#notification-status').text(_.notifications.length);
            } else {
              $('#notification-list').append(_.tmpl('notification_list', 
                { action: '', message: 'No notification'}));
              $('#notification-status').removeClass('alert');
            }
            
          }
        });
        
        window.location.hash = '';
        
      }
    });
    
  },
  'user/logout': function() {
    $('#logout-modal').show();
  },
  'user/logout/confirm': function() {
    _.persistent.clear();
    location.reload();
  },
  
  // Default state
  '': function() {
    $('#new-task-detail').val('');
    $('#edit-task-detail').val('');
    $('#edit-task-save-button').attr('href', '');
    $('#edit-iteration-name').val('');
    $('#edit-project-name').val('');
    $('#new-project-name').val('');
    
    $('.edit-task-detail').removeClass('error');
    $('#edit-task-help').text('');
    $('#edit-task-save-button').attr('href', '#task/save');
    
    $('.new-task-detail').removeClass('error');
    $('#new-task-help').text('');
    $('#new-task-save-button').attr('href', '#task/save');
    
    $('.edit-project-name').removeClass('error');
    $('#project-name-help').text('');
    $('#new-project-sync-option').removeAttr('checked');
    $('#new-project-sync-option').removeAttr('disabled');
    
    $('.edit-iteration-name').removeClass('error');
    $('#iteration-name-help').text('');
    
    $('#edit-board-save-button').attr('href', '#board/save');
    
    $('#clear-task-modal').hide();
    $('#new-task-modal').hide();
    $('#edit-task-modal').hide();
    
    $('#end-iteration-modal').hide();
    $('#new-project-modal').hide();

    $('#edit-board-modal').hide();
    $('#edit-project-sync-option').removeAttr('checked');
    $('#edit-project-sync-option').removeAttr('disabled');
    
    $('#share-user-list-input').attr('disabled', true);
    $('#share-user-list-input').val('');
    $('.share-user-list-icon').remove();
    
    $('#logout-modal').hide();
    
    $('#update-modal').hide();
  }
}