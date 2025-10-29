// ---------- Налаштування ----------
const DRIVE_JSON_URL =
  "https://drive.google.com/uc?export=download&id=1sjiHh9LwW3EIbKYW1oueiAoVGgu_550e"; // 🔹 заміни на ID books.json з Google Drive
const BOOKS_PER_PAGE = 15;

// ---------- Елементи ----------
const container = document.getElementById("booksContainer");
const latestContainer = document.getElementById("latestBooks");
const searchInput = document.getElementById("search");
const pagination = document.getElementById("pagination");

let books = [];
let filteredBooks = [];
let currentPage = 1;

// ---------- Завантаження books.json ----------
async function loadBooks() {
  try {
    const res = await fetch(DRIVE_JSON_URL);
    books = await res.json();
    filteredBooks = [...books];

    renderLatestBooks();
    renderBooks();
    renderPagination();
  } catch (err) {
    console.error("Помилка завантаження books.json:", err);
    container.innerHTML = `<p class="text-center text-red-500">Не вдалося завантажити бібліотеку.</p>`;
  }
}

// ---------- Останні книжки ----------
function renderLatestBooks() {
  latestContainer.innerHTML = "";
  const latest = books.slice(-5).reverse(); // останні 5
  latest.forEach((book) => {
    const card = document.createElement("div");
    card.className =
      "border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow bg-white dark:bg-gray-800";
    card.innerHTML = `
      <img src="${book.cover || 'assets/default_cover.png'}"
           alt="cover"
           class="w-full aspect-[3/4] object-cover">
      <div class="p-2 text-sm font-medium text-center truncate">${book.title}</div>
    `;
    card.onclick = () => openPDF(book.file);
    latestContainer.appendChild(card);
  });
}

// ---------- Основний рендер ----------
function renderBooks() {
  container.innerHTML = "";
  const start = (currentPage - 1) * BOOKS_PER_PAGE;
  const end = start + BOOKS_PER_PAGE;
  const list = filteredBooks.slice(start, end);

  list.forEach((book) => {
    const card = document.createElement("div");
    card.className =
      "border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden shadow hover:shadow-lg transition relative bg-white dark:bg-gray-800";
    card.innerHTML = `
      <img src="${book.cover || 'assets/default_cover.png'}"
           alt="cover"
           class="w-full aspect-[3/4] object-cover">
      <div class="p-2 text-sm font-medium text-center">${book.title}</div>
      <div class="text-xs text-gray-500 text-center mb-1">${book.size_mb ? book.size_mb + " МБ" : ""}</div>
      <div class="flex justify-around p-2 border-t border-gray-200 dark:border-gray-700">
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
  filteredBooks = books.filter((b) => b.title.toLowerCase().includes(q));
  currentPage = 1;
  renderBooks();
  renderPagination();
});

// ---------- PDF-перегляд і завантаження ----------
function openPDF(url) {
  window.open(url, "_blank");
}
function downloadPDF(url, title) {
  const filename = title.replace(/[^\w\s]/gi, "_") + ".pdf";
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// ---------- Старт ----------
loadBooks();
