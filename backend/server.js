require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const user_routes = require("./routes/userRoutes");
const socketFunctions = require("./socket.js");
const dbURI = process.env.MONGODB_URI;

const app = express();
const server = http.createServer(app);

const allowedOrigins = [process.env.LOCALHOST_ORIGIN, process.env.NGROK_ORIGIN];

app.use(cors({
    origin : allowedOrigins
}));
app.use("/user", user_routes);


const io = new Server(server, {
    cors :{
        origin : allowedOrigins,
        methods : ["GET", "POST", "DELETE", "OPTIONS"],
        credentials : true,
        allowedHeaders : ["ngrok-skip-browser-warning"]
    }
})

mongoose.connect(dbURI, {useNewUrlParser: true, useUnifiedTopology: true})
.then((result)=>{
    console.log("Connected To Database");

    server.listen(4000, ()=>{
        console.log(`Server running on port 4000`);
    })
})
.catch((err)=>{
    console.log(err);
})

io.on("connection", (socket)=>{
    console.log(`User Connected : ${socket.id}`);

    socketFunctions.handle_connect(io, socket);

    socket.on("disconnect", ()=>{
        socketFunctions.handle_disconnect(io, socket);
    });

    socket.on("handle-login", (data)=>{
        socketFunctions.handle_login(io, socket, data);
    });

    socket.on("handle-logout", (data)=>{
        socketFunctions.handle_logout(io, socket, data);
    });

    socket.on("create-room", (data)=>{
        socketFunctions.create_room(io, socket, data);
    });

    socket.on("join-room", (data)=>{
        socketFunctions.join_room(io, socket, data);
    });

    socket.on("start-game", (data)=>{
        socketFunctions.start_game(io, socket, data);
    });

    socket.on("set-claim", (data)=>{
        socketFunctions.set_claim(io, socket, data);
    });

    socket.on("play-card-info", (data)=>{
        socketFunctions.play_card_info(io, socket, data);
    });

    socket.on("pass-chance", (data)=>{
        socketFunctions.pass_chance(io, socket, data);
    });

    socket.on("call-bluff", (data)=>{
        socketFunctions.get_prev_cards(io, socket, data);
    });

    socket.on("leave-room", (data)=>{
        socketFunctions.leave_room(io, socket, data);
    });

    socket.on("reset-game", (data)=>{
        socketFunctions.reset_game(io, socket, data);
    });

    socket.on("send-message", (data)=>{
        socketFunctions.send_message(io, socket, data);
    });

    socket.on("change-game-settings", (data)=>{
        socketFunctions.change_game_settings(io, socket, data);
    });

    // friends functions
    socket.on("update-friends-list", (data)=>{
        socketFunctions.update_friends(io, socket, data);
    });

    socket.on("change-username", (data)=>{
        socketFunctions.change_username(io, socket, data);
    });

    socket.on("add-friend-invite", (data)=>{
        socketFunctions.add_friend_invite(io, socket, data);
    });

    socket.on("add-friend", (data)=>{
        socketFunctions.add_friend(io, socket, data);
    });

    socket.on("decline-friend-invite", (data)=>{
        socketFunctions.decline_friend_invite(io, socket, data);
    });

    socket.on("cancel-friend-invite", (data)=>{
        socketFunctions.cancel_friend_invite(io, socket, data);
    });

    socket.on("invite-to-game", (data)=>{
        socketFunctions.invite_to_game(io, socket, data);
    });
})