// веб скрапер для xbox
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

class xbox_scraper {
    constructor() {
        this.base_url = 'https://www.xbox.com';
        this.api_url = 'https://profile.xboxlive.com';
        this.api_key = process.env.XBOX_API_KEY || 'YOUR_XBOX_API_KEY';
    }

    // поиск профиля xbox
    async search_player(gamertag) {
        try {
            console.log(`[*] поиск профиля xbox: ${gamertag}`);
            
            const result = {
                platform: 'xbox',
                gamertag: gamertag,
                xuid: '',
                found: false,
                profile_info: {},
                presence_info: {},
                games_info: {}
            };

            // проверяем валидность gamertag
            if (!this.is_valid_gamertag(gamertag)) {
                console.log('[-] неверный формат gamertag');
                result.profile_info.validation = 'invalid gamertag format';
                result.profile_info.valid_format = '3-15 characters, letters, numbers, spaces, no special characters except hyphens';
                return result;
            }

            // поиск профиля через веб
            const web_info = await this.search_via_web(gamertag);
            if (web_info) {
                result.found = true;
                result.profile_info = web_info;
            }

            // поиск через api (если доступен ключ)
            if (this.api_key !== 'YOUR_XBOX_API_KEY') {
                const api_info = await this.search_via_api(gamertag);
                if (api_info) {
                    result.found = true;
                    result.xuid = api_info.xuid;
                    result.profile_info = { ...result.profile_info, ...api_info };
                }
            }

            // получение информации о присутствии
            if (result.found) {
                result.presence_info = await this.get_presence_info(result.xuid || gamertag);
                
                // получение информации об играх
                result.games_info = await this.get_games_info(result.xuid || gamertag);
            }

            if (result.found) {
                console.log('[+] профиль xbox найден!');
            } else {
                console.log('[-] профиль xbox не найден');
            }

            return result;
        } catch (error) {
            console.log(`[-] ошибка при поиске: ${error.message}`);
            return null;
        }
    }

    // валидация gamertag
    is_valid_gamertag(gamertag) {
        // правила xbox gamertag: 3-15 символов, буквы, цифры, пробелы
        if (!gamertag || gamertag.length < 3 || gamertag.length > 15) {
            return false;
        }

        if (gamertag.startsWith(' ') || gamertag.endsWith(' ')) {
            return false;
        }

        // проверяем на допустимые символы
        for (let char of gamertag) {
            if (!/[a-zA-Z0-9 -]/.test(char)) {
                return false;
            }
        }

        return true;
    }

    // поиск через веб
    async search_via_web(gamertag) {
        try {
            console.log(`[*] веб поиск профиля xbox: ${gamertag}`);
            
            const search_url = `${this.base_url}/en-us/search?q=${encodeURIComponent(gamertag)}`;
            
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            await page.goto(search_url, { waitUntil: 'networkidle2' });

            const profile_data = await page.evaluate(() => {
                const data = {};
                
                // поиск ссылки на профиль
                const profile_link = document.querySelector('a[href*="/profile/"]');
                if (profile_link) {
                    data.profile_url = profile_link.href;
                    data.found_via_search = true;
                }

                // поиск имени профиля
                const gamertag_element = document.querySelector('.gamertag, .profile-name');
                if (gamertag_element) {
                    data.displayed_gamertag = gamertag_element.textContent.trim();
                }

                // поиск аватара
                const avatar_element = document.querySelector('.avatar, .profile-avatar');
                if (avatar_element) {
                    data.avatar_url = avatar_element.src || avatar_element.style.backgroundImage;
                }

                // поиск статуса присутствия
                const status_element = document.querySelector('.presence-status, .online-status');
                if (status_element) {
                    data.presence_status = status_element.textContent.trim();
                }

                // поиск информации об игре
                const game_element = document.querySelector('.currently-playing, .now-playing');
                if (game_element) {
                    data.currently_playing = game_element.textContent.trim();
                }

                return data;
            });

            await browser.close();

            if (Object.keys(profile_data).length > 0) {
                console.log('[+] данные профиля получены через веб');
                return profile_data;
            }

        } catch (error) {
            console.log(`[!] ошибка веб поиска: ${error.message}`);
        }

        return null;
    }

    // поиск через api
    async search_via_api(gamertag) {
        try {
            console.log(`[*] api поиск профиля xbox: ${gamertag}`);
            
            // xbox live api требует аутентификации
            // это упрощенная версия
            const headers = {
                'x-Contract-Version': '2',
                'Authorization': `Bearer ${this.api_key}`,
                'Content-Type': 'application/json'
            };

            const profile_url = `${this.api_url}/users/batch/profile/settings`;
            const body = {
                settings: ["Gamertag", "GameDisplayPicRaw", "AccountTier", "Tenure"],
                userIds: [gamertag]
            };

            const response = await axios.post(profile_url, body, { headers });
            
            if (response.data && response.data.profileUsers && response.data.profileUsers.length > 0) {
                const profile = response.data.profileUsers[0];
                
                return {
                    xuid: profile.xuid,
                    gamertag: profile.settings.find(s => s.id === 'Gamertag')?.value || gamertag,
                    avatar_url: profile.settings.find(s => s.id === 'GameDisplayPicRaw')?.value || '',
                    account_tier: profile.settings.find(s => s.id === 'AccountTier')?.value || '',
                    tenure: profile.settings.find(s => s.id === 'Tenure')?.value || '',
                    search_method: 'xbox api'
                };
            }
        } catch (error) {
            console.log(`[!] ошибка api поиска: ${error.message}`);
        }

        return null;
    }

    // получение информации о присутствии
    async get_presence_info(identifier) {
        try {
            console.log(`[*] получение информации о присутствии: ${identifier}`);
            
            // упрощенная проверка присутствия
            const presence_info = {
                status: 'unknown',
                state: 'offline',
                last_seen: 'unknown',
                note: 'detailed presence requires xbox api authentication'
            };

            if (this.api_key !== 'YOUR_XBOX_API_KEY') {
                // здесь был бы реальный запрос к xbox api
                presence_info.note = 'api key available but implementation simplified';
            }

            return presence_info;
        } catch (error) {
            console.log(`[!] ошибка получения информации о присутствии: ${error.message}`);
            return { error: error.message };
        }
    }

    // получение информации об играх
    async get_games_info(identifier) {
        try {
            console.log(`[*] получение информации об играх: ${identifier}`);
            
            const games_info = {
                recent_games: [],
                total_games: 'unknown',
                achievements: 'unknown',
                gamerscore: 'unknown',
                note: 'detailed games info requires xbox api authentication'
            };

            if (this.api_key !== 'YOUR_XBOX_API_KEY') {
                // здесь был бы реальный запрос к xbox api
                games_info.note = 'api key available but implementation simplified';
            }

            return games_info;
        } catch (error) {
            console.log(`[!] ошибка получения информации об играх: ${error.message}`);
            return { error: error.message };
        }
    }

    // веб скрапинг профиля xbox
    async scrape_profile(gamertag) {
        try {
            console.log(`[*] скрапинг профиля xbox: ${gamertag}`);
            
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            
            // пробуем перейти напрямую к профилю
            await page.goto(`${this.base_url}/en-us/profile/${gamertag}`, {
                waitUntil: 'networkidle2'
            });

            const profile_data = await page.evaluate(() => {
                const data = {};
                
                // основная информация профиля
                const gamertag_element = document.querySelector('.gamertag');
                if (gamertag_element) {
                    data.gamertag = gamertag_element.textContent.trim();
                }

                // информация об аккаунте
                const gamerpic = document.querySelector('.gamerpic');
                if (gamerpic) {
                    data.gamerpic_url = gamerpic.src;
                }

                // статус присутствия
                const presence = document.querySelector('.presence');
                if (presence) {
                    data.presence_text = presence.textContent.trim();
                }

                // информация о подписке
                const subscription = document.querySelector('.subscription-info');
                if (subscription) {
                    data.subscription = subscription.textContent.trim();
                }

                // статистика
                const stats = document.querySelectorAll('.stat-item');
                if (stats.length > 0) {
                    data.stats = {};
                    stats.forEach(stat => {
                        const label = stat.querySelector('.stat-label');
                        const value = stat.querySelector('.stat-value');
                        if (label && value) {
                            data.stats[label.textContent.trim()] = value.textContent.trim();
                        }
                    });
                }

                // последние игры
                const recent_games = document.querySelectorAll('.recent-game');
                if (recent_games.length > 0) {
                    data.recent_games = [];
                    recent_games.forEach(game => {
                        const title = game.querySelector('.game-title');
                        const image = game.querySelector('.game-image');
                        const game_data = {
                            title: title ? title.textContent.trim() : 'unknown',
                            image_url: image ? image.src : ''
                        };
                        data.recent_games.push(game_data);
                    });
                }

                return data;
            });

            await browser.close();
            
            console.log('[+] данные профиля xbox получены');
            return profile_data;
        } catch (error) {
            console.log(`[!] ошибка скрапинга профиля xbox: ${error.message}`);
            return null;
        }
    }

    // поиск достижений
    async search_achievements(gamertag, game_title = '') {
        try {
            console.log(`[*] поиск достижений: ${gamertag} - ${game_title}`);
            
            const achievements_info = {
                gamertag: gamertag,
                game_title: game_title,
                achievements: [],
                total_achievements: 0,
                unlocked_achievements: 0,
                gamerscore: 0,
                note: 'detailed achievements require xbox api authentication'
            };

            if (this.api_key !== 'YOUR_XBOX_API_KEY') {
                // здесь был бы реальный запрос к xbox api
                achievements_info.note = 'api key available but implementation simplified';
            }

            return achievements_info;
        } catch (error) {
            console.log(`[!] ошибка поиска достижений: ${error.message}`);
            return { error: error.message };
        }
    }

    // поиск друзей
    async search_friends(gamertag) {
        try {
            console.log(`[*] поиск друзей: ${gamertag}`);
            
            const friends_info = {
                gamertag: gamertag,
                friends: [],
                total_friends: 0,
                online_friends: 0,
                note: 'detailed friends list requires xbox api authentication'
            };

            if (this.api_key !== 'YOUR_XBOX_API_KEY') {
                // здесь был бы реальный запрос к xbox api
                friends_info.note = 'api key available but implementation simplified';
            }

            return friends_info;
        } catch (error) {
            console.log(`[!] ошибка поиска друзей: ${error.message}`);
            return { error: error.message };
        }
    }

    // проверка существования gamertag
    async check_gamertag_exists(gamertag) {
        try {
            if (!this.is_valid_gamertag(gamertag)) {
                return false;
            }

            const web_info = await this.search_via_web(gamertag);
            return web_info !== null;
        } catch (error) {
            return false;
        }
    }

    // получение xuid
    async get_xuid(gamertag) {
        try {
            const api_info = await this.search_via_api(gamertag);
            if (api_info && api_info.xuid) {
                return api_info.xuid;
            }
        } catch (error) {
            console.log(`[!] ошибка получения xuid: ${error.message}`);
        }

        return '';
    }

    // генерация предложений gamertag
    async get_gamertag_suggestions(partial_gamertag) {
        try {
            console.log(`[*] генерация предложений для: ${partial_gamertag}`);
            
            const suggestions = {
                partial: partial_gamertag,
                suggestions: [],
                total_suggestions: 0,
                note: 'suggestions based on common patterns and availability'
            };

            // генерация базовых предложений
            const base_suggestions = [
                partial_gamertag + '123',
                partial_gamertag + 'X',
                partial_gamertag + '2024',
                'x' + partial_gamertag,
                partial_gamertag + 'Gamer',
                'The' + partial_gamertag,
                partial_gamertag + 'Official'
            ];

            // фильтрация валидных предложений
            suggestions.suggestions = base_suggestions.filter(suggestion => 
                this.is_valid_gamertag(suggestion)
            );

            suggestions.total_suggestions = suggestions.suggestions.length;

            return suggestions;
        } catch (error) {
            console.log(`[!] ошибка генерации предложений: ${error.message}`);
            return { error: error.message };
        }
    }

    // правила gamertag
    get_gamertag_rules() {
        return {
            length: '3-15 characters',
            allowed_chars: 'letters, numbers, spaces, hyphens',
            no_start_end_spaces: 'cannot start or end with space',
            case_insensitive: 'gamertags are case insensitive',
            unique: 'must be unique across xbox live',
            change_limit: 'can be changed once for free, then costs',
            prohibited_words: 'no prohibited or offensive words',
            special_chars: 'limited special characters allowed'
        };
    }

    // экспорт результатов
    export_results(results) {
        return JSON.stringify(results, null, 2);
    }
}

module.exports = xbox_scraper;
