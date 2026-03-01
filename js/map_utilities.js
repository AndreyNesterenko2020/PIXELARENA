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
          callback(null, xhr.response||false);
        } else {
          callback(status, xhr.response||false);
        }
      };
      xhr.send();
    } else {
      //node js
      fs.readFile(url, "utf8", function(a,b){callback(a,b ?  JSON.parse(b, function (k,v){if(v=="-Infinity"){return -Infinity};if(v=="Infinity"){return Infinity};return v}) : false)});
    }
  }
  ;(globalThis['editor'] || globalThis).object_types = {
    box: {geometry: threeJs.geometry, material: new THREE.MeshBasicMaterial({alphaTest: 0.45}), textured: true, unsavable: false},
    spawn: {geometry: new THREE.SphereGeometry(1, 1, 1), material: new THREE.MeshBasicMaterial({color: "lime"}), textured: false, unsavable: false},
    bound_visualization: {geometry: threeJs.geometry, material: new THREE.MeshBasicMaterial({color: "skyblue", depthTest: false,transparent:true,opacity:0.5}), textured: false, unsavable: true},
  }
  ;(globalThis['editor'] || globalThis).textureChecks = function (object, finish) {
    typeof object == "string" ? object = {texture:object.endsWith(".png")?object.slice(0,object.length-4):object}: 0
    var path = "assets/textures/map/";
    (globalThis['editor'] || globalThis).testTexture(path+object.texture+".png", function(result1){
      !result1 && (globalThis['editor'] || globalThis).testTexture("assets/textures/"+object.texture+".png", function(result2){
        path = "assets/textures/";
        !result2 && (globalThis['editor'] || globalThis).testTexture(object.texture+".png", function(result3){
          path = "";
          !result3 && (globalThis['editor'] || globalThis).testTexture("assets/maps/"+object.texture+".png", function(result4){
            path = "assets/maps/";
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
    threeJs.scene.background = new THREE.Color("#ffffff");
  }
  globalThis.loadSky = function(texture) {
    var textures = [];
    for(let i = 0; i < arguments.length; i++) {
      if(!arguments[i]) {
        throw new Error;
      }
      let a = new Image(16,16);
      var arguments_ = arguments;
      (globalThis['editor'] || globalThis).textureChecks(arguments[i],function(res){
        a.src=/*"assets/textures/"*/res+arguments_[i]+(arguments_[i].includes(".png")?"":".png");
      });
      textures.push(a);
    }
    if(textures.length == 1) {
      textures = [textures[0], textures[0], textures[0], textures[0], textures[0], textures[0]];
    }
    var loaded = 0;
    var arguments_ = arguments;
    textures.forEach(function (texture) {
      texture.onload = function () {
        loaded++;
        if(loaded == arguments_.length) {
          threeJs.scene.background = new THREE.CubeTexture(textures);
          threeJs.scene.background.needsUpdate = true;
        }
      }
    });
  }
}

if(typeof document != "undefined") {
  document.addEventListener("DOMContentLoaded", defineUtilities);
} else {
  globalThis.defineUtilities = defineUtilities;
}