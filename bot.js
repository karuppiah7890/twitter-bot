const db = require('./db');
const mongoose = require('mongoose');
const User = mongoose.model('User');

console.log("Twitter Bot is starting.");

const ConversationV1 = require('watson-developer-cloud/conversation/v1');

const conversation = new ConversationV1({
  username: process.env.WATSON_USERNAME,
  password: process.env.WATSON_PASSWORD,
  version_date: ConversationV1.VERSION_DATE_2017_04_21
});

const workspace_id = '5cf41128-4b07-47e9-be8a-93f2231a9056';


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

  tweetIt('@' + screen_name + ' thanks for following me!');
}

userStream.on('tweet',tweeted);

function tweeted(event) {
  //console.log(event);
  var replyTo = event.in_reply_to_screen_name;
  var from = event.user.screen_name;

  if(from === 'karuppiahbot') {
    return;
  }
  
  if(replyTo === 'karuppiahbot') {
    tweetIt('@' + from + ' thanks for tweeting to me!');
  }
}

userStream.on('direct_message', messaged);

function messaged(event) {

  console.log("messaged", event, "\n\n");

  if(event.direct_message.sender.screen_name === 'karuppiahbot')
  return;

  const user_id = event.direct_message.sender.id_str;

  User.findOne({ id: user_id })
  .then((result) => {

    const context = result? result.context : null;

    conversation.message({
      input: { text: event.direct_message.text },
      workspace_id: workspace_id,
      context: context
    }, processResponse);

    function processResponse(err, response) {
        if (err) {
          console.error("Bug while getting watson response : ", err, "\n\n");
        } else {
          console.log(JSON.stringify(response, null, 2));

          const options = {
            user_id: user_id,
            text: response.output.text[0]
          };

          console.log("Options for DM to send : ",options, "\n\n");

          T.post('direct_messages/new', options)
          .then((result) => {
            console.log("Bug while sending DM : ", result.error, "\n\n");
          })
          .catch((err) => {
            console.error("Bug while sending DM : ",err, "\n\n");
          })

          if(context) {
            User.findOneAndUpdate({ id: user_id }, { context: response.context }, { new: true },
              (err, result) => {
                console.log("Update", result);
            });
          } else {
            User.create({
              id: user_id,
              context: response.context
            }).then((result) => {
              console.log("User added or updated ", result, "\n\n");
            }).catch((err) => {
              console.error("Bug in creating user: ", err, "\n\n");
            })

          }

        }
    }

  })
  .catch((err) => {
    console.error("DB Bug : ", err, "\n\n");
  })

}

function tweetIt(tweet) {
  var r = Math.floor(Math.random()*100000);

  T.post('statuses/update', { status: tweet + ' Your cookie number is ' + r + ' :P '}, function(err, data, response) {

    if(err) {
      console.log(err);
      return;
    }

    console.log(data);
  })
}
