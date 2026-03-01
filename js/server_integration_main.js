var integrated_server = {
  console_type: -1 // -1 null 0 window 1 editor window
};
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
      if(integrated_server.console_type != -1) {
        if(data_parsed.console.includes(String.fromCharCode(27) + "]0;") && data_parsed.console.includes(String.fromCharCode(7))) {
          var title = data_parsed.console.split(String.fromCharCode(27) + "]0;")[1].split(String.fromCharCode(7))[0];
          integrated_server.console_type == 0 ? integrated_server.console.document.title = title : integrated_server.console.windowHeader.childNodes[0].textContent = title;
          return
        }
        (integrated_server.console_type == 0 ? integrated_server.console.document : parent.document).getElementById("content").innerText += data_parsed.console+"\n";
        (integrated_server.console_type == 0 ? integrated_server.console.document.body : integrated_server.console.windowContents).children[1].scrollTo(0,(integrated_server.console_type == 0 ? integrated_server.console.document.body : integrated_server.console.windowContents).children[1].scrollHeight);
      } else {
        console.log(data_parsed.console);
      }
      return
     }
     if(data_parsed.shutdown) {
       integrated_server.server.close();
     }
     try {
       integrated_server.server.onmessage({data: JSON.stringify(data_parsed.data)});
     } catch (e) {
       chatMessage("Packet error: "+e);
     }
    } catch (e) {
      chatMessage("Integrated server error: "+e);
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
    //the contents of the window that we are about to open
    var contents = `
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
    <div id="content" style="overflow-y: scroll; max-height: 90%;scrollbar-width:none"></div>
    <blink style="float: left;" id="blink">_</blink>
    <input id="input" style="width: 90%; border: none; color: white; font-family: BlockBuilder3D; background-color: black; float: left; outline: none;font-size: 16;">
      `;
      
    //attempt to open a window
    integrated_server.console = open("about:blank", "_blank","width=677,height=343");
    if(integrated_server.console) {
      //the window was opened successfuly 
      integrated_server.console.document.body.style.backgroundColor = "black";
      integrated_server.console.document.body.style.color = "white";
      integrated_server.console.document.body.style.fontFamily = "BlockBuilder3D";
      integrated_server.console.document.title = "Console Window";
      integrated_server.console.document.body.innerHTML = contents;
      
      //set appropriate console type
      integrated_server.console_type = 0; //(window)
    } else if(parent.editor) {
      //okay, we failed to open a window, but we can try opening a map editor window if it is applicable
      integrated_server.console  = new parent.editor.Window(677,343);
      integrated_server.console.windowContents.style.backgroundColor = "black";
      integrated_server.console.windowContents.style.color = "white";
      integrated_server.console.windowContents.style.height = 343-30;
      integrated_server.console.windowContents.innerHTML = contents;
      integrated_server.console.windowContents.style.marginTop = "30px";
      
      //set appropriate console type
      integrated_server.console_type = 1; //(editor window)
    } else {
      //all else failed so just return
      alert("Failed to open a console window! Try disabling your popup blocker or just turn off the \"Console Window\" property!");
      return;
    }
    
    //add some events
    var html = integrated_server.console_type == 0 ? integrated_server.console.document : parent.document;
    html.addEventListener("keydown", function (event) {
       html.getElementById("blink").style.display = "none";
       html.getElementById("input").focus();
       if(event.key == "Enter") {
         integrated_server.server.worker.postMessage(JSON.stringify({input: html.getElementById("input").value}));
         integrated_server.lastInput = html.getElementById("input").value;
         html.getElementById("input").value = "";
         html.getElementById("input").blur();
         html.getElementById("blink").style.display = "block";
       }
       if(event.key == "ArrowUp") {
         html.getElementById("input").value = integrated_server.lastInput;
       }
     });
     addEventListener("beforeunload",function () {integrated_server.console.close()});
  }
  
  //return server
  return integrated_server.server;
}