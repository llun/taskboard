var _ = {
  table: {},
  init: function() {},
  persistent: new MemoryPersistent(),
  cache: {},
  tmpl: function(template_id, object) {
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.
    var fn = !/\W/.test(template_id) ?
      _.cache[template_id] = _.cache[template_id] ||
        _.tmpl(document.getElementById(template_id).innerHTML) :

    // Generate a reusable function that will serve as a template
    // generator (and which will be cached).
    new Function("obj",
      "var p=[],print=function(){p.push.apply(p,arguments);};" +

      // Introduce the data as local variables using with(){}
      "with(obj){p.push('" +

      // Convert the template into pure JavaScript
      template_id
        .replace(/[\r\t\n]/g, " ")
        .split("<%").join("\t")
        .replace(/((^|%>)[^\t]*)'/g, "$1\r")
        .replace(/\t=(.*?)%>/g, "',$1,'")
        .split("\t").join("');")
        .split("%>").join("p.push('")
        .split("\r").join("\\'")
        + "');}return p.join('');");

    // Provide some basic currying to the user
    return object ? fn( object ) : fn;
  }
};

(function() {
  _.addEvent = (function () {
    if (document.addEventListener) {
      return function (el, type, fn) {
        if (el && el.nodeName || el === window) {
          el.addEventListener(type, fn, false);
        } else if (el && el.length) {
          for (var i = 0; i < el.length; i++) {
            addEvent(el[i], type, fn);
          }
        }
      };
    } else {
      return function (el, type, fn) {
        if (el && el.nodeName || el === window) {
          el.attachEvent('on' + type, function () { return fn.call(el, window.event); });
        } else if (el && el.length) {
          for (var i = 0; i < el.length; i++) {
            addEvent(el[i], type, fn);
          }
        }
      };
    }
  })();
  
  _.addEvent(window, 'load', function() {
    // Reset hash after refresh.
    window.location.hash = '';
    
    _.addEvent(window, 'hashchange', function() {
      // Reset state before by route to default
      route('');
      route(window.location.hash);
    });

    var route = function route(hash) {
      var path = hash.slice(1);

      if (_.table[path]) {
        _.table[path]();
      } else {
        var target = null;
        for (var key in _.table) {
          var pattern = new RegExp('^' + key, 'i');
          if (pattern.test(path)) {
            target = _.table[key];
            break;
          }
        }

        if (!target) {
          target = _.table[''];
        }

        target(hash);

      }
    }

    _.init();
  });
  
})();

