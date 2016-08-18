var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var userList = [];
var typingUsers = {};

app.get('/', function(req, res){
  res.send('<h1>AppCoda - SocketChat Server</h1>');
});


http.listen(3000, function(){
  console.log('Listening on *:3000');
});


io.on('connection', function(clientSocket){
  console.log('a user connected');

  clientSocket.on('disconnect', function(){
    console.log('user disconnected');

    var clientNickname;
    for (var i=0; i<userList.length; i++) {
      if (userList[i]["id"] == clientSocket.id) {
        userList[i]["isConnected"] = false;
        clientNickname = userList[i]["nickname"];
        break;
      }
    }

    delete typingUsers[clientNickname];
    io.emit("userList", userList);
    io.emit("userExitUpdate", clientNickname);
    io.emit("userTypingUpdate", typingUsers);
  });


  clientSocket.on("exitUser", function(clientNickname){
    for (var i=0; i<userList.length; i++) {
      if (userList[i]["id"] == clientSocket.id) {
        userList.splice(i, 1);
        break;
      }
    }
    io.emit("userExitUpdate", clientNickname);
  });


  clientSocket.on('chatMessage', function(clientNickname, message){
    var currentDateTime = new Date().toLocaleString();
    delete typingUsers[clientNickname];
    io.emit("userTypingUpdate", typingUsers);
    io.emit('newChatMessage', clientNickname, message, currentDateTime);
  });


  clientSocket.on("connectUser", function(clientNickname) {
      var message = "User " + clientNickname + " was connected.";
      console.log(message);

      var userInfo = {};
      var foundUser = false;
      for (var i=0; i<userList.length; i++) {
        if (userList[i]["nickname"] == clientNickname) {
          userList[i]["isConnected"] = true
          userList[i]["id"] = clientSocket.id;
          userInfo = userList[i];
          foundUser = true;
          break;
        }
      }

      if (!foundUser) {
        userInfo["id"] = clientSocket.id;
        userInfo["nickname"] = clientNickname;
        userInfo["isConnected"] = true
        userList.push(userInfo);
      }

      io.emit("userList", userList);
      io.emit("userConnectUpdate", userInfo)
  });


  clientSocket.on("startType", function(clientNickname){
    console.log("User " + clientNickname + " is writing a message...");
    typingUsers[clientNickname] = 1;
    io.emit("userTypingUpdate", typingUsers);
  });


  clientSocket.on("stopType", function(clientNickname){
    console.log("User " + clientNickname + " has stopped writing a message...");
    delete typingUsers[clientNickname];
    io.emit("userTypingUpdate", typingUsers);
  });

});
