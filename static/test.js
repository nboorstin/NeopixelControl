var lastSent = 0
var minDelay = 10;
async function sendRequest(name, value) {
  var d = new Date()
  if(d.getTime() - lastSent < minDelay) {
    lastSent = d.getTime()
    await new Promise(r => setTimeout(r, minDelay));
    if(d.getTime() - lastSent < 0) {
      return;
    }
  } else {
    lastSent = d.getTime()
  }

  var xhr = new XMLHttpRequest();

  var url = window.location.href;
  url = url.substring(0, url.lastIndexOf('/')) + "/response";


  xhr.open("POST", url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4 && xhr.status == 200) {
      //console.log(xhr.response);
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
  if(lastColor != input.value) {
    sendRequest("solidColor", input.value);
    lastColor = input.value;
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
}
