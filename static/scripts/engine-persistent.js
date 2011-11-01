var Util = {
  /**
   * Generate UUID
   *
   * @return UUID String
   */
  uuid: function() {
    var S4 = function() {
      return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
  }
}

/**
 * Persist data in memory. Used for test, all data will varnish after
 * refresh!
 */
var MemoryPersistent = function() {
  
  // Object map
  var _objects = { length: 0 };
  
  this.getObjects = function getObjects() {
    return _objects;
  }
  
  /**
   * Save object in memory store. Object must have attribute property
   * 
   * @param {Object} object persist object
   */
  this.save = function save(object) {
    
    if (!object.id) {
      var id = Util.uuid();
      object.id = id;
    } 
    
    if (!_objects[object.id]) {
      _objects.length++;
    } 
    
    _objects[object.id] = object;
    
  }
  
  /**
   * Remove object from memory store.
   *
   * @param {Number} id object id provide by persistent save
   */
  this.remove = function remove(id) {
    if (_objects[id]) {
      delete(_objects[id]);
      _objects.length--;
    }
  }
  
  /**
   * Get object from memory store.
   *
   * @param {Number} id object id provide by persistent get
   */
  this.get = function get(id) {
    var object = _objects[id];
    return object;
  }
  
}

/**
 * Persist data in browser localstorage.
 */
var LocalStoragePersistent = function() {
  this.clear = function clear() {
    localStorage.clear();
  }
  
  this.save = function save(object) {

    if (!object.id) {
      var id = Util.uuid();
      object.id = id;
    }
    
    localStorage.setItem(JSON.stringify(object.id), JSON.stringify(object));
    
  }
  
  this.remove = function remove(id) {
    localStorage.removeItem(JSON.stringify(id));
  }
  
  this.get = function get(id) {
    var output = JSON.parse(localStorage.getItem(JSON.stringify(id)));
    return output;
  }
  
}