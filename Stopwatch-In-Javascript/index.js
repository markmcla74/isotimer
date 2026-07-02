const timeDisplay = document.querySelector("#timeDisplay");
const startBtn = document.querySelector("#startBtn");
const stopBtn = document.querySelector("#stopBtn");
const resetBtn = document.querySelector("#resetBtn");

let startTime = 0;
let elapsedTime = 0;
let isStopped = 1;
let isReset = 1;
let intervalId;
let hrs = 0;
let mins = 0;
let secs = 0;
let centisecs = 0;

startBtn.addEventListener("click", () => {
    let case1State = 0;
    let case2State = 0;

    if (isStopped === 1){
    //button is clicked. Present state is: Timer is stopped. (need to start or resume timing. change button text to 'stop')
    case1State = 1;
    }
    
    if (isStopped === 0){
    //button is clicked. Present state is: Timer is running. Timer is not reset. (need to stop timing. change button text to 'resume')
    case2State = 1;
    }

    if (case1State === 1){
        isStopped = 0;
        isReset = 0;
        startBtn.innerText = "Stop";
        startBtn.style.backgroundColor = "red";
        startTime = Date.now() - elapsedTime;
        intervalId = setInterval(updateTime, 10);
    }

    if (case2State === 1){
        isStopped = 1;
        startBtn.innerText = "Resume";
        startBtn.style.backgroundColor = "#0000FF";
        clearInterval(intervalId);
    }
});

resetBtn.addEventListener("click", () => {
    isStopped = 1;
    isReset = 1;
    clearInterval(intervalId);
    startTime = 0;
    elapsedTime = 0;
    hrs = 0;
    mins = 0;
    secs = 0;
    timeDisplay.textContent = "00:00:00";
    startBtn.innerText = "Start";
    startBtn.style.backgroundColor = "#0000FF";
});

function updateTime(){
    elapsedTime = Date.now() - startTime;
    centisecs = Math.floor((elapsedTime / 10) % 100);
    secs = Math.floor((elapsedTime / 1000) % 60);
    mins = Math.floor((elapsedTime / (1000 * 60)) % 60);
    hrs = Math.floor((elapsedTime / (1000 * 60 * 60)) % 60);

    centisecs = pad(centisecs);
    secs = pad(secs);
    mins = pad(mins);
    hrs = pad(hrs);

    //timeDisplay.textContent = `${hrs}:${mins}:${secs}`;
    timeDisplay.textContent = `${mins}:${secs}:${centisecs}`;

    function pad(unit){
        return (("0") + unit).length > 2 ? unit : "0" + unit;
    }
}

