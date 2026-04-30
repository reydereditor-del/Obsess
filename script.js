const API_URL = "http://localhost:8080/api";

let day = null;

const backendStatus = document.getElementById("backendStatus");
const statusDot = document.getElementById("statusDot");
const todayDate = document.getElementById("todayDate");
const openedDateBadge = document.getElementById("openedDateBadge");

const dayStatus = document.getElementById("dayStatus");
const dayMessage = document.getElementById("dayMessage");
const modeMessage = document.getElementById("modeMessage");

const modeTitle = document.getElementById("modeTitle");
const switchModeBtn = document.getElementById("switchModeBtn");
const quickStartBtn = document.getElementById("quickStartBtn");
const loadTodayBtn = document.getElementById("loadTodayBtn");

const progressCircle = document.getElementById("progressCircle");
const progressPercent = document.getElementById("progressPercent");
const todayXpElement = document.getElementById("todayXp");
const levelElement = document.getElementById("level");
const focusScoreElement = document.getElementById("focusScore");
const taskSummary = document.getElementById("taskSummary");
const streakElement = document.getElementById("streak");    

const tasksContainer = document.getElementById("tasksContainer");
const evidenceText = document.getElementById("evidenceText");
const saveEvidenceBtn = document.getElementById("saveEvidenceBtn");
const saveStatus = document.getElementById("saveStatus");

const rescueBtn = document.getElementById("rescueBtn");
const rescueBox = document.getElementById("rescueBox");

const datePicker = document.getElementById("datePicker");
const loadDateBtn = document.getElementById("loadDateBtn");
const refreshHistoryBtn = document.getElementById("refreshHistoryBtn");
const historyContainer = document.getElementById("historyContainer");

const weeklyXp = document.getElementById("weeklyXp");
const weeklyMessage = document.getElementById("weeklyMessage");
const weeklySavedDays = document.getElementById("weeklySavedDays");
const weeklyIdealDays = document.getElementById("weeklyIdealDays");
const weeklyAverageFocus = document.getElementById("weeklyAverageFocus");

async function requestJson(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return await response.json();
}

async function loadToday() {
    try {
        day = await requestJson(`${API_URL}/progress/today`);
        setBackendOnline();
        render();
        await loadHistory();
        await loadWeeklyStats();
    } catch (error) {
        setBackendOffline(error);
    }
}

async function loadByDate(date) {
    if (!date) {
        alert("Sana tanla.");
        return;
    }

    try {
        day = await requestJson(`${API_URL}/progress/date/${date}`);
        setBackendOnline();
        render();
        await loadHistory();
        await loadWeeklyStats();
    } catch (error) {
        setBackendOffline(error);
    }
}

async function loadHistory() {
    try {
        const history = await requestJson(`${API_URL}/progress/history`);
        renderHistory(history);
    } catch (error) {
        console.error("History error:", error);
    }
}

async function loadWeeklyStats() {
    try {
        const stats = await requestJson(`${API_URL}/progress/stats/weekly`);

        if (!weeklyXp) return;

        weeklyXp.textContent = `${stats.weeklyXp} XP`;
        weeklySavedDays.textContent = `${stats.savedDays}/${stats.totalDays}`;
        weeklyIdealDays.textContent = stats.idealDays;
        weeklyAverageFocus.textContent = stats.averageFocus;

        if (stats.savedDays === 0) {
            weeklyMessage.textContent = "Bu hafta hali boshlanmagan. Bugun bitta mini-vazifa qil.";
        } else if (stats.idealDays >= 3) {
            weeklyMessage.textContent = "Hafta kuchli ketmoqda. Ideal kunlar soni yaxshi.";
        } else if (stats.savedDays >= 3) {
            weeklyMessage.textContent = "Hafta saqlanyapti. Endi ideal kunlar sonini oshiramiz.";
        } else {
            weeklyMessage.textContent = "Boshlanish bor. Muhimi uzilmaslik.";
        }
    } catch (error) {
        console.error("Weekly stats error:", error);

        if (weeklyMessage) {
            weeklyMessage.textContent = "Weekly stats yuklanmadi.";
        }
    }
}

function setBackendOnline() {
    backendStatus.textContent = "Backend: online";
    statusDot.className = "status-dot online";
}

function setBackendOffline(error) {
    backendStatus.textContent = "Backend: offline";
    statusDot.className = "status-dot offline";
    console.error("Backend error:", error);
}

function calculateTodayXp() {
    if (!day || !day.tasks) return 0;

    return day.tasks.reduce((sum, task) => {
        if (!task.done) return sum;
        return sum + (day.mode === "LOW" ? task.lowXp : task.normalXp);
    }, 0);
}

function formatDate(dateText) {
    if (!dateText) return "Bugun";

    const date = new Date(dateText);
    if (Number.isNaN(date.getTime())) return dateText;

    return date.toLocaleDateString("uz-UZ", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}

function getDayEvaluation(completedTasks, totalTasks, evidence) {
    if (completedTasks === totalTasks && evidence && evidence.trim().length > 0) {
        return {
            status: "Ideal kun",
            message: "Barcha vazifalar bajarildi va dalil yozildi. Bu real progress."
        };
    }

    if (completedTasks >= 1) {
        return {
            status: "Kun saqlandi",
            message: "Kamida bitta vazifa bajarildi. Nol kun emas."
        };
    }

    return {
        status: "Hali boshlanmadi",
        message: "Bitta mini-vazifa ham kunni saqlaydi. Java’dan 10 minut yetadi."
    };
}

function render() {
    if (!day || !Array.isArray(day.tasks)) return;

    const completedTasks = day.tasks.filter(task => task.done).length;
    const totalTasks = day.tasks.length;
    const percent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    const degrees = Math.round((percent / 100) * 360);
    const todayXp = calculateTodayXp();
    const evaluation = getDayEvaluation(completedTasks, totalTasks, day.evidence);

    todayDate.textContent = formatDate(day.progressDate);
    datePicker.value = day.progressDate;

    const todayIso = new Date().toISOString().slice(0, 10);
    openedDateBadge.textContent = day.progressDate === todayIso ? "Today" : "History";

    dayStatus.textContent = evaluation.status;
    dayMessage.textContent = evaluation.message;

    modeTitle.textContent = day.mode === "LOW" ? "Low Energy Mode" : "Normal Mode";
    modeMessage.textContent = day.mode === "LOW"
        ? "Bugun minimal rejim. Muhimi — uzilmaslik."
        : "Bugun normal rejim. Asosiy vazifalarni yopish vaqti.";

    progressPercent.textContent = `${percent}%`;
    todayXpElement.textContent = `+${todayXp}`;
    levelElement.textContent = day.level ?? 1;
    focusScoreElement.textContent = day.focusScore ?? 72;
    streakElement.textContent = day.streak ?? 0;
    taskSummary.textContent = `${completedTasks}/${totalTasks} bajarildi`;
    evidenceText.value = day.evidence || "";

    progressCircle.style.background = `
        radial-gradient(circle, #0d1326 56%, transparent 58%),
        conic-gradient(#5b8cff 0deg, #46d9ff ${degrees}deg, rgba(255, 255, 255, 0.08) ${degrees}deg)
    `;

    renderTasks();
}

function renderTasks() {
    tasksContainer.innerHTML = "";

    day.tasks.forEach(task => {
        const minutes = day.mode === "LOW" ? task.lowMinutes : task.normalMinutes;
        const xp = day.mode === "LOW" ? task.lowXp : task.normalXp;

        const card = document.createElement("article");
        card.className = `task-card ${task.done ? "done" : ""}`;

        card.innerHTML = `
            <div>
                <div class="task-head">
                    <div>
                        <p class="label">${minutes} min · +${xp} XP</p>
                        <h3>${escapeHtml(task.title)}</h3>
                    </div>
                    <span class="task-badge ${task.done ? "done" : "pending"}">
                        ${task.done ? "DONE" : "PENDING"}
                    </span>
                </div>
                <p>${escapeHtml(task.subtitle)}</p>
            </div>
            <button type="button">${task.done ? "Bekor qilish" : "Start / Done"}</button>
        `;

        card.querySelector("button").addEventListener("click", () => completeTask(task.taskKey));
        tasksContainer.appendChild(card);
    });
}

function renderHistory(history) {
    historyContainer.innerHTML = "";

    if (!history || history.length === 0) {
        historyContainer.innerHTML = `<p class="muted">Hali history yo‘q.</p>`;
        return;
    }

    history.forEach(item => {
        const doneCount = Array.isArray(item.tasks)
            ? item.tasks.filter(task => task.done).length
            : 0;

        const totalCount = Array.isArray(item.tasks)
            ? item.tasks.length
            : 0;

        const div = document.createElement("div");
        div.className = `history-item ${day && item.progressDate === day.progressDate ? "active" : ""}`;

        div.innerHTML = `
            <div>
                <h3>${formatDate(item.progressDate)}</h3>
                <div class="history-meta">
                    <span>${item.mode}</span>
                    <span>${item.totalXp} XP</span>
                    <span>Focus ${item.focusScore}</span>
                    <span>${doneCount}/${totalCount} done</span>
                    <span>${item.evidence ? "Dalil bor" : "Dalil yo‘q"}</span>
                </div>
            </div>

            <div class="history-actions">
                <button class="secondary" type="button">Ochish</button>
            </div>
        `;

        div.querySelector("button").addEventListener("click", () => loadByDate(item.progressDate));
        historyContainer.appendChild(div);
    });
}

async function switchMode() {
    if (!day) return;

    const nextMode = day.mode === "LOW" ? "NORMAL" : "LOW";
    const date = day.progressDate;

    try {
        day = await requestJson(`${API_URL}/progress/date/${date}/mode`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ mode: nextMode })
        });

        render();
        await loadHistory();
        await loadWeeklyStats();
    } catch (error) {
        console.error("Mode error:", error);
        alert("Mode o‘zgarmadi. Backendni tekshir.");
    }
}

async function completeTask(taskKey) {
    if (!day) return;

    const date = day.progressDate;

    try {
        day = await requestJson(`${API_URL}/progress/date/${date}/tasks/${taskKey}/complete`, {
            method: "POST"
        });

        render();
        await loadHistory();
        await loadWeeklyStats();
    } catch (error) {
        console.error("Task error:", error);
        alert("Task saqlanmadi. Backendni tekshir.");
    }
}

async function saveEvidence() {
    if (!day) return;

    const date = day.progressDate;

    try {
        saveStatus.textContent = "Saqlanmoqda...";

        day = await requestJson(`${API_URL}/progress/date/${date}/evidence`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ evidence: evidenceText.value })
        });

        render();
        await loadHistory();
        await loadWeeklyStats();

        saveStatus.textContent = "Saqlandi ✓";

        setTimeout(() => {
            saveStatus.textContent = "";
        }, 1500);
    } catch (error) {
        console.error("Evidence error:", error);
        saveStatus.textContent = "Xato";
        alert("Dalil saqlanmadi. Backendni tekshir.");
    }
}

function quickStart() {
    const firstNotDone = day?.tasks?.find(task => !task.done);

    if (!firstNotDone) {
        alert("Bu sanadagi barcha vazifalar bajarilgan. Endi dalil yoz.");
        return;
    }

    alert(`Hozirgi vazifa: ${firstNotDone.title}. Faqat boshlash kifoya.`);
}

function toggleRescue() {
    rescueBox.classList.toggle("hidden");
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

switchModeBtn.addEventListener("click", switchMode);
quickStartBtn.addEventListener("click", quickStart);
saveEvidenceBtn.addEventListener("click", saveEvidence);
rescueBtn.addEventListener("click", toggleRescue);

loadTodayBtn.addEventListener("click", loadToday);
loadDateBtn.addEventListener("click", () => loadByDate(datePicker.value));
refreshHistoryBtn.addEventListener("click", async () => {
    await loadHistory();
    await loadWeeklyStats();
});

loadToday();