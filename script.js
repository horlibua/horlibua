let books = [];
const list = document.getElementById('bookList');
const search = document.getElementById('searchInput');
const pdfViewer = document.getElementById('pdfViewer');
const pdfFrame = document.getElementById('pdfFrame');
const closeViewer = document.getElementById('closeViewer');

// Завантаження списку книг
fetch('books.json')
  .then(res => res.json())
  .then(data => {
    books = data;
    renderBooks(books);
  });

function renderBooks(data) {
  list.innerHTML = '';
  data.forEach(book => {
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-gray-800 rounded-lg shadow p-3 flex flex-col items-center';
    card.innerHTML = `
      <img src="${book.cover}" alt="cover" class="w-24 h-32 object-cover mb-2 rounded">
      <h3 class="text-center font-medium mb-2">${book.title}</h3>
      <div class="flex gap-2">
        <button class="px-3 py-1 bg-blue-500 text-white rounded viewBtn">Переглянути</button>
        <a href="${book.file}" download class="px-3 py-1 bg-gray-400 text-white rounded">⬇️</a>
      </div>
    `;
    card.querySelector('.viewBtn').addEventListener('click', () => openPDF(book.file));
    list.appendChild(card);
  });
}

// Пошук
search.addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(q) ||
    b.keywords.some(k => k.toLowerCase().includes(q))
  );
  renderBooks(filtered);
});

// Перегляд PDF
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

// Функція перемикання
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  themeToggle.textContent = isDark ? '☀️' : '🌙';
}

// Визначення початкової теми
(function initTheme() {
  const storedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
    themeToggle.textContent = '☀️';
  } else {
    document.documentElement.classList.remove('dark');
    themeToggle.textContent = '🌙';
  }
})();

// Обробник кліку
themeToggle.addEventListener('click', toggleTheme);
