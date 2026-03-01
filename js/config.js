//load the config file from the expected place
function getConfig() {
  //load file here
  if(typeof Buffer != "undefined") { //nodejs environment
    return require("fs").readFileSync("../CONFIG.INI","utf-8");
  } else { //browser environment
    var req = new XMLHttpRequest();
    req.open("GET","../CONFIG.INI",false);
    req.send();
    if (req.status === 200) return req.responseText;
  }
}

//parse ini by file content
function parseConfig(content) {// result[section][value]
  var result = {};
  var section = "";
  content.split("\n").forEach(function(line) {
    var inSection = false;
    var inKey = true;
    var key = "";
    var inValue = false;
    var stringQuotes = "-1"; // "-1" (not initted), ""(none), "\"", and "'" possible values
    var value = "";
    var stop = false;
    line.split("").forEach(function(character) {
      if((character == ";" || character == "#") && (stringQuotes != "'" && stringQuotes != "\"")) {
        stop = true;
      }
      if(stop) return;
      if(character == "[" && !inValue) {
        inSection = true;
        inKey = false;
        section = "";
        return;
      }
      if(character == "]" && !inValue) {
        inSection = false;
        result[section] = {};
        return;
      }
      if(inSection) {
        section += character;
        //console.log("Appended "+character+" to section");
      }
      if(character == "=" && inKey) {
        inKey = false;
        inValue = true;
        return;
      }
      if(inKey) {
        key += character;
        //console.log("Appended "+character+" to key");
      }
      if(inValue) {
        if(stringQuotes == "-1" && character != " " && !(character == "\"" || character == "'")) { //if we see a non-space, non-quote chracter begin we know its a string-less value
          stringQuotes = "";
        }
        if(stringQuotes == "-1" && (character == "\"" || character == "'")) { //if we see a " or ' its a stringed value
          stringQuotes = character;
        }
        if(character == stringQuotes) {
          return;
        }
        if(stringQuotes == "-1") return;
        value += character;
        //console.log("Appended "+character+" to value");
      }
    });
    if(key && section && key.replaceAll(" ","")) result[section][key.trimStart().trimEnd()] = stringQuotes ? value : value.trimEnd();
  });
  
  return result;
}

//standard procedure
function getValues() {
  var a = getConfig();
  var b = parseConfig(a);
  if(!b.GAME) {
    console.log("The INI file was found but it is was structured incorrectly. There must be a section GAME (in INI syntax: [GAME]).");
    return;
  }
  globalThis.CONFIG_SERVER = b.GAME.CONFIG_SERVER;
  globalThis.CERT_KEY = b.GAME.CERT_KEY;
  globalThis.CERT_CHAIN = b.GAME.CERT_CHAIN;
  globalThis.CONFIG_MAP = b.GAME.CONFIG_MAP;
  //console.log("Applied config",b);
}

//fetch
getValues();