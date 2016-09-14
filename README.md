Night Shift Barista
===================

You are the sole barista during the night shift at a 24-hour coffeeshop. You never know who might show up... but you'll have to serve them coffee.

This is the most up to date version of a game originally submitted to JS13k 2016 (http://js13kgames.com/entries/night-shift-barista).

The game uses sprites by Lisa Leung, a redux-clone called naivedux (https://github.com/jomaxx/naivedux), and a bitmap font called M05_DOKOITSU A/H/K (http://mfs.sub.jp/font.html) (slightly modified to reformat the position of the glyphs and add some of my own).

What follows is the dev log I wrote while developing the game over the course of approximately 7 days (at most 36 hours of dedicated time).

Log
===

Monday, sept 5th
----------------

finally thought through and wrote down some plans on a solid concept: being a barista at a coffeeshop, similar to overcooked

Tuesday sept 6th
----------------

Spent the majority of the night in requirebin, copy/pasting some redux-esque code and formalizing data structures to represent the various components of the game, like how to hold things (inventory), how to represent dirty/clean tools (use separate "types" like `DIRTY_PORTAFILER` instead of modifiers `{ DIRTY_PORTAFILTER, isDirty: true }`).

Also thought through a more wistful, slow version of the game, where the majority of the time is spent waiting for a customer and watching the sun pass.

Wednesday Sept 7th
------------------

Ported the game fully into the game-bucket harness I'd been working on. Reused the canvas size utility I'd written (yay, I actually used something I'd made in prep!). Got basic rendering + input working, everything drawn with fillRect(s). Changed the output from the previous night into a debug overlay (permanent for now).

Thursday Sept 8
---------------

Split out the main file into separate files, and loaded in a dummy sprite sheet (no drawing of sprites yet, but close).

Initially we'd discussed using 24x24 pixel tiles (Lisa drew a beautiful [cup as a test]()), but unfortunately that proved to be too large for the size budget (almost 40k raw, 20k when zipped!) and content requirements. By switching to 12x12 and removing (for now) the concept of "dirtyness" from the game, the sprites only take up around 3k as png8. Luckily, I'd set up the screen to layout things based on columns and rows, so changing from 24 pixels to 12 wasn't a big deal!

Had a detailed discussion around priorities and necessary sprites [photo]().

Lisa drew all the portafilter sprites (empty, full, and half/in-use), two cup sprites (empty and full), and a coffee grinder sprite.

Friday Sept 9
-------------

Took a break, end of the week!

Saturday Sept 10
----------------

Worked for the latter half of the day.

Spent most of the day finding a pixel font, modifying it for actual usage (one line), and creating a way to display arbitrary text in the game. Luckily only added around 600 bytes (unzipped) for the font, and around 500 bytes for the width / character definition + drawing code. Already been paying off, as it saved a ton of effort to use the font for Patrons/Customers instead of custom icons for each type of coffee.

Also doubled the density of the backing canvas, to allow the font to be drawn at half-size compared to the tiles. So font is drawn at 1:1 resolution with the canvas while everything else is drawn at 2x size.

The player can now grab the portafilter from the grouphead, and deposit it in the grinder. Money must also be collected from the customers (temporary display of earned money is in the lower left). I've decided, for now, that only a single button will be used for both item manipulation as well as station activation. Might make some interactions tricky (do you grab the cup or the dirty portafilter first?), but will evaluate again as I progress.

A major unsolved problem is the passage of time. Everything right now is driven by player input, so need to pull a game loop or some sort in here. Might simply, on player input, spawn a timer if necessary.

Got Lisa's first draft of real graphics in as well! They include: cash register, empty counter space, cup rack, hot water dispenser / cleaner, grouphead, milk steamer, trash bin, grinder, portafilter (clean, filled), cup (clean, filled), pickup counter, and a barista (it's her for now haha).

We also discussed how to visually set the shop apart. Maybe some streaming sunlight or patterned tile floor.

Sunday Sept 11
--------------

Worked for about 8 hours with a break or two for food. Have nearly the entire core creations working!

Implemented progress bars and timers, and still not feeling great about how the system knows to increment the timer vs grab an item from the station. There are two types of timers, one that requires the player to activate constantly (hold the button) vs a push once.

Inventory used to be a simple `null` or object with a `type` property. It quickly became apparent that certain stations, like the grouphead, would need multiple inventory slots (portafilter + some sort of cup). I refactored all the checks to use helper functions that accounted for an array, and assumed the player and stations all have arrays for inventory, even if most can only hold one thing.

After manually placing tiles in code and trying to implement Lisa's new door, window, and plant tiles, I made a small tile map format that can handle box-fills of tiles and made everything much easier to draw and layout.

Espresso can be overbrewed, and this is reflected in progress bars (`timer` property, internally) having `green` and `red` properties. If the timer value is greater than or equal to green but less than red, the coffee is perfect and the customer will give you bonus reputation points.

Also implemented milk steaming, cappuccinos, americanos, espressos, milk cups, water cups, and trash. After implementing these, and the timing / brewing, I strongly question if I should have opted for a more generic form of creation checking. Right now, each station accepts certain items. Upon activation, the station will output (swap, really) a particular new item. For example, if you give the Water station a `CLEAN_CUP`, it will output a `FILLED_HOT_WATER_CUP`. If you give the water station a `FILLED_ESPRESSO_CUP`, it will give you `FILLED_AMERICANO_CUP`. Spelled out here, the logic is simple. But in code, it gets quite convoluted, especially because the "brew" timing transformation needs to know what it has in order to output what it should. And the interactions get tricky too, because in order to know if the player should pick up the item, the code needs to know if it's been transformed into the output yet.

An alternative to this would have been somewhat generic items that could contain multiple ingredients. So an item might start off with just `[CLEAN_CUP]`, and then when you add water it becomes `[CLEAN_CUP, HOT_WATER]`. And each step of the way a best effort is made to provide a reasonable sprite. And finally, when a valid recipe is found (like `[CLEAN_CUP, HOT_WATER, ESPRESSO] => AMERICANO`), _then_ the transformation happens. Instead I'm transforming as we go along, meaning I need "states" for different in progress ingredients (`FILLED_HOT_WATER_CUP`).

Felt pretty bummed as the night came to a close. The primary reducer feels very difficult to reason about, and adding a new item involves changing code in several places. But probably not time to refactor / rethink if I actually want to finish the game. Still tons to do before I can consider the game playable, and it might not even be fun...

Lisa made several modifications to the sprites to increase the contrast between interactive objects and the background, added floor pattern tiles, finished additional cups (cappuccino), and made some icons for the yet-unprogrammed "recipe board".

Monday Sept 12
--------------

The last day. I started working around 7 PM, was up until 7:30 AM (the competition deadline was at 7:00AM), and got my game in around 6:55AM. Just in time!

I struggled to create a system for moving between levels of the game. While I was still mulling over solutions, I implemented a level timer. And I knew that I wanted to show the passage of time via sunlight or color moods, so I used a cheap trick to fake sunlight. The "sun" is really just a point off the left edge of the screen that moves from a start to and end position as the level approaches its time limit. Each window draws a trapezoid from itself to the "sun point", using a sun height.

The crudeness of the sunlight effect also inspired the name and setting: night time at a 24-hour coffee shop.

Next I wanted mobile support, and had some existing code I could use for mobile swipes. But then I realized how difficult it would be to determine the difference between a swipe and a press and hold (for activating the stations). No time for that now! Instead I asked Lisa to make some SVGs for on screen buttons. Then I spent an exorbitant amout of time trying to position them. I later left them commented out because I couldn't quite know what the final screen size would be (and decided that mobile support was not 100% necessary, although I later implemented it).

I took a break to shower, and in the process figured out what the next steps would be. Never underestimate the power of walking away from a problem to solve it!

I still didn't know how I would represent and swap out different "levels" in my state tree. But I at least needed a way to represent different screens of the app. I went with a single flag called `view` that the `render` function would check. I added a splash screen as the first view, with lots of text, instructions, and credits. Also had to implement font scaling, which proved pretty easy since I was already measuring it manually.

Levels ended up being a description of the possible customers that would spawn, and nothing else. I assumed they'd be more complex, requiring nearly a complete manipuation of the state tree (different stations, different timings, different drinks, different customers, etc), but there was not time for any of those features. So a level is a simple index of customer drink `wants` with the percent chance-ish of spawning. Next level? Increase the level counter. I also have support for how often a customer type can be spawned. I wanted to make some mystery types but... no time.

I had never really solved player feedback, especially around requiring the player to pickup money from the customer before being able to serve them drinks. So I made a "THOUGHTS" area, which proved useful. It allowed me to very cheaply communicate different flavor and important information to the player.

I eventually again attempted mobile support. The refactoring I'd done for input to use thunks paid off, but I still spent a lot of time trying to get the canvas to size properly in the mobile viewport. In the end, I had to use 80vh (or something close to that) instead of 100vh to prevent Safari from obscurring the playfield. This is a major hindrance to mobile web gaming.

I added a between-level summary screen so the next level wasn't as jarring. And with the addition of an end-game summary screen, the entire flow was basically complete.

I tweaked the sunlight a bit more, fixed a trash bug, and made order-taken but unserved customers subtract reputation at the level end.

Sadly I had to cut so many things, like multiple group heads (brew stations), milk steaming pitchers (you'd have to carry them around to use milk), and mystery customers that wanted weird drinks (just hot water, just steamed milk, just grounds, etc). And I barely submitted in time: I didn't realize I needed screenshots! The final zip was around 11K.


