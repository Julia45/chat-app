const { generateMessage } = require('./utils/messages')
const { addUser, removeUser, getUsersInRoom, getUser } = require('./utils/users')
const express = require('express');
const http = require("http");
const path = require('path');
const Filter = require('bad-words')

const app = express();
const server = http.createServer(app)
const socketio = require('socket.io')
const io = socketio(server)

const port = process.env.PORT || 4300;
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {

  socket.on('join', (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options })

    if (error) {
       return callback(error)
    }
    socket.join(user.room)

    socket.emit('message', generateMessage("Admin", 'Welcome!'))
    socket.broadcast.to(user.room).emit('message', generateMessage("Admin", `${user.username} has joined!`))
    
    io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
    })

    callback()
  
    })

  socket.on('sendMessage', (message, callback) => {
     console.log(message, "here") 
    const user = getUser(socket.id)
    const filter = new Filter()

    if (filter.isProfane(message)) {
        return callback("Profanity is not allowed")
    }

    io.to(user.room).emit('message', generateMessage(user.username, message))
    callback("Delievered")
  })

  socket.on('sendLocation', (coords, callback) => {
    const user = getUser(socket.id)

    io.to(user.room).emit('locationMessage', generateMessage(user.username,`https://google.com/maps?q=${coords.lat},${coords.lon}`))
    callback()
})

  socket.on("disconnect", () => {
      const user = removeUser(socket.id);

      if (user) {
        io.to(user.room).emit('message', generateMessage("Admin",`${user.username} has left`))
        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
    }
  })

})

server.listen(port, () => {
    console.log(`The app is started on ${port} port`)
})