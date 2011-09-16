var config = {
  // Default server port
  port: 8080,
  
  // Base static path
  base: '/static',
  
  // Node handlers route
  routes: {},
  
  // Now handlers list
  everyone: [ require('./handlers/task.js').everyone ],
  
  // MongoDB configuration
  mongo: {
    server: '127.0.0.1',
    port: 27017,
    serverOption: {},
    databaseOption: {},
    database: 'Scrum'
  },
  
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
      socketio: 'info'
    }
  }
}

exports.config = config;