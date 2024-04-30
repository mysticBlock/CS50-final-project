import sqlite3

from flask import Flask, redirect, render_template, session
from flask_session import Session
from functools import wraps

app = Flask(__name__)

# Configures session settings
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

conn = sqlite3.connect('final.db')
db = conn.cursor()

# Ensure responses aren't cached
@app.after_request
def after_request(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response

# Ensures user logged in before they can access specific routes
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)

    return decorated_function

@app.route('/')
@login_required
def index():
    id = session["user_id"]
    username = db.execute("SELECT username FROM users WHERE id = ?", id)
    return render_template('index.html', username=username)
