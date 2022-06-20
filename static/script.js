let socket;
let directory = {};
let checkingOut = false;
let usingID;
let usingBox;
let boxFull = [true,true,true];
let timeout;
let checkedOut = [];
let alpha = ["A","B","C"];

function processCheckout(id) {
  if ( ! boxFull.some(box => box) ) return;
  if ( isNaN(id) ) return;
  let person = directory[id];
  if ( ! person ) return;
  usingID = id;

  let box = -1;
  while ( box == -1 || ! boxFull[box] ) {
    box = Math.floor(Math.random() * boxFull.length);
  }
  boxFull[box] = false;
  socket.emit("control",box,0,id);
  usingBox = box;

  document.getElementById("check-out-name").innerText = directory[id].split(" ")[1];
  document.getElementById("check-out-box").innerText = alpha[box];
  document.getElementById("waiting").style.display = "none";
  document.getElementById("check-out-message").style.display = "block";
  document.getElementById("message-button").style.display = "inline";
  checkingOut = true;
  timeout = setTimeout(checkoutFinished,30000);
  checkedOut.push(id);
}

function checkoutFinished() {
  timeout = null;
  socket.emit("control",usingBox,1,usingID);

  if ( boxFull.some(box => box) ) {
    document.getElementById("check-out-empty").style.display = "none";
    document.getElementById("check-out-waiting").style.display = "block";
  } else {
    document.getElementById("check-out-empty").style.display = "block";
    document.getElementById("check-out-waiting").style.display = "none";
  }
  document.getElementById("check-in-full").style.display = "none";
  document.getElementById("check-in-waiting").style.display = "block";
  document.getElementById("check-in-buttons").style.display = "block";
  document.getElementById("waiting").style.display = "block";
  document.getElementById("check-out-message").style.display = "none";
  document.getElementById("message-button").style.display = "none";

  let button = document.createElement("button");
  button.innerText = directory[usingID].split(" ").slice(0,2).join(" ");
  button.dataset.id = usingID;
  button.onclick = function() {
    this.parentElement.removeChild(this);
    processCheckin(this.dataset.id);
  }
  document.getElementById("check-in-buttons").appendChild(button);
  checkingOut = false;
}

function processCheckin(id) {
  usingID = id;

  let box = -1;
  while ( box == -1 || boxFull[box] ) {
    box = Math.floor(Math.random() * boxFull.length);
  }
  boxFull[box] = true;
  socket.emit("control",box,0,id);
  usingBox = box;

  document.getElementById("check-in-name").innerText = directory[id].split(" ")[1];
  document.getElementById("check-in-box").innerText = alpha[box];
  document.getElementById("waiting").style.display = "none";
  document.getElementById("check-in-message").style.display = "block";
  document.getElementById("message-button").style.display = "inline";
  timeout = setTimeout(checkinFinished,30000);
  checkedOut.splice(checkedOut.indexOf(id),1);
}

function checkinFinished() {
  timeout = null;
  socket.emit("control",usingBox,1,usingID);
  
  if ( boxFull.every(box => box) ) {
    document.getElementById("check-in-full").style.display = "block";
    document.getElementById("check-in-waiting").style.display = "none";
    document.getElementById("check-in-buttons").style.display = "none";
  } else {
    document.getElementById("check-in-full").style.display = "none";
    document.getElementById("check-in-waiting").style.display = "block";
    document.getElementById("check-in-buttons").style.display = "block";
  }
  document.getElementById("check-out-empty").style.display = "none";
  document.getElementById("check-out-waiting").style.display = "block";
  document.getElementById("waiting").style.display = "block";
  document.getElementById("check-in-message").style.display = "none";
  document.getElementById("message-button").style.display = "none";
}

function fastFinish() {
  clearTimeout(timeout);
  if ( checkingOut ) checkoutFinished();
  else checkinFinished();
}

function getDirectory() {
  let req = new XMLHttpRequest();
  req.onload = function() {
    let startDirectory = JSON.parse(this.responseText);
    for ( let i in startDirectory ) {
      directory[startDirectory[i].id] = startDirectory[i].formatted;
    }
  }
  req.open("GET","directory.json");
  req.send();
}

let inputStr = "";
window.onkeypress = event => {
  if ( event.key == "Enter" ) return;
  if ( timeout ) return;
  if ( inputStr == "" ) {
    setTimeout(_ => {
      console.log(checkedOut.indexOf(inputStr))
      if ( checkedOut.indexOf(inputStr) == -1 ) processCheckout(inputStr);
      inputStr = "";
    },1000);
  }
  inputStr += event.key;
}

window.onload = _ => {
  socket = io();
  getDirectory();
};
