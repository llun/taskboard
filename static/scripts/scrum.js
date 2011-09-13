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
  _.persistent = new MemoryPersistent();
  _.iteration = new Iteration();
  
  $('.wall').bind({
    dragenter: function (ev) {
      $(this).addClass('over');
    },
    dragover: function (ev) {
      if (ev.preventDefault) {
        ev.preventDefault();
      }
      
      ev.dataTransfer.dropEffect = 'move';
      
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
      
      return false;
    }
  });
  
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