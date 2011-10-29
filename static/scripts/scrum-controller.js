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
        
        var task = Task.create(taskDetail, true);
        iteration.addTask(task);
        Iteration.save(iteration);
        
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
      Iteration.save(iteration);
      
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
        $('.task').attr('draggable', true);
      } else {
        // Hide new task and end iteration button
        $('#iteration-actions').hide();
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
      user.defaultProject = id;
      User.save(user);
      
      _.project = user.defaultProject;
      
      var project = Project.get(user.defaultProject);
      var iteration = Iteration.get(project.currentIteration());
      
      $('.task').remove();
      
      $('#project-name').text(project.name);
      $('#iteration-name').text(iteration.name);
      
      _.table['iteration/show']('#iteration/show/' + iteration.id);
      
      if (_.project.sync && !navigator.onLine && !now.endIteration) {
        $('#end-iteration-button').attr('disabled', true);
      } else {
        $('#end-iteration-button').removeAttr('disabled');
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
      
      $('.new-project-name').addClass('error');
      $('#new-project-help').text('Project name can contains only alphabet' +
                                  ', numeric or white space');
      $('#new-project-save-button').attr('href', '#project/save?' + new Date().getTime());
      
      if (_.project.sync && !navigator.onLine && !now.endIteration) {
        $('#end-iteration-button').attr('disabled', true);
      } else {
        $('#end-iteration-button').removeAttr('disabled');
      }
    
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
    
    if (project.sync) {
      $('#edit-project-sync-option').attr('checked', true);
      $('#edit-project-sync-option').attr('disabled', true);
    }
    
    var iteration = Iteration.get(_.project.currentIteration());
    $('#edit-iteration-name').val(iteration.name);
    $('#edit-iteration-name').focus();
    
    var input = $('#edit-iteration-name')[0];
    input.setSelectionRange(0, iteration.name.length);
    
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
      
      Project.save(project);
      
      $('#project-name').text(project.name);
      $('#edit-project-name').val('');      
      
      $('.edit-project-name').removeClass('error');
      $('#project-name-help').text('');
      
      var iteration = Iteration.get(_.project.currentIteration());
      iteration.name = iterationName;
      Iteration.save(iteration);
      
      $('#iteration-name').text(iteration.name);
      $('#edit-iteration-name').val('');
      
      $('.edit-iteration-name').removeClass('error');
      $('#iteration-name-help').text('');
      
      $('#edit-board-modal').hide();
      
      $('#edit-board-save-button').attr('href', '#board/save');
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
        var user = data.user;
        var projects = data.projects;
      
        $('#logged-in-status').css('display', 'block');
      
        // Sync user.
        $('#logged-in-menu').css('display', 'block');
        $('#logged-out-menu').hide();
        
        $('#logged-in-user').text(user.username);
        $('#logged-in-image').attr('src', user.image);
          
        var anonymous = _.user;  
        User.remove(anonymous.id);
        
        // New user
        if (!user.defaultProject) {
          user.defaultProject = anonymous.defaultProject;
          user.projects = anonymous.projects;
          
          var projects = user.projects;
          var pushProjects = [];
          var pushIterations = [];
          var pushTasks = [];
          
          for (var key in projects) {
            var project = Project.get(projects[key]);
            if (project.id == user.defaultProject && !project.sync) {
              project.sync = true;
            } else if (project.sync) {
              pushProjects.push(project);
            }
            
            project.owner = user.id;
            Project.save(project);
          }
          
          // Push projects to server
          now.syncProjects(pushProjects);
          
          // Push iterations to server
          
        }
        
        User.save(user);
        
        for (var key in projects) {
          var project = projects[key];
          Project.save(project);
        }
        
        _.user = User.get(user.id);
        
        var current = _.persistent.get('current');
        current.key = user.id;
        _.persistent.save(current);
        
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
    
    $('#logout-modal').hide();
    
    $('#update-modal').hide();
  }
}