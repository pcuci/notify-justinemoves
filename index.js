// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
let express = require('express');        // call express
let app = express();                 // define our app using express
let bodyParser = require('body-parser');

FCM = require('fcm-node');

let SERVER_API_KEY='AIzaSyBbik6C3zdvdL87gV2aA7Rn7-vWASKYnYs'; //put your api key here

let validDeviceRegistrationToken = 'e2jl4z4SDCY:APA91bHexS7Qo64NjK21R7m1S6hIk67d7k12sItSdlUIYL8e6p2wE7J1lmZIZIRTS-vQJhfP17FEhT8uiUitrNcAsVLC8Xs0MJBXnHNVCd_4BfnAQI9xMXgnuiQxxFYOiKYGk7S40gwi'; // put a valid device token here

let fcmCli = new FCM(SERVER_API_KEY);

let payloadOK = {
  to: validDeviceRegistrationToken,
  data: { // some data object (optional)
    foo:'fooooooooooooo',
  },
  priority: 'high',
  content_available: true,
  notification: { // notification object
    title: 'HELLO', body: 'World!', sound : "default", badge: "1"
  }
};

let payloadError = {
  to: "4564654654654654", // invalid registration token
  data: {
    url: "news"
  },
  priority: 'high',
  content_available: true,
  notification: { title: 'TEST HELLO', body: '123', sound : "default", badge: "1" }
};

let payloadMulticast = {
  registration_ids:["4564654654654654",
    '123123123',
    validDeviceRegistrationToken, //valid token among invalid tokens to see the error and ok response
    '123133213123123'],
  data: {
    url: "news"
  },
  priority: 'high',
  content_available: true,
  notification: { title: 'Hello', body: 'Multicast', sound : "default", badge: "1" }
};

let callbackLog = function (sender, err, res) {
  console.log("\n__________________________________")
  console.log("\t" + sender);
  console.log("----------------------------------")
  console.log("err=" + err);
  console.log("res=" + res);
  console.log("----------------------------------\n>>>");
};

function sendMulticast() {
  fcmCli.send(payloadMulticast,function(err,res) {
    callbackLog('sendMulticast', err, res);
  });
}

let babymoves = false;
let nurseway = false;

// put - moving baby
// true or false

// get - moving baby
// put/get - nurse away

// triggered
// alarm

let lastAcknowledged
// timer triggers master alarm

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let port = process.env.PORT || 3000;        // set our port

// ROUTES FOR OUR API
// =============================================================================
let router = express.Router();              // get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
  console.log('Something is happening.');
  next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
  sendMulticast();
  res.sendFile(path.join(__dirname + '/index.html'));
});

router.get('/babymoves', function (req, res) {
  res.send(babymoves);
});

router.put('/babymoves', function (req, res) {
  res.send('Got a PUT request at /user');
});

router.get('/nurseaway', function (req, res) {
  res.send(nurseaway);
});

router.put('/nurseaway', function (req, res) {
  //console.log('nurse param: ', req.params.state);
  console.log(req.body);
  nurseaway = req.body;
  res.send('Got a PUT request at /user');
});

app.use('/api', router);

app.listen(port);
console.log('Magic happens on port ' + port);


var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(4000, function() {
    console.log((new Date()) + ' Server is listening on port 4000');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});
