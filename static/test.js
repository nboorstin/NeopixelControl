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

var solidColorHide = null;

// on tab switch
$(document).on('shown.bs.tab', function (e) {
  var newTab = $(e.target).attr("href");
  if(newTab == "#pills-solid-color") {
    document.getElementById("solidColor").jscolor.show();
    solidColorHide = document.getElementById("solidColor").jscolor.hide;
    document.getElementById("solidColor").jscolor.hide = function(){};
    sendRequest("mode", "solidColor");
  } else {
    if(newTab == "#pills-many-colors") {
      sendRequest("mode", "manyColors");
    }
    document.getElementById("solidColor").jscolor.hide = solidColorHide;
    document.getElementById("solidColor").jscolor.hide();
  }
});
var lightSize = 10;
var border = 1;
var lightsPos = [
[10, 10],
[10, 22],
[10, 34],
[10, 46],
[10, 58],
[10, 70],
[10, 82],
[10, 94],
[10, 106],
[10, 118],
[10, 130],
[10, 142],
[10, 154],
[10, 166],
[10, 178],
[10, 190],
[10, 202],
[10, 214],
[10, 226],
[10, 238]];
var lightsColor = Array(20).fill("#FFFFFF");

function checkLightsMouse(e) {
  console.log(".");
  var canvas = document.getElementById("manyColorCanvas");
  var canvasLeft = canvas.offsetLeft + canvas.clientLeft;
  var canvasTop = canvas.offsetTop + canvas.clientTop;
  var x = event.pageX - canvasLeft,
    y = event.pageY - canvasTop;
  var changed = false;
  for(var i=0; i<lightsPos.length; i++) {
    if(lightsPos[i][0] <= x && lightsPos[i][0] + lightSize >= x &&
      lightsPos[i][1] <= y && lightsPos[i][1] + lightSize >= y) {
      console.log(i);
      changed = true;
      lightsColor[i] = document.getElementById("multiColorSelect").jscolor.toString("hex");
    }
  }
  if(changed) {
    redrawLights();
    sendRequest("manyColors", lightsColor);
  }
}
function drawMultiLights() {
  var canvas = document.getElementById("manyColorCanvas");
  canvas.addEventListener('mousemove', function(event) {
    if(event.buttons % 2 == 1) {
      checkLightsMouse(event);
    }
  });

  canvas.addEventListener('click', checkLightsMouse);
  var ctx = canvas.getContext("2d");
  //ctx.fillStyle="#808080";
  //ctx.fillRect(0,0,canvas.width, canvas.height);
  ctx.fillStyle="#000000";
  for(var i=0; i<lightsPos.length; i++) {
    ctx.fillRect(lightsPos[i][0], lightsPos[i][1], lightSize, lightSize);
  }
  redrawLights();
}
function redrawLights() {
  var canvas = document.getElementById("manyColorCanvas");
  var ctx = canvas.getContext("2d");
  for(var i=0; i<lightsPos.length; i++) {
    ctx.fillStyle = lightsColor[i];
    ctx.fillRect(lightsPos[i][0]+border, lightsPos[i][1]+border, lightSize-(2*border), lightSize-(2*border));
  }
}

function makeGradient() {
  var unfilledlist = [];
  var filledlist = [];
  for(var i = 0; i < lightsPos.length; i++){
    if(lightsColor[i] == "#FFFFFF"){
      unfilledlist.push(i);
    }
    else{
      filledlist.push(i);
    }
  }
  for(var i = 0; i < unfilledlist.length; i++){
    var total = 0;
    for(var j = 0; j < filledlist.length; j++){
      total = total + (1 / Math.sqrt((lightsPos[filledlist[j]][0] - lightsPos[unfilledlist[i]][0])**2 + (lightsPos[filledlist[j]][1] - lightsPos[unfilledlist[i]][1])**2));
    }
    var red = 0;
    var green = 0;
    var blue = 0;
    for(var j = 0; j < filledlist.length; j++){
      var thisdist = 1 / Math.sqrt((lightsPos[filledlist[j]][0] - lightsPos[unfilledlist[i]][0])**2 + (lightsPos[filledlist[j]][1] - lightsPos[unfilledlist[i]][1])**2);
      var proportion = thisdist/total;
      red = red + (proportion * parseInt(lightsColor[filledlist[j]].substring(1,3), 16));
      green = green + (proportion * parseInt(lightsColor[filledlist[j]].substring(3,5), 16));
      blue = blue + (proportion * parseInt(lightsColor[filledlist[j]].substring(5,7), 16));
    }
    var redint = Math.round(red);
    var greenint = Math.round(green);
    var blueint = Math.round(blue);
    colorstring = "#";
    colorstring += redint.toString(16);
    colorstring += greenint.toString(16);
    colorstring += blueint.toString(16);
    lightsColor[unfilledlist[i]] = colorstring;
  }
  redrawLights();
}

function clearLights(){
  for(var i = 0; i < lightsColor.length; i++){
    lightsColor[i] = "#FFFFFF";
  }
  redrawLights();
}

window.onload = function() {
  document.getElementById("sliderPercent").innerHTML =
    document.getElementById("solidColorBrightness").value + "%";
  document.getElementById("solidColor").jscolor.width = window.innerWidth * 0.9;
  document.getElementById("solidColor").jscolor.height =
    Math.min(window.innerWidth * 0.45, window.innerHeight * 0.45);
  document.getElementById("solidColor").jscolor.show();
  //hackishly keep this one open
  solidColorHide = document.getElementById("solidColor").jscolor.hide;
  document.getElementById("solidColor").jscolor.hide = function(){};

  // get current state
  sendRequest("getState", null, initialSetState);

  drawMultiLights();

  //just for testing
  document.querySelector('a[href="#pills-many-colors"]').click();
  var gradientbutton = document.getElementById("makeGradientButton");
  gradientbutton.addEventListener("click", makeGradient);
  var clearbutton = document.getElementById("clearlights");
  clearbutton.addEventListener("click", clearLights);
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
