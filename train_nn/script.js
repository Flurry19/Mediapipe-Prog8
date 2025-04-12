ml5.setBackend("webgl");
const nn = ml5.neuralNetwork({ task: 'classification', debug: true, layers:[
        {
            type: "dense",
            units: 32,
            activation: "relu"
        },
        {
            type: "dense",
            units: 32,
            activation: "relu"
        },
        {
            type: "dense",
            activation: "softmax"
        },
    ] });

let trainData = [];
let testData = [];
let data = null;

const trainButton = document.getElementById("trainButton");
const testButton = document.getElementById("testButton");

async function loadData(){
    const result = await fetch("data.json");
    data = await result.json();
    trainButton.addEventListener("click", () => {train()});
    testButton.addEventListener("click", () => {test()});
}

function train(){
    data.sort(() => (Math.random() - 0.5));

    //80% trainingsdata, 20% testdata
    trainData = data.slice(0, Math.floor(data.length*0.8));
    testData = data.slice(Math.floor(data.length*0.8) +1 );

    for (const {points, label} of data){
        nn.addData(points, {label: label})
    }

    nn.normalizeData();
    nn.train({epochs:30}, () => finishedTraining());
}

async function test(){
    let correct = 0;
    for (const {points, label} of testData){
        const prediction = await nn.classify(points)

        if (prediction[0].label === label){
            correct++;
        }
    }
    console.log(correct/testData.length)
}

async function finishedTraining(){
    console.log("Finished training!");
    nn.save("model", () => console.log("model was saved!"))
}

if (navigator.mediaDevices?.getUserMedia) {
   loadData();
}
