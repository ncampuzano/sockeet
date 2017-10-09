var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();
app.io = require('socket.io')();  
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
var userNames = [];
var userRooms = [];
var clients = [];
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
app.io.on('connection', function(socket) { 
  var addedUser = false;
  console.log("Usuario conectado");
  setInterval(function() {
      socket.emit('servermessage', Math.floor((Math.random() * 100000)));
  }, 1000);
  
   socket.on('add user', function (data) {
    if(socket.username != data.userId){
      addedUser = true;
      socket.username = data.userId;
      userNames[data.userId] = data.userId;
      clients[data.userId] = data.userId;
      socket.room = data.userId; 
      socket.join(data.userId);
      userRooms[data.userId]= data.userId;
    }
    socket.emit('added', "usuario agregado al socket");
  });
  
  socket.on('message', function (data) {
    var msgInfo = {
      "msg":data.msg,
      "crt":false,
      "receptorId":data.userId,
      "actualId":data.reciverId
    };
    if(socket.room == userRooms[data.reciverId]){
      socket.broadcast.to(socket.room).emit('message', data.msg);
      socket.broadcast.to(socket.room).emit('addMessage', msgInfo);
    }else{
      socket.leave(socket.room);
      socket.room = userRooms[data.reciverId]; 
      socket.join(userRooms[data.reciverId]);
      userRooms[data.userId]= userRooms[data.reciverId];
      socket.broadcast.to(socket.room).emit('message', data.msg);
      socket.broadcast.to(socket.room).emit('addMessage', msgInfo);
    }
   
  });
  socket.on('isLoggedIn', function (data) {
    if(userNames[data.reciverId] != undefined){
      socket.emit('isLoggedIn', true);
    }else{
      socket.emit('isLoggedIn', false);
    }
  });  
  
  
  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if (addedUser) {
      delete userNames[socket.username];
    }
  });
});

module.exports = app;
