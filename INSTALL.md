# storm search - инструкция по установке

## системные требования

### общие требования
- linux или windows
- интернет соединение для поиска
- терминал или командная строка

### для c# версии
- .net 8.0 sdk или выше
- поддержка командной строки

### для javascript версии
- node.js 16.0 или выше
- npm или yarn

## установка

### linux версия (c#)

1. клонирование репозитория:
```bash
git clone <repository-url>
cd storm-search/linux/csharp
```

2. проверка .net:
```bash
dotnet --version
# должно показать версию 8.0 или выше
```

3. сборка проекта:
```bash
dotnet build
```

4. запуск:
```bash
# быстрый поиск
dotnet run -- storms <username>

# традиционный поиск
dotnet run -- --username <username> --platform <platform>

# интерактивный режим
dotnet run -- --interactive
```

### linux версия (javascript)

1. клонирование репозитория:
```bash
git clone <repository-url>
cd storm-search/linux/js
```

2. установка зависимостей:
```bash
npm install
```

3. запуск:
```bash
# быстрый поиск
node index.js storms <username>

# традиционный поиск
node index.js search <username> <platform>

# интерактивный режим
node index.js --interactive
```

## настройка

### переменные окружения

для steam api ключа создайте файл `.env` в корне проекта:

```
STEAM_API_KEY=your_steam_api_key_here
XBOX_API_KEY=your_xbox_api_key_here
```

### получение api ключей

#### steam api ключ
1. перейдите на https://steamcommunity.com/dev/apikey
2. войдите в свой steam аккаунт
3. введите домен и получите api ключ

#### xbox api ключ
1. перейдите на https://developer.xboxlive.com
2. создайте приложение
3. получите api ключ

## использование

### команда storms (рекомендуется)

команда `storms` предоставляет минималистичный интерфейс:

```bash
# поиск по всем платформам
storms abrakadam

# поиск по конкретным платформам
storms player123 -p minecraft,steam

# подробный вывод
storms username -v

# сохранение результатов
storms username -o results.json

# помощь
storms --help
```

### традиционные команды

#### c# версия
```bash
dotnet run -- --username "steve" --platform minecraft
dotnet run -- --username "player123" --all
dotnet run -- --interactive
```

#### javascript версия
```bash
node index.js search steve minecraft
node index.js search player123
node index.js --interactive
```

## платформы

### minecraft
- поиск по имени пользователя
- получение uuid
- история имен
- информация о скине

### steam
- поиск по имени или steam id
- информация о профиле
- список игр
- статус аккаунта

### xbox
- поиск по gamertag
- информация о профиле
- данные о присутствии
- достижения

## устранение проблем

### общие проблемы

**ошибка: команда не найдена**
```bash
# для c#
export PATH="$PATH:/usr/local/bin"
# или используйте полный путь
/usr/local/bin/dotnet run -- storms username

# для javascript
export PATH="$PATH:/usr/local/bin/node"
# или используйте полный путь
/usr/local/bin/node index.js storms username
```

**ошибка: нет доступа к интернету**
- проверьте подключение к интернету
- убедитесь что фаервол блокирует запросы
- проверьте настройки прокси

### c# специфические проблемы

**ошибка: .net не найден**
```bash
# установка .net 8.0
wget https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt-get update
sudo apt-get install -y dotnet-sdk-8.0
```

**ошибка сборки**
```bash
# очистка и пересборка
dotnet clean
dotnet restore
dotnet build
```

### javascript специфические проблемы

**ошибка: node не найден**
```bash
# установка node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**ошибка установки пакетов**
```bash
# очистка кэша npm
npm cache clean --force
# переустановка пакетов
rm -rf node_modules package-lock.json
npm install
```

## производительность

### оптимизация поиска
- используйте конкретные платформы для ускорения поиска
- включайте подробный вывод только при необходимости
- сохраняйте результаты для последующего анализа

### ограничения
- steam api имеет ограничения на количество запросов
- xbox api требует аутентификации для полной функциональности
- веб скрапинг может быть медленным при плохом соединении

## безопасность

### рекомендации
- используйте api ключи безопасно
- не храните ключи в открытом доступе
- уважайте конфиденциальность пользователей
- используйте утилиту только для законных целей

### конфиденциальность
- утилита не хранит личные данные
- поисковые запросы не логируются
- результаты сохраняются только локально

## поддержка

### получение помощи
```bash
# для команды storms
storms --help

# для c# версии
dotnet run -- --help

# для javascript версии
node index.js --help
```

### отчеты об ошибках
при обнаружении ошибок сообщите:
- версию утилиты
- операционную систему
- команду которая вызвала ошибку
- полное сообщение об ошибке

## лицензия

mit license - подробности в файле license.
