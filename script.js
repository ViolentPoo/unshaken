let currentRef = "";
let currentVerse = "";

const verseEl = document.getElementById("verse");
const refEl = document.getElementById("ref");
const translationEl = document.getElementById("translation");
const themeBtn = document.getElementById("themeBtn");

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

  themeBtn.textContent = theme === "night" ? "Day Mode" : "Night Mode";
}

async function fetchDailyVerse() {
  try {
    const cached = localStorage.getItem("verse-cache");
    if (cached) {
      const data = JSON.parse(cached);
      renderVerse(data.ref, data.text);
    }

    const res = await fetch(
      "https://beta.ourmanna.com/api/v1/get/?format=json&order=daily"
    );
    const data = await res.json();

    const ref = data.verse.details.reference;
    await loadTranslation(ref);

  } catch {
    verseEl.textContent = "Offline or failed to load.";
  }
}

async function loadTranslation(ref) {
  try {
    const version = translationEl.value || "niv";

    const res = await fetch(
      `https://bible-api.com/${encodeURIComponent(ref)}?translation=${version}`
    );

    const data = await res.json();

    renderVerse(ref, data.text);

    localStorage.setItem(
      "verse-cache",
      JSON.stringify({ ref, text: data.text })
    );

  } catch {
    verseEl.textContent = "Could not load translation.";
  }
}

function renderVerse(ref, text) {
  currentRef = ref;
  currentVerse = text;

  verseEl.textContent = text;
  refEl.textContent = ref;
}

function toggleTheme() {
  const current = document.documentElement.dataset.time;

  let newTheme = "day";
  if (current === "night") newTheme = "day";
  else newTheme = "night";

  document.documentElement.dataset.time = newTheme;

  themeBtn.textContent = newTheme === "night" ? "Day Mode" : "Night Mode";
}

async function shareVerse() {
  const text = `${currentRef}\n\n${currentVerse}`;

  if (navigator.share) {
    await navigator.share({ title: "Unshaken", text });
  } else {
    await navigator.clipboard.writeText(text);
    alert("Copied to clipboard");
  }
}

translationEl.addEventListener("change", () => {
  if (currentRef) loadTranslation(currentRef);
});

themeBtn.addEventListener("click", toggleTheme);
document.getElementById("shareBtn").addEventListener("click", shareVerse);

setThemeByTime();
fetchDailyVerse();
