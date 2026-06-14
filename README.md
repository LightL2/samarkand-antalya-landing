# Asialuxe — Лендинг «Прямые рейсы Самарканд → Анталья»

Адаптивный двуязычный (RU / UZ) лендинг по брендбуку Asialuxe Travel.
Стек: **HTML + CSS + JS + PHP**. Никакого Node, сборки и внешних сервисов —
просто загрузите папку на обычный хостинг с PHP.

Заявки уходят в **Telegram-бот** и пишутся в файл **`leads.csv`** (открывается в Excel / Google Sheets).
Подключены **GA4** и **Google Ads** с отправкой конверсии при отправке формы. Есть защита от ботов.

## Структура
```
samarkand-antalya-landing/
├── index.html          # лендинг
├── lead.php            # приём заявок: Telegram + leads.csv
├── config.example.php  # шаблон секретов → скопировать в config.php
├── config.php          # токен/chat_id (НЕ в git)
├── assets/
│   ├── css/styles.css
│   ├── js/i18n.js      # тексты RU / UZ
│   ├── js/app.js
│   └── img/            # логотипы
└── README.md
```

## Запуск за 3 шага
1. Загрузите всю папку на хостинг с PHP (например, в поддиректорию сайта).
2. Скопируйте `config.example.php` → `config.php`.
3. Впишите в `config.php` токен бота и `telegram_chat_id` (см. ниже). Всё.

```
cp config.example.php config.php
```

Форма постит на `lead.php`, который лежит рядом → никаких настроек URL и CORS не нужно.

### Как узнать `telegram_chat_id`
- Напишите боту любое сообщение (или добавьте его в группу и напишите туда).
- Откройте `https://api.telegram.org/bot<ВАШ_ТОКЕН>/getUpdates`
- Возьмите число из `result[].message.chat.id` и впишите в `config.php` → `telegram_chat_id`.

> ⚠️ Секреты (токен, chat_id) лежат только в `config.php`, который в git **не** попадает.
> В репозитории — лишь шаблон `config.example.php`.

## Лиды
- **Telegram** — мгновенное уведомление менеджеру.
- **`leads.csv`** — создаётся автоматически рядом с `lead.php`, с заголовками и BOM
  (кириллица корректно открывается в Excel). Можно импортировать в Google Sheets:
  *Файл → Импорт → Загрузить*.

## Аналитика (уже подключено, в `index.html`)
- GA4 `G-3XSVSZKVQ5`, Google Ads `AW-18224907931` — оба с `allow_enhanced_conversions`.
- При успешной отправке формы шлётся конверсия `AW-18224907931/aHBPCMqxxrscEJuNqPJD`
  и GA4-событие `generate_lead` (`assets/js/app.js → fireConversion()`).

## Защита от ботов (без капчи)
Honeypot-поле, тайминг-ловушка, серверная валидация (имя+телефон), rate-limit по IP,
антидубль. Реализовано в `lead.php` и `app.js`.

## Двуязычность
Переключатель RU/UZ в шапке (выбор сохраняется). Все тексты — в `assets/js/i18n.js`,
в разметке привязаны через `data-i18n`. Узбекский — латиница.

## Бренд (из брендбука)
| | |
|---|---|
| Синий | `#0074FF` |
| Лайм (кнопки) | `#BFF205` |
| Тёмный | `#061331` / `#000000` |
| Шрифт | TT Travels Next → веб-фолбэк Montserrat |

## Локальный предпросмотр
Без PHP (только вид, форма не отправляет):
```
python -m http.server 8011
```
С PHP (форма работает):
```
php -S 127.0.0.1:8000
```
