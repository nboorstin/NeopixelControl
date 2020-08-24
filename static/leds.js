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
  setColorBox("solidColor");
}

function brightnessChange(input) {
  $(".sliderPercent").html(input.value + "%");
  //TODO: remove this if you find a way to not have two different brightness sliders
  $(".slider").val(input.value);
  sendRequest("brightness", input.value);
}

var solidColorHide = null;



// on tab switch
$(document).on('shown.bs.tab', function (e) {
  var newTab = $(e.target).attr("href");
  if(newTab == "#pills-solid-color") {
    setSolidColorpickerSize();
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
var lightsPos = [
  [10, 10],
  [10, 50],
  [10, 90],
  [10, 130],
  [10, 170],
  [10, 210],
  [10, 250],
  [10, 290],
  [10, 330],
  [10, 370]];
var lightsColor = Array(lightsPos.length).fill("#FF0000");

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

function colorBoxChange(input,whichcolor) {
  setColorBox(whichcolor);
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

window.onresize = function(event) {
  //TODO: wow ok this should just be a variable for what tab we're in
  if($("#solidColor")[0].jscolor.hide.toString().length < 13) {
    setSolidColorpickerSize();
  }
}

function setSolidColorpickerSize() {
  $("#solidColor")[0].jscolor.width = $("#pills-solid-color").width() - 57;
  $("#solidColor")[0].jscolor.height = $("#pills-solid-color").width() * 0.55;
  $("#solidColor").css("margin-bottom", $("#pills-solid-color").width() * 0.55 + 50);
  $("#solidColor")[0].jscolor.show();
}

function setColorBox(name) {
  var color = $("#"+name)[0].jscolor.toString("hex");
  $("#"+name).css("backgroundColor", color);
  $("#"+name).css("color", hexToRgb(color).reduce((a,b) => a+b)/3 > 128 ? "#000000" : "#FFFFFF");
}

window.onload = function() {
  // set brightness slider text
  var currSliderPercent = $(".slider").val();
  $(".sliderPercent").html(currSliderPercent + "%");
  //TODO: remove this if you find a way to not have two different brightness sliders
  $(".slider").val(currSliderPercent);

  //set solid color picker's size
  setSolidColorpickerSize();

  //hackishly keep the solid color open
  solidColorHide = document.getElementById("solidColor").jscolor.hide;
  document.getElementById("solidColor").jscolor.hide = function(){};

  //set the background color of the solid color boxes
  //I don't think this really belongs in this function tbh
  ["solidColor", "multiColorSelect", "gradientFirstColor", "gradientSecondColor"].map(c => setColorBox(c));

  // get current state
  sendRequest("getState", null, initialSetState);

  drawMultiLights();
}

function initialSetState(stateInfo) {
  var data = JSON.parse(stateInfo);
  for(var key in data) {
    switch(key) {
      case "on":
        document.getElementById("customSwitch1").checked = data.on;
        break;
      case "solidColor":
        document.getElementById("solidColor").jscolor.fromString(data.solidColor);
        setColorBox("solidColor");
        break;
      case "brightness":
        $(".sliderPercent").html(data.brightness + "%");
        $(".slider").val(data.brightness);
        break;
      case "manyColors":
        if(lightsColor.length <= data.manyColors.length) {
          lightsColor = data.manyColors;
        } else {
          lightsColor = data.manyColors + lightsColor.slice(data.manyColors.length);
        }
        drawMultiLights();
        break;
      case "mode":
        if(data.mode != 'solidColor') {
          var sel = null;
          switch(data.mode) {
            case "manyColors":
              sel = "many-colors"
              break;
            default:
          }
          if(sel != null) {
            document.querySelector('a[href="#pills-' + sel + '"]').click();
          }
        }
        break;
      default:
    }
  }
}
