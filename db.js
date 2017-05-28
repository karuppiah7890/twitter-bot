const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI);

const connection = mongoose.connection;

connection.on('error', function(err) {
  console.error(err);
});

connection.once('open', function() {
  console.log('Connected to MongoDB!');
})

const UserSchema = mongoose.Schema({
  id: String,
  context: mongoose.Schema.Types.Mixed
})

const User = mongoose.model('User', UserSchema);
