// Языки сайта. Русский — в разметке и всегда по умолчанию; английский — словарём ниже.
// Подключается первым: если в адресе ?lang=en, текст подменяется до старта движка, и сайт сразу собирается
// на английском. Переключение на лету (анимация, частицы) делает engine.js, вызывая PTI18N.apply(lang).
//
// Словарь — «русская строка → английская». Ключ — текст узла целиком, без пробелов по краям: подменяются
// текстовые узлы страницы, атрибуты aria-label / title / alt, заголовок вкладки и описание. Порядок узлов
// не меняется, поэтому разметка (span.it внутри заголовка и т. п.) одна на оба языка: перевод подбирается так,
// чтобы куски шли в том же порядке. Сцены в карточках (scenes.js) берут перевод через PTI18N.t().
// Новый русский текст в разметке — сразу добавь сюда перевод: node tools/check.mjs ловит кириллицу в EN-версии.
(function () {
  var EN = {
    // вкладка и описание
    'Private Technology House — студия полного цикла': 'Private Technology House — full-cycle studio',
    'Студия полного цикла: сайты, системы, инфраструктура и AI — тихо, точно и только под вашу задачу.': 'Full-cycle studio: websites, systems, infrastructure and AI — quiet, precise and built only for your task.',

    // первый экран
    'Разделы': 'Sections',
    'Работы': 'Work',
    'Цены': 'Pricing',
    'Открыть меню': 'Open menu',
    'Закрыть меню': 'Close menu',
    'Меню': 'Menu',
    'Написать в Telegram': 'Message us on Telegram',
    'Студия полного цикла · по всей России': 'Full-cycle studio · across Russia',
    'Сайты, интеграции': 'Websites, integrations',
    'и автоматизация —': 'and automation —',
    'с холодной точностью.': 'with cold precision.',
    'Делаем сайты, связываем CRM, Битрикс24 и Telegram, автоматизируем заявки и отчёты. Под вашу задачу, без шаблонов — от первого экрана до сервера.': 'We build websites, connect CRM, Bitrix24 and Telegram, and automate leads and reports. Built for your task, no templates — from the first screen to the server.',
    'Смотреть работы': 'View our work',
    // строка доверия: три пункта, каждый отдельным узлом
    'Смета и сроки — до старта': 'Estimate and timeline before we start',
    'Договор и NDA': 'Contract and NDA',
    'Поддержка после запуска': 'Support after launch',
    'Процесс': 'Process',
    'Язык сайта': 'Site language',
    'Обсудить проект': 'Start a project',
    'Обсудить проект →': 'Start a project →',
    // объект первого экрана (assets/hero-objects.js) и строка из пяти принципов
    'Объект': 'Object',
    'Хрустальный ферзь': 'Crystal queen',
    'Оптический прицел': 'Optical sight',
    'Ускоритель': 'Accelerator',
    'Шифровальные роторы': 'Cipher rotors',
    'Перо и бриллиант': 'Pen and diamond',
    'Предыдущий принцип': 'Previous principle',
    'Следующий принцип': 'Next principle',
    'Принципы': 'Principles',
    '01 · Холодный расчёт': '01 · Cold calculation',
    '02 · Точность': '02 · Precision',
    '03 · Скорость': '03 · Speed',
    '04 · Безопасность': '04 · Security',
    '05 · Дизайн': '05 · Design',
    'Сначала считаем, потом делаем: варианты, риски и бюджет — до первой строки кода.': 'We calculate first, then build: options, risks and budget — before the first line of code.',
    'Ровно то, что нужно бизнесу: до пикселя в макете, до поля в CRM, до рубля в смете.': 'Exactly what the business needs: down to the pixel in the layout, the field in the CRM, the rouble in the estimate.',
    'Быстрый запуск без суеты: каждый этап идёт по рассчитанной траектории.': 'Fast launch without the rush: every stage follows a calculated trajectory.',
    'Данные и доступы под замком: шифрование, резервные копии, права по ролям.': 'Data and access under lock: encryption, backups, role-based permissions.',
    'Свой дизайн под ваш бизнес — без шаблонов и чужих тем.': 'A design of your own for your business — no templates, no borrowed themes.',

    // 01 — направления
    '01 / Услуги': '01 / Services',
    'Четыре направления.': 'Four disciplines.',
    'Один дом.': 'One house.',
    'Берём проект целиком — от первого экрана до сервера, на котором он живёт.': 'We take on the whole project — from the first screen to the server it lives on.',
    'Цифровые продукты': 'Digital Products',
    'Сайты и веб-приложения, которые ощущаются продуктом.': 'Websites and web apps that feel like a product.',
    'Лендинги и сайты-визитки': 'Landing pages and brochure sites',
    'Корпоративные сайты и магазины': 'Corporate websites and online stores',
    'Редизайн и переезд': 'Redesign and migration',
    'Системы': 'Systems',
    'CRM, интеграции и автоматизация — ручная работа уходит.': 'CRM, integrations and automation — manual work goes away.',
    '1С-Битрикс и Битрикс24': '1C-Bitrix and Bitrix24',
    'Автоматизация в n8n': 'Automation in n8n',
    'Интеграции по API': 'API integrations',
    'Инфраструктура': 'Infrastructure',
    'Серверы и сети, которые просто работают.': 'Servers and networks that just work.',
    'VPS, деплой и бэкапы': 'VPS, deployment and backups',
    'Защищённый удалённый доступ': 'Secure remote access',
    'Cloudflare и мониторинг': 'Cloudflare and monitoring',
    'Интеллект': 'Intelligence',
    'AI внутри процессов, а не на баннерах.': 'AI inside your processes, not on banners.',
    'AI-ассистенты и боты': 'AI assistants and bots',
    'Базы знаний и RAG': 'Knowledge bases and RAG',
    'Анализ звонков и заявок': 'Call and lead analytics',

    // 02 — объекты
    '02 / Работы': '02 / Work',
    'Вещи, которые': 'Things that',
    'работают.': 'work.',
    'Каждый проект — отдельный объект: со своей задачей, архитектурой и характером.': 'Every project is an object of its own — with its own task, architecture and character.',
    '02.1 / Сайты': '02.1 / Websites',
    'Сайты и веб-продукты под ключ.': 'Turnkey websites and web products.',
    'Превью сайта resonara.ru': 'resonara.ru site preview',
    'Превью сайта useantares.com': 'useantares.com site preview',
    'Объект №01 · AI': 'Object №01 · AI',
    'AI-сервис: интерфейс, логика и инфраструктура.': 'AI service: interface, logic and infrastructure.',
    'Объект №02 · Гостеприимство': 'Object №02 · Hospitality',
    'Частная обсерватория с гостевым домом: бронирование ночей и прогноз неба на сегодня.': 'A private observatory with a guest house: night bookings and tonight’s sky forecast.',
    'Закрытый объект под NDA: световые потоки сходятся в одну точку, при наведении видна схема устройства': 'Closed object under NDA: streams of light converge into one point; on hover the system diagram appears',
    'NDA · показываем лично': 'NDA · shown in person',
    'Объект №02 · Инфраструктура · NDA': 'Object №02 · Infrastructure · NDA',
    'Поток': 'Flow',
    'Сетевой сервис по подписке: сайт, личный кабинет, платежи и серверная инфраструктура.': 'A subscription network service: website, customer account, payments and server infrastructure.',
    'Запросить показ →': 'Request a demo →',
    'Анимация: разные сайты по очереди собираются из частиц': 'Animation: different websites assemble from particles one after another',
    '[ ваш проект ]': '[ your project ]',
    'Объект №03 · Следующий': 'Object №03 · Next',
    'Следующий объект': 'Next object',
    'Может быть вашим. Расскажите о задаче →': 'It could be yours. Tell us about your task →',
    '02.2 / Автоматизация': '02.2 / Automation',
    'Процессы, которые работают без людей.': 'Processes that run without people.',
    'Схема: Битрикс24, задачи → Webhook → n8n → AI, анализ → Telegram; из Telegram вопрос возвращается к AI': 'Diagram: Bitrix24 tasks → Webhook → n8n → AI analysis → Telegram; questions from Telegram go back to AI',
    'Объект №04 · Автоматизация': 'Object №04 · Automation',
    'ИИ-разбор задач': 'AI task digest',
    'Каждое утро руководитель получает в Telegram разбор задач из Битрикс24 — и может задать боту вопрос по любой из них.': 'Every morning the manager gets a Telegram digest of Bitrix24 tasks — and can ask the bot about any of them.',
    'Схема: телефония → Битрикс24, запись → n8n → распознавание речи → AI, оценка → CRM, сделка': 'Diagram: telephony → Bitrix24 recording → n8n → speech recognition → AI scoring → CRM deal',
    'Объект №05 · Автоматизация': 'Object №05 · Automation',
    'ИИ-аудитор звонков': 'AI call auditor',
    'Каждый звонок расшифровывается и оценивается по скрипту продаж, итог появляется в карточке сделки.': 'Every call is transcribed and scored against the sales script; the result appears in the deal card.',
    'Анимация: из типовых систем по очереди собираются разные цепочки автоматизации': 'Animation: different automation chains assemble from common systems one after another',
    '[ ваш процесс ]': '[ your process ]',
    'Объект №06 · Следующий': 'Object №06 · Next',
    'Ваш процесс': 'Your process',
    'Опишите рутину — соберём автоматизацию →': 'Describe the routine — we’ll build the automation →',
    'Все объекты →': 'All objects →',
    // скрытый ряд «Интеграции» (<template>): переводы ждут его возвращения
    '02.3 / Интеграции': '02.3 / Integrations',
    'Системы, которые разговаривают друг с другом.': 'Systems that talk to each other.',
    'Схема: мини-приложение Telegram ⇄ API ⇄ CRM Битрикс24, из CRM уведомление менеджеру': 'Diagram: Telegram mini app ⇄ API ⇄ Bitrix24 CRM; the CRM notifies a manager',
    'Объект №07 · Интеграция': 'Object №07 · Integration',
    'Заявки из Telegram': 'Leads from Telegram',
    'Заявки из мини-приложения сразу попадают в CRM, а статус заказа возвращается клиенту.': 'Leads from the mini app go straight to the CRM, and the order status goes back to the customer.',
    'Схема: сайт, CRM и бот ⇄ AI-шлюз на Cloudflare ⇄ модели A, B и C; под шлюзом логи и лимиты': 'Diagram: website, CRM and bot ⇄ AI gateway on Cloudflare ⇄ models A, B and C; logs and limits under the gateway',
    'Объект №08 · Интеграция': 'Object №08 · Integration',
    'Единый AI-шлюз': 'Unified AI gateway',
    'Все сервисы компании обращаются к нейросетям через один шлюз: ключи, лимиты и журнал в одном месте.': 'Every company service reaches AI models through one gateway: keys, limits and logs in one place.',
    'Анимация: случайные пары и тройки систем обмениваются данными в обе стороны': 'Animation: random pairs and triples of systems exchange data both ways',
    '[ ваша интеграция ]': '[ your integration ]',
    'Объект №09 · Следующий': 'Object №09 · Next',
    'Ваша интеграция': 'Your integration',
    'Свяжем ваши системы между собой →': 'We’ll connect your systems →',

    // 03 — процесс
    '03 / Процесс': '03 / Process',
    'Как строится': 'How we build the',
    'дом.': 'house.',
    'Разбор': 'Discovery',
    'Созвон, цели и ограничения. На выходе — план и смета.': 'A call, goals and constraints. The outcome: a plan and an estimate.',
    'Проект': 'Design',
    'Структура, прототип и визуальная концепция.': 'Structure, prototype and visual concept.',
    'Сборка': 'Build',
    'Разработка, интеграции и тесты на реальных данных.': 'Development, integrations and tests on real data.',
    'Сопровождение': 'Support',
    'Запуск, мониторинг и развитие после релиза.': 'Launch, monitoring and growth after release.',

    // 04 — стоимость
    '04 / Цены': '04 / Pricing',
    'Стандарт.': 'Standard.',
    'Без сюрпризов.': 'No surprises.',
    'Точная смета — после разбора задачи. Здесь — ориентиры.': 'The exact estimate comes after discovery. Here are the benchmarks.',
    'Сайт': 'Website',
    'от [цена] ₽': 'from [price] ₽',
    'Лендинг или сайт-визитка под ключ.': 'A turnkey landing page or brochure site.',
    'Структура и тексты': 'Structure and copy',
    'Дизайн и адаптив': 'Design and responsive layout',
    'Запуск и аналитика': 'Launch and analytics',
    'Обсудить': 'Discuss',
    'Система': 'System',
    'Магазин или корпоративный сайт на 1С-Битрикс.': 'An online store or corporate website on 1C-Bitrix.',
    'Каталог и интеграции': 'Catalog and integrations',
    'CRM и автоматизация': 'CRM and automation',
    'Перенос и обучение': 'Migration and training',
    '[цена] ₽/мес': '[price] ₽/mo',
    'Поддержка, доработки и мониторинг.': 'Support, improvements and monitoring.',
    'Серверы и бэкапы': 'Servers and backups',
    'Доработки по задачам': 'Improvements on request',
    'Отчёт раз в месяц': 'Monthly report',

    // 05 — контакт и футер
    '05 / Контакт': '05 / Contact',
    'Построим что-то': 'Let’s build something',
    'своё.': 'private.',
    'Расскажите о задаче — предложим решение, сроки и смету.': 'Tell us about your task — we’ll propose a solution, timeline and estimate.',
    'Написать в Telegram →': 'Message us on Telegram →',
    'Почта': 'Email',
    'Наверх ↑': 'Back to top ↑',
    '© 2026 · Холодная точность. Приватность в основе.': '© 2026 · Cold precision. Private by design.',
    'Пересобрать блок': 'Rebuild block',

    // сцены (scenes.js): демо-сайты «ваш проект»
    'Кофейня «Зерно»': 'Grain Coffee',
    'Кофе, который': 'Coffee true',
    'помнит зерно.': 'to the bean.',
    'ЗЕРНО': 'GRAIN',
    'Заказ': 'Order',
    'Меню →': 'Menu →',
    'Северный юрист': 'North Law',
    'Право —': 'The law —',
    'на вашей стороне.': 'on your side.',
    'СЕВЕРНЫЙ ЮРИСТ': 'NORTH LAW',
    'Консультация': 'Consultation',
    'Услуги': 'Services',
    'Студия «Лён»': 'Linen Studio',
    'Красота': 'Beauty',
    'в деталях.': 'in the details.',
    'Лён': 'Linen',
    'Записаться': 'Book now',
    // сцены: схемы
    'Битрикс24 · задачи': 'Bitrix24 · tasks',
    'AI · анализ': 'AI · analysis',
    'вопрос → ответ': 'question → answer',
    'Телефония': 'Telephony',
    'Битрикс24 · запись': 'Bitrix24 · recording',
    'Распознавание речи': 'Speech recognition',
    'AI · оценка': 'AI · scoring',
    'CRM · сделка': 'CRM · deal',
    'Telegram · мини-приложение': 'Telegram · mini app',
    'Битрикс24 · CRM': 'Bitrix24 · CRM',
    'Менеджер': 'Manager',
    'status: в работе': 'status: in progress',
    'Бот': 'Bot',
    'AI-шлюз · Cloudflare': 'AI gateway · Cloudflare',
    'Логи и лимиты': 'Logs and limits',
    'Модель A': 'Model A',
    'Модель B': 'Model B',
    'Модель C': 'Model C',
    'Форма': 'Form',
    'Таблица': 'Sheet',
    '1С': '1C',
    'Склад': 'Warehouse',
    'Оплата': 'Payment',
    'Личный кабинет': 'Account',
    'Платежи': 'Payments',
    'Узлы ×N': 'Nodes ×N',
    'Мониторинг': 'Monitoring'
  };
  var ATTRS = ['aria-label', 'title', 'alt'];

  function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }
  // перевод строки с сохранением пробелов по краям; нет в словаре — строка как есть
  function conv(s) {
    var v = EN[norm(s)];
    return v == null ? null : /^\s*/.exec(s)[0] + v + /\s*$/.exec(s)[0];
  }
  var I = {
    lang: 'ru',
    t: function (s) { if (I.lang !== 'en' || s == null) return s; var v = EN[norm(s)]; return v == null ? s : v; },
    // Подменяет текст всей страницы. Русский оригинал узла запоминается при первом переводе (__ru) и
    // возвращается при переключении обратно. Текст, который пишет JS (подписи сцен, имя объекта), в словаре
    // не найдётся и останется как есть: его обновляют сами сцены и движок.
    apply: function (lang) {
      I.lang = lang === 'en' ? 'en' : 'ru';
      var en = I.lang === 'en', d = document, tw = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT, null), n, v;
      d.documentElement.lang = I.lang;
      while ((n = tw.nextNode())) {
        if (!en) { if (n.__ru != null) { n.nodeValue = n.__ru; n.__ru = null; } continue; }
        var src = n.__ru != null ? n.__ru : n.nodeValue;
        if ((v = conv(src)) != null) { n.__ru = src; if (n.nodeValue !== v) n.nodeValue = v; }
      }
      Array.prototype.forEach.call(d.querySelectorAll('[aria-label],[title],[alt],meta[name="description"]'), function (el) {
        var list = el.tagName === 'META' ? ['content'] : ATTRS;
        list.forEach(function (a) {
          if (!el.hasAttribute(a)) return;
          var ru = el.__ra && el.__ra[a];
          if (!en) { if (ru != null) { el.setAttribute(a, ru); el.__ra[a] = null; } return; }
          var src = ru != null ? ru : el.getAttribute(a);
          if ((v = conv(src)) != null) { (el.__ra = el.__ra || {})[a] = src; el.setAttribute(a, v); }
        });
      });
      if (I._title == null) I._title = d.title;
      d.title = en ? (conv(I._title) || I._title) : I._title;
      Array.prototype.forEach.call(d.querySelectorAll('[data-lang]'), function (a) {
        if (a.getAttribute('data-lang') === I.lang) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
      Array.prototype.forEach.call(d.querySelectorAll('.lang'), function (g) { g.setAttribute('data-cur', I.lang); });
    },
    // язык из адреса: ?lang=en — английский, всё остальное — русский (по умолчанию)
    fromUrl: function () { return /[?&]lang=en(&|$)/.test(location.search) ? 'en' : 'ru'; },
    // записать язык в адрес без перезагрузки: чтобы ссылкой на английскую версию можно было поделиться
    toUrl: function (lang) {
      if (!history.replaceState) return;
      var q = location.search.replace(/^\?/, '').split('&').filter(function (p) { return p && !/^lang=/.test(p); });
      if (lang === 'en') q.push('lang=en');
      try { history.replaceState(history.state, '', location.pathname + (q.length ? '?' + q.join('&') : '') + location.hash); } catch (e) {}
    }
  };
  window.PTI18N = I;
  if (I.fromUrl() === 'en') I.apply('en');
})();
