var lastRequestName = ""
var lastSent = 0
var lastRequest = 0
var minDelay = 40;
async function sendRequest(name, value, send = true, callback = null) {
  if(!send) {
    return;
  }
  //console.log("sending " + name + ", " + value);
  //console.trace();
  var d = new Date()
  var thisRequest = lastRequest = d.getTime();
  if(lastRequestName == name && d.getTime() - lastSent < minDelay) {
    lastRequestName = name;
    await new Promise(r => setTimeout(r, minDelay));
    if(lastRequest != thisRequest) {
      return;
    }
    //console.log(d.getTime() - lastSent);
  }
  lastRequestName = name;
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
function lightsOnOff(input, send=true) {
  $(":checkbox").prop('checked', input.checked);
  sendRequest("on", input.checked, send);
}

// solid color handlers
var lastColor = null;
function solidColorChange(input) {
  var newColor = input.jscolor.toString("hex");
  if(lastColor != newColor) {
    sendRequest("solidColor", newColor);
    lastColor = newColor;
  }
  setColorBox("solidColor");
}

function randomnessChange(input, redraw=true, send=true) {
  $(".sliderPercent2").html(input.value + "%");
  randomAmount = input.value;
  for(var i=0; i<randomColors.length; i++) {
      var red = Math.floor(Math.random() * Math.floor(255));
      var green = Math.floor(Math.random() * Math.floor(255));
      var blue = Math.floor(Math.random() * Math.floor(255));
      var randomcolor = rgbToHexString(red, green, blue);
    randomColors[i] = randomcolor;
  }
  sendRequest("randomColors", randomColors, send);
  redrawLights(redraw);
  sendRequest("randomness", input.value, send);
}

function patternChange(input, redraw=true, send=true) {
  $(".sliderPercent1").html(input.value + "%");
  var inverse = 100 - input.value;
  gradientAmount = inverse;
  $(".sliderPercent2inverse").html(inverse + "%"); //what is this?
  sendRequest("gradient", input.value, send);
  redrawLights(redraw);
}

function brightnessChange(input, send=true) {
  $(".sliderPercent3").html(input.value + "%");
  //TODO: remove this if you find a way to not have two different brightness sliders
  $(".slider3").val(input.value);
  centerSliders();
  sendRequest("brightness", input.value, send);
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
function activateTab(button, pageId, send=true) {
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
    sendRequest("mode", "solidColor", send);
  } else {
    if(pageId == 'tabManyColorEntry') {
      sendRequest("mode", "manyColors", send);
      setMultiColorpickerSize(true, send);
      centerSliders();
    } else if (pageId == 'tabAnimate') {
      sendRequest('mode', 'animate', send);
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
var lightsColor = Array(lightsPos.length);
var lightsSelected = Array(lightsPos.length).fill(false);
var randomColors = Array(lightsPos.length).fill("#000000");
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

function drawMultiLights(redraw=false, send=true) {
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
  redrawLights(redraw, send);
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

function updateColors() {
  // step 1: search for all selected lights
  var selected = [];
  for (var i=0; i<lightsPos.length; i++) {
    if (lightsSelected[i]) {
      selected.push(i);
    }
  }
  //Get gradient values
  var newColors = JSON.parse(JSON.stringify(makeGradient())); //weird javascript way of doing deep copy
  // step 2: for each unselected light, set its color to the nearest one
  for (var i=0; i<lightsPos.length; i++) {
    if (!lightsSelected[i]) {
      // ok for now its just going to be the nearest selected one
      // var minDist = -1;
      // var minColor = "#000000";
      // for(const j of selected) {
      //   var dist = Math.hypot(lightsPos[j][0]-lightsPos[i][0], lightsPos[j][1]-lightsPos[i][1]);
      //   if (minDist == -1 || dist < minDist) {
      //     minDist = dist;
      //     minColor = lightsColor[j];
      //   }
      // }
      //Choose random element from selected lights
      const randomElement = selected[Math.floor(Math.random() * selected.length)];

      lightsColor[i] = lightsColor[randomElement];
      lightsColor[i] = blendColors([lightsColor[i], newColors[i]], [100-gradientAmount, gradientAmount]);
      // and then apply random
      lightsColor[i] = blendColors([randomColors[i], lightsColor[i]], [randomAmount, 100-randomAmount]);
    }
  }
}
function redrawLights(doRedraw = true, send = true) {
  if (!doRedraw) {
    return;
  }
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

  updateColors();
  var ctx = canvas.getContext("2d");
  for(var i=0; i<lightsPos.length; i++) {
    var x = (sizeX - size)*spacing*countX/2 + ((spacing/4)+lightsPos[i][0]) * spacing * size;
    var y = (sizeY - size)*spacing*countY/2 + ((spacing/4)+lightsPos[i][1]) * spacing * size;

    ctx.fillStyle = lightsColor[i];
    ctx.beginPath();
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
  }
  sendRequest("manyColors", lightsColor, send);
}

function resetSingleColor(redraw = true, send = true) {
  document.getElementById("solidColor").jscolor.fromString("#FF0000");
  setColorBox("solidColor");
  sendRequest("solidColor", "#FF0000", send);
  $(".slider3").val(70);
  brightnessChange($(".slider3")[0], send);
  $(":checkbox").prop('checked', true);
  lightsOnOff($(":checkbox")[0], send);
}
function resetMultiColor(redraw = true, send = true) {
  lightsColor = Array(lightsPos.length).fill("#FF0000");
  $(".slider1").val(50)
  patternChange($(".slider1")[0], false, send);
  $(".slider2").val(0);
  randomnessChange($(".slider2")[0], false, send);
  $(".slider3").val(70);
  brightnessChange($(".slider3")[0], send);
  $(":checkbox").prop('checked', true);
  lightsOnOff($(":checkbox")[0], send);
  redrawLights(redraw);
}
function singleColorFill(button) {
  rect = button.getBoundingClientRect();
  console.log($("#overlay"));
  activeOverlay = -2;
  $("#overlay").css({position: 'fixed',
                     display: 'block',
                     top: rect.y - 155, //todo: do this better?
                     left: rect.x + (rect.width - $("#overlay").width())/2});
  $("#multiColorPicker")[0].jscolor.show();
}
function makeGradient() {
  var unfilledlist = [];
  var filledlist = [];
  for(var i = 0; i < lightsPos.length; i++){
    if(lightsSelected[i] == false){
      unfilledlist.push(i);
    }
    else{
      filledlist.push(i);
    }
  }
  var newLightsColor = lightsColor;
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
    newLightsColor[unfilledlist[i]] = colorstring;
  }
  return newLightsColor;
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

function setMultiColorpickerSize(redraw=true, send=true) {
  //TODO: maybe filling the screen isn't the best idea?
  var width = $("#manyColorEntryCenter").width() * .99;
  var canvas = document.getElementById("manyColorCanvas");
  canvas.style.width = width + 'px';
  canvas.width = width * window.devicePixelRatio;
  var height = $(window).height() - $("#manyColorEntryCenter").offset().top - $("#manyColorEntrySliders").height() - 73;
  height = height + 26;
  canvas.style.height = height + 'px';
  canvas.height = height * window.devicePixelRatio;
  drawMultiLights(redraw, send);
}

function setColorBox(name) {
  var color = $("#"+name)[0].jscolor.toString("hex");
  $("#"+name).css("backgroundColor", color);
  $("#"+name).css("color", hexToRgb(color).reduce((a,b) => a+b)/3 > 128 ? "#000000" : "#FFFFFF");
}


var randomAmount = 0;
var gradientAmount = 50;
window.onload = function() {
  resetMultiColor(false, false);

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
  sendRequest("getState", null, true, initialSetState);
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
      case "randomColors":
        randomColors = data.randomColors; //todo: fix if the length is wrong?
        break;
      case "randomness":
        $(".sliderPercent2").html(data.randomness + "%");
        $(".slider2").val(data.randomness);
        randomAmount = data.randomness;
        break;
      case "gradient":
        $(".sliderPercent1").html(data.gradient + "%");
        $(".slider1").val(data.gradient);
        gradientAmount = data.gradient;
        break;
      case "manyColors":
        if(lightsColor.length <= data.manyColors.length) {
          lightsColor = data.manyColors;
        } else {
          lightsColor = data.manyColors + lightsColor.slice(data.manyColors.length);
        }
        break;
      case "mode":
        var loadedTab = '';
        switch(data.mode) {
          case 'solidColor':
            activateTab($(".topbutton-active")[0], 'tabSolidColor', false);
            break;
          case 'manyColors':
            activateTab($(".topbutton")[0], 'tabManyColorEntry', false);
            break;
          default:
            console.log(data.mode);
        }
        break;
      default:
        console.log(key);
    }
  }
  redrawLights(true, false);
}

var activeOverlay = -1;
function overlayOn(i, x, y) {
  activeOverlay = i;
  //var canvas = document.getElementById("manyColorCanvas");
  var canvas = $("#manyColorCanvas");
  var xCenter = canvas.offset().left + canvas.width() / 2;
  var yCenter = canvas.offset().top + canvas.height() / 2;
  $("#overlay").css({position: 'fixed',
                     display: 'block',
                     top: y <= yCenter ? y : y - 155,
                     left: x <= xCenter ? x : x - $("#overlay").width()});
  $("#multiColorPicker")[0].jscolor.fromString(lightsColor[i]);
  $("#multiColorPicker")[0].jscolor.show();
}

function overlayOff(){
  activeOverlay = -1;
  document.getElementById("overlay").style.display = "none";
}

function multiColorPickerChange(input,whichcolor) {
  var newColor = input.jscolor.toString("hex");
  if (activeOverlay >= 0) {
    if(newColor != lightsColor[activeOverlay]) {
      lightsColor[activeOverlay] = newColor;
      redrawLights();
    }
  } else if (activeOverlay == -2) {
    for(var i=0; i<lightsColor.length; i++) {
      if(lightsSelected[i]) {
        lightsColor[i] = newColor;
      }
    }
    redrawLights();
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
