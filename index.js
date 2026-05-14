const timeDisplay = document.querySelector("#timeDisplay");
const startBtn = document.querySelector("#startBtn");
const delayedStartBtn = document.querySelector("#delayedStartBtn");
const stopResumeBtn = document.querySelector("#stopResumeBtn"); // Combined Button
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

// Update your main logic to call these functions:
// 1. Modified updateUI function:
function updateUI(state) {
    if (state === "running") {
        isRunning = true;
        stopResumeBtn.innerText = "Stop";
        stopResumeBtn.style.backgroundColor = "red";
        startBtn.disabled = true;
        delayedStartBtn.disabled = true;
        requestWakeLock(); // <-- ACTIVATE WAKE LOCK
    } else if (state === "stopped") {
        isRunning = false;
        stopResumeBtn.innerText = "Resume";
        stopResumeBtn.style.backgroundColor = "green";
        releaseWakeLock(); // <-- DEACTIVATE WAKE LOCK
    } else {
        isRunning = false;
        stopResumeBtn.innerText = "Stop";
        stopResumeBtn.style.backgroundColor = "#666";
        startBtn.disabled = false;
        delayedStartBtn.disabled = false;
        releaseWakeLock(); // <-- DEACTIVATE WAKE LOCK (on reset)
    }
}

function startTimer() {
    updateUI("running");
    startTime = Date.now() - elapsedTime;
    intervalId = setInterval(updateTime, 10);
}

// --- Event Listeners ---
// 1. Instant Start
startBtn.addEventListener("click", () => {
    clearAllIntervals();
    elapsedTime = 0;

    // 1. Resume audio context for mobile browsers
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    // 2. Play the high-pitch "Start" beep (880Hz)
    playBeep(880, 0.3);

    // 3. Kick off the timer
    startTimer();
});

// 2. Delayed Start
delayedStartBtn.addEventListener("click", () => {
    clearAllIntervals();
    elapsedTime = 0;
    startBtn.disabled = true;
    delayedStartBtn.disabled = true;

    let count = 5;
    timeDisplay.textContent = `READY: ${count}`;

    countdownId = setInterval(() => {
        count--;
        if (count > 0) {
            timeDisplay.textContent = `READY: ${count}`;
            // Beep on 2 and 1
            if (count <= 2) playBeep(440, 0.1);
        } else {
            clearInterval(countdownId);
            timeDisplay.style.fontSize = "";
            playBeep(880, 0.3); // Higher, longer beep for START
            startTimer();
        }
    }, 1000);
});

// 3. The Combined Stop/Resume Button
stopResumeBtn.addEventListener("click", () => {
    if (isRunning) {
        // Stop logic
        clearAllIntervals();
        updateUI("stopped");
    } else {
        // Resume logic (only if there's time on the clock)
        if (elapsedTime > 0) {
            startTimer();
        }
    }
});

// 4. Reset
resetBtn.addEventListener("click", () => {
    clearAllIntervals();
    elapsedTime = 0;
    lastBeepSecond = -1
    timeDisplay.textContent = "00:00";
    document.body.style.backgroundColor = "#FFF9C4"; // Soft Yellow (Reset/Ready)
    updateUI("reset");
});

function updateTime() {
    elapsedTime = Date.now() - startTime;

    let totalSeconds = Math.floor(elapsedTime / 1000);
    let s = totalSeconds % 60;
    let m = Math.floor((elapsedTime / (1000 * 60)) % 60);

    // --- BEEP LOGIC ---
    // Only check for a beep if we have moved to a brand new second
    if (totalSeconds !== lastBeepSecond) {

        // Warning beeps: 28, 29 | 58, 59 | 88, 89
        if (totalSeconds === 28 || totalSeconds === 29 ||
            totalSeconds === 58 || totalSeconds === 59 ||
            totalSeconds === 88 || totalSeconds === 89) {
            playBeep(440, 0.1); // Lower "warning" beep
            }

            // Milestone beeps: 30, 60, 90
            else if (totalSeconds === 30 || totalSeconds === 60 || totalSeconds === 90) {
                playBeep(880, 0.3); // Higher "success" beep
            }

            lastBeepSecond = totalSeconds; // Update our memory
    }

    // --- BACKGROUND COLOR LOGIC ---
    if (totalSeconds < 0) { // Changed <= 0 to < 1 for smoother start
        document.body.style.backgroundColor = "#FFF9C4";
    } else if (totalSeconds < 30) {
        document.body.style.backgroundColor = "#add8e6";
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
// --- WAKE LOCK API (Keep screen on) ---
let wakeLock = null;

const requestWakeLock = async () => {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            // Console log is helpful for debugging on a computer
            console.log("Wake Lock is active (screen will stay bright).");

            // Listen for when the phone handles the lock automatically (like minimizing)
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
