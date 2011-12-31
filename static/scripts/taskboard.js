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
  _.iteration = _.project.currentIteration();
  
  var iteration = Iteration.get(_.project.currentIteration());
  for (var taskID in iteration.tasks) {

    if (iteration.tasks[taskID]) {
      var task = Task.get(taskID);
      if (task && !task.delete) {
        new TaskView(task).append('#' + task.status).update();
      }
      
    }
    
  }
  
  for (var pendingID in _.project.pendings) {
    if (_.project.pendings[pendingID]) {
      var task = Task.get(pendingID);
      if (task && !task.delete) {
        new TaskView(task).append('#pending').update();
      }
    }
  }
  
  _.shareProjects = [];

  $('.project-name').text(_.project.name);
  $('#iteration-name').text(iteration.name);
  
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
      
      if (!_.user.anonymous) {
        var responders = task.getResponders();
        var found = false;
        
        for (var index in responders) {
          var responder = responders[index];
          if ('+' + _.user.username == responder) {
            
            found = true;
            break;
          }
        }
        
        if (found) {
          $('#' + task.id).addClass('own');
        } else {
          $('#' + task.id).removeClass('own');
        }
      }
      
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
    
  // Notification
  $('.notification-list-item.btn').live({
    click: function notificationaction(event) {
      var index = parseInt($(event.target).attr('index'));
      var type = $(event.target).attr('type');
      
      console.log (index + ', ' + type);
      
      if (now.accept && now.reject) {
        
        var notification = _.notifications[index];
        if (notification.type == 'invite') {
        
          notification.index = index;
          now[type](notification, function invite(output) {
          
            var index = output.input.index;
            
            var front = _.notifications.slice(0, index);
            var tail = _.notifications.slice(index+1);
                  
            _.notifications = front.concat(tail);
            new NotificationsView(_.notifications).renders('#notification-list');
            
            if (type == 'accept') {
              var project = output.data.project;
              var iterations = output.data.iterations;
              var tasks = output.data.tasks;
              
              var joinShareList = [ project.id ];
              
              Project.save(project);
              _.shareProjects.push(project.id);
              
              for (var index in iterations) {
                var iteration = iterations[index];
                Iteration.save(iteration);
                
                joinShareList.push(iteration.id);
              }
              
              for (var index in tasks) {
                var task = tasks[index];
                Task.save(task);
              }
              
              now.joinGroups(_.client, joinShareList);
              
              new ProjectsMenuView(_.user.projects, _.shareProjects).renders('#projects-list-menu');
              
            }
          
          });
        
        }
        
      }
      
    }
  });
  
  // Global esc
  $(document).keyup(function documentkeyup(event) {
    if (event.keyCode === 27) {
      _.table['']();
    }
  });
  
  // Search
  var _filterFunction = function () {
    var searchText =  $(event.target).val();
    searchText = searchText.replace(/^\s+|\s+$/, '').replace(/\\/g, '\\\\')
                           .replace(/\+/g, '\\+').replace(/\*/g, '\\*')
                           .replace(/\(/g, '\\(').replace(/\)/g, '\\)')
                           .replace(/\[/g, '\\[').replace(/\]/g, '\\]')
                           .replace(/\./g, '\\.').replace(/\|/g, '\\|')
                           .replace(/\^/g, '\\^').replace(/\$/g, '\\$')
                           .replace(/\?/g, '\\?').replace(/\!/g, '\\!')
                           .replace(/\=/g, '\\=').replace(/\,/g, '\\,');

    var pattern = new RegExp(searchText, 'i');
    var iteration = Iteration.get(_.iteration);
    for (var taskID in iteration.tasks) {
      var task = Task.get(taskID);
      if (task) {
        var detail = task.getDetail(true);
        if (pattern.test(detail)) {
          $('#' + task.id + '_detail').html(task.getDetail(false, searchText));
          $('#' + task.id).show();
        } else {
          $('#' + task.id).hide();
        }
      }
    }
  }
  
  $('#search').focus(function searchfocus(event) {
    $(event.target).val('');
    _filterFunction()
  }).focusout(function searchfocusout(event) {
    var searchText =  $(event.target).val().replace(/^\s+|\s+$/, '');
    _filterFunction()
    
    if (searchText.length == 0) {
      $(event.target).val('Search');
    }
  }).keyup(_filterFunction).change(_filterFunction);
  
  $('#share-user-list-input').keyup(function sharekeyup(event) {
    if (event.keyCode === 13) {
      var to = $('#share-user-list-input').val();
      var from = _.user.username;
      var project = _.project.id;
      
      now.invite(from, to, project, function gotinvite(status) {
        var member = { username: status.who, status: 'invited' };
        _.project.members.push(member);
        Project.save(_.project, true);
        
        member.id = _.project.id;
        $('#share-user-list-icons').append(_.tmpl('share_list', member));
      });
    
      $('#share-user-list-input').val('');
    }
  });
  
  $('.modal').submit(function (event) {
    if (event.target.action.length == 0) {
      return false;
    }
  });
  
  // Board actions
  $('#new-task-button').click (function () {
    window.location.hash = '#task/new';
  });
  
  $('#end-iteration-button').click (function () {
    window.location.hash = '#iteration/end';
  });

  // Update event
  $(applicationCache).bind('updateready', function updateready(e) {
    if (applicationCache.status == applicationCache.UPDATEREADY) {
      window.location.hash = 'update/ready';
    }
  });
  
  // Sync data to server if online
  if (navigator.onLine) {
    now.ready(function nowready() {
    
      if (!_.ready) {
        _.ready = true;
      } else {
        window.location.href = '/';
      }
    
      _.client = now.core.clientId;
    
      $('#logging-in-menu').hide();
      
      if (_.user.anonymous) {
        $('#logged-out-menu').css('display', 'block');
        
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
        new IterationsMenuView(_.project).renders('#iterations-list-menu');
        
        if (_.oldHash) {
          var shouldRedirectToOldHash = false;

          // Parse login
          if (/^#user\/login/i.test(_.oldHash)) {
            shouldRedirectToOldHash = true
          } 
          // Parse board
          else if (/^#board\/pending$/.test(_.oldHash)) {
            shouldRedirectToOldHash = true
          }
          // Parse show project
          else if (/^#project\/show/i.test(_.oldHash)) {
            shouldRedirectToOldHash = true
          }

          if (shouldRedirectToOldHash) {
            window.location.hash = _.oldHash;
          }

        }
      } else {
        
        var joinList = [];
        
        var syncpendings = function (project) {
          // Sync pendings
          var preparePendings = [];
          for (var key in project.pendings) {
            var task = Task.get(key);
            if (task) {
              preparePendings.push(Task.get(key));
            }
          }
          
          now.syncModels(_.client, 'task', { owner: project.id }, preparePendings, 
            function synctasks(object) {
              if (object.status == 'update') {

                var tasks = object.data;

                for (var key in tasks) {
                  var task = tasks[key];
                  Task.save(task);

                  if (object.owner == _.project.id &&
                      $('#' + task.id).length === 0) {
                    task = Task.get(task.id);

                    $('#' + task.status).append(_.tmpl('task', task));
                    $('#' + task.id).attr('draggable', true);
                  }
                }

                var removed = object.removed;
                for (var key in removed) {
                  _.persistent.remove(removed[key].id);
                }

              }
            });
        }
        
        // If user already login it should sync user.
        Step(
          function begin() {
            now.syncUser(_.user, this);
          },
          function syncuser(object) {

            $('#sync-status').text('Syncing');

            // How to handler error ?
            if (!object.error) {

              // Fetch notifications
              now.fetchNotifications(_.user.id, function fetchnotifications(status) {
                if (!status.error) {

                  _.notifications = [];

                  var notifications = status.data;
                  notifications.reverse();
                  _.notifications = _.notifications.concat(notifications);
                  new NotificationsView(_.notifications).renders('#notification-list');
                }
              });

              joinList.push(_.user.id);

              $('#logged-in-user').text(_.user.username);
              $('#logged-in-image').attr('src', _.user.image);

              $('#logged-in-menu').css('display', 'block');
              $('#logged-in-status').css('display', 'block');

              if (object.status == 'update') {
                var data = object.data;
                User.save(data);

                _.user = User.get(data.id);
              }

              // Prepare project need to sync
              var projects = _.user.projects;
              var prepareProject = [];

              for (var key in projects) {
                var project = Project.get(projects[key]);
                if (project && project.sync) {
                  prepareProject.push(project);
                  joinList.push(project.id);
                }

                // End of prepare project.
              }

              // Sync projects
              now.syncModels(_.client, 'project', { owner: _.user.id }, prepareProject, this);

            } else {

              _.persistent.clear();
              location.reload();

            }
          },
          function syncprojects(object) {

            if (object.status == 'update') {
              var projects = object.data;

              for (var key in projects) {
                var project = projects[key];
                Project.save(project);

                joinList.push(project.id);
              }

              var removed = object.removed;
              for (var key in removed) {
                _.persistent.remove(removed[key].id);
              }

            }

            var prepareIteration = [];
            // List projects
            var projects = _.user.projects;
            for (var index = 0; index < projects.length; index++) {
              var project = Project.get(projects[index]);
              if (project) {
                syncpendings(project);
                
                var iterations = project.iterations;
                for (var key in iterations) {
                  var iteration = Iteration.get(iterations[key]);
                  if (iteration) {
                    prepareIteration.push(iteration);
                    joinList.push(iteration.id);
                  }

                }

              }
              
            }

            // Fetch share projects
            now.shares(_.user.id, function fetchshares(output) {
              _.shareProjects = [];

              if (output.result) {
                var joinShareList = [];

                var projects = output.projects;
                var iterations = output.iterations;
                var tasks = output.tasks;

                for (var index in projects) {
                  _.shareProjects.push(projects[index].id);
                  Project.save(projects[index]);

                  joinShareList.push(projects[index].id);

                  syncpendings(projects[index]);
                }

                for (var index in iterations) {
                  Iteration.save(iterations[index]);

                  joinShareList.push(iterations[index].id);
                }

                for (var index in tasks) {
                  Task.save(tasks[index]);
                }
                
                now.joinGroups(_.client, joinShareList);
              }
              
              new ProjectsMenuView(_.user.projects, _.shareProjects).renders('#projects-list-menu');

            });

            // Sync iterations
            now.syncModels(_.client, 'iteration', { owner: _.user.id }, prepareIteration, this);
          },
          function synciterations(object) {
            if (object.status == 'update') {
              var iterations = object.data;

              for (var key in iterations) {
                var iteration = iterations[key];
                Iteration.save(iteration);

                joinList.push(iteration.id);
              }

              var removed = object.removed;
              for (var key in removed) {
                _.persistent.remove(removed[key].id);
              }
            }

            now.joinGroups(_.client, joinList);

            // List iterations
            var countSync = 0;
            var iterations = [];
            
            // List projects
            var projects = _.user.projects;
            for (var index = 0; index < projects.length; index++) {
              var project = Project.get(projects[index]);
              if (project) {
                iterations = iterations.concat(project.iterations);
              }
              
            }
            
            new IterationsMenuView(_.project).renders('#iterations-list-menu');
            
            for (var index = 0; index < iterations.length; index++) {
              var iteration = Iteration.get(iterations[index]);
              if (iteration) {

                var prepareTasks = [];
                var tasks = iteration.tasks;  
                for (var key in tasks) {
                  var task = Task.get(tasks[key]);
                  if (task) {
                    prepareTasks.push(task);
                  }
                }

                // Sync tasks
                now.syncModels(_.client, 'task', { owner: iteration.id }, prepareTasks, 
                  function synctasks(object) {
                    if (object.status == 'update') {
                      
                      var tasks = object.data;

                      for (var key in tasks) {
                        var task = tasks[key];
                        Task.save(task);

                        if (object.owner == _.project.currentIteration() &&
                            $('#' + task.id).length === 0) {
                          task = Task.get(task.id);

                          $('#' + task.status).append(_.tmpl('task', task));
                          $('#' + task.id).attr('draggable', true);
                        }
                      }

                      var removed = object.removed;
                      for (var key in removed) {
                        _.persistent.remove(removed[key].id);
                      }

                    }

                    countSync++;
                    if (countSync == iterations.length) {
                      $('#notification-menu').show();
                      $('#sync-status').text('Online');

                      if (_.oldHash) {
                        var shouldRedirectToOldHash = false;

                        // Parse login
                        if (/^#user\/login/i.test(_.oldHash)) {
                          shouldRedirectToOldHash = true
                        } 
                        // Parse board
                        else if (/^#board\/pending$/.test(_.oldHash)) {
                          shouldRedirectToOldHash = true
                        }

                        if (shouldRedirectToOldHash) {
                          window.location.hash = _.oldHash;
                        }

                      }
                    }
                  });

              } else {
                countSync++;
              }

            }
          });

      }
      
      $('#sync-status').text('Online');
      

      var create = {
        project: function (client, serverProject) {
          console.log ('server-debug(create): project - ' + 
                       serverProject.id + ', ' + 
                       serverProject.updated + ', ' +
                       serverProject.modified);
                     
          if (client != _.client) {
            Project.save(serverProject);
            now.joinGroups(_.client, [serverProject.id]);
            
            new ProjectsMenuView(_.user.projects, _.shareProjects).renders('#projects-list-menu');
          }
        },
        iteration: function (client, serverIteration) {
          console.log ('server-debug(create): iteration - ' + 
                       serverIteration.id + ', ' + 
                       serverIteration.updated + ', ' +
                       serverIteration.modified);
                       
          if (client != _.client) {
            Project.save(serverIteration);
            now.joinGroups(_.client, [serverIteration.id]);
            
            var list = _.tmpl('iteration_list', serverIteration);
            $('#iterations-list-menu').append(list);
          }
        },
        task: function (client, serverTask) {
          console.log ('server-debug(create): task - ' + serverTask.id);

          if (client != _.client) {
            Task.save(serverTask);

            var clientTask = Task.get(serverTask.id);
            if (clientTask.owner == _.project.currentIteration()) {
              new TaskView(clientTask).append('#' + clientTask.status).update();
            }
            
          }
        }
      }

      var update = {
        project: function (client, serverProject) {
          console.log ('server-debug(update): project - ' + 
                       serverProject.id + ', ' + 
                       serverProject.updated + ', ' +
                       serverProject.modified);
                       
          if (client != _.client) {
          
            if (serverProject.delete) {

              if (serverProject.owner == _.user.id) {
                var defaultProject = _.user.defaultProject;
                var projectIndex = _.user.projects.indexOf(serverProject.id);
                var head = _.user.projects.slice(0, projectIndex);
                var tail = _.user.projects.slice(projectIndex+1);

                var projects = head.concat(tail);
                _.user.projects = projects;
                if (projects.length == 0) {
                  // Create new project and mark it as default
                  var createdProject = _.user.createProject('Project 1', true);
                  _.user.defaultProject = createdProject.id;
                } else if (defaultProject == serverProject.id) {
                  // Change default project to the first project in list.
                  var defaultProject = projects[0];
                  _.user.defaultProject = defaultProject;
                }
                User.save(_.user, true);
              } else {
                var projects = _.shareProjects;
                
                var projectIndex = projects.indexOf(serverProject.id);
                
                var head = projects.slice(0, projectIndex);
                var tail = projects.slice(projectIndex+1);
                
                _.shareProjects = head.concat(tail);
              }

              // Delete project.
              _.persistent.remove(serverProject.id);

              // Change current view to default project.
              new ProjectsMenuView(_.user.projects, _.shareProjects).renders('#projects-list-menu');
              
              if (_.project.id == serverProject.id) {
                _.table['project/show']('#project/show/' + _.user.defaultProject);
              }
              
            } else {
              
              var clientProject = Project.get(serverProject.id);
              if (serverProject.updated > clientProject.updated ||
                  serverProject.modified != clientProject.modified) {
                Project.save(serverProject);
              }

              clientProject = Project.get(serverProject.id);
              $('#project-menu-' + clientProject.id).text(clientProject.name);

              if (_.project.id == clientProject.id) {

                $('.share-user-list-icon').remove();
                var members = clientProject.members;
                for (var index in members) {
                  var member = members[index];
                  member.id = clientProject.id;

                  $('#share-user-list-icons').append(_.tmpl('share_list', member));
                }

                $('.project-name').text(clientProject.name);
                _.project = clientProject;

                var iteration = Iteration.get(_.project.currentIteration());
                $('#iteration-name').text(iteration.name);

                $('.task').remove();
                for (var taskID in iteration.tasks) {

                  if (iteration.tasks[taskID]) {
                    var task = Task.get(taskID);
                    if (task && !task.delete) {
                      new TaskView(task).append('#' + task.status).update();
                    }

                  }

                }

              }
              
            }
          
          }
          
        },
        iteration: function (client, serverIteration) {
          console.log ('server-debug(update): iteration - ' + 
                       serverIteration.id + ', ' + 
                       serverIteration.updated + ', ' +
                       serverIteration.modified);
                       
          if (client != _.client) {
          
            var clientIteration = Iteration.get(serverIteration.id);
            if (serverIteration.updated > clientIteration.updated ||
                serverIteration.modified != clientIteration.modified) {
              Iteration.save(serverIteration);
            }
            
            clientIteration = Iteration.get(serverIteration.id);
            $('#iteration-menu-' + clientIteration.id).text(clientIteration.name);
            
            var currentIteration = Iteration.get(_.project.currentIteration());
            if (currentIteration.id == clientIteration.id) {
              $('#iteration-name').text(clientIteration.name);
            }
            
          }
        
        },
        task: function (client, serverTask) {
          console.log ('server-debug(update): task - ' + serverTask.id);

          if (client != _.client) {
          
            if (serverTask.delete) {
              Task.remove(serverTask.id);
              $('#' + serverTask.id).remove();
            } else {
              var clientTask = Task.get(serverTask.id);
            
              if (serverTask.updated > clientTask.updated ||
                  serverTask.modified != clientTask.modified) {
                Task.save(serverTask);
              }
              
              clientTask = Task.get(serverTask.id);
              if (clientTask.owner == _.project.currentIteration()) {
                $('#' + clientTask.id).remove();
                new TaskView(clientTask).append('#' + clientTask.status).update();
              }
            }
          
          }
          
        }
      }

      // Real-time synchronization
      now.clientCreate = function (client, type, serverModel) {
        var handler = create[type];
        if (handler) {
          handler(client, serverModel);
        }
      }

      now.clientUpdate = function (client, type, serverModel) {
        var handler = update[type];
        if (handler) {
          handler(client, serverModel);
        }
      }

      // User real-time synchronization
      now.updateUser = function (user) {
      
        console.log ('server-debug(update): user - ' + 
                     user.id + ', ' + 
                     user.updated);
      
        if (user.updated > _.user.updated) {    
          User.save(user);
          _.user = User.get(user.id);
        }
        
        _.project = Project.get(user.defaultProject);
        
        // Change iteration/project board name.
        $('.project-name').text(_.project.name);
        
        var iteration = Iteration.get(_.project.currentIteration());
        $('#iteration-name').text(iteration.name);
        
        $('.task').remove();
        for (var taskID in iteration.tasks) {
        
          if (iteration.tasks[taskID]) {
            var task = Task.get(taskID);
            if (task && !task.delete) {
              new TaskView(task).append('#' + task.status).update();
            }
              
          }
            
        }
        
      }

      // Kick function
      now.clientKick = function (project) {
        _.shareProjects = [];
        
        var target = -1;
        for (var index in _.shareProjects) {
          if (_.shareProjects[index] == project) {
            target = index;
            break;
          }
        }
        
        if (target >= 0) {
          var front = _.shareProjects.slice(0, target);
          var tail = _.shareProjects.slice(target + 1, _.shareProjects.length);
          
          _.shareProjects = front.concat(tail);
        }
        
        $('#project-list-' + project).remove();
        if (_.shareProjects.length == 0) {
          $('#share-project-divider').remove();
        }
      
        if (_.project.id == project) {
          window.location.hash = '#project/show/' + _.user.defaultProject;
        }
      }

      // Notify function
      now.notifyUser = function (notification) {
        console.log ('Someone notified us');
      
        _.notifications = [ notification ].concat(_.notifications);
        new NotificationsView(_.notifications).renders('#notification-list');
      }

    });
  } else {
  
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
    new IterationsMenuView(_.project).renders('#iterations-list-menu');
    
    // Update login menu
    $('#logging-in-menu').hide();
    if (_.user.anonymous) {
      $('#logged-out-menu').hide();
    } else {
      $('#logged-in-status').css('display', 'block');
      $('#logged-in-user').text(_.user.username);
    
      $('#logged-in-menu').css('display', 'block');
      $('#logged-in-menu-actions').remove();
      $('#user-icon').removeClass('dropdown-toggle');
      
      if (_.project.sync) {
        $('#end-iteration-button').attr('disabled', true);
      }
    }
    
  }
  
  // Online/Offline event
  $(window).bind('online', function online(e) {
    console.log ('Online');
    window.location.href = '/';
  });
  
  $(window).bind('offline', function offline(e) {
    console.log ('Offline');
    $('#sync-status').text('Offline');
    $('#notification-menu').hide();
    
    $('#logged-in-menu-actions').remove();
    $('#user-icon').removeClass('dropdown-toggle');
    
    if (_.project.sync) {
      $('#end-iteration-button').attr('disabled', true);
    }
  });
  
}