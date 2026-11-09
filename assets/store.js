/* =====================================================================
   Химчистка · расчёт цены и хранилище заявок
   Общий для страницы клиента (app.js) и кабинета мастера (admin.js).
   DemoStore держит всё в localStorage — для показа; изменения видны
   сразу в другой вкладке (событие storage), как у настоящего сервера.
   ===================================================================== */

window.HC = (function () {
  var C = window.HC_CONFIG;

  function arr(x) { return Array.isArray(x) ? x : []; }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function money(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; }
  function uid() { return Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 6); }
  function localISO(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function delay(v, ms) { return new Promise(function (r) { setTimeout(function () { r(v); }, ms == null ? 400 : ms); }); }

  // Цены с учётом правок мастера в кабинете (settings.prices[ключ])
  function priceKey(item, size) { return size ? item.id + '.' + size.id : item.id; }
  function priceOf(settings, item, size) {
    var p = settings && settings.prices && settings.prices[priceKey(item, size)];
    return typeof p === 'number' && p >= 0 ? p : (size ? size.price : item.price);
  }
  function minOrder(settings) {
    return settings && typeof settings.minOrder === 'number' ? settings.minOrder : C.minOrder || 0;
  }
  function priceList(settings) {
    var out = [];
    C.items.forEach(function (it) {
      if (arr(it.sizes).length) it.sizes.forEach(function (s) { out.push({ key: priceKey(it, s), name: it.name + ', ' + s.name.toLowerCase(), price: priceOf(settings, it, s), unit: it.unit }); });
      else out.push({ key: priceKey(it), name: it.name, price: priceOf(settings, it), unit: it.unit });
    });
    return out;
  }

  // lines: [{ item, size, qty }] — qty у ковра = квадратные метры
  function quote(lines, extraIds, settings) {
    var sub = 0, rows = [];
    lines.forEach(function (l) {
      if (!(l.qty > 0)) return;
      var p = priceOf(settings, l.item, l.size), sum = p * l.qty;
      sub += sum;
      rows.push({ key: priceKey(l.item, l.size), name: l.item.name + (l.size ? ', ' + l.size.name.toLowerCase() : ''), qty: l.qty, unit: l.item.unit, price: p, sum: sum });
    });
    var pct = 0, add = 0, extras = [];
    C.extras.forEach(function (x) {
      if (extraIds.indexOf(x.id) < 0) return;
      extras.push(x.name);
      if (x.percent) pct += x.percent;
      if (x.add) add += x.add;
    });
    var total = rows.length ? Math.round((sub * (100 + pct) / 100 + add) / 50) * 50 : 0;
    var min = minOrder(settings), raised = rows.length > 0 && total < min;
    return { rows: rows, extras: extras, total: raised ? min : total, raised: raised, min: min };
  }

  var STATUS = {
    new: 'Ждёт цену от мастера',
    priced: 'Мастер назвал цену',
    agreed: 'Выезд согласован',
    done: 'Готово',
    cancelled: 'Отменена',
  };

  // ----- DemoStore -----
  function DemoStore() { this.key = 'hc:' + C.brand.name; }
  DemoStore.prototype._load = function () {
    var data = null;
    try { data = JSON.parse(localStorage.getItem(this.key) || 'null'); } catch (e) { data = null; }
    if (!data) data = this.mem || this._seed();
    this.mem = data;
    return data;
  };
  DemoStore.prototype._save = function (data) {
    this.mem = data;
    try { localStorage.setItem(this.key, JSON.stringify(data)); return true; }
    catch (e) { return false; } // переполнено фото или приватный режим
  };
  // Две выдуманные заявки, чтобы кабинет не был пустым при первом показе
  DemoStore.prototype._seed = function () {
    var d = new Date(), t = new Date(d.getTime() + 864e5); t.setHours(12, 0, 0, 0);
    var y = new Date(d.getTime() - 3 * 36e5);
    return {
      settings: {},
      requests: [
        { id: 'demo1', source: 'seed', created: localISO(y), status: 'agreed', name: 'Светлана', phone: '+7 (900) 000-11-22',
          address: 'ул. Малышева, 51, кв. 12', when: 'Завтра, 12:00–15:00', items: [{ name: 'Диван, угловой', qty: 1, sum: 3900 }, { name: 'Кресло', qty: 2, sum: 2600 }],
          extras: ['Шерсть животных'], estimate: 7500, price: 7000, visit: localISO(t), note: 'Возьму пятновыводитель для кофе', photos: [] },
        { id: 'demo2', source: 'seed', created: localISO(new Date(d.getTime() - 40 * 6e4)), status: 'new', name: 'Дмитрий', phone: '+7 (900) 000-33-44',
          address: 'ул. Белинского, 86', when: 'Сегодня, 18:00–21:00', items: [{ name: 'Матрас, двуспальный', qty: 1, sum: 2400 }],
          extras: ['Старые пятна'], estimate: 2900, photos: [] },
      ],
    };
  };
  DemoStore.prototype.settings = function () { return delay(clone(this._load().settings), 0); };
  DemoStore.prototype.saveSettings = function (patch) {
    var data = this._load();
    Object.keys(patch).forEach(function (k) { data.settings[k] = patch[k]; });
    this._save(data);
    return delay(clone(data.settings));
  };
  DemoStore.prototype.send = function (req) {
    var data = this._load(), r = clone(req);
    r.id = uid(); r.created = localISO(new Date()); r.status = 'new';
    data.requests.unshift(r);
    if (this._save(data)) return delay(clone(r), 900);
    data.requests.shift();
    var e = new Error('full'); e.code = 'full';
    return delay(null, 300).then(function () { throw e; });
  };
  DemoStore.prototype.get = function (id) {
    var r = this._load().requests.filter(function (x) { return x.id === id; })[0];
    return delay(r ? clone(r) : null, 250);
  };
  DemoStore.prototype.list = function () {
    return delay(clone(this._load().requests).sort(function (a, b) { return a.created < b.created ? 1 : -1; }), 300);
  };
  DemoStore.prototype.update = function (id, patch) {
    var data = this._load(), r = data.requests.filter(function (x) { return x.id === id; })[0];
    if (!r) return delay(null).then(function () { throw new Error('not_found'); });
    Object.keys(patch).forEach(function (k) { r[k] = patch[k]; });
    this._save(data);
    return delay(clone(r));
  };
  DemoStore.prototype.login = function (pass) { return delay(pass === C.adminPassword); };
  DemoStore.prototype.reset = function () { try { localStorage.removeItem(this.key); } catch (e) {} this.mem = null; };
  // Подписка на изменения из другой вкладки
  DemoStore.prototype.watch = function (fn) {
    var key = this.key, self = this;
    window.addEventListener('storage', function (e) { if (e.key === key) { self.mem = null; fn(); } });
  };

  // Сжимаем фото на телефоне до ~1000 px, чтобы заявка уходила быстро
  function shrink(file, max) {
    return new Promise(function (ok, fail) {
      if (!/^image\//.test(file.type)) { fail(new Error('type')); return; }
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var k = Math.min(1, max / Math.max(img.width, img.height));
        var cv = document.createElement('canvas');
        cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        ok(cv.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = function () { URL.revokeObjectURL(url); fail(new Error('read')); };
      img.src = url;
    });
  }

  function fmtVisit(s) {
    if (!s) return '';
    var d = new Date(s);
    if (isNaN(d)) return s;
    var days = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    var mon = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return days[d.getDay()] + ', ' + d.getDate() + ' ' + mon[d.getMonth()] + ' в ' + d.getHours() + ':' + pad(d.getMinutes());
  }

  return {
    config: C, money: money, quote: quote, priceOf: priceOf, priceList: priceList, minOrder: minOrder,
    STATUS: STATUS, shrink: shrink, fmtVisit: fmtVisit, localISO: localISO, pad: pad,
    store: new DemoStore(),
  };
})();
