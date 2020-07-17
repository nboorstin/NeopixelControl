function sendRequest(name, value) {
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

// solid color handlers
function solidColorChange(input) {
  //console.log(selectedObject.value);
  sendRequest("solidColor", input.value);
}

function solidColorBrightnessChange(input) {
  //console.log(selectedObject.value);
  document.getElementById("sliderPercent").innerHTML = input.value + "%";
  sendRequest("solidColorBrightness", input.value);
}

window.onload = function() {
  document.getElementById("sliderPercent").innerHTML =
    document.getElementById("solidColorBrightness").value + "%";
}
