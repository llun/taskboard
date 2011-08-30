$(document).ready(function() {
  
  $('#user-menu').click(function(event) {
    $(this).toggleClass('open');
  });
  
  $('#new-story-button').click(function(event) {
    $('#new-story-modal').show();
  });
  $('#new-story-save-button').click(function(event) {
    $('#new-story-modal').hide();
  });
  $('#new-story-cancel-button').click(function(event) {
    $('#new-story-modal').hide();
  });
  
});