const io = require('socket.io-client')

const socket = io("http://localhost:5000");

socket.emit("join-room2", {name: "test user 1"})

socket.on("joinroom", (data) => console.log(data, "join room"))

socket.on("user-left", (data) => console.log(data, "user left"))

// socket.on("drawing-data-to-client", (data) => console.log(data))