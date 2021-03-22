var lastSent = 0
var lastRequest = 0
var minDelay = 40;
async function sendRequest(name, value, callback = null) {
  //console.log("sending " + name);
  //console.trace();
  var d = new Date()
  var thisRequest = lastRequest = d.getTime();
  if(d.getTime() - lastSent < minDelay) {
    await new Promise(r => setTimeout(r, minDelay));
    if(lastRequest != thisRequest) {
      return;
    }
    //console.log(d.getTime() - lastSent);
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
  $(":checkbox").prop('checked', input.checked);
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

function randomnessChange(input) {
  $(".sliderPercent2").html(input.value + "%");
  for(var i=0; i<lightsPos.length; i++) {
    if(lightsSelected[i] == false){
      var red = Math.floor(Math.random() * Math.floor(255));
      var green = Math.floor(Math.random() * Math.floor(255));
      var blue = Math.floor(Math.random() * Math.floor(255));
      var randomcolor = rgbToHexString(red, green, blue);
      lightsColor[i] = blendColors([randomcolor, lightsColorSet[i]], [input.value, 100-input.value]);
    }
  }
  redrawLights();
  sendRequest("randomness", input.value);
}

function patternChange(input) {
  $(".sliderPercent1").html(input.value + "%");
  var inverse = 100 - input.value;
  $(".sliderPercent2inverse").html(inverse + "%");
  //TODO: remove this if you find a way to not have two different brightness sliders
  // $(".slider").val(input.value);
  sendRequest("gradient", input.value);
}

function brightnessChange(input) {
  $(".sliderPercent3").html(input.value + "%");
  //TODO: remove this if you find a way to not have two different brightness sliders
  $(".slider3").val(input.value);
  centerSliders();
  console.log(input.value);
  sendRequest("brightness", input.value);
}

function blendColors(colorlist, percentagelist){
  var red = 0;
  var blue = 0;
  var green = 0;
  for(var i = 0; i < colorlist.length; i++){
    red = red + (parseInt(colorlist[i].substring(1,3),16) * percentagelist[i]/100);
    green = green + (parseInt(colorlist[i].substring(3,5),16) * percentagelist[i]/100);
    blue = blue + (parseInt(colorlist[i].substring(5,7),16) * percentagelist[i]/100);
  }
  red = Math.round(red);
  green = Math.round(green);
  blue = Math.round(blue);
  return rgbToHexString(red, green, blue);
}

function rgbToHexString(red, green, blue){
  var redstring = red.toString(16);
  if(redstring.length < 2){
    redstring = "0" + redstring;
  }
  var greenstring = green.toString(16);
  if(greenstring.length < 2){
    greenstring = "0" + greenstring;
  }
  var bluestring = blue.toString(16);
  if(bluestring.length < 2){
    bluestring = "0" + bluestring;
  }
  var hexstring = "#" + redstring + greenstring + bluestring;
  return hexstring;
}

var solidColorHide = null;



// on tab switch
function activateTab(button, pageId) {
  /* thank you stackoverflow https://stackoverflow.com/a/1029252 */
  if(button.className == "topbutton-active") {
    return;
  }
  $(".topbutton-active")[0].className = "topbutton";
  button.className = "topbutton-active";

  var tabCtrl = document.getElementById('tabCtrl');
  var pageToActivate = document.getElementById(pageId);
  for (var i = 0; i < tabCtrl.childNodes.length; i++) {
    var node = tabCtrl.childNodes[i];
    if (node.nodeType == 1) { /* Element */
      node.style.display = (node == pageToActivate) ? 'block' : 'none';
    }
  }
  if(pageId == 'tabSolidColor') {
    setSolidColorpickerSize();
    solidColorHide = document.getElementById("solidColor").jscolor.hide;
    document.getElementById("solidColor").jscolor.hide = function(){};
    sendRequest("mode", "solidColor");
  } else {
    if(pageId == 'tabManyColorEntry') {
      sendRequest("mode", "manyColors");
      setMultiColorpickerSize();
      centerSliders();
    } else if (pageId == 'tabManyColorSelect') {
      sendRequest('mode', 'manyColorSelect');
    } else if (pageId == 'tabAnimate') {
      sendRequest('mode', 'animate');
    } else {
      console.log(pageId);
    }
    document.getElementById("solidColor").jscolor.hide = solidColorHide;
    document.getElementById("solidColor").jscolor.hide();
  }
}



var lightsPos = [
[0, 0],
[0, 1],
[0, 2],
[0, 3],
[0, 4],
[0, 5],
[0, 6],
[0, 7],
[0, 8],
[0, 9],
[0, 10],
[0, 11],
[0, 12],
[0, 13],
[0, 14],
[1, 14],
[2, 14],
[3, 14],
[4, 14],
[5, 14],
[6, 14],
[7, 14],
[8, 14],
[9, 14],
[9, 13],
[9, 12],
[9, 11],
[9, 10],
[9, 9],
[9, 8],
[9, 7],
[9, 6],
[9, 5],
[9, 4],
[9, 3],
[9, 2],
[9, 1],
[9, 0],
[8, 0],
[7, 0],
[6, 0],
[5, 0],
[4, 0],
[3, 0],
[2, 0],
[1, 0],
];
var lightsColor = Array(lightsPos.length).fill("#FF0000");
var lightsColorSet = Array(lightsPos.length).fill("#FF0000");
var lightsSelected = Array(lightsPos.length).fill(false);
lightsSelected[0] = lightsSelected[14] = lightsSelected[23] = lightsSelected[37] = true;

function checkLightsMouse(e) {
  var canvas = document.getElementById("manyColorCanvas");
  var canvasLeft = canvas.offsetLeft + canvas.clientLeft;
  var canvasTop = canvas.offsetTop + canvas.clientTop;
  var x = (event.pageX - canvasLeft) * window.devicePixelRatio,
    y = (event.pageY - canvasTop) * window.devicePixelRatio;
  var changed = false;
  var countX = 1+Math.max.apply(Math, lightsPos.map(function (o) {return o[0];}));
  var countY = 1+Math.max.apply(Math, lightsPos.map(function (o) {return o[1];}));
  var spacing = 0.75;
  spacing += 1;
  var sizeX = canvas.width / (spacing * countX);
  var sizeY = canvas.height / (spacing * countY);
  var size = Math.min(sizeX, sizeY);
  for(var i=0; i<lightsPos.length; i++) {
    if(lightsSelected[i]){
      var xPos = (sizeX - size)*spacing*countX/2 + ((spacing/4)+lightsPos[i][0]) * spacing * size;
      var yPos = (sizeY - size)*spacing*countY/2 + ((spacing/4)+lightsPos[i][1]) * spacing * size;
      if(xPos - (1.5*size / (spacing+1)) <= x && xPos + (1.5*size / (spacing+1)) >= x &&
        yPos - (1.5*size / (spacing+1)) <= y && yPos + (1.5*size / (spacing+1)) >= y) {
        changed = true;
        overlayOn(i, event.pageX, event.pageY);
        // lightsColor[i] = document.getElementById("multiColorSelect").jscolor.toString("hex");
      }
    }
  }
  // if(changed) {
  //   redrawLights();
  //   sendRequest("manyColors", lightsColor);
  // }
}

function colorBoxChange(input,whichcolor) {
  setColorBox(whichcolor);
}

var backgroundColor = "#ccccccff";

function drawMultiLights(redraw=false) {
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
  if (redraw) {
    redrawLights();
  }
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

  var countX = 1+Math.max.apply(Math, lightsPos.map(function (o) {return o[0];}));
  var countY = 1+Math.max.apply(Math, lightsPos.map(function (o) {return o[1];}));
  var spacing = 0.75;
  spacing += 1;
  var sizeX = canvas.width / (spacing * countX);
  var sizeY = canvas.height / (spacing * countY);
  var size = Math.min(sizeX, sizeY);
  // override spacing if it's too big
  //size = Math.min(size, 30);

  var ctx = canvas.getContext("2d");
  for(var i=0; i<lightsPos.length; i++) {
    var x = (sizeX - size)*spacing*countX/2 + ((spacing/4)+lightsPos[i][0]) * spacing * size;
    var y = (sizeY - size)*spacing*countY/2 + ((spacing/4)+lightsPos[i][1]) * spacing * size;

    ctx.beginPath();

    ctx.beginPath();
    ctx.fillStyle = lightsColor[i];
    ctx.lineWidth = 2;
    if (lightsSelected[i]) {
      ctx.strokeStyle = 'white';
      ctx.arc(x, y, 1.5*size / (spacing+1), 0, 2 * Math.PI, false);
    } else {
      ctx.strokeStyle = 'black';
      ctx.arc(x, y, size / (spacing+1), 0, 2 * Math.PI, false);
    }
    ctx.fill();
    ctx.stroke();

    //// ctx.strokeStyle="#000000";
    //if(lightsSelected[i]){
    //  ctx.strokeStyle = "#FFFFFF";
    //}
    //else{
    //  ctx.strokeStyle="#000000";
    //}
    //ctx.lineWidth = 1;
    //// draw outer rectangle
    //ctx.strokeRect(x, y, lightSize, lightSize);
    //var innerRect = lightSize/8;
    //ctx.strokeRect(x+innerRect, y+innerRect, lightSize-2*innerRect, lightSize-2*innerRect);
    //ctx.beginPath()
    //ctx.moveTo(x, y);
    //ctx.lineTo(x+innerRect, y+innerRect);
    //ctx.moveTo(x, y+lightSize);
    //ctx.lineTo(x+innerRect, y+lightSize-innerRect);
    //ctx.moveTo(x+lightSize, y);
    //ctx.lineTo(x+lightSize-innerRect, y+innerRect);
    //ctx.moveTo(x+lightSize, y+lightSize);
    //ctx.lineTo(x+lightSize-innerRect, y+lightSize-innerRect);
    //ctx.stroke();
  }
  sendRequest("manyColors", lightsColor);
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
  } else {
    setMultiColorpickerSize();
  }
  centerSliders();
}

function centerSliders() {
  // eh fuck it just do all the text sliders at once
  for(slider of $(".sliderText")) {
    w = slider.getBoundingClientRect().width;
    if(w != 0) {
      parentWidth = slider.parentElement.getBoundingClientRect().width;
      slider.style.marginLeft = (parentWidth - w) / 2 + "px";
    }
  }
}

function setSolidColorpickerSize() {
  var width = $("#solidColor").width();
  $("#solidColor")[0].jscolor.width = width - 52;
  // idk why this is wrong but the extra 53 makes it almost ok so....
  var height = $(window).height() - $("#solidColorCenter").offset().top - $("#solidColorSliders").height() - 73;
  $("#solidColor")[0].jscolor.height = height - 50;
  $("#solidColor").css("margin-bottom", height);
  $("#solidColor")[0].jscolor.show();
}

function setMultiColorpickerSize(redraw=true) {
  //TODO: maybe filling the screen isn't the best idea?
  var width = $("#manyColorEntryCenter").width() * .99;
  var canvas = document.getElementById("manyColorCanvas");
  canvas.style.width = width + 'px';
  canvas.width = width * window.devicePixelRatio;
  var height = $(window).height() - $("#manyColorEntryCenter").offset().top - $("#manyColorEntrySliders").height() - 73;
  height = height + 26;
  canvas.style.height = height + 'px';
  canvas.height = height * window.devicePixelRatio;
  drawMultiLights(redraw);
}

function setColorBox(name) {
  var color = $("#"+name)[0].jscolor.toString("hex");
  $("#"+name).css("backgroundColor", color);
  $("#"+name).css("color", hexToRgb(color).reduce((a,b) => a+b)/3 > 128 ? "#000000" : "#FFFFFF");
}


window.onload = function() {
  // document.getElementById("defaultOpen").click();
  // set brightness slider text
  var currSliderPercent = $(".slider1").val();
  $(".sliderPercent1").html(currSliderPercent + "%");
  $(".slider1").val(currSliderPercent);
  var currSliderPercent = $(".slider2").val();
  $(".sliderPercent2").html(currSliderPercent + "%");
  var inverse = 100 - currSliderPercent
  $(".sliderPercent2inverse").html(inverse + "%");
  $(".slider2").val(currSliderPercent);
  var currSliderPercent = $(".slider3").val();
  $(".sliderPercent3").html(currSliderPercent + "%");
  $(".slider3").val(currSliderPercent);

  document.addEventListener('mousedown', onDocumentMouseDown, false);
  //set solid color picker's size
  setSolidColorpickerSize();

  //try to set canvas size
  setMultiColorpickerSize(false);

  //*shrug*
  centerSliders();

  //hackishly keep the solid color open
  solidColorHide = document.getElementById("solidColor").jscolor.hide;
  document.getElementById("solidColor").jscolor.hide = function(){};

  //just for now, set the default to many colors
  //activateTab($(".topbutton")[0], 'tabManyColorEntry');
  centerSliders();

  //set the background color of the solid color boxes
  //I don't think this really belongs in this function tbh
  //["solidColor", "multiColorSelect", "gradientFirstColor", "gradientSecondColor"].map(c => setColorBox(c));
  ["solidColor"].map(c => setColorBox(c));

  // get current state
  sendRequest("getState", null, initialSetState);
}

function initialSetState(stateInfo) {
  var data = JSON.parse(stateInfo);
  for(var key in data) {
    switch(key) {
      case "on":
        $(":checkbox").prop('checked', data.on);
        break;
      case "solidColor":
        document.getElementById("solidColor").jscolor.fromString(data.solidColor);
        setColorBox("solidColor");
        break;
      case "brightness":
        $(".sliderPercent3").html(data.brightness + "%");
        $(".slider3").val(data.brightness);
        break;
      case "randomness":
        $(".sliderPercent2").html(data.randomness + "%");
        $(".slider2").val(data.randomness);
        break;
      case "gradient":
        $(".sliderPercent1").html(data.gradient + "%");
        $(".slider1").val(data.gradient);
        break;
      case "manyColors":
        console.log("!!!");
        if(lightsColor.length <= data.manyColors.length) {
          lightsColor = data.manyColors;
        } else {
          lightsColor = data.manyColors + lightsColor.slice(data.manyColors.length);
        }
        //redrawLights(); //for some reason this isn't actually necessary here
        break;
      case "mode":
        var loadedTab = '';
        switch(data.mode) {
          case 'solidColor':
            loadedTab = 'tabSolidColor';
          activateTab($(".topbutton-active")[0], loadedTab);
            break;
          case 'manyColors':
            loadedTab = 'tabManyColorEntry';
          activateTab($(".topbutton")[0], loadedTab);
            break;
          default:
            console.log(data.mode);
        }
        break;
      default:
        console.log(key);
    }
  }
}

var selectiontab = 0;

function setShape(shape){
  selectiontab = shape;
  console.log("shapechange");
  console.log(shape);
}

function drawRect(){
  var canvas = document.getElementById("manyColorCanvas");
  var isrectangle = true;
  var startx = 0;
  var starty = 0;
  var endx = 0;
  var endy = 0;
  const context = canvas.getContext('2d');
  var isSelecting = false;
  canvas.addEventListener('mousedown', e => {
    startx = e.offsetX;
    starty = e.offsetY;
    endx = startx;
    endy = starty;
    isSelecting = true;
  });
  canvas.addEventListener('mousemove', e => {
    if(isSelecting && isrectangle){
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawMultiLights();
      endx = e.offsetX;
      endy = e.offsetY;
      //figure out how to display temp rectangle
      context.beginPath();
      context.moveTo(startx, starty);
      context.lineTo(endx, starty);
      context.lineTo(endx, endy);
      context.lineTo(startx, endy);
      context.lineTo(startx, starty);
      context.closePath();
      context.lineWidth = 2;
      context.strokeStyle = 'black';
      context.stroke();
    }
  });
  canvas.addEventListener('mouseup', e => {
    if(isrectangle){
      endx = e.offsetX;
      endy = e.offsetY;
      isSelecting = false;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle=backgroundColor;
      ctx.fillRect(0,0,canvas.width, canvas.height);
      ctx.fillStyle="#000000";
      for(var i = 0; i < lightsPos.length; i++){
        var x = lightsPos[i][0];
        var y = lightsPos[i][1];
        if(((x > startx && x < endx) || (x < startx && x > endx)) && ((y > starty && y < endy) || (y < starty && y > endy))){
          lightsSelected[i] = true;
        }
        else{
          if(((x+lightSize > startx && x+lightSize < endx) || (x+lightSize < startx && x+lightSize > endx)) && ((y+lightSize > starty && y+lightSize < endy) || (y+lightSize < starty && y+lightSize > endy))){
            lightsSelected[i] = true;
          }
        }
      }
      redrawLights();
      isrectangle = false;
    }
  });
}

function drawCircle(){
  var canvas = document.getElementById("manyColorCanvas");
  var startx = 0;
  var starty = 0;
  var endx = 0;
  var endy = 0;
  const context = canvas.getContext('2d');
  var isSelecting = false;
  var iscircle = true;
  canvas.addEventListener('mousedown', e => {
    startx = e.offsetX;
    starty = e.offsetY;
    endx = startx;
    endy = starty;
    isSelecting = true;
  });
  canvas.addEventListener('mousemove', e => {
    if(isSelecting && iscircle){
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawMultiLights();
      endx = e.offsetX;
      endy = e.offsetY;
      //figure out how to display temp circle
      context.beginPath();
      context.arc((startx + endx)/2, (starty + endy)/2, Math.abs(startx - endx)/2, 0, 2*Math.PI, false);
      context.closePath();
      context.lineWidth = 2;
      context.strokeStyle = 'black';
      context.stroke();
    }
  });
  canvas.addEventListener('mouseup', e => {
    if(iscircle){
      endx = e.offsetX;
      endy = e.offsetY;
      isSelecting = false;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle=backgroundColor;
      ctx.fillRect(0,0,canvas.width, canvas.height);
      ctx.fillStyle="#000000";
      for(var i = 0; i < lightsPos.length; i++){
        var x = lightsPos[i][0];
        var y = lightsPos[i][1];
        var cx = (startx + endx)/2;
        var cy = (starty + endy)/2;
        var r = Math.abs(startx - endx)/2;
        var dist1 = Math.sqrt((x-cx)**2 + (y-cy)**2);
        var dist2 = Math.sqrt((x+lightSize-cx)**2 + (y+lightSize-cy)**2);
        if(dist1 < r || dist2 < r){
          lightsSelected[i] = true;
        }
      }
      redrawLights();
      iscircle = false;
    }
  });
}

function drawDot(){
  var canvas = document.getElementById("manyColorCanvas");
  var myx = 0;
  var myy = 0;
  const context = canvas.getContext('2d');
  var isSelecting = false;
  var isdot = true;
  canvas.addEventListener('mousedown', e => {
    if(isdot){
      myx = e.offsetX;
      myy = e.offsetY;
      isSelecting = true;
      for(var i = 0; i < lightsPos.length; i++){
        var x = lightsPos[i][0];
        var y = lightsPos[i][1];
        if(myx - x < 20 && myx - x > 0 && myy - y < 20 && myy - y > 0){
          lightsSelected[i] = true;
        }
      }
      redrawLights();
    }
  });
  canvas.addEventListener('mousemove', e => {
    if(isSelecting && isdot){
      myx = e.offsetX;
      myy = e.offsetY;
      for(var i = 0; i < lightsPos.length; i++){
        var x = lightsPos[i][0];
        var y = lightsPos[i][1];
        if(myx - x < 20 && myx - x > 0 && myy - y < 20 && myy - y > 0){
          lightsSelected[i] = true;
        }
      }
      redrawLights();
    }
  });
  canvas.addEventListener('mouseup', e => {
    isSelecting = false;
    isdot = false;
  });
}

function drawSquiggle(){
  var canvas = document.getElementById("manyColorCanvas");
  var startx = 0;
  var starty = 0;
  var cx = 0;
  var cy = 0;
  const context = canvas.getContext('2d');
  var isSelecting = false;
  canvas.addEventListener('mousedown', e => {
    startx = e.offsetX;
    starty = e.offsetY;
    cx = startx;
    cy = starty;
    isSelecting = true;
  });
  canvas.addEventListener('mousemove', e => {
    if(isSelecting){
      drawLine(context, cx, cy, e.offsetX, e.offsetY);
      cx = e.offsetX;
      cy = e.offsetY;
    }
  });
  canvas.addEventListener('mouseup', e => {
    if(isSelecting){
      drawLine(context, cx, cy, e.offsetX, e.offsetY);
      cx = e.offsetX;
      cy = e.offsetY;
      drawLine(context, cx, cy, startx, starty);
    }
    isSelecting = false;
    redrawLights();
  });
}

function drawLine(context, x1, y1, x2, y2) {
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.lineWidth = 2;
  context.strokeStyle = 'black';
  context.stroke();
  context.closePath();
}

function deselect(){
  for(var i = 0; i < lightsPos.length; i++){
    // console.log(lightsSelected[i]);
    lightsSelected[i] = false;
  }
  redrawLights();
}

function fillColor(){
  //this is where we deal with color picker, gradient stuff
  overlayOn();
}

function applyColor(){
  overlayOff();
}

var activeOverlay = -1;
function overlayOn(i, x, y) {
  activeOverlay = i;
  document.getElementById("overlay").style.display = "block";
  $("#overlay").css({top: y, left: x, position:'fixed'});
  $("#multiColorPicker")[0].jscolor.fromString(lightsColor[i]);
  $("#multiColorPicker")[0].jscolor.show();
}

function overlayOff(){
  activeOverlay = -1;
  document.getElementById("overlay").style.display = "none";
}

function multiColorPickerChange(input,whichcolor) {
  var newColor = input.jscolor.toString("hex");
  if(activeOverlay != -1) {
    if(newColor != lightsColor[activeOverlay]) {
      lightsColor[activeOverlay] = newColor;
      redrawLights();
    }
  }
}

function onDocumentMouseDown(e) {
  var target = e.target || e.srcElement;
  if (activeOverlay !== -1) {
    var t = target;
    var inOverlay = false;
    while (t != null) {
      if (t.id == "overlaybox" || t.className == "jscolor-picker") {
        inOverlay = true;
        break;
      }
      t = t.parentElement;
    }
    if(!inOverlay) {
      overlayOff();
    }
  }
}
