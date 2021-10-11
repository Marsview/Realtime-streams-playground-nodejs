'use strict';


const express = require('express'); // const bodyParser = require('body-parser'); // const path = require('path');
const app = express();
const port = process.env.PORT || 1337;
const server = require('http').createServer(app);

const ioClient = require('socket.io-client')

const session = require("express-session");
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

const io = require('socket.io')(server);

const mv_io_client = ioClient.connect('https://rtstrdev.marsview.ai/', {
  auth: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ2ZW5rYXRlc2gucHJhc2FkQG1hcnN2aWV3LmFpIiwiaWF0IjoxNjMzOTM5OTY4LCJleHAiOjE2MzM5NDM1Njh9.Uq9jgzrIAICcuaGPOeWOzvpfcQ4LvEYTnCH-XcU0jjA',
    txnId: 'txn1',
    channelId: 'ch1'
  }
}); // Marsview Realtime Server

// const mv_io_client = ioClient.connect('http://localhost:3030', {
//   auth: {
//     token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ2ZW5rYXRlc2gucHJhc2FkQG1hcnN2aWV3LmFpIiwiaWF0IjoxNjMzNTE2Nzg1LCJleHAiOjE2MzM1MjAzODV9.aOyT23hZyDxeX0XpjRm8v5tSiDuXDwMVRRa2VGzN8T4',
//     txnId: 'txn1',
//     channelId: 'ch1'
//   }
// }); // Marsview Realtime Server

io.use(wrap(session({ secret: "cats" })));
app.use('/assets', express.static(__dirname + '/public'));
app.use('/session/assets', express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

// =========================== ROUTERS ================================ //

app.get('/', function (req, res) {
  res.render('index', {});
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
