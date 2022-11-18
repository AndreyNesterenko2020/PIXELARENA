//math mumbo jumbo
eulerQuaternion = function (rot) {
  var c1 = Math.cos(rot[1]*(Math.PI / 180)/2);
  var s1 = Math.sin(rot[1]*(Math.PI / 180)/2);
  var c2 = Math.cos(rot[2]*(Math.PI / 180)/2);
  var s2 = Math.sin(rot[2]*(Math.PI / 180)/2);
  var c3 = Math.cos(rot[0]*(Math.PI / 180)/2);
  var s3 = Math.sin(rot[0]*(Math.PI / 180)/2);
  var c1c2 = c1*c2;
  var s1s2 = s1*s2;
  var w =c1c2*c3 - s1s2*s3;
  var x =c1c2*s3 + s1s2*c3;
  var y =s1*c2*c3 + c1*s2*s3;
  var z =c1*s2*c3 - s1*c2*s3;
  return([x, y, z, w]);
};
quaternionEuler = function (q1) {
  var sqw = q1.w*q1.w;
  var sqx = q1.x*q1.x;
  var sqy = q1.y*q1.y;
  var sqz = q1.z*q1.z;
  var unit = sqx + sqy + sqz + sqw; // if normalised is one, otherwise is correction factor
  var test = q1.x*q1.y + q1.z*q1.w;
  if (test > 0.499*unit) { // singularity at north pole
    var heading = 2 * Math.atan2(q1.x,q1.w) * (180/Math.PI);
    var attitude = Math.PI/2 * (180/Math.PI);
    var bank = 0;
    return([bank, heading, attitude]);
  }
  if (test < -0.499*unit) { // singularity at south pole
    var heading = -2 * Math.atan2(q1.x,q1.w) * (180/Math.PI);
    var attitude = -Math.PI/2 * (180/Math.PI);
    var bank = 0;
    return([bank, heading, attitude]);
  }
  var heading = Math.atan2(2*q1.y*q1.w-2*q1.x*q1.z , sqx - sqy - sqz + sqw) * (180/Math.PI);
  var attitude = Math.asin(2*test/unit) * (180/Math.PI);
  var bank = Math.atan2(2*q1.x*q1.w-2*q1.y*q1.z , -sqx + sqy - sqz + sqw) * (180/Math.PI);
  return([bank, heading, attitude]);
};