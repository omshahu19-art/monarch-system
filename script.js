const STORAGE_KEY = "monarchSystem_v1";

const defaultState = {
  playerName: "PLAYER",
  totalXP: 0,
  habits: [
    { id: "wake", name: "Wake up on time", xp: 10 },
    { id: "gym", name: "Gym workout", xp: 30 },
    { id: "study", name: "Study Java / DSA", xp: 30 },
    { id: "reading", name: "Read 10 pages", xp: 10 },
    { id: "meditation", name: "Meditation", xp: 20 }
  ],
  completions: {}
};

let state = loadState();
const today = localDateKey(new Date());

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.habits) && saved.completions) {
      return { ...defaultState, ...saved };
    }
  } catch (error) {
    console.warn("Saved player data could not be read. Starting fresh.", error);
  }
  return structuredClone(defaultState);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function completedToday() {
  return state.completions[today] || [];
}

function currentLevel() {
  return Math.floor(state.totalXP / 100) + 1;
}

function xpIntoLevel() {
  return state.totalXP % 100;
}

function calculateStreak() {
  let streak = 0;
  const cursor = new Date();
  // A streak is based on completing at least one quest each day.
  while (true) {
    const key = localDateKey(cursor);
    if ((state.completions[key] || []).length === 0) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function render() {
  const done = completedToday();
  const total = state.habits.length;
  const count = state.habits.filter(habit => done.includes(habit.id)).length;
  const percent = total ? Math.round((count / total) * 100) : 0;

  document.getElementById("playerName").textContent = state.playerName;
  document.getElementById("levelValue").textContent = currentLevel();
  document.getElementById("totalXp").textContent = state.totalXP;
  document.getElementById("streakValue").textContent = calculateStreak();
  document.getElementById("xpLabel").textContent = `${xpIntoLevel()} / 100 XP`;
  document.getElementById("xpFill").style.width = `${xpIntoLevel()}%`;
  document.getElementById("xpHint").textContent =
    `${100 - xpIntoLevel()} XP required to reach level ${currentLevel() + 1}.`;
  document.getElementById("completedCount").textContent = `${count}/${total}`;
  document.getElementById("progressPercent").textContent = `${percent}%`;
  document.getElementById("dailyProgressFill").style.width = `${percent}%`;
  document.getElementById("todayDate").textContent =
    new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" }).format(new Date());

  const list = document.getElementById("questList");
  list.replaceChildren();

  if (total === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No quests yet. Add your first daily mission.";
    list.appendChild(empty);
  }

  state.habits.forEach(habit => {
    const isDone = done.includes(habit.id);
    const row = document.createElement("div");
    row.className = `quest-item${isDone ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "quest-check";
    checkbox.checked = isDone;
    checkbox.setAttribute("aria-label", `Complete ${habit.name}`);
    checkbox.addEventListener("change", () => toggleQuest(habit.id));

    const name = document.createElement("span");
    name.className = "quest-name";
    name.textContent = habit.name;

    const xp = document.createElement("span");
    xp.className = "quest-xp";
    xp.textContent = `+${habit.xp} XP`;

    const remove = document.createElement("button");
    remove.className = "delete-quest";
    remove.type = "button";
    remove.title = "Delete quest";
    remove.setAttribute("aria-label", `Delete ${habit.name}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => deleteQuest(habit.id));

    row.append(checkbox, name, xp, remove);
    list.appendChild(row);
  });

  const message = percent === 100 && total > 0
    ? "DAILY QUESTS CLEARED. EXCELLENT WORK, PLAYER."
    : count > 0
      ? "Progress detected. Continue completing your quests."
      : "Your journey begins now. Accept your first quest.";
  document.getElementById("systemMessage").textContent = message;
}

function toggleQuest(id) {
  const habit = state.habits.find(item => item.id === id);
  if (!habit) return;
  const done = completedToday();
  const wasDone = done.includes(id);

  if (wasDone) {
    state.completions[today] = done.filter(item => item !== id);
    state.totalXP = Math.max(0, state.totalXP - habit.xp);
  } else {
    state.completions[today] = [...done, id];
    const oldLevel = currentLevel();
    state.totalXP += habit.xp;
    if (currentLevel() > oldLevel) {
      setTimeout(() => alert(`LEVEL UP! You are now Level ${currentLevel()}. Keep growing, Player.`), 50);
    }
  }
  saveState();
  render();
}

function addQuest(name, xp) {
  state.habits.push({
    id: `quest-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    xp
  });
  saveState();
  render();
}

function deleteQuest(id) {
  const habit = state.habits.find(item => item.id === id);
  if (!habit) return;
  if (!confirm(`Delete "${habit.name}" from your quest list? Past XP will remain earned.`)) return;
  state.habits = state.habits.filter(item => item.id !== id);
  saveState();
  render();
}

document.getElementById("addQuestBtn").addEventListener("click", () => {
  document.getElementById("questName").value = "";
  document.getElementById("questXp").value = "20";
  document.getElementById("questDialog").showModal();
  document.getElementById("questName").focus();
});

document.getElementById("questForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = document.getElementById("questName").value.trim();
  const xp = Number(document.getElementById("questXp").value);
  if (!name) return;
  addQuest(name, xp);
  document.getElementById("questDialog").close();
});

document.getElementById("editNameBtn").addEventListener("click", () => {
  const name = prompt("Enter your Player name:", state.playerName);
  if (name && name.trim()) {
    state.playerName = name.trim().slice(0, 24).toUpperCase();
    saveState();
    render();
  }
});

render();
