const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const userRouter = require("./routes/userRoutes");
const chatRouter = require("./routes/chatRoutes");
const msgRouter = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();
connectDB();
const app = express();

app.use(express.json());

app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", msgRouter);


app.get("/", (req, res) => {
	res.send("API is running..");
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
	PORT,
	console.log(`Server running on PORT ${PORT}...`.yellow.bold)
);

const io = require("socket.io")(server, {
	pingTimeout: 60000,
	cors: {
		origin: "http://localhost:3000",
	},
});

io.on("connection", (socket) => {
	console.log("Connected to socket.io");
	socket.on("setup", (userInfo) => {
		socket.join(userInfo._id);
		socket.emit("connected");
	});

	socket.on("join chat", (room) => {
		socket.join(room);
	});
	socket.on("typing", (room) => socket.in(room).emit("typing"));
	socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

	socket.on("new message", (newMessageRecieved) => {
		var chat = newMessageRecieved.chat;

		if (!chat.users) return console.log("chat.users not defined");

		chat.users.forEach((user) => {
			if (user._id == newMessageRecieved.sender._id) return;
			socket.in(user._id).emit("message recieved", newMessageRecieved);
		});
	});

	socket.off("setup", () => {
		console.log("Connection ended");
		socket.leave(userInfo._id);
	});
});
