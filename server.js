var WebSocket = require('ws');
var THREE = require('three');
var fs = require('fs');
var https = require('https');
require('./js/weaponTypes.js');
require('./js/MATH_UTILITIES.js');
require('./js/mapLoader.js');
require('./js/mapTypes.js');
CERT_KEY = undefined;
CERT_CHAIN = undefined;
try {
  require('./config.js');
  CERT_KEY = fs.readFileSync(CERT_KEY, 'utf8');
  CERT_CHAIN = fs.readFileSync(CERT_CHAIN, 'utf8');
} catch (e) {};
var httpsServer = undefined;
var server = undefined;
if(CERT_KEY) {
  httpsServer = https.createServer({key: CERT_KEY, cert: CERT_CHAIN}).listen(7071);
  server = new WebSocket.Server({server: httpsServer});
} else {
  server = new WebSocket.Server({port: 7071});
}
var userDatabase = {};
var scene = new THREE.Scene();
var geometry = new THREE.BoxGeometry();
loadMap("map_arena", scene, geometry);
var floor = {};
floor.shape = new THREE.Mesh(geometry);
floor.shape.scale.set(100,1,100);
floor.shape.position.y = -1;
//scene.add(floor.shape);
floor.shape.updateMatrixWorld();
var raycaster = new THREE.Raycaster;
raycaster.set(new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, -1, 0));
var title = "monkey-operated server console 🙈🙉🙊🐵🐒";
process.stdout.write(String.fromCharCode(27) + "]0;" + title + String.fromCharCode(7));
function createCharacter (id) {
  var char = new THREE.Mesh(geometry);
  char.scale.set(1,4,1);
  char.name = "PLAYER_CHARACTER";
  char.ID = id;
  scene.add(char);
  return char;
}
function disconnect (user, reason) {
  if(!reason) reason = "disconnected";
  if(user.metadata.id && userDatabase[user.metadata.id]) {
    for(var i = 0; i < Object.values(userDatabase).length; i++) { 
      Object.values(userDatabase)[i].ws.send('{"disconnect_user":"'+user.metadata.id+'", "reason": "'+reason+'", "username": "'+user.metadata.username+'"}')
    }
    user.ws.terminate();
    userDatabase[user.metadata.id].character.removeFromParent();
    delete(userDatabase[user.metadata.id]);
    console.log(user.metadata.username+" disconnected");
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
  setTimeout(function () {userDatabase[user].teleporting = false;},90);
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
server.on('connection', (ws) => {
  var id = uuidv4();
  var username = "ERRORNAME";
  var metadata = {id, username};
  userDatabase[id] = {lastActivity: Date.now(), ws: ws, metadata: metadata, oldx: 0, oldy: 2, oldz: 0, x: 0, y: 2, z: 0, rx: 0, ry: 0, walking: false, crouch: false, weapon: "NONE", character: createCharacter(id), quaternion: new THREE.Quaternion(0,0,0,1), health: 100, lastShoot: 0, ammo: 0, reloading: false, isDead: false, lastDeath: 0, teleporting: false, lastAttacker: "", weapon_ammo: {}};
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
    if(data.chatMessage) {
      if(data.chatMessage.length > 69) {
        disconnect(ws.user, "detected by anti-cheat");
        return;
      }
      Object.values(userDatabase).forEach(function (item) {
        item.ws.send(JSON.stringify(data));
      });
      return;
    }
    if(data.jump) {
      Object.values(userDatabase).forEach(function (item) {
        item.ws.send(JSON.stringify(data));
      });
      return;
    }
    if(data.SHOOT_WEAPON) {
      if(userDatabase[id].weapon == "NONE") disconnect(ws.user, "detected by anti-cheat");
      try {
        if(userDatabase[id].isDead) return;
        if(Date.now() - userDatabase[id].lastShoot < GAME_WEAPON_TYPES[userDatabase[id].weapon].shootTime*1000) {
          return
        }
        if(userDatabase[id].reloading) return;
        userDatabase[id].lastShoot = Date.now();
        var objects = [];
        scene.children.forEach(function (child) {
          if(child.ID != id && !(child.name == "PLAYER_CHARACTER" && userDatabase[child.ID].health == 0)) {
            objects.push(child);
          }
        });
        raycaster.set(new THREE.Vector3(userDatabase[id].x, userDatabase[id].y+1.5384615384615385, userDatabase[id].z), new THREE.Vector3(1, 0, 0).applyQuaternion(userDatabase[id].quaternion), 0, Infinity);
        var results = raycaster.intersectObjects(objects);
        var hit = {distance: Infinity, start: new THREE.Vector3(userDatabase[id].x, userDatabase[id].y+1.5384615384615385, userDatabase[id].z), position: new THREE.Vector3(userDatabase[id].x, userDatabase[id].y+1.5384615384615385, userDatabase[id].z).addScaledVector(new THREE.Vector3(1, 0, 0).applyQuaternion(userDatabase[id].quaternion), 100)}
        if(results[0]) {
          hit = {position: results[0].point, distance: results[0].distance, normal: results[0].face.normal, start: new THREE.Vector3(userDatabase[id].x, userDatabase[id].y+1.5384615384615385, userDatabase[id].z)};
          hit.start.add(new THREE.Vector3(GAME_WEAPON_TYPES[userDatabase[id].weapon].muzzlePoint.x, GAME_WEAPON_TYPES[userDatabase[id].weapon].muzzlePoint.y, GAME_WEAPON_TYPES[userDatabase[id].weapon].muzzlePoint.z).applyQuaternion(userDatabase[id].character.quaternion));
        }
        isPlayer = false;
        if(results[0] && (results[0].object.name == "PLAYER_CHARACTER")) isPlayer = results[0].object.ID;
        var headshot = results[0] && (results[0].point.y - results[0].object.position.y) > 1;
        userDatabase[id].ammo--;
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
      return;
    }
    if(data.RELOAD_WEAPON) {
      reload(id);
    }
    var metadata = ws.user.metadata;
    if(!data.username) return;
    if(data.username.length > 16) {
      disconnect(ws.user, "detected by anti-cheat");
      return;
    }
    if(userDatabase[id].oldusername && (data.username != userDatabase[id].oldusername)) {
        disconnect(ws.user, "detected by anti-cheat");
        return;
    }
    if(!GAME_WEAPON_TYPES[data.weapon] && data.weapon != "NONE") {
      disconnect(ws.user, "detected by anti-cheat");
      return
    }
    for(var i = 0; i < Object.values(userDatabase).length; i++) {
      var user = Object.values(userDatabase)[i];
      if(user.metadata.id == ws.user.metadata.id) continue;
      if(user.metadata.username == data.username) {
        disconnect(ws.user, "username taken");
        return;
      }
    };
    if(data.weapon != userDatabase[id].weapon && userDatabase[id].reloading) {
      disconnect(ws.user, "detected by anti-cheat");
      return
    }
    if(data.weapon != userDatabase[id].weapon && data.weapon != "NONE") userDatabase[id].ammo = userDatabase[id].weapon_ammo[data.weapon] || GAME_WEAPON_TYPES[data.weapon].ammo;
    metadata.username = data.username;
    if(!console_logged) {
      console_logged = true;
      console.log(metadata.username+" connected");
    }
    try {
      userDatabase[id] = {lastActivity: Date.now(), ws: ws, metadata: metadata, oldx: userDatabase[id].x, oldy: userDatabase[id].y, oldz: userDatabase[id].z, x: data.x, y: data.y, z: data.z, rx: data.rx, ry: data.ry, oldusername: data.username, walking: data.walking, crouch: data.crouch, weapon: data.weapon, character: userDatabase[id].character, quaternion: userDatabase[id].quaternion, health: userDatabase[id].health, lastShoot: userDatabase[id].lastShoot, ammo: userDatabase[id].ammo, reloading: userDatabase[id].reloading, isDead: userDatabase[id].isDead, lastDeath: userDatabase[id].lastDeath, teleporting: userDatabase[id].teleporting, lastAttacker: userDatabase[id].lastAttacker, weapon_ammo: userDatabase[id].weapon_ammo};
    } catch (e) {
      disconnect(ws.user, "failed to establish a secure connection");
      return
    }
    data.sender = metadata.id;
    data.username = metadata.username;
    data.health = userDatabase[id].health;
    data.ammo = userDatabase[id].ammo;
    Object.values(userDatabase).forEach(function (item) {
      data.me = item.metadata.id;
      item.ws.send(JSON.stringify(data))
    });
    if(Date.now() - userDatabase[id].lastDeath > 5000 && userDatabase[id].isDead) {
      userDatabase[id].health = 100;
      userDatabase[id].isDead = false;
      Object.values(userDatabase).forEach(function (item) {
        item.ws.send(JSON.stringify({respawn: id}));
      });
      teleport(id, 0, 2, 0);
    }
    var dist = Math.sqrt(Math.pow(userDatabase[id].oldx - userDatabase[id].x, 2)+Math.pow(userDatabase[id].oldy - userDatabase[id].y, 2)+Math.pow(userDatabase[id].oldz - userDatabase[id].z, 2));
    if(dist > 0.3 && !userDatabase[id].teleporting) {
      disconnect(ws.user, "detected by anti-cheat");
    };
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
    var client = userDatabase[Object.values(userDatabase)[i].metadata.id];
    if(client.health < 0) client.health = 0;
    if(client.health == 0 && !client.isDead) {
      client.isDead = true;
      Object.values(userDatabase).forEach(function (item) {
        item.ws.send(JSON.stringify({death: client.metadata.id, killer: client.lastAttacker}));
      });
      client.lastDeath = Date.now();
    }
    try {
      var rot = eulerQuaternion([0, client.ry+90, 0]);
      var rot2 = eulerQuaternion([0, client.ry+90, client.rx]);
      client.character.position.set(client.x, client.y, client.z);
      client.quaternion.set(rot2[0], rot2[1], rot2[2], rot2[3]);
      client.character.quaternion.set(rot[0], rot[1], rot[2], rot[3]);
      client.character.updateMatrixWorld();
    } catch (e) {};
    if(client.lastActivity - Date.now() < -3000){
      disconnect(client);
    }
  }
  setTimeout(serverTick, 1);
}
serverTick();
console.log("server up");