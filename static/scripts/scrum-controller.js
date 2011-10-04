// Route table
_.table = {
  // Task controllers
  'task/new': function() {
    $('#new-task-modal').show();
    $('#new-task-detail').focus();
  },
  'task/edit': function(hash) {
    $('#edit-task-modal').show();
    
    var id = hash.substring('#task/edit'.length + 1);
    var task = Task.get(id);
    
    var value = task.getDetail(true);
    $('#edit-task-detail').val(value);
    $('#edit-task-detail').focus();
    
    var textArea = $('#edit-task-detail').get(0);
    textArea.setSelectionRange(value.length, value.length);
    
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
      var iteration = Iteration.get(_.project.currentIteration());
      
      var task = Task.create(detail, true);
      if (task) {
        iteration.addTask(task);
        Iteration.save(iteration);
        
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
    var iteration = Iteration.get(_.project.currentIteration());
    
    var id = hash.substring('#task/remove'.length + 1);
    Task.remove(id, true);
    iteration.removeTask(id);
    Iteration.save(iteration);
    
    console.log ('client(remove): ' + id);
    
    $('#' + id).remove();
    
    window.location.hash = '';
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
    var id = hash.substring('#iteration/show'.length + 1);
    
    $('.task').remove();
    
    var realID = id == 'current' ? _.project.currentIteration() : id;
    var iteration = Iteration.get(realID);
    for (var taskID in iteration.tasks) {

      if (iteration.tasks[taskID]) {
        var task = Task.get(taskID);
        if (task) {
          $('#' + task.status).append(_.tmpl('task', task));
        }

      }

    }
    
    if (id == 'current') {
      // Show new task and end iteration button
      $('#iteration-actions').show();
      $('.task').attr('draggable', true);
    } else {
      // Hide new task and end iteration button
      $('#iteration-actions').hide();
      $('.task-action').hide();
    }
    
    window.location.hash = '';
  },
  'iteration/edit': function() {
  
    $('#edit-iteration-modal').show();
    
    var iteration = Iteration.get(_.project.currentIteration());
    $('#edit-iteration-name').val(iteration.name);
    $('#edit-iteration-name').focus();
    
    var input = $('#edit-iteration-name')[0];
    input.setSelectionRange(0, iteration.name.length);
    
  },
  'iteration/save': function () {
    
    var iteration = Iteration.get(_.project.currentIteration());
    iteration.name = $('#edit-iteration-name').val();
    Iteration.save(iteration);
    
    $('#iteration-name').text(iteration.name);
    $('#edit-iteration-name').val('');
    
    $('#edit-iteration-modal').hide();
    
  },
  'iteration/end': function() {
    $('#end-iteration-modal').show();
  },
  'iteration/end/confirm': function() {
    _.project.endIteration();
    Project.save(_.project);
    
    var iteration = Iteration.get(_.project.currentIteration());
    
    $('.task').remove();
    $('#iteration-name').text(iteration.name);
    
    if (_.project.iterations.length == 2) {
      // Append divider
      $('#iterations-list-menu').append('<li class="divider"></li>');
    }
    
    var iterations = _.project.iterations;
    var pastIteration = Iteration.get(iterations[iterations.length - 2]);
    $('#iterations-list-menu').append(_.tmpl('iteration_list', pastIteration));
    
    window.location.hash = '';
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
  
  // Default state
  '': function() {
    $('#new-task-detail').val('');
    $('#edit-task-detail').val('');
    $('#edit-task-save-button').attr('href', '');
    $('#edit-iteration-name').val('');
    
    $('#clear-task-modal').hide();
    $('#new-task-modal').hide();
    $('#edit-task-modal').hide();
    
    $('#end-iteration-modal').hide();
    $('#edit-iteration-modal').hide();
    
    $('#update-modal').hide();
  }
}