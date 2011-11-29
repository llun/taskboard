var log4js = require('log4js'),
    mongodb = require('mongodb'),
    step = require('step'),
    testit = require('test_it'),
    uuid = require('node-uuid');
    
var Model = require('../model/model.js').Model;
var logger = log4js.getLogger('test');
    
var local = {};

var require = {
  begin: false,
  create: false,
  edit: false
}

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
        
        var fixtures = [{
          name: 'Project1',
          children: [1, 2, 3]
        }, {
          name: 'Project2',
          children: [3, 4]
        }];
        
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
          name: 'Project 3',
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
        require.create = true;
        
        test.assert(3, output.count);
        test.assertEqual(output.target.id, output.target._id);
      });
    
  }
});
