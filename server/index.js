"use strict";

var express = require("express");
var http    = require("http").Server(app);
var _       = require("lodash");
var app     = express();
var server  = app.listen(3000)
var io      = require("socket.io")(server);

let gameIds = ["game1"];

app.use(express.static("app"));
app.get("/", (req, res) => {
  console.log("going to send index.html")
  res.sendFile("./app/index.html")
});
app.get("/games", (req, res) => res.send(gameIds));

io.on("connection", (socket) => {
  socket.on("disconnect", disconnect.bind(socket));
  socket.on("start", startGame.bind(socket));
  socket.on("join", joinGame.bind(socket));
  socket.on("leave", leaveGame.bind(socket));
  socket.on("hello", () => console.log("socket saying hello!"));
  socket.on("move", move.bind(socket));

  console.log("new socket enabled");
});

function startGame () {
  let socket = this;
  let gameId = _.uniqueId("room");
  socket.join(gameId);
  emit("new room", {id: gameId});
  gameIds.push(gameId);
}

function joinGame (params) {
  let socket = this;
  let gameId = params.gameId;
  if (!_.contains(gameIds, gameId)) return console.error(`not a valid gameId, ${gameId}`);
  console.log(`joining gameId ${gameId}`);
}

function getRooms () {
  return _.get(io, "nsps", "/", "adapter", "rooms");
}

function leaveGame (params) {
  let socket = this;
  let gameId = params.gameId;

  socket.leave(gameId);

  let rooms = getRooms();
  let room = _.get(rooms, "gameId");

  if (room) {
    if (Object.keys(room).length === 0) {
      emit("gameOver", {id: gameId});
      gameIds = _.reject(gameIds, gameId);
    } else {
      io.to(gameId).emit("userDisconnect");
    }
  } else {
    console.log("unable to get room");
  }
}

let emit = (event, params) => {
  io.sockets.emit(event, params);
}
let disconnect = () => console.log("socket disconnecting");

const DIRECTIONS = _.mapKeys(["up", "down", "left", "right"], (key) => key);
let move = (params) => {
  let socket = this;
  let direction = params.direction;
  let gameId = params.gameId;
  let t = Date.now();
  if (!DIRECTIONS[direction]) return console.error(`Direction is not valid ${direction}`);
  if (!_.contains(gameIds, gameId)) return console.error(`gameId is not valid ${gameId}`);

  console.log(`moving in direction ${direction} at t ${t} to room ${gameId}`);
  io.to(gameId).emit("direction", {direction: direction, t: t});
  emit("direction", {direction: direction, t: t});
}

