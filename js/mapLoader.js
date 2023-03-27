try {
  THREE = require('three');
  fs = require('fs');
} catch (e) {}
default_map_limits = [Infinity, -Infinity, Infinity, -Infinity, Infinity, -Infinity];
loadMap = async function (NAME, scene_, geometry_) {
  var scene = scene_ || window.scene;
  var geometry = geometry_ || window.geometry;
  globalThis.map_data = false;
  var special_case = false;
  try {
    special_case = JSON.parse(NAME, function (k,v){if(v=="-Infinity"){return -Infinity};if(v=="Infinity"){return Infinity};return v});
  } catch(e){}
  get_json(typeof WorkerGlobalScope == "undefined" && "assets/maps/"+NAME+".MAP" || "../assets/maps/"+NAME+".MAP", function(a,e){
    map_data = typeof e == "object" && e || JSON.parse(e, function (k,v){if(v=="-Infinity"){return -Infinity};if(v=="Infinity"){return Infinity};return v}) || special_case;
    if(!e && !special_case) return false;
    //skybox
    setTimeout(function() {
      try {
        resetSky();
        map_data.skybox[0] && loadSky(...map_data.skybox);
      } catch (e) {
        try {
          chatMessage("failed to load map skybox")
        } catch (e) {}
      }
    }, 50);
    if(globalThis.MAP) {
      globalThis.MAP.collisions.forEach(function (collision) {
        world.remove(collision);
      });
      globalThis.MAP.removeFromParent();
      globalThis.MAP = undefined;
    }
    var map_group = new THREE.Object3D();
    scene.add(map_group);
    map_group.limits = map_data.boundaries || default_map_limits;
    if(!map_group.limits[0]) map_group.limits = default_map_limits;
    map_group.collisions = [];
    map_group.objects = [];
    map_data.objects.forEach(function (object) {
      if(object[0]) return;
      var mesh = new THREE.Mesh(object_types[object.type] && object_types[object.type].geometry || geometry, object_types[object.type] && !object_types[object.type].textured && object_types[object.type].material || undefined);
      mesh.position.set(object.position.x, object.position.y, object.position.z);
      mesh.rotation.set(object.rotation.x*0.017453292519943295, object.rotation.y*0.017453292519943295, object.rotation.z*0.017453292519943295);
      mesh.scale.set(object.scale.x, object.scale.y, object.scale.z);
      if(!(object.invisible || (typeof CANNON == "undefined" && object.unHittable))) map_group.add(mesh);
      var material = object.material;
      if(!object.material) {
        material = "concrete";
      }
      mesh.MATERIAL = material;
      mesh.type = object.type || "box";
      mesh.updateMatrixWorld();
      map_group.objects.push(mesh);
      if(typeof CANNON != "undefined") {
        if(object.collidable) {
          collision = new CANNON.Body({mass: 0, material: collisionMaterial});
          var rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(object.rotation.x*0.017453292519943295, object.rotation.y*0.017453292519943295, object.rotation.z*0.017453292519943295));
          collision.quaternion.copy(rotation);
          collision.position.set(object.position.x, object.position.y, object.position.z);
          collision.addShape(new CANNON.Box(new CANNON.Vec3(object.scale.x/2, object.scale.y/2, object.scale.z/2)));
          world.add(collision);
          map_group.collisions.push(collision);
        }
      }
      if(typeof createMaterial != "undefined") {
        if(object_types[object.type] && !object_types[object.type].textured) return;
        setTimeout(function() {
          mesh.material.color = new THREE.Color(object.color);
          if(!mesh.material.map) return;
          mesh.material.map.needsUpdate = true;
          mesh.material.map.repeat.x = object.texture_stretch && object.texture_stretch[0] || 1;
          mesh.material.map.repeat.y = object.texture_stretch && object.texture_stretch[1] || 1;
          mesh.material.map.wrapS=mesh.material.map.wrapT=THREE.RepeatWrapping;
        }, 100);
        if(!object.texture) {
          return;
        }
        textureChecks(object, finish);
        function finish(path){
          createMaterial((!object.texture.includes("data:") && (path.replace("assets/textures/", "").replace("assets/maps/", "../maps/")) || "")+object.texture, object.texture.includes("data:"));
          mesh.material = materials[(!object.texture.includes("data:") && (path.replace("assets/textures/", "").replace("assets/maps/", "../maps/")) || "")+object.texture];
        }
      }
    });
    globalThis.MAP = map_group;
    return map_group;
  });
}