/* ════════════════════════════════════════════════════════════════
   Antares — main.js
   No frameworks, no dependencies. Every block below stands alone.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Contact channels. Fill in before going live. ─────────────── */
  var CONFIG = {
    endpoint: '',                    // URL that accepts POST application/json { night, contact }
    email: 'hello@useantares.com',   // mailbox on the domain; the form falls back to mailto
    whatsapp: '',                    // number in international format, digits only, e.g. '15551234567'
    instagram: ''                    // handle without @
  };

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* ── Content ──────────────────────────────────────────────────── */
  var OBJ = [
    { n: '01', cat: 'Dome / Main instrument', name: 'The Antares', desc: 'Our 600 mm telescope under a 6.5 m dome. Saturn’s rings look as if they were drawn with a pen.', stack: '600 mm · f/8 · Ritchey–Chrétien', url: 'useantares.com / telescope', cta: 'Book the dome' },
    { n: '02', cat: 'Pier / Astrophotography', name: 'The Imaging Pier', desc: 'Four concrete piers on the south ridge, each with power and a dew heater. Bring your camera or borrow ours.', stack: '4 piers · mounts on loan · processing room', url: 'useantares.com / pier', cta: 'Book a pier night' },
    { n: '03', cat: 'Rooms / Guesthouse', name: 'The Guesthouse', desc: 'Eight rooms with blackout shutters, warm floors and red night lights, so your eyes stay dark on the way back from the dome. Someone is always awake.', stack: '8 rooms · breakfast until noon', url: 'useantares.com / rooms', cta: 'Write to the house' },
    { n: '00', cat: 'Chart / Tonight', name: 'Tonight’s Sky', desc: 'Scorpius, with Antares at its heart, and the Moon worked out for today. Open it to see the darkest dates ahead.', stack: 'Moon · darkness · best dates', url: 'useantares.com / tonight', cta: 'Open tonight’s sky', self: true }
  ];

  var LAY = [
    { n: '01', name: 'Eye', title: 'The last 24 millimetres.', desc: 'Give your eyes thirty minutes of darkness and they become a different instrument. That is why every light here turns red after sunset.', stack: 'dark adaptation · 30 min · red light only', file: 'Layer 01 — the eye',
      code: 'pupil       7 mm, dark-adapted\nadaptation  30 min to full\nfaintest    magnitude 6.5\nnight light red only, after dusk' },
    { n: '02', name: 'Eyepiece', title: 'Where the image becomes yours.', desc: 'We change eyepieces through the night: wide fields for clusters and nebulae, high power for planets once the air settles.', stack: '13–49 mm · 98–369× · 82° field', file: 'Layer 02 — the eyepiece',
      code: 'focal       13 – 49 mm\nfield       82° apparent\npower       98× – 369×\nbest for    planets, double stars' },
    { n: '03', name: 'Mirror', title: 'Six hundred millimetres of patience.', desc: 'The Antares collects about 7,300 times more light than your eye. Its mirror is cleaned by hand and re-coated every five years.', stack: '600 mm · f/8 · Ritchey–Chrétien', file: 'Layer 03 — the mirror',
      code: 'diameter    600 mm\nfocal       4,800 mm · f/8\nlight       7,300 × your eye\nresolution  0.19″' },
    { n: '04', name: 'Dome', title: 'A room that turns with the sky.', desc: 'The 6.5 m dome follows the telescope, so the slit always faces your target. It opens after sunset, once the air inside matches the air outside.', stack: '6.5 m · 1.4 m slit · 360° in 2 min', file: 'Layer 04 — the dome',
      code: 'diameter    6.5 m\nslit        1.4 m\nrotation    360° in 2 min\nopens       when the air settles' },
    { n: '05', name: 'Atmosphere', title: 'The thin part of the sky.', desc: 'At 2,140 m about a fifth of the air is already below you. Steady air keeps stars as sharp points; astronomers call it seeing, and we measure it every night.', stack: '2,140 m · seeing 0.6–1.2″ · Bortle 1', file: 'Layer 05 — the atmosphere',
      code: 'altitude    2,140 m\nair below   ~22%\nseeing      0.6″ – 1.2″\nsky         21.9 mag/arcsec²' },
    { n: '06', name: 'Dust', title: 'Dust between the stars.', desc: 'On its way to us, Antares’ light skims the Rho Ophiuchi cloud, a nursery of young stars that glows gold, blue and red in long exposures.', stack: 'Rho Ophiuchi · ~460 light years away', file: 'Layer 06 — interstellar dust',
      code: 'cloud       Rho Ophiuchi\ndistance    ~460 ly\ncolours     gold, blue, red\nbest seen   long exposures' },
    { n: '07', name: 'Antares', title: 'Light that left 550 years ago.', desc: 'A red supergiant about 700 times wider than the Sun. The light you’ll see tonight set out when Leonardo da Vinci was still an apprentice in Florence.', stack: 'α Scorpii · red supergiant · ~550 ly', file: 'Layer 07 — Antares',
      code: 'name        α Scorpii\ntype        red supergiant\nradius      ~700 × the Sun\ndistance    ~550 ly\nsurface     ~3,600 K' }
  ];

  /* ── Helpers ──────────────────────────────────────────────────── */
  function bind(prefix, obj) {
    $$('[data-b^="' + prefix + '."]').forEach(function (el) {
      var v = obj[el.getAttribute('data-b').slice(prefix.length + 1)];
      if (v != null) el.textContent = v;
    });
  }

  // Soft content change: the text blurs out and comes back.
  var swapTimers = {};
  function swap(key, els, fn, instant) {
    clearTimeout(swapTimers[key]);
    if (instant || reduceMotion) { fn(); els.forEach(function (e) { e.classList.remove('swap'); }); return; }
    els.forEach(function (e) { e.classList.add('swap'); });
    swapTimers[key] = setTimeout(function () {
      fn();
      els.forEach(function (e) { e.classList.remove('swap'); });
    }, 320);
  }

  // Layer card: the label column in steel, figures in lilac.
  function facts(src) {
    return src.split('\n').map(function (line) {
      var m = /^(\S+(?: \S+)?)(\s+)(.*)$/.exec(line);
      if (!m) return esc(line);
      var value = esc(m[3]).replace(/(~?\d[\d,.]*)/g, '<span class="n">$1</span>');
      return '<span class="k">' + esc(m[1]) + '</span>' + m[2] + value;
    }).join('\n');
  }

  /* ── Header: the glass appears once you scroll ────────────────── */
  var header = $('[data-header]');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Reveal on scroll ─────────────────────────────────────────── */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ── Light on the glass follows the pointer ───────────────────── */
  if (finePointer && !reduceMotion) {
    $$('.glass').forEach(function (g) {
      g.addEventListener('pointermove', function (e) {
        var r = g.getBoundingClientRect();
        g.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        g.style.setProperty('--my', (e.clientY - r.top) + 'px');
        g.classList.add('lit');
      });
      g.addEventListener('pointerleave', function () { g.classList.remove('lit'); });
    });
  }

  /* ── Hero: tonight's programme ticks itself off ───────────────── */
  (function programme() {
    var term = $('[data-term]');
    if (!term || reduceMotion || getComputedStyle(term.parentNode).display === 'none') return;
    var typeEl = $('[data-type]', term);
    var steps = $$('[data-step]', term);
    var fin = $('[data-final]', term);
    var text = typeEl.textContent;
    typeEl.textContent = '';
    typeEl.classList.add('caret');
    steps.forEach(function (s) { s.textContent = '·'; s.classList.add('wait'); });
    fin.classList.add('hide');

    var t = 1900;
    for (var k = 1; k <= text.length; k++) {
      (function (k) { setTimeout(function () { typeEl.textContent = text.slice(0, k); }, t + k * 45); })(k);
    }
    t += text.length * 45 + 350;
    setTimeout(function () { typeEl.classList.remove('caret'); }, t);
    steps.forEach(function (s, i) {
      setTimeout(function () { s.textContent = '✓'; s.classList.remove('wait'); }, t + 300 + i * 420);
    });
    setTimeout(function () { fin.classList.remove('hide'); }, t + 300 + steps.length * 420 + 200);
  })();

  /* ── Tonight: the Moon and the darkest dates, worked out for today
     Low-precision Sun and Moon longitudes (the largest periodic terms):
     good to a few tenths of a degree, so phase dates land within the hour. */
  var SYNODIC = 29.530588853;
  var DAY = 86400000;
  var PHASES = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
  function rad(d) { return d * Math.PI / 180; }
  // Elongation of the Moon from the Sun, 0–360°: 0 new, 180 full.
  function elongation(ms) {
    var n = ms / DAY + 2440587.5 - 2451545.0;
    var g = rad(357.528 + 0.9856003 * n);
    var sun = 280.460 + 0.9856474 * n + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g);
    var Mm = rad(134.963 + 13.064993 * n);
    var D = rad(297.850 + 12.190749 * n);
    var F = rad(93.272 + 13.229350 * n);
    var moon = 218.316 + 13.176396 * n +
      6.289 * Math.sin(Mm) + 1.274 * Math.sin(2 * D - Mm) + 0.658 * Math.sin(2 * D) +
      0.214 * Math.sin(2 * Mm) - 0.186 * Math.sin(g) - 0.114 * Math.sin(2 * F) -
      0.059 * Math.sin(2 * D - 2 * Mm) - 0.057 * Math.sin(2 * D - g - Mm) + 0.053 * Math.sin(2 * D + Mm) +
      0.046 * Math.sin(2 * D - g) + 0.041 * Math.sin(g - Mm) - 0.035 * Math.sin(D) - 0.031 * Math.sin(g + Mm);
    return ((moon - sun) % 360 + 360) % 360;
  }
  // Next moment the elongation passes `target` (0 or 180), searched in 6-hour steps, then halved down to a minute.
  function nextPhase(ms, target) {
    function off(t) { return ((elongation(t) - target) % 360 + 540) % 360 - 180; }
    var a = ms, fa = off(a);
    for (var i = 0; i < 140; i++) {
      var b = a + DAY / 4, fb = off(b);
      if (fa < 0 && fb >= 0) {
        for (var k = 0; k < 20; k++) {
          var m = (a + b) / 2;
          if (off(m) < 0) a = m; else b = m;
        }
        return new Date(b);
      }
      a = b; fa = fb;
    }
    return new Date(ms + SYNODIC * DAY);
  }
  function moonFor(date) {
    var ms = date.getTime();
    var e = elongation(ms);
    var age = e / 360 * SYNODIC;
    var newMoon = nextPhase(ms, 0);
    var toNew = (newMoon.getTime() - ms) / DAY;
    var inWindow = age < 4 || toNew < 3;
    return {
      age: age,
      lit: (1 - Math.cos(rad(e))) / 2,
      phase: PHASES[Math.floor(e / 45 + 0.5) % 8],
      trend: age < 1 || toNew < 1 ? 'new' : Math.abs(e - 180) < 12 ? 'full' : e < 180 ? 'waxing' : 'waning',
      newMoon: newMoon,
      fullMoon: nextPhase(ms, 180),
      darkFrom: inWindow ? date : new Date(newMoon.getTime() - 3 * DAY),
      darkTo: inWindow && age < 4 ? new Date(ms + (4 - age) * DAY) : new Date(newMoon.getTime() + 4 * DAY),
      inWindow: inWindow
    };
  }
  function fmtDay(d) { return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }
  function goodFor(lit) {
    return lit < 0.3 ? 'galaxies and nebulae' : lit < 0.7 ? 'clusters and double stars' : 'the Moon and the planets';
  }

  var today = moonFor(new Date());
  var litPct = Math.round(today.lit * 100) + '%';
  function fill(sel, text) { $$(sel).forEach(function (el) { el.textContent = text; }); }
  fill('[data-moon-pct]', litPct);
  fill('[data-moon-trend]', today.trend);
  fill('[data-moon-foot]', litPct + ' · ' + today.trend);
  fill('[data-sky-moon]', 'Moon · ' + litPct);
  fill('[data-sky-new]', 'New moon · ' + fmtDay(today.newMoon));
  (function proof() {
    var el = $('[data-proof]');
    if (!el) return;
    el.textContent = 'tonight: Moon ' + litPct + ' lit — a night for ' + goodFor(today.lit) + '.';
    el.hidden = false;
  })();

  var hud = $('[data-hud]');
  var rowsEl = $('[data-metrics]');
  function renderTonight() {
    var m = moonFor(new Date());
    var rows = [
      ['Moon', Math.round(m.lit * 100) + '% lit'],
      ['Phase', m.phase],
      ['Moon age', m.age.toFixed(1) + ' days'],
      ['Next new moon', fmtDay(m.newMoon)],
      ['Next full moon', fmtDay(m.fullMoon)],
      ['Darkest nights', (m.inWindow ? 'now' : fmtDay(m.darkFrom)) + ' – ' + fmtDay(m.darkTo), true],
      ['Good for', goodFor(m.lit)],
      ['Antares light left', '≈ ' + (new Date().getFullYear() - 550)]
    ];
    rowsEl.innerHTML = rows.map(function (r) {
      return '<dt>' + esc(r[0]) + '</dt><dd' + (r[2] ? ' class="good"' : '') + '>' + esc(r[1]) + '</dd>';
    }).join('');
  }

  function isTonight() { return root.classList.contains('tonight'); }
  function setTonight(on) {
    root.classList.toggle('tonight', on);
    $$('[data-tonight-toggle]').forEach(function (b) { b.setAttribute('aria-pressed', String(on)); });
    hud.hidden = !on;
    if (on) renderTonight();
    updateEnterLabel();
  }
  $$('[data-tonight-toggle]').forEach(function (b) {
    b.addEventListener('click', function () { setTonight(!isTonight()); });
  });

  /* ── 03 Grounds ───────────────────────────────────────────────── */
  var objCard = $('.obj-card');
  var objPreview = $('.obj-preview');
  var objIdx = 0;
  var enterLink = $('[data-obj-enter]');
  function updateEnterLabel() {
    var label = $('[data-enter-label]');
    if (!label) return;
    label.textContent = OBJ[objIdx].self && isTonight() ? 'Close tonight’s sky' : OBJ[objIdx].cta;
  }
  function setObj(i) {
    objIdx = i;
    swap('obj', [objCard, objPreview], function () { bind('cur', OBJ[i]); updateEnterLabel(); });
    $$('[data-preview]').forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-preview') === String(i)); });
    $$('[data-pick^="obj:"]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-pick') === 'obj:' + i));
    });
  }
  if (enterLink) {
    enterLink.addEventListener('click', function (e) {
      if (!OBJ[objIdx].self) return;
      e.preventDefault();
      setTonight(!isTonight());
    });
  }

  /* ── 04 Eye to star: seven layers ─────────────────────────────── */
  var plates = $$('[data-plate]');
  var codeBox = $('.code');
  var codeEl = $('[data-code] code');
  var layerDetail = $('.layer-detail');
  var layerIdx = 0;
  var layerAuto = !reduceMotion;
  function setLayer(i, instant) {
    layerIdx = i;
    plates.forEach(function (p, k) {
      p.classList.toggle('on', k === i);
      p.classList.toggle('above', k < i);
      p.classList.toggle('below', k > i);
    });
    swap('layer', [layerDetail, codeBox], function () {
      bind('layer', LAY[i]);
      codeEl.innerHTML = facts(LAY[i].code);
    }, instant);
    $$('[data-pick^="layer:"]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-pick') === 'layer:' + i));
    });
  }
  setLayer(0, true);

  // While the section is on screen and nobody has picked a layer, they open by themselves.
  (function autoLayers() {
    var section = $('#sky');
    if (!layerAuto || !section || !('IntersectionObserver' in window)) return;
    var timer = null;
    function tick() { if (layerAuto) setLayer((layerIdx + 1) % LAY.length); }
    new IntersectionObserver(function (entries) {
      var visible = entries[0].isIntersecting;
      clearInterval(timer);
      if (visible && layerAuto) timer = setInterval(tick, 5200);
    }, { threshold: 0.45 }).observe(section);
    section.addEventListener('pointerdown', function () { layerAuto = false; clearInterval(timer); });
    section.addEventListener('keydown', function () { layerAuto = false; clearInterval(timer); });
  })();

  // The stack tilts a little after the pointer.
  (function tilt() {
    var area = $('[data-stack-area]');
    var stack = $('[data-stack]');
    if (!area || !stack || !finePointer || reduceMotion) return;
    area.addEventListener('pointermove', function (e) {
      var r = area.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - 0.5;
      var dy = (e.clientY - r.top) / r.height - 0.5;
      stack.style.setProperty('--tz', (dx * 10).toFixed(2) + 'deg');
      stack.style.setProperty('--tx', (-dy * 8).toFixed(2) + 'deg');
    });
    area.addEventListener('pointerleave', function () {
      stack.style.setProperty('--tz', '0deg');
      stack.style.setProperty('--tx', '0deg');
    });
  })();

  doc.addEventListener('click', function (e) {
    var b = e.target.closest('[data-pick]');
    if (!b) return;
    var p = b.getAttribute('data-pick').split(':');
    if (p[0] === 'obj') setObj(+p[1]);
    else { layerAuto = false; setLayer(+p[1]); }
  });

  /* ── Menu: also on ⌘K / Ctrl+K ────────────────────────────────── */
  var palette = $('[data-palette]');
  var pInput = $('[data-palette-input]');
  var pList = $('[data-palette-list]');
  var lastFocus = null;
  var pItems = [];
  var pSel = 0;

  function go(hash) {
    var target = $(hash);
    if (!target) return;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    if (history.replaceState) history.replaceState(null, '', hash);
    // Focus follows the scroll so the keyboard carries on from the right place.
    var first = $('#bk-when');
    var focusTarget = hash === '#book' ? first : target;
    if (focusTarget !== first && !focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
    setTimeout(function () { focusTarget.focus({ preventScroll: true }); }, reduceMotion ? 0 : 700);
  }

  function commands() {
    var list = [
      { g: 'Sections', label: 'Home', hint: '01', k: 'start top arrival', run: function () { go('#top'); } },
      { g: 'Sections', label: 'Nights and prices', hint: 'from $320', k: 'packages stay observing astrophotography retreat family private price', run: function () { go('#nights'); } },
      { g: 'Sections', label: 'The Observatory', hint: '02', k: 'about dome telescope rooms kitchen astronomer', run: function () { go('#observatory'); } },
      { g: 'Sections', label: 'The Grounds', hint: '03', k: 'telescope pier guesthouse rooms chart places', run: function () { go('#grounds'); } },
      { g: 'Sections', label: 'Eye to star', hint: '04', k: 'layers mirror eyepiece atmosphere dust antares light', run: function () { go('#sky'); } },
      { g: 'Sections', label: 'How a night goes', hint: '05', k: 'programme schedule dinner briefing breakfast', run: function () { go('#your-night'); } },
      { g: 'Sections', label: 'House rules', hint: '06', k: 'rules dark sky clouds rebook quiet', run: function () { go('#rules'); } },
      { g: 'Sections', label: 'Book a night', hint: '07', k: 'book booking reserve request contact', run: function () { go('#book'); } },
      { g: 'Tonight', label: isTonight() ? 'Close tonight’s sky' : 'Tonight’s sky — Moon and darkest dates', hint: 'T', k: 'moon phase new moon dark dates weather sky', run: function () { setTonight(!isTonight()); } }
    ];
    if (CONFIG.email) list.push({ g: 'Contact', label: 'Copy our email', hint: CONFIG.email, k: 'email mail contact', run: function () { if (navigator.clipboard) navigator.clipboard.writeText(CONFIG.email); } });
    if (CONFIG.whatsapp) list.push({ g: 'Contact', label: 'Message us on WhatsApp', hint: '+' + CONFIG.whatsapp, k: 'whatsapp message chat', run: function () { window.open('https://wa.me/' + CONFIG.whatsapp, '_blank', 'noopener'); } });
    if (CONFIG.instagram) list.push({ g: 'Contact', label: 'Night photos on Instagram', hint: '@' + CONFIG.instagram, k: 'instagram photos', run: function () { window.open('https://instagram.com/' + CONFIG.instagram, '_blank', 'noopener'); } });
    return list;
  }

  function renderPalette() {
    var q = pInput.value.trim().toLowerCase();
    pItems = commands().filter(function (c) { return !q || (c.label + ' ' + c.k + ' ' + c.hint).toLowerCase().indexOf(q) !== -1; });
    if (pSel >= pItems.length) pSel = 0;
    var html = '', group = '';
    pItems.forEach(function (c, i) {
      if (c.g !== group) { group = c.g; html += '<li class="grp" role="presentation">' + esc(group) + '</li>'; }
      html += '<li role="option" id="pal-' + i + '" data-i="' + i + '" aria-selected="' + (i === pSel) + '"><span>' + esc(c.label) + '</span><span class="mono">' + esc(c.hint) + '</span></li>';
    });
    pList.innerHTML = html || '<li class="empty" role="presentation">Nothing found. Try “dome” or “book”.</li>';
    if (pItems.length) pInput.setAttribute('aria-activedescendant', 'pal-' + pSel);
    else pInput.removeAttribute('aria-activedescendant');
  }
  function select(i) {
    if (!pItems.length) return;
    pSel = (i + pItems.length) % pItems.length;
    $$('[role="option"]', pList).forEach(function (o) { o.setAttribute('aria-selected', String(+o.getAttribute('data-i') === pSel)); });
    pInput.setAttribute('aria-activedescendant', 'pal-' + pSel);
    var cur = $('#pal-' + pSel);
    if (cur) cur.scrollIntoView({ block: 'nearest' });
  }
  function runSelected(i) {
    var c = pItems[i];
    if (!c) return;
    closePalette(true);
    c.run();
  }
  function openPalette() {
    if (!palette.hidden) return;
    lastFocus = doc.activeElement;
    pInput.value = '';
    pSel = 0;
    renderPalette();
    palette.hidden = false;
    pInput.focus();
  }
  function closePalette(skipFocus) {
    if (palette.hidden) return;
    palette.hidden = true;
    if (!skipFocus && lastFocus && lastFocus.focus) lastFocus.focus();
  }

  $$('[data-palette-open]').forEach(function (b) { b.addEventListener('click', openPalette); });
  $$('[data-palette-close]').forEach(function (b) { b.addEventListener('click', function () { closePalette(); }); });
  pInput.addEventListener('input', function () { pSel = 0; renderPalette(); });
  pInput.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); select(pSel + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); select(pSel - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); runSelected(pSel); }
    else if (e.key === 'Tab') { e.preventDefault(); select(pSel + (e.shiftKey ? -1 : 1)); }
  });
  pList.addEventListener('pointermove', function (e) {
    var o = e.target.closest('[role="option"]');
    if (o && +o.getAttribute('data-i') !== pSel) select(+o.getAttribute('data-i'));
  });
  pList.addEventListener('click', function (e) {
    var o = e.target.closest('[role="option"]');
    if (o) runSelected(+o.getAttribute('data-i'));
  });

  doc.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K' || e.key === 'л' || e.key === 'Л')) {
      e.preventDefault();
      if (palette.hidden) openPalette(); else closePalette();
      return;
    }
    if (e.key === 'Escape') {
      if (!palette.hidden) closePalette();
      else if (isTonight()) setTonight(false);
      return;
    }
    var t = e.target;
    var typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if (typing || e.metaKey || e.ctrlKey || e.altKey || !palette.hidden) return;
    if (e.key === 't' || e.key === 'T' || e.key === 'е' || e.key === 'Е') setTonight(!isTonight());
  });

  /* ── 07 Book: the request, as it will arrive ──────────────────── */
  (function bookForm() {
    var form = $('[data-enter]');
    if (!form) return;
    var reqEl = $('[data-req]', form);
    var statusEl = $('[data-status]', form);
    var btn = $('button[type="submit"]', form);

    function payload() { return { night: form.night.value.trim(), contact: form.contact.value.trim() }; }
    function renderReq() {
      var p = payload();
      reqEl.innerHTML = '<span class="k">Request ·</span> ' + esc(p.night || '—') + '\n<span class="k">Reply to ·</span> ' + esc(p.contact || '—');
    }
    function say(msg) { statusEl.textContent = msg; }

    form.addEventListener('input', function (e) {
      if (e.target.value.trim()) e.target.removeAttribute('aria-invalid');
      renderReq();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var p = payload();
      var firstBad = null;
      [form.night, form.contact].forEach(function (f) {
        if (!f.value.trim()) { f.setAttribute('aria-invalid', 'true'); firstBad = firstBad || f; }
      });
      if (firstBad) { firstBad.focus(); say('We need both lines: your night and how to reach you.'); return; }

      if (CONFIG.endpoint) {
        btn.disabled = true;
        say('Sending…');
        fetch(CONFIG.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) })
          .then(function (r) {
            if (!r.ok) throw new Error(String(r.status));
            say('Received. We’ll write back within a day.');
            form.reset();
            renderReq();
          })
          .catch(function () { say('That didn’t go through. ' + (CONFIG.email ? 'Write to ' + CONFIG.email + '.' : 'Please try again.')); })
          .then(function () { btn.disabled = false; });
      } else if (CONFIG.email) {
        location.href = 'mailto:' + CONFIG.email + '?subject=' + encodeURIComponent('Night request — ' + p.night.slice(0, 80)) + '&body=' + encodeURIComponent(p.night + '\n\nReply to: ' + p.contact);
        say('Opening your email… If nothing opens, write to ' + CONFIG.email + '.');
      } else if (CONFIG.whatsapp) {
        window.open('https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(p.night + ' — ' + p.contact), '_blank', 'noopener');
        say('Opening WhatsApp…');
      } else {
        say('Booking opens soon.');
      }
    });
    renderReq();
  })();

  /* ── Footer links ─────────────────────────────────────────────── */
  var links = {
    instagram: CONFIG.instagram && 'https://instagram.com/' + CONFIG.instagram,
    whatsapp: CONFIG.whatsapp && 'https://wa.me/' + CONFIG.whatsapp,
    email: CONFIG.email && 'mailto:' + CONFIG.email
  };
  $$('[data-link]').forEach(function (a) {
    var href = links[a.getAttribute('data-link')];
    if (href) { a.href = href; if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; } }
  });

  /* ── Background: star trails ──────────────────────────────────────
     A long exposure of the sky above the dome, drawn on canvas: every
     star leaves the same arc around the celestial pole. The exposure
     builds up on load, the sky keeps turning slowly and turns further
     as you scroll down through the night. Static with reduced motion;
     without JS the still image underneath stays. */
  (function trails() {
    var cv = $('[data-sky]');
    var cx = cv && cv.getContext && cv.getContext('2d');
    if (!cx) return;
    var BG = '#FAF8F4';
    var INK = [
      { c: '79, 113, 132', p: 0.62 },   // steel
      { c: '127, 160, 178', p: 0.22 },  // glacier
      { c: '15, 27, 36', p: 0.11 },     // the bright ones
      { c: '201, 120, 92', p: 0.05 }    // red giants, like Antares
    ];
    var EXPOSURE = 0.42;     // radians of sky rotation captured in each trail
    var SPIN = 0.0035;       // radians per second while you watch
    var SCROLL = 0.00022;    // radians per pixel scrolled
    var W = 0, H = 0, dpr = 1, pole = { x: 0, y: 0 }, rFar = 1, buckets = [], drawn = { rot: -1, len: -1 };
    var t0 = performance.now(), meteor = null, nextMeteor = t0 + 9000;

    function rand(seed) { return function () { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; }; }
    function build() {
      var r = rand(550);
      // the south celestial pole sits just above the top right corner
      pole.x = W * 0.84; pole.y = -H * 0.12;
      var rNear = Math.max(40, -pole.y);
      rFar = Math.hypot(pole.x, H - pole.y) + 40;
      var n = Math.round(Math.min(1100, Math.max(380, W * H / 1500)));
      var map = {};
      buckets = [];
      for (var i = 0; i < n; i++) {
        var rad = Math.sqrt(r() * (rFar * rFar - rNear * rNear) + rNear * rNear);
        var mag = Math.pow(r(), 3.2);
        var pick = r(), k = 0, acc = INK[0].p;
        while (pick > acc && k < INK.length - 1) acc += INK[++k].p;
        var alpha = Math.round((0.07 + mag * 0.27) * 20) / 20;
        var width = Math.round((0.55 + mag * 1.2) * 4) / 4;
        var key = k + '|' + alpha + '|' + width;
        if (!map[key]) { map[key] = { style: 'rgba(' + INK[k].c + ',' + alpha + ')', width: width, arcs: [] }; buckets.push(map[key]); }
        map[key].arcs.push(rad, r() * Math.PI * 2);
      }
    }
    function resize() {
      W = window.innerWidth || 1440;
      H = window.innerHeight || 900;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      build();
      drawn.rot = -1;
      draw(performance.now());
    }
    function draw(now) {
      var t = (now - t0) / 1000;
      var grow = reduceMotion ? 1 : Math.min(1, t / 5.5);
      grow = 1 - Math.pow(1 - grow, 3);
      var rot = reduceMotion ? 0 : t * SPIN + (window.scrollY || 0) * SCROLL;
      var len = Math.max(0.004, EXPOSURE * grow);
      // Skip frames where nothing would move by more than a third of a pixel.
      if (!meteor && Math.abs(rot - drawn.rot) * rFar < 0.35 && len === drawn.len && now <= nextMeteor) return;
      drawn.rot = rot; drawn.len = len;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx.fillStyle = BG;
      cx.fillRect(0, 0, W, H);
      cx.lineCap = 'round';
      for (var b = 0; b < buckets.length; b++) {
        var bk = buckets[b], a = bk.arcs;
        cx.strokeStyle = bk.style;
        cx.lineWidth = bk.width;
        cx.beginPath();
        for (var i = 0; i < a.length; i += 2) {
          var s = a[i + 1] + rot;
          cx.moveTo(pole.x + a[i] * Math.cos(s), pole.y + a[i] * Math.sin(s));
          cx.arc(pole.x, pole.y, a[i], s, s + len);
        }
        cx.stroke();
      }
      if (meteor) drawMeteor(now);
      else if (!reduceMotion && now > nextMeteor) {
        var m = rand(Math.floor(now) + 7);
        meteor = { x: W * (0.15 + 0.7 * m()), y: H * (0.08 + 0.4 * m()), a: 0.35 + 0.5 * m(), born: now };
      }
    }
    // Now and then a meteor: a short bright streak that fades in under a second.
    function drawMeteor(now) {
      var k = (now - meteor.born) / 900;
      if (k >= 1) { meteor = null; nextMeteor = now + 25000 + Math.random() * 35000; return; }
      var len = 140, head = Math.min(1, k * 1.6) * len;
      var x1 = meteor.x + Math.cos(meteor.a) * head, y1 = meteor.y + Math.sin(meteor.a) * head;
      var g = cx.createLinearGradient(meteor.x, meteor.y, x1, y1);
      g.addColorStop(0, 'rgba(79, 113, 132, 0)');
      g.addColorStop(1, 'rgba(79, 113, 132, ' + (0.55 * (1 - k)).toFixed(3) + ')');
      cx.strokeStyle = g;
      cx.lineWidth = 1.2;
      cx.beginPath();
      cx.moveTo(meteor.x, meteor.y);
      cx.lineTo(x1, y1);
      cx.stroke();
    }

    window.addEventListener('resize', resize);
    resize();
    cv.classList.add('on');
    if (reduceMotion) return;
    var loop = function (now) { if (!doc.hidden) draw(now); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  })();

  /* ── For whoever opened the console ───────────────────────────── */
  if (window.console && console.log) {
    console.log(
      '%cANTARES%c  α Scorpii · 550 light years\n\n%cStill up? Press T for tonight’s sky.\nuseantares.com',
      'font: 500 22px Georgia, serif; letter-spacing: .12em; color: #4F7184',
      'font: 400 10px monospace; letter-spacing: .2em; color: #6F8796',
      'font: 400 12px/1.6 monospace; color: #6F8796'
    );
  }
})();
