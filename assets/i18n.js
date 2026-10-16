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
    // строка доверия: три пункта, каждый отдельным узлом
    'Смета и сроки — до старта': 'Estimate and timeline before we start',
    'Договор и NDA': 'Contract and NDA',
    'Поддержка после запуска': 'Support after launch',
    'Процесс': 'Process',
    'Язык сайта': 'Site language',
    'Обсудить проект': 'Start a project',
    'Обсудить проект →': 'Start a project →',
    // объект первого экрана (assets/hero-objects.js) и панель «Кодекс студии»: вкладки принципов, подпись, стрелки
    'Хрустальный ферзь': 'Crystal queen',
    'Оптический прицел': 'Optical sight',
    'Ускоритель': 'Accelerator',
    'Шифровальные роторы': 'Cipher rotors',
    'Перо и бриллиант': 'Pen and diamond',
    'Предыдущий принцип': 'Previous principle',
    'Следующий принцип': 'Next principle',
    'Кодекс студии': 'The studio code',
    // слово на вкладке («Защита») и полное название принципа в подписи («Безопасность»)
    'Расчёт': 'Logic',
    'Точность': 'Precision',
    'Скорость': 'Speed',
    'Защита': 'Security',
    'Дизайн': 'Design',
    'Холодный расчёт': 'Cold calculation',
    'Безопасность': 'Security',
    'пауза': 'pause',
    'Сначала считаем, потом делаем: варианты, риски и бюджет — до первой строки кода.': 'We calculate first, then build: options, risks and budget — before the first line of code.',
    'Ровно то, что нужно бизнесу: до пикселя в макете, до поля в CRM, до рубля в смете.': 'Exactly what the business needs: down to the pixel in the layout, the field in the CRM, the rouble in the estimate.',
    'Быстрый запуск без суеты: каждый этап идёт по рассчитанной траектории.': 'Fast launch without the rush: every stage follows a calculated trajectory.',
    'Данные и доступы под замком: шифрование, резервные копии, права по ролям.': 'Data and access under lock: encryption, backups, role-based permissions.',
    'Свой дизайн под ваш бизнес — без шаблонов и чужих тем.': 'A design of your own for your business — no templates, no borrowed themes.',

    // 01 — направления
    '01 / Услуги': '01 / Services',

    // 02 — кейсы на главной (и те же карточки на cases.html)
    'Вещи, которые': 'Things that',
    'работают.': 'work.',
    'Каждый проект — отдельный объект: со своей задачей, архитектурой и характером.': 'Every project is an object of its own — with its own task, architecture and character.',
    'Превью сайта resonara.ru': 'resonara.ru site preview',
    'Превью сайта useantares.com': 'useantares.com site preview',
    'AI-сервис: интерфейс, логика и инфраструктура.': 'AI service: interface, logic and infrastructure.',
    'Частная обсерватория с гостевым домом: бронирование ночей и прогноз неба на сегодня.': 'A private observatory with a guest house: night bookings and tonight’s sky forecast.',
    'Запросить показ →': 'Request a demo →',
    'Анимация: разные сайты по очереди собираются из частиц': 'Animation: different websites assemble from particles one after another',
    '[ ваш проект ]': '[ your project ]',
    'Следующий объект': 'Next object',
    'Может быть вашим. Расскажите о задаче →': 'It could be yours. Tell us about your task →',
    'Схема: Битрикс24, задачи → Webhook → n8n → AI, анализ → Telegram; из Telegram вопрос возвращается к AI': 'Diagram: Bitrix24 tasks → Webhook → n8n → AI analysis → Telegram; questions from Telegram go back to AI',
    // «03 / Готовые автоматизации» на главной и каталог automations.html; два кейса со схемами — тоже здесь
    'Схема: форма на сайте → Webhook → n8n на сервере → лид в Битрикс24 и сообщение менеджеру в Telegram': 'Diagram: website form → Webhook → n8n on our server → a lead in Bitrix24 and a Telegram message to the manager',
    'Заявки с сайта — в CRM и Telegram': 'Website leads — into the CRM and Telegram',
    'Каждая заявка сразу становится лидом в Битрикс24, а менеджер получает сообщение в Telegram. Ни одна не теряется.': 'Every request instantly becomes a lead in Bitrix24, and the manager gets a Telegram message. None get lost.',
    'Схема: голосовое в Telegram → n8n на сервере → расшифровка речи → AI определяет исполнителя и срок → задача в Битрикс24 → ответ «готово» в Telegram': 'Diagram: a Telegram voice message → n8n on our server → speech to text → AI picks the assignee and deadline → a task in Bitrix24 → a “done” reply in Telegram',
    'Голосовое → задача в Битрикс24': 'Voice message → task in Bitrix24',
    'Руководитель надиктовывает задачу в Telegram — она появляется в Битрикс24 с исполнителем и сроком.': 'The manager dictates a task in Telegram — it appears in Bitrix24 with an assignee and a deadline.',
    'Схема: новый отзыв на Wildberries или Ozon → n8n на сервере → AI пишет черновик ответа → проверка в Telegram → ответ публикуется на маркетплейсе': 'Diagram: a new Wildberries or Ozon review → n8n on our server → AI drafts a reply → approval in Telegram → the reply goes live on the marketplace',
    'Ответы на отзывы Wildberries и Ozon': 'Replies to Wildberries and Ozon reviews',
    'На каждый новый отзыв AI пишет ответ. Вы одобряете его в Telegram одной кнопкой — и он публикуется.': 'AI drafts a reply to every new review. You approve it in Telegram with one tap — and it goes live.',
    'ИИ-разбор задач': 'AI task digest',
    'Каждое утро руководитель получает в Telegram разбор задач из Битрикс24 — и может задать боту вопрос по любой из них.': 'Every morning the manager gets a Telegram digest of Bitrix24 tasks — and can ask the bot about any of them.',
    'Схема: телефония → Битрикс24, запись → n8n → распознавание речи → AI, оценка → CRM, сделка': 'Diagram: telephony → Bitrix24 recording → n8n → speech recognition → AI scoring → CRM deal',
    'ИИ-аудитор звонков': 'AI call auditor',
    'Каждый звонок расшифровывается и оценивается по скрипту продаж, итог появляется в карточке сделки.': 'Every call is transcribed and scored against the sales script; the result appears in the deal card.',
    'Анимация: из типовых систем по очереди собираются разные цепочки автоматизации': 'Animation: different automation chains assemble from common systems one after another',
    'Ваш процесс': 'Your process',
    'Опишите рутину — соберём автоматизацию →': 'Describe the routine — we’ll build the automation →',
    // скрытые кейсы cases.html (<template data-hidden-cases>): переводы ждут их показа
    'Схема: мини-приложение Telegram ⇄ API ⇄ CRM Битрикс24, из CRM уведомление менеджеру': 'Diagram: Telegram mini app ⇄ API ⇄ Bitrix24 CRM; the CRM notifies a manager',
    'Заявки из Telegram': 'Leads from Telegram',
    'Заявки из мини-приложения сразу попадают в CRM, а статус заказа возвращается клиенту.': 'Leads from the mini app go straight to the CRM, and the order status goes back to the customer.',
    'Схема: сайт, CRM и бот ⇄ AI-шлюз на Cloudflare ⇄ модели A, B и C; под шлюзом логи и лимиты': 'Diagram: website, CRM and bot ⇄ AI gateway on Cloudflare ⇄ models A, B and C; logs and limits under the gateway',
    'Единый AI-шлюз': 'Unified AI gateway',
    'Все сервисы компании обращаются к нейросетям через один шлюз: ключи, лимиты и журнал в одном месте.': 'Every company service reaches AI models through one gateway: keys, limits and logs in one place.',

    // 03 — процесс
    'Сопровождение': 'Support',

    // 04 — стоимость
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
    '04 / Контакт': '04 / Contact',
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
    'Склад': 'Warehouse',
    'Оплата': 'Payment',
    'Личный кабинет': 'Account',
    'Платежи': 'Payments',
    'Узлы ×N': 'Nodes ×N',
    'Мониторинг': 'Monitoring',
    // схемы ряда «Автоматизация» и кейсов страницы услуг; подписи связей латиницей не переводятся
    'Форма на сайте': 'Website form',
    'n8n · сервер': 'n8n · server',
    'Битрикс24 · новый лид': 'Bitrix24 · new lead',
    'Telegram · менеджеру': 'Telegram · to manager',
    'Telegram · голосовое': 'Telegram · voice',
    'Расшифровка речи': 'Speech to text',
    'Исполнитель и срок': 'Assignee and deadline',
    'Битрикс24 · задача': 'Bitrix24 · task',
    'Telegram · «готово»': 'Telegram · “done”',
    'Wildberries · отзыв': 'Wildberries · review',
    'Ozon · отзыв': 'Ozon · review',
    'Черновик ответа': 'Draft reply',
    'Telegram · одобрить': 'Telegram · approve',
    'одобрено ✓': 'approved ✓',
    'Прайс · CSV': 'Price list · CSV',
    'LibreChat · агент': 'LibreChat · agent',
    'Карточка и SEO': 'Product card and SEO',
    'Сайт · каталог': 'Website · catalog',
    'Telegram · отчёт': 'Telegram · report',
    'Продажи': 'Sales',
    'Бухгалтерия': 'Accounting',
    'Поддержка': 'Support',
    'LibreChat · агенты': 'LibreChat · agents',
    // «Ваш процесс»: новые источники в случайных цепочках
    'Авито': 'Avito',
    'Звонок': 'Call',
    // ---------- «01 / Услуги» на главной (TASK-services.md) ----------
    'Делаем один раз.': 'Built once.',
    'Держим всегда.': 'Kept alive.',
    'Проект сдаём целиком — он ваш. Дальше можно забрать его себе или оставить нам: следим, правим, отвечаем.': 'We hand the project over in full — it is yours. Then take it in-house or leave it with us: we monitor, update and stay accountable.',
    'Проекты': 'Projects',
    'Разово. Смета до старта, код — ваш.': 'One-off. Estimate before we start; the code is yours.',
    'Сайты-презентации': 'Presentation websites',
    'Сайт, который продаёт образ компании: свой визуальный язык, 3D и анимация.': 'A website that sells your company’s image: its own visual language, 3D and motion.',
    'Концепция': 'Concept',
    'Живой прототип': 'Live prototype',
    '3D и анимация': '3D and motion',
    'Тексты и фото': 'Copy and photos',
    'Приложения': 'Apps',
    'Android, iOS и Telegram mini-app — от интерфейса до публикации.': 'Android, iOS and Telegram mini apps — from interface to store release.',
    'Серверы': 'Servers',
    'Настроим, поставим бэкапы и мониторинг, разберём аварию.': 'Setup, backups and monitoring — and a fix when something breaks.',
    'По подписке': 'Subscription',
    'Ежемесячно. Работает на наших серверах — мы отвечаем.': 'Monthly. Runs on our servers — we are accountable.',
    'Сопровождение сайта': 'Website care',
    'Хостинг, мониторинг, бэкапы и правки каждый месяц.': 'Hosting, monitoring, backups and edits every month.',
    'Автоматизация и интеграции': 'Automation and integrations',
    'Заявки, задачи и данные ходят сами: Битрикс24, Telegram, любые API.': 'Leads, tasks and data move on their own: Bitrix24, Telegram, any API.',
    'AI-ассистенты': 'AI assistants',
    'Агенты для отделов, базы знаний, разбор звонков, бот для Авито.': 'Agents for every department, knowledge bases, call reviews, an Avito sales bot.',
    'Все услуги →': 'All services →',

    // ---------- страница услуг services.html ----------
    'Услуги — сайты-презентации, приложения, автоматизация и AI | Private Technology House': 'Services — presentation websites, apps, automation and AI | Private Technology House',
    'Премиальные сайты-презентации, приложения для Android, iOS и Telegram, серверы, сопровождение, автоматизация и AI-ассистенты. Проект — разово, поддержка — по подписке.': 'Premium presentation websites, Android, iOS and Telegram apps, servers, website care, automation and AI assistants. Projects are one-off; support is a subscription.',
    'Навигационная цепочка': 'Breadcrumb',
    'Главная': 'Home',
    'Что мы строим': 'What we build',
    'и держим.': 'and keep alive.',
    'Шесть направлений, два формата. Проект — разово: сдаём целиком, код ваш. Подписка — ежемесячно: работает на наших серверах, мы отвечаем.': 'Six areas, two formats. A project is one-off: delivered in full, the code is yours. A subscription is monthly: it runs on our servers and we are accountable.',
    'Разово': 'One-off',
    'проект': 'project',
    'Ежемесячно': 'Monthly',
    'подписка': 'subscription',
    'Разово: направления': 'One-off: areas',
    'Ежемесячно: направления': 'Monthly: areas',
    'Сайты': 'Websites',
    'Автоматизация': 'Automation',
    'Входит': 'Included',
    // группа «Проекты»
    '01 / Проекты': '01 / Projects',
    'Срок': 'Timeline',
    'Стоимость': 'Price',
    'Формат': 'Format',
    'по смете': 'per estimate',
    'Обсудить задачу': 'Discuss a task',
    // сайты
    'Сайт, который продаёт образ компании.': 'A website that sells your company’s image.',
    'Для брендов, которым сайт нужен как лицо, а не как форма заявки: свой визуальный язык, 3D и анимация, подача, которую запоминают.': 'For brands that need a website as their face, not a lead form: its own visual language, 3D and motion, a presentation people remember.',
    'Адаптив': 'Responsive',
    'SEO-база': 'SEO basics',
    'Запуск на домене': 'Launch on your domain',
    'от 2 недель': 'from 2 weeks',
    'Обсудить сайт': 'Discuss a website',
    'Сайт-презентация бренда': 'Brand presentation website',
    'Компания, продукт и команда — в одном сильном впечатлении.': 'Company, product and team — in one strong impression.',
    'Презентация объекта': 'Property or product showcase',
    'Коттеджный посёлок, жилой комплекс, отель или новый продукт: подача, которая продаёт до первого звонка.': 'A residential village, an apartment complex, a hotel or a new product: a presentation that sells before the first call.',
    'Каталог и магазин': 'Catalog and store',
    'Премиальная витрина: карточки товаров, заказы сразу в CRM и Telegram.': 'A premium storefront: product pages, orders straight to CRM and Telegram.',
    'Редизайн': 'Redesign',
    'Переупаковываем существующий сайт: тот же смысл, другой уровень.': 'We repackage an existing site: same message, a different level.',
    'Второй язык': 'Second language',
    'Английская версия с переключением на лету — как на этом сайте.': 'A second language with on-the-fly switching — like on this site.',
    // приложения
    'Приложения, которые хочется открывать.': 'Apps people want to open.',
    'Android, iOS и Telegram — от интерфейса до публикации в магазинах. Связываем с сайтом и CRM, чтобы заказы не терялись.': 'Android, iOS and Telegram — from interface to store release. Connected to your website and CRM so no order gets lost.',
    'Публикация': 'Store release',
    'Связь с CRM': 'CRM connection',
    'Обсудить приложение': 'Discuss an app',
    'Мобильное приложение': 'Mobile app',
    'Android и iOS из одной кодовой базы: быстрее запуск, проще поддержка.': 'Android and iOS from one codebase: faster launch, simpler support.',
    'Каталог, запись или заказ прямо в Telegram — без установки.': 'A catalog, booking or ordering right inside Telegram — nothing to install.',
    'Из сайта — в приложение': 'From website to app',
    'Переносим сайт или мини-приложение в полноценное приложение с тем же визуалом.': 'We turn a website or mini app into a full app with the same look.',
    'Google Play, RuStore и App Store: сборка, карточка, обновления.': 'Google Play, RuStore and App Store: builds, listing, updates.',
    'Заявки и заказы из приложения — сразу в Битрикс24 и Telegram.': 'Leads and orders from the app go straight to Bitrix24 and Telegram.',
    // серверы
    'Инфраструктура, о которой не вспоминают.': 'Infrastructure nobody has to think about.',
    'Настраиваем серверы компании, ставим бэкапы и мониторинг. Если что-то упало — заходим, находим причину, возвращаем в строй.': 'We set up company servers, backups and monitoring. If something goes down, we get in, find the cause and bring it back.',
    'Бэкапы': 'Backups',
    'разово, по задаче': 'one-off, per task',
    'Сервер под ключ': 'Turnkey server',
    'VPS, Docker, домены и SSL: готово к работе и описано.': 'VPS, Docker, domains and SSL: ready to work and documented.',
    'Бэкапы и мониторинг': 'Backups and monitoring',
    'Копии по расписанию и оповещение, если сервис перестал отвечать.': 'Scheduled copies and an alert when a service stops responding.',
    'Разбор аварии': 'Incident response',
    'Сайт или сервис не работает: находим причину и чиним.': 'A site or service is down: we find the cause and fix it.',
    'Переезд': 'Migration',
    'Переносим сайт или сервис на новый сервер без потери данных.': 'We move a site or service to a new server without losing data.',
    'Защита и скорость': 'Protection and speed',
    'Cloudflare: фильтрация атак, кэш и ускорение загрузки.': 'Cloudflare: attack filtering, caching and faster loading.',
    // группа «По подписке»
    '02 / По подписке': '02 / Subscription',
    // сопровождение
    'Вы пишете, что поменять. Остальное — наше.': 'You tell us what to change. The rest is on us.',
    'Сайт живёт на нашем хостинге: следим, чтобы он открывался, обновляем и вносим правки. Программист в штате не нужен.': 'The site lives on our hosting: we keep it online, update it and make your edits. No in-house developer needed.',
    'Правки каждый месяц': 'Monthly edits',
    'ежемесячно': 'monthly',
    'фиксированная': 'fixed',
    'Обсудить сопровождение': 'Discuss website care',
    'Хостинг и домен': 'Hosting and domain',
    'Серверы в России, SSL-сертификат, продление домена — без вашего участия.': 'Servers in Russia, an SSL certificate, domain renewal — without your involvement.',
    'Узнаём о сбое раньше вас и сразу берёмся за ремонт.': 'We learn about an outage before you do and start fixing it right away.',
    'Копии по расписанию: сайт можно вернуть на нужный день.': 'Scheduled copies: the site can be restored to any saved day.',
    'Правки': 'Edits',
    'Тексты, фото, цены: пишете в Telegram — мы меняем. Объём — в тарифе.': 'Copy, photos, prices: message us on Telegram and we change them. Volume depends on the plan.',
    'Персональные данные': 'Personal data',
    'Политика, согласия в формах и cookie-баннер — по 152-ФЗ.': 'Privacy policy, form consents and a cookie banner — per Russian law 152-FZ.',
    // автоматизация
    'Заявки, задачи и данные ходят сами.': 'Leads, tasks and data move on their own.',
    'Связываем всё, где есть API: сайт, приложение, CRM, мессенджеры, маркетплейсы. Сценарии работают на нашем сервере — мы за ними следим.': 'We connect anything with an API: website, app, CRM, messengers, marketplaces. The workflows run on our server, and we keep an eye on them.',
    'API и вебхуки': 'APIs and webhooks',
    'Битрикс24': 'Bitrix24',
    'Запуск': 'Launch',
    'запуск + ежемесячно': 'setup + monthly',
    'Описать процесс': 'Describe a process',
    'Заявки отовсюду': 'Leads from everywhere',
    'Сайт, приложение, формы, мини-апп — все заявки в Битрикс24 и Telegram.': 'Website, app, forms, mini app — every lead in Bitrix24 and Telegram.',
    'Отчёты в Telegram': 'Reports in Telegram',
    'Задачи, продажи, звонки — утренняя сводка с выводами.': 'Tasks, sales, calls — a morning digest with conclusions.',
    'Парсеры и мониторинг цен': 'Scrapers and price monitoring',
    'Цены и остатки конкурентов и маркетплейсов — каждый день в таблице.': 'Competitor and marketplace prices and stock — in a spreadsheet every day.',
    'Каталог без ручного ввода': 'Catalog without manual entry',
    'Товары из прайсов и таблиц сами попадают в каталог сайта.': 'Products from price lists and spreadsheets land in your site catalog on their own.',
    'Любая связка по API': 'Any API connection',
    'Есть API или вебхук — соединим, хоть в обе стороны.': 'If there is an API or a webhook, we connect it — both ways if needed.',
    // кейс «Каталог на автопилоте» (cases.html и главная)
    'Схема: прайс в CSV → агент в LibreChat → n8n на сервере → AI пишет карточку и SEO → товар в каталоге сайта → отчёт в Telegram': 'Diagram: a CSV price list → an agent in LibreChat → n8n on our server → AI writes the product card and SEO → the product in the site catalog → a report in Telegram',
    'Каталог на автопилоте': 'Catalog on autopilot',
    'Менеджер загружает прайс в чат с агентом. Каждый товар получает описание и SEO, попадает в каталог сайта, а отчёт приходит в Telegram.': 'A manager uploads a price list to a chat with the agent. Every product gets a description and SEO, lands in the site catalog, and a report arrives in Telegram.',
    // AI
    'AI внутри процессов, а не на баннерах.': 'AI inside processes, not on banners.',
    'Нейросети, которые разгружают людей: отвечают клиентам, ищут по документам и разбирают звонки.': 'AI that takes load off people: it answers customers, searches your documents and reviews calls.',
    'Чат для сотрудников': 'Team chat',
    'У каждого отдела свой агент: знает регламенты и помогает с рутиной.': 'Every department gets its own agent: it knows the procedures and helps with routine work.',
    'База знаний': 'Knowledge base',
    'Ответы по вашим документам, инструкциям и прайсам — за секунды.': 'Answers from your documents, manuals and price lists — in seconds.',
    'Разбор звонков': 'Call review',
    'Записи расшифровываются на нашем сервере, нейросеть оценивает разговор, итог — в CRM или Telegram.': 'Recordings are transcribed on our server, AI scores the conversation, and the result goes to CRM or Telegram.',
    'ИИ-продавец для Авито': 'AI sales agent for Avito',
    'Отвечает покупателям в чатах круглосуточно и знает ваш каталог.': 'Answers buyers in chats around the clock and knows your catalog.',
    // кейс «Агенты для отделов» (cases.html)
    'Схема: продажи, бухгалтерия и поддержка ⇄ агенты в LibreChat ⇄ AI-шлюз на Cloudflare и база знаний': 'Diagram: sales, accounting and support ⇄ agents in LibreChat ⇄ an AI gateway on Cloudflare and a knowledge base',
    'Агенты для отделов': 'Agents for every department',
    'Продажи, бухгалтерия и поддержка спрашивают своих агентов в одном чате. Ответы — по вашим документам, а запросы к нейросетям идут через один шлюз: ключи и лимиты в одном месте.': 'Sales, accounting and support ask their own agents in one chat. Answers come from your documents, and every AI request goes through one gateway: keys and limits in one place.',
    // как работаем
    '03 / Как работаем': '03 / How we work',
    'От созвона': 'From the first call',
    'до запуска.': 'to launch.',
    'Так идёт проект сайта или приложения.': 'This is how a website or app project goes.',
    'Созвон': 'Call',
    'Разбираем продукт и то, каким его должны увидеть клиенты.': 'We dig into the product and how your customers should see it.',
    'Предлагаем идею и визуальный язык. Согласуем до сборки.': 'We propose the idea and the visual language and agree on them before building.',
    'Собираем сайт на временном адресе: смотрите в браузере, а не на картинках.': 'We build the site at a temporary address: you review it in a browser, not in pictures.',
    'Вносим замечания. Число кругов правок фиксируем в смете.': 'We apply your feedback. The number of revision rounds is fixed in the estimate.',
    'Переносим на ваш домен и запускаем.': 'We move it to your domain and launch.',
    // после запуска
    '04 / После запуска': '04 / After launch',
    'Сайт ваш.': 'The site is yours.',
    'Дальше — как удобно.': 'Then — your call.',
    'Три варианта — от «всё у вас» до «всё у нас».': 'Three options — from “all with you” to “all with us”.',
    'Вариант 01': 'Option 01',
    'Вариант 02': 'Option 02',
    'Вариант 03': 'Option 03',
    'Рекомендуем': 'Recommended',
    'Забрать себе': 'Take it in-house',
    'Сайт переезжает на ваш хостинг. Дальше ведёте его сами или с вашим программистом.': 'The site moves to your hosting. From there you run it yourself or with your developer.',
    'Код и доступы целиком': 'Full code and access',
    'Инструкция по запуску': 'Deployment guide',
    'Без ежемесячных платежей': 'No monthly fees',
    'Без доплат': 'No extra cost',
    'Забрать с редактором': 'Take it with an editor',
    'Сайт на вашем хостинге плюс редактор: тексты, фото и цены меняете сами, без программиста.': 'The site on your hosting plus an editor: you change copy, photos and prices yourself, no developer needed.',
    'Всё из варианта 01': 'Everything in option 01',
    'Редактор контента': 'Content editor',
    'Короткая инструкция': 'Short guide',
    'Разовая доплата': 'One-time fee',
    'Оставить нам': 'Leave it with us',
    'Сайт остаётся на нашем хостинге — это «Сопровождение сайта» из раздела выше.': 'The site stays on our hosting — this is the Website care plan described above.',
    'Хостинг в России и SSL': 'Hosting in Russia and SSL',
    'Мониторинг и бэкапы': 'Monitoring and backups',
    'Техническая часть 152-ФЗ': 'Technical side of 152-FZ',
    // вопросы
    '05 / Вопросы': '05 / Questions',
    'Коротко': 'In short,',
    'о главном.': 'the essentials.',
    'Чей сайт после оплаты?': 'Who owns the site once it is paid for?',
    'Ваш. Код и доступы отдаём целиком, а где он будет жить и кто будет его вести — решаете вы.': 'You do. We hand over the code and access in full; where it lives and who runs it is your decision.',
    'Сколько это стоит?': 'How much does it cost?',
    'Смету и сроки называем после первого созвона, до старта работ. Подписка — фиксированный платёж в месяц.': 'We give an estimate and timeline after the first call, before any work starts. A subscription is a fixed monthly fee.',
    'Что будет, если отказаться от подписки?': 'What happens if I cancel the subscription?',
    'Сайт передадим вместе с кодом и поможем переехать. Автоматизации и боты работают на наших серверах и останавливаются вместе с подпиской; ваши данные выгрузим по запросу.': 'We hand the site over with its code and help you move it. Automations and bots run on our servers and stop when the subscription ends; we export your data on request.',
    'Где хранятся данные?': 'Where is the data stored?',
    'Российские проекты — на серверах в России, зарубежные — за рубежом. Формы, согласия и cookie настраиваем по 152-ФЗ.': 'Russian projects on servers in Russia, international ones abroad. Forms, consents and cookies are set up per Russian law 152-FZ.',
    'Вы работаете с Битрикс24 и 1С?': 'Do you work with Bitrix24 and 1C?',
    'С Битрикс24 — да: заявки, сделки, вебхуки и REST API. Обмен с 1С делаем вместе с вашим специалистом по 1С.': 'Bitrix24 — yes: leads, deals, webhooks and the REST API. 1C data exchange we build together with your 1C specialist.',
    'Можно посмотреть закрытые проекты?': 'Can I see projects under NDA?',
    'Да. Часть работ под NDA — показываем на созвоне.': 'Yes. Some of our work is under NDA — we show it on a call.',
    // контакт
    '06 / Контакт': '06 / Contact',
    'Расскажите': 'Tell us',
    'о задаче.': 'about your task.',
    'Предложим решение, сроки и смету — после первого созвона.': 'We will propose a solution, timeline and estimate after the first call.',
    'На главную': 'Back to home',
    // меню, подвал (TASK-pages.md)
    'Кейсы': 'Cases',
    'Автоматизации': 'Automations',
    'Готовые автоматизации': 'Ready-made automations',
    'Разделы сайта': 'Site sections',
    'Вопросы': 'FAQ',
    'Связь': 'Contact',
    // главная: «02 / Кейсы», «03 / Готовые автоматизации»
    'Смотреть кейсы': 'View cases',
    '02 / Кейсы': '02 / Cases',
    'Объект №01 · Сайт · AI': 'Object №01 · Website · AI',
    'Объект №02 · Сайт · Гостеприимство': 'Object №02 · Website · Hospitality',
    'Объект №03 · AI · Битрикс24': 'Object №03 · AI · Bitrix24',
    'Объект №04 · Автоматизация · Битрикс24': 'Object №04 · Automation · Bitrix24',
    'Объект №05 · Автоматизация · LibreChat · n8n': 'Object №05 · Automation · LibreChat · n8n',
    'Объект №06 · AI · LibreChat': 'Object №06 · AI · LibreChat',
    'Объект №07 · Интеграция · Битрикс24': 'Object №07 · Integration · Bitrix24',
    'Объект №08 · Инфраструктура · Cloudflare': 'Object №08 · Infrastructure · Cloudflare',
    'Объект · Следующий': 'Object · Next',
    'Все кейсы →': 'All cases →',
    '6 работ: сайты, автоматизация, AI': '6 projects: websites, automation, AI',
    '03 / Готовые автоматизации': '03 / Ready-made automations',
    'Запускаем': 'We launch',
    'по шаблону.': 'from templates.',
    'Даёте ключ или вебхук — подключаем на нашем сервере и следим. Оплата помесячно.': 'You give us a key or a webhook — we connect it on our server and keep watch. Billed monthly.',
    'Шаблон · Битрикс24 · Telegram': 'Template · Bitrix24 · Telegram',
    'Шаблон · AI · Битрикс24': 'Template · AI · Bitrix24',
    'Шаблон · AI · маркетплейсы': 'Template · AI · marketplaces',
    'Под ваш процесс': 'For your process',
    '[ ваш процесс ]': '[ your process ]',
    'Все шаблоны →': 'All templates →',
    '04 / Цены': '04 / Pricing',
    // услуги: тонкие заголовки групп, «Готовые шаблоны», ссылки на кейсы
    'Разово. Смета и сроки — до старта.': 'One-off. Estimate and timeline before we start.',
    'Ежемесячно. Российские проекты — на серверах в России.': 'Monthly. Russian projects run on servers in Russia.',
    'Кейсы: сайты': 'Cases: websites',
    'Кейсы: автоматизация': 'Cases: automation',
    'Кейсы: AI': 'Cases: AI',
    'Готовые шаблоны': 'Ready-made templates',
    'Заявки с сайта → CRM': 'Website leads → CRM',
    'Утренний разбор задач': 'Morning task review',
    'Мониторинг цен': 'Price monitoring',
    'Голосовое → задача': 'Voice message → task',
    'Ответы на отзывы WB и Ozon': 'Replies to WB and Ozon reviews',
    'Все шаблоны': 'All templates',
    // кейсы (cases.html)
    'Кейсы — сайты, автоматизация и AI | Private Technology House': 'Cases — websites, automation and AI | Private Technology House',
    'Сайты, автоматизации и AI, которые уже работают у клиентов. Приложения и закрытые проекты показываем на созвоне.': 'Websites, automations and AI already running for our clients. Apps and projects under NDA we show on a call.',
    'Сделано': 'Built',
    'и работает.': 'and running.',
    'Фильтр кейсов': 'Case filter',
    'Все': 'All',
    'Интеграции': 'Integrations',
    'Такой же для вас — шаблон «Утренний разбор задач» →': 'Want the same? The “Morning task review” template →',
    'Такой же для вас — шаблон «Каталог из прайса» →': 'Want the same? The “Catalog from a price list” template →',
    '[ под NDA ]': '[ under NDA ]',
    'Под NDA': 'Under NDA',
    'Приложения и закрытые проекты': 'Apps and private projects',
    'Android, iOS и внутренние системы клиентов — покажем на созвоне.': 'Android, iOS and clients’ internal systems — we’ll show them on a call.',
    'Контакт': 'Contact',
    // готовые автоматизации (automations.html)
    'Готовые автоматизации — Битрикс24, Telegram, маркетплейсы, AI | Private Technology House': 'Ready-made automations — Bitrix24, Telegram, marketplaces, AI | Private Technology House',
    'Запускаем по шаблону на нашем сервере: вы даёте ключ или вебхук — мы подключаем и следим. Оплата — помесячно.': 'We launch from a template on our server: you give us a key or a webhook — we connect it and keep watch. Billed monthly.',
    'Готовые': 'Ready-made',
    'автоматизации.': 'automations.',
    'Как подключаем': 'How we connect',
    'Доступ': 'Access',
    'Вебхук Битрикс24, бот в Telegram или ключ кабинета маркетплейса.': 'A Bitrix24 webhook, a Telegram bot or a marketplace seller API key.',
    'Подключение': 'Setup',
    'Настраиваем шаблон под ваши поля, сообщения и правила.': 'We fit the template to your fields, messages and rules.',
    'Работает': 'Running',
    'Сценарий крутится на нашем сервере, мы за ним следим. Платите помесячно.': 'The workflow runs on our server and we look after it. You pay monthly.',
    'Фильтр шаблонов': 'Template filter',
    'Заявки': 'Leads',
    'Задачи': 'Tasks',
    'Товары': 'Products',
    'Отчёты': 'Reports',
    'Каждая заявка сразу становится лидом в Битрикс24, а менеджер получает сообщение в Telegram.': 'Every request instantly becomes a lead in Bitrix24, and the manager gets a Telegram message.',
    'Каждое утро — сводка по задачам Битрикс24 с выводами в Telegram. Боту можно задать вопрос по любой задаче.': 'Every morning — a summary of your Bitrix24 tasks with conclusions in Telegram. You can ask the bot about any task.',
    'Шаблон · сайт · AI': 'Template · website · AI',
    'Каталог из прайса': 'Catalog from a price list',
    'Загружаете прайс в чат с агентом — товары с описаниями и SEO появляются в каталоге сайта, отчёт приходит в Telegram.': 'Upload a price list to a chat with the agent — products with descriptions and SEO appear in the website catalog, and the report arrives in Telegram.',
    'Шаблон · AI · Авито': 'Template · AI · Avito',
    'Отвечает покупателям в чатах Авито круглосуточно и знает ваш каталог. Сложный вопрос передаёт менеджеру в Telegram.': 'Answers buyers in Avito chats around the clock and knows your catalog. Hard questions go to a manager in Telegram.',
    'Шаблон · маркетплейсы · таблица': 'Template · marketplaces · spreadsheet',
    'Мониторинг цен конкурентов': 'Competitor price monitoring',
    'Каждое утро — цены и остатки конкурентов и маркетплейсов в таблице и короткая сводка в Telegram.': 'Every morning — competitor and marketplace prices and stock in a spreadsheet, plus a short summary in Telegram.',
    'Нужно от вас: вебхук Битрикс24 и доступ к форме на сайте': 'You provide: a Bitrix24 webhook and access to the website form',
    'Нужно от вас: вебхук Битрикс24 и список сотрудников': 'You provide: a Bitrix24 webhook and a staff list',
    'Нужно от вас: API-ключи кабинетов Wildberries и Ozon': 'You provide: Wildberries and Ozon seller API keys',
    'Нужно от вас: вебхук Битрикс24': 'You provide: a Bitrix24 webhook',
    'Нужно от вас: доступ к сайту по API и прайс в CSV или Excel': 'You provide: API access to the website and a price list in CSV or Excel',
    'Нужно от вас: доступ к API Авито и каталог товаров': 'You provide: Avito API access and a product catalog',
    'Нужно от вас: список товаров и ссылки на конкурентов': 'You provide: a product list and links to competitors',
    'Подключить →': 'Connect →',
    'Работает у клиента: ИИ-разбор задач →': 'Running for a client: AI task digest →',
    'Работает у клиента: Каталог на автопилоте →': 'Running for a client: Catalog on autopilot →',
    'Нет нужного шаблона?': 'No template that fits?',
    'Опишите рутину — соберём автоматизацию под вас →': 'Describe the routine — we’ll build an automation for you →',
    'Схема: сообщение в чате Авито → n8n на сервере → AI отвечает по каталогу → ответ в чат Авито; сложный вопрос — менеджеру в Telegram': 'Diagram: a message in an Avito chat → n8n on our server → AI answers from the catalog → a reply in the Avito chat; a hard question goes to a manager in Telegram',
    'Схема: каждое утро в 08:00 → n8n на сервере → цены конкурентов → строка в таблице → сводка в Telegram': 'Diagram: every morning at 08:00 → n8n on our server → competitor prices → a row in the spreadsheet → a summary in Telegram',
    'о подписке.': 'about the subscription.',
    'Что нужно от нас, чтобы подключить?': 'What do you need from us to connect?',
    'Доступ к сервисам, которые связываем: вебхук Битрикс24, бот в Telegram, ключ кабинета маркетплейса. Остальное настраиваем сами.': 'Access to the services we connect: a Bitrix24 webhook, a Telegram bot, a marketplace seller API key. We set up the rest ourselves.',
    'Где это работает?': 'Where does it run?',
    'На нашем сервере в России. Мы следим, чтобы сценарий работал, и правим его, если у сервиса поменялся API.': 'On our server in Russia. We make sure the workflow keeps running and fix it if a service changes its API.',
    'Можно доработать шаблон под нас?': 'Can the template be adapted to us?',
    'Да. Шаблон — отправная точка: поля, сообщения и правила настраиваем под ваш процесс.': 'Yes. A template is a starting point: fields, messages and rules are tuned to your process.',
    'Сколько стоит?': 'How much is it?',
    'Зависит от шаблона и объёма. Назовём после короткого созвона; подписка — фиксированный платёж в месяц.': 'It depends on the template and the volume. We’ll name it after a short call; the subscription is a fixed monthly fee.',
    'Что будет, если отказаться?': 'What happens if I cancel?',
    'Сценарий останавливается вместе с подпиской; ваши данные выгрузим по запросу.': 'The workflow stops with the subscription; we export your data on request.',
    // схемы каталога (scenes.js)
    'Авито · чат': 'Avito · chat',
    'Ответ по каталогу': 'Catalog-based reply',
    'Авито · ответ': 'Avito · reply',
    'Каждое утро · 08:00': 'Every morning · 08:00',
    'Цены конкурентов': 'Competitor prices',
    'Таблица · цены': 'Spreadsheet · prices',
    'Telegram · сводка': 'Telegram · summary',
    // 404
    'Страница не найдена — 404 | Private Technology House': 'Page not found — 404 | Private Technology House',
    'Такой страницы': 'No such',
    'нет.': 'page.',
    'Возможно, адрес изменился или в ссылке опечатка.': 'The address may have changed, or the link has a typo.'
  };
  var ATTRS = ['aria-label', 'title', 'alt'];

  function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }
  // перевод строки с сохранением пробелов по краям; нет в словаре — строка как есть
  function conv(s) {
    var v = EN[norm(s)];
    return v == null ? null : /^\s*/.exec(s)[0] + v + /\s*$/.exec(s)[0];
  }
  function ld(o) {
    if (typeof o === 'string') { var v = EN[norm(o)]; return v == null ? o : v; }
    if (Array.isArray(o)) return o.map(ld);
    if (!o || typeof o !== 'object') return o;
    var r = {};
    for (var k in o) r[k] = /^(@|url$|item$|sameAs$)/.test(k) ? o[k] : ld(o[k]);
    return r;
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
      // разметка для поисковиков (JSON-LD): строки — по тому же словарю, адреса и типы как есть
      Array.prototype.forEach.call(d.querySelectorAll('script[type="application/ld+json"]'), function (sc) {
        if (sc.__ru == null) sc.__ru = sc.textContent;
        if (!en) { sc.textContent = sc.__ru; return; }
        try { sc.textContent = JSON.stringify(ld(JSON.parse(sc.__ru))); } catch (e) { /* не JSON — как есть */ }
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
  // английская версия не теряется при переходе по своим ссылкам (меню, подвал, «Все кейсы»): ?lang=en дописывается
  // в адрес ссылки в момент нажатия и снимается сразу после — разметка остаётся русской, выбор нигде не хранится
  function carry(e) {
    if (I.lang !== 'en') return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.hasAttribute('data-lang') || a.origin !== location.origin || /(^|&)lang=/.test(a.search.slice(1)) || !/(\/|\.html)$/.test(a.pathname)) return;
    var h = a.getAttribute('href');
    a.search = (a.search ? a.search + '&' : '?') + 'lang=en';
    setTimeout(function () { a.setAttribute('href', h); }, 0);
  }
  document.addEventListener('click', carry, true);
  document.addEventListener('auxclick', carry, true);
  if (I.fromUrl() === 'en') I.apply('en');
})();
