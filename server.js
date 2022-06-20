const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
let gpio,boxes;

const PORT = process.argv[2] || 8000;
const CTRL_BOXES = process.argv[3] != "no-boxes";

if ( CTRL_BOXES ) {
console.log("here");
  gpio = require('pigpio').Gpio;
  boxes = [new gpio(4,{mode: gpio.OUTPUT}),new gpio(19,{mode: gpio.OUTPUT}),new gpio(13,{mode: gpio.OUTPUT})];
  boxes[0].digitalWrite(0);
  boxes[1].digitalWrite(0);
  boxes[2].digitalWrite(0);
}

app.use("/static",express.static(__dirname + "/static"));

io.on("connection",socket => {
  socket.on("control",(box,value,id) => {
    value = 1 - value;
    if ( CTRL_BOXES ) boxes[box].digitalWrite(value);
    console.log(`ID ${id} ${value ? "locked" : "unlocked"} box #${box + 1}`);
  });
});

server.listen(PORT,() => {
  console.log(`Listening on port ${PORT}`);
});
