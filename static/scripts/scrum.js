// Route table
_.table = {
  'task/new': function() {
    $('#new-story-modal').show();
  },
  'task/cancel': function() {
    // Clear form and close
    $('#new-story-detail').val('');
    $('#new-story-modal').hide();
  },
  'task/save': function() {
    
    // Store it to local memory and render new task in todo
    var detail = $('#new-story-detail').val();
    
    var task = _.iteration.createTask(detail);
    if (task) {
      $('#todo').append(_.tmpl('task', task));
      $('#' + task.id).attr('draggable', true);

      // Clear form and close
      $('#new-story-detail').val('');
      $('#new-story-modal').hide();
    }
    
  },
  'task/remove': function(hash) {
    var id = hash.substring('#task/remove'.length + 1);
    _.iteration.removeTask(id);
    $('#' + id).remove();
  },
  
  // Default state
  '': function() {
    $('#new-story-modal').hide();
  }
}

// View event binding
_.init = function() {
  _.persistent = new LocalStoragePersistent();
  
  // Load data
  var current = _.persistent.get('current');
  if (!current) {
    _.iteration = Iteration.create();
    
    var current = {id: 'current', key: _.iteration.id};
    _.persistent.save(current);
  } else {
    _.iteration = Iteration.get(current.key);
  }
  
  var types = ['todo', 'inprogress', 'verify', 'done'];
  $.each(types, function (index, type) {
    
    $.each(_.iteration[type], function (index, value) {
      var task = Task.get(_.iteration.tasks[value]);
      if (task) {
        $('#' + type).append(_.tmpl('task', task));
        $('#' + task.id).attr('draggable', true);
      } else {
        console.log ('Task is not found: ' + _.iteration.tasks[value]);
      }
    });
    
  });
  
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
      _.iteration.changeStatus(task.id, status);
      
      return false;
    }
  });
  
  // Bind drag & drop on task
  $('.task').live({
    dragstart: function (ev) {
      var dt = ev.originalEvent.dataTransfer;
      dt.setData('Text', $(this).attr('id'));
    }
  });
  
  $('#new-story-button').click(function(event) {
    window.location.hash = 'task/new';
  });
}