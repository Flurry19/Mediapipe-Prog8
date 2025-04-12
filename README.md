# ControlIt!
ControlIt is a project so you can pause, play and change the volume of music or a video while you lay in bed and your screen is in front of you.
As someone who has experienced to being able to get out of bed this is an easy way to take control of your music or videos!
Use the code in this project to adjust it to your own video's or music!

## Installation
### Clone the repository
git clone https://github.com/Flurry19/Mediapipe-Prog8.git
You will get 3 maps. If you only want to use the functionality to control the music, just place your own video in the index.html and start controlling it!

### Or create your own model
If you want to create your own poses to control the music. Start with the map data_collection.
Change the buttons in the index.html to your own poses. Change the id and the text within the button.

<button id="hand">Pause (Hand)</button>
<button id="fist">Play (fist)</button>
<button id="down">Volume down (point down)</button>
<button id="up">Volume up (point up)</button>
Then change the names of your poses in script.js:

const poses = ["hand", "fist", "down", "up"]

Start a local server and perform your poses and press the corresponding button. After that log the data. Copy the data from the textarea and place the data in the map train_nn in the data.json file.
After that open the local server of the data_collection and press the button "train". You will get 3 files, place them in the map model in app and delete the other files in model.
The last thing you need to change is in the map app the script.js file.
Please change the poses to the poses you want for the actions:

if (results[0].label === "hand" && !songPaused) {
song.pause();
songPaused = true;
}

if (results[0].label === "fist" && songPaused) {
song.play();
songPaused = false;
}

if (results[0].label === "down" && song.volume>0.01) {
song.volume -= 0.01;
}

if (results[0].label === "up" && song.volume<0.99) {
song.volume += 0.01;
}

After that start your index.html in the map app and control the music/video!

