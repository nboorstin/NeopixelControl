var lastSent = 0
var lastRequest = 0
var minDelay = 40;
async function sendRequest(name, value, callback = null) {
  var d = new Date()
  var thisRequest = lastRequest = d.getTime();
  if(d.getTime() - lastSent < minDelay) {
    await new Promise(r => setTimeout(r, minDelay));
    if(lastRequest != thisRequest) {
      return;
    }
	  console.log(d.getTime() - lastSent);
  }
  lastSent = d.getTime()

  var xhr = new XMLHttpRequest();

  var url = window.location.href;
  url = url.substring(0, url.lastIndexOf('/')) + "/response";


  xhr.open("POST", url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  if(callback != null) {
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status == 200) {
        callback(xhr.response);
      }
    }
  }
  xhr.send(JSON.stringify({
        [name]: value
  }));

}
function lightsOnOff(input) {
  sendRequest("on", input.checked);
}

// solid color handlers
var lastColor = null;
function solidColorChange(input) {
  var newColor = input.jscolor.toString("hex");
  if(lastColor != newColor) {
    sendRequest("solidColor", newColor);
    lastColor = newColor;
  }
}

function solidColorBrightnessChange(input) {
  document.getElementById("sliderPercent").innerHTML = input.value + "%";
  sendRequest("solidColorBrightness", input.value);
}

window.onload = function() {
  document.getElementById("sliderPercent").innerHTML =
    document.getElementById("solidColorBrightness").value + "%";
  document.getElementById("solidColor").jscolor.show();
  //hackishly keep this one open
  document.getElementById("solidColor").jscolor.hide = function(){};

  // get current state
  sendRequest("getState", null, initialSetState);
}

function initialSetState(stateInfo) {
  var data = JSON.parse(stateInfo)
  for(var key in data) {
    switch(key) {
      case "on":
        document.getElementById("customSwitch1").checked = data.on;
        break;
      case "solidColor":
        document.getElementById("solidColor").jscolor.fromString(data.solidColor);
        break;
      case "solidColorBrightness":
        document.getElementById("solidColorBrightness").value = data.solidColorBrightness;
        document.getElementById("sliderPercent").innerHTML = data.solidColorBrightness + "%";
      default:
    }

  }

}
