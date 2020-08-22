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
function solidColorChange(input,whichcolor) {
  var newColor = input.jscolor.toString("hex");
  if(lastColor != newColor) {
    sendRequest("solidColor", newColor);
    lastColor = newColor;
  }
  document.getElementById(whichcolor).style.backgroundColor = newColor;
  console.log(newColor);
  var r = newColor.substring(1,3);
  console.log(r);
  var g = newColor.substring(3,5);
  console.log(g);
  var b = newColor.substring(5,7);
  console.log(b);
  var total = (parseInt(r,16) + parseInt(g,16) + parseInt(b,16))/3;
  console.log(total);
  if(total > 128){
    document.getElementById(whichcolor).style.color = "#000000";
  }
  else{
    document.getElementById(whichcolor).style.color = "#FFFFFF";
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
var lightSize = 20;
var border = 1;
var lightsPos = [
[10, 10],
[10, 50],
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
var lightsColor = Array(20).fill("#FF0000");

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



var backgroundColor = "#808080";

function drawMultiLights() {
  var canvas = document.getElementById("manyColorCanvas");
  canvas.addEventListener('mousemove', function(event) {
    if(event.buttons % 2 == 1) {
      checkLightsMouse(event);
    }
  });

  canvas.addEventListener('click', checkLightsMouse);
  var ctx = canvas.getContext("2d");
  ctx.fillStyle=backgroundColor;
  ctx.fillRect(0,0,canvas.width, canvas.height);
  ctx.fillStyle="#000000";
  for(var i=0; i<lightsPos.length; i++) {
    //drawLEDFrame(ctx, lightsPos[i][0], lightsPos[i][1]);
    if(i==1)
      break;
  }
  redrawLights();
}

function hexToRgb(hex) {
  return /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex).slice(1).map(x => parseInt(x, 16));
}
function componentToHex(c) {
    var hex = Math.min(255, Math.max(0, c)).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(color) {
  return "#" + color.map(x => componentToHex(Math.round(x))).join('');
}

function redrawLights() {
  var canvas = document.getElementById("manyColorCanvas");
  var ctx = canvas.getContext("2d");
  for(var i=0; i<lightsPos.length; i++) {
    var x = lightsPos[i][0];
    var y = lightsPos[i][1];
    var glowColor = rgbToHex(hexToRgb(lightsColor[i]).map(x => x + 130));

    ctx.beginPath();
    var glow = ctx.createRadialGradient(
      x + lightSize/2, y+lightSize/2, lightSize/3,
      x + lightSize/2, y+lightSize/2, lightSize/1);
    glow.addColorStop(0, glowColor);
    glow.addColorStop(1, backgroundColor);
    ctx.fillStyle = glow;
    ctx.arc(x + lightSize/2, y+lightSize/2, lightSize/1, 0, 2 * Math.PI, false);
    ctx.fill();



    //ctx.fillStyle = "#FFFFFF";
    //ctx.fillRect(x, y, lightSize, lightSize);
    //ctx.beginPath();
    //ctx.fillStyle = glowColor;
    //ctx.arc(x + lightSize/2, y+lightSize/2, lightSize/2, 0, 2 * Math.PI, false);
    //ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = lightsColor[i];
    ctx.arc(x + lightSize/2, y+lightSize/2, lightSize/3, 0, 2 * Math.PI, false);
    ctx.fill();

    ctx.strokeStyle="#000000";
    ctx.lineWidth = 1;
    // draw outer rectangle
    ctx.strokeRect(x, y, lightSize, lightSize);
    var innerRect = lightSize/8;
    ctx.strokeRect(x+innerRect, y+innerRect, lightSize-2*innerRect, lightSize-2*innerRect);
    ctx.beginPath()
    ctx.moveTo(x, y);
    ctx.lineTo(x+innerRect, y+innerRect);
    ctx.moveTo(x, y+lightSize);
    ctx.lineTo(x+innerRect, y+lightSize-innerRect);
    ctx.moveTo(x+lightSize, y);
    ctx.lineTo(x+lightSize-innerRect, y+innerRect);
    ctx.moveTo(x+lightSize, y+lightSize);
    ctx.lineTo(x+lightSize-innerRect, y+lightSize-innerRect);
    ctx.stroke();
    //ctx.beginPath();
    //ctx.lineWidth = 1;
    // draw larger circle
    //ctx.arc(x + lightSize/2, y+lightSize/2, lightSize/2, 0, 2 * Math.PI, false);
    //ctx.stroke();
    //ctx.beginPath();
    //ctx.arc(x + lightSize/2, y+lightSize/2, lightSize/3, 0, 2 * Math.PI, false);
    //ctx.stroke();
    if(i==1)
      break;
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
