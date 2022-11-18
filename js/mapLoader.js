try {
  THREE = require('three');
} catch (e) {}
loadMap = function (NAME, scene_, geometry_) {
  var scene = scene_ || window.scene;
  var geometry = geometry_ || window.geometry;
  if(!GAME_MAP_TYPES) return false;
  if(!GAME_MAP_TYPES[NAME]) return false;
  var map_group = new THREE.Object3D();
  scene.add(map_group);
  GAME_MAP_TYPES[NAME].forEach(function (object) {
    var mesh = new THREE.Mesh(geometry);
    mesh.position.set(object.position.x, object.position.y, object.position.z);
    mesh.rotation.set(object.rotation.x*0.017453292519943295, object.rotation.y*0.017453292519943295, object.rotation.z*0.017453292519943295);
    mesh.scale.set(object.scale.x, object.scale.y, object.scale.z);
    map_group.add(mesh);
    var material = object.material;
    if(!object.material) {
      material = "concrete";
    }
    mesh.MATERIAL = material;
    mesh.updateMatrixWorld();
    if(typeof CANNON != "undefined") {
      if(object.collidable) {
        collision = new CANNON.Body({mass: 0});
        var rotation = eulerQuaternion([object.rotation.x, object.rotation.y, object.rotation.z]);
        collision.quaternion.set(rotation[0], rotation[1], rotation[2], rotation[3]);
        collision.position.set(object.position.x, object.position.y, object.position.z);
        collision.addShape(new CANNON.Box(new CANNON.Vec3(object.scale.x/2, object.scale.y/2, object.scale.z/2)));
        world.add(collision);
      }
    }
    if(typeof createMaterial != "undefined") {
      if(!object.texture) {
        mesh.material = materials.defaultMaterial;
        return;
      }
      createMaterial("map/"+object.texture);
      mesh.material = materials["map/"+object.texture];
    }
  });
  return map_group;
}