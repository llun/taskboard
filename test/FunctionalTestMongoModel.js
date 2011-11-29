var log4js = require('log4js'),
    mongodb = require('mongodb'),
    step = require('step'),
    testit = require('test_it'),
    uuid = require('node-uuid');
    
var Model = require('../model/model.js').Model;
var logger = log4js.getLogger('test');
    
var local = {};
var require = {};
var fixtures = [];

testit('TestMongoModel', {
  'before all': function (test) {
    
    step(
      function begin () {
        var server = new mongodb.Server("127.0.0.1", 27017, {});
        new mongodb.Db('test', server, {}).open(this);
      },
      function gotConnection (error, client) {
        if (error) throw error;
        
        local.client = client;
        local.collections = new mongodb.Collection(client, 'item_collection');
        
        for (var index = 1; index <= 30; index++) {
          fixtures.push({
            _id: uuid.v4(),
            name: 'Project ' + index
          })
        }
        
        local.collections.insertAll(fixtures, this);
      },
      function insertedFixtures (error, docs) {
        if (error) throw error;
        
        logger.info ('begin test');
        require.begin = true;
        local.model = Model.get('item', local.client);
        
      });
    
  },
  
  'after all': function (test) {
    step(
      function begin () {
        var collections = local.collections;
        collections.drop(this);
      },
      function dropedCollections (error) {
        if (error) throw error;
        
        logger.info ('end test');
      });
  },
  
  'test create with uuid': function (test) {
    var collections;
    var model;
    
    var done = false;
    var output = {};
    
    step(
      function begin () {
        test.waitFor(
          function () {
            return require.begin;
          }, this)
      },
      function logic () {
        collections = local.collections;
        model = local.model;
        
        model.create({
          id: uuid.v4(),
          name: 'Project 31',
          children: [],
          create: 'self'
        }, this);
      },
      function get (error) {
        collections.find().toArray(this);
      },
      function found (error, docs) {
        if (!error) {
          output.count = docs.length;
          output.target = docs[docs.length - 1];
        } else {
          logger.error (error);
        }
        
        done = true;
      });
      
    test.waitFor(
      function (time) {
        return done;
      },
      function () {
        require['create with uuid'] = true;
        
        test.assertEqual(31, output.count);
        test.assertEqual(output.target.id, output.target._id);
      });
    
  },
  
  'test create without uuid': function (test) {
    var collections;
    var model;
    
    var done = false;
    var output = {};
    
    step(
      function begin () {
        test.waitFor(
          function () {
            return require['create with uuid'];
          }, this)
      },
      function logic () {
        collections = local.collections;
        model = local.model;
        
        model.create({
          name: 'Project 32',
          children: [],
          create: 'self'
        }, this);
      },
      function get (error) {
        collections.find().toArray(this);
      },
      function found (error, docs) {
        if (!error) {
          output.count = docs.length;
          output.target = docs[docs.length - 1];
        } else {
          logger.error (error);
        }
        
        done = true;
      });
      
    test.waitFor(
      function (time) {
        return done;
      },
      function () {
        require['create without uuid'] = true;
        
        test.assertEqual(32, output.count);
      });
  },
  
  'test list from 0 limit 2': function (test) {
    var model;
    
    var done = false;
    var output = {};
    
    step(
      function begin () {
        test.waitFor(
          function () {
            return require['create without uuid'];
          }, this)
      },
      function logic () {
        model = local.model;
        model.list(0, 2, this);
      },
      function found (error, docs) {
        if (!error) {
          output.count = docs.length;
          output.items = docs;
        } else {
          logger.error (error);
        }
        
        done = true;
      });
      
    test.waitFor(
      function (time) {
        return done;
      },
      function () {
        require['list from 0 with limit 2'] = true;
        
        test.assertEqual(2, output.count);
        test.assertEqual('Project 1', output.items[0].name);
        test.assertEqual('Project 2', output.items[1].name);
      });
  },
  'test list without offset and limit': function (test) {
    var model;
    
    var done = false;
    var output = {};
    
    step(
      function begin () {
        test.waitFor(
          function () {
            return require['list from 0 with limit 2'];
          }, this)
      },
      function logic () {
        model = local.model;
        model.list(null, null, this);
      },
      function found (error, docs) {
        if (!error) {
          output.count = docs.length;
          output.items = docs;
        } else {
          logger.error (error);
        }
        
        done = true;
      });
      
    test.waitFor(
      function (time) {
        return done;
      },
      function () {
        require['list without limit'] = true;
        
        test.assertEqual(25, output.count);
      });
  },
  
  'test list with offset 5 and limit 9': function (test) {
    var model;
    
    var done = false;
    var output = {};
    
    step(
      function begin () {
        test.waitFor(
          function () {
            return require['list without limit'];
          }, this)
      },
      function logic () {
        model = local.model;
        model.list(5, 9, this);
      },
      function found (error, docs) {
        if (!error) {
          output.count = docs.length;
          output.items = docs;
        } else {
          logger.error (error);
        }
        
        done = true;
      });
      
    test.waitFor(
      function (time) {
        return done;
      },
      function () {
        require['list with offset 5 and limit 9'] = true;
        
        test.assert(9, output.count);
        for (var index in output.items) {
          var item = output.items[index];
          var position = Number(index) + 6;
          test.assertEqual('Project ' + position, item.name);
        }
      });
  },
  
  'test count': function (test) {
    var model;
    
    var done = false;
    var output = null;
    
    step(
      function begin () {
        test.waitFor(
          function () {
            return require['list with offset 5 and limit 9'];
          }, this)
      },
      function logic () {
        model = local.model;
        model.count(this);
      },
      function count (error, total) {
        if (!error) {
          output = total;
        } else {
          logger.error (error);
        }
        
        done = true;
      });
      
    test.waitFor(
      function (time) {
        return done;
      },
      function () {
        require['count'] = true;
        
        test.assertEqual(32, output);
      });
  },
  
  'test find with no result': function (test) {
    var model;
    
    var done = false;
    var output = null;
    
    step(
      function begin () {
        test.waitFor(
          function () {
            return require['count'];
          }, this)
      },
      function logic () {
        model = local.model;
        model.find({ nokey: 'test' }, this);
      },
      function found (items) {
        output = items;
        
        done = true;
      });
      
    test.waitFor(
      function (time) {
        return done;
      },
      function () {
        require['find with no result'] = true;
        
        test.assertEqual(0, output.length);
      });
  },
  
  'test find with key create': function (test) {
    var model;
    
    var done = false;
    var output = null;
    
    step(
      function begin () {
        test.waitFor(
          function () {
            return require['find with no result'];
          }, this)
      },
      function logic () {
        model = local.model;
        model.find({ create: 'self' }, this);
      },
      function found (items) {
        output = items;
        done = true;
      });
      
    test.waitFor(
      function (time) {
        return done;
      },
      function () {
        require['find with key create'] = true;
        test.assertEqual(2, output.length);
        test.assertEqual('Project 31', output[0].name);
        test.assertEqual('Project 32', output[1].name);
      });
  },
  
  'test get with valid key': function (test) {
    var model;
    
    var done = false;
    var output = null;
    
    step(
      function begin () {
        test.waitFor(
          function () {
            return require['find with key create'];
          }, this)
      },
      function logic () {
        model = local.model;
        model.get(fixtures[0]._id, this);
      },
      function found (item) {
        output = item;
        done = true;
      });
      
    test.waitFor(
      function (time) {
        return done;
      },
      function () {
        require['get with valid key'] = true;
        test.assert(output);
        test.assertEqual('Project 1', output.name);
      });
  },
  
  'test get with invalid key': function (test) {
    var model;
    
    var done = false;
    var output = null;
    
    step(
      function begin () {
        test.waitFor(
          function () {
            return require['get with valid key'];
          }, this)
      },
      function logic () {
        model = local.model;
        model.get('no id', this);
      },
      function found (item) {
        output = item;
        done = true;
      });
      
    test.waitFor(
      function (time) {
        return done;
      },
      function () {
        require['get with invalid key'] = true;
        test.assert(!output);
      });
  },
  
  'test remove with valid key': function (test) {
    var collections;
    var model;
    
    var done = false;
    var output = null;
    
    step(
      function begin () {
        test.waitFor(
          function () {
            return require['get with invalid key'];
          }, this)
      },
      function logic () {
        collections = local.collections;
        model = local.model;
        
        model.remove(fixtures[0]._id, this);
      },
      function removed (error) {
        collections.count(this);
      },
      function count (error, total) {
        output = total;
        done = true;
      });
      
    test.waitFor(
      function (time) {
        return done;
      },
      function () {
        require['remove with valid key'] = true;
        test.assertEqual(31, output);
      });
  },
  
  'test remove with invalid key': function (test) {
    var collections;
    var model;
    
    var done = false;
    var output = null;
    
    step(
      function begin () {
        test.waitFor(
          function () {
            return require['remove with valid key'];
          }, this)
      },
      function logic () {
        collections = local.collections;
        model = local.model;
        
        model.remove(fixtures[0]._id, this);
      },
      function removed (error) {
        collections.count(this);
      },
      function count (error, total) {
        output = total;
        done = true;
      });
      
    test.waitFor(
      function (time) {
        return done;
      },
      function () {
        require['remove with invalid key'] = true;
        test.assertEqual(31, output);
      });
  },
  
  'test exists on valid key': function (test) {
    var model;
    
    var done = false;
    var output = null;
    
    step(
      function begin () {
        test.waitFor(
          function () {
            return require['remove with invalid key'];
          }, this)
      },
      function logic () {
        collections = local.collections;
        model = local.model;
        
        model.exists(fixtures[1]._id, this);
      },
      function validate (error, exists) {
        output = exists;
        done = true;
      });
      
    test.waitFor(
      function (time) {
        return done;
      },
      function () {
        require['exists on valid key'] = true;
        test.assert(output);
      });
  },
  
  'test exists on invalid key': function (test) {
    var model;
    
    var done = false;
    var output = null;
    var success = false;
    
    step(
      function begin () {
        test.waitFor(
          function () {
            return require['exists on valid key'];
          }, this)
      },
      function logic () {
        collections = local.collections;
        model = local.model;
        
        model.exists(fixtures[0]._id, this);
      },
      function validate (error, exists) {
        output = exists;
        done = true;
      });
      
    test.waitFor(
      function (time) {
        return done;
      },
      function () {
        require['exists on invalid key'] = true;
        test.assert(!output);
      });
  }
});
