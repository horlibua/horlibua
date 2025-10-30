// ---------- Налаштування ----------
const DRIVE_JSON_URL =
  "books.json"; // 🔹 завантажити файл з Google Drive
const BOOKS_PER_PAGE = 10;

// ---------- Елементи ----------
const container = document.getElementById("booksContainer");
const searchInput = document.getElementById("search");
const pagination = document.getElementById("pagination");

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

// ---------- Кнопки категорій ----------
function renderCategoryButtons() {
  const container = document.getElementById("categoryButtons");
  container.innerHTML = "";

  const allKeywords = books.flatMap(b => b.keywords || []);
  const uniqueKeywords = [...new Set(allKeywords)];

  uniqueKeywords.forEach((kw) => {
    const btn = document.createElement("button");
    btn.innerText = kw;
    btn.className = getCategoryButtonClass(kw);

    btn.onclick = () => {
      activeCategory = kw;  // встановлюємо активну категорію
      activeLetter = null;  // скидаємо алфавітний фільтр
      searchInput.value = ""; // скидаємо текст пошуку
      filteredBooks = books.filter(b => Array.isArray(b.keywords) && b.keywords.includes(kw));
      currentPage = 1;
      renderBooks();
      renderPagination();
      renderCategoryButtons();
      renderAlphabetButtons();
    };
    container.appendChild(btn);
  });
}

function getCategoryButtonClass(kw) {
  return "px-3 py-1 rounded-full text-sm " +
         (activeCategory === kw
           ? "bg-blue-500 text-white"
           : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600");
}

// ---------- Алфавітний покажчик ----------
function renderAlphabetButtons() {
  const container = document.getElementById("alphabetButtons");
  container.innerHTML = "";

  // Збираємо перші літери усіх title (з великої літери)
  const allLetters = books.map(b => b.title[0].toUpperCase());
  const uniqueLetters = [...new Set(allLetters)];

  // Сортування літер за українським алфавітом
  const lettersSorted = uniqueLetters.sort((a, b) => a.localeCompare(b, 'uk'));

  // Всі літери від А до Я для повного покажчика
  const fullAlphabet = "АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ".split("");

  fullAlphabet.forEach((letter) => {
    const btn = document.createElement("button");
    btn.innerText = letter;

    // Перевірка, чи є книги з цією літерою
    const hasBooks = allLetters.includes(letter);

    btn.className = "px-3 py-1 rounded-full text-sm " +
      (activeLetter === letter
        ? "bg-blue-500 text-white"
        : hasBooks
          ? "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer"
          : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed");

    // Додаємо клік тільки якщо є книги
    if (hasBooks) {
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
    }

    container.appendChild(btn);
  });
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

// ---------- Старт ----------
loadBooks();
