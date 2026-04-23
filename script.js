let currentRef = "";
let currentVerse = "";

const verseEl = document.getElementById("verse");
const refEl = document.getElementById("ref");
const translationEl = document.getElementById("translation");

function setThemeByTime() {
  const hour = new Date().getHours();
  document.documentElement.dataset.theme =
    hour >= 18 || hour < 6 ? "dark" : "light";
}

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

async function loadTranslation(ref) {
  try {
    const version = translationEl.value;

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
  const isDark = document.documentElement.dataset.theme === "dark";
  document.documentElement.dataset.theme = isDark ? "light" : "dark";
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

document.getElementById("themeBtn").onclick = toggleTheme;
document.getElementById("shareBtn").onclick = shareVerse;

setThemeByTime();
fetchDailyVerse();
