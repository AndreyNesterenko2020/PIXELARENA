//preparations
var integrated_server = {};

//load stuff
importScripts("THREE.js");

//hook console
console.log = function (data) {
  postMessage(JSON.stringify({console: data+""}))
}

//hook modules
integrated_server.websockets = [];
integrated_server.readlines = [];
integrated_server.modules = {
  ws: {
    Server: class {
      constructor (parameter){
        this.port = parameter.port;
        integrated_server.websockets.push(this);
      }
      events = {};
      on = function (event, callback){this.events[event] = callback};
      send = function (data){postMessage(JSON.stringify({data: JSON.parse(data)}))};
    }
  },
  three: THREE,
  fs: {
    //not needed
  },
  readline: {
    createInterface: function () {
      this.question = function(question, callback){
        this.response = callback;
      }
      this.on = function (){};
      integrated_server.readlines.push(readline);
      return this;
    }
  }
}

//hook node js require function
function require(modulename) {
  var module = {};
  if(modulename.split("")[0] == ".") {
    importScripts("../"+modulename);
  } else {
    module = integrated_server.modules[modulename];
  }
  return module;
}

//hook node js process
var process = {stdin: true, stdout: {write: console.log}, exit: function (){postMessage(JSON.stringify({shutdown: true}))}};

//initialize server
importScripts("../server.js")

//recieve events
onmessage = function (data) {
  if(JSON.parse(data.data).connection) {
    //establish communication
    integrated_server.websockets.forEach(function (e) {
      e.events["connection"](e);
    });
  }
  if(JSON.parse(data.data).data) {
    integrated_server.websockets.forEach(function (e) {
      e.events["message"](JSON.stringify(JSON.parse(data.data).data));
    });
  }
  if(JSON.parse(data.data).input) {
    integrated_server.readlines.forEach(function (e) {
      console.log(JSON.parse(data.data).input);
      e.response(JSON.parse(data.data).input);
    });
  }
  if(JSON.parse(data.data).eval) {
    eval(JSON.parse(data.data).eval);
  }
}