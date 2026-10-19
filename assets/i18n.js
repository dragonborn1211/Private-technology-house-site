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
    'Сайты, приложения, интеграции с Битрикс24 и Telegram, автоматизация и AI-ассистенты. Смета до старта, код ваш.': 'Websites, apps, Bitrix24 and Telegram integrations, automation and AI assistants. Estimate before we start, the code is yours.',

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
    // строка доверия: три пункта, каждый отдельным узлом
    'Договор и NDA': 'Contract and NDA',
    'Поддержка после запуска': 'Support after launch',
    'Язык сайта': 'Site language',
    'Обсудить проект': 'Start a project',
    'Обсудить проект →': 'Start a project\u00a0→',
    // объект первого экрана (assets/hero-objects.js) и панель «Кодекс студии»: вкладки принципов, подпись, стрелки
    'Хрустальный ферзь': 'Crystal queen',
    'Оптический прицел': 'Optical sight',
    'Ускоритель': 'Accelerator',
    'Шифровальные роторы': 'Cipher rotors',
    'Перо и бриллиант': 'Pen and diamond',
    'Предыдущий принцип': 'Previous principle',
    'Следующий принцип': 'Next principle',
    'Кодекс студии': 'The studio code',
    // слово на вкладке («Защита») и полное название принципа в подписи («Защита данных»)
    'Расчёт': 'Logic',
    'Точность': 'Precision',
    'Скорость': 'Speed',
    'Защита': 'Security',
    'Дизайн': 'Design',
    'Холодный расчёт': 'Cold calculation',
    'Защита данных': 'Data protection',
    'пауза': 'pause',
    'Данные и доступы под замком: шифрование, резервные копии, права по ролям.': 'Data and access under lock: encryption, backups, role-based permissions.',

    // 01 — направления

    // 02 — кейсы на главной (и те же карточки на cases.html)
    'Превью сайта resonara.ru': 'resonara.ru site preview',
    'Превью сайта useantares.com': 'useantares.com site preview',
    'AI-сервис: интерфейс, логика и инфраструктура.': 'AI service: interface, logic and infrastructure.',
    'Частная обсерватория с гостевым домом: бронирование ночей и прогноз неба на сегодня.': 'A private observatory with a guest house: night bookings and tonight’s sky forecast.',
    'Запросить показ →': 'Request a demo\u00a0→',
    'Анимация: разные сайты по очереди собираются из частиц': 'Animation: different websites assemble from particles one after another',
    '[ ваш проект ]': '[ your project ]',
    'Ваш сайт — следующий': 'Your site could be next',
    'Соберём такой же под вашу компанию →': 'We\'ll build one like this for your company\u00a0→',
    'Схема: Битрикс24, задачи → Webhook → n8n → AI, анализ → Telegram; из Telegram вопрос возвращается к AI': 'Diagram: Bitrix24 tasks → Webhook → n8n → AI analysis → Telegram; questions from Telegram go back to AI',
    // «03 / Готовые автоматизации» на главной и каталог automations.html; два кейса со схемами — тоже здесь
    'Схема: форма на сайте → Webhook → n8n на сервере → лид в Битрикс24 и сообщение менеджеру в Telegram': 'Diagram: website form → Webhook → n8n on our server → a lead in Bitrix24 and a Telegram message to the manager',
    'Заявки с сайта — в CRM и Telegram': 'Website leads — into the CRM and Telegram',
    'Схема: голосовое в Telegram → n8n на сервере → расшифровка речи → AI определяет исполнителя и срок → задача в Битрикс24 → ответ «готово» в Telegram': 'Diagram: a Telegram voice message → n8n on our server → speech to text → AI picks the assignee and deadline → a task in Bitrix24 → a “done” reply in Telegram',
    'Голосовое → задача в Битрикс24': 'Voice message → task in Bitrix24',
    'Схема: новый отзыв на Wildberries или Ozon → n8n на сервере → AI пишет черновик ответа → проверка в Telegram → ответ публикуется на маркетплейсе': 'Diagram: a new Wildberries or Ozon review → n8n on our server → AI drafts a reply → approval in Telegram → the reply goes live on the marketplace',
    'Ответы на отзывы Wildberries и Ozon': 'Replies to Wildberries and Ozon reviews',
    'AI-разбор задач': 'AI task digest',
    'Схема: телефония → Битрикс24, запись → n8n → распознавание речи → AI, оценка → CRM, сделка': 'Diagram: telephony → Bitrix24 recording → n8n → speech recognition → AI scoring → CRM deal',
    'AI-аудитор звонков': 'AI call auditor',
    'Анимация: из типовых систем по очереди собираются разные цепочки автоматизации': 'Animation: different automation chains assemble from common systems one after another',
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
    'Написать в Telegram →': 'Message us on Telegram\u00a0→',
    'Почта': 'Email',
    'Наверх ↑': 'Back to top ↑',
    '© 2026 · Холодная точность. Приватность в основе.': '© 2026 · Cold precision. Private by design.',
    'Собрать заново': 'Rebuild',
    'Собрать этот блок заново': 'Rebuild this block',

    // сцены (scenes.js): демо-сайты «ваш проект»
    'Кофейня «Зерно»': 'Grain Coffee',
    'Кофе, который': 'Coffee true',
    'помнит зерно.': 'to the bean.',
    'ЗЕРНО': 'GRAIN',
    'Заказ': 'Order',
    'Меню →': 'Menu\u00a0→',
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
    'Таблицы': 'Spreadsheets',
    'С чем соединяем': 'What we connect',
    'разово': 'one-off',
    'Звонок': 'Call',
    // ---------- «01 / Услуги» на главной (TASK-services.md) ----------
    'Сайты-презентации': 'Presentation websites',
    'Концепция': 'Concept',
    'Живой прототип': 'Live prototype',
    '3D и анимация': '3D and motion',
    'Тексты и фото': 'Copy and photos',
    'Приложения': 'Apps',
    'Серверы': 'Servers',
    'Настроим, поставим бэкапы и мониторинг, разберём аварию.': 'Setup, backups and monitoring — and a fix when something breaks.',
    'Сопровождение сайта': 'Website care',
    'Хостинг, мониторинг, бэкапы и правки каждый месяц.': 'Hosting, monitoring, backups and edits every month.',
    'Автоматизация и интеграции': 'Automation and integrations',
    'AI-ассистенты': 'AI assistants',
    'Агенты для отделов, базы знаний, разбор звонков, бот для Авито.': 'Agents for every department, knowledge bases, call reviews, an Avito sales bot.',

    // ---------- страница услуг services.html ----------
    'Навигационная цепочка': 'Breadcrumb',
    'Главная': 'Home',
    'Что мы строим': 'What we build',
    'и держим.': 'and keep alive.',
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
    'Срок': 'Timeline',
    'Формат': 'Format',
    'Обсудить задачу': 'Discuss a task',
    // сайты
    'Адаптив': 'Responsive',
    'SEO-база': 'SEO basics',
    'Запуск на домене': 'Launch on your domain',
    'от 2 недель': 'from 2 weeks',
    'Обсудить сайт': 'Discuss a website',
    'Сайт-презентация бренда': 'Brand presentation website',
    'Презентация объекта': 'Property or product showcase',
    'Коттеджный посёлок, жилой комплекс, отель или новый продукт: подача, которая продаёт до первого звонка.': 'A residential village, an apartment complex, a hotel or a new product: a presentation that sells before the first call.',
    'Каталог и магазин': 'Catalog and store',
    'Премиальная витрина: карточки товаров, заказы сразу в CRM и Telegram.': 'A premium storefront: product pages, orders straight to CRM and Telegram.',
    'Редизайн': 'Redesign',
    'Второй язык': 'Second language',
    // приложения
    'Публикация': 'Store release',
    'Связь с CRM': 'CRM connection',
    'Обсудить приложение': 'Discuss an app',
    'Мобильное приложение': 'Mobile app',
    'Android и iOS из одной кодовой базы: быстрее запуск, проще поддержка.': 'Android and iOS from one codebase: faster launch, simpler support.',
    'Переносим сайт или мини-приложение в полноценное приложение с тем же визуалом.': 'We turn a website or mini app into a full app with the same look.',
    'Google Play, RuStore и App Store: сборка, карточка, обновления.': 'Google Play, RuStore and App Store: builds, listing, updates.',
    // серверы
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
    // сопровождение
    'ежемесячно': 'monthly',
    'Обсудить сопровождение': 'Discuss website care',
    'Хостинг и домен': 'Hosting and domain',
    'Узнаём о сбое раньше вас и сразу берёмся за ремонт.': 'We learn about an outage before you do and start fixing it right away.',
    'Копии по расписанию: сайт можно вернуть на нужный день.': 'Scheduled copies: the site can be restored to any saved day.',
    'Правки': 'Edits',
    'Персональные данные': 'Personal data',
    // автоматизация
    'Битрикс24': 'Bitrix24',
    'Запуск': 'Launch',
    'запуск + ежемесячно': 'setup + monthly',
    'Описать процесс': 'Describe a process',
    'Заявки отовсюду': 'Leads from everywhere',
    'Отчёты в Telegram': 'Reports in Telegram',
    'Парсеры и мониторинг цен': 'Scrapers and price monitoring',
    'Каталог без ручного ввода': 'Catalog without manual entry',
    'Товары из прайсов и таблиц сами попадают в каталог сайта.': 'Products from price lists and spreadsheets land in your site catalog on their own.',
    'Любая связка по API': 'Any API connection',
    // кейс «Каталог на автопилоте» (cases.html и главная)
    'Схема: прайс в CSV → агент в LibreChat → n8n на сервере → AI пишет карточку и SEO → товар в каталоге сайта → отчёт в Telegram': 'Diagram: a CSV price list → an agent in LibreChat → n8n on our server → AI writes the product card and SEO → the product in the site catalog → a report in Telegram',
    'Каталог на автопилоте': 'Catalog on autopilot',
    // AI
    'Чат для сотрудников': 'Team chat',
    'База знаний': 'Knowledge base',
    'Разбор звонков': 'Call review',
    'AI-продавец для Авито': 'AI sales agent for Avito',
    'Отвечает покупателям в чатах круглосуточно и знает ваш каталог.': 'Answers buyers in chats around the clock and knows your catalog.',
    // кейс «Агенты для отделов» (cases.html)
    'Схема: продажи, бухгалтерия и поддержка ⇄ агенты в LibreChat ⇄ AI-шлюз на Cloudflare и база знаний': 'Diagram: sales, accounting and support ⇄ agents in LibreChat ⇄ an AI gateway on Cloudflare and a knowledge base',
    'Агенты для отделов': 'Agents for every department',
    // как работаем
    'Созвон': 'Call',
    // после запуска
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
    'Мониторинг и бэкапы': 'Monitoring and backups',
    // вопросы
    'Чей сайт после оплаты?': 'Who owns the site once it is paid for?',
    'Сколько это стоит?': 'How much does it cost?',
    'Где хранятся данные?': 'Where is the data stored?',
    'Вы работаете с Битрикс24 и 1С?': 'Do you work with Bitrix24 and 1C?',
    'Можно посмотреть закрытые проекты?': 'Can I see projects under NDA?',
    // контакт
    'На главную': 'Back to home',
    // меню, подвал (TASK-pages.md)
    'Разделы сайта': 'Site sections',
    'Вопросы': 'FAQ',
    // главная: «02 / Кейсы», «03 / Готовые автоматизации»
    '[ ваш процесс ]': '[ your process ]',
    // услуги: тонкие заголовки групп, «Готовые шаблоны», ссылки на кейсы
    'Заявки с сайта → CRM': 'Website leads → CRM',
    'Утренний разбор задач': 'Morning task review',
    'Мониторинг цен': 'Price monitoring',
    'Голосовое → задача': 'Voice message → task',
    'Ответы на отзывы WB и Ozon': 'Replies to WB and Ozon reviews',
    // кейсы (cases.html)
    'Сайты, автоматизации и AI, которые уже работают у клиентов. Приложения и закрытые проекты показываем на созвоне.': 'Websites, automations and AI already running for our clients. Apps and projects under NDA we show on a call.',
    'Сделано': 'Built',
    'и работает.': 'and running.',
    'Все': 'All',
    'Интеграции': 'Integrations',
    '[ под NDA ]': '[ under NDA ]',
    'Приложения и закрытые проекты': 'Apps and private projects',
    'Контакт': 'Contact',
    // готовые автоматизации (automations.html)
    'Готовые': 'Ready-made',
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
    'Каталог из прайса': 'Catalog from a price list',
    'Отвечает покупателям в чатах Авито круглосуточно и знает ваш каталог. Сложный вопрос передаёт менеджеру в Telegram.': 'Answers buyers in Avito chats around the clock and knows your catalog. Hard questions go to a manager in Telegram.',
    'Мониторинг цен конкурентов': 'Competitor price monitoring',
    'Подключить →': 'Connect\u00a0→',
    'Работает у клиента: AI-разбор задач →': 'Running for a client: AI task digest\u00a0→',
    'Работает у клиента: Каталог на автопилоте →': 'Running for a client: Catalog on autopilot\u00a0→',
    'Нет нужного шаблона?': 'No template that fits?',
    'Схема: сообщение в чате Авито → n8n на сервере → AI отвечает по каталогу → ответ в чат Авито; сложный вопрос — менеджеру в Telegram': 'Diagram: a message in an Avito chat → n8n on our server → AI answers from the catalog → a reply in the Avito chat; a hard question goes to a manager in Telegram',
    'Схема: каждое утро в 08:00 → n8n на сервере → цены конкурентов → строка в таблице → сводка в Telegram': 'Diagram: every morning at 08:00 → n8n on our server → competitor prices → a row in the spreadsheet → a summary in Telegram',
    'Что нужно от нас, чтобы подключить?': 'What do you need from us to connect?',
    'Доступ к сервисам, которые связываем: вебхук Битрикс24, бот в Telegram, ключ кабинета маркетплейса. Остальное настраиваем сами.': 'Access to the services we connect: a Bitrix24 webhook, a Telegram bot, a marketplace seller API key. We set up the rest ourselves.',
    'Где это работает?': 'Where does it run?',
    'На нашем сервере в России. Мы следим, чтобы сценарий работал, и правим его, если у сервиса поменялся API.': 'On our server in Russia. We make sure the workflow keeps running and fix it if a service changes its API.',
    'Можно доработать шаблон под нас?': 'Can the template be adapted to us?',
    'Сколько стоит?': 'How much is it?',
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
    'Возможно, адрес изменился или в ссылке опечатка.': 'The address may have changed, or the link has a typo.',
    // TASK-polish.md: тексты без штампов, заголовки — названия разделов
    'Делаем сайты, связываем CRM, Битрикс24 и Telegram, автоматизируем заявки и отчёты. Всё под вашу задачу: от первого экрана до сервера.': 'We build websites, connect CRM, Bitrix24 and Telegram, and automate leads and reports. Everything is built for your task, from the first screen to the server.',
    'Смета и сроки до старта': 'Estimate and timeline before we start',
    'Сначала смета и план работ, потом код. Риски называем до старта.': 'Estimate and work plan first, code second. We name the risks before we start.',
    'Что согласовали, то и делаем. Макет, поля в CRM и сумма совпадают со сметой.': 'We build what we agreed. The layout, the CRM fields and the total match the estimate.',
    'Живой прототип показываем рано. Правки идут по кругам, число кругов — в смете.': 'We show a live prototype early. Revisions go in rounds, and the number of rounds is in the estimate.',
    'Дизайн рисуем под компанию. Чужие темы и конструкторы не используем.': 'We design for your company. No third-party themes, no site builders.',
    // заголовки разделов с курсивным акцентом (.hx) — по частям, в том же порядке
    'Делаем один раз.': 'Built once.',
    'Наши работы': 'Our work',
    'Держим всегда.': 'Kept alive.',
    'решения': 'solutions',
    'Расскажите о': 'Tell us about your',
    'задаче': 'task',
    'Порядок': 'How a',
    'работы': 'project goes',
    'Вопросы о': 'Subscription',
    'подписке': 'FAQ',
    'Проект сдаём целиком, код ваш. Потом его можно забрать или оставить у нас на сопровождении.': 'We hand the project over in full, and the code is yours. Then you can take it in-house or leave it with us for ongoing care.',
    'Для компаний, которым важно, как их видят. Свой визуальный стиль, 3D и анимация.': 'For companies that care how they are seen. Your own visual style, 3D and animation.',
    'Android, iOS и Telegram mini-app: от интерфейса до публикации.': 'Android, iOS and Telegram mini-apps: from interface to publishing.',
    'Связываем Битрикс24, Telegram и любые сервисы с API.': 'We connect Bitrix24, Telegram and any service with an API.',
    'Сайты, автоматизации и AI, которые уже работают у клиентов.': 'Websites, automations and AI already running for our clients.',
    'Сайт · AI': 'Website · AI',
    'AI · Битрикс24': 'AI · Bitrix24',
    'Демо · ваш проект': 'Demo · your project',
    'Сайт · Гостеприимство': 'Website · Hospitality',
    'Автоматизация · Битрикс24': 'Automation · Bitrix24',
    'Автоматизация · LibreChat · n8n': 'Automation · LibreChat · n8n',
    'Интеграция · Битрикс24': 'Integration · Bitrix24',
    'Инфраструктура · Cloudflare': 'Infrastructure · Cloudflare',
    'Звонки расшифровываются и оцениваются по скрипту продаж. Итог появляется в карточке сделки.': 'Calls are transcribed and scored against the sales script. The result appears in the deal card.',
    'Заявка с сайта сразу становится лидом в Битрикс24, а менеджер получает сообщение в Telegram.': 'A website request instantly becomes a lead in Bitrix24, and the manager gets a Telegram message.',
    'Руководитель надиктовывает задачу в Telegram, и она появляется в Битрикс24 с исполнителем и сроком.': 'A manager dictates a task in Telegram, and it appears in Bitrix24 with an assignee and a deadline.',
    'Предложим решение, сроки и смету после первого созвона.': 'We will propose a solution, timeline and estimate after the first call.',
    'Точную смету называем после разбора задачи. Здесь ориентиры.': 'We give an exact estimate once we have looked into the task. These are guidelines.',
    // услуги
    'Сайты-презентации, приложения для Android, iOS и Telegram, серверы, сопровождение, автоматизация и AI-ассистенты. Проект делаем разово, поддержку ведём по подписке.': 'Presentation websites, Android, iOS and Telegram apps, servers, website care, automation and AI assistants. Projects are one-off, support is by subscription.',
    'Компания, продукт и команда в одной сильной подаче.': 'The company, product and team in one strong presentation.',
    'Переделываем существующий сайт под новый уровень компании.': 'We rework an existing site to match where the company is now.',
    'Английская версия с переключением на лету, как на этом сайте.': 'An English version with on-the-fly switching, like on this site.',
    'Android, iOS и Telegram: от интерфейса до публикации в магазинах. Связываем с сайтом и CRM.': 'Android, iOS and Telegram: from interface to store publishing. We connect the app to your website and CRM.',
    'Каталог, запись или заказ прямо в Telegram, без установки.': 'A catalog, booking or order right in Telegram, with nothing to install.',
    'Из сайта в приложение': 'From website to app',
    'Заявки и заказы из приложения сразу попадают в Битрикс24 и Telegram.': 'Requests and orders from the app go straight to Bitrix24 and Telegram.',
    'Настраиваем серверы компании, ставим бэкапы и мониторинг. Если что-то упало, находим причину и чиним.': 'We set up company servers, backups and monitoring. If something goes down, we find the cause and fix it.',
    'Сайт работает на нашем хостинге. Вы пишете в Telegram, что поменять, мы меняем. Следим, чтобы сайт открывался, и обновляем его.': 'The site runs on our hosting. You tell us in Telegram what to change, and we change it. We keep the site up and updated.',
    'Серверы в России, SSL-сертификат и продление домена без вашего участия.': 'Servers in Russia, an SSL certificate and domain renewal without your involvement.',
    'Тексты, фото, цены: пишете в Telegram, мы меняем. Объём правок указан в тарифе.': 'Texts, photos, prices: you write in Telegram, we change them. The amount of edits is set in the plan.',
    'Политика, согласия в формах и cookie-баннер по 152-ФЗ.': 'Privacy policy, form consents and a cookie banner under Russian law 152-FZ.',
    'Связываем всё, где есть API: сайт, приложение, CRM, мессенджеры, маркетплейсы. Сценарии работают на нашем сервере, мы за ними следим.': 'We connect anything with an API: website, app, CRM, messengers, marketplaces. The workflows run on our server, and we look after them.',
    'Заявки с сайта, из приложения, форм и мини-аппа попадают в Битрикс24 и Telegram.': 'Requests from the website, app, forms and mini-app go to Bitrix24 and Telegram.',
    'Утренняя сводка по задачам, продажам и звонкам с выводами.': 'A morning summary of tasks, sales and calls with conclusions.',
    'Цены и остатки конкурентов и маркетплейсов каждый день собираются в таблицу.': 'Competitor and marketplace prices and stock are collected into a spreadsheet every day.',
    'Если у сервиса есть API или вебхук, соединим его, в том числе в обе стороны.': 'If a service has an API or a webhook, we connect it, both ways if needed.',
    'Агенты отвечают клиентам, ищут по документам компании и разбирают звонки.': 'Agents answer customers, search company documents and review calls.',
    'Свой агент для отдела: знает регламенты и помогает с рутиной.': 'An agent for each department: it knows the procedures and helps with routine work.',
    'Ответы по вашим документам, инструкциям и прайсам за секунды.': 'Answers from your documents, manuals and price lists in seconds.',
    'Записи расшифровываются на нашем сервере, нейросеть оценивает разговор и отправляет итог в CRM или Telegram.': 'Recordings are transcribed on our server, AI scores the conversation and sends the result to the CRM or Telegram.',
    'Как работаем': 'How we work',
    'Три варианта: от «всё у вас» до «всё у нас».': 'Three options: from “all on your side” to “all on ours”.',
    'Ваш. Код и доступы отдаём целиком, а где он будет жить и кто будет его вести, решаете вы.': 'Yours. We hand over the code and access in full, and you decide where it lives and who runs it.',
    'Смету и сроки называем после первого созвона, до старта работ. Подписка оплачивается фиксированным платежом раз в месяц.': 'We give an estimate and timeline after the first call, before any work starts. A subscription is a fixed monthly payment.',
    'Российские проекты храним на серверах в России, зарубежные за рубежом. Формы, согласия и cookie настраиваем по 152-ФЗ.': 'We keep Russian projects on servers in Russia and international ones abroad. Forms, consents and cookies are set up under Russian law 152-FZ.',
    'С Битрикс24 да: заявки, сделки, вебхуки и REST API. Обмен с 1С делаем вместе с вашим специалистом по 1С.': 'Bitrix24, yes: leads, deals, webhooks and the REST API. 1C data exchange we build together with your 1C specialist.',
    'Да. Работы под NDA показываем на созвоне.': 'Yes. We show work under NDA on a call.',
    // кейсы и шаблоны
    'По утрам руководитель получает в Telegram разбор задач из Битрикс24 и может спросить бота о любой из них.': 'Every morning the manager gets a review of Bitrix24 tasks in Telegram and can ask the bot about any of them.',
    'Такой же для вас: шаблон «Утренний разбор задач» →': 'Want the same? The “Morning task review” template\u00a0→',
    'Менеджер загружает прайс в чат с агентом. Товары получают описания и SEO и попадают в каталог сайта, отчёт приходит в Telegram.': 'A manager uploads a price list to a chat with the agent. Products get descriptions and SEO and go into the website catalog, and the report arrives in Telegram.',
    'Такой же для вас: шаблон «Каталог из прайса» →': 'Want the same? The “Catalog from a price list” template\u00a0→',
    'Продажи, бухгалтерия и поддержка спрашивают своих агентов в одном чате. Агенты отвечают по документам компании. Все запросы к нейросетям идут через один шлюз с общими ключами и лимитами.': 'Sales, accounting and support ask their agents in one chat. The agents answer from company documents. All AI requests go through one gateway with shared keys and limits.',
    'Android, iOS и внутренние системы клиентов покажем на созвоне.': 'Android, iOS and clients’ internal systems we show on a call.',
    'Типовые сценарии для Битрикс24, Telegram и маркетплейсов. Выберите подходящий — подключим под ваши поля и правила.': 'Standard workflows for Bitrix24, Telegram and marketplaces. Pick one and we\'ll fit it to your fields and rules.',
    'Нужно от вас:': 'What we need from you:',
    'вебхук Битрикс24 и доступ к форме на сайте': 'a Bitrix24 webhook and access to the website form',
    'вебхук Битрикс24 и список сотрудников': 'a Bitrix24 webhook and a staff list',
    'API-ключи кабинетов Wildberries и Ozon': 'Wildberries and Ozon seller API keys',
    'вебхук Битрикс24': 'a Bitrix24 webhook',
    'доступ к сайту по API и прайс в CSV или Excel': 'API access to the website and a price list in CSV or Excel',
    'доступ к API Авито и каталог товаров': 'Avito API access and a product catalog',
    'список товаров и ссылки на конкурентов': 'a product list and links to competitors',
    'AI пишет ответ на новый отзыв. Вы одобряете его в Telegram одной кнопкой, и ответ публикуется.': 'AI writes a reply to a new review. You approve it in Telegram with one tap, and the reply is published.',
    'По утрам в Telegram приходит сводка по задачам Битрикс24 с выводами. Боту можно задать вопрос по любой задаче.': 'Every morning a summary of Bitrix24 tasks with conclusions arrives in Telegram. You can ask the bot about any task.',
    'Вы загружаете прайс в чат с агентом. Товары с описаниями и SEO появляются в каталоге сайта, отчёт приходит в Telegram.': 'You upload a price list to a chat with the agent. Products with descriptions and SEO appear in the website catalog, and the report arrives in Telegram.',
    'По утрам цены и остатки конкурентов собираются в таблицу, короткая сводка приходит в Telegram.': 'Every morning competitor prices and stock are collected into a spreadsheet, and a short summary arrives in Telegram.',
    'Да. Шаблон служит отправной точкой: поля, сообщения и правила настраиваем под ваш процесс.': 'Yes. A template is a starting point: fields, messages and rules are tuned to your process.',
    'Зависит от шаблона и объёма. Назовём после короткого созвона, подписка оплачивается фиксированным платежом раз в месяц.': 'It depends on the template and the volume. We will name the price after a short call, and the subscription is a fixed monthly payment.',
    // роли узлов на схемах (scenes.js, ROLE_RU): в английской версии — как раньше
    'источник': 'trigger',
    'вебхук': 'webhook',
    'сценарий': 'workflow',
    'результат': 'output',
    // TASK-structure.md: меню «Что делаем · Работы · Готовые решения · Как работаем»
    'Что делаем': 'What we do',
    'Работы': 'Work',
    'Готовые решения': 'Ready-made solutions',
    'Все направления →': 'All services\u00a0→',
    'Все работы →': 'All work\u00a0→',
    'Все решения →': 'All solutions\u00a0→',
    'Готовые решения →': 'Ready-made solutions\u00a0→',
    'Что делаем →': 'What we do\u00a0→',
    'Работы →': 'Work\u00a0→',
    'Перейти к содержанию': 'Skip to content',
    // карточка основателя в контакте (TASK-founder.md: от лица студии); имя — латиницей, монограмма — первая буква
    'Основатель студии': 'Founder',
    'Даниил Давыдовский': 'Daniil Davydovsky',
    'Д': 'D',
    'Лично на связи по каждому проекту — от первого созвона до запуска.': 'Personally in touch on every project, from the first call to launch.',
    'Прямая связь': 'Direct line',
    'Задачу обсуждаете с тем, кто отвечает за результат.': 'You discuss the task with the person responsible for the result.',
    'Свои серверы': 'Own servers',
    'Сайты и сценарии клиентов работают на нашей инфраструктуре, мы за ней следим.': 'Client sites and workflows run on our infrastructure, and we keep watch over it.',
    'Договор и NDA': 'Contract and NDA',
    'Работаем по договору. NDA подписываем по запросу, до начала работ.': 'We work under a contract. NDA on request, before work starts.',
    'О студии': 'About',
    // связь в подвале — иконки
    'Написать в Max': 'Message us on Max',
    'Написать в WhatsApp': 'Message us on WhatsApp',
    'Позвонить': 'Call',
    'Позвонить: +7 909 024-39-95': 'Call: +7 909 024-39-95',
    // ссылка на политику в подвале; сама политика — только по-русски
    'Политика конфиденциальности': 'Privacy policy (in Russian)',
    // плашка cookie (assets/consent.js, раздел 3)
    'Сайт использует cookie и Яндекс Метрику, чтобы понимать, какие страницы полезны. Подробнее — в': 'The site uses cookies and Yandex Metrica to see which pages are useful. Details are in the',
    'политике конфиденциальности': 'privacy policy (in Russian)',
    'Принять': 'Accept',
    'Отклонить': 'Decline',
    'Все готовые решения': 'All ready-made solutions',
    'Работы: сайты': 'Work: websites',
    'Работы: автоматизация': 'Work: automation',
    'Работы: AI': 'Work: AI',
    'Фильтр работ': 'Filter work',
    'Смотреть работы': 'View our work',
    'Автоматизации по шаблону. Вы даёте ключ или вебхук, мы подключаем на своём сервере и следим. Оплата помесячно.': 'Automations from a template. You give us a key or a webhook, we connect it on our server and keep an eye on it. Billed monthly.',
    'Что делаем — сайты, приложения, серверы, автоматизация и AI | Private Technology House': 'What we do — websites, apps, servers, automation and AI | Private Technology House',
    'Работы — сайты, автоматизация и AI | Private Technology House': 'Work — websites, automation and AI | Private Technology House',
    'Готовые решения: автоматизации для Битрикс24, Telegram, маркетплейсов и AI | Private Technology House': 'Ready-made solutions: automations for Bitrix24, Telegram, marketplaces and AI | Private Technology House',
    // услуги: «Как работаем», «Когда сайт готов», «Как устроена подписка»
    'Общий порядок для всех направлений.': 'The same order for every service.',
    'Разбираем задачу и то, что уже есть: сайт, CRM, документы.': 'We look at the task and what you already have: website, CRM, documents.',
    'Смета': 'Estimate',
    'Состав работ, сроки и цену называем до старта.': 'We name the scope, timeline and price before we start.',
    'Работа': 'Work in progress',
    'Показываем по ходу: прототип сайта, тестовую сборку приложения, сценарий на ваших данных.': 'We show results as we go: a website prototype, a test build of the app, a workflow on your data.',
    'Сдаём проект с кодом и доступами или подключаем подписку.': 'We hand over the project with its code and access, or start the subscription.',
    'Как идёт работа по каждому направлению': 'How work goes for each service',
    'Когда сайт готов': 'When the website is ready',
    'Сайт остаётся на нашем хостинге и переходит на подписку': 'The site stays on our hosting and moves to the',
    '«Сопровождение сайта»': '“Website care” plan',
    'Как устроена подписка': 'How the subscription works',
    'Запускаем один раз, дальше фиксированный платёж каждый месяц.': 'We set it up once, then it is a fixed payment every month.',
    'Этап 01': 'Stage 01',
    'Этап 02': 'Stage 02',
    'Этап 03': 'Stage 03',
    'Один раз': 'Once',
    'Каждый месяц': 'Every month',
    'Фиксированный платёж': 'Fixed payment',
    'Если откажетесь': 'If you cancel',
    'Данные ваши': 'Your data stays yours',
    // «Как работаем» (process.html)
    'Как работаем — порядок работы над сайтами, приложениями, автоматизацией и AI | Private Technology House': 'How we work — the process for websites, apps, automation and AI | Private Technology House',
    'Как идёт работа по каждому направлению: сайты, приложения, серверы, сопровождение, автоматизация и AI-ассистенты. Смета до старта, результат по ходу работы.': 'How work goes in each area: websites, apps, servers, website care, automation and AI assistants. An estimate before we start, results as we go.',
    'Как мы': 'How we',
    'работаем.': 'work.',
    'У каждого направления свой порядок работы. Смету называем до старта, результат показываем по ходу.': 'Each service has its own process. We give the estimate before we start and show results as we go.',
    'Проект · разово': 'Project · one-off',
    'Проект · по задаче': 'Project · per task',
    'Подписка · ежемесячно': 'Subscription · monthly',
    'Подписка · запуск + ежемесячно': 'Subscription · setup + monthly',
    'Созвон и смета': 'Call and estimate',
    'Вносим замечания. Число кругов правок фиксируем в смете.': 'We apply your comments. The number of revision rounds is fixed in the estimate.',
    'Разбор': 'Review',
    'Смотрим, что есть: сервер, сайт или сервис и что с ним не так.': 'We look at what you have: the server, website or service and what is wrong with it.',
    'Доступы': 'Access',
    'Вы даёте доступ к серверу, хостингу и домену.': 'You give us access to the server, hosting and domain.',
    'Настройка': 'Setup',
    'Docker, домены и SSL, бэкапы по расписанию, мониторинг. При аварии сначала находим причину.': 'Docker, domains and SSL, scheduled backups, monitoring. In an outage we find the cause first.',
    'Проверка': 'Testing',
    'Убеждаемся, что копия восстанавливается, а оповещение о сбое приходит.': 'We make sure a backup restores and an outage alert arrives.',
    'Передача': 'Handover',
    'Отдаём описание: что, где и как настроено. Доступы остаются у вас.': 'We hand over a description of what is set up, where and how. The access stays with you.',
    'доступ к серверу, хостингу и домену.': 'access to the server, hosting and domain.',
    'Переносим сайт на наш хостинг. Российские проекты — на серверах в России.': 'We move the site to our hosting. Russian projects stay on servers in Russia.',
    'Подключаем проверку доступности и копии по расписанию. О сбое узнаём раньше вас.': 'We set up uptime checks and scheduled backups. We learn about an outage before you do.',
    '152-ФЗ': '152-FZ',
    'Политика, согласия в формах и cookie-баннер.': 'Privacy policy, form consents and a cookie banner.',
    'Пишете в Telegram, что поменять: тексты, фото, цены. Объём правок указан в тарифе.': 'You tell us in Telegram what to change: texts, photos, prices. The amount of edits is set in the plan.',
    'Продлеваем домен и SSL, обновляем сайт. Платёж фиксированный.': 'We renew the domain and SSL and update the site. The payment is fixed.',
    'доступ к текущему хостингу и домену.': 'access to your current hosting and domain.',
    'Сборка': 'Build',
    'Под присмотром': 'Looked after',
    'Задача': 'The task',
    // TASK-clarity.md, часть A: заголовки групп на услугах, «Как устроена подписка», «Порядок работы», «Что входит в услугу»
    'проекты': 'projects',
    'Смета и сроки до старта. Код ваш.': 'Estimate and timeline before we start. The code is yours.',
    'Работает на наших серверах, мы за это отвечаем.': 'Runs on our servers, and it\'s on us.',
    'Ничего не переносите': 'Nothing to move',
    'Правки по сообщению в Telegram': 'Edits on a Telegram message',
    'Сбоями и обновлениями занимаемся мы': 'We handle outages and updates',
    'Настраиваем под ваш процесс.': 'We set it up for your process.',
    'переезжает на наш хостинг': 'moves to our hosting',
    'Сценарий': 'Workflow',
    'собираем на нашем сервере': 'built on our server',
    'Агент': 'Agent',
    'учим на ваших документах': 'trained on your documents',
    'Следим, чтобы всё работало, и отвечаем в Telegram.': 'We keep everything running and answer in Telegram.',
    'правки, бэкапы, продление': 'edits, backups, renewals',
    'следим и чиним при смене API': 'monitored and fixed when an API changes',
    'обновляем базу знаний': 'knowledge base kept up to date',
    'Забираете то, что ваше.': 'You take what is yours.',
    'передаём с кодом': 'handed over with the code',
    'останавливается': 'stops',
    'Данные': 'Data',
    'выгружаем по запросу': 'exported on request',
    'Что входит в услугу': 'What the service includes',
    // TASK-clarity.md, B2–B3: подписи в окне схемы (без «Шаблон ·»), «Нет нужного шаблона?»
    'Битрикс24 · Telegram': 'Bitrix24 · Telegram',
    'AI · маркетплейсы': 'AI · marketplaces',
    'AI · Авито': 'AI · Avito',
    'Маркетплейсы · таблица': 'Marketplaces · spreadsheet',
    'Опишите рутину, которую делаете руками. Соберём сценарий под ваш процесс и будем за ним следить.': 'Describe the routine you do by hand. We will build a workflow for your process and keep an eye on it.',
    'Описать процесс →': 'Describe your process\u00a0→',
    // TASK-clarity.md, B7: лид услуг разбит на узлы — «Проект» и «Подписка» цветами форматов
    'Шесть направлений в двух форматах.': 'Six services, two formats.',
    'Проект': 'A project',
    'делаем разово и сдаём целиком, код ваш.': 'is one-off and handed over in full, and the code is yours.',
    'Подписка': 'A subscription',
    'ежемесячная: всё работает на наших серверах, мы за это отвечаем.': 'is monthly: everything runs on our servers, and it\'s on us.',
    // B9: демо-сайт «Посёлок «Сосны»» (мини-сцена)
    'Посёлок «Сосны»': 'Pines Village',
    'Жить': 'Live',
    'среди сосен.': 'in the pines.',
    'СОСНЫ': 'PINES',
    'Участки': 'Plots',
    'Выбрать участок': 'Choose a plot',
    // TASK-clarity.md, B10: «Как работаем» — четыре секции
    'Сайты и приложения': 'Websites and apps',
    'Автоматизация и AI': 'Automation and AI',
    'Разбираем задачу и примеры, которые вам нравятся. Состав, сроки и цену называем до старта.': 'We go through the task and examples you like. Scope, timeline and price are named before we start.',
    'Показываем идею: первый экран сайта или ключевые экраны приложения. Согласуем до сборки.': 'We show the idea: the first screen of the site or the key screens of the app. Agreed before the build.',
    'Прототип': 'Prototype',
    'Сайт открываете на временном адресе, приложение ставите тестовой сборкой на телефон.': 'You open the site at a temporary address and install the app as a test build on your phone.',
    'Сайт переносим на ваш домен, приложение публикуем в Google Play, RuStore и App Store.': 'The site moves to your domain, the app is published to Google Play, RuStore and the App Store.',
    'доступ к домену, тексты и фото, если есть. Для приложения — аккаунты разработчика в магазинах.': 'access to the domain, texts and photos if you have them. For an app, developer accounts in the stores.',
    'Что входит в сайт': 'What a website includes',
    'Что входит в приложение': 'What an app includes',
    'Рассказываете, что делается руками или кому должен отвечать агент. Решаем, что отдать машине, а что оставить человеку.': 'You tell us what is done by hand or who the agent should answer. We decide what goes to the machine and what stays with people.',
    'Доступы и документы': 'Access and documents',
    'Вебхук Битрикс24, бот в Telegram, ключи API. Для агента — регламенты, прайсы, частые вопросы.': 'A Bitrix24 webhook, a Telegram bot, API keys. For an agent: policies, price lists, frequent questions.',
    'Собираем сценарий или агента на нашем сервере: n8n, Cloudflare Workers или свой код.': 'We build the workflow or the agent on our server: n8n, Cloudflare Workers or our own code.',
    'Прогоняем на реальных данных и вопросах, показываем результат и правим.': 'We run it on real data and questions, show the result and fix what is needed.',
    'Следим за работой, правим при смене API, обновляем базу знаний.': 'We watch it work, fix it when an API changes and update the knowledge base.',
    'доступы к сервисам; для агента — документы и примеры вопросов.': 'access to the services; for an agent, documents and sample questions.',
    'Описать задачу': 'Describe your task',
    // B11: кнопки сразу в Telegram — черновики сообщений; «Что входит» на телефоне; «Готовые решения.»
    'Хочу обсудить проект.': 'I\'d like to discuss a project.',
    'Хочу сайт для своей компании.': 'I\'d like a website for my company.',
    'Хочу обсудить сайт.': 'I\'d like to discuss a website.',
    'Хочу обсудить приложение.': 'I\'d like to discuss an app.',
    'Хочу обсудить задачу по серверу.': 'I\'d like to discuss a server task.',
    'Хочу обсудить сопровождение сайта.': 'I\'d like to discuss website care.',
    'Хочу автоматизировать процесс:': 'I\'d like to automate a process:',
    'Хочу AI-ассистента для задачи:': 'I\'d like an AI assistant for this task:',
    'Хочу посмотреть закрытые проекты.': 'I\'d like to see your NDA projects.',
    'Хочу подключить «Заявки с сайта — в CRM и Telegram».': 'I\'d like to connect "Website leads — into the CRM and Telegram".',
    'Хочу подключить «Голосовое → задача в Битрикс24».': 'I\'d like to connect "Voice message → task in Bitrix24".',
    'Хочу подключить «Ответы на отзывы Wildberries и Ozon».': 'I\'d like to connect "Replies to Wildberries and Ozon reviews".',
    'Хочу подключить «Утренний разбор задач».': 'I\'d like to connect "Morning task review".',
    'Хочу подключить «Каталог из прайса».': 'I\'d like to connect "Catalog from a price list".',
    'Хочу подключить «AI-продавец для Авито».': 'I\'d like to connect "AI sales agent for Avito".',
    'Хочу подключить «Мониторинг цен конкурентов».': 'I\'d like to connect "Competitor price monitoring".',
    'Ещё 3': '3 more',
    'Ещё 2': '2 more',
    'Свернуть': 'Show less',
    'решения.': 'solutions.'
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
      // превью ссылки (og:title / og:description) — те же строки, что <title> и description
      Array.prototype.forEach.call(d.querySelectorAll('[aria-label],[title],[alt],meta[name="description"],meta[property="og:title"],meta[property="og:description"]'), function (el) {
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
      var loc = d.querySelector('meta[property="og:locale"]'); if (loc) loc.setAttribute('content', en ? 'en_US' : 'ru_RU');
      if (I._title == null) I._title = d.title;
      d.title = en ? (conv(I._title) || I._title) : I._title;
      Array.prototype.forEach.call(d.querySelectorAll('[data-lang]'), function (a) {
        if (a.getAttribute('data-lang') === I.lang) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
      Array.prototype.forEach.call(d.querySelectorAll('.lang'), function (g) { g.setAttribute('data-cur', I.lang); });
      // язык сменился — то, что собирает JS по языку (ссылки в Telegram с черновиком, nav.js), пересобирается
      try { d.dispatchEvent(new CustomEvent('pt:lang', { detail: I.lang })); } catch (e) { /* старый браузер */ }
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
