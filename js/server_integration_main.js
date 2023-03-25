var integrated_server = {};
integrated_server.init = function (noconsole) {
  //load integrated server
  integrated_server.server = {
    worker: new Worker("js/integrated_server.js"),
  }

  //hook websocket
  integrated_server.server.send = function (data){
    integrated_server.server.worker.postMessage(JSON.stringify({data: JSON.parse(data)}));
  }
  integrated_server.server.close = function () {
    integrated_server.server.readyState = 3;
    integrated_server.server.worker.terminate();
    integrated_server.console && integrated_server.console.close();
  };
  integrated_server.server.worker.onmessage = function (data) {
    try {
     var data_parsed = JSON.parse(data.data);
     if(data_parsed.console) {
      if(integrated_server.console) {
        if(data_parsed.console.includes(String.fromCharCode(27) + "]0;") && data_parsed.console.includes(String.fromCharCode(7))) {
          integrated_server.console.document.title = data_parsed.console.split(String.fromCharCode(27) + "]0;")[1].split(String.fromCharCode(7))[0];
          return
        }
        integrated_server.console.document.getElementById("content").innerText += data_parsed.console+"\n";
        integrated_server.console.scrollTo(0,integrated_server.console.document.body.scrollHeight);
      } else {
        console.log(data_parsed.console);
      }
      return
     }
     if(data_parsed.shutdown) {
       integrated_server.server.close();
     }
     integrated_server.server.onmessage({data: JSON.stringify(data_parsed.data)});
    } catch (e) {
    
    }
  }
  
  //hook websocket functions with proper delay
  ;(async() => {
    //wait until onopen event exists
    while(!integrated_server.server.onopen) {
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    //prepare server and fire important events when ready
    integrated_server.server.readyState = 1;
    integrated_server.server.worker.onerror = integrated_server.server.onerror;
    integrated_server.server.worker.postMessage(JSON.stringify({connection: 1}));
    integrated_server.server.onopen();
  })();
  
  //create console window
  integrated_server.console = null;
  if(!noconsole) {
    integrated_server.console = open("about:blank", "_blank","width=677,height=343");
    integrated_server.console.document.body.style.backgroundColor = "black";
    integrated_server.console.document.body.style.color = "white";
    integrated_server.console.document.body.style.fontFamily = "BlockBuilder3D";
    integrated_server.console.document.title = "Console Window";
    integrated_server.console.document.body.innerHTML = `
    <style>
      @font-face {
        font-family: BlockBuilder3D;
        src: url("assets/font/BlockBuilder3D.ttf");
      }
      blink {
        animation: 2s linear infinite blink_effect;
      }
      @keyframes blink_effect {
        0% {
          visibility: hidden;
        }
        50% {
          visibility: hidden;
        }
        100% {
          visibility: visible;
        }
      }
    </style>
    <div id="content"></div>
    <blink style="float: left;" id="blink">_</blink>
    <input id="input" style="width: 90%; border: none; color: white; font-family: BlockBuilder3D; background-color: black; float: left; outline: none;font-size: 16;">
      `;
     integrated_server.console.addEventListener("keypress", function (event) {
       integrated_server.console.document.getElementById("blink").style.display = "none";
       integrated_server.console.document.getElementById("input").focus();
       if(event.key == "Enter") {
         integrated_server.server.worker.postMessage(JSON.stringify({input: integrated_server.console.document.getElementById("input").value}));
         integrated_server.console.document.getElementById("input").value = "";
         integrated_server.console.document.getElementById("input").blur();
         integrated_server.console.document.getElementById("blink").style.display = "block";
       }
     });
     addEventListener("beforeunload",function () {integrated_server.console.close()});
  }
  
  //return server
  return integrated_server.server;
}