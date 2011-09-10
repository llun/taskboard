var _ = {
  table: {},
  init: function() {},
  persistent: new MemoryPersistent()
};

window.onload = function() {
  if ('onhashchange' in window) {
    window.onhashchange = function() {
      route(window.location.hash);
    }
  } else {
    var storedHash = window.location.hash;
    setInterval(function() {
      if (window.location.hash != storedHash) {
        storedHash = window.location.hash;
        route(storedHash);
      }
    }, 100);
  }
  
  var route = function route(hash) {
    var path = hash.slice(1);
    
    if (_.table[path]) {
      _.table[path]();
    } else {
      var target = null;
      for (var key in _.table) {
        var pattern = new RegExp('^' + key + '$', 'i');
        if (pattern.test(path)) {
          target = _.table[key];
          break;
        }
      }
      
      if (!target) {
        target = _.table[''];
      }
      
      target();

    }
  }
  
  _.init();
}
