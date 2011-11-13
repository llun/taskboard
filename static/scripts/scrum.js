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
      if (task && !task.delete) {
        $('#' + task.status).append(_.tmpl('task', task));
        $('#' + task.id).attr('draggable', true);
      }
      
    }
    
  }

  $('#project-name').text(_.project.name);
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
        
          $('#sync-status').text('Syncing');
        
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
              
              _.user = User.get(data.id);
            }
            
            // Prepare project need to sync
            var projects = _.user.projects;
            var prepareProject = [];
            var prepareIteration = [];
            
            for (var key in projects) {
              var project = Project.get(projects[key]);
              if (project && project.sync) {
                prepareProject.push(project);
                joinList.push(project.id);
                
                var iterations = project.iterations;
                for (var key in iterations) {
                  var iteration = Iteration.get(iterations[key]);
                  if (iteration) {
                    prepareIteration.push(iteration);
                    joinList.push(iteration.id);
                  }
                  
                }
                
                // End of prepare iteration.
              }
              
              // End of prepare project.
            }
            
            // Sync projects
            now.syncModels(_.client, 'project', { owner: _.user.id }, prepareProject, 
              function (object) {
            
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
                
                // List projects
                var projects = _.user.projects;
                for (var index = 0; index < projects.length; index++) {
                  var project = Project.get(projects[index]);
                  if (project) {
                    var list = _.tmpl('project_list', project);
                    $('#projects-list-menu').append(list);
                  }
                }
                
                // Sync iterations
                now.syncModels(_.client, 'iteration', { owner: _.user.id }, prepareIteration, 
                  function (object) {
                
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
                    
                    now.joinGroups(_.client, joinList, function () {
                      console.log ('Join success');
                    });
                    
                    // List iterations
                    var countSync = 0;
                    var iterations = _.project.iterations.slice(0).reverse()
                    for (var index = 0; index < iterations.length; index++) {
                      var iteration = Iteration.get(iterations[index]);
                      if (iteration) {
                      
                        var list = _.tmpl('iteration_list', iteration);
                        $('#iterations-list-menu').append(list);
                      
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
                          function (object) {
                        
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
                            }
                          
                          });
                      
                      } else {
                        countSync++;
                      }
                      
                    }
                    
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
      
        console.log ('server-debug(update): user - ' + 
                     user.id + ', ' + 
                     user.updated);
      
        if (user.updated > _.user.updated) {    
          User.save(user);
          _.user = User.get(user.id);
        }
        
        _.project = Project.get(user.defaultProject);
        
        // Change iteration/project board name.
        $('#project-name').text(_.project.name);
        
        var iteration = Iteration.get(_.project.currentIteration());
        $('#iteration-name').text(iteration.name);
        
        $('.task').remove();
        for (var taskID in iteration.tasks) {
        
          if (iteration.tasks[taskID]) {
            var task = Task.get(taskID);
            if (task && !task.delete) {
              $('#' + task.status).append(_.tmpl('task', task));
              $('#' + task.id).attr('draggable', true);
            }
              
          }
            
        }
        
      }

      var create = {
        project: function (client, serverProject) {
          console.log ('server-debug(create): project - ' + 
                       serverProject.id + ', ' + 
                       serverProject.updated + ', ' +
                       serverProject.modified);
                     
          if (client != _.client) {
            Project.save(serverProject);
            now.joinGroups(_.client, [serverProject.id]);
            
            var list = _.tmpl('project_list', serverProject);
            $('#projects-list-menu').append(list);
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
              $('#' + clientTask.status).append(_.tmpl('task', clientTask));
              $('#' + clientTask.id).attr('draggable', true);
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
              
              var iteration = Iteration.get(_.project.currentIteration());
              $('#iteration-name').text(iteration.name);
              
              $('.task').remove();
              for (var taskID in iteration.tasks) {
              
                  if (iteration.tasks[taskID]) {
                    var task = Task.get(taskID);
                    if (task && !task.delete) {
                      $('#' + task.status).append(_.tmpl('task', task));
                      $('#' + task.id).attr('draggable', true);
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
              
                $('#' + clientTask.status).append(_.tmpl('task', clientTask));
                $('#' + clientTask.id).attr('draggable', true);
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
    var iterations = _.project.iterations.slice(0).reverse()
    for (var index = 0; index < iterations.length; index++) {
      var iteration = Iteration.get(iterations[index]);
      var list = _.tmpl('iteration_list', iteration);
      $('#iterations-list-menu').append(list);
    }
    
    // Update login menu
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
    $('#notification-menu').hide();
    $('#log-out-menu').remove();
    
    if (_.project.sync) {
      $('#end-iteration-button').attr('disabled', true);
    }
  });
  
}