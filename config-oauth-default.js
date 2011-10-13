var config = {

  twitter: {
    request: 'https://api.twitter.com/oauth/request_token',
    access: 'https://api.twitter.com/oauth/access_token',
    signature: 'HMAC-SHA1',
    version: '1.0',
    
    callback: 'http://localhost:8080/oauth/twitter/callback',
    consumerKey: '',
    consumerSecret: '',
    token: '',
    tokenSecret: ''
  }

}

exports.config = config;