'use strict';
var SingleColorInit = false;
class SingleColor {
  constructor(single) {
    SingleColorInit = true;
    if (typeof single == 'undefined') {
      this.reset();
    } else if (typeof(single) == "object") {
      this.color = single.color;
    } else {
      this.setColor(color.toUpperCase(), true, false);
    }
    SingleColorInit = false;
  }

  equals(other) {return other === undefined ? false : this.color == other.color;}

  reset() {
    this.setColor("#FF0000");
  }

  setColor(color, updateColorPicker=true) {
    if (color != this.color) {
      this.color = color;

      $("#singleColorSave").html('save'); //reset save button
      $("#singleColorSave")[0].className = 'topbutton'; //reset save button

      if (updateColorPicker) {$("#solidColor")[0].jscolor.fromString(this.color);}

      setColorBox("solidColor");

      if (!SingleColorInit) {sendRequest("solidColor", this.color);}
    }
  }
}

var MultiColorInit = false;
var MultiColorCopy = false;
class MultiColor {
  constructor(multi, active = false) {
    MultiColorInit = true;
    if (typeof multi == 'undefined') {
      this.reset(false);
    } else if (typeof(multi) == "object") {
      MultiColorCopy = true;
      for (const [key, value] of Object.entries(multi)) {
        if (Array.isArray(value)) {
          this[key] = value.slice();
        } else {
          this[key] = value;
        }
      }
      MultiColorCopy = false;
      MultiColorInit = false;
      if (active) {
        this.updateRandomSlider();
        this.updatePatternSlider();
        this.redrawLights(false);
      }
    }
  }

  reset(send = true) {
    MultiColorInit = true;
    this.setSolidColor("#FF0000");
    this.setPattern(50, true);
    this.setRandomness(0, true);
    MultiColorInit = false;
    this.redrawLights(send);
  }

  setColor(index, color) {
    this.colors[index] = color.toUpperCase();
    this.redrawLights();
  }
  setSolidColor(color) {
    this.colors = Array(lightsPos.length).fill(color.toUpperCase());
    this.redrawLights();
  }
  updateRandomSlider(setSlider = true) {
    if(MultiColorCopy) {return;}
    if (setSlider) {
      $(".slider2").val(this.randomAmount);
    }
    // update slider text
    $(".sliderPercent2").html(this.randomAmount + "%");
    centerSlidersText();
  }
  updatePatternSlider(setSlider = true) {
    if(MultiColorCopy) {return;}
    if (setSlider) {
      $(".slider1").val(this.patternAmount);
    }
    // update slider text
    $(".sliderPercent1").html(this.patternAmount + "%");
    centerSlidersText();
  }


  setRandomness(amount, setSlider = false) {
    this.randomAmount = amount;
    this.updateRandomSlider(setSlider);
    // generate new random values
    this.randomColors = Array(lightsPos.length);
    for(var i=0; i<this.randomColors.length; i++) {
      var red = Math.floor(Math.random() * Math.floor(255));
      var green = Math.floor(Math.random() * Math.floor(255));
      var blue = Math.floor(Math.random() * Math.floor(255));
      var max = Math.max(red,green,blue);
      red = Math.floor(red*255/max);
      green = Math.floor(green*255/max);
      blue = Math.floor(blue*255/max);
      var randomcolor = rgbToHexString(red, green, blue);
      this.randomColors[i] = randomcolor;
    }

    this.redrawLights();
  }

  setPattern(amount, setSlider = false) {
    this.patternAmount = amount;
    this.updatePatternSlider(setSlider);
    this.redrawLights();
  }

  redrawLightsPreserve() {
    redrawLights(this);
  }
  redrawLights(send = true) {
    if(MultiColorInit) {return;}
    if(!this.equals(savedMultiColors.list[savedMultiColors.list.length - 1])) {
      $("#multiColorSave").html('save'); //reset save button
      $("#multiColorSave")[0].className = 'topbutton'; //reset save button
    }
    // actually do drawing here
    redrawLights(this);

    if(send) {sendRequest('multiColor', this);}
  }

  equals(other) {
    if (other === undefined) {return false;}
    var entries = Object.entries(this);
    if (this.randomAmount == 0) {
      entries = entries.filter(e => e[0] != "randomColors");
    }
    for (const [key, value] of entries) {
      if (JSON.stringify(this[key]) != JSON.stringify(other[key])) {
        return false;
      }
    }
    return true;
  }
}
class SavedData {
  constructor(overlay, name) {
    this.name = name
    this.list = [];
    this.overlay = overlay;
  }
  load(list) {
    this.list = list;
    this.redoHTML();
  }
  remove(index) {
    this.list.splice(index, 1);
    sendRequest(this.name, this.list);
    this.redoHTML();
  }
  removeAll() {
    this.list = [];
    sendRequest(this.name, this.list);
    this.redoHTML();
  }
}

class SavedSingleColors extends SavedData {
  constructor() {
    super("solidLoadOverlay","savedSingleColors");
  }
  redoHTML() {
    if (this.list.length == 0) {
      $('#' + this.overlay).html("&nbsp;Nothing saved yet");
    } else {
      var html = ''
      for(var i = this.list.length - 1; i >=0; i--) { //TODO: move to when savedSingleColors is updated
        html += '<div class="singeColorLoad" id="singleColorLoad' + i + '" onclick="restoreSingleColor(this)" style="background-color: ' + this.list[i].color + ';"><div class="loadX" onclick="removeSingleColor(event, this)">X</div></div>';
      }
      html += '<div class="singeColorLoad" onclick="removeAllSingleColors()" style="padding-top: 2%; text-align: center;">Clear All</div>';
      $('#' + this.overlay).html(html);
    }
  }
  save(element) {
    if (!element.equals(this.list[this.list.length - 1])) {
      if (this.list.filter(e => e.equals(singleColor)).length != 0) {
        this.list = this.list.filter(e => !e.equals(singleColor));
      }
      this.list.push(new SingleColor(singleColor));
      sendRequest(this.name, this.list);
    }
    this.redoHTML();
  }
}

var SavedMultiColorsDrawn = false;
class SavedMultiColors extends SavedData {
  constructor() {
    super("manyLoadOverlay","savedMultiColors");
  }
  remove(index) {
    super.remove(index);
    drawMultiLoad();
  }
  redoHTML() {
    SavedMultiColorsDrawn = false;
    if (this.list.length == 0) {
      $('#' + this.overlay).html("&nbsp;Nothing saved yet");
    } else {
      var html = ''
      for(var i = this.list.length - 1; i >=0; i--) { //TODO: move to when savedSingleColors is updated
        html += '<div class="multiColorLoad" id="multi_ColorLoad' + i + '" onclick="restoreMultiColor(this)"><div class="loadX2" onclick="removeMultiColor(event, this)">X</div></div>';
      }
      html += '<div class="singeColorLoad" onclick="removeAllMultiColors()" style="padding-top: 2%; text-align: center;">Clear All</div>';
      $('#' + this.overlay).html(html);
    }
  }
  save(element) {
    if (!element.equals(this.list[this.list.length - 1])) {
      if (this.list.filter(e => e.equals(multiColor)).length != 0) {
        this.list = this.list.filter(e => !e.equals(multiColor));
      }
      this.list.push(new MultiColor(multiColor));
      sendRequest(this.name, this.list);
    }
    this.redoHTML();
  }
}
var singleColor;
var multiColor;
var savedSingleColors = new SavedSingleColors();
var savedMultiColors = new SavedMultiColors();
var lastRequestName = "";
var lastSent = 0;
var lastRequest = 0;
var minDelay = 40;
async function sendRequest(name, value, send=true, callback = null) {
  if(!send) {return;}
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
  if(send) {sendRequest("on", input.checked);}
}

// solid color handlers
function solidColorChange(input) {
  singleColor.setColor(input.jscolor.toString("hex"), false);
}


function randomnessChange(input) {
  multiColor.setRandomness(input.value);
}

function patternChange(input) {
  multiColor.setPattern(input.value);
}

function brightnessChange(input, send=true) {
  $(".sliderPercent3").html(input.value + "%");
  //TODO: remove this if you find a way to not have two different brightness sliders
  $(".slider3").val(input.value);
  centerSlidersText();
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
  var hexstring = ("#" + redstring + greenstring + bluestring).toUpperCase();
  return hexstring;
}

var solidColorHide = null;



// on tab switch
function activateTab(button, pageId, redraw=true, send=true) {
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
      setMultiColorpickerSize(redraw, send);
      centerSlidersText();
    } else if (pageId == 'tabAnimate') {
      sendRequest('mode', 'animate', send);
    } else if (pageId == 'tabSaved') {
      sendRequest('mode', 'saved', send);
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
        // multiColor.colors[i] = document.getElementById("multiColorSelect").jscolor.toString("hex");
      }
    }
  }
  // if(changed) {
  //   redrawLights();
  //   sendRequest("manyColors", multiColor.colors);
  // }
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
  multiColor.redrawLightsPreserve();
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

function updateColors(multiColor) {
  // step 1: search for all selected lights
  var selected = [];
  for (var i=0; i<lightsPos.length; i++) {
    if (lightsSelected[i]) {
      selected.push(i);
    }
  }
  //Get gradient values
  var newColors = JSON.parse(JSON.stringify(makeGradient(multiColor))); //weird javascript way of doing deep copy
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
      //     minColor = multiColor.colors[j];
      //   }
      // }
      //Choose random element from selected lights
      const randomElement = selected[Math.floor(Math.random() * selected.length)];

      multiColor.colors[i] = multiColor.colors[randomElement];
      multiColor.colors[i] = blendColors([multiColor.colors[i], newColors[i]], [multiColor.patternAmount, 100 - multiColor.patternAmount]);
      //var red = 0;
      //var green = 0;
      //var blue = 0;
      //[red,green,blue] = hexToRgb(multiColor.colors[i]);
      //var max = Math.max(red,green,blue);
      // console.log(max);
      // and then apply random
      multiColor.colors[i] = blendColors([multiColor.randomColors[i], multiColor.colors[i]], [multiColor.randomAmount, 100-multiColor.randomAmount]);
    }
  }
}
function redrawLights(multiColor) {
  var canvas = document.getElementById("manyColorCanvas");
  if(canvas.parentElement.parentElement.style['display'] == 'none') {return;}

  var countX = 1+Math.max.apply(Math, lightsPos.map(function (o) {return o[0];}));
  var countY = 1+Math.max.apply(Math, lightsPos.map(function (o) {return o[1];}));
  var spacing = 0.75;
  spacing += 1;
  var sizeX = canvas.width / (spacing * countX);
  var sizeY = canvas.height / (spacing * countY);
  var size = Math.min(sizeX, sizeY);
  // override spacing if it's too big
  //size = Math.min(size, 30);

  updateColors(multiColor);
  var ctx = canvas.getContext("2d");
  for(var i=0; i<lightsPos.length; i++) {
    var x = (sizeX - size)*spacing*countX/2 + ((spacing/4)+lightsPos[i][0]) * spacing * size;
    var y = (sizeY - size)*spacing*countY/2 + ((spacing/4)+lightsPos[i][1]) * spacing * size;

    ctx.fillStyle = multiColor.colors[i];
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
}

function saveButton(button) {
  button.className = "topbutton-active";
  button.innerHTML="color saved";
}

function saveSingleColor(button) {
  if (button.innerHTML == "save") { //if we haven't already saved
    saveButton(button);
    savedSingleColors.save(singleColor);
  }
}

function saveMultiColor(button) {
  if (button.innerHTML == "save") { //if we haven't already saved
    saveButton(button);
    savedMultiColors.save(multiColor);
  }
}

function loadSingleColor(button) {
  var rect = button.getBoundingClientRect();
  $("#solidLoadOverlay").css({position: 'fixed',
                              display: 'block',
                              'font-size': rect.width / 14 + 'px',
                              width: rect.width,
                              height: rect.width * 2.5,
                              top: rect.y - rect.width * 2.5,
                              left: rect.x});
  savedSingleColors.active = true;
}

function loadMultiColor(button) {
  var rect = button.getBoundingClientRect();
  var mult = 0.5;
  $("#manyLoadOverlay").css({position: 'fixed',
                              display: 'block',
                              'font-size': rect.width / 10 + 'px',
                              width: rect.width * (1 + mult),
                              height: rect.width * 2.5,
                              top: rect.y - rect.width * 2.5,
                              left: rect.x - (rect.width * mult)});
  savedMultiColors.active = true;
  // add canvas
  drawMultiLoad();
}

function redrawMultiLoad() {
  for(var j = savedMultiColors.list.length - 1; j >=0; j--) {
    var canvas = $("#multiLoad" + j)[0];
    var countX = 1+Math.max.apply(Math, lightsPos.map(function (o) {return o[0];}));
    var countY = 1+Math.max.apply(Math, lightsPos.map(function (o) {return o[1];}));
    var spacing = 0;
    spacing += 1;
    var sizeX = canvas.width / (spacing * countX);
    var sizeY = canvas.height / (spacing * countY);
    var size = Math.min(sizeX, sizeY);
    // override spacing if it's too big
    //size = Math.min(size, 30);

    var ctx = canvas.getContext("2d");
    for(var i=0; i<lightsPos.length; i++) {
      var x = (sizeX - size)*spacing*countX/2 + ((spacing/4)+lightsPos[i][0]) * spacing * size - 5;
      var y = (sizeY - size)*spacing*countY/2 + ((spacing/4)+lightsPos[i][1]) * spacing * size - 5;

      ctx.fillStyle = savedMultiColors.list[j].colors[i];
      ctx.fillRect(x, y, size/(spacing), size/(spacing));
      //ctx.beginPath();
      ////ctx.lineWidth = 2;
      ////ctx.strokeStyle = 'black';
      //ctx.arc(x, y, size / (spacing+1), 0, 2 * Math.PI, false);
      ctx.fill();
      //ctx.stroke();
    }
  }
}

function drawMultiLoad() {
  if (!SavedMultiColorsDrawn && savedMultiColors.list.length > 0) {
    SavedMultiColorsDrawn = true;
    var rect = $("#multi_ColorLoad0")[0].getBoundingClientRect();
    for(var i = savedMultiColors.list.length - 1; i >=0; i--) {
      $('#multi_ColorLoad' + i).prepend('<canvas style="position: absolute; top: 0px;" id="multiLoad' + i + '" width=' + rect.width + ' height=' + rect.height + '></canvas>');
    }
    redrawMultiLoad();
  }
}


function restoreSingleColor(button) {
  var color = savedSingleColors.list[parseInt(button.id.substring(15))].color;
  singleColor.setColor(color);
}

function removeSingleColor(event, button) {
  event.stopPropagation();
  var index = parseInt(button.parentElement.id.substring(15));
  if (singleColor.equals(savedSingleColors.list[index])) {
    $("#singleColorSave").html('save'); //reset save button
    $("#singleColorSave")[0].className = 'topbutton'; //reset save button
  }
  savedSingleColors.remove(index);
}

function restoreMultiColor(button) {
  var color = savedMultiColors.list[parseInt(button.id.substring(15))];
  multiColor = new MultiColor(color, true);
}

function removeMultiColor(event, button) {
  event.stopPropagation();
  var index = parseInt(button.parentElement.id.substring(15));
  if (multiColor.equals(savedMultiColors.list[index])) {
    $("#multiColorSave").html('save'); //reset save button
    $("#multiColorSave")[0].className = 'topbutton'; //reset save button
  }
  savedMultiColors.remove(index);
}
function removeAllSingleColors() {
  $("#singleColorSave").html('save'); //reset save button
  $("#singleColorSave")[0].className = 'topbutton'; //reset save button
  savedSingleColors.removeAll();
}

function removeAllMultiColors() {
  $("#multiColorSave").html('save'); //reset save button
  $("#multiColorSave")[0].className = 'topbutton'; //reset save button
  savedMultiColors.removeAll();
}

function loadSingleOverlayOff() {
  $("#solidLoadOverlay").css({display: 'none'});
  savedSingleColors.active = false;
}

function loadMultiOverlayOff() {
  $("#manyLoadOverlay").css({display: 'none'});
  savedMultiColors.active = false;
}

function resetOnAndBrightness(send = true) {
  $(".slider3").val(70);
  brightnessChange($(".slider3")[0], send);
  $(":checkbox").prop('checked', true);
  lightsOnOff($(":checkbox")[0], send);
}

function resetSingleColor() {
  singleColor.reset();
  resetOnAndBrightness();
}

function resetMultiColor() {
  multiColor.reset();
  resetOnAndBrightness();
}

function singleColorFill(button) {
  var rect = button.getBoundingClientRect();
  activeOverlay = -2;
  $("#overlay").css({position: 'fixed',
                     display: 'block',
                     top: rect.y - 155, //todo: do this better?
                     left: rect.x + (rect.width - $("#overlay").width())/2});
  $("#multiColorPicker")[0].jscolor.show();
  setColorBox("multiColorPicker");
}
function makeGradient(multiColor) {
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
  var newLightsColor = multiColor.colors;
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
      red = red + (proportion * parseInt(multiColor.colors[filledlist[j]].substring(1,3), 16));
      green = green + (proportion * parseInt(multiColor.colors[filledlist[j]].substring(3,5), 16));
      blue = blue + (proportion * parseInt(multiColor.colors[filledlist[j]].substring(5,7), 16));
    }
    var redint = Math.round(red);
    var greenint = Math.round(green);
    var blueint = Math.round(blue);
    var colorstring = rgbToHexString(redint, greenint, blueint);
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
  centerSlidersText();
}

function centerSlidersText() {
  // eh fuck it just do all the text sliders at once
  for(var slider of $(".sliderText")) {
    var w = slider.getBoundingClientRect().width;
    if(w != 0) {
      var parentWidth = slider.parentElement.getBoundingClientRect().width;
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
  if(savedSingleColors.active) {
    var rect = $("#loadSingleColor")[0].getBoundingClientRect();
    $("#solidLoadOverlay").css({width: rect.width,
                                height: rect.width * 2.5,
                                'font-size': rect.width / 14 + 'px',
                                top: rect.y - rect.width * 2.5,
                                left: rect.x});
  }
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
  if(savedMultiColors.active) {
    var rect = $("#loadMultiColor")[0].getBoundingClientRect();
    var mult = 0.5;
    $("#manyLoadOverlay").css({width: rect.width * (1 + mult),
                                height: rect.width * 2.5,
                                'font-size': rect.width / 10 + 'px',
                                top: rect.y - rect.width * 2.5,
                                left: rect.x - rect.width * mult});
    rect = $("#multi_ColorLoad0")[0].getBoundingClientRect();
    for(var i = savedMultiColors.list.length - 1; i >=0; i--) {
      $("#multiLoad" + i).width(rect.width);
      $("#multiLoad" + i).height(rect.height);
    }
    redrawMultiLoad();
  }
}

function setColorBox(name) {
  var color = $("#"+name)[0].jscolor.toString("hex");
  $("#"+name).css("backgroundColor", color);
  $("#"+name).css("color", hexToRgb(color).reduce((a,b) => a+b)/3 > 128 ? "#000000" : "#FFFFFF");
}


window.onload = function() {
  // add click listeners
  document.addEventListener('mousedown', onDocumentMouseDown, false);
  document.addEventListener('touchstart', onDocumentMouseDown, false);

  // hackishly keep the solid color open
  solidColorHide = document.getElementById("solidColor").jscolor.hide;
  document.getElementById("solidColor").jscolor.hide = function(){};

  // initialize color objects
  singleColor = new SingleColor();
  multiColor = new MultiColor();
  resetOnAndBrightness(false);


  // try to set canvas size
  setSolidColorpickerSize();
  setMultiColorpickerSize(false);

  // and center text labels
  centerSlidersText();

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
        singleColor.setColor(data.solidColor, true, false);
        break;
      case "brightness":
        $(".sliderPercent3").html(data.brightness + "%");
        $(".slider3").val(data.brightness);
        break;
      case "multiColor":
        multiColor = new MultiColor(data.multiColor, true);
        break;
      case "savedSingleColors":
        savedSingleColors.load(Array.from(data.savedSingleColors, x => new SingleColor(x)));
        break;
      case "savedMultiColors":
        savedMultiColors.load(Array.from(data.savedMultiColors, x => new MultiColor(x)));
        break;
      case "mode":
        var loadedTab = '';
        switch(data.mode) {
          case 'solidColor':
            activateTab($(".topbutton-active")[0], 'tabSolidColor', false, false);
            break;
          case 'manyColors':
            activateTab($(".topbutton")[0], 'tabManyColorEntry', false, false);
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
  $("#multiColorPicker")[0].jscolor.fromString(multiColor.colors[i]);
  $("#multiColorPicker")[0].jscolor.show();
  setColorBox("multiColorPicker");
}

function overlayOff(){
  activeOverlay = -1;
  document.getElementById("overlay").style.display = "none";
}

function multiColorPickerChange(input,whichcolor) {
  var newColor = input.jscolor.toString("hex");
  setColorBox("multiColorPicker");
  if (activeOverlay >= 0) {
    multiColor.setColor(activeOverlay, newColor);
  } else if (activeOverlay == -2) {
    multiColor.setSolidColor(newColor);
  }
}

function onDocumentMouseDown(e) { //todo: optimzie this to one loop
  var target = e.target || e.srcElement;
  if (activeOverlay !== -1) {
    var t = target;
    var inOverlay = false;
    while (t != null) {
      if (t.id == "multiColorPicker" || t.className == "jscolor-picker") {
        inOverlay = true;
        break;
      }
      t = t.parentElement;
    }
    if(!inOverlay) {
      overlayOff();
    }
  }
  if (savedSingleColors.active) {
    var t = target;
    var inOverlay = false;
    while (t != null) {
      if (t.id == "solidLoadOverlay") {
        inOverlay = true;
        break;
      }
      t = t.parentElement;
    }
    if(!inOverlay) {
      loadSingleOverlayOff();
    }
  }
  if (savedMultiColors.active) {
    var t = target;
    var inOverlay = false;
    while (t != null) {
      if (t.id == "manyLoadOverlay") {
        inOverlay = true;
        break;
      }
      t = t.parentElement;
    }
    if(!inOverlay) {
      loadMultiOverlayOff();
    }
  }
}
