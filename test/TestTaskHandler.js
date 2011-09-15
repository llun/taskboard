var TestIt = require('test_it');

TestIt('TestTaskHandler', {
  
  'before all': function() {
    var TaskHandler = require('../handlers/task.js').TaskHandler;
    this.handler = TaskHandler;
  },
  
  'testSyncAll': function(test) {
    var handler = this.handler;
    var client = [ {id: 1, detail: 'First', updated: 1, status: 'TODO'},
                   {id: 2, detail: 'Second Changed', updated: 2, status: 'TODO', sync: true},
                   {id: 3, detail: 'Third', updated: 1, status: 'TODO', sync: true},
                   {id: 4, removed: true },
                   {id: 5, detail: 'Fifth', updated: 1, status: 'TODO', sync: true},
                   {id: 8, removed: true } ]
                   
    var server = [ {id: 2, detail: 'Second', updated: 1, status: 'TODO', sync: true},
                   {id: 3, detail: 'Third Changed', updated: 2, status: 'TODO', sync: true},
                   {id: 4, detail: 'Forth', updated: 1, status: 'TODO', sync: true},
                   {id: 6, detail: 'Sixth', updated: 1, status: 'TODO', sync: true},
                   {id: 7, detail: 'Seventh', updated: 1, status: 'TODO', sync: true} ]
                   
    var output = handler.syncAll(server, client);
    
    var serverAdd = output.server.add;
    var serverUpdate = output.server.update;
    var serverRemove = output.server.remove;
    
    test.assertEqual(1, serverAdd.length, 
      'List for server to add, expect 1 but was ' + serverAdd.length);
    test.assertEqual('First', serverAdd[0].detail, 
      'First item add to server, expect "First" but was "' + 
      serverAdd[0].detail + '"');
    
    test.assertEqual(1, serverUpdate.length,
      'List for server to update, expect 1 but was ' + serverUpdate.length);
    test.assertEqual('Second Changed', serverUpdate[0].detail,
      'First item update on server, expect "Second Changed" but was "' + 
      serverUpdate[0].detail + '"');
    
    test.assertEqual(2, serverRemove.length,
      'List for server to remove, expect 2 but was ' + serverRemove.length);
    test.assertEqual(4, serverRemove[0].id,
      'First item remove on server, expect 4 but was ' + 
      serverRemove[0].id);
    test.assertEqual(8, serverRemove[1].id,
      'Second item remove on server, expect 8 but was ' + 
      serverRemove[1].id);
    
    var clientAdd = output.client.add;
    var clientUpdate = output.client.update;
    var clientRemove = output.client.remove;
    
    test.assertEqual(2, clientAdd.length,
      'List for client to add, expect 2 but was ' + clientAdd.length);
    test.assertEqual('Sixth', clientAdd[0].detail,
      'First item add to client, expect "Sixth" but was "' + 
      clientAdd[0].detail + '"');
    test.assertEqual('Seventh', clientAdd[1].detail,
      'Second item add to client, expect "Seventh" but was "' + 
      clientAdd[1].detail + '"');
    
    test.assertEqual(1, clientUpdate.length,
      'List for client to update, expect 1 but was ' + clientUpdate.length);
    test.assertEqual('Third Changed', clientUpdate[0].detail,
      'First item update on client, expect "Third Changed" but was "' + 
      clientUpdate[0].detail + '"');
    
    test.assertEqual(1, clientRemove.length,
      'List for client to remove, expect 1 but was ' + clientRemove.length);
    test.assertEqual(5, clientRemove[0].id,
      'First item remove on client, expect "5" but was "' + 
      serverRemove[0].id + '"');
  }
  
});