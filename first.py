#!/usr/bin/env python3
from flask import Flask, send_from_directory, redirect, url_for, request, render_template, make_response, json
from threading import Timer, Lock, Thread, Condition
from os import path
from math import ceil
from multiprocessing import Process

app = Flask(__name__)

import logging
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

import asyncio
import websockets

cond = Condition()

async def socket_handler(websocket, path):
    name = await websocket.recv()
    print(f"< {name}")

    greeting = f"Hello {name}!"

    await websocket.send(greeting)
    print(f"> {greeting}")
    while(True):
        cond.acquire()
        cond.wait()
        await websocket.send(sendToESP())



def hexToBytes(color, i):
    r = int(ceil(int(color[1:3], 16) * i))
    g = int(ceil(int(color[3:5], 16) * i))
    b = int(ceil(int(color[5:7], 16) * i))
    #print('{:02x}{:02x}{:02x}'.format(r,g,b))
    return bytes([r,g,b])

def sendToESP():
    i = 1
    if "on" in data and data["on"] == False:
        i = 0
    if "solidColorBrightness" in data:
        i = i * (int(data["solidColorBrightness"]) / 100)
    if "mode" in data:
        if data["mode"] == "solidColor" and "solidColor" in data:
            return hexToBytes(data["solidColor"], i)
        elif data["mode"] == "manyColors" and "manyColors" in data:
            ret = bytes()
            for c in data["manyColors"]:
                ret += hexToBytes(c, i)
            return ret
    return bytes()

@app.route("/")
def root():
    return redirect(url_for('send_html', path='tabs.html'))

@app.route("/static/<path>")
def send_static(path):
    return send_from_directory('static', path);

@app.route("/tabs.html", methods=['GET'])
def send_html(path='tabs.html', entered=None):
    return render_template(path, name = entered);


data = {}
data_filename = 'data.json'

if(path.exists(data_filename)):
    with open(data_filename) as f:
        try:
            data = json.load(f)
        except ValueError as e:
            pass


def writeFunc():
    with open(data_filename, 'w') as f:
        json.dump(data, f)
    print("saved to file")

writeToFile = Timer(5, writeFunc)
lock = Lock()

@app.route("/response", methods=['POST'])
def response():
    if "getState" in request.json:
        return make_response(data)
    else:
        global writeToFile
        lock.acquire()
        writeToFile.cancel()
        writeToFile = Timer(5, writeFunc)
        writeToFile.start()
        lock.release()

        data.update(request.json)

        with cond:
            cond.notifyAll()

        return make_response("test")


if __name__ == "__main__":
    Process(target=app.run, kwargs={'host': "0.0.0.0"}).start()
    start_server = websockets.serve(socket_handler, "0.0.0.0", 8765)

    asyncio.get_event_loop().run_until_complete(start_server)
    try:
        asyncio.get_event_loop().run_forever()
    except KeyboardInterrupt:
        print()
