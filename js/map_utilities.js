try {
  THREE = require("THREE") || THREE;
} catch (e) {}

function defineUtilities() {
  ;(globalThis['editor'] || globalThis).testTexture = function (src, callback) {
    var image = new Image();
    image.src = src;
    image.onerror = function () {
      callback(false);
    }
    image.onload = function () {
      callback(true);
    }
  }
  ;(globalThis['editor'] || globalThis).get_json = function(url, callback) {
    if(typeof File != "undefined") {
      //browser
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'json';
      xhr.onload = xhr.onerror = function() {
        var status = xhr.status;
        if (status === 200) {
          callback(null, xhr.response);
        } else {
          callback(status, xhr.response);
        }
      };
      xhr.send();
    } else {
      //node js
      fs.readFile(url, "utf8", callback);
    }
  }
  ;(globalThis['editor'] || globalThis).object_types = {
    box: {geometry: globalThis.geometry, material: new THREE.MeshBasicMaterial({alphaTest: 0.95}), textured: true, unsavable: false},
    spawn: {geometry: new THREE.SphereGeometry(1, 1, 1), material: new THREE.MeshBasicMaterial({color: "lime"}), textured: false, unsavable: false},
    bound_visualization: {geometry: globalThis.geometry, material: new THREE.MeshBasicMaterial({color: "skyblue", depthTest: false}), textured: false, unsavable: true},
  }
  ;(globalThis['editor'] || globalThis).textureChecks = function (object, finish) {
    var path = "assets/textures/map/";
    (globalThis['editor'] || globalThis).testTexture(path+object.texture+".png", function(result1){
      !result1 && (globalThis['editor'] || globalThis).testTexture("assets/textures/"+object.texture+".png", function(result2){
        path = "assets/textures/";
        !result2 && (globalThis['editor'] || globalThis).testTexture(object.texture+".png", function(result3){
          !result3 && (globalThis['editor'] || globalThis).testTexture("assets/maps/"+object.texture+".png", function(result4){
            path = "assets/maps/";
            if(!result4) path = "";
            finish(path);
          });
          result3 && finish(path);
        });
        result2 && finish(path);
      });
      result1 && finish(path);
    });
  }
  globalThis.resetSky = function() {
    scene.background = new THREE.Color("#ffffff");
  }
  globalThis.loadSky = function(texture) {
    var textures = [];
    for(var i = 0; i < arguments.length; i++) {
      if(!arguments[i]) {
        throw new Error;
      }
      a = new Image(16,16);
      a.src="assets/textures/"+arguments[i];
      textures.push(a);
    }
    if(textures.length == 1) {
      textures = [textures[0], textures[0], textures[0], textures[0], textures[0], textures[0]];
    }
    textures[arguments.length-1].onload = function () {
    scene.background = new THREE.CubeTexture(textures);
    scene.background.needsUpdate = true;
    }
  }
}

if(typeof document != "undefined") {
  document.addEventListener("DOMContentLoaded", defineUtilities);
} else {
  defineUtilities();
}