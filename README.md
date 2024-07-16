(introduction) i was inspired to create this web app as i have had to learn to type for coding.

(login and register)

(levels and javascript)
I'm using dynamic urls for the level routes instead of individual routes for each level. This is something I learned when trying to avoid the repetition of multiple routes that just rendered each level.
I have decided to split the levels into two different catagories. Tutorials and reviews. The reason behind this is the functionality of how the program responds when a user presses a key. In the tutorials the the program wont move onto the next letter unless you get it right. Where in the reviews you can get letters wrong, and you can also correct them by using the backspace. The reviews keep track of how many letters you got right and wrong and how long it takes you to complete the review, this is what gives them their words per minute (wpm) on each review. The words per minute plus the percentage of how many letters they got right is what calculates their score. Their score, wpm and the number of words they got right and wrong is passed to the server using JSON. If their score is higher than the pass score then they will unlock the next level.
I used a modal for the results screen rather than a new html file so that the page didn't have to reload. To get the results on the screen I used Javascript to define variables and assign them to a result that i wanted to display. I then created a function (showReviewModal) that uses template literals to show the results on the modal. within this function it calls another function (sendResults) which uses the fetch method to send those results to python so they can be inserted into final.db using sql. It also calls toggleButtons which compares the score the user got to the passing score. If their score is higher it will display the next level button giving them access to the next level. If they dont pass they will only have access to the retry button

Next i needed to lock the levels and unlock them once the user has completed the previous one. First I had to disable the buttons that navigates to the levels that they havent unlocked yet whilst also making sure that the user couldn't just input the level type and number into the url which would then take them to that level and if they completed it, it would unlock all previous levels. this ment i had to add a highest_level_completed column in the users table so i could track the highest level the user has completed and if they tried to navigate to a level that they have not unlocked (highest level completed + 1) then they would be directed to error.html with a message. I used the fetch method again to send data to a route in app.py which has a series of conditionals which updates the highest_level_completed depending on wether they met the conditions to unlock the next level.

I then made a dropdown so users can see their profile and also logout. to do this i used a combination of youtube and chatgpt to help me make it look smooth with transitions.

I then made the profile page. 


I then made the speed test page. now this made me think a lot because there is a lot of cross over logic between the review levels and this speed test page. So i decided to refactor my levels.js code and create a helpers.js with the functions and variables that would be used in both levels.js and speedTest.js

Then i used nltk and the Gutenberg corpus to generate random text for the user to type and test their speed and accuracy.
I made two buttons on completion where the user can navigate to another speed test (generating a new text) or retrying the text they just completed. I did this by storing the text in storage therefore if the page gets reloaded by the retry button or just in general the same text will remain on the screen. But if the user presses the next test button it navigates to the next-speed-test route which pops (removes) the text from session redirects to the speed-test route and generates a new text which is then loaded onto the page. I also made the index route pop the text from session so if they navigate to the home page then back to the speed test page they'll also get a new text.

I then decided that for the profile page i wanted to have the users stats e.g highest wpm their average accuracy etc shown on their profile page. I originally was storing the results of the review levels for this but i think its better to show their speed test stats rather then their review score stats. So i removed the code that was saving the review data and deleted the scores table in the db as it isn't necessary to have all that extra data.


#TODO make sure user cant just press random keys quickly to pass levels - make it so they have to get higher than the pass score and also higher than 60% accuracy.

Chatgpt usage: i used chatgpt to generate the letter sequences of each level.