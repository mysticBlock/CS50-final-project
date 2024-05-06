import sqlite3

from flask import Flask, flash, redirect, render_template, request, session
from flask_session import Session
from functools import wraps
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)

# Configures session settings
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

conn = sqlite3.connect("final.db")
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

@app.route("/")
@login_required
def index():
    id = session["user_id"]
    username = db.execute("SELECT username FROM users WHERE id = ?", id)
    return render_template("index.html", username=username)

@app.route("/error")
def error():
    return render_template("error.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    # Forgets any user_id
    session.clear()

    # User submits the login form
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if not username:
            flash("Username is required", "error")
            return redirect("/error")

        elif not password:
            flash("Password is required", "error")
            return redirect("/error")

        # Queries database for username
        rows = db.execute("SELECT * FROM users WHERE username = ?", username)

        # Ensures username exists and password is correct
        if len(rows) != 1 or not check_password_hash(
            rows[0]["hash"], password
        ):
            flash("Invalid username and/or password", "error")
            return redirect("/error")

        # Remembers which user has logged in
        session["user_id"] = rows[0]["id"]

        # Redirects user to index page
        return redirect("/")

    # Renders the login page 
    return render_template("login.html", error=error)

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        confirmPassword = request.form.get("confirmation")

        # Returns a list of usernames that matches the same one the user entered
        rows = db.execute("SELECT * FROM users WHERE username = ?", request.form.get("username"))
        if not username or not password:
            flash("Input both a username and password")
            return redirect("/error")

        # If there is a row in the users db where the username = the username they entered, it means the username already exists
        elif len(rows) != 0:
            flash("Username already exists")
            return redirect("/error")

        elif confirmPassword != password:
            flash("Passwords were not the same")
            return redirect("/error")
        else:
            # Hashes the users password
            hash = generate_password_hash(password)

            # Insert their username and their hashed password into the users table
            db.execute("INSERT INTO users(username, hash) VALUES(?, ?)", username, hash)

            # Logs the user in
            rows = db.execute("SELECT * FROM users WHERE username = ?", username)
            session["user_id"] = rows[0]["id"]

            # Alerts user they have registered
            flash("Registered!", "info")

            return redirect("/")

    return render_template("register.html")