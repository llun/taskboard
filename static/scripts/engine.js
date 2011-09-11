var _ = {
  table: {},
  init: function() {},
  persistent: new MemoryPersistent(),
  cache: {},
  tmpl: function(template_id, object) {
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.
    var fn = !/\W/.test(str) ?
      _.cache[str] = _.cache[str] ||
        _.tmpl(document.getElementById(str).innerHTML) :

    // Generate a reusable function that will serve as a template
    // generator (and which will be cached).
    new Function("obj",
      "var p=[],print=function(){p.push.apply(p,arguments);};" +

      // Introduce the data as local variables using with(){}
      "with(obj){p.push('" +

      // Convert the template into pure JavaScript
      str
        .replace(/[\r\t\n]/g, " ")
        .split("<%").join("\t")
        .replace(/((^|%>)[^\t]*)'/g, "$1\r")
        .replace(/\t=(.*?)%>/g, "',$1,'")
        .split("\t").join("');")
        .split("%>").join("p.push('")
        .split("\r").join("\\'")
    + "');}return p.join('');");

    // Provide some basic currying to the user
    return data ? fn( data ) : fn;
  }
};

window.onload = function() {
  // Reset hash after refresh.
  window.location.hash = '';
  
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
