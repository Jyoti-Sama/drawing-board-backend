const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose')
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const TOKEN_KEY = "abcdefgh123456789";

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, { cors: { origin: "*" } });

mongoose.connect(MONGODB_URI, () => console.log("db connected..."))

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors())

const serverUP = Date();

// index page
app.get('/', (req, res) => res.send("welcome to project hub!"))

app.get('/up', (req, res) => {
    res.send("server running from " + serverUP)
})

// user auth

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
})
const UsertModel = mongoose.model('user', userSchema);

// 
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!(email && password)) {
        return res.status(401).json({ error: "All inputs are required" })
    }

    try {
        const oldUser = await UsertModel.findOne({ email });

        if (!oldUser) {
            return res.status(404).json({ error: "user does not exist" })
        }

        if (!(await bcrypt.compare(password, oldUser.password))) {
            return res.status(401).json({ error: "wrong password!" })
        }

        const token = jwt.sign({ user_id: oldUser._id, email }, TOKEN_KEY, {
            expiresIn: "90d",
        });

        return res.status(200).json({ token, name: oldUser.name, email: oldUser.email })
    } catch (error) {
        console.log(error)
        res.status(401).json({ error: error.message })
    }
})

app.post('/register', async (req, res) => {
    const { email, name, password } = req.body;

    if (!(email && name && password)) {
        return res.status(401).json({ error: "All inputs are required" })
    }

    try {
        //encrypt user password
        const encryptPassword = await bcrypt.hash(password, 10);

        const oldUser = await UsertModel.findOne({ email });

        if (oldUser) {
            return res.status(401).json({ error: "user already exist" })
        }

        const newUser = UsertModel({ email, name, password: encryptPassword });

        const response = await newUser.save();
        console.log(response)

        const token = jwt.sign({ user_id: response._id, email }, TOKEN_KEY, {
            expiresIn: "90d",
        });

        return res.status(201).json({ message: "user created", token, name, email })

    } catch (error) {
        console.log(error)
        res.status(404).json({ error: error.message })
    }
})



let room1Details = []

io.on('connection', (socket) => {

    socket.on("join", (data) => {
        console.log(data)

        data.id = socket.id;

        room1Details.push(data)

        socket.join("room1");
        socket.to("room1").to("room2").emit("joinroom", {data, room1Details})
    });

    socket.on("join-room2", (data) => {
        socket.join("room2");
    });

    socket.on("disconnecting", (user) => {
        let leftuser = room1Details.find(user => user.id === socket.id)
        room1Details = room1Details.filter(user => user.id !== socket.id)
        console.log("disconnected", room1Details)

        socket.to("room1").emit("user-left", {leftuser, room1Details})
        socket.to("room2").emit("user-left", {leftuser, room1Details})
    });

    socket.on("drawing-data-to-server", (data) => {
        console.log(data);

        socket.to("room1").emit("drawing-data-to-client", data)
        socket.to("room2").emit("drawing-data-to-client", data.name)
    })
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("running on port 5000"))

