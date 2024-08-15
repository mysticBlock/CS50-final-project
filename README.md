# Type Journey

#### Video demo:
https://youtu.be/cajcw2xAhu8

#### Description:
Type Journey is a web app designed for users to learn how to touch type.

**Login/logout & register:**
When the user open’s Type Journey they will be directed to a login page. If they haven’t got an account they can register by clicking register in the navbar and filling out the form. For these files I used pretty much the same login/logout and register logic from week 9 finance. The only differences were in register where I made sure the password was 8 characters or longer and instead of using werkzeug.security I used flask_bcrypt for the check_password_hash and generate_password_hash functions.

**Layout.html & level-layout.html:**
I used these two files to render navbars onto the rest of my html files to avoid copy & pasting navbars in every html document. The layout.html template is a navbar for everything excluding level pages. It contains links to login.html and register.html if the user isn't logged in and links to the lessons (index.html), speedTest.html, and a profile icon which has a dropdown to logout or go to profile.html. The level-layout includes a slimmer navbar with only an exit button so the user can exit the level. It also includes a modal that gets displayed when the user completes a level.

**Index.html:**
This is the main page. You can navigate to anywhere in the app from here by either clicking on the level buttons or navigating through the navbar. The main contents of this page are big buttons which navigate the user to the levels. When a new user discovers this page for the first time they will only have access to the first level. As they complete levels they will gain access to new levels. I have done this by using a sqlite database to store the users highest level completed and I used javascript to disable the buttons that are greater than their highest level completed +1 meaning they have access to the next level that they are yet to complete. I also made sure using python that if the disabled attribute on the buttons they haven't unlocked yet got maliciously removed that they would be directed to error.html with the message “You haven't unlocked this level yet.”
Ensuring users can't skip levels without completing the last one. When a user completes all the levels they will be directed to congratulations.html congratulating them on finishing.

**Levels:**
For the levels I used a dynamic url for the route to avoid having a route for every level.
I created a function called renderChars (in helpers.js) to render the words/letters for each level in span tags so that i could use a keydown event listener on each letter to know if the user got the letter right or wrong. I did this so all I had to have in html for all levels were a div element with a data attribute with the letters I wanted rendered onto the page.
 
There are two different types of levels. Review levels and tutorial levels. Tutorial levels aim to teach the user which key is where on the keyboard by not advancing to the next letter until the user hits the right key. Review levels are used to test the user and they can press any key on the keyboard therefore they can get letters wrong (they can hit backspace and correct the letter). At the end of each level the user gets a score. The score is made up of the user's accuracy and their wpm (words per minute) for that level. Each review level has a pass score the user has to beat to move on to the next level.

Once a level is complete a modal appears prompting the user to go to the next level. If it's a review level it shows them stats as well.

**Speed test:**
The speed test is for users to test their typing speed by giving them a random paragraph to type. The typing logic is the same as review levels except on completion it also saves the users stats from that test to a table in the sqlite db. This is important because it is what is used to give the user their average wpm and accuracy on the profile page. 
To generate the random paragraph I used NLTK to download the Gutenberg corpus and used 3 txt files from it with markovify to generate a model on each one of those txt files. I then combined these models into one using markovify.combine(). I then created a function to generate a random paragraph/sentence between 50 and 100 characters long using the markovify model.

**Use of ai:**
I used chat gpt to help me with a decent amount of Javascript as I haven't yet learned it extensively. I used Mdn web docs as well as my knowledge from Free Code Camp’s Javascript course to make sure I fully understood every line of code before I implemented it. I also used chat gpt for all the information about NLTK and markovify on how to make and generate the random paragraph/sentence in speed test.