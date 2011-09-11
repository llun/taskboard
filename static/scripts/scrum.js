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
    var id = new Date().getTime();
    var detail = $('#new-story-detail').val();
    
    var task = _.iteration.createTask(detail);
    console.log(task);
    
    // Clear form and close
    $('#new-story-detail').val('');
    $('#new-story-modal').hide();
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
