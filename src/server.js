import http from "http";
// import WebSocket from "ws";
// import SocketIO from "socket.io";
import {Server} from "socket.io";
import express from "express";
import { instrument } from "@socket.io/admin-ui";


const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));


// console.log("Hello");
const handleListen = () => console.log('Listening to http://localhost:3000');
// app.listen(3000, handleListen);

const httpServer = http.createServer(app);
// const wss = new WebSocket.Server({httpServer});
// const wsServer = SocketIO(httpServer);
const wsServer = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true,
    },
});

instrument(wsServer, {
    auth: false,
});


function publicRooms(){
    const {sockets: {adapter: {sids, rooms}}} = wsServer;
    // const sids = wsServer.sockets.adapter.sids;
    // const rooms = wsServer.sockets.adapter.rooms;

    const publicRooms = [];
    rooms.forEach((_, key) => {
        if(sids.get(key) === undefined){
            publicRooms.push(key);
        }
    });
    return publicRooms;
}

function countRoom(roomName){
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

var cnt = 1
wsServer.on("connection", (socket) => {
    socket["nickname"] = "Anon " + String(cnt);
    socket.onAny((event) => {
        console.log(wsServer.sockets.adapter);
        console.log(`Socket Event: ${event}`);
    });

    // socket.on("enter_room", (msg) => console.log(msg));

    // 여러 값, 오브젝트들을 받을 수 있음
    // socket.on("enter_room", (a, b, c ,d ,e ,f) => {
    //     console.log(a, b, c ,d ,e ,f);
    // })

    // socket.on("enter_room", (roomName, done) => {
    //     // console.log(roomName);
    //     // console.log(socket.id);
    //     // console.log(socket.rooms);
    //     socket.join(roomName);
    //     // console.log(socket.rooms);
    //     setTimeout(() => {
    //         done("hello from the backend");
    //     }, 15000);
    // })

    socket.on("enter_room", (roomName, done) => {
        socket.join(roomName);
        done();
        socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
        wsServer.sockets.emit("room_change", publicRooms());
    })

    socket.on("disconnecting", () => {
        socket.rooms.forEach(room => socket.to(room).emit("bye", socket.nickname, countRoom(room)-1));
        // wsServer.sockets.emit("room_change", publicRooms());
    })

    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());
    })

    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    })

    socket.on("nickname", (nickname) => socket["nickname"] = nickname);

})


httpServer.listen(3000, handleListen);