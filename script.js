let books = [];
const list = document.getElementById('bookList');
const search = document.getElementById('searchInput');
const pdfViewer = document.getElementById('pdfViewer');
const pdfFrame = document.getElementById('pdfFrame');
const closeViewer = document.getElementById('closeViewer');

// === Створюємо спіннер ===
const loader = document.createElement('div');
loader.className = 'flex flex-col items-center justify-center py-20 w-full text-gray-500 dark:text-gray-400';
loader.innerHTML = `
  <svg class="animate-spin h-8 w-8 mb-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
  </svg>
  <p>Завантаження бібліотеки...</p>
`;
list.appendChild(loader);

// === Завантаження списку книг ===
fetch('books.json')
  .then(res => res.json())
  .then(data => {
    books = data;
    renderBooks(books);
  })
  .catch(err => {
    list.innerHTML = `<p class="text-red-500">Помилка завантаження списку книг.</p>`;
    console.error(err);
  });

// === Отримуємо кеш розмірів ===
function getSizeCache() {
  try {
    return JSON.parse(localStorage.getItem('bookSizes')) || {};
  } catch {
    return {};
  }
}
function saveSizeCache(cache) {
  localStorage.setItem('bookSizes', JSON.stringify(cache));
}

// === Функція для відображення карток ===
async function renderBooks(data) {
  list.innerHTML = '';
  list.appendChild(loader);

  const rendered = [];
  const sizeCache = getSizeCache();
  let cacheChanged = false;

  for (const book of data) {
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-gray-800 rounded-lg shadow p-3 flex flex-col items-center transition hover:shadow-md';

    // --- Отримання розміру файлу ---
    let sizeText = '';
    const cachedSize = sizeCache[book.file];

    if (cachedSize) {
      sizeText = cachedSize;
    } else {
      try {
        const response = await fetch(book.file, { method: 'HEAD' });
        const sizeBytes = response.headers.get('content-length');
        if (sizeBytes) {
          const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2) + ' МБ';
          sizeText = sizeMB;
          sizeCache[book.file] = sizeMB;
          cacheChanged = true;
        }
      } catch {
        sizeText = '';
      }
    }

    card.innerHTML = `
      <img src="${book.cover}" alt="cover" class="w-24 h-32 object-cover mb-2 rounded">
      <h3 class="text-center font-medium mb-1">${book.title}</h3>
      ${sizeText ? `<p class="text-sm text-gray-500 mb-2">${sizeText}</p>` : ''}
      <div class="flex gap-2">
        <button class="px-3 py-1 bg-blue-500 text-white rounded viewBtn hover:bg-blue-600 transition">Переглянути</button>
        <a href="${book.file}" download class="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 transition">⬇️</a>
      </div>
    `;

    // 🔹 Якщо cover відсутній — створюємо превʼю з PDF
    if (!book.cover) {
      renderPDFPreview(book.file, coverId);
    }

    card.querySelector('.viewBtn').addEventListener('click', () => openPDF(book.file));
    rendered.push(card);
  }

  // зберігаємо кеш якщо оновився
  if (cacheChanged) saveSizeCache(sizeCache);

  list.innerHTML = ''; // очистити спіннер
  rendered.forEach(card => list.appendChild(card));
}

// === Пошук ===
search.addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(q) ||
    b.keywords.some(k => k.toLowerCase().includes(q))
  );
  renderBooks(filtered);
});

// === Перегляд PDF ===
function openPDF(file) {
  pdfFrame.src = file;
  pdfViewer.classList.remove('hidden');
}
closeViewer.addEventListener('click', () => {
  pdfViewer.classList.add('hidden');
  pdfFrame.src = '';
});

// === Темна / світла тема ===
const themeToggle = document.getElementById('themeToggle');

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  themeToggle.textContent = isDark ? '☀️' : '🌙';
}

(function initTheme() {
  const storedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = storedTheme === 'dark' || (!storedTheme && prefersDark);

  document.documentElement.classList.toggle('dark', isDark);
  themeToggle.textContent = isDark ? '☀️' : '🌙';
})();

themeToggle.addEventListener('click', toggleTheme);

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
