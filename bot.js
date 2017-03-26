console.log("Twitter Bot is starting.");

const Twit = require('twit');

// use Twitter API provided keys below. Get them at dev.twitter.com

var T = new Twit({
  consumer_key:         process.env.TWITTER_CONSUMER_KEY, // twitter consumer key
  consumer_secret:      process.env.TWITTER_CONSUMER_SECRET, // twitter consumer secret
  access_token:         process.env.TWITTER_ACCESS_TOKEN, // twitter access token
  access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET, // twitter access token secret
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
});

var userStream = T.stream('user');

userStream.on('follow',followed);

function followed(event) {
  var name = event.source.name;
  var screen_name = event.source.screen_name;

  console.log(name,screen_name);

  T.post('statuses/update', { status: '@' + screen_name + '! Thanks for following me!' }, function(err, data, response) {

    if(err) {
      console.log(err);
      return;
    }

    console.log(data);
  })

}

userStream.on('tweet',tweeted);

function tweeted(event) {
  var replyTo = event.in_reply_to_screen_name;
  var from = event.user.screen_name;

  if(replyTo === 'karuppiahbot') {
    T.post('statuses/update', { status: '@' + from + ' thanks for tweeting to me!' }, function(err, data, response) {

      if(err) {
        console.log(err);
        return;
      }

      console.log(data);
    })
  }
}
