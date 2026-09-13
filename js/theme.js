// Apply the saved theme before the first paint. Storage is optional.
try {
  const savedTheme = localStorage.getItem('esteban-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') document.documentElement.dataset.theme = savedTheme;
} catch { /* Keep the light theme when storage is unavailable. */ }
