/* =====================================================================
   Химчистка · страница клиента
   Две картинки на одном адресе: калькулятор с заявкой и статус заявки
   по ссылке index.html#r=<номер>. Всё рисуется из config.js.
   ===================================================================== */

(function () {
  var C = HC.config, store = HC.store, money = HC.money;
  var app = document.getElementById('app');
  var settings = {};

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function telHref(p) { return 'tel:+' + String(p || '').replace(/\D/g, '').replace(/^8/, '7'); }
  function plural(n, f) { var a = n % 10, b = n % 100; return f[a === 1 && b !== 11 ? 0 : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? 1 : 2]; }

  document.documentElement.style.setProperty('--accent', C.brand.accent || '#0F8B6F');

  // ----- Иконки мебели (свои рисунки, обводка currentColor) -----
  var ICO = {
    sofa: '<path d="M8 22v-6a5 5 0 0 1 5-5h38a5 5 0 0 1 5 5v6"/><path d="M4 26a4 4 0 0 1 8 0v4h40v-4a4 4 0 0 1 8 0v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/><path d="M12 30v-2a3 3 0 0 1 3-3h34a3 3 0 0 1 3 3v2M32 25v5M10 41v4M54 41v4"/>',
    armchair: '<path d="M18 22v-7a5 5 0 0 1 5-5h18a5 5 0 0 1 5 5v7"/><path d="M12 26a4 4 0 0 1 8 0v4h24v-4a4 4 0 0 1 8 0v12a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3z"/><path d="M20 30v-3a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v3M18 41v4M46 41v4"/>',
    mattress: '<rect x="6" y="18" width="52" height="16" rx="5"/><path d="M6 26h52M16 18v16M48 18v16"/><path d="M10 34v4M54 34v4"/><circle cx="24" cy="22" r="1"/><circle cx="32" cy="22" r="1"/><circle cx="40" cy="22" r="1"/>',
    stool: '<path d="M20 8h24a3 3 0 0 1 3 3v12H17V11a3 3 0 0 1 3-3z"/><rect x="14" y="23" width="36" height="7" rx="3"/><path d="M19 30l-3 15M45 30l3 15M22 38h20"/>',
    pouf: '<path d="M14 18c0-4 8-6 18-6s18 2 18 6v14c0 4-8 6-18 6s-18-2-18-6z"/><path d="M14 18c0 4 8 6 18 6s18-2 18-6M32 24v14"/><path d="M18 38l-1 5M46 38l1 5"/>',
    carpet: '<path d="M10 12h44v30H10z"/><path d="M16 18h32v18H16z"/><path d="M32 20l6 7-6 7-6-7z"/><path d="M10 42v4M16 42v4M22 42v4M28 42v4M34 42v4M40 42v4M46 42v4M52 42v4"/>',
  };
  // ----- Цветные иллюстрации мебели для калькулятора -----
  // .f — ткань, .fl — светлая сторона, .fd — тень; цвет ткани задаёт --fab у карточки.
  var FURN = {
    sofa: '<rect class="f" x="18" y="14" width="84" height="34" rx="11"/><rect class="fd" x="7" y="32" width="22" height="31" rx="10"/><rect class="fd" x="91" y="32" width="22" height="31" rx="10"/><rect class="fl" x="24" y="40" width="72" height="22" rx="8"/><path class="st" d="M60 18v26M60 42v18"/><rect class="w" x="22" y="63" width="5" height="9" rx="2"/><rect class="w" x="93" y="63" width="5" height="9" rx="2"/>',
    armchair: '<rect class="f" x="34" y="8" width="52" height="40" rx="14"/><rect class="fd" x="22" y="32" width="20" height="31" rx="10"/><rect class="fd" x="78" y="32" width="20" height="31" rx="10"/><rect class="fl" x="38" y="42" width="44" height="21" rx="8"/><path class="st" d="M44 16h32"/><rect class="w" x="34" y="63" width="5" height="9" rx="2"/><rect class="w" x="81" y="63" width="5" height="9" rx="2"/>',
    mattress: '<path class="fl" d="M24 26h80l-8 12H16z"/><rect class="f" x="16" y="38" width="80" height="24" rx="6"/><path class="fd" d="M96 38l8-12v22l-8 14z"/><path class="st" d="M22 50h68"/><circle class="k" cx="36" cy="32" r="1.6"/><circle class="k" cx="56" cy="32" r="1.6"/><circle class="k" cx="76" cy="32" r="1.6"/>',
    stool: '<rect class="f" x="40" y="6" width="40" height="32" rx="10"/><rect class="fl" x="32" y="36" width="56" height="13" rx="6"/><path class="st" d="M46 14h28"/><path class="wl" d="M40 49l-4 23M80 49l4 23M38 64h44"/>',
    pouf: '<path class="f" d="M26 34v20c0 7 15 12 34 12s34-5 34-12V34z"/><ellipse class="fl" cx="60" cy="34" rx="34" ry="12"/><circle class="k" cx="60" cy="34" r="2.2"/><circle class="k" cx="44" cy="32" r="1.6"/><circle class="k" cx="76" cy="32" r="1.6"/><path class="st" d="M27 52c8 6 58 6 66 0"/><rect class="w" x="34" y="64" width="5" height="7" rx="2"/><rect class="w" x="81" y="64" width="5" height="7" rx="2"/>',
    carpet: '<path class="f" d="M28 20h76l-14 46H14z"/><path class="fl" d="M35 26h61l-10 34H24z"/><path class="fd" d="M60 30l9 13-9 13-9-13z"/><path class="wl" d="M16 66l-2 6M26 66l-2 6M36 66l-2 6M46 66l-2 6M56 66l-2 6M66 66l-2 6M76 66l-2 6M86 66l-2 6"/>',
  };
  var FAB = { sofa: '#2E7D6B', armchair: '#C9973F', mattress: '#4D6FC9', stool: '#B24E68', pouf: '#7356B8', carpet: '#B8643A' };
  // Пятна и пыль — только на «грязной» копии
  var DUST = '<g class="dust"><ellipse cx="44" cy="30" rx="9" ry="4"/><ellipse cx="74" cy="50" rx="11" ry="4"/><ellipse cx="88" cy="22" rx="5" ry="3"/><circle cx="36" cy="54" r="3"/></g>';
  function furn(name) {
    var body = FURN[name] || FURN.sofa;
    var svg = function (cls, extra) { return '<svg class="art ' + cls + '" viewBox="0 0 120 80" aria-hidden="true"><ellipse class="sh" cx="60" cy="74" rx="50" ry="5"/>' + body + (extra || '') + '</svg>'; };
    return '<span class="item__art">' + svg('art--dusty', DUST) + svg('art--clean') + '<span class="foam"></span></span>';
  }

  var MARK ='<svg width="24" height="18" viewBox="0 0 64 48" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICO.sofa + '</svg>';
  var CAM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';

  // ----- Первый экран: диван, который клиент сам «отмывает» пальцем -----
  // Снизу чистый диван (SVG), сверху грязный слой на canvas — его стираем.
  var SOFA = { w: 440, h: 300, body: [[70, 64, 300, 116, 28], [28, 128, 74, 112, 28], [338, 128, 74, 112, 28], [86, 158, 268, 78, 20]], pillow: [118, 92, 76, 58, 18] };
  var STAINS = [[132, 196, 30, 13], [262, 118, 24, 15], [196, 214, 20, 9], [64, 176, 12, 22], [316, 202, 26, 11], [240, 186, 9, 7]];

  function sofaSvg() {
    var rr = function (r, fill) { return '<rect x="' + r[0] + '" y="' + r[1] + '" width="' + r[2] + '" height="' + r[3] + '" rx="' + r[4] + '" fill="' + fill + '"/>'; };
    var p = SOFA.pillow;
    return '<svg class="scrub__svg" viewBox="0 0 440 300" aria-hidden="true">' +
      '<defs><pattern id="hc-weave" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v6" stroke="#fff" stroke-opacity=".07" stroke-width="2"/></pattern>' +
      '<linearGradient id="hc-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient></defs>' +
      '<ellipse cx="220" cy="266" rx="196" ry="14" fill="rgb(0 0 0 / .3)"/>' +
      '<rect x="98" y="232" width="12" height="28" rx="4" fill="#3A2E26"/><rect x="330" y="232" width="12" height="28" rx="4" fill="#3A2E26"/>' +
      SOFA.body.map(function (r) { return rr(r, FAB.sofa) + rr(r, 'url(#hc-weave)') + rr(r, 'url(#hc-shade)'); }).join('') +
      // строчка-стежок — фирменная деталь
      '<g stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-dasharray="5 6" stroke-linecap="round" fill="none">' +
      '<path d="M220 74v96M220 166v62"/><rect x="96" y="168" width="248" height="58" rx="14"/></g>' +
      '<g transform="rotate(-9 ' + (p[0] + p[2] / 2) + ' ' + (p[1] + p[3] / 2) + ')">' + rr(p, '#F3E7D3') +
      '<rect x="' + (p[0] + 8) + '" y="' + (p[1] + 8) + '" width="' + (p[2] - 16) + '" height="' + (p[3] - 16) + '" rx="12" fill="none" stroke="#C9B48F" stroke-width="2" stroke-dasharray="5 6"/></g></svg>';
  }

  function heroArt() {
    return '<div class="scrub" id="scrub">' + sofaSvg() +
      '<canvas class="scrub__dirt" aria-label="Грязный диван: проведите по нему пальцем, чтобы почистить"></canvas>' +
      '<p class="scrub__hint" id="scrub-hint"><span class="scrub__hand" aria-hidden="true"></span>Проведите пальцем по дивану</p>' +
      '<p class="scrub__done" id="scrub-done" hidden>Так он будет выглядеть после выезда мастера. <a href="#calc">Посчитать цену для вашего</a></p></div>';
  }

  // Рисует грязный слой и даёт стирать его указателем; прогресс считаем по уменьшенной копии
  function initScrub() {
    var box = $('#scrub'); if (!box) return;
    var cv = $('canvas', box), ctx = cv.getContext('2d');
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var k = 1, base = 0, done = false, touched = false;
    var probe = document.createElement('canvas'); probe.width = 88; probe.height = 60;
    var pctx = probe.getContext('2d', { willReadFrequently: true });

    function path(r) { var p = new Path2D(); p.roundRect(r[0], r[1], r[2], r[3], r[4]); return p; }
    function paint() {
      var w = box.clientWidth, dpr = Math.min(window.devicePixelRatio || 1, 2);
      k = w / SOFA.w;
      cv.width = Math.round(w * dpr); cv.height = Math.round(SOFA.h * k * dpr);
      ctx.setTransform(k * dpr, 0, 0, k * dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#4A5370';
      for (var i = 0; i < SOFA.body.length; i++) ctx.fill(path(SOFA.body[i]));
      var p = SOFA.pillow;
      ctx.save(); ctx.translate(p[0] + p[2] / 2, p[1] + p[3] / 2); ctx.rotate(-9 * Math.PI / 180);
      ctx.fillStyle = '#5A6382'; ctx.fill(path([-p[2] / 2, -p[3] / 2, p[2], p[3], p[4]])); ctx.restore();
      ctx.fillStyle = 'rgba(20, 26, 44, .55)';
      for (var j = 0; j < STAINS.length; j++) { var s = STAINS[j]; ctx.beginPath(); ctx.ellipse(s[0], s[1], s[2], s[3], 0.3, 0, 7); ctx.fill(); }
      // шерсть и крошки
      ctx.strokeStyle = 'rgba(70, 60, 48, .35)'; ctx.lineWidth = 1.2;
      for (var h = 0; h < 26; h++) {
        var x = 100 + (h * 47) % 240, y = 90 + (h * 31) % 130;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 4, y - 3, x + 9, y + 1); ctx.stroke();
      }
      base = dirty(); done = false;
      box.classList.remove('is-clean');
    }
    function dirty() {
      pctx.clearRect(0, 0, 88, 60); pctx.drawImage(cv, 0, 0, 88, 60);
      var d = pctx.getImageData(0, 0, 88, 60).data, n = 0;
      for (var i = 3; i < d.length; i += 4) if (d[i] > 40) n++;
      return n;
    }
    var last = null;
    function rub(x, y) {
      ctx.globalCompositeOperation = 'destination-out';
      var r = 30;
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.6, 'rgba(0,0,0,.8)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      if (last) { // заполняем промежуток, чтобы быстрый жест не оставлял пропусков
        var dx = x - last[0], dy = y - last[1], steps = Math.ceil(Math.sqrt(dx * dx + dy * dy) / 8);
        for (var i = 1; i < steps; i++) { var ix = last[0] + dx * i / steps, iy = last[1] + dy * i / steps; ctx.beginPath(); ctx.arc(ix, iy, r, 0, 7); ctx.fill(); }
      }
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      last = [x, y];
    }
    var checkT = 0;
    function check() {
      if (done) return;
      var left = dirty() / (base || 1);
      if (left < 0.35) {
        done = true; box.classList.add('is-clean');
        $('#scrub-done').hidden = false;
      }
    }
    function at(e) { var b = cv.getBoundingClientRect(); return [(e.clientX - b.left) / k, (e.clientY - b.top) / k]; }
    var down = false;
    cv.addEventListener('pointerdown', function (e) { down = true; last = null; touched = true; box.classList.add('is-touched'); var p = at(e); rub(p[0], p[1]); });
    cv.addEventListener('pointermove', function (e) {
      if (!down && e.pointerType !== 'mouse') return;
      if (!down) { touched = true; box.classList.add('is-touched'); } // мышью можно тереть и без нажатия
      var p = at(e); rub(p[0], p[1]);
      if (!checkT) checkT = setTimeout(function () { checkT = 0; check(); }, 180);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { cv.addEventListener(n, function () { down = false; last = null; check(); }); });

    paint();
    var rw = box.clientWidth;
    window.addEventListener('resize', function () { if (box.clientWidth !== rw) { rw = box.clientWidth; paint(); $('#scrub-done').hidden = true; } });

    // Подсказка: один короткий «мазок» сам, если человек ещё не трогал
    if (!reduce) setTimeout(function () {
      if (touched || !document.body.contains(cv)) return;
      var t0 = null;
      function step(ts) {
        if (touched) return;
        if (t0 === null) t0 = ts;
        var q = Math.min(1, (ts - t0) / 700), e = 1 - Math.pow(1 - q, 3);
        rub(250 + 90 * e, 120 + 26 * Math.sin(e * 6));
        if (q < 1) requestAnimationFrame(step); else last = null;
      }
      requestAnimationFrame(step);
    }, 1200);
  }

  // ----- Состояние калькулятора -----
  var state = { lines: [], extras: [], photos: [], day: 0, win: '' };
  var lineSeq = 0, nearForm = false;

  function itemById(id) { return C.items.filter(function (x) { return x.id === id; })[0]; }
  function fromPrice(it) {
    if (it.sizes && it.sizes.length) return Math.min.apply(null, it.sizes.map(function (s) { return HC.priceOf(settings, it, s); }));
    return HC.priceOf(settings, it);
  }
  function isOn(it) { return state.lines.some(function (l) { return l.item === it; }); }
  function quote() { return HC.quote(state.lines, state.extras, settings); }

  function header() {
    return '<header class="hdr"><a class="logo" href="#"><span class="logo__mark">' + MARK + '</span>' +
      '<span><span class="logo__name">' + esc(C.brand.name) + '</span><span class="logo__sub">' + esc(C.brand.descriptor) + '</span></span></a>' +
      '<a class="btn btn--ghost btn--sm" href="' + telHref(C.brand.phone) + '">Позвонить</a></header>';
  }

  // ----- Главная страница -----
  function page() {
    var b = C.brand, r = C.reviews || {};
    var demo = C.demo ? '<div class="demo-bar">Демо: заявки сохраняются только в этом браузере. <a href="admin.html" target="_blank">Открыть кабинет мастера</a></div>' : '';
    var rating = r.rating ? '<p class="rating"><span class="stars" aria-hidden="true">★★★★★</span><b>' + String(r.rating).replace('.', ',') + '</b> из 5 по ' + r.count + ' ' + plural(r.count, ['отзыву', 'отзывам', 'отзывам']) + ' на ' + esc(r.source) + '</p>' : '';
    app.innerHTML = demo +
      '<div class="wrap">' + header() +

      '<div class="hero"><div class="hero__text">' +
      '<h1>Химчистка дивана на дому — цена за 30 секунд</h1>' +
      '<p class="hero__sub">Выберите мебель и пришлите фото — ' + (b.master ? esc(b.master) + ' назовёт' : 'назовём') + ' точную цену за ' + esc(C.request.replyTime) + ' и приедет в удобный день. Без звонков и замеров.</p>' +
      '</div>' +
      '<div class="hero__art">' + heroArt() + '</div>' +
      '<div class="hero__cta">' + '<ul class="facts">' + (C.facts || []).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' +
      '<a class="btn" href="#calc">Посчитать цену</a>' + rating + '</div></div>' +

      '<section id="calc" class="narrow"><div class="sec-head"><h2>Что почистить?</h2><p>Нажмите на вещь — цена посчитается сразу. Можно выбрать несколько.</p></div>' +
      '<div class="items">' + C.items.map(function (it) {
        return '<button type="button" class="item" data-item="' + esc(it.id) + '" aria-pressed="false" style="--fab:' + (FAB[it.icon] || 'var(--accent)') + '">' + furn(it.icon) +
          '<span class="item__name">' + esc(it.name) + '</span><span class="item__price" data-from="' + esc(it.id) + '"></span>' +
          '<span class="item__count" data-count="' + esc(it.id) + '"></span></button>';
      }).join('') + '</div>' +
      '<div class="order" id="order"></div>' +
      '<p class="sub-title">Что с мебелью? <span class="muted">— если есть</span></p>' +
      '<div class="chips" id="extras">' + C.extras.map(function (x) {
        return '<button type="button" class="chip" data-extra="' + esc(x.id) + '" aria-pressed="false">' + esc(x.name) +
          '<small>' + (x.percent ? '+' + x.percent + '%' : '+' + money(x.add)) + '</small></button>';
      }).join('') + '</div>' +
      '<div class="total"><div class="total__row"><span>Примерно</span><span class="total__sum" id="sum">0 ₽</span></div>' +
      '<p class="total__note" id="sum-note"></p></div></section>' +

      '<section id="send" class="narrow"><div class="sec-head"><h2>Фото и адрес</h2><p>По фото мастер увидит ткань и пятна и назовёт точную цену. Ответ придёт по ссылке, которую вы получите после отправки.</p></div>' +
      '<form class="form" id="form" novalidate>' +
      '<div class="field"><span>Фото мебели <span class="muted">— до ' + C.request.maxPhotos + ' шт.</span></span><div class="photos" id="photos"></div><p class="err" id="photo-err"></p></div>' +
      '<label class="field"><span>Адрес</span><input class="input" name="address" autocomplete="street-address" placeholder="Улица, дом, квартира" required><p class="err" data-err="address"></p></label>' +
      '<div class="field"><span>Когда удобно</span><div class="chips" id="days"></div><div class="chips" id="wins"></div><p class="err" data-err="when"></p></div>' +
      '<label class="field"><span>Имя</span><input class="input" name="name" autocomplete="given-name" placeholder="Как к вам обращаться" required><p class="err" data-err="name"></p></label>' +
      '<label class="field"><span>Телефон</span><input class="input" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 (900) 000-00-00" required><p class="err" data-err="phone"></p></label>' +
      '<label class="field"><span>Комментарий <span class="muted">— необязательно</span></span><textarea class="input" name="note" placeholder="Например: пятна от кофе, 3-й этаж без лифта"></textarea></label>' +
      '<label class="check"><input type="checkbox" name="consent" required><span>Я даю <a href="legal.html#consent" target="_blank">согласие на обработку персональных данных</a>. Как мы храним данные — в <a href="legal.html" target="_blank">политике</a>.</span></label>' +
      '<p class="err" data-err="consent"></p>' +
      '<div class="form-error" id="form-error" hidden></div>' +
      '<button class="btn btn--wide" type="submit" id="submit">' + esc(C.request.button) + '</button>' +
      '</form></section>' +

      '<section><div class="sec-head"><h2>Как это работает</h2></div><ol class="steps">' + (C.steps || []).map(function (s) {
        return '<li><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></li>';
      }).join('') + '</ol></section>' +

      (r.items && r.items.length ? '<section><div class="sec-head"><h2>Отзывы</h2><p>' + String(r.rating).replace('.', ',') + ' из 5 по ' + r.count + ' ' + plural(r.count, ['отзыву', 'отзывам', 'отзывам']) + ' на ' + esc(r.source) + '</p></div><div class="reviews">' + r.items.map(function (x) {
        return '<div class="review"><span class="stars" aria-label="5 из 5">★★★★★</span><h3>' + esc(x.name) + '</h3><p>' + esc(x.text) + '</p></div>';
      }).join('') + '</div></section>' : '') +

      footer() + '</div>' +
      '<div class="bar" id="bar"><div class="bar__sum"><span id="bar-sum">0 ₽</span><small>примерно</small></div><a class="btn" href="#send">Дальше: фото и адрес</a></div>' +
      '<div class="toast" id="toast" role="status"></div>';

    bindCalc();
    bindForm();
    renderOrder();
    initScrub();
  }

  function footer() {
    var l = C.legal || {};
    return '<footer class="ftr"><p>' + esc(C.brand.name) + ', ' + esc(C.brand.descriptor.charAt(0).toLowerCase() + C.brand.descriptor.slice(1)) + '</p>' +
      '<p>' + esc(l.owner) + (l.inn ? ', ИНН ' + esc(l.inn) : '') + '</p>' +
      '<p><a href="legal.html">Политика конфиденциальности и согласие на обработку данных</a></p></footer>';
  }

  // ----- Калькулятор -----
  function bindCalc() {
    $$('[data-item]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var it = itemById(btn.getAttribute('data-item'));
        if (isOn(it)) state.lines = state.lines.filter(function (l) { return l.item !== it; });
        else {
          state.lines.push({ id: ++lineSeq, item: it, size: it.sizes ? it.sizes[0] : null, qty: it.unit === 'm2' ? 6 : 1 });
          btn.style.setProperty('--w', $('.item__art', btn).offsetWidth + 18 + 'px');
          btn.classList.remove('is-fresh'); void btn.offsetWidth; btn.classList.add('is-fresh');
        }
        renderOrder();
      });
    });
    $$('[data-extra]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-extra'), i = state.extras.indexOf(id);
        if (i < 0) state.extras.push(id); else state.extras.splice(i, 1);
        btn.setAttribute('aria-pressed', i < 0 ? 'true' : 'false');
        renderTotal();
      });
    });
    $('#order').addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      var line = state.lines.filter(function (l) { return String(l.id) === t.getAttribute('data-line'); })[0];
      if (!line) return;
      var act = t.getAttribute('data-act');
      if (act === 'minus') line.qty = Math.max(1, line.qty - 1);
      if (act === 'plus') line.qty = Math.min(line.item.unit === 'm2' ? 200 : 20, line.qty + 1);
      if (act === 'size') line.size = line.item.sizes.filter(function (s) { return s.id === t.getAttribute('data-size'); })[0];
      if (act === 'more') state.lines.push({ id: ++lineSeq, item: line.item, size: line.item.sizes ? line.item.sizes[0] : null, qty: 1 });
      if (act === 'del') state.lines = state.lines.filter(function (l) { return l !== line; });
      renderOrder();
    });
    $('#order').addEventListener('input', function (e) {
      var t = e.target; if (!t.matches('input[data-line]')) return;
      var line = state.lines.filter(function (l) { return String(l.id) === t.getAttribute('data-line'); })[0];
      var v = Math.round(Number(String(t.value).replace(',', '.')));
      if (line) { line.qty = v > 0 ? Math.min(v, 200) : 0; renderTotal(); updateLineSum(line); }
    });
  }

  function lineSum(l) { return HC.priceOf(settings, l.item, l.size) * l.qty; }
  function updateLineSum(l) { var el = $('[data-sum="' + l.id + '"]'); if (el) el.textContent = money(lineSum(l)); }

  function renderOrder() {
    C.items.forEach(function (it) {
      $('[data-item="' + it.id + '"]').setAttribute('aria-pressed', isOn(it) ? 'true' : 'false');
      $('[data-from="' + it.id + '"]').textContent = (it.sizes ? 'от ' : '') + money(fromPrice(it)) + (it.unit === 'm2' ? ' за м²' : '');
      var n = state.lines.reduce(function (s, l) { return l.item === it ? s + l.qty : s; }, 0);
      $('[data-count="' + it.id + '"]').textContent = n ? (it.unit === 'm2' ? n + ' м²' : '×' + n) : '';
    });
    $('#order').innerHTML = state.lines.map(function (l) {
      var it = l.item, m2 = it.unit === 'm2';
      var sizes = it.sizes ? '<div class="chips">' + it.sizes.map(function (s) {
        return '<button type="button" class="chip" data-line="' + l.id + '" data-act="size" data-size="' + esc(s.id) + '" aria-pressed="' + (l.size === s) + '">' + esc(s.name) + '</button>';
      }).join('') + '</div>' : '';
      var qty = m2
        ? '<span class="stepper"><button type="button" data-line="' + l.id + '" data-act="minus" aria-label="Меньше">−</button><input data-line="' + l.id + '" inputmode="numeric" value="' + l.qty + '" aria-label="Площадь ковра, м²"><button type="button" data-line="' + l.id + '" data-act="plus" aria-label="Больше">+</button></span> <span class="muted">м²</span>'
        : '<span class="stepper"><button type="button" data-line="' + l.id + '" data-act="minus" aria-label="Меньше"' + (l.qty <= 1 ? ' disabled' : '') + '>−</button><output>' + l.qty + '</output><button type="button" data-line="' + l.id + '" data-act="plus" aria-label="Больше">+</button></span> <span class="muted">шт.</span>';
      return '<div class="line"><div class="line__top"><span class="line__name">' + esc(it.name) + '</span><span class="line__sum" data-sum="' + l.id + '">' + money(lineSum(l)) + '</span></div>' +
        sizes + '<div class="line__row"><span>' + qty + '</span><span>' +
        (it.sizes ? '<button type="button" class="x" data-line="' + l.id + '" data-act="more">+ ещё другого размера</button> ' : '') +
        '<button type="button" class="x" data-line="' + l.id + '" data-act="del">Убрать</button></span></div></div>';
    }).join('');
    renderTotal();
  }

  function renderTotal() {
    if (!$('#sum')) return; // страница уже сменилась на статус
    var q = quote();
    roll($('#sum'), money(q.total));
    roll($('#bar-sum'), money(q.total));
    $('#bar').classList.toggle('is-on', q.rows.length > 0 && !nearForm);
    $('#sum-note').textContent = !q.rows.length ? 'Выберите хотя бы одну вещь выше.' :
      (q.raised ? 'Минимальный заказ — ' + money(q.min) + ': можно добавить ещё вещи без доплаты. ' : '') + C.priceNote;
  }

  // Сумма как счётчик: каждая цифра прокручивается к новой (колонка 0–9 сдвигается transform)
  var COL = '<span class="dg__col">0<br>1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9</span>';
  function roll(el, text) {
    if (!el) return;
    el.setAttribute('aria-label', text);
    var chars = text.split(''), cells = el.children;
    if (el.getAttribute('data-shape') !== text.replace(/\d/g, '0')) {
      el.setAttribute('data-shape', text.replace(/\d/g, '0'));
      el.innerHTML = chars.map(function (ch) {
        return /\d/.test(ch) ? '<span class="dg" aria-hidden="true">' + COL + '</span>' : '<span class="dg-s" aria-hidden="true">' + ch + '</span>';
      }).join('');
      void el.offsetWidth; // новые колонки стартуют с нуля и прокручиваются к цифре
    }
    for (var i = 0; i < chars.length; i++) {
      if (/\d/.test(chars[i])) cells[i].firstChild.style.transform = 'translateY(' + (-Number(chars[i]) * 10) + '%)';
    }
  }

  // Прячем липкую панель, когда форма уже на экране
  function watchForm() {
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (en) {
      nearForm = en[0].isIntersecting;
      renderTotal();
    }, { rootMargin: '0px 0px -30% 0px' }).observe($('#send'));
  }

  // ----- Форма -----
  function dayLabel(i) {
    var d = new Date(Date.now() + i * 864e5);
    if (i === 0) return 'Сегодня';
    if (i === 1) return 'Завтра';
    return ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][d.getDay()] + ', ' + d.getDate();
  }

  function bindForm() {
    var form = $('#form');
    $('#days').innerHTML = Array.apply(null, Array(C.request.days)).map(function (_, i) {
      return '<button type="button" class="chip" data-day="' + i + '" aria-pressed="' + (i === state.day) + '">' + dayLabel(i) + '</button>';
    }).join('');
    $('#wins').innerHTML = C.request.windows.map(function (w) {
      return '<button type="button" class="chip" data-win="' + esc(w) + '" aria-pressed="false">' + esc(w) + '</button>';
    }).join('');
    $('#days').addEventListener('click', function (e) {
      var t = e.target.closest('[data-day]'); if (!t) return;
      state.day = Number(t.getAttribute('data-day'));
      $$('[data-day]').forEach(function (b) { b.setAttribute('aria-pressed', b === t ? 'true' : 'false'); });
    });
    $('#wins').addEventListener('click', function (e) {
      var t = e.target.closest('[data-win]'); if (!t) return;
      state.win = t.getAttribute('data-win');
      $$('[data-win]').forEach(function (b) { b.setAttribute('aria-pressed', b === t ? 'true' : 'false'); });
      setErr('when', '');
    });

    var phone = form.elements.phone;
    phone.addEventListener('focus', function () { if (!phone.value) phone.value = '+7 '; });
    phone.addEventListener('blur', function () { if (phone.value.replace(/\D/g, '') === '7') phone.value = ''; });
    phone.addEventListener('input', function () {
      var d = phone.value.replace(/\D/g, '').replace(/^8/, '7');
      if (d && d[0] !== '7') d = '7' + d;
      d = d.slice(0, 11);
      var p = d.slice(1), out = '+7';
      if (p.length) out += ' (' + p.slice(0, 3);
      if (p.length >= 3) out += ') ' + p.slice(3, 6);
      if (p.length >= 6) out += '-' + p.slice(6, 8);
      if (p.length >= 8) out += '-' + p.slice(8, 10);
      phone.value = out;
    });
    ['address', 'name', 'phone'].forEach(function (n) {
      form.elements[n].addEventListener('input', function () { setErr(n, ''); });
    });
    form.elements.consent.addEventListener('change', function () { setErr('consent', ''); });

    renderPhotos();
    form.addEventListener('submit', submit);
    watchForm();
  }

  function setErr(name, text) {
    var el = $('[data-err="' + name + '"]'); if (el) el.textContent = text;
    var input = $('#form').elements[name];
    if (input && input.classList) input.classList.toggle('is-bad', !!text);
  }

  function renderPhotos() {
    var max = C.request.maxPhotos;
    $('#photos').innerHTML = state.photos.map(function (p, i) {
      return '<div class="photo' + (p.busy ? ' is-busy' : '') + '">' + (p.src ? '<img src="' + p.src + '" alt="Фото ' + (i + 1) + '">' : '') +
        (p.busy ? '' : '<button type="button" data-del-photo="' + i + '" aria-label="Удалить фото">×</button>') + '</div>';
    }).join('') + (state.photos.length < max ? '<label class="photo-add">' + CAM + '<span>' + (state.photos.length ? 'Ещё фото' : 'Добавить фото') + '</span><input type="file" accept="image/*" multiple></label>' : '');
    var input = $('#photos input[type=file]');
    if (input) input.addEventListener('change', function () { addPhotos(input.files); });
    $$('[data-del-photo]').forEach(function (b) {
      b.addEventListener('click', function () { state.photos.splice(Number(b.getAttribute('data-del-photo')), 1); renderPhotos(); });
    });
  }

  function addPhotos(files) {
    var list = Array.prototype.slice.call(files || [], 0, C.request.maxPhotos - state.photos.length);
    $('#photo-err').textContent = files.length > list.length ? 'Можно до ' + C.request.maxPhotos + ' фото — лишние не добавлены.' : '';
    list.forEach(function (f) {
      var p = { busy: true, src: '' };
      state.photos.push(p);
      HC.shrink(f, 1000).then(function (src) { p.src = src; p.busy = false; renderPhotos(); }, function () {
        state.photos.splice(state.photos.indexOf(p), 1);
        $('#photo-err').textContent = 'Не получилось открыть «' + f.name + '». Пришлите фото в формате JPG или PNG.';
        renderPhotos();
      });
    });
    renderPhotos();
  }

  function submit(e) {
    e.preventDefault();
    var form = $('#form'), f = form.elements, ok = true, first = null;
    var q = quote();
    function bad(name, text, el) { setErr(name, text); ok = false; first = first || el; }
    $('#form-error').hidden = true;
    if (!q.rows.length) {
      $('#form-error').textContent = 'Выберите, что почистить, — без этого мастер не сможет назвать цену.';
      $('#form-error').hidden = false; ok = false; first = $('#calc');
    }
    if (f.address.value.trim().length < 5) bad('address', 'Напишите улицу и дом — так мастер поймёт, сколько ехать.', f.address);
    if (!state.win) bad('when', 'Выберите удобное время.', $('#wins'));
    if (!f.name.value.trim()) bad('name', 'Как к вам обращаться?', f.name);
    if (f.phone.value.replace(/\D/g, '').length !== 11) bad('phone', 'Нужен номер из 11 цифр — на него мастер подтвердит выезд.', f.phone);
    if (!f.consent.checked) bad('consent', 'Без согласия мы не можем принять заявку.', f.consent);
    if (state.photos.some(function (p) { return p.busy; })) { $('#photo-err').textContent = 'Подождите секунду — фото ещё загружаются.'; ok = false; }
    if (!ok) { if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }

    var btn = $('#submit');
    btn.disabled = true; btn.classList.add('is-busy'); btn.textContent = 'Отправляем заявку…';
    store.send({
      items: q.rows.map(function (r) { return { name: r.name, qty: r.qty, unit: r.unit, sum: r.sum }; }),
      extras: q.extras, estimate: q.total,
      photos: state.photos.map(function (p) { return p.src; }),
      address: f.address.value.trim(), when: dayLabel(state.day) + ', ' + state.win,
      name: f.name.value.trim(), phone: f.phone.value.trim(), note: f.note.value.trim(),
    }).then(function (r) {
      location.hash = 'r=' + r.id;
      window.scrollTo(0, 0);
    }, function (err) {
      $('#form-error').textContent = err && err.code === 'full'
        ? 'Фото слишком тяжёлые для демо. Уберите одно-два фото и отправьте ещё раз.'
        : 'Заявка не ушла: нет связи. Проверьте интернет и нажмите ещё раз — или позвоните ' + C.brand.phone + '.';
      $('#form-error').hidden = false;
      btn.disabled = false; btn.classList.remove('is-busy'); btn.textContent = C.request.button;
    });
  }

  // ----- Статус заявки -----
  var FLOW = ['new', 'priced', 'agreed', 'done'];
  var FLOW_TEXT = { new: 'Заявка отправлена', priced: 'Мастер назвал точную цену', agreed: 'Выезд согласован', done: 'Мебель чистая' };
  var watching = false;

  function statusPage(id) {
    app.innerHTML = '<div class="wrap narrow">' + header() +
      '<div class="status" id="status"><div class="skeleton" style="width:60%;height:36px"></div><div class="skeleton"></div><div class="skeleton" style="width:80%"></div></div>' + footer() + '</div>' +
      '<div class="toast" id="toast" role="status"></div>';
    load(id);
    if (!watching) {
      watching = true;
      store.watch(function () { var m = location.hash.match(/^#r=([a-z0-9]+)$/i); if (m) load(m[1]); });
    }
  }
  function load(id) { store.get(id).then(function (r) { r ? drawStatus(r) : notFound(); }, notFound); }

  function notFound() {
    $('#status').innerHTML = '<h1>Заявка не нашлась</h1><p class="muted" style="margin-top:8px">Возможно, ссылка неполная. Отправьте новую заявку — это займёт 1 минуту, или позвоните мастеру.</p>' +
      '<div class="btns" style="display:flex;flex-wrap:wrap;gap:12px;margin-top:24px"><a class="btn" href="#">Посчитать цену заново</a><a class="btn btn--ghost" href="' + telHref(C.brand.phone) + '">Позвонить ' + esc(C.brand.phone) + '</a></div>';
  }

  function drawStatus(r) {
    var at = FLOW.indexOf(r.status), cancelled = r.status === 'cancelled';
    var head = {
      new: ['Заявка у мастера', 'Он посмотрит фото и назовёт точную цену за ' + C.request.replyTime + '. Ответ появится на этой странице — сохраните ссылку.'],
      priced: ['Мастер назвал цену', 'Проверьте сумму и время и подтвердите — мастер сразу увидит ответ.'],
      agreed: ['Ждём вас', 'Мастер приедет в согласованное время. Если планы поменяются — позвоните.'],
      done: ['Готово', 'Спасибо, что выбрали нас. Мебель высохнет за 4–6 часов — не садитесь на неё до вечера.'],
      cancelled: ['Заявка отменена', 'Если хотите — отправьте новую или позвоните мастеру.'],
    }[r.status] || ['Заявка', ''];
    var offer = '';
    if (r.status === 'priced' || r.status === 'agreed') {
      offer = '<div class="offer"><span class="muted">Точная цена</span><div class="offer__sum">' + money(r.price) + '</div>' +
        (r.visit ? '<p>Мастер приедет: <b>' + esc(HC.fmtVisit(r.visit)) + '</b></p>' : '') +
        (r.reply ? '<p class="muted" style="margin-top:8px">«' + esc(r.reply) + '»</p>' : '') +
        '<div class="btns">' + (r.status === 'priced' ? '<button class="btn" id="agree">Подтвердить — ' + money(r.price) + '</button>' : '') +
        '<a class="btn btn--ghost" href="' + telHref(C.brand.phone) + '">Позвонить мастеру</a></div><p class="err" id="agree-err"></p></div>';
    }
    $('#status').innerHTML = '<p class="muted">Заявка №' + esc(r.id.toUpperCase()) + '</p><h1>' + esc(head[0]) + '</h1><p class="muted" style="margin-top:8px">' + esc(head[1]) + '</p>' +
      offer +
      (cancelled ? '' : '<ol class="timeline">' + FLOW.map(function (s, i) {
        return '<li class="' + (i < at ? 'is-done' : i === at ? 'is-done is-now' : '') + '">' + FLOW_TEXT[s] + '</li>';
      }).join('') + '</ol>') +
      '<dl class="details">' +
      '<div><dt>Что чистим</dt><dd>' + r.items.map(function (x) { return esc(x.name) + (x.unit === 'm2' ? ', ' + x.qty + ' м²' : x.qty > 1 ? ' × ' + x.qty : ''); }).join('<br>') + '</dd></div>' +
      (r.extras && r.extras.length ? '<div><dt>Особенности</dt><dd>' + r.extras.map(esc).join(', ') + '</dd></div>' : '') +
      '<div><dt>Предварительно</dt><dd>' + money(r.estimate) + '</dd></div>' +
      '<div><dt>Адрес</dt><dd>' + esc(r.address) + '</dd></div>' +
      '<div><dt>Когда удобно</dt><dd>' + esc(r.when) + '</dd></div></dl>' +
      '<div style="display:flex;flex-wrap:wrap;gap:12px"><button class="btn btn--ghost" id="copy">Скопировать ссылку на заявку</button><a class="btn btn--ghost" href="#">Новая заявка</a></div>';

    var agree = $('#agree');
    if (agree) agree.addEventListener('click', function () {
      agree.disabled = true; agree.classList.add('is-busy'); agree.textContent = 'Подтверждаем…';
      store.update(r.id, { status: 'agreed' }).then(function (x) { drawStatus(x); toast('Готово — мастер увидел подтверждение'); }, function () {
        agree.disabled = false; agree.classList.remove('is-busy'); agree.textContent = 'Подтвердить — ' + money(r.price);
        $('#agree-err').textContent = 'Не получилось — нет связи. Нажмите ещё раз или позвоните мастеру.';
      });
    });
    $('#copy').addEventListener('click', function () {
      (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject()).then(function () { toast('Ссылка скопирована — сохраните её в заметках'); },
        function () { toast('Скопируйте адрес из строки браузера'); });
    });
  }

  function toast(text) {
    var t = $('#toast'); if (!t) return;
    t.textContent = text; t.classList.add('is-on');
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('is-on'); }, 2600);
  }

  // ----- Маршрут: #r=<номер> — статус, иначе калькулятор -----
  function route() {
    var m = location.hash.match(/^#r=([a-z0-9]+)$/i);
    if (m) { statusPage(m[1]); return; }
    if (!$('#calc')) page();
    if (location.hash === '#calc' || location.hash === '#send') $(location.hash).scrollIntoView();
  }
  window.addEventListener('hashchange', function () {
    if (/^#r=/.test(location.hash) || $('#status')) route();
  });

  store.settings().then(function (st) { settings = st || {}; route(); }, function () { route(); });

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
