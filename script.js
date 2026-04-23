let currentRef = "";
let currentVerse = "";

const verseEl = document.getElementById("verse");
const refEl = document.getElementById("ref");
const translationEl = document.getElementById("translation");
const themeBtn = document.getElementById("themeBtn");


// 🌤️ TIME-BASED THEME + ANIMATED BACKGROUND
function setThemeByTime() {
  const hour = new Date().getHours();

  let theme = "day";

  if (hour >= 5 && hour < 12) {
    theme = "morning";
  } else if (hour >= 12 && hour < 18) {
    theme = "day";
  } else {
    theme = "night";
  }

  document.documentElement.dataset.time = theme;

  const bg = document.getElementById("bg");
  bg.classList.remove("morning", "day", "night");
  bg.classList.add(theme);

  themeBtn.textContent = theme === "night" ? "Day Mode" : "Night Mode";
}


// 🔁 PRIMARY API
async function fetchFromPrimary(ref, version) {
  const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=${version}`;
  const res = await fetch(url);

  if (!res.ok) throw new Error("Primary API failed");

  const data = await res.json();
  if (!data.text) throw new Error("Empty primary response");

  return data.text;
}


// 🔁 SECONDARY API (fallback chain)
async function fetchFromSecondary(ref) {
  const fallbackVersions = ["web", "kjv"];

  for (const version of fallbackVersions) {
    try {
      const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=${version}`;
      const res = await fetch(url);

      if (!res.ok) continue;

      const data = await res.json();

      if (data.text && data.text.trim()) {
        return data.text;
      }
    } catch (e) {
      console.warn("Secondary attempt failed:", e);
    }
  }

  throw new Error("Secondary API failed completely");
}


// 📖 MAIN LOADER (dual API system)
async function loadTranslation(ref) {
  const preferred = translationEl.value || "web";

  try {
    const text = await fetchFromPrimary(ref, preferred);

    renderVerse(ref, text);

    localStorage.setItem("verse-cache", JSON.stringify({ ref, text }));
    return;

  } catch (err) {
    console.warn("Primary API failed, switching fallback...", err);
  }

  try {
    const text = await fetchFromSecondary(ref);

    renderVerse(ref, text);

    localStorage.setItem("verse-cache", JSON.stringify({ ref, text }));

  } catch (err) {
    console.error("Both APIs failed:", err);
    verseEl.textContent = "Could not load verse. Please try again later.";
  }
}


// 🧠 RENDER
function renderVerse(ref, text) {
  currentRef = ref;
  currentVerse = text;

  verseEl.textContent = text;
  refEl.textContent = ref;
}


// 🌄 DAILY VERSE
async function fetchDailyVerse() {
  try {
    const cached = localStorage.getItem("verse-cache");
    if (cached) {
      const data = JSON.parse(cached);
      renderVerse(data.ref, data.text);
    }

    const res = await fetch("https://beta.ourmanna.com/api/v1/get/?format=json&order=daily");
    const data = await res.json();

    const ref = data.verse.details.reference;
    await loadTranslation(ref);

  } catch {
    verseEl.textContent = "Offline or failed to load.";
  }
}


// 🔘 TOGGLE MODE (manual override)
function toggleTheme() {
  const bg = document.getElementById("bg");
  const current = document.documentElement.dataset.time;

  const next = current === "night" ? "day" : "night";

  document.documentElement.dataset.time = next;

  bg.classList.remove("morning", "day", "night");
  bg.classList.add(next);

  themeBtn.textContent = next === "night" ? "Day Mode" : "Night Mode";
}


// 📤 SHARE
async function shareVerse() {
  const text = `${currentRef}\n\n${currentVerse}`;

  if (navigator.share) {
    await navigator.share({ title: "Unshaken", text });
  } else {
    await navigator.clipboard.writeText(text);
    alert("Copied to clipboard");
  }
}


// EVENTS
translationEl.addEventListener("change", () => {
  if (currentRef) loadTranslation(currentRef);
});

themeBtn.addEventListener("click", toggleTheme);
document.getElementById("shareBtn").addEventListener("click", shareVerse);


// INIT
setThemeByTime();
fetchDailyVerse();
