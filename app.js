'use strict';


const express = require('express'); // const bodyParser = require('body-parser'); // const path = require('path');
const app = express();
const port = process.env.PORT || 1337;
const server = require('http').createServer(app);
const path = require('path');

const ioClient = require('socket.io-client')

const session = require("express-session");
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

const io = require('socket.io')(server);

let model_configs = {
  'intent_analysis': {
    'intents':
      ["intent-bxllq2f7hpkrvtyzi3-1627981197627",
        "intent-bxllq2f7hpkrvtzlkf-1627981226223"]
  }
}

const mv_io_client = ioClient.connect('https://streams.marsview.ai/', {
  auth: {
    token: '<AUTH TOKEN>',
    txnId: '<TXN ID>',
    channelId: '<CHANNEL ID>',
    'modelConfigs': model_configs
  }
}); // Marsview Realtime Server

io.use(wrap(session({ secret: "cats" })));
app.use('/assets', express.static(__dirname + '/public'));
app.use('/session/assets', express.static(__dirname + '/public'));

// =========================== ROUTERS ================================ //

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/views/index.html'));
});

app.use('/', function (req, res, next) {
  next(); // console.log(`Requests Url: ${req.url}`);
});


io.on('connection', function (client) {
  console.log('Client Connected to server');
  let absolute_start_time = new Date().getSeconds();
  let recognizeStream = null;
  let chunkMap = {}

  client.on('join', function () {
    client.emit('messages', 'Socket Connected to Server');
  });

  client.on('messages', function (data) {
    client.emit('broad', data);
  });

  mv_io_client.on('messages', function (data) {
    client.emit('messages', data);
  });

  client.on('startStream', function (data) {
    mv_io_client.emit('startStream', data)
  });

  client.on('endStream', function () {
    mv_io_client.emit('endStream')
  });

  client.on('binaryData', function (data) {
    mv_io_client.emit('binaryData', data)
  });

  mv_io_client.on('valid-token', function (data) {
    client.emit('valid-token', data);
  });

  mv_io_client.on('invalid-token', function (data) {
    console.log("Invalid token")
    client.emit('invalid-token', data);
  });

  mv_io_client.on('output', function (sentiment) {
    client.emit('output', sentiment)
  });

});


// The encoding of the audio file, e.g. 'LINEAR16'
// The sample rate of the audio file in hertz, e.g. 16000
// The BCP-47 language code to use, e.g. 'en-US'
const encoding = 'LINEAR16';
const sampleRateHertz = 16000;
const languageCode = 'en-US'; //en-US

const request = {
  config: {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
    profanityFilter: false,
    enableWordTimeOffsets: true,
    // speechContexts: [{
    //     phrases: ["hoful","shwazil"]
    //    }] // add your own speech context for better recognition
  },
  interimResults: true, // If you want interim results, set this to true
};





// =========================== START SERVER ================================ //

server.listen(port, '127.0.0.1', function () {
  //http listen, to make socket work
  // app.address = "127.0.0.1";
  console.log('Server started on port:' + port);
});
