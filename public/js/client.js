'use strict';



//connection to socket
// const socket = io.connect();
let token = document.getElementById('token').value
let userId = ''
let socket = io({
  auth: {
    token: token,
    userId: userId
  }
});

socket.connect()

let bufferSize = 2048,
  AudioContext,
  context,
  processor,
  input,
  globalStream;

//vars
let audioElement = document.querySelector('audio'),
  finalWord = false,
  resultText = document.getElementById('ResultText'),
  removeLastSentence = true,
  streamStreaming = false;

//audioStream constraints
const constraints = {
  audio: true,
  video: false,
};

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
  console.log("===============================")
  console.log(left.length)
  var left16 = downsampleBuffer(left, 44100, 16000);
  console.log(left16)
  console.log(typeof(left16))
  socket.emit('binaryData', left16);
}

//================= INTERFACE =================
var startButton = document.getElementById('startRecButton');
startButton.addEventListener('click', startRecording);

var endButton = document.getElementById('stopRecButton');
endButton.addEventListener('click', stopRecording);
endButton.disabled = true;

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



function invalidToken(){
  stopRecording()
  document.getElementById('errorname').innerHTML="this is an invalid Token"  
}

function validToken(){
  document.getElementById('errorname').innerHTML='<span style="color:green">Token Valid, start speaking</span>'  
}



const resultpreview = document.getElementById('results');
const resultpreview2 = document.getElementById('results2');
const resultpreview3 = document.getElementById('results3');

/**
 * Socket Events
 */

socket.on('invalid-token', function (data) {
  console.log('Token is invalid');
  invalidToken()
});

socket.on('output', function (output) {
  let output_obj = JSON.parse(output)

  if(output_obj['sentiment_stream']){
    let sentiment_op = output_obj['sentiment_stream']['output']
    console.log('Sentiment:  '+sentiment_op)
    resultpreview3.innerHTML += "\n" + sentiment_op;
  }

  if(output_obj['tone_stream']){
    let tone_op = output_obj['tone_stream']['output']
    console.log('Tone:  '+tone_op)
    resultpreview2.innerHTML += "\n" + tone_op;
  }

  if(output_obj['intent_stream']){
    let intent_op = output_obj['intent_stream']['output']
    console.log('Intent:  '+intent_op)
    resultpreview.innerHTML += "\n" + intent_op;
  }
  
  resultpreview.innerHTML += "============================================\n" ;
  resultpreview2.innerHTML += "============================================\n" ;
  resultpreview3.innerHTML += "============================================\n" ;

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
