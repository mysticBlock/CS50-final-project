(introduction) i was inspired to create this web app as i have had to learn to type for coding.

(login and register)

(levels and javascript)
I'm using dynamic urls for the level routes instead of individual routes for each level. This is something I learned when trying to avoid the repetition of multiple routes that just rendered each level.
I have decided to split the levels into two different catagories. Tutorials and reviews. The reason behind this is the functionality of how the program responds when a user presses a key. In the tutorials the the program wont move onto the next letter unless you get it right. Where in the reviews you can get letters wrong, and you can also correct them by using the backspace. The reviews keep track of how many letters you got right and wrong and how long it takes you to complete the review, this is what gives them their words per minute (wpm) on each review. The words per minute plus the percentage of how many letters they got right is what calculates their score. Their score, wpm and the number of words they got right and wrong is passed to the server using JSON. If their score is higher than the pass score then they will unlock the next level.
I used a modal for the results screen rather than a new html file so that the page didn't have to reload.
