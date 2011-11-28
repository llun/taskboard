var config = {

  twitter: {
    request: 'https://api.twitter.com/oauth/request_token',
    access: 'https://api.twitter.com/oauth/access_token',
    signature: 'HMAC-SHA1',
    version: '1.0',
    
    callback: 'http://localhost:8080/oauth/twitter/callback',
    consumerKey: '',
    consumerSecret: ''
  },
  
  github: {
    id: '',
    secret: '',
    base: 'https://github.com/login',
    version: '2.0',
    
    callback: 'http://localhost:8080/oauth/github/callback'
  },
  
  facebook: {
    id: '',
    secret: '',
    base: 'https://graph.facebook.com',
    version: '2.0',
    
    callbackAuthen: 'http://localhost:8080/oauth/facebook/authen'
  },
  
  key: ''

}

exports.config = config;