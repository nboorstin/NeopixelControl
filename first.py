from flask import Flask, send_from_directory, redirect, url_for, request, render_template

app = Flask(__name__)


@app.route("/")
def root():
    return redirect(url_for('send_html', path='test.html'))

@app.route("/<path>", methods=['GET'])
def send_html(path, entered=None):
    print(path)

    print(entered)
    return render_template(path, name = entered);

@app.route("/response", methods=['POST'])
def response():
    return send_html(path='test.html', entered=request.form['entry'])
