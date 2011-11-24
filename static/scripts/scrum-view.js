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

var NotificationsView = function (notifications) {

  this.tmpls = [];
  
  if (notifications.length > 0) {
    for (var index in notifications) {
      var notification = notifications[index];
      if (notification.type == 'invite') {
        this.tmpls.push(_.tmpl('notification_invite_list', 
          { index: index,
            message: notification.from + 
                     ' invite you to join ' + 
                     notification.project }));
      } 
    }
  } else {
    this.tmpls.push(_.tmpl('notification_list', 
      {action: '', message: 'No notifications'}));
  }
  
  this.renders = function(parent) {
    $('.notification-list-item').remove();
    
    for (var index in this.tmpls) {
      $(parent).append(this.tmpls[index]);
    }
    
    $('#notification-status').text(_.notifications.length);
    
    if (notifications.length > 0) {
      $('#notification-status').addClass('alert');
    } else {
      $('#notification-status').removeClass('alert');
    }
  }

}
