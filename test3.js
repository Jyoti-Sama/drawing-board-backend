const io = require('socket.io-client')

const socket = io("http://localhost:5000");

socket.emit("join", {name: "test user 3"})

socket.on("user-left", (data) => console.log(data))

socket.on("drawing-data-to-client", (data) => console.log(data))