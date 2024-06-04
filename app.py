import sqlite3

from flask import Flask, flash, g, jsonify, redirect, render_template, request, session
from flask_bcrypt import check_password_hash, generate_password_hash
from flask_session import Session
from functools import wraps

app = Flask(__name__)

# Configures session settings
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Ensures responses aren't cached
@app.after_request
def after_request(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response

# Creates a SQL cursor
def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect("final.db")
        g.db.row_factory = sqlite3.Row
        g.cursor = g.db.cursor()
    return g.cursor

# Automatically closes the database connection when the request ends
@app.teardown_appcontext
def close_db(error):
    if hasattr(g, 'db'):
        g.db.close()

# Ensures user logged in before they can access specific routes
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)

    return decorated_function


@app.route("/error")
def error():
    return render_template("error.html")


@app.route("/")
@login_required
def index():
    id = session["user_id"]
    cursor = get_db()
    cursor.execute("SELECT username FROM users WHERE id = ?", (id,))
    username = cursor.fetchone()
    return render_template("index.html", username=username[0] if username else None)


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
        cursor = get_db()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        rows = cursor.fetchall()

        # Ensures username exists and password is correct
        if len(rows) != 1 or not check_password_hash(
            rows[0]["password"], password
        ):
            flash("Invalid username and/or password", "error")
            return redirect("/error")

        # Remembers which user has logged in
        session["user_id"] = rows[0]["id"]

        # Redirects user to index page
        return redirect("/")

    # Renders the login page 
    return render_template("login.html", error=error)


@app.route("/logout")
def logout():
    # Forgets any user_id
    session.clear()

    # Redirects user to login form
    return redirect("/")


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        confirmPassword = request.form.get("confirmation")

        # Queries database for username
        cursor = get_db()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        rows = cursor.fetchall()

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
            hashedPassword = generate_password_hash(password)

            # Insert their username and their hashed password into the users table
            cursor.execute("INSERT INTO users(username, password) VALUES(?, ?)", (username, hashedPassword))
            cursor.connection.commit()

            # Logs the user in
            cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
            rows = cursor.fetchall()
            session["user_id"] = rows[0]["id"]

            # Alerts user they have registered
            flash("Registered!", "info")

            return redirect("/")

    return render_template("register.html")


# Dynamic route for all levels
@app.route("/levels/<level_type>/<level_number>")
@login_required
def level_view(level_type, level_number):
    # Determines the type of level the user navigated to
    page = request.path
    isReview = "review" in page
    isTutorial = "tutorial" in page
    templateName = f"levels/level_{level_number}_{level_type}.html"
    currentLevel = session["level_number"] = level_number
    return render_template(templateName, isReview=isReview, isTutorial=isTutorial, currentLevel=currentLevel)


@app.route("/review-results", methods=["POST"])
@login_required
def review_results():
    data = request.get_json()  # Get the JSON data sent from the JS
    
    # Assigns the data from JS to variables to use in py
    user_id = session["user_id"]
    levelNumber = session["level_number"]
    correctCount = data.get("correctCount", 0)
    incorrectCount = data.get("incorrectCount", 0)
    totalTime = data.get("totalTime", 0)
    wpm = data.get("wpm", 0)
    score = data.get("score", 0)

    # Inserts data from JS into database
    cursor = get_db()
    cursor.execute("SELECT level FROM scores WHERE user_id = ?", (user_id,))
    levelsCompleted = [row[0] for row in cursor.fetchall()]

    # Checks if the level is already completed by the user
    if int(levelNumber) in levelsCompleted:
        cursor.execute("SELECT score FROM scores WHERE user_id = ? AND level = ?", (user_id, levelNumber))
        currentLevelExistingScore = cursor.fetchone()["score"]

        if currentLevelExistingScore < score:
            cursor.execute("UPDATE scores SET correct = ?, incorrect = ?, time = ?, wpm = ?, score = ? WHERE user_id = ? AND level = ?",
                            (correctCount, incorrectCount, totalTime, wpm, score, user_id, levelNumber))
            cursor.connection.commit()
            return jsonify({"message": "Updated results inserted into db"})
    
        else:
            return jsonify({"message": "Score is lower, no update made"})
    
    else:
        cursor.execute("INSERT INTO scores (user_id, level, correct, incorrect, time, wpm, score) VALUES (?, ?, ?, ?, ?, ?, ?)",
                   (user_id, levelNumber, correctCount, incorrectCount, totalTime, wpm, score))
        
        cursor.connection.commit()
        return jsonify({"message": "Results inserted into db"})

@app.route("/levels/congratulations")
@login_required
def congratulations():
    return render_template("levels/congratulations.html")