from flask import Flask, send_from_directory, redirect, url_for, request, render_template, make_response

app = Flask(__name__)


@app.route("/")
def root():
    return redirect(url_for('send_html', path='tabs.html'))

@app.route("/static/<path>")
def send_static(path):
    return send_from_directory('static', path);

@app.route("/<path>", methods=['GET'])
def send_html(path, entered=None):
    return render_template(path, name = entered);


@app.route("/response", methods=['POST'])
def response():
    print(request.form)
    if 'entry' in request.form:
        return send_html(path='tabs.html', entered=request.form['entry'])
    else:
        print(request.json['entry'])
        return make_response("test")
