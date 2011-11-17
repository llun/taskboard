var TaskView = function (task) {

  this.tmpl = _.tmpl('task', task);  
  
  this.append = function (parent) {
    $(parent).append(this.tmpl);
    
    return this;
  }
  
  this.update = function() {
    $('#' + task.id).attr('draggable', true);
    
    $('#' + task.id + '_detail').html(task.getDetail());
    $('#' + task.id + '_responders').text(task.getResponders().toString());
    $('#' + task.id + '_tags').text(task.getTags().toString());
    
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
    
    return this;
  }
  
}