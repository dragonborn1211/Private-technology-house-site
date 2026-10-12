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

  /* ── Background: light moving through ice ─────────────────────────
     A WebGL field of caustics on milk. The light drifts by itself and
     leans towards the pointer. Static when motion is reduced; the frost
     image underneath stays if WebGL is not available. */
  (function sky() {
    var glc = $('[data-sky-gl]');
    if (!glc) return;
    var FRAG = [
      '#ifdef GL_FRAGMENT_PRECISION_HIGH',
      'precision highp float;',
      '#else',
      'precision mediump float;',
      '#endif',
      'uniform vec2 uRes;uniform float uScale;uniform float uTime;uniform vec3 uBase;uniform vec2 uMouse;uniform float uAmt;uniform float uScroll;',
      'vec2 h2(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return fract(sin(p)*43758.5453);}',
      'float h1(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}',
      'float vn(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);',
      'float a=h1(i);float b=h1(i+vec2(1.0,0.0));float c=h1(i+vec2(0.0,1.0));float d=h1(i+vec2(1.0,1.0));',
      'return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}',
      'float edge(vec2 x,float t){vec2 n=floor(x);vec2 f=fract(x);float d1=8.0;float d2=8.0;',
      'for(int j=-1;j<=1;j++){for(int i=-1;i<=1;i++){',
      'vec2 g=vec2(float(i),float(j));vec2 o=h2(n+g);o=0.5+0.42*sin(t+6.2831*o);',
      'vec2 r=g+o-f;float d=dot(r,r);',
      'if(d<d1){d2=d1;d1=d;}else if(d<d2){d2=d;}}}',
      'return sqrt(d2)-sqrt(d1);}',
      'void main(){',
      'vec2 px=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uScale;',
      'float t=uTime;',
      'vec2 dm=px-uMouse;',
      'float lens=exp(-dot(dm,dm)/39200.0);',
      'px-=dm*0.12*lens;',
      'vec2 sp=px+vec2(0.0,uScroll*0.18);',
      'vec2 p=sp/230.0;',
      'p+=0.20*vec2(sin(p.y*1.3+t*0.32),cos(p.x*1.1-t*0.27));',
      'float e1=edge(p,t*0.50);',
      'float e2=edge(p*1.7+vec2(3.1,1.7),t*0.68+1.3);',
      'float l1=1.0-smoothstep(0.0,0.09,e1);',
      'float l2=1.0-smoothstep(0.0,0.075,e2);',
      'float c=max(l1,l2*0.75);',
      'c=c*c*(3.0-2.0*c);',
      'float halo=(1.0-smoothstep(0.0,0.34,e1))*0.5+(1.0-smoothstep(0.0,0.28,e2))*0.3;',
      'vec2 q=sp/900.0;',
      'float pool=vn(q*1.2+vec2(t*0.020,-t*0.015))*0.65+vn(q*2.6-vec2(t*0.030,t*0.010))*0.35;',
      'pool=smoothstep(0.30,0.85,pool);',
      'vec3 frost=vec3(0.894,0.929,0.949);',
      'vec3 glacier=vec3(0.737,0.827,0.871);',
      'float a=uAmt;',
      'vec3 col=mix(uBase,frost,clamp(0.70*pool*a,0.0,1.0));',
      'col=mix(col,glacier,clamp(0.32*pool*pool*a,0.0,1.0));',
      'col=mix(col,glacier,clamp(smoothstep(0.18,0.60,e1)*0.10*pool*a,0.0,1.0));',
      'col=mix(col,vec3(1.0),clamp((c*0.85+halo*0.20)*pool*a,0.0,1.0));',
      'col=mix(col,vec3(1.0),clamp(c*0.22*(1.0-pool)*a,0.0,1.0));',
      'col=mix(col,vec3(1.0),lens*0.12);',
      'gl_FragColor=vec4(col,1.0);',
      '}'
    ].join('\n');

    var gl = null, u = {};
    try {
      gl = glc.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power' }) || glc.getContext('experimental-webgl');
    } catch (e) { gl = null; }
    if (!gl) { glc.style.display = 'none'; return; }
    function mk(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    }
    var v = mk(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}');
    var f = mk(gl.FRAGMENT_SHADER, FRAG);
    var pr = v && f && gl.createProgram();
    if (pr) { gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr); }
    if (!pr || !gl.getProgramParameter(pr, gl.LINK_STATUS)) { glc.style.display = 'none'; return; }
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ['uRes', 'uScale', 'uTime', 'uBase', 'uMouse', 'uAmt', 'uScroll'].forEach(function (n) { u[n] = gl.getUniformLocation(pr, n); });
    gl.uniform3f(u.uBase, 0.980, 0.973, 0.957);
    gl.uniform1f(u.uAmt, 0.9);
    glc.classList.add('on');

    var W = 1440, H = 900, sc = 0.6;
    var t0 = performance.now(), prev = t0;
    var mouse = { x: -9999, y: -9999, last: -1e9, touch: false };
    var light = { x: (window.innerWidth || 1440) * 0.62, y: (window.innerHeight || 900) * 0.32 };

    function resize() {
      W = window.innerWidth || 1440;
      H = window.innerHeight || 900;
      var s = W < 700 ? 0.5 : 0.6;
      var cap = 1300000;
      if (W * H * s * s > cap) s = Math.sqrt(cap / (W * H));
      glc.width = Math.max(1, Math.round(W * s));
      glc.height = Math.max(1, Math.round(H * s));
      sc = glc.width / W;
      if (reduceMotion) frame(performance.now());
    }
    function frame(now) {
      var dt = Math.min(0.05, Math.max(0, (now - prev) / 1000));
      prev = now;
      var t = (now - t0) / 1000;
      var idle = now - mouse.last > (mouse.touch ? 1400 : 2600);
      var tx = idle ? W * (0.5 + 0.38 * Math.sin(t * 0.21)) : mouse.x;
      var ty = idle ? H * (0.42 + 0.30 * Math.sin(t * 0.16 + 1.2)) : mouse.y;
      var k = reduceMotion ? 1 : 1 - Math.exp(-dt * (idle ? 1.4 : 7));
      light.x += (tx - light.x) * k;
      light.y += (ty - light.y) * k;
      gl.viewport(0, 0, glc.width, glc.height);
      gl.uniform2f(u.uRes, glc.width, glc.height);
      gl.uniform1f(u.uScale, sc);
      gl.uniform1f(u.uTime, reduceMotion ? 12 : t % 1200);
      gl.uniform2f(u.uMouse, light.x, light.y);
      gl.uniform1f(u.uScroll, window.scrollY || 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function onMove(e) {
      mouse.x = e.clientX; mouse.y = e.clientY;
      mouse.last = performance.now();
      mouse.touch = e.pointerType === 'touch';
    }
    if (!reduceMotion) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerdown', onMove, { passive: true });
    }
    window.addEventListener('resize', resize);
    resize();
    frame(performance.now());
    if (!reduceMotion) {
      var loop = function (now) { frame(now); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
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
