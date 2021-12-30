import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));


// console.log("Hello");
const handleListen = () => console.log('Listening to http://localhost:3000');
// app.listen(3000, handleListen);

const server = http.createServer(app);
const wss = new WebSocket.Server({server});

/*
const sockets = []
// function handleConnection(socket) {
//     console.log(socket)
// }
// wss.on("connection", handleConnection)

wss.on("connection", (socket)=> {
    // console.log(socket);
    console.log("Connceted to Browser :)")
    socket["nickname"] = "Anon";
    sockets.push(socket);
    socket.on("close", () => console.log("Disconnected from the Browser (X)"))
    socket.on("message", (msg) => {
        // console.log(message.toString('utf8'));
        // console.log(message.toString());
        // socket.send(message.toString());
        const message = JSON.parse(msg);
        // console.log(parsed, message.toString())
        
        // if(parsed.type === "new_message") {
        //     sockets.forEach(aSocket => aSocket.send(parsed.payload))
        // } else if(parsed.type === "nickname") {
        //     console.log(parsed.payload)
        // }
        switch (message.type) {
            case "new_message":
                // sockets.forEach(aSocket => {
                //     if(aSocket.nickname != socket.nickname || socket.nickname !="Anon"){
                //         aSocket.send(`${socket.nickname}: ${message.payload}`)
                //     }
                // })
                sockets.forEach(aSocket => aSocket.send(`${socket.nickname}: ${message.payload}`))
                break;
            case "nickname":
                console.log(message.payload)
                socket["nickname"] = message.payload;
                break;
            case defaul:
                break;
        }
        // sockets.forEach(aSocket => aSocket.send(message.toString()))
    });
    // socket.send("Hello!!!");
});
*/

server.listen(3000, handleListen);