import { HandLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18";

//Data was opgeslagen met newBlob en functie ervoor

//Get the buttons from the HTML
const enableWebcamButton = document.getElementById("webcamButton")
const logButton = document.getElementById("logButton")
const json = document.getElementById("json")



//Call the other variables
const video = document.getElementById("webcam")
const canvasElement = document.getElementById("output_canvas")
const canvasCtx = canvasElement.getContext("2d")
const drawUtils = new DrawingUtils(canvasCtx)
let handLandmarker = undefined;
let webcamRunning = false;
let results = undefined;

let data = [];

//Store the data with the right label
function storeData(label){
    if(latestHand) {
        data.push({
            points: latestHand,
            label: label
        })
    }
}

//Create the pose detector
const createHandLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2
    });
    console.log("model loaded, you can start webcam")
    //Add the button events
    enableWebcamButton.addEventListener("click", (e) => enableCam(e))

    const poses = ["hand", "fist", "down", "up"]
    poses.forEach(pose => {
        const singlepose = document.getElementById(pose);
        if (singlepose){
            singlepose.addEventListener("click", () => {storeData(pose)});
        }
    })
    logButton.addEventListener("click", () => {json.value = JSON.stringify(data)});
}

//Start the webcam
async function enableCam() {
    webcamRunning = true;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = stream;
        video.addEventListener("loadeddata", () => {
            canvasElement.style.width = video.videoWidth;
            canvasElement.style.height = video.videoHeight;
            canvasElement.width = video.videoWidth;
            canvasElement.height = video.videoHeight;
            document.querySelector(".videoView").style.height = video.videoHeight + "px";
            predictWebcam();
        });
    } catch (error) {
        console.error("Error accessing webcam:", error);
    }
}

let latestHand = null;

//Start the predictions
async function predictWebcam() {
    results = await handLandmarker.detectForVideo(video, performance.now())
    let hand = results.landmarks[0]

    if(hand) {
        // let indexfinger = hand[8]
        // image.style.transform = `translate(${video.videoWidth - indexfinger.x * video.videoWidth}px, ${indexfinger.y * video.videoHeight}px)`
        latestHand = hand.flatMap(landmark => [landmark.x, landmark.y, landmark.z]);
    }


    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    for(let hand of results.landmarks){
        drawUtils.drawConnectors(hand, HandLandmarker.HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 5 });
        drawUtils.drawLandmarks(hand, { radius: 4, color: "#FF0000", lineWidth: 2 });
    }

    if (webcamRunning) {
        window.requestAnimationFrame(predictWebcam)
    }

}


//Start the app
if (navigator.mediaDevices?.getUserMedia) {
    createHandLandmarker()

}



