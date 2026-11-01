(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* Download target ---------------------------------------------------- */
  const downloads = {
    win: 'https://github.com/cookie-launcher/cookie-launcher/releases/download/v4.0.0/CookieLauncher_4.0.0_x64-setup.exe',
    linux: 'https://github.com/cookie-launcher/cookie-launcher/releases/download/v4.0.0/CookieLauncher_4.0.0_amd64.AppImage',
    mac: 'https://github.com/cookie-launcher/cookie-launcher/releases'
  };
  const ua = navigator.userAgent;
  let target = null;
  if (/CrOS|Android/i.test(ua)) target = null;
  else if (/Windows/i.test(ua)) target = 'win';
  else if (/Macintosh|Mac OS X/i.test(ua)) target = 'mac';
  else if (/Linux|X11/i.test(ua)) target = 'linux';
  if (target) $$('[data-download]').forEach((link) => { link.href = downloads[target]; });

  /* Modrinth search — the live API ------------------------------------- */
  const API = 'https://api.modrinth.com/v2/search';
  const LIMIT = 6;
  const search = $('#mod-search');
  const results = $('#results');
  const resultsList = $('#results-list');
  const resultsCount = $('#results-count');
  const resultsAll = $('#results-all');
  const status = $('#search-status');
  const types = {
    mod: 'Mod',
    modpack: 'Mod paketi',
    shader: 'Shader',
    resourcepack: 'Kaynak paketi',
    plugin: 'Eklenti',
    datapack: 'Veri paketi'
  };
  const paths = { mod: 'mod', modpack: 'modpack', shader: 'shader', resourcepack: 'resourcepack', plugin: 'plugin', datapack: 'datapack' };
  const nf = new Intl.NumberFormat('tr-TR');
  let seq = 0;
  let controller = null;
  let timer = null;

  const setState = (text) => {
    if (resultsCount) resultsCount.textContent = text;
    if (status) status.textContent = text;
  };

  const messageRow = (text, kind = 'empty') => {
    const li = document.createElement('li');
    li.className = `result result--${kind}`;
    li.textContent = text;
    return li;
  };

  const row = (hit) => {
    const li = document.createElement('li');
    li.className = 'result';
    const a = document.createElement('a');
    a.className = 'result__link';
    const kind = paths[hit.project_type] || 'mod';
    a.href = `https://modrinth.com/${kind}/${hit.slug}`;
    a.target = '_blank';
    a.rel = 'noopener';
    const top = document.createElement('div');
    top.className = 'result__top';
    const name = document.createElement('span');
    name.className = 'result__name';
    name.textContent = hit.title;
    const type = document.createElement('span');
    type.className = 'result__type';
    type.textContent = types[hit.project_type] || hit.project_type;
    top.append(name, type);
    const line = document.createElement('p');
    line.className = 'result__line';
    line.textContent = hit.description;
    const meta = document.createElement('p');
    meta.className = 'result__meta';
    meta.textContent = `${nf.format(hit.downloads)} indirme · ${hit.author}`;
    a.append(top, line, meta);
    li.append(a);
    return li;
  };

  const render = (data, query) => {
    const hits = Array.isArray(data.hits) ? data.hits : [];
    const total = Number(data.total_hits) || 0;
    if (resultsList) {
      resultsList.replaceChildren(...(hits.length ? hits.map(row) : [messageRow('Bu aramada sonuç yok. Başka bir şey dene.')]));
    }
    if (resultsCount) resultsCount.textContent = `${nf.format(total)} sonuç`;
    if (status) status.textContent = `${hits.length} sonuç gösteriliyor; toplam ${nf.format(total)}.`;
    if (resultsAll) resultsAll.href = `https://modrinth.com/mods?q=${encodeURIComponent(query)}`;
  };

  const run = async (query) => {
    if (!search || !results || !resultsList) return;
    const id = ++seq;
    if (controller) controller.abort();
    controller = new AbortController();
    results.setAttribute('aria-busy', 'true');
    setState('aranıyor…');
    resultsList.replaceChildren(messageRow('Modrinth’ten sonuçlar geliyor…', 'loading'));
    try {
      const params = new URLSearchParams({ query, limit: String(LIMIT), index: 'relevance' });
      const response = await fetch(`${API}?${params}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json();
      if (id !== seq) return;
      render(data, query);
    } catch (error) {
      if (error.name === 'AbortError' || id !== seq) return;
      if (resultsList) resultsList.replaceChildren(messageRow('Modrinth’e ulaşılamadı. Bağlantını kontrol edip tekrar dene.', 'error'));
      setState('bağlantı hatası');
    } finally {
      if (id === seq) results.setAttribute('aria-busy', 'false');
    }
  };

  const queue = () => {
    clearTimeout(timer);
    timer = setTimeout(() => run(search.value.trim()), 280);
  };

  const searchForm = $('.search__form');

  if (search) {
    search.addEventListener('input', queue);
    if (searchForm) {
      searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        clearTimeout(timer);
        run(search.value.trim());
      });
    }
    $$('.example').forEach((button) => {
      button.addEventListener('click', () => {
        search.value = button.dataset.query || '';
        clearTimeout(timer);
        run(search.value.trim());
        search.focus();
      });
    });
    run(search.value.trim());
  }

  /* FAQ: one open card ------------------------------------------------- */
  const cards = $$('.qa');
  cards.forEach((card) => {
    card.addEventListener('toggle', () => {
      if (!card.open) return;
      cards.forEach((other) => {
        if (other !== card) other.open = false;
      });
    });
  });

  /* Section reveals ---------------------------------------------------- */
  const reveals = $$('[data-reveal]');
  reveals.forEach((element, index) => element.style.setProperty('--i', String(index % 5)));

  if (reduce.matches) {
    reveals.forEach((element) => element.classList.add('is-in'));
  } else if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((element) => observer.observe(element));
  } else {
    reveals.forEach((element) => element.classList.add('is-in'));
  }

})();
