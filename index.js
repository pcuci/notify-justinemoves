// server.js
let express = require('express');
var path = require('path');
let bodyParser = require('body-parser');

FCM = require('fcm-node');
let SERVER_API_KEY = 'AIzaSyBbik6C3zdvdL87gV2aA7Rn7-vWASKYnYs';
let validDeviceRegistrationToken = 'erzhcWuTQ6E:APA91bHCTi_2Z2MpXyu52gy249kvFAxUyo1w-stDT_HdlvZPV1JAePRTBgepuykJTUWGG-hHqlpQNqBz1Pm-r7SsTipkBjJc8EBoBJNlBVeyG71v3kSZ8FsktL4w6WiJfyZpgx0OUzBZ'; // put a valid device token here

let app = express();
let connection;

let movement = 0;
let presence = 0;
const threshold = 10000;
let lastSnooze = new Date();

let fcmCli = new FCM(SERVER_API_KEY);

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
  notification: {
    title: 'Baby Moved!',
    body: 'Snooze 10s',
    sound : "default",
    badge: "1"
  }
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

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let port = process.env.PORT || 3000;
let router = express.Router();

router.use(function(req, res, next) {
  console.log('Something happening.');
  next();
});

router.get('/', function(req, res) {
  console.log('dirname:', __dirname);
  res.sendFile(path.join(__dirname + '/index.html'));
});

router.post('/snooze', function (req, res) {
  console.log('snooze req.body', req.body);
  lastSnooze = new Date();
  res.send();
});

router.put('/movement', function (req, res) {
  movement = parseInt(req.body.movement);
  res.send();
});

router.put('/presence', function (req, res) {
  console.log('presence req.body', req.body);
  presence = parseInt(req.body.presence);
  res.send();
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

  connection = request.accept('justine', request.origin);
  console.log((new Date()) + ' Connection accepted.');
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      console.log('Received Message: ' + message.utf8Data);
      connection.sendUTF(message.utf8Data);
    } else if (message.type === 'binary') {
      console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
      connection.sendBytes(message.binaryData);
    }
  });
  connection.on('close', function(reasonCode, description) {
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });
});

let oldStatus = 0;
let status = 0;

computeStatus = (movement, presence, diffSnooze) => {
  if (movement && presence === 0) {
    if (((new Date()) - lastSnooze) > threshold) {
      return 2;
    } else {
      return 1;
    }
  } else {
    return 0;
  }
}

console.log('movement presence diffSnooze', movement, presence);
setInterval(() => {
  let diffSnooze = (new Date()) - lastSnooze;
  let status = computeStatus(movement, presence, diffSnooze);
  console.log('movement presence diffSnooze statuses', movement, presence, diffSnooze, status, oldStatus);
  if (status !== oldStatus) {
    switch (status) {
      case 0:
        connection.sendUTF(0);
        console.log('   >>> Attending Status\n\n');
        break;
      case 1:
        sendMulticast();
        connection.sendUTF(1);
        console.log('   >>> Warning Status\n\n');
        break;
      case 2:
        sendMulticast();
        connection.sendUTF(2);
        console.log('   >>> Critical Status\n\n');
        break;
      default:
        console.error('Uknown state:', status);
    }
  }
  oldStatus = status;
}, 500);
