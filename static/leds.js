'use strict';
class SingleColor {
  constructor(single) {
    if (typeof single == 'undefined') {
      this.reset();
    } else if (typeof(single) == "object") {
      this.color = single.color;
    } else {
      this.setColor(single.toUpperCase(), true, false);
    }
  }

  equals(other) {return other === undefined ? false : this.color == other.color;}

  reset() {
    this.setColor("#FF0000");
  }

  setColor(color, updateColorPicker=true, send = true) {
    if (color != this.color) {
      this.color = color;

      $("#singleColorSave").html('save'); //reset save button
      $("#singleColorSave")[0].className = 'topbutton'; //reset save button

      if (updateColorPicker) {$("#solidColor")[0].jscolor.fromString(this.color);}

      setColorBox("solidColor");

      if (send) {sendRequest("solidColor", this.color);}
    }
  }
}

let MultiColorInit = false;
let MultiColorCopy = false;
class MultiColor {
  constructor(multi, active = false, send = false) {
    MultiColorInit = true;
    if (typeof multi == 'undefined') {
      this.reset(false);
    } else if (typeof(multi) == "object") {
      MultiColorCopy = true;
      this.setInitialState();
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
        this.redrawLights(send);
      }
    }
  }

  setInitialState() {
    this.setSolidColor("#FF0000");
    this.setPattern(50, true);
    this.setRandomness(0, true);
    this.selected = lightsSelected.slice();
  }
  reset(send = true) {
    MultiColorInit = true;
    this.setInitialState();
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
      $("#randomnessSlider").val(this.randomAmount);
    }
    // update slider text
    $("#randomnessSliderLabel").html(this.randomAmount + "%");
    centerSlidersText();
  }
  updatePatternSlider(setSlider = true) {
    if(MultiColorCopy) {return;}
    if (setSlider) {
      $("#gradientSlider").val(this.patternAmount);
    }
    // update slider text
    $("#gradientSliderLabel").html(this.patternAmount + "%");
    centerSlidersText();
  }


  setRandomness(amount, setSlider = false) {
    this.randomAmount = amount;
    this.updateRandomSlider(setSlider);
    // generate new random values
    this.randomColors = Array(lightsPos.length);
    for(let i=0; i<this.randomColors.length; i++) {
      let red = Math.floor(Math.random() * Math.floor(255));
      let green = Math.floor(Math.random() * Math.floor(255));
      let blue = Math.floor(Math.random() * Math.floor(255));
      let max = Math.max(red,green,blue);
      red = Math.floor(red*255/max);
      green = Math.floor(green*255/max);
      blue = Math.floor(blue*255/max);
      let randomcolor = rgbToHexString(red, green, blue);
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
    redrawLights(this, false);
  }
  redrawLights(send = true) {
    if(MultiColorInit) {return;}
    // actually do drawing here
    redrawLights(this);
    if(!this.equals(savedData.list[savedData.list.length - 1])) {
      $("#multiColorSave").html('save'); //reset save button
      $("#multiColorSave")[0].className = 'topbutton'; //reset save button
    }

    if(send) {sendRequest('multiColor', this);}
  }

  equals(other) {
    if (other === undefined) {return false;}
    let entries = Object.entries(this);
    //if (this.randomAmount == 0) {
      entries = entries.filter(e => e[0] != "randomColors");
    //}
    return JSON.stringify(this.colors) == JSON.stringify(other.colors);
  }
}


class SavedData {
  constructor() {
    this.list = [];
    this.singleActive = false;
    this.multiActive = false;
  }
  save(element) {
    if (!element.equals(this.list[this.list.length - 1])) {
      if (this.list.filter(e => e.equals(element)).length != 0) {
        this.list = this.list.filter(e => !e.equals(element));
      }
      this.list.push(new element.constructor(element));
      this.redoHTML(element.constructor.name);
      sendRequest("savedData", this.list);
    }
  }
  load(list) {
    this.list = Array.from(list, function(x) {
      if ("color" in x) {
        return new SingleColor(x);
      } else if ("patternAmount" in x) {
        return new MultiColor(x);
      } else {
        return x;
      }
    });
    this.redoAllHTML();
  }
  remove(index) {
    let type = this.list[index].constructor.name;
    this.list.splice(index, 1);
    this.redoHTML(type);
    sendRequest("savedData", this.list);
  }
  removeAll(type) {
    if (type == "all") {
      this.list = []
      this.redoAllHTML();
      saveActive = -1;
      sendRequest("saveActive", saveActive);
    } else {
    this.list = this.list.filter(e => e.constructor.name != type);
    this.redoHTML(type);
    }
    sendRequest("savedData", this.list);
  }
  redoAllHTML() {
    let redoSaved = true;
    for (const type of ["SingleColor", "MultiColor"]) {
      this.redoHTML(type, redoSaved);
      redoSaved = false;
    }
  }

  redoHTML(type, redoSaved = true) {
    let html = '';
    let found = false;
    switch(type) {
      case "SingleColor":
        for(let i = this.list.length - 1; i >=0; i--) {
          if (this.list[i].constructor.name == type) {
            html += '<div class="singeColorLoad" id="singleColorLoad' + i + '" onclick="restoreSingleColor(this)" style="background-color: ' + this.list[i].color + ';"><div class="loadX" onclick="removeSingleColor(event, this)">&times</div></div>';
            found = true;
          }
        }
        if (found) {
          html += '<div class="singeColorLoad clearAllButton" onclick="removeAllSingleColors()">Clear All</div>';
        } else {
          html = "&nbsp;Nothing saved yet";
        }
        $('#solidLoadOverlay').html(html);
        break;
      case "MultiColor":
        savedMultiColorsDrawn = false;
        for(let i = this.list.length - 1; i >=0; i--) {
          if (this.list[i].constructor.name == type) {
            html += '<div class="multiColorLoad" id="multi_ColorLoad' + i + '" onclick="restoreMultiColor(this)"><div class="loadX2" onclick="removeMultiColor(event, this)">&times</div></div>';
            found = true;
          }
        }
        if (found) {
          html += '<div class="singeColorLoad clearAllButton" onclick="removeAllMultiColors()">Clear All</div>';
        } else {
          html = "&nbsp;Nothing saved yet";
        }
        $('#manyLoadOverlay').html(html);
        break;
      default:
        console.log(type);
    }
    if (redoSaved) {
      // saved designs tab
      allLoadDrawn = false;
      allLoadInitial = true;
      html = '';
      found = false;
      for(let i = this.list.length - 1; i >=0; i--) {
        html += '<div class="allLoad" id="allSavedLoad' + i + '" onclick="restoreAll(this)"><div class="loadX3" onclick="removeSaved(event, this)">&times</div></div>';
        found = true;
      }
      if (found) {
        html += '<div class="singeColorLoad clearAllButton clearAllSaved" onclick="removeAllSaved()">Clear All</div>';
      } else {
        html = "&nbsp;Nothing saved yet";
      }
      $('#savedCenter').html(html);
      if (saveActive != -1) {
        $("#allSavedLoad" + saveActive).addClass("allLoadActive");
      }
    }
  }
}


let allLoadInitial = false;
let temp = Object();
temp.color = "#FF0000";
let singleColor = new SingleColor(temp);
let multiColor;
let savedData = new SavedData();
let lastRequestName = "";
let lastSent = 0;
let lastRequest = 0;
let minDelay = 40;
let socket = new WebSocket(socketURL);

function echo(e) {
  console.log(e);
  initialSetState(JSON.parse(e.data));
}
socket.onmessage = echo;
async function sendRequest(name, value, send=true, callback = null) {
  if(!send) {return;}
  //console.log("sending " + name + ", " + value);
  //console.trace();
  let d = new Date() //TODO: should probably review this sometime
  let thisRequest = lastRequest = d.getTime();
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

  if (socket.readyState > 1) {
    console.log("reloading socket...");
    socket = new WebSocket(socketURL);
    socket.onmessage = echo;
  }
  if (socket.readyState == 0) {
    socket.onopen = function() {
      console.log("socket loaded!");
      socket.send(JSON.stringify({[name]: value}));
      console.log(JSON.stringify({[name]: value}));
    };
  }
  else {
    socket.send(JSON.stringify({[name]: value}));
    console.log(JSON.stringify({[name]: value}));
  }
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

function globalDurationChange(input) {
  $("#globalDurationSliderLabel").html(input.value + "%");
  centerSlidersText();
}

function globalTransitionDurationChange(input) {
  $("#globalTransitionDurationSliderLabel").html(input.value + "%");
  centerSlidersText();
}

function brightnessChange(input, send=true) {
  $(".brightnessSliderLabel").html(input.value + "%");
  //TODO: remove this if you find a way to not have two different brightness sliders
  $(".brightnessSlider").val(input.value);
  centerSlidersText();
  sendRequest("brightness", parseInt(input.value), send);
}

function blendColors(colorlist, percentagelist){
  let red = 0;
  let blue = 0;
  let green = 0;
  for(let i = 0; i < colorlist.length; i++){
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
  let redstring = red.toString(16);
  if(redstring.length < 2){
    redstring = "0" + redstring;
  }
  let greenstring = green.toString(16);
  if(greenstring.length < 2){
    greenstring = "0" + greenstring;
  }
  let bluestring = blue.toString(16);
  if(bluestring.length < 2){
    bluestring = "0" + bluestring;
  }
  let hexstring = ("#" + redstring + greenstring + bluestring).toUpperCase();
  return hexstring;
}

let solidColorHide = null;



// on tab switch
function activateTab(button, pageId, redraw=true, send=true) {
  /* thank you stackoverflow https://stackoverflow.com/a/1029252 */
  if(button.className == "topbutton-active") {
    return;
  }
  if (send) {
    if (saveActive != -1) {
      $(".allLoadActive")[0].className = "allLoad";
    }
    saveActive = -1;
    sendRequest("saveActive", saveActive);
  }
  $(".topbutton-active")[0].className = "topbutton";
  button.className = "topbutton-active";

  let tabCtrl = document.getElementById('tabCtrl');
  let pageToActivate = document.getElementById(pageId);
  for (let i = 0; i < tabCtrl.childNodes.length; i++) {
    let node = tabCtrl.childNodes[i];
    if (node.nodeType == 1) { /* Element */
      node.style.display = (node == pageToActivate) ? 'block' : 'none';
    }
  }
  let color = 0;
  if(pageId == 'tabSolidColor') {
    setSolidColorpickerSize();
    solidColorHide = document.getElementById("solidColor").jscolor.hide;
    document.getElementById("solidColor").jscolor.hide = function(){};
    sendRequest("mode", "solidColor", send);
  } else {
    if(pageId == 'tabManyColorEntry') {
      color = 1;
      sendRequest("mode", "manyColors", send);
      setMultiColorpickerSize();
    } else if (pageId == 'tabAnimate') {
      color = 2;
      sendRequest('mode', 'animate', send);
      setAnimatedSize();
    } else if (pageId == 'tabSaved') {
      color = 3;
      sendRequest('mode', 'saved', send);
      setSavedSize();
    } else {
      console.log(pageId);
    }
    document.getElementById("solidColor").jscolor.hide = solidColorHide;
    document.getElementById("solidColor").jscolor.hide();
  }
  $("body").css({'background-color': backgroundColors[color]});
  centerSlidersText();
}



let lightsPos = [
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
let lightsSelected = Array(lightsPos.length).fill(false);
lightsSelected[0] = lightsSelected[14] = lightsSelected[23] = lightsSelected[37] = true;

let holdTimeout = null;
let heldLight = -1;
let lastMouseX, lastMouseY;
function multiColorTouchMove(e) {
  bothMultiColorMove(event.changedTouches[0].pageX, event.changedTouches[0].pageY);
}
function multiColorMove(e) {
  if (navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0) {
    return;
  }
  bothMultiColorMove(event.pageX, event.pageY);
}
function bothMultiColorMove(pageX, pageY) {
  if (holdTimeout !== null) {
    let canvas = document.getElementById("manyColorCanvas");
    let canvasLeft = canvas.offsetLeft + canvas.clientLeft;
    let canvasTop = canvas.offsetTop + canvas.clientTop;
    let x = (pageX - canvasLeft) * window.devicePixelRatio,
      y = (pageY - canvasTop) * window.devicePixelRatio;
    let countX = 1+Math.max.apply(Math, lightsPos.map(function (o) {return o[0];}));
    let countY = 1+Math.max.apply(Math, lightsPos.map(function (o) {return o[1];}));
    let spacing = 0.75;
    spacing += 1;
    let sizeX = canvas.width / (spacing * countX);
    let sizeY = canvas.height / (spacing * countY);
    let size = Math.min(sizeX, sizeY);
    let i = heldLight;
    let xPos = (sizeX - size)*spacing*countX/2 + ((spacing/4)+lightsPos[i][0]) * spacing * size;
    let yPos = (sizeY - size)*spacing*countY/2 + ((spacing/4)+lightsPos[i][1]) * spacing * size;
    if(xPos - (1.5*size / (spacing+1)) <= x && xPos + (1.5*size / (spacing+1)) >= x &&
      yPos - (1.5*size / (spacing+1)) <= y && yPos + (1.5*size / (spacing+1)) >= y) {
      lastMouseX = pageX;
      lastMouseY = pageY;
    } else {
      clearTimeout(holdTimeout);
      holdTimeout = null;
    }
  }
}
function multiColorRelease(e) {
  if (holdTimeout !== null) {
    clearTimeout(holdTimeout);
    holdTimeout = null;
    heldLight = -1;
  }
}

let cancelClick = false;
function multiColorPress(e) {
  if (navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0) {
    return;
  }
  bothMultiColorPress(event.pageX, event.pageY);
}
function multiColorTouch(e) {
  bothMultiColorPress(event.changedTouches[0].pageX, event.changedTouches[0].pageY);
}
function bothMultiColorPress(pageX, pageY) {
  cancelClick = false;
  let canvas = document.getElementById("manyColorCanvas");
  let canvasLeft = canvas.offsetLeft + canvas.clientLeft;
  let canvasTop = canvas.offsetTop + canvas.clientTop;
  let x = (pageX - canvasLeft) * window.devicePixelRatio,
    y = (pageY - canvasTop) * window.devicePixelRatio;
  let countX = 1+Math.max.apply(Math, lightsPos.map(function (o) {return o[0];}));
  let countY = 1+Math.max.apply(Math, lightsPos.map(function (o) {return o[1];}));
  let spacing = 0.75;
  spacing += 1;
  let sizeX = canvas.width / (spacing * countX);
  let sizeY = canvas.height / (spacing * countY);
  let size = Math.min(sizeX, sizeY);
  for(let i=0; i<lightsPos.length; i++) {
    let xPos = (sizeX - size)*spacing*countX/2 + ((spacing/4)+lightsPos[i][0]) * spacing * size;
    let yPos = (sizeY - size)*spacing*countY/2 + ((spacing/4)+lightsPos[i][1]) * spacing * size;
    if(xPos - (1.5*size / (spacing+1)) <= x && xPos + (1.5*size / (spacing+1)) >= x &&
      yPos - (1.5*size / (spacing+1)) <= y && yPos + (1.5*size / (spacing+1)) >= y) {
      if (holdTimeout !== null) {
        clearTimeout(holdTimeout);
      }
      holdTimeout = setTimeout(toggleSelect, 500);
      heldLight = i;
      lastMouseX = pageX;
      lastMouseY = pageY;
    }
  }
}

function toggleSelect() {
  let newState = !multiColor.selected[heldLight];
  if (!newState) {
    let found = false;
    for(let i=0; i<lightsPos.length; i++) {
      if (i == heldLight) {continue;}
      if (multiColor.selected[i]) {
        found = true;
        break;
      }
    }
    if (!found) {
      return;
    }
  }
  cancelClick = true;
  multiColor.selected[heldLight] = newState;
  holdTimeout = null;
  if (newState) {
    multiColor.redrawLights();
    overlayOn(heldLight, lastMouseX, lastMouseY);
  } else {
    multiColor.redrawLights();
    if(!multiColor.equals(savedData.multi.list[savedData.multi.list.length - 1])) {
      $("#multiColorSave").html('save'); //reset save button
      $("#multiColorSave")[0].className = 'topbutton'; //reset save button
    }
  }
}

function checkLightsMouse(e) {
  if (cancelClick) {return;}
  let canvas = document.getElementById("manyColorCanvas");
  let canvasLeft = canvas.offsetLeft + canvas.clientLeft;
  let canvasTop = canvas.offsetTop + canvas.clientTop;
  let x = (event.pageX - canvasLeft) * window.devicePixelRatio,
    y = (event.pageY - canvasTop) * window.devicePixelRatio;
  let countX = 1+Math.max.apply(Math, lightsPos.map(function (o) {return o[0];}));
  let countY = 1+Math.max.apply(Math, lightsPos.map(function (o) {return o[1];}));
  let spacing = 0.75;
  spacing += 1;
  let sizeX = canvas.width / (spacing * countX);
  let sizeY = canvas.height / (spacing * countY);
  let size = Math.min(sizeX, sizeY);
  for(let i=0; i<lightsPos.length; i++) {
    if(multiColor.selected[i]){
      let xPos = (sizeX - size)*spacing*countX/2 + ((spacing/4)+lightsPos[i][0]) * spacing * size;
      let yPos = (sizeY - size)*spacing*countY/2 + ((spacing/4)+lightsPos[i][1]) * spacing * size;
      if(xPos - (1.5*size / (spacing+1)) <= x && xPos + (1.5*size / (spacing+1)) >= x &&
        yPos - (1.5*size / (spacing+1)) <= y && yPos + (1.5*size / (spacing+1)) >= y) {
        overlayOn(i, event.pageX, event.pageY);
      }
    }
  }
}

let backgroundColor = "#ccccccff";
let backgroundColors = ['#fffbd4', '#eaffe3', '#e3edff', '#f3f3f3']

function hexToRgb(hex) {
  return /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex).slice(1).map(x => parseInt(x, 16));
}
function componentToHex(c) {
    let hex = Math.min(255, Math.max(0, c)).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(color) {
  return "#" + color.map(x => componentToHex(Math.round(x))).join('');
}

function updateColors(multiColor) {
  // step 1: search for all selected lights
  let selected = [];
  for (let i=0; i<lightsPos.length; i++) {
    if (multiColor.selected[i]) {
      selected.push(i);
    }
  }
  //Get gradient values
  let newColors = makeGradient(multiColor).slice();
  // step 2: for each unselected light, set its color to the nearest one
  for (let i=0; i<lightsPos.length; i++) {
    if (!multiColor.selected[i]) {
      // ok for now its just going to be the nearest selected one
      // let minDist = -1;
      // let minColor = "#000000";
      // for(const j of selected) {
      //   let dist = Math.hypot(lightsPos[j][0]-lightsPos[i][0], lightsPos[j][1]-lightsPos[i][1]);
      //   if (minDist == -1 || dist < minDist) {
      //     minDist = dist;
      //     minColor = multiColor.colors[j];
      //   }
      // }
      //Choose random element from selected lights
      const randomElement = selected[Math.floor(Math.random() * selected.length)];

      multiColor.colors[i] = multiColor.colors[randomElement];
      multiColor.colors[i] = blendColors([multiColor.colors[i], newColors[i]], [multiColor.patternAmount, 100 - multiColor.patternAmount]);
      //let red = 0;
      //let green = 0;
      //let blue = 0;
      //[red,green,blue] = hexToRgb(multiColor.colors[i]);
      //let max = Math.max(red,green,blue);
      // console.log(max);
      // and then apply random
      multiColor.colors[i] = blendColors([multiColor.randomColors[i], multiColor.colors[i]], [multiColor.randomAmount, 100-multiColor.randomAmount]);
    }
  }
}
function redrawLights(multiColor, updateColor = true) {
  let canvas = document.getElementById("manyColorCanvas");
  if(canvas.parentElement.parentElement.style['display'] == 'none') {return;}

  let countX = 1+Math.max.apply(Math, lightsPos.map(function (o) {return o[0];}));
  let countY = 1+Math.max.apply(Math, lightsPos.map(function (o) {return o[1];}));
  let spacing = 0.75;
  spacing += 1;
  let sizeX = canvas.width / (spacing * countX);
  let sizeY = canvas.height / (spacing * countY);
  let size = Math.min(sizeX, sizeY);
  // override spacing if it's too big
  //size = Math.min(size, 30);

  if (updateColor) {
    updateColors(multiColor);
  }
  let ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for(let i=0; i<lightsPos.length; i++) {
    let x = (sizeX - size)*spacing*countX/2 + ((spacing/4)+lightsPos[i][0]) * spacing * size;
    let y = (sizeY - size)*spacing*countY/2 + ((spacing/4)+lightsPos[i][1]) * spacing * size;

    ctx.fillStyle = multiColor.colors[i];
    ctx.beginPath();
    ctx.lineWidth = 0.8 * window.devicePixelRatio;
    if (multiColor.selected[i]) {
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
    savedData.save(singleColor);
  }
}

function saveMultiColor(button) {
  if (button.innerHTML == "save") { //if we haven't already saved
    saveButton(button);
    savedData.save(multiColor);
  }
}

function loadSingleColor(button) {
  let rect = button.getBoundingClientRect();
  $("#solidLoadOverlay").css({position: 'fixed',
                              display: 'block',
                              'font-size': rect.width / 14 + 'px',
                              width: rect.width,
                              height: rect.width * 2.5,
                              top: rect.y - rect.width * 2.5,
                              left: rect.x});
  savedData.singleActive = true;
}

function loadMultiColor(button) {
  let rect = button.getBoundingClientRect();
  let mult = 0.5;
  $("#manyLoadOverlay").css({position: 'fixed',
                              display: 'block',
                              'font-size': rect.width / 10 + 'px',
                              width: rect.width * (1 + mult),
                              height: rect.width * 2.5,
                              top: rect.y - rect.width * 2.5,
                              left: rect.x - (rect.width * mult)});
  savedData.multiActive = true;
  // add canvas
  drawMultiLoad();
}

function redrawAllLoad() {
  for(let j = savedData.list.length - 1; j >=0; j--) {
    let canvas = $("#allLoad" + j)[0];
    switch(savedData.list[j].constructor.name) {
      case "SingleColor":
        $("#allSavedLoad" + j).css("background-color", backgroundColors[0]);
        drawLoad(j, canvas, true);
        break;
      case "MultiColor":
        $("#allSavedLoad" + j).css("background-color", backgroundColors[1]);
        drawLoad(j, canvas);
        break;
      default:
        console.log(savedData.list[j].constructor.name);
    }
  }
}

function drawLoad(j, canvas, singleColor = false) {
  let countX = 1+Math.max.apply(Math, lightsPos.map(function (o) {return o[0];}));
  let countY = 1+Math.max.apply(Math, lightsPos.map(function (o) {return o[1];}));
  let spacing = 0;
  spacing += 1;
  let sizeX = canvas.width / (spacing * countX);
  let sizeY = canvas.height / (spacing * countY);
  let size = Math.min(sizeX, sizeY);
  // override spacing if it's too big
  //size = Math.min(size, 30);

  let ctx = canvas.getContext("2d");
  for(let i=0; i<lightsPos.length; i++) {
    let x = (sizeX - size)*spacing*countX/2 + ((spacing/4)+lightsPos[i][0]) * spacing * size - 5;
    let y = (sizeY - size)*spacing*countY/2 + ((spacing/4)+lightsPos[i][1]) * spacing * size - 5;
    if (singleColor) {
      ctx.fillStyle = savedData.list[j].color;
    } else {
      ctx.fillStyle = savedData.list[j].colors[i];
    }
    ctx.fillRect(x, y, size/(spacing), size/(spacing));
    //ctx.beginPath();
    ////ctx.lineWidth = 2;
    ////ctx.strokeStyle = 'black';
    //ctx.arc(x, y, size / (spacing+1), 0, 2 * Math.PI, false);
    ctx.fill();
    //ctx.stroke();
  }
}

function redrawMultiLoad() {
  for(let j = savedData.list.length - 1; j >=0; j--) {
    if (savedData.list[j].constructor.name == "MultiColor") {
      let canvas = $("#multiLoad" + j)[0];
      drawLoad(j, canvas);
    }
  }
}

let savedMultiColorsDrawn = false;
function drawMultiLoad() {
  if (!savedMultiColorsDrawn) {
    let found = false;
    let rect = null;
    for(let i = savedData.list.length - 1; i >=0; i--) {
      if (savedData.list[i].constructor.name == "MultiColor") {
        if (rect === null) {
          rect = $("#multi_ColorLoad" + i)[0].getBoundingClientRect();
        }
        $('#multi_ColorLoad' + i).prepend('<canvas style="position: absolute; top: 0px;" id="multiLoad' + i + '" width=' + rect.width + ' height=' + rect.height + '></canvas>');
        found = true;
      }
    }
    if (found) {
      savedMultiColorsDrawn = true;
      redrawMultiLoad();
    }
  }
}

let allLoadDrawn = false;
function drawAllLoad() {
  if (!allLoadDrawn) {
    if ( savedData.list.length > 0) {
      for(let i = savedData.list.length - 1; i >=0; i--) {
        $('#allSavedLoad' + i).prepend('<canvas style="position: absolute; top: 0px;" id="allLoad' + i + '" width=' + $("#allSavedLoad"+i).innerWidth() + ' height=' + $("#allSavedLoad"+i).innerHeight() + '></canvas>');
      }
      allLoadDrawn = true;
    }
  }
  if (savedData.list.length > 0) {
      redrawAllLoad();
  }
}

let saveActive = -1;

function restoreAll(button) {
  let num = parseInt(button.id.substring(12));
  if (num == saveActive) {
    return;
  }
  if (saveActive != -1 && $(".allLoadActive")[0] != null) {
    $(".allLoadActive")[0].className = "allLoad";
  }
  button.className = "allLoadActive";
  saveActive = num;
  sendRequest("saveActive", saveActive);
}

function restoreSingleColor(button) {
  let color = savedData.list[parseInt(button.id.substring(15))].color;
  singleColor.setColor(color);
}

function removeSingleColor(event, button) {
  event.stopPropagation();
  let index = parseInt(button.parentElement.id.substring(15));
  if (singleColor.equals(savedData.list[index])) {
    $("#singleColorSave").html('save'); //reset save button
    $("#singleColorSave")[0].className = 'topbutton'; //reset save button
  }
  savedData.remove(index);
}

function restoreMultiColor(button) {
  let color = savedData.list[parseInt(button.id.substring(15))];
  multiColor = new MultiColor(color, true, true);
}

function removeMultiColor(event, button) {
  event.stopPropagation();
  let index = parseInt(button.parentElement.id.substring(15));
  if (multiColor.equals(savedData.list[index])) {
    $("#multiColorSave").html('save'); //reset save button
    $("#multiColorSave")[0].className = 'topbutton'; //reset save button
  }
  savedData.remove(index);
  drawMultiLoad();
}

function removeSaved(event, button) {
  event.stopPropagation();
  let index = parseInt(button.parentElement.id.substring(12));
  if (singleColor.equals(savedData.list[index])) {
    $("#singleColorSave").html('save'); //reset save button
    $("#singleColorSave")[0].className = 'topbutton'; //reset save button
  } else if (multiColor.equals(savedData.list[index])) {
    $("#multiColorSave").html('save'); //reset save button
    $("#multiColorSave")[0].className = 'topbutton'; //reset save button
  }
  if (saveActive > index) {
    saveActive--;
    sendRequest("saveActive", saveActive);
  } else if (saveActive == index) {
    saveActive = -1;
    sendRequest("saveActive", saveActive);
  }
  savedData.remove(index);
  setSavedSize();
  drawAllLoad();
}

function removeAllSaved() {
  $("#singleColorSave").html('save'); //reset save button
  $("#singleColorSave")[0].className = 'topbutton'; //reset save button
  $("#multiColorSave").html('save'); //reset save button
  $("#multiColorSave")[0].className = 'topbutton'; //reset save button
  savedData.removeAll("all");
}

function removeAllSingleColors() {
  $("#singleColorSave").html('save'); //reset save button
  $("#singleColorSave")[0].className = 'topbutton'; //reset save button
  savedData.removeAll("SingleColor");
}

function removeAllMultiColors() {
  $("#multiColorSave").html('save'); //reset save button
  $("#multiColorSave")[0].className = 'topbutton'; //reset save button
  savedData.removeAll("MultiColor");
}

function loadSingleOverlayOff() {
  $("#solidLoadOverlay").css({display: 'none'});
  savedData.singleActive = false;
}

function loadMultiOverlayOff() {
  $("#manyLoadOverlay").css({display: 'none'});
  savedData.multiActive = false;
}

function resetOnAndBrightness(send = true) {
  $(".brightnessSlider").val(70);
  brightnessChange($(".brightnessSlider")[0], send);
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
  let rect = button.getBoundingClientRect();
  activeOverlay = -2;
  $("#overlay").css({position: 'fixed',
                     display: 'block',
                     top: rect.y - 155, //todo: do this better?
                     left: rect.x + (rect.width - $("#overlay").width())/2});
  $("#multiColorPicker")[0].jscolor.show();
  setColorBox("multiColorPicker");
}
function makeGradient(multiColor) {
  let unfilledlist = [];
  let filledlist = [];
  for(let i = 0; i < lightsPos.length; i++){
    if(multiColor.selected[i] == false){
      unfilledlist.push(i);
    }
    else{
      filledlist.push(i);
    }
  }
  let newLightsColor = multiColor.colors;
  for(let i = 0; i < unfilledlist.length; i++){
    let total = 0;
    for(let j = 0; j < filledlist.length; j++){
      total = total + (1 / Math.sqrt((lightsPos[filledlist[j]][0] - lightsPos[unfilledlist[i]][0])**2 + (lightsPos[filledlist[j]][1] - lightsPos[unfilledlist[i]][1])**2));
    }
    let red = 0;
    let green = 0;
    let blue = 0;
    for(let j = 0; j < filledlist.length; j++){
      let thisdist = 1 / Math.sqrt((lightsPos[filledlist[j]][0] - lightsPos[unfilledlist[i]][0])**2 + (lightsPos[filledlist[j]][1] - lightsPos[unfilledlist[i]][1])**2);
      let proportion = thisdist/total;
      red = red + (proportion * parseInt(multiColor.colors[filledlist[j]].substring(1,3), 16));
      green = green + (proportion * parseInt(multiColor.colors[filledlist[j]].substring(3,5), 16));
      blue = blue + (proportion * parseInt(multiColor.colors[filledlist[j]].substring(5,7), 16));
    }
    let redint = Math.round(red);
    let greenint = Math.round(green);
    let blueint = Math.round(blue);
    let colorstring = rgbToHexString(redint, greenint, blueint);
    newLightsColor[unfilledlist[i]] = colorstring;
  }
  return newLightsColor;
}

window.onresize = function(event) {
  let activeTab = $(".topbutton-active").html();
  switch(activeTab) {
    case "Solid Color":
      setSolidColorpickerSize();
      break;
    case "Many Colors":
      setMultiColorpickerSize();
      break;
    case "Animated":
      setAnimatedSize();
      break;
    case "Saved Designs":
      setSavedSize();
      break;
    default:
      console.log(activeTab);
  }
  centerSlidersText();
}

function centerSlidersText() {
  // eh fuck it just do all the text sliders at once
  for(let slider of $(".sliderText")) {
    let w = slider.getBoundingClientRect().width;
    if(w != 0) {
      let parentWidth = slider.parentElement.getBoundingClientRect().width;
      slider.style.marginLeft = (parentWidth - w) / 2 + "px";
    }
  }
}

function setSolidColorpickerSize() {
  let width = $("#solidColor").width();
  $("#solidColor")[0].jscolor.width = width - 52;
  // idk why this is wrong but the extra 53 makes it almost ok so....
  let br = document.getElementById("solidColorBr").offsetHeight;
  let height = $(window).height() - $("#solidColorCenter").offset().top - $("#solidColorSliders").outerHeight() - (1.6 * br) - 3;
  $("#solidColor")[0].jscolor.height = height - $("#solidColor").height() - (3.3 * br);
  $("#solidColorCenter").css("height", height);
  $("#solidColor")[0].jscolor.show();
  if(savedData.singleActive) {
    let rect = $("#loadSingleColor")[0].getBoundingClientRect();
    $("#solidLoadOverlay").css({width: rect.width,
                                height: rect.width * 2.5,
                                'font-size': rect.width / 14 + 'px',
                                top: rect.y - rect.width * 2.5,
                                left: rect.x});
  }
}

function setMultiColorpickerSize() {
  //TODO: maybe filling the screen isn't the best idea?
  let width = $("#manyColorEntryCenter").width() * .99;
  let canvas = document.getElementById("manyColorCanvas");
  canvas.style.width = width + 'px';
  canvas.width = width * window.devicePixelRatio;
  let height = $(window).height() - $("#manyColorEntryCenter").offset().top - $("#manyColorEntrySliders").outerHeight() - (1.6 * $("#manyColorBr").outerHeight()) - 3;
  //canvas.style.height = height + 'px';
  $("#manyColorEntryCenter").css("height", height);
  canvas.height = height * window.devicePixelRatio;
  multiColor.redrawLightsPreserve();
  if(savedData.multiActive) {
    let rect = $("#loadMultiColor")[0].getBoundingClientRect();
    let mult = 0.5;
    $("#manyLoadOverlay").css({width: rect.width * (1 + mult),
                                height: rect.width * 2.5,
                                'font-size': rect.width / 10 + 'px',
                                top: rect.y - rect.width * 2.5,
                                left: rect.x - rect.width * mult});
    rect = null;
    for(let i = savedData.list.length - 1; i >=0; i--) {
      if (savedData.list[i].constructor.name == "MultiColor") {
        if (rect === null) {
          rect = $("#multi_ColorLoad" + i)[0].getBoundingClientRect();
        }
        $("#multiLoad" + i).width(rect.width);
        $("#multiLoad" + i).height(rect.height);
      }
    }
    redrawMultiLoad();
  }
}

function setAnimatedSize() {
  let width = $("#animateCenter").width() * .99;
  let height = $(window).height() - $("#animateCenter").offset().top - $("#animateSliders").outerHeight() - (1.6 * $("#animateBr").outerHeight()) - 3;
  //canvas.style.height = height + 'px';
  $("#animateCenter").css("height", height);
  let canvas = document.getElementById("animateCanvas");
  canvas.style.width = width + 'px';
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
}

function setSavedSize() {
  let width = $("#savedCenter").width() * .99;
  let height = $(window).height() - $("#savedCenter").offset().top - $("#savedSliders").outerHeight() - (1.6 * $("#savedBr").outerHeight()) - 3;
  //canvas.style.height = height + 'px';
  $("#savedCenter").css("height", height);

  let children = $("#savedCenter").children();
  if (children.length > 0) {
    let boxWidth = $("#allSavedLoad0").outerWidth();
    let totalWidth = $("#savedCenter").outerWidth();
    let count = Math.floor(totalWidth / boxWidth);
    let spacing = (totalWidth - (count * boxWidth)) / (count + 1);
    for (let i = savedData.list.length - 1; i >= 0; i--) {
      $("#allSavedLoad" + i).css({
        height: boxWidth * 2,
        left: spacing + ((savedData.list.length - 1 - i) % count) * (spacing + boxWidth),
        top: Math.floor((savedData.list.length - 1 - i) / count) * boxWidth * 2 * 1.05
      });
    }
    $(".clearAllSaved").css("top", (1 + Math.floor((savedData.list.length - 1) / count)) * boxWidth * 2 * 1.05);
    for(let i = savedData.list.length - 1; i >=0; i--) {
      $("#allLoad" + i).width($("#allSavedLoad" + i).innerWidth());
      $("#allLoad" + i).height($("#allSavedLoad" + i).innerHeight());
    }
    drawAllLoad();
  }
}

function setColorBox(name) {
  let color = $("#"+name)[0].jscolor.toString("hex");
  $("#"+name).css("backgroundColor", color);
  $("#"+name).css("color", hexToRgb(color).reduce((a,b) => a+b)/3 > 128 ? "#000000" : "#FFFFFF");
}



function initialSetState(data) {
  for(let key in data) {
    switch(key) {
      case "on":
        $(":checkbox").prop('checked', data.on);
        break;
      case "solidColor":
        singleColor = new SingleColor(data.solidColor);
        break;
      case "brightness":
        $(".brightnessSliderLabel").html(data.brightness + "%");
        $(".brightnessSlider").val(data.brightness);
        break;
      case "multiColor":
        multiColor = new MultiColor(data.multiColor, true);
        break;
      case "savedData":
        savedData.load(data.savedData);
        break;
      case "saveActive":
        if (allLoadInitial) {
          if (saveActive != -1) {
            $(".allLoadActive")[0].className = "allLoad";
          }
          $("#allSavedLoad" + data.saveActive).addClass("allLoadActive");
        }
        saveActive = data.saveActive;
        break;
      case "mode": //need to set mode last
        break;
      default:
        console.log(key);
    }
  }
  if ("mode" in data) {
    switch(data.mode) {
      case 'solidColor':
        activateTab($(".topbutton-active")[0], 'tabSolidColor', false, false);
        break;
      case 'manyColors':
        activateTab($(".topbutton")[0], 'tabManyColorEntry', false, false);
        break;
      case 'animate':
        activateTab($(".topbutton")[1], 'tabAnimate', false, false);
        break;
      case 'saved':
        activateTab($(".topbutton")[2], 'tabSaved', false, false);
        break;
      default:
        console.log(data.mode);
    }
  }
}

let activeOverlay = -1;
function overlayOn(i, x, y) {
  activeOverlay = i;
  //let canvas = document.getElementById("manyColorCanvas");
  let canvas = $("#manyColorCanvas");
  let xCenter = canvas.offset().left + canvas.width() / 2;
  let yCenter = canvas.offset().top + canvas.height() / 2;
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
  $("#multiColorPicker")[0].jscolor.hide();
}

function multiColorPickerChange(input,whichcolor) {
  let newColor = input.jscolor.toString("hex");
  setColorBox("multiColorPicker");
  if (activeOverlay >= 0) {
    multiColor.setColor(activeOverlay, newColor);
  } else if (activeOverlay == -2) {
    multiColor.setSolidColor(newColor);
  }
}

function onDocumentMouseDown(e) { //todo: optimzie this to one loop
  let target = e.target || e.srcElement;
  if (activeOverlay !== -1) {
    let t = target;
    let inOverlay = false;
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
  if (savedData.singleActive) {
    let t = target;
    let inOverlay = false;
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
  if (savedData.multiActive) {
    let t = target;
    let inOverlay = false;
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

// const $body = document.querySelector('body');
// let scrollPosition = 0;

// export default {
//   enable() {
//     scrollPosition = window.pageYOffset;
//     $body.style.overflow = 'hidden';
//     $body.style.position = 'fixed';
//     $body.style.top = `-${scrollPosition}px`;
//     $body.style.width = '100%';
//   },
//   disable() {
//     $body.style.removeProperty('overflow');
//     $body.style.removeProperty('position');
//     $body.style.removeProperty('top');
//     $body.style.removeProperty('width');
//     window.scrollTo(0, scrollPosition);
//   }
// };

document.ontouchmove = function(e){ e.preventDefault(); }
