const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const { generateMessage } = require('./utils/messages');
const {
  addUser,
  getUser,
  getUsersInRoom,
  removeUser,
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
//Note: Socket IO call raw HTTP server. Express can't do the same as
const io = socketio(server);

const port = process.env.PORT ?? 3000;
const pubicDirectionPath = path.join(__dirname, '../public');

app.use(express.static(pubicDirectionPath));

let count = 0;
io.on('connection', (socket) => {
  console.log('Connection!');

  // JOIN
  socket.on('join', ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit('message', generateMessage('Welcome!'));

    //NOTE: Omit particular connection
    socket.broadcast
      .to(user.room)
      .emit('message', generateMessage(`${user.username} has joined`));

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
    // socket.emit, io.emit, socket.broadcast.emit
    // io.to.emit, socket.broadcast.to.emit (ROOM)
  });

  socket.emit('countUpdated', count);

  socket.on('increment', () => {
    count++;

    //Emit specific connection
    // socket.emit('countUpdated', count);

    //Emit every single connection
    io.emit('countUpdated', count);
  });

  socket.on('sendMessage', ({ message }, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit('message', generateMessage(message, user.username));
    callback('Delivered');
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        'message',
        generateMessage(`${user.username} has left`)
      );
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });

  socket.on('sendLocation', (coords) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      'messageLocation',
      generateMessage(
        `https://google.com/maps?q=${coords.lat},${coords.long}`,
        user.username
      )
    );
  });
});

server.listen(port, () => {
  console.log('Service is running');
});
