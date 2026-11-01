/* Cookie / izin yonetici
 *
 * ONEMLI: Bu sitede su an HICBIR cerez, analitik, piksel, reklam kodu veya
 * ucuncu taraf izleme kodu yoktur. Bu dosya yalnizca:
 *   1) kullanicinin tercihini kaydetmek icin (localStorage, sunucuya GITMEZ),
 *   2) ileride bir izleme kodu eklendiginde onayi olmadan yuklenmesini engellemek
 *      icin bir "kapi" fonksiyonu sunar.
 *
 * Zorunlu olmayan herhangi bir izleme kodu eklenirse, ASAGIDAKI sekilde
 * kullanilmadan yuklenmemelidir:
 *
 *     <script>
 *       if (window.CookieConsent && CookieConsent.has('analytics')) {
 *         // ... analitik kodunu burada yukle ...
 *       }
 *     </script>
 */
(function () {
  'use strict';

  var KEY = 'cl_consent_v1';
  var DEFAULTS = { necessary: true, analytics: false, marketing: false, updated: null };
  var CATEGORIES = [
    { id: 'necessary', label: 'Zorunlu', locked: true,
      desc: 'Siteyi calistirmak icin gereklidir. Bu sitede zaten hicbir cerez kullanilmaz; bu kayit sadece tercihinizi hatirlamak icin tutulur.' },
    { id: 'analytics', label: 'Olcum / Analitik', locked: false,
      desc: 'Ziyaretci sayisi ve sayfa performansi gibi olculer. Su anda bu sitede analitik kodu YOKTUR; bu ayar ileride eklenecek olcumlere icindir.' },
    { id: 'marketing', label: 'Hedefleme / Reklam', locked: false,
      desc: 'Ilgi alaniniza gore reklam gosterimi. Su anda bu sitede reklam kodu YOKTUR ve reklam gosterilmez.' }
  ];

  function read() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed;
    } catch (e) { return null; }
  }

  function write(prefs) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({
        necessary: true,
        analytics: prefs.analytics === true,
        marketing: prefs.marketing === true,
        updated: new Date().toISOString(),
        version: 1
      }));
    } catch (e) { /* Gizli sekmede yazilamayabilir; sessizce gec. */ }
  }

  function clear() {
    try { window.localStorage.removeItem(KEY); } catch (e) {}
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  var panel = null;
  var banner = null;

  function buildBanner() {
    var wrap = el('div', 'consent');
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', 'Cerez tercihleri');

    var box = el('div', 'consent__box');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'false');
    box.setAttribute('aria-labelledby', 'consent-banner-title');
    box.setAttribute('aria-describedby', 'consent-banner-desc');

    var h = el('h2', 'consent__title', 'Cerez ve benzeri teknolojiler');
    h.id = 'consent-banner-title';

    var p = el('p', 'consent__desc');
    p.id = 'consent-banner-desc';
    p.innerHTML = 'Bu site <strong>çerez kullanmaz</strong> ve hiçbir analitik, ' +
      'piksel veya reklam kodu yüklemez. Yalnızca bu tercihinizi hatırlamak için tarayıcınızın ' +
      '<code>localStorage</code> alanına küçük bir kayıt yazılır; ' +
      'bu kayıt sunucuya gönderilmez.';

    var row = el('div', 'consent__actions');
    var bManage = el('button', 'btn btn--quiet btn--sm', 'Tercihlerimi yönet');
    bManage.type = 'button';
    bManage.addEventListener('click', function () { openPanel(); });
    var bOk = el('button', 'btn btn--sm', 'Anladım');
    bOk.type = 'button';
    bOk.addEventListener('click', function () { write({ analytics: false, marketing: false }); hideBanner(); });
    row.appendChild(bManage);
    row.appendChild(bOk);

    box.appendChild(h);
    box.appendChild(p);
    box.appendChild(row);
    wrap.appendChild(box);
    return wrap;
  }

  function buildPanel() {
    var wrap = el('div', 'consent__panel');
    var box = el('div', 'consent__dialog');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'consent-panel-title');

    var h = el('h2', 'consent__title', 'Çerez tercihlerinizi yönetin');
    h.id = 'consent-panel-title';

    var intro = el('p', 'consent__intro',
      'Bu sitede şu anda hiçbir çerez veya benzeri teknoloji çalışmıyor. Aşağıdaki ayarlar, ileride ' +
      'eklenebilecek isteğe bağlı araçlar için saklanır. "Zorunlu" kategorisi kapatılamaz; ancak bu ' +
      'sitede zorunlu çerez de bulunmuyor.');

    var list = el('div', 'consent__list');
    var inputs = {};
    CATEGORIES.forEach(function (c) {
      var row = el('div', 'consent__row');
      var head = el('div', 'consent__head');
      var left = el('div', 'consent__label');
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = 'consent-' + c.id;
      cb.className = 'consent__cb';
      if (c.locked) { cb.checked = true; cb.disabled = true; }
      var lab = el('label', '', c.label);
      lab.setAttribute('for', cb.id);
      if (c.locked) { lab.appendChild(el('span', 'tag', 'hep açık')); }
      left.appendChild(cb);
      left.appendChild(lab);
      head.appendChild(left);
      var desc = el('p', 'consent__desc--row', c.desc);
      row.appendChild(head);
      row.appendChild(desc);
      list.appendChild(row);
      inputs[c.id] = cb;
    });

    var note = el('p', 'consent__note');
    note.innerHTML = 'Kaydınız yalnızca bu tarayıcıda saklanır ve sunucuya gönderilmez. Tarayıcı verilerinizi silerek ' +
      'kaydı istediğiniz anda kaldırabilirsiniz. Ayrıntılar: <a href="cerez-politikasi.html">Çerez Politikası</a>.';

    var row = el('div', 'consent__foot');
    var leftBtns = el('div', 'consent__actions');
    var bReject = el('button', 'btn btn--quiet btn--sm', 'Tümünü kapat');
    bReject.type = 'button';
    bReject.addEventListener('click', function () {
      write({ analytics: false, marketing: false });
      closePanel();
      hideBanner();
    });
    var bAccept = el('button', 'btn btn--quiet btn--sm', 'Tümünü aç');
    bAccept.type = 'button';
    bAccept.addEventListener('click', function () {
      write({ analytics: true, marketing: true });
      closePanel();
      hideBanner();
    });
    leftBtns.appendChild(bReject);
    leftBtns.appendChild(bAccept);

    var bSave = el('button', 'btn btn--sm', 'Tercihlerimi kaydet');
    bSave.type = 'button';
    bSave.addEventListener('click', function () {
      write({
        analytics: inputs.analytics.checked,
        marketing: inputs.marketing.checked
      });
      closePanel();
      hideBanner();
    });

    row.appendChild(leftBtns);
    row.appendChild(bSave);

    box.appendChild(h);
    box.appendChild(intro);
    box.appendChild(list);
    box.appendChild(note);
    box.appendChild(row);
    wrap.appendChild(box);

    wrap.addEventListener('click', function (e) { if (e.target === wrap) closePanel(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && wrap.classList.contains('is-open')) closePanel();
    });

    return wrap;
  }

  function currentPrefs() {
    var stored = read();
    if (stored) return stored;
    return DEFAULTS;
  }

  function syncPanel() {
    var p = currentPrefs();
    document.getElementById('consent-necessary').checked = true;
    document.getElementById('consent-analytics').checked = p.analytics === true;
    document.getElementById('consent-marketing').checked = p.marketing === true;
  }

  function openPanel() {
    if (!panel) return;
    syncPanel();
    panel.classList.add('is-open');
    var first = document.getElementById('consent-analytics');
    if (first) first.focus();
  }

  function closePanel() {
    if (!panel) return;
    panel.classList.remove('is-open');
  }

  function hideBanner() {
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    banner = null;
    document.body.classList.remove('consent-open');
    document.documentElement.style.setProperty('--consent-h', '0px');
  }

  function showBanner() {
    if (read()) return;
    if (banner || !document.body) return;
    banner = buildBanner();
    document.body.appendChild(banner);
    document.body.classList.add('consent-open');
    var reserve = function () {
      document.documentElement.style.setProperty('--consent-h', banner ? banner.offsetHeight + 'px' : '0px');
    };
    reserve();
    window.addEventListener('resize', reserve, { passive: true });
  }

  // Genel API: baska kodlar tercihi okuyabilir.
  window.CookieConsent = {
    get: read,
    has: function (category) {
      var p = read();
      if (!p) return false;
      if (category === 'necessary') return true;
      return p[category] === true;
    },
    save: function (prefs) {
      write(prefs || {});
      hideBanner();
      return read();
    },
    reset: function () { clear(); },
    open: openPanel
  };

  function init() {
    panel = buildPanel();
    document.body.appendChild(panel);
    document.querySelectorAll('[data-consent-manage]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); openPanel(); });
    });
    showBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
