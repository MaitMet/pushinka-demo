/* =====================================================================
   НАСТРОЙКИ — Spasenkin Clean, Новосибирск (личное демо, 09.11.2026)
   Цены, обещания и контакты — с сайта spasenkin-clean.ru; рейтинг — 2ГИС.
   Где на сайте «от–до», здесь нижняя граница. Наценки — примерные, мастер меняет их сам.
   ===================================================================== */

window.HC_CONFIG = {

  brand: {
    name: "Spasenkin Clean",
    descriptor: "Химчистка мебели на дому в Новосибирске",
    city: "Новосибирск",
    master: "Алексей",
    phone: "+7 (923) 232-80-80",
    whatsapp: "79232328080",
    telegram: "spasenkin_clean_nsk",
    vk: "https://vk.ru/club241440822",
    accent: "#E3B96D",
  },

  facts: ["Сушим мебель — в подарок", "Не понравится результат — не возьмём оплату", "Оценка по фото за минуту"],

  items: [
    { id: "sofa", name: "Диван", icon: "sofa", sizes: [
      { id: "s2", name: "2-местный", price: 3000 },
      { id: "s3", name: "Прямой 3-местный", price: 4000 },
      { id: "corner", name: "Угловой 3-местный", price: 5000 },
      { id: "corner4", name: "Угловой на 4 места", price: 5500 },
      { id: "fold2", name: "Выдвижной 2-местный", price: 3500 },
      { id: "fold3", name: "Выдвижной 3-местный", price: 4500 },
    ] },
    { id: "chair", name: "Кресло", icon: "armchair", price: 1750 },
    { id: "mattress", name: "Матрас", icon: "mattress", sizes: [
      { id: "m1", name: "Односпальный 90×200", price: 3500 },
      { id: "m2", name: "Двуспальный 180×200", price: 7000 },
    ] },
    { id: "stool", name: "Кухонный стул", icon: "stool", price: 750 },
    { id: "pillow", name: "Подушка", icon: "pouf", price: 450 },
    { id: "carpet", name: "Ковролин", icon: "carpet", unit: "m2", price: 300 },
  ],

  extras: [
    { id: "pets", name: "Шерсть животных", percent: 15 },
    { id: "smell", name: "Запах (моча, табак)", add: 1000 },
    { id: "stains", name: "Сложные пятна", percent: 20 },
  ],

  minOrder: 0,
  priceNote: "Цены ориентировочные. Точную Алексей назовёт по фото — и она не изменится в ходе работ.",

  steps: [
    { title: "Выберите, что чистить", text: "Цена посчитается сразу, без звонка." },
    { title: "Пришлите 1–4 фото", text: "Алексей посмотрит пятна и ткань и назовёт точную цену." },
    { title: "Мастер приедет", text: "Со своим оборудованием и безопасными средствами. Мебель просушим на месте." },
  ],

  reviews: { rating: "5.0", count: 7, source: "2ГИС", items: [] },

  request: {
    days: 7,
    windows: ["9:00–12:00", "12:00–15:00", "15:00–18:00", "18:00–21:00"],
    maxPhotos: 4,
    button: "Отправить фото — оценка за минуту",
    replyTime: "пару минут",
  },

  legal: {
    owner: "Spasenkin Clean (Алексей Спасёнкин)",
    inn: "",
    email: "",
  },

  demo: true,
  adminPassword: "demo",
};
