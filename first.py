from flask import Flask, send_from_directory, redirect, url_for, request, render_template, make_response, json
from threading import Timer

app = Flask(__name__)

import logging
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)


@app.route("/")
def root():
    return redirect(url_for('send_html', path='tabs.html'))

@app.route("/static/<path>")
def send_static(path):
    return send_from_directory('static', path);

@app.route("/<path>", methods=['GET'])
def send_html(path, entered=None):
    return render_template(path, name = entered);

data = {}

with open('data.json') as f:
    data = json.load(f)

def writeFunc():
    with open('data.json', 'w') as f:
        json.dump(data, f)
    print("done!")

writeToFile = Timer(5, writeFunc)

@app.route("/response", methods=['POST'])
def response():
    global writeToFile
    writeToFile.cancel()
    writeToFile = Timer(5, writeFunc)

    data.update(request.json)

    for i in data:
        print(i+":", data[i])

    writeToFile.start()

    return make_response("test")
