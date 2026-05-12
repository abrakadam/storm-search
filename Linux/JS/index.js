// основной файл для js скраперов
const minecraft_scraper = require('./scrapers/minecraft-scraper');
const steam_scraper = require('./scrapers/steam-scraper');
const xbox_scraper = require('./scrapers/xbox-scraper');

class storm_search_js {
    constructor() {
        this.scrapers = {
            'minecraft': new minecraft_scraper(),
            'steam': new steam_scraper(),
            'xbox': new xbox_scraper()
        };
    }

    // поиск на всех платформах
    async search_all_platforms(username) {
        console.log(`[*] поиск пользователя "${username}" на всех платформах`);
        console.log('═'.repeat(60));

        const results = {};

        for (const [platform, scraper] of Object.entries(this.scrapers)) {
            try {
                console.log(`\n[*] поиск в ${platform}...`);
                const result = await this.search_platform(username, platform);
                if (result) {
                    results[platform] = result;
                }
                
                // задержка между запросами
                await this.sleep(1000);
            } catch (error) {
                console.log(`[-] ошибка при поиске в ${platform}: ${error.message}`);
            }
        }

        console.log('\n' + '═'.repeat(60));
        console.log('[*] сводка результатов:');
        
        for (const [platform, result] of Object.entries(results)) {
            const status = result.found ? '[+] найден' : '[-] не найден';
            console.log(`   ${platform}: ${status}`);
        }

        return results;
    }

    // поиск на конкретной платформе
    async search_platform(username, platform) {
        if (!this.scrapers[platform]) {
            console.log(`[-] неизвестная платформа: ${platform}`);
            return null;
        }

        console.log(`\n[*] поиск в ${platform}: ${username}`);
        console.log('─'.repeat(50));

        try {
            let result;
            switch (platform) {
                case 'minecraft':
                    result = await this.scrapers[platform].search_player(username);
                    break;
                case 'steam':
                    result = await this.scrapers[platform].search_player(username);
                    break;
                case 'xbox':
                    result = await this.scrapers[platform].search_player(username);
                    break;
                default:
                    result = null;
            }

            if (result) {
                this.print_result(result);
            }

            return result;
        } catch (error) {
            console.log(`[-] ошибка при поиске в ${platform}: ${error.message}`);
            return null;
        }
    }

    // вывод результата поиска
    print_result(result) {
        console.log('\n[+] результат поиска:');
        console.log(`   платформа: ${result.platform}`);
        console.log(`   имя пользователя: ${result.username || result.gamertag}`);
        
        if (result.uuid) {
            console.log(`   uuid: ${result.uuid}`);
        }
        
        if (result.steam_id) {
            console.log(`   steam id: ${result.steam_id}`);
        }
        
        if (result.xuid) {
            console.log(`   xuid: ${result.xuid}`);
        }

        console.log(`   найден: ${result.found ? 'да' : 'нет'}`);

        // вывод дополнительной информации
        if (result.profile_info && Object.keys(result.profile_info).length > 0) {
            console.log('\n   информация о профиле:');
            for (const [key, value] of Object.entries(result.profile_info)) {
                console.log(`     ${key}: ${value}`);
            }
        }

        if (result.name_history) {
            console.log('\n   история имен:');
            console.log(`     ${result.name_history.history_string}`);
        }

        if (result.skin_info) {
            console.log('\n   информация о скине:');
            for (const [key, value] of Object.entries(result.skin_info)) {
                console.log(`     ${key}: ${value}`);
            }
        }

        if (result.games_info && Object.keys(result.games_info).length > 0) {
            console.log('\n   информация об играх:');
            for (const [key, value] of Object.entries(result.games_info)) {
                console.log(`     ${key}: ${value}`);
            }
        }

        if (result.friends_info && Object.keys(result.friends_info).length > 0) {
            console.log('\n   информация о друзьях:');
            for (const [key, value] of Object.entries(result.friends_info)) {
                console.log(`     ${key}: ${value}`);
            }
        }

        console.log('');
    }

    // проверка существования пользователя
    async check_user_exists(username, platform) {
        if (!this.scrapers[platform]) {
            console.log(`[-] неизвестная платформа: ${platform}`);
            return false;
        }

        try {
            let exists = false;
            switch (platform) {
                case 'minecraft':
                    exists = await this.scrapers[platform].check_player_exists(username);
                    break;
                case 'steam':
                    exists = await this.scrapers[platform].check_profile_exists(username);
                    break;
                case 'xbox':
                    exists = await this.scrapers[platform].check_gamertag_exists(username);
                    break;
            }

            console.log(`[*] пользователь ${username} на ${platform}: ${exists ? 'существует' : 'не существует'}`);
            return exists;
        } catch (error) {
            console.log(`[-] ошибка проверки: ${error.message}`);
            return false;
        }
    }

    // валидация имени пользователя
    validate_username(username, platform) {
        if (!this.scrapers[platform]) {
            console.log(`[-] неизвестная платформа: ${platform}`);
            return null;
        }

        try {
            let validation;
            switch (platform) {
                case 'minecraft':
                    validation = this.scrapers[platform].validate_username(username);
                    break;
                case 'xbox':
                    validation = {
                        valid: this.scrapers[platform].is_valid_gamertag(username),
                        rules: this.scrapers[platform].get_gamertag_rules()
                    };
                    break;
                case 'steam':
                    validation = this.scrapers[platform].validate_steam_id(username);
                    break;
            }

            console.log(`[*] валидация для ${platform}:`);
            console.log(`   валидность: ${validation.valid ? 'валидный' : 'невалидный'}`);
            if (validation.rules) {
                console.log('   правила:');
                for (const [key, value] of Object.entries(validation.rules)) {
                    console.log(`     ${key}: ${value}`);
                }
            }

            return validation;
        } catch (error) {
            console.log(`[-] ошибка валидации: ${error.message}`);
            return null;
        }
    }

    // экспорт результатов в файл
    async export_results(results, filename = 'search-results.json') {
        try {
            const fs = require('fs').promises;
            await fs.writeFile(filename, JSON.stringify(results, null, 2));
            console.log(`[+] результаты экспортированы в ${filename}`);
        } catch (error) {
            console.log(`[-] ошибка экспорта: ${error.message}`);
        }
    }

    // интерактивный режим
    async interactive_mode() {
        console.log('[*] интерактивный режим storm search js');
        console.log('[*] введите "help" для помощи или "exit" для выхода');
        console.log('');

        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const ask_question = (question) => {
            return new Promise((resolve) => {
                rl.question(question, resolve);
            });
        };

        while (true) {
            try {
                const input = await ask_question('storm-search-js> ');
                
                if (!input.trim()) continue;

                const parts = input.trim().split(' ');
                const command = parts[0].toLowerCase();

                switch (command) {
                    case 'exit':
                    case 'quit':
                        console.log('[*] до свидания!');
                        rl.close();
                        return;

                    case 'help':
                        this.show_help();
                        break;

                    case 'search':
                    case 'find':
                        if (parts.length < 2) {
                            console.log('[-] использование: search <username> [platform]');
                            break;
                        }

                        const username = parts[1];
                        const platform = parts[2] || 'all';

                        if (platform.toLowerCase() === 'all') {
                            await this.search_all_platforms(username);
                        } else {
                            await this.search_platform(username, platform.toLowerCase());
                        }
                        break;

                    case 'check':
                        if (parts.length < 3) {
                            console.log('[-] использование: check <username> <platform>');
                            break;
                        }

                        await this.check_user_exists(parts[1], parts[2].toLowerCase());
                        break;

                    case 'validate':
                        if (parts.length < 3) {
                            console.log('[-] использование: validate <username> <platform>');
                            break;
                        }

                        this.validate_username(parts[1], parts[2].toLowerCase());
                        break;

                    case 'clear':
                    case 'cls':
                        console.clear();
                        break;

                    default:
                        console.log(`[-] неизвестная команда: ${command}`);
                        console.log('[*] введите "help" для помощи');
                        break;
                }

                console.log('');
            } catch (error) {
                console.log(`[-] ошибка: ${error.message}`);
                console.log('');
            }
        }
    }

    // вывод справки
    show_help() {
        console.log('');
        console.log('доступные команды:');
        console.log('');
        console.log('  search <username> [platform]  - поиск пользователя');
        console.log('  find <username> [platform]    - аналог search');
        console.log('  check <username> <platform>   - проверка существования');
        console.log('  validate <username> <platform> - валидация имени пользователя');
        console.log('  help                          - показать эту помощь');
        console.log('  clear/cls                     - очистить экран');
        console.log('  exit/quit                     - выйти из программы');
        console.log('');
        console.log('платформы: minecraft, steam, xbox, all');
        console.log('');
        console.log('примеры:');
        console.log('  search steve minecraft');
        console.log('  find player123 all');
        console.log('  check mygamertag xbox');
        console.log('  validate username minecraft');
        console.log('');
    }

    // задержка
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// обработка командной строки
async function main() {
    const args = process.argv.slice(2);
    
    // проверяем команду storms
    if (args.length > 0 && args[0].toLowerCase() === 'storms') {
        const storms_command = require('./storms');
        const storms = new storms_command();
        const storms_args = args.slice(1);
        const exit_code = await storms.run(storms_args);
        process.exit(exit_code);
    }
    
    if (args.length === 0) {
        console.log('[*] storm search js - веб скрапер для поиска никнеймов');
        console.log('[*] использование: node index.js <command> [args...]');
        console.log('[*] для быстрого поиска: node index.js storms <username>');
        console.log('[*] для интерактивного режима: node index.js --interactive');
        console.log('[*] для помощи: node index.js --help');
        return;
    }

    const storm_search = new storm_search_js();

    if (args[0] === '--interactive' || args[0] === '-i') {
        await storm_search.interactive_mode();
    } else if (args[0] === '--help' || args[0] === '-h') {
        storm_search.show_help();
    } else if (args[0] === 'search' && args.length >= 2) {
        const username = args[1];
        const platform = args[2] || 'all';
        
        if (platform.toLowerCase() === 'all') {
            await storm_search.search_all_platforms(username);
        } else {
            await storm_search.search_platform(username, platform.toLowerCase());
        }
    } else if (args[0] === 'check' && args.length >= 3) {
        await storm_search.check_user_exists(args[1], args[2].toLowerCase());
    } else if (args[0] === 'validate' && args.length >= 3) {
        storm_search.validate_username(args[1], args[2].toLowerCase());
    } else {
        console.log('[-] неверные аргументы. используйте --help для помощи');
        console.log('[*] для быстрого поиска: node index.js storms <username>');
    }
}

// запуск
if (require.main === module) {
    main().catch(console.error);
}

module.exports = storm_search_js;
