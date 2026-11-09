/* =====================================================================
   Химчистка · кабинет мастера
   Заявки с фото → мастер ставит точную цену и время → клиент видит
   их по своей ссылке и подтверждает. Вкладка «Цены» меняет калькулятор.
   ===================================================================== */

(function () {
  var C = HC.config, store = HC.store, money = HC.money;
  var app = document.getElementById('app');
  var state = { tab: 'requests', filter: 'active', open: null, list: [], settings: {} };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function telHref(p) { return 'tel:+' + String(p || '').replace(/\D/g, '').replace(/^8/, '7'); }
  function waHref(p) { return 'https://wa.me/' + String(p || '').replace(/\D/g, '').replace(/^8/, '7'); }
  function ago(s) {
    var min = Math.round((Date.now() - new Date(s).getTime()) / 6e4);
    if (min < 1) return 'только что';
    if (min < 60) return min + ' мин назад';
    if (min < 1440) return Math.round(min / 60) + ' ч назад';
    return Math.round(min / 1440) + ' дн назад';
  }
  function toast(text) {
    var t = $('#toast'); if (!t) return;
    t.textContent = text; t.classList.add('is-on');
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('is-on'); }, 2600);
  }
  function what(x) { return esc(x.name) + (x.unit === 'm2' ? ', ' + x.qty + ' м²' : x.qty > 1 ? ' × ' + x.qty : ''); }

  document.documentElement.style.setProperty('--accent', C.brand.accent || '#0F8B6F');

  // ----- Вход -----
  function loginPage(errText) {
    app.innerHTML = '<div class="wrap narrow"><div class="status"><p class="muted">' + esc(C.brand.name) + '</p><h1>Кабинет мастера</h1>' +
      '<p class="muted" style="margin-top:8px">Здесь заявки с фото, цены и время выездов.</p>' +
      '<form class="form" id="login" style="margin-top:24px"><label class="field"><span>Пароль</span><input class="input" name="pass" type="password" autocomplete="current-password" required></label>' +
      (C.demo ? '<p class="hint">Демо: пароль <b>' + esc(C.adminPassword) + '</b></p>' : '') +
      '<p class="err" id="login-err">' + esc(errText || '') + '</p><button class="btn btn--wide" id="login-btn">Войти</button></form></div></div>';
    $('#login').addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = $('#login-btn'); btn.disabled = true; btn.classList.add('is-busy');
      store.login(e.target.elements.pass.value).then(function (ok) {
        if (ok) { try { sessionStorage.setItem('hc:adm', '1'); } catch (x) {} boot(); }
        else loginPage('Неверный пароль. Попробуйте ещё раз.');
      }, function () { loginPage('Нет связи с сервером. Проверьте интернет.'); });
    });
  }

  // ----- Каркас -----
  function shell() {
    var nNew = state.list.filter(function (r) { return r.status === 'new'; }).length;
    app.innerHTML = (C.demo ? '<div class="demo-bar">Демо-кабинет. <a href="index.html" target="_blank">Открыть страницу клиента</a> и отправьте заявку — она появится здесь.</div>' : '') +
      '<div class="wrap narrow"><header class="hdr"><span class="logo"><span><span class="logo__name">' + esc(C.brand.name) + '</span><span class="logo__sub">Кабинет мастера</span></span></span>' +
      '<div class="chips" role="tablist"><button class="chip" data-tab="requests" aria-pressed="' + (state.tab === 'requests') + '">Заявки' + (nNew ? ' <small>' + nNew + ' нов.</small>' : '') + '</button>' +
      '<button class="chip" data-tab="prices" aria-pressed="' + (state.tab === 'prices') + '">Цены</button></div></header>' +
      '<main id="main"></main>' +
      (C.demo ? '<p class="ftr"><button class="x" id="reset">Сбросить демо к началу</button></p>' : '') + '</div>' +
      '<div class="toast" id="toast" role="status"></div>';
    $$('[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () { state.tab = b.getAttribute('data-tab'); shell(); });
    });
    var reset = $('#reset');
    if (reset) reset.addEventListener('click', function () { store.reset(); state.open = null; refresh().then(function () { toast('Демо сброшено'); }); });
    if (state.tab === 'requests') requests(); else prices();
  }

  // ----- Заявки -----
  var FILTERS = { active: ['new', 'priced', 'agreed'], done: ['done', 'cancelled'], all: null };
  var PILL = { new: 'Новая', priced: 'Ждём ответ клиента', agreed: 'Выезд согласован', done: 'Выполнена', cancelled: 'Отменена' };

  function requests() {
    var list = state.list.filter(function (r) { return !FILTERS[state.filter] || FILTERS[state.filter].indexOf(r.status) >= 0; });
    $('#main').innerHTML = '<div class="chips" style="margin:8px 0 24px">' + [['active', 'В работе'], ['done', 'Завершённые'], ['all', 'Все']].map(function (f) {
      return '<button class="chip" data-filter="' + f[0] + '" aria-pressed="' + (state.filter === f[0]) + '">' + f[1] + '</button>';
    }).join('') + '</div>' +
      (list.length ? '<div class="reqs">' + list.map(card).join('') + '</div>' :
        '<div class="empty-hint"><h3>' + (state.filter === 'active' ? 'Новых заявок пока нет' : 'Здесь пусто') + '</h3>' +
        '<p style="margin-top:8px">Поставьте ссылку на страницу в профиль ВК, Авито и в ответы клиентам — заявки с фото будут приходить сюда.</p>' +
        '<a class="btn btn--ghost btn--sm" style="margin-top:16px" href="index.html" target="_blank">Открыть страницу клиента</a></div>');
    $$('[data-filter]').forEach(function (b) {
      b.addEventListener('click', function () { state.filter = b.getAttribute('data-filter'); requests(); });
    });
    $$('[data-open]').forEach(function (b) {
      b.addEventListener('click', function () { var id = b.getAttribute('data-open'); state.open = state.open === id ? null : id; requests(); });
    });
    if (state.open) bindDetail(state.open);
  }

  function card(r) {
    var open = state.open === r.id;
    return '<article class="req' + (open ? ' is-open' : '') + (r.status === 'new' ? ' is-new' : '') + '">' +
      '<button class="req__head" data-open="' + esc(r.id) + '" aria-expanded="' + open + '">' +
      '<span class="req__top"><b>' + esc(r.name) + '</b><span class="pill pill--' + r.status + '">' + PILL[r.status] + '</span></span>' +
      '<span class="req__what">' + r.items.map(what).join(', ') + '</span>' +
      '<span class="req__meta">' + (r.price ? money(r.price) : '≈ ' + money(r.estimate)) + ', ' + esc(r.when).toLowerCase() + ', ' + ago(r.created) + '</span></button>' +
      (open ? detail(r) : '') + '</article>';
  }

  function detail(r) {
    var closed = r.status === 'done' || r.status === 'cancelled';
    return '<div class="req__body">' +
      (r.photos && r.photos.length ? '<div class="photos">' + r.photos.map(function (p, i) {
        return '<a class="photo" href="' + p + '" target="_blank"><img src="' + p + '" alt="Фото ' + (i + 1) + ' от клиента"></a>';
      }).join('') + '</div>' : '<p class="hint">Клиент не приложил фото — уточните пятна по телефону.</p>') +
      '<dl class="details">' +
      '<div><dt>Что чистим</dt><dd>' + r.items.map(function (x) { return what(x) + ' — ' + money(x.sum); }).join('<br>') + '</dd></div>' +
      (r.extras && r.extras.length ? '<div><dt>Особенности</dt><dd>' + r.extras.map(esc).join(', ') + '</dd></div>' : '') +
      '<div><dt>Калькулятор</dt><dd>' + money(r.estimate) + '</dd></div>' +
      '<div><dt>Адрес</dt><dd><a href="https://yandex.ru/maps/?text=' + encodeURIComponent(C.brand.city + ', ' + r.address) + '" target="_blank">' + esc(r.address) + '</a></dd></div>' +
      '<div><dt>Удобно</dt><dd>' + esc(r.when) + '</dd></div>' +
      (r.note ? '<div><dt>Комментарий</dt><dd>' + esc(r.note) + '</dd></div>' : '') + '</dl>' +
      '<div class="chips" style="margin-bottom:24px"><a class="btn btn--sm" href="' + telHref(r.phone) + '">Позвонить ' + esc(r.phone) + '</a>' +
      '<a class="btn btn--ghost btn--sm" href="' + waHref(r.phone) + '" target="_blank">WhatsApp</a></div>' +
      (closed ? '' :
        '<form class="form" data-price-form="' + esc(r.id) + '">' +
        '<div class="grid2"><label class="field"><span>Точная цена, ₽</span><input class="input" name="price" inputmode="numeric" value="' + (r.price || r.estimate) + '" required></label>' +
        '<label class="field"><span>Когда приедете</span><input class="input" name="visit" type="datetime-local" value="' + esc(r.visit || '') + '" required></label></div>' +
        '<label class="field"><span>Сообщение клиенту <span class="muted">— необязательно</span></span><input class="input" name="reply" value="' + esc(r.reply || '') + '" placeholder="Например: пятна от кофе выведу, возьму сушилку"></label>' +
        '<p class="err" data-form-err></p>' +
        '<button class="btn btn--wide" data-send>' + (r.status === 'new' ? 'Отправить клиенту цену и время' : 'Обновить цену и время') + '</button></form>') +
      '<div class="chips" style="margin-top:16px">' +
      (r.status === 'agreed' ? '<button class="btn btn--ghost btn--sm" data-status="done">Работа выполнена</button>' : '') +
      (closed ? '' : '<button class="btn btn--ghost btn--sm" data-status="cancelled">Отменить заявку</button>') +
      '<a class="btn btn--ghost btn--sm" href="index.html#r=' + esc(r.id) + '" target="_blank">Как видит клиент</a></div></div>';
  }

  function bindDetail(id) {
    var form = $('[data-price-form="' + id + '"]');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements, price = Math.round(Number(String(f.price.value).replace(/\s/g, '')));
      var err = $('[data-form-err]', form);
      if (!(price > 0)) { err.textContent = 'Укажите цену числом, например 4500.'; return; }
      if (!f.visit.value) { err.textContent = 'Выберите день и время выезда — клиент увидит их по ссылке.'; return; }
      var btn = $('[data-send]', form); btn.disabled = true; btn.classList.add('is-busy');
      var cur = state.list.filter(function (x) { return x.id === id; })[0];
      store.update(id, { price: price, visit: f.visit.value, reply: f.reply.value.trim(), status: cur && cur.status === 'agreed' ? 'agreed' : 'priced' })
        .then(function () { return refresh(); }).then(function () { toast('Отправлено — клиент видит цену по своей ссылке'); },
          function () { btn.disabled = false; btn.classList.remove('is-busy'); err.textContent = 'Не сохранилось — нет связи. Нажмите ещё раз.'; });
    });
    $$('[data-status]').forEach(function (b) {
      b.addEventListener('click', function () {
        var s = b.getAttribute('data-status');
        if (s === 'cancelled' && !confirm('Отменить заявку? Клиент увидит это по ссылке.')) return;
        b.disabled = true; b.classList.add('is-busy');
        store.update(id, { status: s }).then(function () { return refresh(); }).then(function () { toast(s === 'done' ? 'Заявка закрыта' : 'Заявка отменена'); },
          function () { b.disabled = false; b.classList.remove('is-busy'); toast('Не сохранилось — проверьте интернет'); });
      });
    });
  }

  // ----- Цены -----
  function prices() {
    var list = HC.priceList(state.settings);
    $('#main').innerHTML = '<p class="muted" style="margin:8px 0 24px">Эти цены видят клиенты в калькуляторе. Поменяли — сохраните, и страница сразу считает по-новому.</p>' +
      '<form class="form" id="prices">' + list.map(function (p) {
        return '<label class="price-row"><span>' + esc(p.name) + (p.unit === 'm2' ? ' <span class="muted">за м²</span>' : '') + '</span>' +
          '<span class="price-row__in"><input class="input" inputmode="numeric" name="' + esc(p.key) + '" value="' + p.price + '"> ₽</span></label>';
      }).join('') +
      '<label class="price-row"><span>Минимальный заказ</span><span class="price-row__in"><input class="input" inputmode="numeric" name="__min" value="' + HC.minOrder(state.settings) + '"> ₽</span></label>' +
      '<p class="err" id="prices-err"></p><button class="btn btn--wide" id="prices-btn">Сохранить цены</button></form>';
    $('#prices').addEventListener('submit', function (e) {
      e.preventDefault();
      var out = {}, bad = false, min = 0;
      $$('#prices input').forEach(function (inp) {
        var v = Math.round(Number(String(inp.value).replace(/\s/g, '')));
        var good = String(inp.value).trim() !== '' && v >= 0;
        inp.classList.toggle('is-bad', !good);
        if (!good) bad = true;
        if (inp.name === '__min') min = v; else out[inp.name] = v;
      });
      if (bad) { $('#prices-err').textContent = 'Проверьте подсвеченные поля — нужна цена числом.'; return; }
      var btn = $('#prices-btn'); btn.disabled = true; btn.classList.add('is-busy'); btn.textContent = 'Сохраняем…';
      store.saveSettings({ prices: out, minOrder: min }).then(function (st) {
        state.settings = st; prices(); toast('Цены сохранены — калькулятор уже считает по ним');
      }, function () {
        btn.disabled = false; btn.classList.remove('is-busy'); btn.textContent = 'Сохранить цены';
        $('#prices-err').textContent = 'Не сохранилось — нет связи. Нажмите ещё раз.';
      });
    });
  }

  // ----- Загрузка -----
  var loaded = false;
  function refresh() {
    return Promise.all([store.list(), store.settings()]).then(function (res) {
      var before = state.list.filter(function (r) { return r.status === 'new'; }).length;
      state.list = res[0]; state.settings = res[1] || {};
      var now = state.list.filter(function (r) { return r.status === 'new'; }).length;
      shell();
      if (loaded && now > before) toast('Новая заявка');
      loaded = true;
    }, function () {
      app.innerHTML = '<div class="wrap narrow"><div class="status"><h1>Не загрузилось</h1><p class="muted" style="margin-top:8px">Нет связи с сервером. Проверьте интернет.</p><button class="btn" style="margin-top:24px" id="retry">Попробовать ещё раз</button></div></div>';
      $('#retry').addEventListener('click', boot);
    });
  }

  function boot() {
    app.innerHTML = '<div class="wrap narrow"><div class="status"><div class="skeleton" style="width:50%;height:32px"></div><div class="skeleton"></div><div class="skeleton" style="width:70%"></div></div></div>';
    refresh();
  }

  var authed = false;
  try { authed = sessionStorage.getItem('hc:adm') === '1'; } catch (e) {}
  if (authed) boot(); else loginPage();
  // Заявка из другой вкладки — обновляем, если мастер не печатает в форме
  store.watch(function () {
    if (!$('#main')) return;
    var typing = document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if (!typing) refresh();
  });

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
