from flask import Flask, send_from_directory, redirect, url_for, request, render_template, make_response, json
from flask_socketio import SocketIO, send, emit
from threading import Timer, Lock

app = Flask(__name__)

import logging
log = logging.getLogger('werkzeug')
#log.setLevel(logging.ERROR)

socketio = SocketIO(app, heartbeat_interval=4, heartbeat_timeout=10)
if __name__ == '__main__':
    socketio.run(app)

@socketio.on('my event')
def handle_message(message):
    print('recieved message: ' + str(message))
    send('test', broadcast=True)

@socketio.on('connect')
def test_connect():
    print("connected!")
    emit('my response', {'data': 'Connected'})

@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected')

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
lock = Lock()

@app.route("/response", methods=['POST'])
def response():
    global writeToFile
    lock.acquire()
    writeToFile.cancel()
    writeToFile = Timer(5, writeFunc)
    writeToFile.start()
    lock.release()

    data.update(request.json)
    socketio.emit('data', data, broadcast=True)


    for i in data:
        print(i+":", data[i])


    return make_response("test")
