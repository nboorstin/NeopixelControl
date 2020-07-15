from flask import Flask, send_from_directory

app = Flask(__name__)


@app.route("/")
def hello():
    return "Hello world"

@app.route("/<path>")
def send_html(path):
    return send_from_directory("html", path)
