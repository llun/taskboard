TestIt('TestUser', {
  'before each': function(test) {
    
    var project1 = Project.create('project1');
    var project2 = Project.create('project2');
    
    var user = new User('sample', '', false, project1);    
    user.projects.push(project2.id);
    
    this.user = user;
    this.project = project1;
  },
  
  'testCreateProject': function(test) {
  
    // What's happen when create project?
    var user = this.user;
    user.createProject('Project 3');
    
    test.assertEqual(3, user.projects.length, 
      'User should have 3 projects. (' + 
      user.projects.length + ')');
      
    var project = Project.get(user.projects[2]);
    test.assert(project, 'Web store should have user project.');
  
  },

  'testRemoveProject': function(test) {
  
    var user = this.user;
    var project = this.project;
    
    user.removeProject(project.id);
    test.assertEqual(1, user.projects.length, 
      'User should have only 1 project. (' + 
      user.projects.length + ')');
      
    var project = Project.get(user.projects[2]);
    test.assert(!project, 'Web store should not have user project.');
    
  }

});