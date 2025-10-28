// ---------- Глобальні змінні ----------
const container = document.getElementById("booksContainer");
const searchInput = document.getElementById("search");
const themeToggle = document.getElementById("themeToggle");
const html = document.documentElement;

let books = [];

// ---------- Завантаження books.json ----------
async function loadBooks() {
  const res = await fetch("books.json");
  books = await res.json();
  renderBooks(books);
}

// ---------- Рендер карток ----------
async function renderBooks(list) {
  container.innerHTML = "";

  for (const [i, book] of list.entries()) {
    const card = document.createElement("div");
    card.className =
      "border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden shadow hover:shadow-lg transition relative bg-white dark:bg-gray-800";

    const coverId = "cover_" + i;
    const imgSrc = book.cover || "assets/default_cover.png";
    const titleHTML = `<div class="p-2 text-sm font-medium text-center">${book.title}</div>`;
    const buttonsHTML = `
      <div class="flex justify-around p-2 border-t border-gray-200 dark:border-gray-700">
        <button onclick="openPDF('${book.file}')" class="text-blue-600 dark:text-blue-400 text-sm">📖 Переглянути</button>
        <button onclick="downloadPDF('${book.file}', '${book.title}')" class="text-green-600 dark:text-green-400 text-sm">⬇️ Завантажити</button>
      </div>`;

    card.innerHTML = `
      <img id="${coverId}" src="${imgSrc}" alt="cover" class="w-full aspect-[3/4] object-cover">
      ${titleHTML}
      <div id="size_${i}" class="text-xs text-gray-500 text-center mb-1">...</div>
      ${buttonsHTML}
    `;

    container.appendChild(card);

    // 🔹 Якщо cover відсутній — створюємо превʼю з PDF
    if (!book.cover) {
      renderPDFPreview(book.file, coverId);
    }

    // 🔹 Визначаємо розмір PDF
    setFileSize(book.file, `size_${i}`);
  }
}

// ---------- Визначення розміру файлу ----------
async function setFileSize(url, elementId) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    const size = response.headers.get("content-length");
    if (size) {
      const mb = (parseInt(size) / (1024 * 1024)).toFixed(2);
      document.getElementById(elementId).innerText = `${mb} МБ`;
    } else {
      document.getElementById(elementId).innerText = "—";
    }
  } catch {
    document.getElementById(elementId).innerText = "—";
  }
}

// ---------- Відкриття PDF ----------
function openPDF(url) {
  window.open(url, "_blank");
}

// ---------- Завантаження PDF ----------
function downloadPDF(url, title) {
  const filename = title.replace(/[^\w\s]/gi, "_") + ".pdf";
  fileDownload(url, filename);
}

// ---------- Пошук ----------
searchInput.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  const filtered = books.filter((b) => b.title.toLowerCase().includes(q));
  renderBooks(filtered);
});

// ---------- Темна/світла тема ----------
themeToggle.addEventListener("click", () => {
  html.classList.toggle("dark");
  localStorage.setItem("theme", html.classList.contains("dark") ? "dark" : "light");
});

if (localStorage.getItem("theme") === "dark") html.classList.add("dark");

lucide.createIcons();

// ---------- PDF Preview через pdf.js ----------
async function renderPDFPreview(pdfUrl, imgId) {
  try {
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.2 });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;

    const imgElem = document.getElementById(imgId);
    if (imgElem) imgElem.src = canvas.toDataURL("image/png");
  } catch (e) {
    console.warn("⚠️ Не вдалося створити обкладинку для:", pdfUrl, e);
  }
}

// ---------- Старт ----------
loadBooks();
