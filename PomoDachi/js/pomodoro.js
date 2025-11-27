if (!document.getElementById("timer")) return; // solo correr en pomodoro.html

// -------------------- ELEMENTOS ---------------------
const inputsBox = document.getElementById("inputsBox");
const timerEl = document.getElementById("timer");
const modeEl = document.getElementById("mode");

const inputs = ["workTime", "breakTime", "longBreakTime", "cycles"].reduce((acc, id) => {
    acc[id] = document.getElementById(id);
    return acc;
}, {});

// -------------------- ESTADO ---------------------
let interval = null;
let isWork = true;
let cyclesCompleted = 0;
let locked = false;

const getValues = () => ({
    work: +inputs.workTime.value || 1,
    break: +inputs.breakTime.value || 1,
    longBreak: +inputs.longBreakTime.value || 1,
    cycles: +inputs.cycles.value || 1
});

let timeLeft = getValues().work * 60;

// -------------------- UTILIDADES ---------------------
if ("Notification" in window) Notification.requestPermission().catch(() => { });

const notify = msg => {
    if (Notification.permission === "granted") new Notification(msg);
};

const format = sec =>
    `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

const updateUI = () => {
    const { cycles } = getValues();
    timerEl.textContent = format(timeLeft);
    const isLong = cyclesCompleted >= cycles && !isWork;
    modeEl.textContent = isLong ? "Descanso largo" :
        isWork ? "Modo: Trabajo" :
            "Modo: Descanso";
};

// -------------------- FUNCIONES ---------------------
const toggleInputs = show => inputsBox.classList.toggle("hidden", !show);

const switchPhase = () => {
    const v = getValues();

    if (isWork) cyclesCompleted++;

    if (cyclesCompleted >= v.cycles) {
        // Descanso largo
        isWork = false;
        timeLeft = v.longBreak * 60;
        notify("¡Descanso largo!");
        updateUI();
        return;
    }

    isWork = !isWork;
    timeLeft = (isWork ? v.work : v.break) * 60;
    notify(isWork ? "Nuevo ciclo de trabajo" : "Tiempo de descanso");
    updateUI();
};

const endSession = () => {
    clearInterval(interval);
    interval = null;
    notify("¡Ciclo Pomodoro completado!");
    modeEl.textContent = "Ciclo finalizado ?";
    locked = false;
    toggleInputs(true);
    Object.values(inputs).forEach(i => i.disabled = false);
};

// -------------------- TIMER ---------------------
const startTimer = () => {
    if (interval) return;
    if (!locked) {
        locked = true;
        Object.values(inputs).forEach(i => i.disabled = true);
    }
    toggleInputs(false);

    interval = setInterval(() => {
        const v = getValues();
        const isLongBreak = cyclesCompleted >= v.cycles && !isWork;

        if (--timeLeft <= 0) {
            clearInterval(interval);
            interval = null;

            if (isLongBreak) return endSession();

            switchPhase();
            startTimer();
        }
        updateUI();
    }, 1000);
};

const pauseTimer = () => {
    clearInterval(interval);
    interval = null;
    toggleInputs(true);
};

// -------------------- EVENTOS ---------------------
Object.values(inputs).forEach(i => i.addEventListener("input", () => {
    if (!locked && !interval) {
        const v = getValues();
        timeLeft = isWork ? v.work * 60 :
            cyclesCompleted >= v.cycles ? v.longBreak * 60 :
                v.break * 60;
        updateUI();
    }
}));

document.getElementById("startBtn").onclick = startTimer;
document.getElementById("pauseBtn").onclick = pauseTimer;

updateUI();
