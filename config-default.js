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
  }
}

exports.config = config;