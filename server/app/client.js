var gameId = "game1";
var socket = io();

socket.emit("hello");
socket.emit("join", {gameId: gameId});

var moveFn = function () {
  console.log("need to set a move fn");
}

var lastMove = 0;
socket.on("direction", function (params) {
  if (lastMove > params.t) return;
  lastMove = params.t;
  moveFn(params.direction);
});


window.moves = {
  setMove: function (fn) {
    moveFn = fn;
  },

  sendMove: function (direction) {
    console.log("sending a move in a direction");
    socket.emit("move", {gameId: gameId, direction: direction});
  },
};

