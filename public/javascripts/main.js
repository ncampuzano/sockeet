var socket = io.connect(window.location.href);  
socket.on('servermessage', function(msg) {  
   var element = document.getElementById('random');
   element.innerHTML = msg;
});