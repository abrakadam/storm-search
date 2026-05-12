#!/usr/bin/env node

// storms команда в стиле sherlock для быстрого поиска
const minecraft_scraper = require('./scrapers/minecraft-scraper');
const steam_scraper = require('./scrapers/steam-scraper');
const xbox_scraper = require('./scrapers/xbox-scraper');
const fs = require('fs').promises;

class storms_command {
    constructor() {
        this.scrapers = {
            'minecraft': new minecraft_scraper(),
            'steam': new steam_scraper(),
            'xbox': new xbox_scraper()
        };
        this.available_platforms = ['minecraft', 'steam', 'xbox', 'all'];
    }

    // основная команда storms
    async run(args) {
        try {
            // парсинг аргументов
            const parsed = this.parse_args(args);
            
            if (parsed.help) {
                this.show_help();
                return 0;
            }

            if (!parsed.username) {
                console.log('[-] ошибка: необходимо указать имя пользователя');
                console.log('[*] использование: storms <username> [опции]');
                console.log('[*] для помощи: storms --help');
                return 1;
            }

            // вывод информации о поиске
            console.log(`[*] storm search - поиск пользователя: ${parsed.username}`);
            if (parsed.verbose) {
                console.log(`[*] платформы: ${parsed.platforms.join(', ')}`);
                if (parsed.output) {
                    console.log(`[*] вывод в файл: ${parsed.output}`);
                }
            }
            console.log('═'.repeat(60));

            const results = {};

            // поиск по указанным платформам
            for (const platform of parsed.platforms) {
                try {
                    if (parsed.verbose) {
                        console.log(`\n[*] поиск в ${platform}...`);
                    }

                    const result = await this.search_platform(parsed.username, platform);
                    if (result) {
                        results[platform] = result;
                    }

                    // задержка между запросами
                    await this.sleep(1000);
                } catch (error) {
                    console.log(`[-] ошибка при поиске в ${platform}: ${error.message}`);
                }
            }

            // вывод результатов
            this.print_results(parsed.username, results, parsed.verbose);

            // сохранение в файл если указано
            if (parsed.output) {
                await this.save_results(results, parsed.output, parsed.verbose);
            }

            return 0;
        } catch (error) {
            console.log(`[-] критическая ошибка: ${error.message}`);
            return 1;
        }
    }

    // парсинг аргументов командной строки
    parse_args(args) {
        const parsed = {
            username: null,
            platforms: ['minecraft', 'steam', 'xbox'], // по умолчанию все
            verbose: false,
            output: null,
            help: false
        };

        for (let i = 0; i < args.length; i++) {
            const arg = args[i].toLowerCase();
            
            switch (arg) {
                case '-v':
                case '--verbose':
                    parsed.verbose = true;
                    break;
                case '-o':
                case '--output':
                    if (i + 1 < args.length) {
                        parsed.output = args[i + 1];
                        i++; // пропустить следующий аргумент
                    }
                    break;
                case '-p':
                case '--platform':
                    if (i + 1 < args.length) {
                        const platform_arg = args[i + 1].toLowerCase();
                        if (platform_arg === 'all') {
                            parsed.platforms = ['minecraft', 'steam', 'xbox'];
                        } else if (this.available_platforms.includes(platform_arg)) {
                            parsed.platforms = [platform_arg];
                        } else {
                            console.log(`[-] ошибка: неизвестная платформа ${platform_arg}`);
                            process.exit(1);
                        }
                        i++; // пропустить следующий аргумент
                    }
                    break;
                case '-h':
                case '--help':
                    parsed.help = true;
                    break;
                default:
                    if (!arg.startsWith('-') && !parsed.username) {
                        // первый аргумент без дефиса - это имя пользователя
                        parsed.username = arg;
                    } else if (arg.startsWith('-')) {
                        console.log(`[-] ошибка: неизвестный флаг ${arg}`);
                        process.exit(1);
                    }
                    break;
            }
        }

        return parsed;
    }

    // поиск на конкретной платформе
    async search_platform(username, platform) {
        if (!this.scrapers[platform]) {
            console.log(`[-] ошибка: неизвестная платформа ${platform}`);
            return null;
        }

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

            return result;
        } catch (error) {
            console.log(`[-] ошибка при поиске в ${platform}: ${error.message}`);
            return null;
        }
    }

    // вывод результатов поиска
    print_results(username, results, verbose = false) {
        console.log('\n' + '═'.repeat(60));
        console.log(`[*] результаты поиска для: ${username}`);
        console.log('═'.repeat(60));
        console.log();

        if (Object.keys(results).length === 0) {
            console.log('[-] пользователь не найден ни на одной платформе');
            return;
        }

        const found_count = Object.values(results).filter(r => r.found).length;
        const total_count = Object.keys(results).length;

        for (const [platform, result] of Object.entries(results)) {
            const status = result.found ? '[+] найден' : '[-] не найден';
            console.log(`${platform}: ${status}`);
            
            if (result.found) {
                console.log(`   пользователь: ${result.username || result.gamertag}`);
                
                if (result.uuid) {
                    console.log(`   uuid: ${result.uuid}`);
                }
                
                if (result.steam_id) {
                    console.log(`   steam id: ${result.steam_id}`);
                }
                
                if (result.xuid) {
                    console.log(`   xuid: ${result.xuid}`);
                }

                // вывод дополнительной информации
                if (result.profile_info && Object.keys(result.profile_info).length > 0) {
                    console.log('   информация о профиле:');
                    for (const [key, value] of Object.entries(result.profile_info)) {
                        if (verbose || ['persona_name', 'gamertag', 'display_name'].includes(key)) {
                            console.log(`     ${key}: ${value}`);
                        }
                    }
                    if (!verbose && Object.keys(result.profile_info).length > 3) {
                        console.log(`     ... и еще ${Object.keys(result.profile_info).length - 3} полей`);
                    }
                }

                if (result.name_history) {
                    console.log(`   история имен: ${result.name_history.history_string}`);
                }

                if (result.skin_info) {
                    console.log('   информация о скине: доступна');
                }

                if (result.games_info && Object.keys(result.games_info).length > 0) {
                    console.log('   информация об играх: доступна');
                }
            }
            console.log();
        }

        console.log('═'.repeat(60));
        console.log(`[*] статистика: найдено на ${found_count} из ${total_count} платформ`);
        
        if (verbose) {
            console.log(`[*] выполнено за: ${new Date().toLocaleTimeString()}`);
        }
    }

    // сохранение результатов в файл
    async save_results(results, filename, verbose = false) {
        try {
            const json = JSON.stringify(results, null, 2);
            await fs.writeFile(filename, json);
            
            if (verbose) {
                console.log(`[+] результаты сохранены в ${filename}`);
            }
        } catch (error) {
            console.log(`[-] ошибка сохранения файла: ${error.message}`);
        }
    }

    // вывод справки
    show_help() {
        console.log();
        console.log('storm search - утилита поиска никнеймов (стиль sherlock)');
        console.log();
        console.log('использование:');
        console.log('  storms <username> [опции]');
        console.log();
        console.log('опции:');
        console.log('  -p, --platform <платформа>  указать платформу (minecraft, steam, xbox, all)');
        console.log('  -v, --verbose             подробный вывод');
        console.log('  -o, --output <файл>      сохранить результаты в файл');
        console.log('  -h, --help                 показать эту справку');
        console.log();
        console.log('платформы:');
        console.log('  minecraft    - поиск игроков minecraft');
        console.log('  steam        - поиск профилей steam');
        console.log('  xbox         - поиск профилей xbox');
        console.log('  all          - поиск по всем платформам (по умолчанию)');
        console.log();
        console.log('примеры:');
        console.log('  storms abrakadam');
        console.log('  storms player123 -p minecraft');
        console.log('  storms username -v -o results.json');
        console.log('  storms gamer -p steam,minecraft -v');
        console.log();
        console.log('примечание: без указания платформ поиск выполняется по всем доступным платформам');
        console.log();
    }

    // задержка
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// обработка командной строки
async function main() {
    const args = process.argv.slice(2);
    const storms = new storms_command();
    
    const exit_code = await storms.run(args);
    process.exit(exit_code);
}

// запуск
if (require.main === module) {
    main().catch(console.error);
}

module.exports = storms_command;
