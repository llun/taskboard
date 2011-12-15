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
      
      $('#edit-task-status').val(task.status);
      
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
      
      var task = Task.create(iteration.id, taskDetail, Task.status.TODO, true);
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
      task.status = $('#edit-task-status').val();
      
      Task.save(task, true);
      
      var project = _.project;
      var iteration = Iteration.get(_.project.currentIteration());
      if (task.status == 'pending') {
        // Move to pending tasks
        delete iteration.tasks[task.id];
        project.pendings[task.id] = true;
      } else {
        // Move to current iteration tasks
        delete project.pendings[task.id];
        iteration.tasks[task.id] = true;
      }
      
      Project.save(project, true);
      Iteration.save(iteration, true);
      
      console.log ('client(update): ' + task.id + ', ' + task.status + ', ' + task.detail);
      
      $('#edit-task-modal').hide();
      
      $('#' + task.id).remove();
      new TaskView(task).append('#' + task.status).update();
      
    } else {
    
      $('.edit-task-detail').addClass('error');
      $('#edit-task-help').text('Task detail cannot empty');
      $('#edit-task-save-button').attr('href', '#task/save/' + id + '?' + new Date().getTime());
    
    }
    
  },
  'task/remove': function(hash) {
    
    var id = null;    
    var matches = hash.match(/[0-9a-fA-F-]{36}/);
    if (matches) {
      id = matches[0];
    }
    
    if (id) {
      
      $('#remove-task').val(id);
      $('#delete-task-modal').show();
      
    }
    
  },
  'task/remove/confirm': function() {
    
    var id = $('#remove-task').val();
    
    if (id) {

      var task = Task.get(id);
      
      Task.remove(id, true);
      if (task.owner == _.project.id) {
        var project = _.project;
        delete project.pendings[id];
        
        Project.save(project, true);
      } else {
        var iteration = Iteration.get(task.owner);
        
        iteration.removeTask(id);
        Iteration.save(iteration, true);
      }
    
      console.log ('client(remove): ' + id);
      
      $('#' + id).remove();
      $('#remove-task').val('');
      
      window.location.hash = '';
      
    }
    
  },
  
  // Pending controllers
  'pending/new': function (hash) {
    $('#new-pending-task-detail').val('');
    
    $('.new-pending-task-detail').removeClass('error');
    $('#new-pending-task-help').text('');
    $('#new-pending-task-save-button').attr('href', '#pending/create');
  
    $('#new-pending-task-modal').show();
    $('#new-pending-task-detail').focus();
  },
  
  'pending/create': function (hash) {
    // Save new task
    // Store it to local memory and render new task in pending
    var taskDetail = $('#new-pending-task-detail').val();
    taskDetail = taskDetail.replace(/^\s+|\s+$/, '');
    
    if (taskDetail.length > 0) {
    
      // Keep project model compatible
      var project = _.project;
      if (!project.pendings) {
        project.pendings = {};
      }
      
      var task = Task.create(project.id, taskDetail, Task.status.PENDING, true);
      
      project.pendings[task.id] = true;
      Project.save(project, true);
      
      // Clear form and close
      $('#new-pending-task-modal').hide();
      new TaskView(task).append('#' + task.status).update();
              
    } else {
    
      $('.new-pending-task-detail').addClass('error');
      $('#new-pending-task-help').text('Task detail cannot empty');
      $('#new-pending-task-save-button').attr('href', '#pending/create?' + new Date().getTime());
    
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
      
      $('.search').val('Search');
    
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
        $('.task').removeAttr('draggable');
        
        $('.task-actions').hide();
      }
      
    }
    
  },
  'iteration/end': function() {
    $('#end-iteration-modal').show();
  },
  'iteration/end/confirm': function() {
    _.project.endIteration();
    
    var iteration = Iteration.get(_.project.currentIteration());
    
    $('.task').remove();
    for (var taskID in iteration.tasks) {
    
      if (iteration.tasks[taskID]) {
        var task = Task.get(taskID);
        if (task && !task.delete) {
          new TaskView(task).append('#' + task.status).update();
        }
        
      }
      
    }
    
    $('#iteration-name').text(iteration.name);
    
    new IterationsMenuView(_.project).renders('#iterations-list-menu');
    
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
      
      new IterationsMenuView(_.project).renders('#iterations-list-menu');
    
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
    
    $('#edit-project-default-option').removeAttr('checked');
    $('#edit-project-default-option').attr('disabled', true);
    
    $('#edit-project-sync-option').removeAttr('checked');
    $('#edit-project-sync-option').attr('disabled', true);
    $('#share-user-list-input').attr('disabled', true);
    $('#share-user-list-input').val('');
    $('.share-user-list-icon').remove();
    
    $('#edit-project-modal').show();
    
    var project = _.project;
    
    if (!_.user.anonymous) {
      $('#edit-project-sync-option').removeAttr('disabled');
    } 
    
    if (_.user.anonymous || project.owner == _.user.id) {
      $('#edit-project-default-option').removeAttr('disabled');
    }
    
    if (_.user.defaultProject == project.id) {
      $('#edit-project-default-option').attr('disabled', true);
      $('#edit-project-default-option').attr('checked', true);
    }
    
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
    
      var createdProject = _.user.createProject(name, isSync);
      
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

      window.location.hash = '#project/show/' + createdProject.id;
      
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
      var isDefaultProject = $('#edit-project-default-option').attr('checked') ? true : false;
      
      // Persist input
      var project = _.project;
      project.name = name;
      project.sync = isSyncProject;
      
      Project.save(project, true);
      
      if (isDefaultProject) {
        var user = _.user;
        user.defaultProject = project.id;
        
        User.save(user, true);
      }
      
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
            
              if (project.id == user.defaultProject && !project.sync) {
                project.sync = true;
              }
              
              if (project.sync) {
              
                // Prepare iteration sync to server
                var iterations = project.iterations;
                for (var key in iterations) {
                  var iteration = Iteration.get(iterations[key]);
                  if (iteration) {
                  
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
        }
        
        for (var key in data.iterations) {
          var iteration = data.iterations[key];
          Iteration.save(iteration);
        }
        
        for (var key in data.tasks) {
          var task = data.tasks[key];
          Task.save(task);
        }
        
        var current = _.persistent.get('current');
        current.key = user.id;
        _.persistent.save(current);
        
        window.location.href = '/';
        
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
  'board/task': function (hash) {
    $('#table-menu').addClass('active');
    $('#pending-menu').removeClass('active');
  
    $('#table-view').show();
    $('#pending-view').hide();
  },
  
  'board/pending': function (hash) {
    $('#table-menu').removeClass('active');
    $('#pending-menu').addClass('active');
    
    $('#table-view').hide();
    $('#pending-view').show();
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