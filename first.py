from flask import Flask, send_from_directory, redirect, url_for, request, render_template, make_response, json
from threading import Timer, Lock, Thread
from os import path

app = Flask(__name__)

import logging
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

import asyncio
import websockets

async def socket_handler(websocket, path):
    name = await websocket.recv()
    print(f"< {name}")

    greeting = f"Hello {name}!"

    await websocket.send(greeting)
    print(f"> {greeting}")
    while(True):
        pass

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
data_filename = 'data.json'

if(path.exists(data_filename)):
    with open(data_filename) as f:
        data = json.load(f)

def writeFunc():
    with open(data_filename, 'w') as f:
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

    for i in data:
        print(i+":", data[i])


    return make_response("test")


if __name__ == "__main__":
    Thread(target=app.run, kwargs={'host': "0.0.0.0"}).start()
    start_server = websockets.serve(socket_handler, "0.0.0.0", 8765)

    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()
