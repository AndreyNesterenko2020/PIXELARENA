var WebSocket = require('ws');
var THREE = require('three');
var fs = require('fs');
var readline = require('readline');
var https = require('https');
require('./js/weaponTypes.js');
require('./js/map_utilities.js');
require('./js/mapLoader.js');
var options = {noAnticheat: false, chatListen: false, infAmmo: false};
var commands = {
  toggleAnticheat: function(parameter){
    options.noAnticheat = !options.noAnticheat;
    return("Anticheat: "+!options.noAnticheat);
  }, toggleChat: function (parameter) {
    options.chatListen = !options.chatListen;
    return("Listening to chat: "+options.chatListen);
  },
  chat: function(parameter) {
    Object.values(userDatabase).forEach(function (item) {
      item.ws.send(JSON.stringify({chatMessage: parameter, username: "[SERVER]"}));
    });
    return "Sent message to all players";
  },
  shutdown: function (parameter) {
    var i = parameter;
    function _0xf01f () {
      commands.chat("Shutting down in "+i+" seconds");
      i--;
      if(i <= -1) {
        process.exit();
      }
      setTimeout(_0xf01f, 1000);
    }
    _0xf01f();
  },
  list: function (parameter) {
    for(var i = 0; i < Object.values(userDatabase).length; i++) {
      console.log("Player: "+Object.values(userDatabase)[i].username+" id: "+Object.values(userDatabase)[i].id+" kills: "+Object.values(userDatabase)[i].kills+" Deaths: "+Object.values(userDatabase)[i].deaths)
    }
    return("There "+(((Object.values(userDatabase).length!=1)&&"are")||"is")+" "+Object.values(userDatabase).length+" player"+(((Object.values(userDatabase).length!=1)&&"s")||"")+" online");
  },
  kick: function (parameter) {
    var player = false;
    var reason = "disconnected by server operator";
    if(parameter.split(" ")[1]) reason = parameter.split(parameter.split(" ")[0])[1];
    for(var i = 0; i < Object.values(userDatabase).length; i++) {
      if(Object.values(userDatabase)[i].username == parameter.split(" ")[0]) player = Object.values(userDatabase)[i];
    }
    if(player) disconnect(player, reason);
    return((player && ("disconnected "+parameter.split(" ")[0])+" for reason"+reason) || "Player not found");
  },
  kill: function (parameter) {
    var player = false;
    for(var i = 0; i < Object.values(userDatabase).length; i++) {
      if(Object.values(userDatabase)[i].username == parameter) player = Object.values(userDatabase)[i];
    }
    if(player) player.health = 0;
    return((player && ("killed "+parameter)) || "Player not found");
  },
  help: function (parameter) {
    return("Command list: \n"+Object.keys(commands).join().replaceAll(",","\n").replace("[","").replace("]",""));
  },
  teleport: function (parameter) {
    var player = false;
    for(var i = 0; i < Object.values(userDatabase).length; i++) {
      if(Object.values(userDatabase)[i].username == parameter.split(" ")[0]) player = Object.values(userDatabase)[i];
    }
    if(player) teleport(player.id, Number(parameter.split(" ")[1]), Number(parameter.split(" ")[2]), Number(parameter.split(" ")[3]));
    return((player && ("Teleported "+parameter.split(" ")[0])) || "Player not found");
  },
  infAmmo: function(parameter){
    options.infAmmo = !options.infAmmo;
    return("Infinite ammo: "+options.infAmmo);
  },
  map: function(parameter){
    loadMap(parameter, threeJs.scene, threeJs.geometry)
    Object.values(userDatabase).forEach(function (item) {
      item.ws.send(JSON.stringify({map: parameter}));
    });
    return("Set map to: "+parameter);
  }
};
var system_console = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
function response (e) {
  if(e.length > 0 && commands[e.split(" ")[0]]) {
    try {
      console.log(commands[e.split(" ")[0]](e.split(" ").splice(1).join(" ")));
    } catch (e) {
      console.log("An error has occured");
    }
  }
  system_console.question('', response);
}
system_console.question('', response);
system_console.on("close", function () {
  console.log("System console terminated. Press CTRL+C again to stop the server.");
})
CERT_KEY = undefined;
CERT_CHAIN = undefined;
CONFIG_MAP = false;
try {
  require('./js/config.js');
  CERT_KEY = fs.readFileSync(CERT_KEY, 'utf8');
  CERT_CHAIN = fs.readFileSync(CERT_CHAIN, 'utf8');
} catch (e) {};
var httpsServer = undefined;
var server = undefined;
if(CERT_KEY) {
  httpsServer = https.createServer({key: CERT_KEY, cert: CERT_CHAIN}).listen(7071);
  server = new WebSocket.Server({server: httpsServer});
  try {
    console.log("found certificates, starting server on "+CONFIG_SERVER);
  } catch (e) {
    console.log("found certificates, starting server locally");
  }
} else {
  server = new WebSocket.Server({port: 7071});
  console.log("no certificates found, starting server locally");
}
var userDatabase = {};
const threeJs = {
  scene: new THREE.Scene(),
  geometry: new THREE.BoxGeometry(),
  raycaster: new THREE.Raycaster
}
threeJs.raycaster.set(new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, -1, 0));
globalThis.threeJs = threeJs;

//prepare the map loading stuff after we define the three js objects ^
defineUtilities();

//////////////////////////////////////////////////
loadMap(CONFIG_MAP || "map_arena");
//////////////////////////////////////////////////

//set window title
var title = "monkey-operated server console 🙈🙉🙊🐵🐒";
process.stdout.write(String.fromCharCode(27) + "]0;" + title + String.fromCharCode(7));

//player object
const PLAYER_STATE_DEAD = 16;
const PLAYER_STATE_CROUCHED = 32;
const PLAYER_STATE_JUMPING = 64;
var players = [];
function createPlayer (id) {
  var char = new THREE.Mesh(threeJs.geometry);
  char.scale.set(1,4,1);
  char.name = "PLAYER_CHARACTER";
  char.ID = id;
  char.state = 0;
  threeJs.scene.add(char);
  players.push(char);
  return char;
}
function updatePlayer (id,data) {
  var char = players[players.indexOf(userDatabase[id].character)];
  if(!char) return;
  
  //states, this has been removed
  /*char.scale.y = 4;
  if(char.state & PLAYER_STATE_DEAD) {
    char.scale.y = 1;
  }
  if(char.state & PLAYER_STATE_CROUCHED) {
    char.scale.y = 3;
  }
  if(char.state & PLAYER_STATE_JUMPING) {
    char.scale.y = 4.1;
  }*/
  
  char.scale.y = data.hitbox_height;
}
function setState (id,state,boolean) {
  var char = players[players.indexOf(userDatabase[id].character)];
  if(!char) return;
  
  //set it
  char.state = boolean ? char.state | state : char.state | state == char.state ? char.state - state : char.state;
  
  //return new state value
  char.state;
}

function disconnect (user, reason) {
  if(!reason) reason = "disconnected";
  if(user.id && userDatabase[user.id]) {
    for(var i = 0; i < Object.values(userDatabase).length; i++) { 
      Object.values(userDatabase)[i].ws.send('{"disconnect_user":"'+user.id+'", "reason": "'+reason+'", "username": "'+user.username+'"}')
    }
    //user.ws.terminate();
    userDatabase[user.id].character.removeFromParent();
    players.indexOf(userDatabase[user.id].character) != -1 && players.splice(players.indexOf(userDatabase[user.id].character),1);
    delete(userDatabase[user.id]);
    console.log(user.username+" disconnected");
  }
}
function teleport (user, x, y, z) {
  userDatabase[user].teleporting = true;
  userDatabase[user].ws.send(JSON.stringify({teleport: {x: x, y: y, z: z}}));
  userDatabase[user].oldx = x;
  userDatabase[user].oldy = y;
  userDatabase[user].oldz = z;
  userDatabase[user].x = x;
  userDatabase[user].y = y;
  userDatabase[user].z = z;
}
function reload (id) {
  if(!userDatabase[id]) return;
  if(userDatabase[id].weapon == "NONE") return;
  if(userDatabase[id].reloading) return;
  Object.values(userDatabase).forEach(function (item) {
    item.ws.send(JSON.stringify({RELOAD_WEAPON: id}));
  });   
  userDatabase[id].reloading = true;
  setTimeout(function () {
    try {
      userDatabase[id].ammo = GAME_WEAPON_TYPES[userDatabase[id].weapon].ammo;
      userDatabase[id].reloading = false;
      userDatabase[id].weapon_ammo[userDatabase[id].weapon] = userDatabase[id].ammo;
    } catch (e) {};
  }, GAME_WEAPON_TYPES[userDatabase[id].weapon].reloadTime*1000);
  return true;
}
function respawn (id) {
  if(typeof MAP == "undefined") {
    setTimeout(a=>respawn(id),3);
    console.log("Waiting for map");
    return;
  }
  var spawns = [];
  MAP.objects.forEach(function (object) {
    object.type == "spawn" && spawns.push(object);
  });
  var selected = spawns[Math.floor(Math.random()*spawns.length)];
  teleport(id, selected && selected.position.x || 0, selected && selected.position.y || 2, selected && selected.position.z || 0);
}
server.on('connection', (ws) => {
  var id = uuidv4();
  var username = "ERRORNAME";
  var metadata = {id, username};
  userDatabase[id] = {lastActivity: Date.now(), ws: ws, id:id,username:username, oldx: 0, oldy: 2, oldz: 0, x: 0, y: 2, z: 0, rx: 0, ry: 0, walking: false, crouch: false, weapon: "NONE", character: createPlayer(id), quaternion: new THREE.Quaternion(0,0,0,1), health: 100, lastShoot: 0, ammo: 0, reloading: false, isDead: false, lastDeath: 0, teleporting: false, lastAttacker: "", weapon_ammo: {}, kills: 0, deaths: 0, lastOldPosition: Date.now()};
  ws.user = userDatabase[id];
  var console_logged = false;
  ws.on('message', (data) => {
    if(Object.values(userDatabase).length > 25) disconnect(ws.user, "server full");
    if(!userDatabase[id]) return;
    try {
      data = JSON.parse(data);
    } catch (e) {
      disconnect(ws.user, "invalid data");
      return;
    }
    
    //update the player entity
    data.ENTITY_UPDATE_PACKET && updatePlayer(id,data);
    
    if(data.teleported) {
      setTimeout(function(){userDatabase[id].teleporting = false;}, 10);
      return;
    }
    if(data.chatMessage) {
      if(userDatabase[id].teleporting) {return};
      if(data.chatMessage.length > 69) {
        !options.noAnticheat && disconnect(ws.user, "detected by anti-cheat");
        return;
      }
      if(data.username != userDatabase[id].username) {
        !options.noAnticheat && disconnect(ws.user, "detected by anti-cheat");
        return;
      }
      Object.values(userDatabase).forEach(function (item) {
        item.ws.send(JSON.stringify(data));
      });
      if(options.chatListen) console.log(data.username+": "+data.chatMessage);
      return;
    }
    if(data.jump) {
      if(userDatabase[id].teleporting) {return};
      Object.values(userDatabase).forEach(function (item) {
        item.ws.send(JSON.stringify({jump: id}));
      });
      return;
    }
    if(data.SHOOT_WEAPON) {
      //validation
      if(userDatabase[id].teleporting) {return};
      if(userDatabase[id].weapon == "NONE") !options.noAnticheat && disconnect(ws.user, "detected by anti-cheat");
      if(userDatabase[id].isDead) return;
      if(Date.now() - userDatabase[id].lastShoot < GAME_WEAPON_TYPES[userDatabase[id].weapon].shootTime*1000) {
        return
      }
      if(userDatabase[id].reloading) return;
    
      //shooting logic
      userDatabase[id].lastShoot = Date.now();
      function _() {
      try {
        var objects = [];
        threeJs.scene.children.forEach(function (child) {
          if(child.ID != id && !(child.name == "PLAYER_CHARACTER" && userDatabase[child.ID].health == 0)) {
            objects.push(child);
          }
        });
        threeJs.raycaster.set(new THREE.Vector3(userDatabase[id].x, userDatabase[id].y+userDatabase[id].hitbox_height/2, userDatabase[id].z), new THREE.Vector3(1, 0, 0).applyQuaternion(userDatabase[id].quaternion), 0, Infinity);
        var results = threeJs.raycaster.intersectObjects(objects);
        var hit = {distance: Infinity, start: new THREE.Vector3(userDatabase[id].x, userDatabase[id].y+userDatabase[id].hitbox_height/2, userDatabase[id].z), position: new THREE.Vector3(userDatabase[id].x, userDatabase[id].y+1.5384615384615385, userDatabase[id].z).addScaledVector(new THREE.Vector3(1, 0, 0).applyQuaternion(userDatabase[id].quaternion), 555),isMelee:!!GAME_WEAPON_TYPES[userDatabase[id].weapon].meleeRange}
        if(!!GAME_WEAPON_TYPES[userDatabase[id].weapon].meleeRange ? results[0] && results[0].distance <= GAME_WEAPON_TYPES[userDatabase[id].weapon].meleeRange : results[0]) {
          hit = {position: results[0].point, distance: results[0].distance, normal: results[0].face.normal.clone().divide(results[0].object.scale).applyQuaternion(results[0].object.quaternion).normalize(), start: new THREE.Vector3(userDatabase[id].x, userDatabase[id].y+1.5384615384615385, userDatabase[id].z), material: results[0].object.MATERIAL,isMelee:hit.isMelee};
          hit.start.add(new THREE.Vector3(GAME_WEAPON_TYPES[userDatabase[id].weapon].muzzlePoint.x, GAME_WEAPON_TYPES[userDatabase[id].weapon].muzzlePoint.y, GAME_WEAPON_TYPES[userDatabase[id].weapon].muzzlePoint.z).applyQuaternion(userDatabase[id].character.quaternion));
        }
        isPlayer = false;
        if((!!GAME_WEAPON_TYPES[userDatabase[id].weapon].meleeRange ? results[0] && results[0].distance <= GAME_WEAPON_TYPES[userDatabase[id].weapon].meleeRange : results[0]) && (results[0].object.name == "PLAYER_CHARACTER")) isPlayer = results[0].object.ID;
        var headshot = results[0] && (results[0].point.y - results[0].object.position.y) > 1;
        !options.infAmmo && userDatabase[id].ammo--;
        userDatabase[id].weapon_ammo[userDatabase[id].weapon] = userDatabase[id].ammo;
        Object.values(userDatabase).forEach(function (item) {
          item.ws.send(JSON.stringify({SHOOT_WEAPON: hit, isPlayer: isPlayer, attacker: id, headshot: headshot}));
        });
        if(isPlayer) {
          userDatabase[isPlayer].health -= GAME_WEAPON_TYPES[userDatabase[id].weapon].damage;
          if(headshot) userDatabase[isPlayer].health -= GAME_WEAPON_TYPES[userDatabase[id].weapon].headshotBonus;
          userDatabase[isPlayer].lastAttacker = id;
        }
        if(userDatabase[id].ammo == 0) {
          reload(id);
        }
      } catch (e) {console.log(e)};
      }
      
      //send animation packet
      Object.values(userDatabase).forEach(function (item) {
        item.ws.send(JSON.stringify({shootWeaponAnimation: id}));
      });
      
      //we might want a delay
      if(GAME_WEAPON_TYPES[userDatabase[id].weapon].hitDelay) {
        setTimeout(_,GAME_WEAPON_TYPES[userDatabase[id].weapon].hitDelay);
      } else {
        _();
      }
      return;
    }
    if(data.RELOAD_WEAPON) {
      if(userDatabase[id].teleporting) {return};
      reload(id);
      return;
    }
    var metadata = ws.user.metadata;
    if(!data.username) return;
    if(data.username.length > 16) {
      !options.noAnticheat && disconnect(ws.user, "detected by anti-cheat");
      return;
    }
    if(userDatabase[id].oldusername && (data.username != userDatabase[id].oldusername)) {
      !options.noAnticheat && disconnect(ws.user, "detected by anti-cheat");
      return;
    }
    if(!GAME_WEAPON_TYPES[data.weapon] && data.weapon != "NONE") {
      !options.noAnticheat && disconnect(ws.user, "detected by anti-cheat");
      return
    }
    for(var i = 0; i < Object.values(userDatabase).length; i++) {
      var user = Object.values(userDatabase)[i];
      if(user.id == ws.user.id) continue;
      if(user.username == data.username) {
        disconnect(ws.user, "username taken");
        return;
      }
    };
    if(data.username == "[SERVER]") {
      disconnect(ws.user, "reserved username");
      return
    };
    if(data.weapon != userDatabase[id].weapon && userDatabase[id].reloading) {
      !options.noAnticheat && disconnect(ws.user, "detected by anti-cheat");
      return
    }
    if(data.weapon != userDatabase[id].weapon && data.weapon != "NONE") userDatabase[id].ammo = userDatabase[id].weapon_ammo[data.weapon] || GAME_WEAPON_TYPES[data.weapon].ammo;
    ws.user.username = data.username;
    if(!console_logged) {
      console_logged = true;
      console.log(ws.user.username+" connected");
      ws.send(JSON.stringify({map:map_name}));
      setTimeout(function () {
        respawn(id);
      }, 10);
    }
    try {
      userDatabase[id] = {lastActivity: Date.now(), ws: ws, id:id,username:data.username, oldx: userDatabase[id].oldx, oldy: userDatabase[id].oldy, oldz: userDatabase[id].oldz, x: data.x, y: data.y, z: data.z, rx: data.rx, ry: data.ry, oldusername: data.username, walking: data.walking, crouch: data.crouch, weapon: data.weapon, character: userDatabase[id].character, quaternion: userDatabase[id].quaternion, health: userDatabase[id].health, lastShoot: userDatabase[id].lastShoot, ammo: userDatabase[id].ammo, reloading: userDatabase[id].reloading, isDead: userDatabase[id].isDead, lastDeath: userDatabase[id].lastDeath, teleporting: userDatabase[id].teleporting, lastAttacker: userDatabase[id].lastAttacker, weapon_ammo: userDatabase[id].weapon_ammo, kills: userDatabase[id].kills, deaths: userDatabase[id].deaths, lastOldPosition: userDatabase[id].lastOldPosition,hitbox_height:data.hitbox_height};
      ws.send(JSON.stringify({pong: data.ping}));
    } catch (e) {
      disconnect(ws.user, "failed to establish a secure connection");
      return
    }
    
    //replicate the player entity packet to all network clients, setting the sender's id first, and also passing some authoritative information
    data.sender = id;
    //data.username = userDatabase[id].username;
    data.health = userDatabase[id].health;
    data.ammo = userDatabase[id].ammo;
    data.kills = userDatabase[id].kills;
    //data.walking = userDatabase[id].walking;
    Object.values(userDatabase).forEach(function (item) {
      data.me = item.id;
      item.ws.send(JSON.stringify(data))
    });
    
    //handle respawns
    if(Date.now() - userDatabase[id].lastDeath > 5000 && userDatabase[id].isDead) {
      userDatabase[id].health = 100;
      userDatabase[id].isDead = false;
      userDatabase[id].weapon_ammo = {};
      if(userDatabase[id].weapon != "NONE") {
        userDatabase[id].ammo = GAME_WEAPON_TYPES[userDatabase[id].weapon].ammo;
      }
      Object.values(userDatabase).forEach(function (item) {
        item.ws.send(JSON.stringify({respawn: id}));
      });
      respawn(id);
    }
    
    //handle teleporting players
    if(userDatabase[id].teleporting) {
      userDatabase[id].oldx = userDatabase[id].x;
      userDatabase[id].oldy = userDatabase[id].y;
      userDatabase[id].oldz = userDatabase[id].z;
    }
    
    //anticheat
    var dist = Math.sqrt(Math.pow(userDatabase[id].oldx - userDatabase[id].x, 2)+Math.pow(userDatabase[id].oldy - userDatabase[id].y, 2)+Math.pow(userDatabase[id].oldz - userDatabase[id].z, 2));
    if(dist > 22 && !userDatabase[id].teleporting) {
      !options.noAnticheat && [console.log(userDatabase[id].username+" moved wrongly!"),teleport(id,userDatabase[id].oldx,userDatabase[id].oldy,userDatabase[id].oldz)];//disconnect(ws.user, "detected by anti-cheat"); too harsh!
    };
    try {
      if(userDatabase[id].x > MAP.limits[0] || userDatabase[id].x < MAP.limits[1] || userDatabase[id].y > MAP.limits[2] || userDatabase[id].y < MAP.limits[3] || userDatabase[id].z > MAP.limits[4] || userDatabase[id].z < MAP.limits[5]) (!map_data.onBoundaryLeave || map_data.onBoundaryLeave == "Kick from server") ? !options.noAnticheat && disconnect(ws.user, "detected by anti-cheat") : map_data.onBoundaryLeave == "Kill" ? userDatabase[id].health = 0 : teleport(id,userDatabase[id].oldx,userDatabase[id].oldy,userDatabase[id].oldz);
    } catch (e) {}
  });
  ws.on("close", () => {
    disconnect(ws.user); 
  });
});
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
function serverTick(){
  for(var i = 0; i < Object.values(userDatabase).length; i++) {
    var client = userDatabase[Object.values(userDatabase)[i].id];
    if(client.health < 0) client.health = 0;
    if(client.health == 0 && !client.isDead) {
      client.isDead = true;
      client.deaths += 1;
      if(client.lastAttacker && userDatabase[client.lastAttacker]) userDatabase[client.lastAttacker].kills += 1;
      Object.values(userDatabase).forEach(function (item) {
        item.ws.send(JSON.stringify({death: client.id, killer: client.lastAttacker}));
      });
      client.lastDeath = Date.now();
    }
    try {
      var rot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, THREE.MathUtils.degToRad(client.ry+90), 0));
      var rot2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, THREE.MathUtils.degToRad(client.ry+90), THREE.MathUtils.degToRad(client.rx)));
      client.character.position.set(client.x, client.y, client.z);
      client.quaternion.copy(rot2);
      client.character.quaternion.copy(rot);
      client.character.updateMatrixWorld();
    } catch (e) {};
    if(client.lastActivity - Date.now() < -10000){
      disconnect(client);
    }
    if((client.lastOldPosition - Date.now() < -1000)) {
      client.lastOldPosition = Date.now();
      client.oldx = client.x;
      client.oldy = client.y;
      client.oldz = client.z;
    }
  }
  setTimeout(serverTick, 1);
}
serverTick();
console.log("server up");