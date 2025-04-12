import { HandLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18";
import kNear from "./knear.js"

const enableWebcamButton = document.getElementById("webcamButton")
const k = 3
let knn = null;
const video = document.getElementById("webcam")
const canvasElement = document.getElementById("output_canvas")
const canvasCtx = canvasElement.getContext("2d")
const drawUtils = new DrawingUtils(canvasCtx)
let handLandmarker = undefined;
let webcamRunning = false;
let results = undefined;

let trainingData = [];
let latestHand = null;

let songPaused = true;
let song = document.getElementById('song');

let nn = null;
let nnModelLoaded = false;
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
    enableWebcamButton.addEventListener("click", (e) => enableCam(e))
}

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

async function predictWebcam() {
    results = await handLandmarker.detectForVideo(video, performance.now());

    if (!results.landmarks || results.landmarks.length === 0) {
        document.getElementById("nnprediction").innerText = "No hand detected";
    } else{
        let hand = results.landmarks[0];
        if (hand) {
            latestHand = hand.flatMap(landmark => [landmark.x, landmark.y, landmark.z]);
        }
    }

    if (!nnModelLoaded) {
        loadNNModel();
    }

    if(knn && latestHand){
        const knnprediction = knn.classify(latestHand);
        console.log("KNN prediction:", knnprediction)
    }

    if (nnModelLoaded && nn && latestHand) {
        nn.classify(latestHand, (results) => {
            console.log("NN prediction:", results[0].label)
            if (results && results.length) {
                document.getElementById("nnprediction").innerText = `You are posing: ${results[0].label}`;
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
            }
        });
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

function fetchTrainingData(){
    fetch("data.json")
        .then(response => response.json())
        .then(json => {
            trainingData = json;
            trainKNN(trainingData);
        })
        .catch(error => console.error("Error loading data_collection data:", error))
}

function trainKNN(data){
    knn = new kNear(k);
    for(const {points, label} of data) {
        knn.learn(points, label)
    }
    console.log("KNN training done with loaded JSON data")
}

function loadNNModel(){
    ml5.setBackend("webgl");
    nn = ml5.neuralNetwork({ task: 'classification', debug: true });

    const modelDetails = {
        model: 'model/model.json',
        metadata: 'model/model_meta.json',
        weights: 'model/model.weights.bin'
    };

    nn.load(modelDetails, () => {
        nnModelLoaded = true;
    });
}

if (navigator.mediaDevices?.getUserMedia) {
    createHandLandmarker()
    fetchTrainingData()
}
