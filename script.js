// ---------- Налаштування ----------
const DRIVE_JSON_URL =
  "books.json"; // 🔹 завантажити файл з Google Drive
const BOOKS_PER_PAGE = 10;

// ---------- Елементи ----------
const container = document.getElementById("booksContainer");
const searchInput = document.getElementById("search");
const pagination = document.getElementById("pagination");
const toggleBtn = document.getElementById("toggleFiltersBtn");
const filtersContainer = document.getElementById("filtersContainer");
const toggleArrow = document.getElementById("toggleArrow");

toggleBtn.addEventListener("click", () => {
  if (filtersContainer.classList.contains("max-h-0")) {
    // Відкриваємо
    filtersContainer.style.maxHeight = filtersContainer.scrollHeight + "px";
    filtersContainer.classList.remove("max-h-0");
    toggleArrow.textContent = "▲";
  } else {
    // Закриваємо
    filtersContainer.style.maxHeight = "0";
    filtersContainer.classList.add("max-h-0");
    toggleArrow.textContent = "▼";
  }
});


let books = [];
let filteredBooks = [];
let currentPage = 1;
let activeCategory = null;
let activeLetter = null;

// ---------- Завантаження books.json ----------
async function loadBooks() {
  try {
    const res = await fetch(DRIVE_JSON_URL);
    books = await res.json();
    filteredBooks = [...books].reverse();
    renderBooks();
    renderPagination();
    renderCategoryButtons();
    renderAlphabetButtons();
  } catch (err) {
    console.error("Помилка завантаження books.json:", err);
    container.innerHTML = `<p class="text-center text-red-500">Не вдалося завантажити бібліотеку.</p>`;
  }
}

// ---------- Автоматичне відкриття модалки при завантаженні при посиланні на книжку ----------
loadBooks().then(() => {
  const bookId = getQueryParam("bookId");
  if (bookId) {
    const book = books.find(b => b.file === bookId);
    if (book) {
      openBookModal(book);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
});

// ---------- Кнопки категорій ----------
function renderCategoryButtons() {
  const container = document.getElementById("categoryButtons");
  container.innerHTML = "";

  const allKeywords = books.flatMap(b => b.keywords || []);
  const uniqueKeywords = [...new Set(allKeywords)];

  uniqueKeywords.forEach((kw) => {
    const btn = document.createElement("button");
    btn.innerText = kw;
    btn.className = "px-3 py-1 rounded-full text-sm " +
      (activeCategory === kw
        ? "bg-blue-500 text-white"
        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer");

    btn.onclick = () => {
      activeCategory = kw;
      activeLetter = null;
      searchInput.value = "";
      filteredBooks = books.filter(b => Array.isArray(b.keywords) && b.keywords.includes(kw));
      currentPage = 1;
      renderBooks();
      renderPagination();
      renderCategoryButtons();
      renderAlphabetButtons();
    };

    container.appendChild(btn);
  });

  // Кнопка скидання фільтрів (єдина)
  const resetBtn = document.createElement("button");
  resetBtn.innerText = "❌ Скинути фільтри";
  resetBtn.className = "px-3 py-1 rounded-full text-sm bg-red-500 text-white hover:bg-red-600";
  resetBtn.onclick = () => resetFilters();
  container.appendChild(resetBtn);
}

// ---------- Алфавітний покажчик ----------
function renderAlphabetButtons() {
  const container = document.getElementById("alphabetButtons");
  container.innerHTML = "";

  // Беремо тільки перші літери існуючих книг
  const allLetters = books.map(b => b.title[0].toUpperCase());
  const uniqueLetters = [...new Set(allLetters)].sort((a, b) => a.localeCompare(b, 'uk'));

  uniqueLetters.forEach((letter) => {
    const btn = document.createElement("button");
    btn.innerText = letter;

    btn.className = "px-2 py-1 rounded-full text-sm flex-shrink-0 " +
      (activeLetter === letter
        ? "bg-blue-500 text-white"
        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer");

    btn.onclick = () => {
      activeLetter = letter;
      activeCategory = null;
      searchInput.value = "";
      filteredBooks = books.filter(b => b.title[0].toUpperCase() === letter);
      currentPage = 1;
      renderBooks();
      renderPagination();
      renderCategoryButtons();
      renderAlphabetButtons();
    };

    container.appendChild(btn);
  });
}

// ---------- Скидання фільтрів ----------
function resetFilters() {
  activeCategory = null;
  activeLetter = null;
  searchInput.value = "";
  filteredBooks = [...books].reverse();
  currentPage = 1;
  renderBooks();
  renderPagination();
  renderCategoryButtons();
  renderAlphabetButtons();
}

// ---------- Формування картки ----------
function renderBooks() {
  container.innerHTML = "";
  const start = (currentPage - 1) * BOOKS_PER_PAGE;
  const end = start + BOOKS_PER_PAGE;
  const list = filteredBooks.slice(start, end);

  list.forEach((book) => {
    const card = document.createElement("div");
    card.className =
      "border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden shadow hover:shadow-lg transition relative bg-white dark:bg-gray-800 flex flex-col";

    card.innerHTML = `
      <!-- Обгортка для зображення з рамкою -->
      <div class="p-2 flex justify-center">
        <img src="${book.cover || 'assets/default_cover.png'}"
             alt="cover"
             class="border border-gray-300 dark:border-gray-600 w-full aspect-[3/4] object-cover rounded">
      </div>

      <!-- Текст і розмір -->
      <div class="p-2 text-sm font-medium text-center flex-1">
        <div class="mb-1">${book.title}</div>
        <div class="text-xs text-gray-500">${book.size_mb ? book.size_mb + " МБ" : ""}</div>
      </div>

      <!-- Кнопки, завжди внизу -->
      <div class="flex justify-around p-2 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <button onclick="openPDF('${book.file}')"
                class="text-blue-600 dark:text-blue-400 text-sm">📖 Переглянути</button>
        <button onclick="downloadPDF('${book.file}', '${book.title}')"
                class="text-green-600 dark:text-green-400 text-sm">⬇️ Завантажити</button>
      </div>
    `;
    card.querySelector("img").addEventListener("click", () => openBookModal(book));
    container.appendChild(card);
  });
}

// ---------- Пагінація ----------
function renderPagination() {
  pagination.innerHTML = "";
  const totalPages = Math.ceil(filteredBooks.length / BOOKS_PER_PAGE);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;
    btn.className =
      "px-3 py-1 border rounded-lg " +
      (i === currentPage
        ? "bg-blue-500 text-white"
        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300");
    btn.onclick = () => {
      currentPage = i;
      renderBooks();
      renderPagination();
      window.scrollTo({ top: 300, behavior: "smooth" });
    };
    pagination.appendChild(btn);
  }
}

// ---------- Пошук ----------
searchInput.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  filteredBooks = books.filter((b) => {
    const inTitle = b.title.toLowerCase().includes(q);
    const inKeywords =
      Array.isArray(b.keywords) &&
      b.keywords.some((kw) => kw.toLowerCase().includes(q));
    return inTitle || inKeywords;
  });

  currentPage = 1;
  renderBooks();
  renderPagination();

  // скидаємо підсвічування кнопок, якщо пошук введено вручну
  if (!activeCategory && !activeLetter) return;
  activeCategory = null;
  activeLetter = null;
  renderCategoryButtons();
  renderAlphabetButtons();
});

// ---------- PDF-перегляд і завантаження ----------
function openPDF(fileId) {
  const modal = document.getElementById("pdfModal");
  const viewer = document.getElementById("pdfViewer");

  // Google Drive Preview URL
  viewer.src = `https://drive.google.com/file/d/${fileId}/preview`;

  // Показати модальне вікно
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closePDF() {
  const modal = document.getElementById("pdfModal");
  const viewer = document.getElementById("pdfViewer");

  // Сховати модальне вікно
  modal.classList.add("hidden");
  modal.classList.remove("flex");

  // Очищення src, щоб зупинити PDF
  viewer.src = "";
}

function downloadPDF(fileId, title) {
  const filename = title.replace(/[^\w\s]/gi, "_") + ".pdf";
  const link = document.createElement("a");
  link.href = `https://drive.google.com/uc?export=download&id=${fileId}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// ---------- Відкриття модалки при кліку на обкладинку ----------
function openBookModal(book) {
  const modal = document.getElementById("bookModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  // Заповнюємо дані
  document.getElementById("modalCover").src = book.cover || "assets/default_cover.png";
  document.getElementById("modalTitle").textContent = book.title;
  document.getElementById("modalSize").textContent = book.size_mb ? book.size_mb + " МБ" : "";

  // Коротке посилання
  const shortUrlEl = document.getElementById("modalShortUrl");
  shortUrlEl.textContent = book.short_url || "";
  shortUrlEl.onclick = () => window.open(book.short_url, "_blank");

  // Посилання на картку
  const pageUrl = `${window.location.origin}${window.location.pathname}?bookId=${encodeURIComponent(book.file)}`;
  const pageUrlEl = document.getElementById("modalPageUrl");
  pageUrlEl.textContent = pageUrl;

  // Кнопки Переглянути та Завантажити
  document.getElementById("modalViewBtn").onclick = () => openPDF(book.file);
  document.getElementById("modalDownloadBtn").onclick = () => downloadPDF(book.file, book.title);
}

function closeBookModal() {
  const modal = document.getElementById("bookModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

// ---------- Функція копіювання в буфер ----------
function copyToClipboard(elementId) {
  const text = document.getElementById(elementId).textContent;
  navigator.clipboard.writeText(text);
  // без alert
}


// ---------- Функція для отримання параметра з URL ----------
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}


// ---------- Старт ----------
loadBooks();
