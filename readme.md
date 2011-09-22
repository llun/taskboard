#Scrumboard

Task board that work in offline mode and sync when online. It's a lab project for test HTML5 and [now.js](nowjs.com)

##Requirement

 - mongodb: Scrumboard use MongoDB to save task data on server and sync to new client.
 - now.js: Scrumboard use now.js sync task when online.
 - mime: For serve static file.
 - log4js: As log facility.
 
##Usage

  Before run scrumboard, must install and run MongoDB first.

    git clone git://github.com/ideacube/scrumboard.git
    npm install
    cp config-default.js config.js
    node server server.js

