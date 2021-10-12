'use strict';


const express = require('express'); // const bodyParser = require('body-parser'); // const path = require('path');
const app = express();
const port = process.env.PORT || 1337;
const server = require('http').createServer(app);
const path = require('path');
const axios = require('axios');
var bodyParser = require('body-parser')

const ioClient = require('socket.io-client')
const session = require("express-session");
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
const io = require('socket.io')(server);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: false
}))

// parse application/json
app.use(bodyParser.json())
io.use(wrap(session({
  secret: "cats"
})));
app.use('/assets', express.static(__dirname + '/public'));
app.use('/session/assets', express.static(__dirname + '/public'));

// Inital state parameters
let mv_io_client = null;
let client = null;
let txnIdTemp = null;
let channelIdTemp = null;
let authParams = {
  token: null,
  txnId: null,
  channelId: null
}

// =========================== ROUTERS ================================ //

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/views/index.html'));
});

app.use('/', function (req, res, next) {
  next(); // console.log(`Requests Url: ${req.url}`);
});

app.post('/get_access_token', function (req, res) {
  if (req.body) {
    // Post request configurations
    let config = {
      headers: {
        "Content-Type": "application/json"
      }
    }
    axios.post("https://api.marsview.ai/cb/v1/auth/create_access_token", {
      apiKey: req.body.apiKey,
      apiSecret: req.body.apiSecret,
      userId: req.body.userId
    }, config).then(response => {
      if (response.data.status) {
        res.json({
          status: true,
          token: response.data.data.accessToken
        })

        authParams.token = response.data.data.accessToken;
      } else {
        res.json(response.data)
      }
    })
  }
})

app.post('/get_credentials', function (req, res) {
  if (req.body) {
    // Post request configurations
    let config = {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + authParams.token
      }
    }
    axios.post("https://streams.marsview.ai/rb/v1/streams/setup_realtime_stream", {
      channels: req.body.channelNumber
    }, config).then(response => {
      if (response.data.status) {
        txnIdTemp = response.data.data.txnId;
        channelIdTemp = response.data.data.channels[0].channelId;
        res.json(response.data)
      } else {
        res.json(response.data)
      }
    })
  }
})

app.put("/set_credentials", function(req, res) {
  authParams.txnId = txnIdTemp;
  authParams.channelId = channelIdTemp;
  // Initialize mv_io_client object
  const mv_io_client = ioClient.connect('https://streams.marsview.ai/', {
    auth: authParams
  }); // Marsview Realtime Server
  initializeListeners(mv_io_client);
  res.json({status: true});
})


// Socket io connections
io.on('connection', function (clientLocal) {
  client = clientLocal;
  console.log("Client connected");
  let absolute_start_time = new Date().getSeconds();
  let recognizeStream = null;
  let chunkMap = {}

  client.on('join', function () {
    client.emit('messages', 'Socket Connected to Server');
  });

  client.on('messages', function (data) {
    client.emit('broad', data);
  });
});

function initializeListeners(clientLocal) {
  clientLocal.on('messages', function (data) {
    client.emit('messages', data);
  });

  clientLocal.on('startStream', function (data) {
    client.emit('startStream', data)
  });

  clientLocal.on('endStream', function () {
    client.emit('endStream')
  });

  clientLocal.on('binaryData', function (data) {
    client.emit('binaryData', data)
  });

  clientLocal.on('valid-token', function (data) {
    client.emit('valid-token', data);
  });

  clientLocal.on('invalid-token', function (data) {
    console.log("Invalid token")
    client.emit('invalid-token', data);
  });

  clientLocal.on('output', function (sentiment) {
    client.emit('output', sentiment)
  });
}


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