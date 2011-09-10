/**
 * Persist data in memory. Used for test, all data will varnish after
 * refresh!
 */
MemoryPersistent = function() {
  
  // Object map
  var _objects = { length: 0 };
  
  /**
   * Generate UUID
   *
   * @return UUID String
   */ 
  var _uuid = function _uuid() {
    var S4 = function() {
      return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
  }
  
  this.getObjects = function getObjects() {
    return _objects;
  }
  
  /**
   * Save object in memory store. Object must have attribute property
   * 
   * @param {Object} object persist object
   */
  this.save = function save(object) {
    var id = _uuid();
    
    object.id = id;
    
    if (!_objects[id]) {
      _objects.length++;
    }
    _objects[id] = object;
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
    return _objects[id];
  }
  
}