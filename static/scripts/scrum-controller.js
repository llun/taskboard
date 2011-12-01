// Route table
_.table = {
  // Task controllers
  'task/new': function() {
    $('#new-task-detail').val('');
    
    $('.new-task-detail').removeClass('error');
    $('#new-task-help').text('');
    $('#new-task-save-button').attr('href', '#task/create');
  
    $('#new-task-modal').show();
    $('#new-task-detail').focus();
  },
  'task/edit': function(hash) {
    $('#edit-task-detail').val('');
    $('#edit-task-save-button').attr('href', '');
  
    $('.edit-task-detail').removeClass('error');
    $('#edit-task-help').text('');
    $('#edit-task-save-button').attr('href', '#task/save');

    var id = null;    
    var matches = hash.match(/[0-9a-fA-F-]{36}/);
    if (matches) {
      id = matches[0];
    }
    
    if (id && _.iteration == _.project.currentIteration()) {
      $('#edit-task-modal').show();
      var task = Task.get(id);
      
      var value = task.getDetail(true);
      $('#edit-task-detail').val(value);
      $('#edit-task-detail').focus();
      
      var textArea = $('#edit-task-detail').get(0);
      textArea.setSelectionRange(value.length, value.length);
      
      $('#edit-task-save-button').attr('href', '#task/save/' + id);
      
    } else {
      window.location.hash = '';
    }
    
  },
  'task/create': function() {
    // Save new task
    // Store it to local memory and render new task in todo
    var taskDetail = $('#new-task-detail').val();
    taskDetail = taskDetail.replace(/^\s+|\s+$/, '');
    
    if (taskDetail.length > 0) {
    
      var iteration = Iteration.get(_.project.currentIteration());
      
      var task = Task.create(iteration.id, taskDetail, true);
      iteration.addTask(task);
      Iteration.save(iteration, true);
      
      console.log ('client(create): ' + task.id + ', ' + task.status + ', ' + task.detail);

      // Clear form and close
      $('#new-task-modal').hide();
      new TaskView(task).append('#todo').update();
              
    } else {
    
      $('.new-task-detail').addClass('error');
      $('#new-task-help').text('Task detail cannot empty');
      $('#new-task-save-button').attr('href', '#task/create?' + new Date().getTime());
    
    }
  },
  'task/save': function(hash) {
    
    var matches = hash.match(/[0-9a-fA-F-]{36}/);
    var id = matches[0];
    
    // Validate value
    var taskDetail = $('#edit-task-detail').val();
    taskDetail = taskDetail.replace(/^\s+|\s+$/,'');
    
    if (taskDetail.length > 0) {
    
      // Save old task
      var task = Task.get(id);
      task.setDetail(taskDetail);
      Task.save(task, true);
      
      console.log ('client(update): ' + task.id + ', ' + task.status + ', ' + task.detail);
      
      $('#edit-task-modal').hide();
      
      
      // Find the way to use view.
      new TaskView(task).update();
      
    } else {
    
      $('.edit-task-detail').addClass('error');
      $('#edit-task-help').text('Task detail cannot empty');
      $('#edit-task-save-button').attr('href', '#task/save/' + id + '?' + new Date().getTime());
    
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
  
  // Iteration controllers
  'iteration/show': function(hash) {
  
    var id = null;    
    var matches = hash.match(/[0-9a-fA-F-]{36}/);
    if (matches) {
      id = matches[0];
    }
    
    if (id) {
    
      var isCurrent = id == _.project.currentIteration();
      _.iteration = id;
    
      $('.task').remove();
      var iteration = Iteration.get(id);
      for (var taskID in iteration.tasks) {
  
        if (iteration.tasks[taskID]) {
          var task = Task.get(taskID);
          if (task) {
            new TaskView(task).append('#' + task.status).update();
          }
  
        }
  
      }
      
      $('#iteration-name').text(iteration.name);
      
      if (isCurrent) {
        // Show new task and end iteration button
        $('#iteration-actions').show();
        $('#iteration-name-edit').show();
        $('.task').attr('draggable', true);
      } else {
        // Hide new task and end iteration button
        $('#iteration-actions').hide();
        $('#iteration-name-edit').hide();
        $('.task-actions').hide();
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
  'iteration/edit': function (hash) {
    $('.edit-iteration-name').removeClass('error');
    $('#iteration-name-help').text('');
  
    $('#edit-iteration-modal').show();
    
    var iteration = Iteration.get(_.project.currentIteration());
    $('#edit-iteration-name').val(iteration.name);
    $('#edit-iteration-name').focus();
    
    var input = $('#edit-iteration-name')[0];
    input.setSelectionRange(0, iteration.name.length);
  },
  'iteration/save': function () {
  
    // Validate input
    var pattern = /^[\w\d ]+$/i;
    var name = $('#edit-iteration-name').val();
    
    if (pattern.test(name)) {    
      var iteration = Iteration.get(_.project.currentIteration());
      iteration.name = name;
      Iteration.save(iteration);
      
      $('#iteration-name').text(name);
      $('#iteration-menu-' + iteration.id).text(name);
    
      $('#edit-iteration-modal').hide();
    } else {
      $('.edit-iteration-name').addClass('error');
      $('#iteration-name-help').text('Iteration name can contains only alphabet' +
                                     ', numeric or white space');
                                     
      $('#edit-iteration-save-button').attr('href', 
                                            '#iteration/save?'+ (new Date()).getTime());
    }    
    
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
      if (user.anonymous || 
          (!user.anonymous && project.sync) &&
          project.owner == user.id) {
        user.defaultProject = id;
        User.save(user, true);
      } 
      
      var iteration = Iteration.get(project.currentIteration());
      
      _.project = project;
      
      $('.task').remove();
      
      $('.project-name').text(project.name);
      $('#iteration-name').text(iteration.name);
      
      _.table['iteration/show']('#iteration/show/' + iteration.id);
      
      if (_.project.sync && !navigator.onLine && !now.endIteration) {
        $('#end-iteration-button').attr('disabled', true);
      } else {
        $('#end-iteration-button').removeAttr('disabled');
      }
      
      if ((_.project.owner != user.id)) {
        $('#end-iteration-button').attr('disabled', true);
        $('#project-edit').hide();
        $('#iteration-name-edit').hide();
        
        if (!now.syncModel) {
          $('#new-task-button').attr('disabled', true);
          $('.task').removeAttr('draggable');
          $('.task-action').hide();
        }
      } else {
        $('#project-edit').show();
        $('#iteration-name-edit').show();
      }
      
      $('.iteration-list-menu-item').remove();
      var iterations = _.project.iterations.slice(0).reverse();
      for (var index in iterations) {
        var iteration = Iteration.get(iterations[index]);
        var list = _.tmpl('iteration_list', iteration);
        $('#iterations-list-menu').append(list);
      }
    
    }
  
  },
  'project/new': function () {
    $('#new-project-name').val('');
    $('#new-project-sync-option').removeAttr('checked');
    $('#new-project-sync-option').removeAttr('disabled');
    
    $('.new-project-name').removeClass('error');
    $('#new-project-help').text('');
    
    $('#new-project-save-button').attr('href', '#project/create');
    
    $('#new-project-modal').show();
  },
  'project/edit': function () {
    $('.edit-project-name').removeClass('error');
    $('#project-name-help').text('');
    
    $('#edit-project-save-button').attr('href', '#project/save');
    
    $('#edit-project-sync-option').removeAttr('checked');
    $('#edit-project-sync-option').attr('disabled', true);
    $('#share-user-list-input').attr('disabled', true);
    $('#share-user-list-input').val('');
    $('.share-user-list-icon').remove();
    
    if (!_.user.anonymous) {
      $('#edit-project-sync-option').removeAttr('disabled');
    }
    
    $('#edit-project-modal').show();
    
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
    
    var input = $('#edit-project-name')[0];
    input.setSelectionRange(0, project.name.length);
  },
  'project/create': function () {
    var name = $('#new-project-name').val();
    var isSync = $('#new-project-sync-option').attr('checked') ? true : false;
    
    var pattern = /^[\w\d ]+$/;
    if (pattern.test(name)) {
    
      _.user.createProject(name, isSync);
      
      $('.project-list-menu-item').remove();
      $('.share-project-list-menu-item').remove();
      $('.project-list-menu-divider').remove();
      
      $('#projects-list-menu').append('<li class="divider project-list-menu-devider"></li>');
      for (var index in _.user.projects) {
        var projectID = _.user.projects[index];
        var project = Project.get(projectID);
        
        var list = _.tmpl('project_list', project);
        $('#projects-list-menu').append(list);
      }
      
      if (_.shareProjects && _.shareProjects.length > 0) {
        $('#projects-list-menu').append('<li class="divider project-list-menu-devider"></li>');
        
        for (var index in _.shareProjects) {
          var project = Project.get(_.shareProjects[index]);
          var list = _.tmpl('share_project_list', project);
          $('#projects-list-menu').append(list);
        }
      }
      
      
      $('#new-project-modal').hide();      
      $('#new-project-save-button').attr('href', '#project/create?' + new Date().getTime());
      
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
      $('#new-project-save-button').attr('href', '#project/create?' + new Date().getTime());
    
    }
    
  },
  'project/save': function () {
    // Validate input
    var pattern = /^[\w\d ]+$/i;
    var name = $('#edit-project-name').val();
    
    if (pattern.test(name)) {
    
      var isSyncProject = $('#edit-project-sync-option').attr('checked') ? true : false;
    
      // Persist input
      var project = _.project;
      project.name = name;
      project.sync = isSyncProject;
      
      Project.save(project, true);
      
      $('.project-name').text(project.name);
      $('#project-menu-' + project.id).text(project.name);
      
      $('#edit-project-modal').hide();
      
      window.location.hash = '';
    } else {
      $('.edit-project-name').addClass('error');
      $('#project-name-help').text('Project name can contains only alphabet' +
                                   ', numeric or white space');
                                   
      $('#edit-project-save-button').attr('href', '#project/save?'+ (new Date()).getTime());
    }
    
  },
  
  // Update controllers
  'update/ready': function() {
    $('#update-modal').show();
  },
  'update/confirm': function() {
    $('#update-modal').hide();
    
    applicationCache.swapCache();
    window.location.reload();
  },
  
  // User controllers
  'user/private/show': function(hash) {
    var fragments = hash.split('/');
    var service = fragments[3];
    
    $('#loginForm').attr('action', '/oauth/' + service);
    $('#invite').val('');
    $('#login-modal').show();
  },
  
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
        $('.project-name').text(_.project.name);
        $('#iteration-name').text(iteration.name);
        
        for (var taskID in iteration.tasks) {
        
          if (iteration.tasks[taskID]) {
            var task = Task.get(taskID);
            if (task && !task.delete) {
              new TaskView(task).append('#' + task.status).update();
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
        
        // Fetch share projects
        now.shares(_.user.id, function (output) {
          console.log (output);
          _.shareProjects = [];
          
          var joinShareList = [];
        
          var projects = output.projects;
          var iterations = output.iterations;
          var tasks = output.tasks;
          
          for (var index in projects) {
            _.shareProjects.push(projects[index].id);
            Project.save(projects[index]);
            
            joinShareList.push(projects[index].id);
          }
          
          for (var index in iterations) {
            Iteration.save(iterations[index]);
            
            joinShareList.push(iterations[index].id);
          }
          
          for (var index in tasks) {
            Task.save(tasks[index]);
          }
          
          if (_.shareProjects.length > 0) {
            $('#projects-list-menu').append('<li class="divider project-list-menu-devider"></li>');
            
            for (var index in _.shareProjects) {
              var project = Project.get(_.shareProjects[index]);
              var list = _.tmpl('share_project_list', project);
              $('#projects-list-menu').append(list);
            }
          }
          
          now.joinGroups(_.client, joinShareList);
          
        });
        
        // Fetch notifications
        now.fetchNotifications(_.user.id, function (status) {
          if (!status.error) {
          
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
                    { index: index,
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
  
  // Board action
  'board/table': function (hash) {
    $('#table-menu').addClass('active');
    $('#story-menu').removeClass('active');
  
    $('#table-view').show();
    $('#story-view').hide();
  },
  
  'board/story': function (hash) {
    $('#table-menu').removeClass('active');
    $('#story-menu').addClass('active');
    
    $('#table-view').hide();
    $('#story-view').show();
  },
  
  // Share
  'share/remove': function (hash) {
    var hashes = hash.split('/');
  
    var project = hashes[2];
    var user = hashes[3];
    
    now.kick(project, user, function (status) {
      
      var project = status.project;
      Project.save(project);
      
      $('#share-' + status.user).remove();
      
    });
    
  },
  
  // Default state
  '': function() {    
    $('.application-modal').hide();
    $('.task-modal').hide();
    
    window.location.hash = '';
  }
}