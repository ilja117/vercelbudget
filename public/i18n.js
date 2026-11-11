// UsBudget · мова інтерфейсу. Українська — основна; англійська накладається поверх сторінки.
// Дані користувачів (імена, назви, власні категорії) не перекладаються: словник містить лише тексти інтерфейсу
// і стандартні категорії, які застосунок створює сам.
(function () {
  'use strict';
  var LANG = 'uk';
  try { LANG = localStorage.getItem('usbudget_lang') === 'en' ? 'en' : 'uk'; } catch (e) {}
  window.USB_LANG = LANG;
  window.USB_LOCALE = LANG === 'en' ? 'en-GB' : 'uk-UA';
  document.documentElement.lang = LANG;
  window.setAppLanguage = function (l) {
    try { localStorage.setItem('usbudget_lang', l === 'en' ? 'en' : 'uk'); } catch (e) {}
    location.reload();
  };
  if (LANG !== 'en') return;

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var M_NOM = ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'];
  var M_LOC = ['січні', 'лютому', 'березні', 'квітні', 'травні', 'червні', 'липні', 'серпні', 'вересні', 'жовтні', 'листопаді', 'грудні'];
  var M_SHORT = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
  var monthOf = function (w, list) { var i = list.indexOf(String(w).toLowerCase()); return i < 0 ? null : i; };

  var D = {
    // Оболонка, меню, вхід
    'Бюджет для двох': 'Budget for two', 'Головна': 'Home', 'Записи': 'Records', 'План': 'Plan', 'Особисте': 'Personal', 'Ми': 'Us',
    'Розділи': 'Sections', 'Підрозділи': 'Subsections', 'Світла або темна тема': 'Light or dark theme', 'Світла / темна тема': 'Light / dark theme',
    'Налаштування': 'Settings', 'Попередній місяць': 'Previous month', 'Наступний місяць': 'Next month',
    'Онлайн': 'Online', 'Синхронізовано': 'Synced', 'Помилка мережі': 'Network error', 'Підключення...': 'Connecting…', 'Офлайн': 'Offline',
    'Увійдіть, щоб побачити спільний бюджет.': 'Sign in to see your shared budget.', 'Пароль': 'Password', 'Увійти': 'Sign in', 'Забули пароль?': 'Forgot password?',
    'Невірний email або пароль.': 'Wrong email or password.', 'Неправильний формат email.': 'Invalid email format.',
    'Забагато спроб. Зачекайте кілька хвилин.': 'Too many attempts. Wait a few minutes.', 'Немає інтернету. Для першого входу потрібна мережа.': 'No internet. The first sign-in needs a connection.',
    'Цей акаунт вимкнено.': 'This account is disabled.', 'Не вдалося увійти. Спробуйте ще раз.': 'Could not sign in. Try again.',
    'Введіть email, і ми надішлемо посилання для зміни пароля.': 'Enter your email and we will send a password reset link.',
    'Перевірте пошту': 'Check your email', 'Якщо такий акаунт існує, на нього надіслано посилання для зміни пароля.': 'If this account exists, a password reset link has been sent to it.',
    'Акаунт': 'Account', 'Ви увійшли як': 'Signed in as', 'Вийти з акаунта': 'Sign out', 'Вийти з акаунта?': 'Sign out?', 'Вийти': 'Sign out',
    'Немає доступу до бази': 'No access to the database',
    // Загальне
    'Скасувати': 'Cancel', 'Підтвердити': 'Confirm', 'Зрозуміло': 'OK', 'Сповіщення': 'Notice', 'Успіх': 'Done', 'Збережено': 'Saved', 'Готово': 'Done',
    'Зберегти': 'Save', 'Додати': 'Add', '+ Додати': '+ Add', 'Редагувати': 'Edit', 'Видалити': 'Delete', 'Відмінити': 'Undo', 'Прибрати': 'Remove',
    'Усі': 'All', 'Новіші': 'Newest', 'Старіші': 'Oldest', 'Сума ↓': 'Amount ↓', 'Сума ↑': 'Amount ↑', 'Пошук…': 'Search…', 'Пошук...': 'Search…',
    'Дата': 'Date', 'Назва': 'Name', 'Сума': 'Amount', 'Сума (': 'Amount (', 'Категорія': 'Category', 'Тип': 'Type', 'Примітка': 'Note', 'Джерело': 'Source',
    'Немає записів': 'No records', 'Необов’язково': 'Optional', 'Необов’язково': 'Optional', 'Профілі та дати оновлено!': 'Profiles and dates updated!', 'Параметри збережено!': 'Settings saved!',
    'Однакові імена': 'Same names', 'Імена партнерів мають відрізнятися: за ними застосунок розрізняє, хто платив.': 'Partner names must differ: the app uses them to tell who paid.',
    // Головна
    'Можна ще витратити': 'Still available to spend', 'На спільній картці:': 'On the shared card:', 'Спільна картка': 'Shared card', 'Ліміти': 'Limits', 'Усі категорії': 'All categories',
    'вичерпано': 'used up', 'вклад цього місяця': 'paid this month', 'Вирівняти': 'Settle up', 'Баланс між вами рівний': 'You are even',
    'Найближчі платежі': 'Upcoming payments', 'прострочено': 'overdue', 'скоро': 'soon', 'Сплатити': 'Pay',
    'Спільні витрати за категоріями': 'Shared spending by category', 'Вклад партнерів за місяць': 'Partner contributions this month', 'Без витрат': 'No expenses',
    // Категорії, які створює застосунок
    'Оренда': 'Rent', 'Комунальні': 'Utilities', 'Продукти': 'Groceries', 'Ресторани': 'Restaurants', 'Розваги': 'Entertainment', 'Транспорт': 'Transport',
    'Здоровʼя': 'Health', 'Здоров’я': 'Health', 'Інше': 'Other', 'Передплати': 'Subscriptions', 'Скарбничка': 'Savings jar',
    'Хобі': 'Hobbies', 'Косметика/Догляд': 'Beauty/Care', 'Книги': 'Books', 'Одежа': 'Clothes', 'Ґаджети': 'Gadgets', 'Авто/Спорт': 'Car/Sport', 'Ігри/Підписки': 'Games/Subscriptions',
    // Швидка витрата
    'Швидка витрата': 'Quick expense', 'Швидко додати витрату': 'Quickly add an expense', 'Записати витрату': 'Record an expense', 'Що купили': 'What you bought',
    'Хто платив і для кого': 'Who paid and for whom', '· Спільна картка, спільна витрата': '· Shared card, shared expense', 'Хто платив': 'Who paid', 'Для кого': 'For whom',
    'Спільна витрата': 'Shared expense', 'Вкажіть суму.': 'Enter an amount.', 'Особисту покупку оплачує картка або сам власник.': 'A personal purchase is paid by the card or by its owner.',
    // Записи
    'Витрати': 'Expenses', 'Внески': 'Contributions', 'Додати витрату': 'Add expense', 'Назва витрати': 'Expense name', 'Хто сплатив': 'Who paid', '+ Додати витрату': '+ Add expense',
    'Продукти...': 'Groceries…', 'Контроль лімітів за категоріями (План / Факт)': 'Category limits (plan vs actual)', 'Близько': 'Close', 'У нормі': 'On track', 'Перевищено': 'Over',
    'Невитрачений залишок лімітів за місяць:': 'Unspent limits this month:', 'Перенести в ціль': 'Move to a goal', 'Ліміти на категорії (місяць)': 'Category limits (month)',
    'Вкажіть максимальну суму витрат для кожної категорії.': 'Set the maximum monthly spend for each category.', 'Без ліміту': 'No limit', 'Ліміт ₴': 'Limit ₴',
    'Історія витрат': 'Expense history', 'Платник:': 'Paid by:', 'Усі платники': 'All payers', '— без цілі —': '— no goal —',
    'Внесок на спільну картку': 'Contribution to the shared card', 'Ваші зарплати й інші доходи тепер записуються в особистих вкладках. Тут лише перекази на спільну картку.': 'Salaries and other income now go in the personal sections. Only transfers to the shared card go here.',
    'Хто вніс': 'Who paid in', '+ Додати внесок': '+ Add contribution', 'Внесок за місяць': 'Contribution for the month', 'Фактичний баланс у банку': 'Actual bank balance',
    'Розрахунковий баланс. Раз на тиждень звіряйте його з банком: різниця запишеться одним записом, і дрібні покупки можна не вносити окремо.': 'Calculated balance. Check it against the bank once a week: the difference is recorded as one entry, so small purchases need not be entered one by one.',
    'Звірити': 'Reconcile', 'Внески за місяць': 'Contributions this month', 'Внесків за цей місяць немає': 'No contributions this month',
    // План
    'Регулярні': 'Recurring', 'Цілі': 'Goals', 'Регулярні платежі': 'Recurring payments', 'Нова регулярна операція': 'New recurring item',
    'Платежі, відкладання в ціль, кредити, зарплати та щомісячні внески на картку. Кожен платіж проводиться одним натисканням.': 'Payments, savings, loans, salaries and monthly card top-ups. Each one is recorded with a single tap.',
    'Платіж': 'Payment', 'Відкладання в ціль': 'Saving towards a goal', 'Кредит / борг': 'Loan / debt', 'Кредит / Борг': 'Loan / debt', 'Дохід (зарплата)': 'Income (salary)', 'Внесок на картку': 'Card top-up',
    'Витрата': 'Expense', 'Накопичення': 'Savings', 'Борг': 'Debt', 'Борг / Кредит': 'Debt / loan',
    'Щомісяця': 'Monthly', 'Щотижня': 'Weekly', 'Щокварталу': 'Quarterly', 'Щороку': 'Yearly', 'Частота': 'Frequency', 'Перший платіж': 'First payment',
    'Діє до (необов’язково)': 'Ends (optional)', 'Діє до (необов’язково)': 'Ends (optional)', 'Хто платить': 'Who pays', 'Спільний': 'Shared', 'Оренда, зарплата...': 'Rent, salary…',
    'Цього місяця': 'This month', 'Прострочено': 'Overdue', 'Скоро': 'Soon', 'Заплановано': 'Planned', 'Сплачено': 'Paid', 'Відкласти': 'Set aside', 'Відкладено': 'Set aside',
    'Отримано': 'Received', 'Переказано': 'Transferred', 'спільний': 'shared', 'з картки': 'from the card',
    'Створити ціль накопичення': 'Create a savings goal', 'Встановлюйте спільні цілі або особисті скарбнички.': 'Set shared goals or personal savings jars.', 'Назва цілі': 'Goal name',
    'Цільова сума (': 'Target amount (', 'Цільова дата (опц.)': 'Target date (optional)', '+ Створити ціль': '+ Create goal', 'Спільна': 'Shared', 'Спільна ціль': 'Shared goal',
    'Останні внески:': 'Recent contributions:', 'Відпустка...': 'Holiday…', 'Ціль досягнуто!': 'Goal reached!',
    // Особисте
    'Мій дохід мінус внесок у спільне, витрати й відкладене': 'My income minus my share, spending and savings', 'Без PIN': 'No PIN', 'Захищено': 'Protected', 'Без захисту': 'Not protected',
    'Дохід': 'Income', 'У спільне': 'To shared', 'Витрачено': 'Spent', 'Вільний залишок': 'Free balance', 'Вільний залишок ': 'Free balance', 'Особисті цілі': 'Personal goals', 'Скарбнички': 'Savings jars',
    'Внести залишок': 'Add the remainder', 'Мої регулярні': 'My recurring', '+ Додати в «Регулярні»': '+ Add to Recurring', 'Додати власний дохід': 'Add my income',
    'Додати особисту витрату': 'Add a personal expense', 'Власні категорії та ліміти': 'My categories and limits', 'Мої доходи': 'My income', 'Мої витрати': 'My expenses',
    'Структура особистих витрат': 'Personal spending breakdown', 'Додайте витрату за період': 'Add an expense for this period', 'Назва (iPad)': 'Name (iPad)', 'Ціль ₴': 'Target ₴',
    'Підробіток': 'Side job', 'Покупка': 'Purchase', 'Нова категорія...': 'New category…', 'розділ заблоковано': 'section locked', 'Розблокувати': 'Unlock', 'Розділ заблоковано': 'Section locked',
    // Ми: баланс
    'Баланс': 'Balance', 'Баланс між партнерами': 'Balance between partners',
    'Рахується накопичувально: внески на картку плюс спільні витрати, оплачені зі своїх, порівнюються з вашими частками. Витрати з картки цей баланс не змінюють, бо картку ви наповнюєте у своїх частках; вони зменшують баланс картки.': 'Cumulative: card top-ups plus shared expenses paid with your own money are compared with your shares. Card spending does not change this balance, because you fill the card in your shares; it lowers the card balance.',
    'вклав': 'paid in', 'Історія переказів між вами': 'Transfers between you', 'Підтверджених розрахунків ще немає': 'No confirmed settlements yet',
    // Ми: налаштування
    'Аналітика за місяцями': 'Monthly analytics', 'Графіки й підсумки': 'Charts and totals', 'Налаштування пари та бюджету': 'Couple and budget settings',
    'Керуйте іменами партнерів, валютою та категоріями': 'Manage partner names, currency and categories', 'Персоналізація партнерів': 'Partner profiles',
    'Перший партнер': 'First partner', 'Другий партнер': 'Second partner', "Ім'я": 'Name', 'Ім’я': 'Name', 'Аватар': 'Avatar', 'Ініціал імені': 'Initial',
    'Квітка': 'Flower', 'Зірка': 'Star', 'Сонце': 'Sun', 'Місяць': 'Moon', 'Листок': 'Leaf', 'Серце': 'Heart', 'Блискавка': 'Lightning', 'Хвиля': 'Wave', 'Гори': 'Mountains',
    'Кава': 'Coffee', 'Кіт': 'Cat', 'Музика': 'Music', 'Паросток': 'Sprout', 'День народження': 'Birthday', 'Колір': 'Colour', 'Дата річниці пари': 'Anniversary date',
    'Зберегти профілі та дати': 'Save profiles and dates', 'Фінансові параметри': 'Money settings', 'Валюта': 'Currency', '50 / 50 (Порівну)': '50 / 50 (Equal)',
    'Пропорційно доходу': 'Proportional to income', 'Пропорційно': 'Proportional', 'Баланс картки на дату старту': 'Card balance on the start date', 'Баланс між вами рахується з': 'Balance between you counts from',
    'Зберегти параметри': 'Save settings', 'Категорії витрат': 'Expense categories', 'Відновити типові': 'Restore defaults', 'Автокопії': 'Automatic backups',
    'Раз на день і перед масовими змінами на цьому пристрої зберігається копія (останні 7). Це страховка від випадкового видалення.': 'Once a day and before bulk changes, a copy is kept on this device (last 7). It protects against accidental deletion.',
    'перед переходом на модель внесків': 'before switching to contributions', 'перед масовою зміною': 'before a bulk change', 'щоденна': 'daily',
    'Повернути внески': 'Restore contributions', 'Відновити все': 'Restore everything', 'Тема оформлення': 'Theme', 'Вибір зберігається на цьому пристрої.': 'Saved on this device.',
    'Авто за календарем': 'Auto by calendar', 'Без сезонності': 'No seasonal colours', 'стандартна тема': 'standard theme', 'Позначки партнерів': 'Partner markers', 'Ініціали': 'Initials', 'Емодзі': 'Emoji',
    'Анімації': 'Animations', 'Плавні переходи, хвиля при натисканні, анімовані графіки й числа': 'Smooth transitions, tap ripple, animated charts and numbers',
    'Застосунок і сповіщення': 'App and notifications', 'Встановіть UsBudget на головний екран і отримуйте нагадування про платежі.': 'Install UsBudget on your home screen and get payment reminders.',
    'У меню браузера виберіть': 'In the browser menu choose', '«Встановити застосунок»': '“Install app”', 'або': 'or', '«Додати на головний екран»': '“Add to Home Screen”',
    'Сповіщення заборонено в налаштуваннях телефона або браузера для цього сайту. Дозвольте їх там і поверніться сюди.': 'Notifications are blocked for this site in your phone or browser settings. Allow them there and come back.',
    'Чий це телефон:': 'Whose phone is this:', 'Увімкнути сповіщення': 'Turn on notifications', 'Вимкнути': 'Turn off', 'Тестове сповіщення': 'Test notification',
    'PIN-захист особистих вкладок': 'PIN for personal sections', 'Захистіть особисті розділи від випадкового перегляду.': 'Protect personal sections from casual viewing.',
    'Поточний PIN': 'Current PIN', 'Новий PIN (4-8 цифр)': 'New PIN (4–8 digits)', 'Резервне копіювання': 'Backup', 'Експорт у JSON': 'Export to JSON', 'Імпорт з JSON': 'Import from JSON', 'Очистити все': 'Clear everything',
    'Мова інтерфейсу': 'Language', 'Українська': 'Українська', 'Партнер 1': 'Partner 1', 'Партнер 2': 'Partner 2', 'Spotify, зал...': 'Spotify, salary…', 'Spotify, зарплата...': 'Spotify, salary…',
    // Аналітика
    'Аналітика': 'Analytics', 'Спільні витрати та внески': 'Shared spending and contributions', 'Баланс картки на кінець місяця': 'Card balance at month end',
    'Категорії: цей місяць проти минулого': 'Categories: this month vs last', 'Зміна': 'Change', 'Підсумки за місяцями': 'Monthly totals', 'Спільні витрати': 'Shared spending',
    'Картка': 'Card', 'Особисті підсумки': 'Personal totals', 'Норма': 'Rate', 'Експорт і звіт': 'Export and report', 'Звіт для друку / PDF': 'Printable report / PDF',
    'Особисті дані заблокованих розділів не потрапляють ні в експорт, ні у звіт.': 'Personal data from locked sections is left out of both the export and the report.',
    // Діалоги
    "Баланс врегульовано": "Balance settled",
    "Вимкнено": "Turned off",
    "Відновити копію?": "Restore this backup?",
    "Відновлення": "Restore",
    "Демо-дані": "Demo data",
    "Збігається": "Matches",
    "Звіт завантажено": "Report downloaded",
    "Надіслано": "Sent",
    "Не вдалося": "Something went wrong",
    "Не вдалося увімкнути": "Could not turn on",
    "Немає дозволу": "No permission",
    "Нічого повертати": "Nothing to restore",
    "Очищення": "Clear data",
    "Очищено": "Cleared",
    "Перенести залишок?": "Move the remainder?",
    "Повернути внески?": "Restore contributions?",
    "Помилка": "Error",
    "Підписку збережено": "Subscription saved",
    "Підтвердити розрахунок?": "Confirm the settlement?",
    "Скасувати оплату?": "Cancel the payment?",
    "Скасувати проведення?": "Undo this entry?",
    "Скинути PIN?": "Reset PIN?",
    "Увага": "Attention",
    "🎉 Ціль досягнуто!": "🎉 Goal reached!",
    "PIN встановлено!": "PIN set!",
    "PIN знято.": "PIN removed.",
    "PIN має бути від 4 до 8 цифр.": "The PIN must be 4 to 8 digits.",
    "Але тестове сповіщення не надіслалося: схоже, серверну частину ще не налаштовано на Vercel (ключі в Environment Variables). Див. інструкцію в README.": "But the test notification was not sent: the server part does not seem to be set up on Vercel yet (keys in Environment Variables). See the README.",
    "Без дозволу на сповіщення нагадування не надходитимуть.": "Without notification permission, reminders will not arrive.",
    "Браузер заблокував нове вікно, тож звіт збережено файлом. Відкрийте його й натисніть «Друкувати / PDF».": "The browser blocked the new window, so the report was saved as a file. Open it and press “Print / PDF”.",
    "Введіть суму внеску.": "Enter the contribution amount.",
    "Видалити всі записи?": "Delete all records?",
    "Внески повернуто.": "Contributions restored.",
    "Відновити типові категорії?": "Restore default categories?",
    "Дані імпортовано!": "Data imported!",
    "Дата «до» раніша за перший платіж.": "The end date is earlier than the first payment.",
    "Демо-дані завантажено!": "Demo data loaded!",
    "Завантажити демо-записи?": "Load demo records?",
    "Залишок внесено до цілі та списано з вільного балансу.": "The remainder went to the goal and was taken from the free balance.",
    "Залишок не є позитивним для переказу!": "There is no positive remainder to move!",
    "Залишіть хоча б одну категорію.": "Keep at least one category.",
    "Категорія вже існує!": "This category already exists!",
    "Категорії відновлено!": "Categories restored!",
    "Копію відновлено.": "Backup restored.",
    "Нагадування на цьому пристрої вимкнено.": "Reminders are off on this device.",
    "Не вдалося завантажити модуль Excel. Перевірте інтернет або скористайтеся CSV: він теж відкривається в Excel.": "Could not load the Excel module. Check your connection or use CSV: it opens in Excel too.",
    "Не вдалося підписатися на сповіщення. Перевірте інтернет і спробуйте ще раз.": "Could not subscribe to notifications. Check your connection and try again.",
    "Невірний формат.": "Invalid format.",
    "Ніхто нікому не винен за цей період.": "Nobody owes anybody for this period.",
    "Особистий платіж оплачує картка або сам власник.": "A personal payment is paid by the card or by its owner.",
    "Поточний PIN невірний.": "The current PIN is wrong.",
    "Розрахунковий баланс збігається з банком.": "The calculated balance matches the bank.",
    "Тестове сповіщення має з’явитися за кілька секунд.": "The test notification should appear in a few seconds.",
    "Усі внески з цієї копії вже є в застосунку.": "All contributions from this backup are already in the app.",
    "Усі записи видалено.": "All records deleted.",
    "Фінансові параметри оновлено.": "Money settings updated.",
    "Ціль уже досягнута.": "The goal is already reached.",
    "Видалити й скинути": "Delete and reset",
    "Скасувати оплату": "Cancel payment",
    "Повернути": "Restore",
    "Відновити": "Restore",
    "Перенести": "Move",
    "Очистити": "Clear",
    "Завантажити": "Load",
    '6 місяців': '6 months', '12 місяців': '12 months', 'Вибраний місяць': 'Selected month', 'Рік вибраного місяця': 'Year of the selected month', 'Увесь час': 'All time'
  };

  var P = [
    [/^(\S+) (\d{4}) р\.$/, function (m, a, y) { var i = monthOf(a, M_NOM); return i === null ? null : MONTHS[i] + ' ' + y; }],
    [/^(\S+) (\d{4})$/, function (m, a, y) { var i = monthOf(a, M_NOM); return i === null ? null : MONTHS[i] + ' ' + y; }],
    [/^(\S+) (\d{2})$/, function (m, a, y) { var i = monthOf(a, M_SHORT); return i === null ? null : MONTHS[i].slice(0, 3) + ' ' + y; }],
    [/^(\d{1,2}) (\S{3})$/, function (m, d, a) { var i = monthOf(a, M_SHORT); return i === null ? null : d + ' ' + MONTHS[i].slice(0, 3); }],
    [/^(січень|лютий|березень|квітень|травень|червень|липень|серпень|вересень|жовтень|листопад|грудень)$/i, function (m, a) { return MONTHS[monthOf(a, M_NOM)]; }],
    [/^зараз: (\S+)$/, function (m, a) { var i = monthOf(a, M_NOM); return i === null ? null : 'now: ' + MONTHS[i]; }],
    [/^У (\S+) ви разом витратили$/, function (m, a) { var i = monthOf(a, M_LOC); return i === null ? null : 'In ' + MONTHS[i] + ' you spent together'; }],
    [/^У (\S+) спільних витрат ще немає\.$/, function (m, a) { var i = monthOf(a, M_LOC); return i === null ? null : 'No shared expenses in ' + MONTHS[i] + ' yet.'; }],
    [/^— на (\d+)% (менше|більше), ніж у (\S+)\.$/, function (m, n, d, a) { var i = monthOf(a, M_LOC); return i === null ? null : '— ' + n + '% ' + (d === 'менше' ? 'less' : 'more') + ' than in ' + MONTHS[i] + '.'; }],
    [/^— стільки ж, як у (\S+)\.$/, function (m, a) { var i = monthOf(a, M_LOC); return i === null ? null : '— the same as in ' + MONTHS[i] + '.'; }],
    [/^з (\d.*)$/, 'of $1'], [/^(.*\d.*) з (\d.*)$/, '$1 of $2'], [/^понад ліміт на (.+)$/, 'over by $1'],
    [/^(.+) доплачує (.+)$/, '$1 owes $2'], [/^(.+) має доплатити (.+)$/, '$1 needs to pay $2'],
    [/^Особисте: (.+)$/, 'Personal: $1'], [/^Особистий:\s+(.+)$/, 'Personal: $1'], [/^Особиста \((.+)\)$/, function (m, a) { return 'Personal (' + (tr(a) || a) + ')'; }], [/^· (.+)$/, function (m, a) { var r = tr(a); return r === null ? null : '· ' + r; }], [/^(.+) \(зі своїх\)$/, '$1 (own money)'],
    [/^Частка (.+), %$/, '$1’s share, %'], [/^Показано (\d+) із (\d+)$/, 'Showing $1 of $2'], [/^записів: (\d+)$/, 'entries: $1'],
    [/^Платежі (.+) \(проведено (.+)\)$/, 'Payments $1 (paid $2)'], [/^доходи (.+)$/, 'income $1'], [/^внески (.+)$/, 'contributions $1'], [/^відкладено (.+)$/, 'saved $1'],
    [/^зі своїх (.+)$/, 'own money $1'], [/^зі своїх$/, 'own money'], [/^Непроведені з минулих місяців: (\d+)$/, 'Unpaid from previous months: $1'], [/^До: (.+)$/, 'By: $1'],
    [/^Прогрес: (\d+)%$/, 'Progress: $1%'], [/^Треба ≈ ([^·]+?)\/міс до ([^·]+?), заплановано ([^·]+?)\/міс$/, 'Need ≈ $1/mo by $2, planned $3/mo'], [/^не вистачає ([^·]+)\/міс$/, 'short by $1/mo'],
    [/^мав (\d+)% = (.+)$/, 'share $1% = $2'], [/^Облік з (.+)$/, 'Tracking since $1'], [/^частки (.+)$/, 'shares $1'], [/^картка: (.+)$/, 'card: $1'],
    [/^Переказ для (.+): (.+)$/, 'Transfer to $1: $2'], [/^Доплата на картку: (.+)$/, 'Top up the card: $1'], [/^(\d+) КБ$/, '$1 KB'], [/^Додано: (.+) — (.+)$/, function (m, a, b) { return 'Added: ' + (tr(a) || a) + ' — ' + b; }],
    [/^Сума, (.+)$/, 'Amount, $1'], [/^(.+): розділ заблоковано$/, '$1: section locked'], [/^в ціль «(.+)»$/, 'to goal “$1”'], [/^лишилось (\d+) пл\. \((.+)\)$/, '$1 payments left ($2)'],
    [/^(.+) \(регулярний\)$/, '$1 (recurring)'], [/^Цей акаунт ще не додано до списку дозволених\. У Firebase Console → Realtime Database → Data створіть запис members\/(.+) зі значенням true\.$/, 'This account is not on the allowed list yet. In Firebase Console → Realtime Database → Data, create members/$1 with the value true.'], [/^Внесок до цілі: (.+)$/, 'Goal contribution: $1']
  ];

  function tr(t) {
    if (Object.prototype.hasOwnProperty.call(D, t)) return D[t];
    for (var i = 0; i < P.length; i++) {
      var m = t.match(P[i][0]);
      if (!m) continue;
      var out = typeof P[i][1] === 'function' ? P[i][1].apply(null, m) : t.replace(P[i][0], P[i][1]);
      if (out !== null && out !== undefined) return out;
    }
    var em = t.match(/^((?:\p{Extended_Pictographic}\uFE0F?\s*)+)(.+)$/u);
    if (em) { var re2 = tr(em[2]); if (re2 !== null) return em[1] + re2; }
    if (t.indexOf(' · ') > 0) {
      var parts = t.split(' · '), changed = false;
      parts = parts.map(function (p) { var q = p.trim(), r = q ? tr(q) : null; if (r !== null) { changed = true; return p.replace(q, r); } return p; });
      return changed ? parts.join(' · ') : null;
    }
    return null;
  }

  var CYR = /[А-Яа-яЇїІіЄєҐґ]/, ATTRS = ['placeholder', 'aria-label', 'title'];
  function translate(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) {
      var v = n.nodeValue;
      if (!CYR.test(v)) continue;
      var p = n.parentNode;
      if (!p || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE' || p.nodeName === 'TEXTAREA') continue;
      var t = v.trim(), r = tr(t);
      if (r !== null && r !== t) n.nodeValue = v.replace(t, r);
    }
    var els = root.querySelectorAll ? root.querySelectorAll('[placeholder],[aria-label],[title]') : [];
    for (var i = 0; i < els.length; i++) {
      for (var j = 0; j < ATTRS.length; j++) {
        var a = els[i].getAttribute(ATTRS[j]);
        if (a && CYR.test(a)) { var ra = tr(a.trim()); if (ra !== null) els[i].setAttribute(ATTRS[j], ra); }
      }
    }
  }
  window.usbTranslate = translate;

  var queued = false;
  function schedule() { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; translate(document.body); }); }
  document.addEventListener('DOMContentLoaded', function () {
    document.title = 'UsBudget — budget for two';
    translate(document.body);
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true });
  });
}());
