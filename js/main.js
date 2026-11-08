// MTA TECHNOLOGIES - Production Interactive Client Script
(function() {
  // Theme Initialization & Toggle
  const currentTheme = localStorage.getItem('mta-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);

  window.toggleTheme = function() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('mta-theme', nextTheme);
  };

  // Language Initialization & Toggle
  const savedLang = localStorage.getItem('mta-lang') || 'ar';
  document.documentElement.setAttribute('lang', savedLang);
  document.documentElement.setAttribute('dir', savedLang === 'ar' ? 'rtl' : 'ltr');

  window.toggleLanguage = function() {
    const currentLang = document.documentElement.getAttribute('lang') || 'ar';
    const nextLang = currentLang === 'ar' ? 'en' : 'ar';
    document.documentElement.setAttribute('lang', nextLang);
    document.documentElement.setAttribute('dir', nextLang === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem('mta-lang', nextLang);
  };

  // Copy Email Helper
  window.copyEmail = function() {
    navigator.clipboard.writeText('mtatechnologies0@gmail.com').then(() => {
      const alertEl = document.getElementById('copied-badge');
      if (alertEl) {
        alertEl.style.display = 'inline-block';
        setTimeout(() => alertEl.style.display = 'none', 3000);
      } else {
        alert('Email copied: mtatechnologies0@gmail.com');
      }
    });
  };

  // Lightbox Modal
  window.openLightbox = function(title, desc, imgSrc) {
    const modal = document.getElementById('lightbox-modal');
    if (!modal) return;
    document.getElementById('lightbox-title').textContent = title;
    document.getElementById('lightbox-desc').textContent = desc;
    document.getElementById('lightbox-img').src = imgSrc;
    modal.style.display = 'flex';
  };

  window.closeLightbox = function() {
    const modal = document.getElementById('lightbox-modal');
    if (modal) modal.style.display = 'none';
  };
})();
