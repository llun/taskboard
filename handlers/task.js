var TaskHandler = {
  
  syncTasks: function(request, response, everyone) {
    response.writeHead(200, {})
    response.end("Hello, World")
  },
  
  listTasks: function(request, response, everyone) {
    response.writeHead(200, {})
    response.end("Hello, World")
  }
  
}

exports.TaskHandler = TaskHandler;