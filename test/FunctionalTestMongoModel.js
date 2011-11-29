var log4js = require('log4js'),
    mongodb = require('mongodb'),
    step = require('step'),
    testit = require('test_it'),
    uuid = require('node-uuid');
    
var Model = require('../model/model.js').Model;
var logger = log4js.getLogger('test');
    
var local = {};
var require = {};

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
        
        var fixtures = [];
        for (var index = 1; index <= 30; index++) {
          fixtures.push({
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
          children: []
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
        
        test.assert(31, output.count);
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
          children: []
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
        
        test.assert(32, output.count);
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
        
        test.assert(2, output.count);
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
        
        test.assert(25, output.count);
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
  }
});
