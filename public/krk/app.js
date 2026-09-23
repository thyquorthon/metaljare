(function () {
  'use strict';

  const FAVORITES_KEY = 'km_favorites_v1';
  const HIDDEN_ARTISTS_KEY = 'km_hidden_artists_v1';
  const AUTO_IMPORT_FILENAME = 'favoritos.json';

  const allSongs = Array.isArray(window.KARAOKE_SONGS) ? window.KARAOKE_SONGS : [];

  const state = {
    search: '',
    excludedArtists: loadSet(HIDDEN_ARTISTS_KEY),
    favoritesOnly: false,
    sortField: 'Title',
    sortDir: 'asc',
    page: 1,
    pageSize: 50,
    hiddenArtistsFilter: '',
    favorites: loadSet(FAVORITES_KEY)
  };

  function loadSet(key) {
    try {
      const raw = localStorage.getItem(key);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (e) {
      return new Set();
    }
  }

  function saveFavorites() {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(state.favorites)));
  }

  function saveHiddenArtists() {
    localStorage.setItem(HIDDEN_ARTISTS_KEY, JSON.stringify(Array.from(state.excludedArtists)));
  }

  function hideArtist(artist) {
    if (!artist || state.excludedArtists.has(artist)) return;
    state.excludedArtists.add(artist);
    saveHiddenArtists();
    render();
  }

  function showArtist(artist) {
    state.excludedArtists.delete(artist);
    saveHiddenArtists();
    render();
  }

  function songKey(song) {
    return `${song.Language}||${song.Artist}||${song.Title}`;
  }

  const artistSongCounts = new Map();
  for (const s of allSongs) {
    artistSongCounts.set(s.Artist, (artistSongCounts.get(s.Artist) || 0) + 1);
  }

  function langBadgeClass(language) {
    const normalized = String(language || '').toLowerCase();
    if (normalized.startsWith('espa')) return 'lang-espanol';
    if (normalized.startsWith('ingl')) return 'lang-ingles';
    if (normalized.startsWith('catal')) return 'lang-catalan';
    return 'lang-other';
  }

  function exportFavorites() {
    const favSongs = allSongs
      .filter(s => state.favorites.has(songKey(s)))
      .map(s => ({ Title: s.Title, Artist: s.Artist, Language: s.Language }));
    const payload = {
      favorites: favSongs,
      hiddenArtists: Array.from(state.excludedArtists)
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `karaokemedia_favoritos_${today}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const validSongKeys = new Set(allSongs.map(songKey));
  const validArtists = new Set(allSongs.map(s => s.Artist));

  // Shared merge logic for the manual file-picker import and the automatic on-load import.
  function applyImportedPayload(jsonText) {
    const data = JSON.parse(jsonText);
    // Legacy format: a bare array of songs means favorites-only, no hidden artists.
    const favoritesInput = Array.isArray(data) ? data : Array.isArray(data.favorites) ? data.favorites : [];
    const hiddenArtistsInput = Array.isArray(data) ? [] : Array.isArray(data.hiddenArtists) ? data.hiddenArtists : [];

    let favAdded = 0;
    let favSkipped = 0;
    for (const item of favoritesInput) {
      if (item && item.Title && item.Artist && item.Language) {
        const key = `${item.Language}||${item.Artist}||${item.Title}`;
        if (!validSongKeys.has(key)) {
          favSkipped++;
          continue;
        }
        if (!state.favorites.has(key)) {
          state.favorites.add(key);
          favAdded++;
        }
      }
    }

    let artistsAdded = 0;
    let artistsSkipped = 0;
    for (const artist of hiddenArtistsInput) {
      if (typeof artist !== 'string' || !artist) continue;
      if (!validArtists.has(artist)) {
        artistsSkipped++;
        continue;
      }
      if (!state.excludedArtists.has(artist)) {
        state.excludedArtists.add(artist);
        artistsAdded++;
      }
    }

    saveFavorites();
    saveHiddenArtists();
    render();

    return { favAdded, favSkipped, artistsAdded, artistsSkipped };
  }

  function importFavoritesFromFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = applyImportedPayload(reader.result);
        const skippedTotal = result.favSkipped + result.artistsSkipped;
        const message =
          `Se importaron ${result.favAdded} favoritos y ${result.artistsAdded} artistas ocultos nuevos.` +
          (skippedTotal > 0 ? ` ${skippedTotal} entradas no coinciden con el catálogo y se ignoraron.` : '');
        alert(message);
      } catch (e) {
        alert('No se pudo leer el archivo: ' + e.message);
      }
    };
    reader.readAsText(file);
  }

  // On load, silently look for an exported favorites file sitting next to index.html
  // and merge it in automatically. No file present (or blocked by the browser) is a
  // normal, silent no-op — only surface a banner when something was actually imported.
  function tryAutoImportFavorites() {
    fetch(AUTO_IMPORT_FILENAME, { cache: 'no-store' })
      .then(resp => (resp && resp.ok ? resp.text() : null))
      .then(text => {
        if (!text) return;
        const result = applyImportedPayload(text);
        if (result.favAdded > 0 || result.artistsAdded > 0) {
          autoImportText.textContent =
            `📥 Se importaron ${result.favAdded} favoritos y ${result.artistsAdded} artistas ocultos desde ${AUTO_IMPORT_FILENAME}.`;
          autoImportBanner.hidden = false;
        }
      })
      .catch(() => {
        /* no favoritos.json next to index.html, or fetch blocked - ignore silently */
      });
  }

  const searchBox = document.getElementById('searchBox');
  const artistInput = document.getElementById('artistInput');
  const artistDatalist = document.getElementById('artistDatalist');
  const excludeBtn = document.getElementById('excludeBtn');
  const favoritesOnlyBox = document.getElementById('favoritesOnly');
  const clearFavoritesBtn = document.getElementById('clearFavoritesBtn');
  const pageSizeSelect = document.getElementById('pageSize');
  const tbody = document.getElementById('songTbody');
  const statsEl = document.getElementById('stats');
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const pageIndicator = document.getElementById('pageIndicator');
  const headerCells = document.querySelectorAll('#songTable thead th[data-sort]');
  const hiddenArtistsList = document.getElementById('hiddenArtistsList');
  const hiddenCountEl = document.getElementById('hiddenCount');
  const hiddenArtistsFilterInput = document.getElementById('hiddenArtistsFilter');
  const exportFavoritesBtn = document.getElementById('exportFavoritesBtn');
  const importFavoritesInput = document.getElementById('importFavoritesInput');
  const pageJumpInput = document.getElementById('pageJumpInput');
  const pageJumpBtn = document.getElementById('pageJumpBtn');
  const randomFavoriteBtn = document.getElementById('randomFavoriteBtn');
  const randomFavoriteResult = document.getElementById('randomFavoriteResult');
  const randomFavoriteText = document.getElementById('randomFavoriteText');
  const randomFavoriteAgainBtn = document.getElementById('randomFavoriteAgainBtn');
  const randomFavoriteCloseBtn = document.getElementById('randomFavoriteCloseBtn');
  const autoImportBanner = document.getElementById('autoImportBanner');
  const autoImportText = document.getElementById('autoImportText');
  const autoImportCloseBtn = document.getElementById('autoImportCloseBtn');

  function pickRandomFavorite() {
    const favSongs = allSongs.filter(s => state.favorites.has(songKey(s)));
    if (favSongs.length === 0) {
      alert('No tienes canciones favoritas guardadas todavía.');
      return;
    }
    const song = favSongs[Math.floor(Math.random() * favSongs.length)];
    randomFavoriteText.textContent = `🎵 ${song.Title} — ${song.Artist} (${song.Language}, ${song.Brand})`;
    randomFavoriteResult.hidden = false;
  }

  function jumpToPage() {
    const value = parseInt(pageJumpInput.value, 10);
    if (!value || value < 1) return;
    state.page = value;
    render();
    pageJumpInput.value = '';
  }

  function populateArtistAutocomplete() {
    const artists = Array.from(new Set(allSongs.map(s => s.Artist))).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
    const frag = document.createDocumentFragment();
    for (const artist of artists) {
      const opt = document.createElement('option');
      opt.value = artist;
      frag.appendChild(opt);
    }
    artistDatalist.appendChild(frag);
  }

  function getFiltered() {
    let list = allSongs;

    if (state.excludedArtists.size > 0) {
      list = list.filter(s => !state.excludedArtists.has(s.Artist));
    }

    if (state.favoritesOnly) {
      list = list.filter(s => state.favorites.has(songKey(s)));
    }

    if (state.search) {
      const q = state.search;
      list = list.filter(
        s =>
          s.Title.toLowerCase().includes(q) ||
          s.Artist.toLowerCase().includes(q) ||
          s.Language.toLowerCase().includes(q) ||
          (s.Brand && s.Brand.toLowerCase().includes(q))
      );
    }

    return list;
  }

  function sortList(list) {
    const field = state.sortField;
    const dir = state.sortDir === 'asc' ? 1 : -1;
    return list.slice().sort(
      (a, b) => dir * String(a[field] || '').localeCompare(String(b[field] || ''), undefined, { sensitivity: 'base' })
    );
  }

  function renderHiddenArtistsList() {
    hiddenCountEl.textContent = state.excludedArtists.size;
    hiddenArtistsList.innerHTML = '';
    if (state.excludedArtists.size === 0) return;

    let artists = Array.from(state.excludedArtists).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
    if (state.hiddenArtistsFilter) {
      const q = state.hiddenArtistsFilter;
      artists = artists.filter(a => a.toLowerCase().includes(q));
    }

    const frag = document.createDocumentFragment();
    for (const artist of artists) {
      const li = document.createElement('li');
      li.className = 'hidden-artist-item';

      const label = document.createElement('span');
      const songCount = artistSongCounts.get(artist) || 0;
      label.textContent = `${artist} (${songCount})`;
      li.appendChild(label);

      const showBtn = document.createElement('button');
      showBtn.type = 'button';
      showBtn.className = 'show-artist-btn';
      showBtn.textContent = 'Mostrar';
      showBtn.dataset.artist = artist;
      showBtn.title = `Volver a mostrar a ${artist}`;
      li.appendChild(showBtn);

      frag.appendChild(li);
    }
    hiddenArtistsList.appendChild(frag);
  }

  function updateSortIndicators() {
    headerCells.forEach(th => {
      const arrow = th.querySelector('.arrow');
      arrow.textContent = th.dataset.sort === state.sortField ? (state.sortDir === 'asc' ? '▲' : '▼') : '';
    });
  }

  function render() {
    renderHiddenArtistsList();
    updateSortIndicators();

    const filtered = sortList(getFiltered());
    const total = filtered.length;
    const pageSize = state.pageSize;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (state.page > totalPages) state.page = totalPages;
    const startIdx = (state.page - 1) * pageSize;
    const pageItems = filtered.slice(startIdx, startIdx + pageSize);

    tbody.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (const song of pageItems) {
      const key = songKey(song);
      const isFav = state.favorites.has(key);
      const tr = document.createElement('tr');
      if (isFav) tr.className = 'fav-row';

      const starTd = document.createElement('td');
      const star = document.createElement('span');
      star.className = 'star' + (isFav ? ' active' : '');
      star.dataset.key = key;
      star.textContent = isFav ? '★' : '☆';
      star.title = isFav ? 'Quitar de favoritos' : 'Marcar como favorito';
      starTd.appendChild(star);
      tr.appendChild(starTd);

      const hideTd = document.createElement('td');
      hideTd.className = 'hide-col';
      const hideBtn = document.createElement('button');
      hideBtn.type = 'button';
      hideBtn.className = 'hide-artist-btn';
      hideBtn.textContent = '🚫';
      hideBtn.dataset.artist = song.Artist;
      hideBtn.title = `Ocultar a ${song.Artist}`;
      hideTd.appendChild(hideBtn);
      tr.appendChild(hideTd);

      const artistTd = document.createElement('td');
      artistTd.textContent = song.Artist || '';
      tr.appendChild(artistTd);

      const titleTd = document.createElement('td');
      titleTd.textContent = song.Title || '';
      tr.appendChild(titleTd);

      const langTd = document.createElement('td');
      const langBadge = document.createElement('span');
      langBadge.className = `lang-badge ${langBadgeClass(song.Language)}`;
      langBadge.textContent = song.Language || '';
      langTd.appendChild(langBadge);
      tr.appendChild(langTd);

      frag.appendChild(tr);
    }
    tbody.appendChild(frag);

    statsEl.textContent =
      `Mostrando ${total === 0 ? 0 : startIdx + 1}-${Math.min(startIdx + pageSize, total)} de ${total} canciones ` +
      `(catálogo total: ${allSongs.length})`;
    pageIndicator.textContent = `Página ${state.page} de ${totalPages}`;
    prevBtn.disabled = state.page <= 1;
    nextBtn.disabled = state.page >= totalPages;
    pageJumpInput.max = totalPages;
    pageJumpInput.placeholder = String(state.page);
  }

  function bindEvents() {
    let searchTimer = null;
    searchBox.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.search = searchBox.value.trim().toLowerCase();
        state.page = 1;
        render();
      }, 150);
    });

    excludeBtn.addEventListener('click', () => {
      const val = artistInput.value.trim();
      if (val) {
        hideArtist(val);
        artistInput.value = '';
      }
    });

    artistInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        excludeBtn.click();
      }
    });

    hiddenArtistsList.addEventListener('click', e => {
      const btn = e.target.closest('.show-artist-btn');
      if (!btn) return;
      showArtist(btn.dataset.artist);
    });

    hiddenArtistsFilterInput.addEventListener('input', () => {
      state.hiddenArtistsFilter = hiddenArtistsFilterInput.value.trim().toLowerCase();
      renderHiddenArtistsList();
    });

    autoImportCloseBtn.addEventListener('click', () => {
      autoImportBanner.hidden = true;
    });

    favoritesOnlyBox.addEventListener('change', () => {
      state.favoritesOnly = favoritesOnlyBox.checked;
      state.page = 1;
      render();
    });

    clearFavoritesBtn.addEventListener('click', () => {
      if (state.favorites.size === 0) return;
      if (confirm('¿Quitar todas las canciones marcadas como favoritas?')) {
        state.favorites.clear();
        saveFavorites();
        render();
      }
    });

    exportFavoritesBtn.addEventListener('click', () => {
      if (state.favorites.size === 0) {
        alert('No hay favoritos para exportar.');
        return;
      }
      exportFavorites();
    });

    importFavoritesInput.addEventListener('change', () => {
      const file = importFavoritesInput.files[0];
      if (file) importFavoritesFromFile(file);
      importFavoritesInput.value = '';
    });

    pageSizeSelect.addEventListener('change', () => {
      state.pageSize = parseInt(pageSizeSelect.value, 10);
      state.page = 1;
      render();
    });

    prevBtn.addEventListener('click', () => {
      if (state.page > 1) {
        state.page--;
        render();
      }
    });

    nextBtn.addEventListener('click', () => {
      state.page++;
      render();
    });

    pageJumpBtn.addEventListener('click', jumpToPage);

    pageJumpInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        jumpToPage();
      }
    });

    randomFavoriteBtn.addEventListener('click', pickRandomFavorite);
    randomFavoriteAgainBtn.addEventListener('click', pickRandomFavorite);
    randomFavoriteCloseBtn.addEventListener('click', () => {
      randomFavoriteResult.hidden = true;
    });

    headerCells.forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.sort;
        if (state.sortField === field) {
          state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          state.sortField = field;
          state.sortDir = 'asc';
        }
        render();
      });
    });

    tbody.addEventListener('click', e => {
      const hideBtn = e.target.closest('.hide-artist-btn');
      if (hideBtn) {
        hideArtist(hideBtn.dataset.artist);
        return;
      }

      const star = e.target.closest('.star');
      if (!star) return;
      const key = star.dataset.key;
      if (state.favorites.has(key)) {
        state.favorites.delete(key);
      } else {
        state.favorites.add(key);
      }
      saveFavorites();
      const isFavNow = state.favorites.has(key);
      star.classList.toggle('active');
      star.textContent = isFavNow ? '★' : '☆';
      star.title = isFavNow ? 'Quitar de favoritos' : 'Marcar como favorito';
      star.closest('tr').classList.toggle('fav-row', isFavNow);
      if (state.favoritesOnly) render();
    });
  }

  populateArtistAutocomplete();
  bindEvents();
  render();
  tryAutoImportFavorites();
})();
