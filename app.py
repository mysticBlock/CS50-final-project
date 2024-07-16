import sqlite3
import nltk
import markovify


from flask import Flask, flash, g, jsonify, redirect, render_template, request, session
from flask_bcrypt import check_password_hash, generate_password_hash
from flask_session import Session
from functools import wraps

# Downloads the Gutenberg corpus (for speed test)
nltk.download('gutenberg')

# Loads texts from the Gutenberg corpus
texts = [
    nltk.corpus.gutenberg.raw('austen-emma.txt'),
    nltk.corpus.gutenberg.raw('carroll-alice.txt'),
    nltk.corpus.gutenberg.raw('bryant-stories.txt')
]

# Builds individual Markov models
models = [markovify.Text(text) for text in texts]

# Combines the models (used to generate texts for speed test)
combinedModel = markovify.combine(models)

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
    # Removes the stored random text from the session when user navigates to index
    session.pop("stored_random_text", None)
    id = session["user_id"]
    cursor = get_db()
    cursor.execute("SELECT username FROM users WHERE id = ?", (id,))
    username = cursor.fetchone()

    # To render the unlocked or locked buttons
    cursor.execute("SELECT highest_level_completed FROM users WHERE id = ?", (id,))
    highestLevelCompleted = cursor.fetchone()[0]
    return render_template("index.html", username=username[0] if username else None, highestLevelCompleted=highestLevelCompleted)


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

# Route for profile page
@app.route("/profile")
@login_required
def profile():
    cursor = get_db()
    user_id = session["user_id"]

    #Gets the highest level completed
    cursor.execute("SELECT highest_level_completed FROM users WHERE id = ?", (user_id,))
    highestLevelCompleted = cursor.fetchone()[0]

    # Gets the average wpm
    cursor.execute("SELECT wpm FROM speed_scores WHERE user_id = ?", (user_id,))
    allWpm = cursor.fetchall()
    wpmValues = [row["wpm"] for row in allWpm]
    if wpmValues:
        averageWpm = sum(wpmValues) / len(wpmValues)
    else:
        averageWpm = 0

    #Gets the average accuracy
    cursor.execute("SELECT accuracy FROM speed_scores WHERE user_id = ?", (user_id,))
    allAccuracy = cursor.fetchall()
    accuracyValues = [row["accuracy"] for row in allAccuracy]
    if accuracyValues:
        averageAccuracy = sum(accuracyValues) / len(accuracyValues)
    else:
        averageAccuracy = 0

    return render_template("profile.html", highestLevelCompleted=highestLevelCompleted, averageWpm=averageWpm, averageAccuracy=averageAccuracy) 


# Generates random text based on markov model
def generate_randomText(model, min_length=50, max_length=100):
    randomText = None
    while randomText is None or len(randomText) < min_length:
        randomText = model.make_sentence()

    if randomText and len(randomText) > max_length:
        randomText = randomText[:max_length].rsplit(' ', 1)[0]  # Ensure not to cut words in the middle
    return randomText

@app.route("/speed-test")
@login_required
def speed_test():
    storedRandomText = session.get("stored_random_text")
    if storedRandomText:
        randomText = storedRandomText
    else:
        randomText = generate_randomText(combinedModel)
        session["stored_random_text"] = randomText
    
    return render_template("speed_test.html", randomText=randomText)


@app.route("/speed-test-results", methods=["POST"])
@login_required
def speed_test_results():
    # Gets the JSON data sent from the JS sendResults function
    data = request.get_json()

    # Assigns the data from JS to variables to use in py
    user_id = session["user_id"]
    correctCount = data.get("correctCount", 0)
    incorrectCount = data.get("incorrectCount", 0)
    totalTime = data.get("totalTime", 0)
    wpm = data.get("wpm", 0)
    accuracy = data.get("accuracy", 0)

    # Inserts data from JS into speed_scores database
    cursor = get_db()
    cursor.execute("INSERT INTO speed_scores (user_id, correct, incorrect, time, wpm, accuracy) VALUES ( ?, ?, ?, ?, ?, ?)",
                   (user_id, correctCount, incorrectCount, totalTime, wpm, accuracy))
    cursor.connection.commit()
    return jsonify({"message": "Results inserted into db"})
    


@app.route("/next-speed-test")
@login_required
def next_level():
    session.pop("stored_random_text", None)
    return redirect('speed-test')


# Dynamic route for all levels
@app.route("/levels/<level_type>/<level_number>")
@login_required
def level_view(level_type, level_number):

    user_id = session["user_id"]
    session["level_number"] = level_number # Saves level_number to session
    levelNumber = int(level_number)

    cursor = get_db()

    cursor.execute("SELECT highest_level_completed FROM users WHERE id = ?", (user_id,))
    highestLevelCompleted = cursor.fetchone()[0]

    # Returns error if user tries to navigate to a page they haven't unlocked yet using the url
    if levelNumber > highestLevelCompleted + 1:
        flash("You haven't unlocked this level yet.")
        return render_template("error.html")

    # Used for jinja conditional to render either the tutorial or review modal
    page = request.path
    isReview = "review" in page
    isTutorial = "tutorial" in page

    # Constructs the url
    templateName = f"levels/level_{level_number}_{level_type}.html"
    

    return render_template(templateName, isReview=isReview, isTutorial=isTutorial)


# Saves the highest level completed into the db at highest_level_completed
@app.route("/complete-level", methods=["POST"])
@login_required
def complete_level():
    user_id = session["user_id"]
    data = request.get_json()
    levelNumber = session["level_number"]
    score = data.get("score", 0)
    passScore = data.get("passScore", 0)

    if levelNumber is not None:
        levelNumber = int(levelNumber)

        cursor = get_db()
        cursor.execute("SELECT highest_level_completed FROM users WHERE id = ?", (user_id,))
        currentHighestLevel = cursor.fetchone()[0]

        # Checks if the level is a tutorial or review
        if data.get("isTutorial"):
            if levelNumber > currentHighestLevel:
                cursor.execute("UPDATE users SET highest_level_completed = ? WHERE id = ?", (levelNumber, user_id))
                cursor.connection.commit()
                return jsonify({"message": "Success"})
            else:
                return jsonify({"message": "Not the highest level the user has completed"})
        else:
            if levelNumber > currentHighestLevel and score >= passScore:
                cursor.execute("UPDATE users SET highest_level_completed = ? WHERE id = ?", (levelNumber, user_id))
                cursor.connection.commit()
                return jsonify({"message": "Success"})
            else:
                return jsonify({"message": "Not the highest level the user has completed or they didn't pass"})


@app.route("/congratulations")
@login_required
def congratulations():
    return render_template("levels/congratulations.html")