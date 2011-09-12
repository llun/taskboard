var tasks = {};

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
  _.iteration = new Iteration();
  
  $('#user-menu').click(function(event) {
    $(this).toggleClass('open');
  });
  
  $('#new-story-button').click(function(event) {
    window.location.hash = 'task/new';
  });
  
}
