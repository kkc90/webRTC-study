// alert("Hi!")
const messageList = document.querySelector("ul");
const nickForm = document.querySelector("#nick");
const messageForm = document.querySelector("#message");

const socket = new WebSocket(`ws://${window.location.host}`)

function makeMessage(type, payload){
    const msg = {type, payload}
    return JSON.stringify(msg)
}

socket.addEventListener("open", () => {
    console.log("Connceted to Server :)")
});

socket.addEventListener("message", (message) => {
    // console.log("Just got this: ", message, " from the Server")
    // console.log("Just got this: ", message.data, " from the Server")
    // console.log("New message: ", message.data, " from the Server")
    // console.log("New message: ", message.data)
    const li = document.createElement("li");
    li.innerText = message.data
    messageList.append(li);
});

socket.addEventListener("close", () => {
    console.log("Disconnceted from the Server (X)")
});

// setTimeout(() => {
//     socket.send("Hello from the Browser!")
// }, 10000);


function handleSubmit(event){
    event.preventDefault();
    const input = messageForm.querySelector("input");
    // console.log(input.value);
    // socket.send(input.value);
    socket.send(makeMessage("new_message", input.value));
    const li = document.createElement("li");
    li.innerText = `You: ${input.value}`
    messageList.append(li);
    input.value = "";
}

function handleNickSubmit(event){
    event.preventDefault();
    const input = nickForm.querySelector("input");
    // socket.send({
    //     type: "nickname",
    //     payload: input.value,
    // });
    socket.send(makeMessage("nickname", input.value));
    input.value = "";
}

messageForm.addEventListener("submit", handleSubmit);
nickForm.addEventListener("submit", handleNickSubmit);