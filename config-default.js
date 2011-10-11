var config = {
  // Default server port
  port: 8080,
  
  // Base static path
  base: '/static',
  
  // Node handlers route
  routes: {},
  
  // Now handlers list
  everyone: [ require('./handlers/task.js').initial,
              require('./handlers/iteration.js').initial ],
  
  // MongoDB configuration
  mongo: {
    server: '127.0.0.1',
    port: 27017,
    serverOption: {},
    databaseOption: {},
    database: 'Scrum',
    authentication: {
      username: '',
      password: ''
    }
  },
  
  // Socket.io Transport
  transports: ['websocket', 'htmlfile', 'xhr-polling', 'jsonp-polling'],
  
  // Log facility
  log: {
    appenders: [ { type: 'file', 
                   filename: 'scrum.log', 
                   maxLogSize: 10485760,
                   backups: 3,
                   pollInterval: 15 },
                 { type: 'console' } ],
    levels: {
      console: 'info',
      socketio: 'info',
      store: 'info',
      task: 'info',
      iteration: 'info'
    }
  }
}

exports.config = config;
