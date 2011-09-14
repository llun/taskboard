var config = {
  // Default server port
  port: 8080,
  
  // Base static path
  base: '/static',
  
  // Node handlers paths
  routes: {
    'get:/task/list': require('./handlers/task.js').TaskHandler.listTasks,
    'post:/task/sync': require('./handlers/task.js').TaskHandler.syncTasks
  }
}

exports.config = config;