function buttonClick() {
  var value = document.getElementById("textbox").value;
  var xhr = new XMLHttpRequest();

  var url = window.location.href;
  url = url.substring(0, url.lastIndexOf('/')) + "/response";


  xhr.open("POST", url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4 && xhr.status == 200) {
      console.log(xhr.response);
    }
  }
  xhr.send(JSON.stringify({
        'entry': value
  }));
}
