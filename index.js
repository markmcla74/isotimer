if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('Service Worker registered!'))
        .catch(err => console.log('Service Worker failed:', err));
    });
}

const timeDisplay = document.querySelector("#timeDisplay");
const startBtn = document.querySelector("#startBtn");
const delayBtns = document.querySelectorAll(".delayBtn");
const stopResumeBtn = document.querySelector("#stopResumeBtn");
const resetBtn = document.querySelector("#resetBtn");

let startTime = 0;
let elapsedTime = 0;
let intervalId;
let countdownId;
let isRunning = false;
let lastBeepSecond = -1;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep(frequency = 440, duration = 0.1) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

// --- Helper Functions ---

function clearAllIntervals() {
    clearInterval(intervalId);
    clearInterval(countdownId);
}

function setDelayButtonsDisabled(isDisabled) {
    delayBtns.forEach(btn => btn.disabled = isDisabled);
}

function updateUI(state) {
    if (state === "running") {
        isRunning = true;
        stopResumeBtn.innerText = "Stop";
        stopResumeBtn.style.backgroundColor = "red";
        startBtn.disabled = true;
        setDelayButtonsDisabled(false);
        requestWakeLock();
    } else if (state === "stopped") {
        isRunning = false;
        stopResumeBtn.innerText = "Resume";
        stopResumeBtn.style.backgroundColor = "green";
        setDelayButtonsDisabled(false);
        releaseWakeLock();
    } else if (state === "countdown") {
        isRunning = false;
        stopResumeBtn.innerText = "Stop";
        stopResumeBtn.style.backgroundColor = "#666";
        startBtn.disabled = true;
        setDelayButtonsDisabled(false);
        requestWakeLock();
    } else {
        // Reset state
        isRunning = false;
        stopResumeBtn.innerText = "Stop";
        stopResumeBtn.style.backgroundColor = "#666";
        startBtn.disabled = false;
        setDelayButtonsDisabled(false);
        releaseWakeLock();
    }
}

function startTimer() {
    updateUI("running");
    startTime = Date.now() - elapsedTime;
    intervalId = setInterval(updateTime, 10);
}

function triggerDelay(seconds) {
    clearAllIntervals();

    elapsedTime = 0;
    lastBeepSecond = -1;

    // Force background back to Soft Blue for the countdown phase
    document.body.style.backgroundColor = "#add8e6";

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    updateUI("countdown");

    let count = seconds;
    timeDisplay.textContent = `READY: ${count}`;

    countdownId = setInterval(() => {
        count--;
        if (count > 0) {
            timeDisplay.textContent = `READY: ${count}`;
            if (count <= 2) playBeep(440, 0.1);
        } else {
            clearInterval(countdownId);
            timeDisplay.style.fontSize = "";
            playBeep(880, 0.3);
            startTimer(); // The timer kicks off here and switches the color to yellow (0-30s)
        }
    }, 1000);
}

// --- Event Listeners ---

startBtn.addEventListener("click", () => {
    clearAllIntervals();
    elapsedTime = 0;
    lastBeepSecond = -1;

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    playBeep(880, 0.3);
    startTimer();
});

delayBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const delaySeconds = parseInt(btn.getAttribute("data-delay"), 10);
        triggerDelay(delaySeconds);
    });
});

stopResumeBtn.addEventListener("click", () => {
    if (isRunning) {
        clearAllIntervals();
        updateUI("stopped");
    } else {
        if (elapsedTime > 0) {
            startTimer();
        }
    }
});

resetBtn.addEventListener("click", () => {
    clearAllIntervals();
    elapsedTime = 0;
    lastBeepSecond = -1;
    timeDisplay.textContent = "00:00";
    document.body.style.backgroundColor = "#add8e6"; // Soft Blue (Reset/Ready)
updateUI("reset");
});

function updateTime() {
    elapsedTime = Date.now() - startTime;

    let totalSeconds = Math.floor(elapsedTime / 1000);
    let s = totalSeconds % 60;
    let m = Math.floor((elapsedTime / (1000 * 60)) % 60);

    if (totalSeconds !== lastBeepSecond) {
        if (totalSeconds === 28 || totalSeconds === 29 ||
            totalSeconds === 58 || totalSeconds === 59 ||
            totalSeconds === 88 || totalSeconds === 89) {
            playBeep(440, 0.1);
            } else if (totalSeconds === 30 || totalSeconds === 60 || totalSeconds === 90) {
                playBeep(880, 0.3);
            }
            lastBeepSecond = totalSeconds;
    }

    // --- BACKGROUND COLOR LOGIC ---
    if (totalSeconds < 0) {
        document.body.style.backgroundColor = "#add8e6"; // Soft Blue before timing starts
    } else if (totalSeconds < 30) {
        document.body.style.backgroundColor = "#FFF9C4"; // Soft Yellow for 0-30s
    } else if (totalSeconds < 60) {
        document.body.style.backgroundColor = "#FFB74D";
    } else if (totalSeconds < 90) {
        document.body.style.backgroundColor = "#EF5350";
    } else {
        document.body.style.backgroundColor = "#66BB6A";
    }

    timeDisplay.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function pad(unit) {
    return unit.toString().padStart(2, "0");
}

// --- Wake Lock API ---
let wakeLock = null;

const requestWakeLock = async () => {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => {
                console.log("Wake Lock released.");
            });
        }
    } catch (err) {
        console.error(`${err.name}, ${err.message}`);
    }
};

const releaseWakeLock = () => {
    if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
    }
};
