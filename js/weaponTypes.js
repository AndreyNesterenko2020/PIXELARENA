//ammo: how much ammo in a mag (undefined if N/A)
//shotTime: delay in seconds between shots
//reloadTime: length of reload in seconds (undefined if N/A)
//model: the name of the model file
//damage: the base damage
//automatic: can ths weapon shoot repeatedly if the mouse is held down?
//muzzlePoint: where the bullet trail comes from relative to the model center (undefined if N/A)
//headshotBonus: how much extra damage on headshot
//recoil: recoil on shot
//zoomfov: how much fov when zooming in (undefined if N/A)
//meleeRange: if this is not undefined, this is a melee weapon and this means how far you can hit other players
//hitDelay: if this is not undefined, there will be a delay after the weapon is fired for damage to be processed

GAME_WEAPON_TYPES = {
  "AK-47": {ammo: 30, shootTime: 0.1, reloadTime: 2, model: "ak-47", damage: 12, automatic: true, muzzlePoint: {x: 0, y: 0.35, z: 2}, headshotBonus: 3, recoil: 1, zoomfov: 30},
  "Pistol": {ammo: 10, shootTime: 0.3, reloadTime: 1.5, model: "pistol", damage: 14, automatic: false, muzzlePoint: {x: 0, y: 0.35, z: -1}, headshotBonus: 8, recoil: 5, zoomfov: 55},
  "M24": {ammo: 1, shootTime: 0.5, reloadTime: 2.1, model: "m24", damage: 34, automatic: false, muzzlePoint: {x: 0, y: 0.35, z: 3.05}, headshotBonus: 31, recoil: 10, zoomfov: 25},
  "fists": {ammo: undefined, shootTime: 1, reloadTime: 2.1, model: "fists", damage: 34, automatic: false, muzzlePoint: {x: 0, y: 0.35, z: 3.05}, headshotBonus: 31, recoil: 10, zoomfov: Infinity, meleeRange: 3.5,hitDelay:300}
}