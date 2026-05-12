# storm search - утилита поиска никнеймов и информации

мощная консольная утилита для поиска информации о пользователях в популярных платформах:
- minecraft
- steam
- xbox

## структура проекта

```
storm search/
├── readme.md                 # этот файл
├── linux/                    # версия для linux
│   ├── csharp/               # c# реализация
│   │   ├── program.cs        # основной файл
│   │   ├── stormsearch.csproj # проект
│   │   ├── storms.cs         # команда storms (стиль sherlock)
│   │   ├── search/          # модули поиска
│   │   │   ├── minecraft/   # поиск minecraft
│   │   │   ├── steam/       # поиск steam
│   │   │   └── xbox/        # поиск xbox
│   │   └── utils/           # утилиты
│   │       └── colors.cs    # цветной вывод
│   └── js/                   # javascript реализация
│       ├── index.js          # основной файл
│       ├── storms.js         # команда storms (стиль sherlock)
│       ├── package.json      # зависимости
│       └── scrapers/        # веб скраперы
│           ├── minecraft-scraper.js
│           ├── steam-scraper.js
│           └── xbox-scraper.js
└── windows/                  # версия для windows
    └── (аналогичная структура)
```

## быстрый старт

### linux версия (c#)
```bash
cd linux/csharp
# быстрый поиск по всем платформам
dotnet run -- storms <username>

# традиционный поиск
dotnet run -- --username "steve" --platform minecraft

# интерактивный режим
dotnet run -- --interactive
```

### linux версия (javascript)
```bash
cd linux/js
npm install

# быстрый поиск по всем платформам
node index.js storms <username>

# традиционный поиск
node index.js search steve minecraft

# интерактивный режим
node index.js --interactive
```

## команда storms (стиль sherlock)

новая команда `storms` предоставляет минималистичный интерфейс для быстрого поиска:

```bash
# поиск по всем платформам
storms abrakadam

# поиск по конкретным платформам
storms player123 -p minecraft,steam

# подробный вывод с сохранением
storms username -v -o results.json

# помощь
storms --help
```

### флаги команды storms
- `-p, --platform <платформа>` - указать платформу (minecraft, steam, xbox, all)
- `-v, --verbose` - подробный вывод
- `-o, --output <файл>` - сохранить результаты в файл
- `-h, --help` - показать справку

## основные возможности

- детальный поиск по никнеймам в разных платформах
- красивый интерфейс с цветным выводом
- структурированная информация о найденных пользователях
- кроссплатформенность (linux, windows)
- быстрая работа с параллельными запросами
- веб скрапинг для дополнительной информации
- команда storms в стиле sherlock для быстрого поиска
- сохранение результатов в json формате

## примеры использования

### c# версия
```bash
# быстрый поиск
dotnet run -- storms abrakadam

# поиск по minecraft
dotnet run -- --username "steve" --platform minecraft

# поиск по всем платформам
dotnet run -- --username "player123" --all

# интерактивный режим
dotnet run -- --interactive
```

### javascript версия
```bash
# быстрый поиск
node index.js storms abrakadam

# поиск по minecraft
node index.js search steve minecraft

# поиск по всем платформам
node index.js search player123

# интерактивный режим
node index.js --interactive
```

## платформы

### minecraft
- uuid игрока
- история имен
- информация о скине
- проверка серверов

### steam
- профили игроков
- информация об играх
- список друзей
- статус аккаунта

### xbox
- gamertag поиск
- информация о профиле
- данные о присутствии
- достижения

## важное замечание

используйте эту утилиту ответственно и только для законных целей. уважайте конфиденциальность других пользователей.

## лицензия

mit license
