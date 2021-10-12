'use strict';

//connection to socket
// const socket = io.connect();
let userId = ''
let socket = io();

let bufferSize = 2048,
  AudioContext,
  context,
  processor,
  input,
  globalStream;

//vars
let audioElement = document.querySelector('audio'),
  finalWord = false,
  removeLastSentence = true,
  streamStreaming = false;

//audioStream constraints
const constraints = {
  audio: true,
  video: false,
};

  // Post request configurations
  let httpConfig = {
    headers: {
      "Content-Type": "application/json"
    }
  }

//================= RECORDING =================

function initRecording() {
  socket.emit('startStream', '');
  streamStreaming = true;
  AudioContext = window.AudioContext || window.webkitAudioContext;
  context = new AudioContext({
    // if Non-interactive, use 'playback' or 'balanced' // https://developer.mozilla.org/en-US/docs/Web/API/AudioContextLatencyCategory
    latencyHint: 'balanced',
  });
  processor = context.createScriptProcessor(bufferSize, 1, 1);
  processor.connect(context.destination);
  context.resume();

  var handleSuccess = function (stream) {
    globalStream = stream;
    input = context.createMediaStreamSource(stream);
    input.connect(processor);

    processor.onaudioprocess = function (e) {
      // console.log(e)
      microphoneProcess(e);
    };
  };

  navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess);
}

function microphoneProcess(e) {
  var left = e.inputBuffer.getChannelData(0);

  // var left16 = convertFloat32ToInt16(left); // old 32 to 16 function
  var left16 = downsampleBuffer(left, 44100, 16000);
  socket.emit('binaryData', left16);
}

//================= INTERFACE =================
var startButton = document.getElementById('startRecButton');
var transButton = document.getElementById('transButton');
var endButton = document.getElementById('stopRecButton');
var setButton = document.getElementById('setButton');

function init() {
  startButton.disabled = true;
  transButton.disabled = true;
  endButton.disabled = true;
  setButton.disabled = true;
}

init();

// Token form elements
var tokenForm = document.getElementById('token-form');
var tokenArea = document.getElementById('tokenarea');
var tokenButton = document.getElementById('tokenbutton');

// Form submission events
tokenForm.addEventListener('submit', (event) => {
  // stop form submission
  event.preventDefault();

  // Access token required values from form
  const apikeytemp = tokenForm.elements['apikey'].value;
  const apisecrettemp = tokenForm.elements['apisecret'].value;
  const useridtemp = tokenForm.elements['userid'].value;

  tokenArea.value = "Getting token ...";

  // Post request to get the access token
  axios.post("/get_access_token", {
      apiKey: apikeytemp,
      apiSecret: apisecrettemp,
      userId: useridtemp
    }, httpConfig)
    .then(response => {
      if (response.data.status) {
        console.log("response", response.data.token)
        tokenArea.value = response.data.token;
        tokenButton.disabled = true;
        transButton.disabled = false;
      } else {
        tokenArea.value = response.data.message;
      }
    }).catch((err) => {
      console.log(err)
    });
});

// Channel form elements
var channelForm = document.getElementById('channel-form');
var channelArea = document.getElementById('channelarea');

channelForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const channelNumber = document.getElementById('channelnumber').value || 1;
  axios.post("/get_credentials", {
    channelNumber: channelNumber
  }, httpConfig).then(response => {
    if(response.data.status) {
      channelArea.value = JSON.stringify(response.data, null, 4);
      setButton.disabled = false;
      transButton.disabled = true;
    }
  })
});

var setButton = document.getElementById('setButton');

setButton.addEventListener('click', function(event) {
  event.preventDefault();
  axios.put("/set_credentials", httpConfig).then(response => {
    if(response.data.status) {
      setButton.disabled = true;
      startButton.disabled = false;
      document.getElementById('setmessage').innerHTML = 'Connected';
      socket.connect();
    }
  })
})

// Recording button events
startButton.addEventListener('click', startRecording);
endButton.addEventListener('click', stopRecording);

var recordingStatus = document.getElementById('recordingStatus');

function startRecording() {
  startButton.disabled = true;
  endButton.disabled = false;
  recordingStatus.style.visibility = 'visible';
  initRecording();
}

function stopRecording() {
  // waited for FinalWord
  startButton.disabled = false;
  endButton.disabled = true;
  recordingStatus.style.visibility = 'hidden';
  streamStreaming = false;
  socket.emit('endStream', '');

  let track = globalStream.getTracks()[0];
  track.stop();

  input.disconnect(processor);
  processor.disconnect(context.destination);
  context.close().then(function () {
    input = null;
    processor = null;
    context = null;
    AudioContext = null;
    startButton.disabled = false;
  });

}


function invalidToken(message) {
  document.getElementById('errorname').innerHTML = message
}

function validToken() {
  document.getElementById('errorname').innerHTML = 'Token Valid, start speaking';
  document.getElementById('errorname').style["color"] = "green";
}

const results = document.getElementById('results3');
const resultsContainer = document.getElementById('result-container');

/**
 * Socket Events
 */

socket.on('invalid-token', function (data) {
  console.log('Token is invalid');
  invalidToken()
});

socket.on('output', function (output) {
  let output_obj = JSON.stringify(JSON.parse(output), null, "\t")

  console.log("Output more", output_obj)
  results.innerHTML += output_obj;
  results.innerHTML += "\n============================================\n";
  resultsContainer.scrollTop = resultsContainer.scrollHeight;
});

socket.on('valid-token', function (data) {
  console.log('Token is valid');
  validToken()
});

//================= SOCKET IO =================
socket.on('connect', function (data) {
  console.log('connected to socket');
  socket.emit('join', 'Server Connected to Client');
});

socket.on('messages', function (data) {
  // console.log(data);
});


//================= SANTAS HELPERS =================

// sampleRateHertz 16000 //saved sound is awefull
function convertFloat32ToInt16(buffer) {
  let l = buffer.length;
  let buf = new Int16Array(l / 3);

  while (l--) {
    if (l % 3 == 0) {
      buf[l / 3] = buffer[l] * 0xffff;
    }
  }
  return buf.buffer;
}

var downsampleBuffer = function (buffer, sampleRate, outSampleRate) {
  if (outSampleRate == sampleRate) {
    return buffer;
  }
  if (outSampleRate > sampleRate) {
    throw 'downsampling rate show be smaller than original sample rate';
  }
  var sampleRateRatio = sampleRate / outSampleRate;
  var newLength = Math.round(buffer.length / sampleRateRatio);
  var result = new Int16Array(newLength);
  var offsetResult = 0;
  var offsetBuffer = 0;
  while (offsetResult < result.length) {
    var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    var accum = 0,
      count = 0;
    for (var i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }

    result[offsetResult] = Math.min(1, accum / count) * 0x7fff;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result.buffer;
};