/* ============================================
   pubblicazioni.js
   Carica /content/pubblicazioni/pubblicazioni.json (generato
   automaticamente dalla GitHub Action + eccezioni manuali,
   vedi .github/workflows/update-pubmed.yml e
   content/pubblicazioni/overrides.json) e la mostra con
   ricerca testuale e filtro per anno.
   ============================================ */
(function () {
  const listEl = document.getElementById('pub-list');
  const metaEl = document.getElementById('pub-meta');
  const searchEl = document.getElementById('pub-search');
  const yearEl = document.getElementById('pub-year');
  if (!listEl) return;

  let allPubs = [];

  function render() {
    const q = (searchEl.value || '').toLowerCase().trim();
    const year = yearEl.value;
    const filtered = allPubs.filter((p) => {
      const matchesQ = !q || (p.title + ' ' + p.authors + ' ' + p.journal).toLowerCase().includes(q);
      const matchesYear = !year || String(p.year) === year;
      return matchesQ && matchesYear;
    });

    listEl.innerHTML = filtered.map((p) => `
      <li>
        <div class="pub-title">${escapeHtml(p.title)}</div>
        <div class="pub-authors">${escapeHtml(p.authors)}</div>
        <div class="pub-journal">${escapeHtml(p.journal)} · ${p.year}</div>
        <div class="pub-links">
          ${p.pmid ? `<a href="https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/" target="_blank" rel="noopener">PubMed</a>` : ''}
          ${p.doi ? `<a href="https://doi.org/${p.doi}" target="_blank" rel="noopener">DOI</a>` : ''}
        </div>
      </li>
    `).join('') || `<li data-it="Nessuna pubblicazione trovata." data-en="No publications found.">Nessuna pubblicazione trovata.</li>`;

    const lang = window.getCurrentLang ? window.getCurrentLang() : 'it';
    metaEl.textContent = lang === 'it'
      ? `${filtered.length} pubblicazioni su ${allPubs.length} totali · aggiornato automaticamente da PubMed`
      : `${filtered.length} of ${allPubs.length} publications · auto-updated from PubMed`;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function populateYears() {
    const years = [...new Set(allPubs.map((p) => p.year))].sort((a, b) => b - a);
    yearEl.innerHTML = '<option value="">Tutti / All</option>' + years.map((y) => `<option value="${y}">${y}</option>`).join('');
  }

  fetch('/content/pubblicazioni/pubblicazioni.json')
    .then((r) => r.json())
    .then((data) => {
      allPubs = (data.items || []).sort((a, b) => b.year - a.year);
      populateYears();
      render();
    })
    .catch(() => {
      listEl.innerHTML = '<li>Elenco pubblicazioni non disponibile al momento.</li>';
    });

  searchEl.addEventListener('input', render);
  yearEl.addEventListener('change', render);
  document.addEventListener('langchange', render);
})();
