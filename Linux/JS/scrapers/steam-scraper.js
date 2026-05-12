// веб скрапер для steam
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

class steam_scraper {
    constructor() {
        this.base_url = 'https://api.steampowered.com';
        this.community_url = 'https://steamcommunity.com';
        this.store_url = 'https://store.steampowered.com';
        this.api_key = process.env.STEAM_API_KEY || 'YOUR_STEAM_API_KEY';
    }

    // поиск профиля steam
    async search_player(username) {
        try {
            console.log(`[*] поиск профиля steam: ${username}`);
            
            const result = {
                platform: 'steam',
                username: username,
                steam_id: '',
                found: false,
                profile_info: {},
                games_info: {},
                friends_info: {}
            };

            // сначала ищем по vanity url
            let steam_id = await this.resolve_vanity_url(username);
            
            if (!steam_id) {
                // если не нашли, пробуем прямой поиск
                steam_id = await this.search_by_direct_method(username);
            }
            
            if (!steam_id) {
                console.log('[-] профиль steam не найден');
                return result;
            }

            result.steam_id = steam_id;
            result.found = true;

            // получаем детальную информацию о профиле
            result.profile_info = await this.get_profile_summary(steam_id);
            
            // получаем информацию об играх
            result.games_info = await this.get_player_games(steam_id);
            
            // получаем информацию о друзьях
            result.friends_info = await this.get_player_friends(steam_id);

            console.log('[+] профиль steam найден!');
            return result;
        } catch (error) {
            console.log(`[-] ошибка при поиске: ${error.message}`);
            return null;
        }
    }

    // разрешение vanity url в steam id
    async resolve_vanity_url(username) {
        try {
            if (this.api_key === 'YOUR_STEAM_API_KEY') {
                console.log('[!] steam api ключ не установлен');
                return null;
            }

            const url = `${this.base_url}/ISteamUser/ResolveVanityURL/v0001/`;
            const params = {
                key: this.api_key,
                vanityurl: username
            };

            const response = await axios.get(url, { params });
            const data = response.data;

            if (data.response && data.response.success === 1) {
                return data.response.steamid;
            }
        } catch (error) {
            console.log(`[!] ошибка при разрешении vanity url: ${error.message}`);
        }

        return null;
    }

    // прямой поиск профиля
    async search_by_direct_method(username) {
        try {
            // проверяем различные форматы steam id
            if (username.startsWith('STEAM_')) {
                return this.convert_steamid_to_64(username);
            } else if (/^\d{17}$/.test(username)) {
                return username; // уже steamid64
            } else {
                // пробуем найти через поиск в сообществе
                return await this.search_community(username);
            }
        } catch (error) {
            return null;
        }
    }

    // поиск в сообществе steam
    async search_community(username) {
        try {
            const search_url = `${this.community_url}/search/users/#text=${encodeURIComponent(username)}`;
            
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            await page.goto(search_url, { waitUntil: 'networkidle2' });

            const content = await page.content();
            await browser.close();

            // упрощенный парсинг
            if (content.includes('searchPersonaName')) {
                console.log('[!] найдены возможные совпадения. требуется ручная проверка.');
                return 'FOUND_BUT_NEED_VERIFICATION';
            }
        } catch (error) {
            console.log(`[!] ошибка поиска в сообществе: ${error.message}`);
        }

        return null;
    }

    // конвертация steamid в steamid64
    convert_steamid_to_64(steamid) {
        try {
            const parts = steamid.split(':');
            if (parts.length === 3 && parts[0] === 'STEAM') {
                const y = parseInt(parts[1]);
                const z = parseInt(parts[2]);
                const steamid64 = z * 2 + 76561197960265728 + y;
                return steamid64.toString();
            }
        } catch (error) {
            console.log(`[!] ошибка конвертации steamid: ${error.message}`);
        }
        return null;
    }

    // получение сводки профиля
    async get_profile_summary(steam_id) {
        const profile_info = {};

        try {
            if (this.api_key === 'YOUR_STEAM_API_KEY') {
                profile_info.profile_url = `${this.community_url}/profiles/${steam_id}`;
                profile_info.api_key = 'required for detailed information';
                return profile_info;
            }

            const url = `${this.base_url}/ISteamUser/GetPlayerSummaries/v0002/`;
            const params = {
                key: this.api_key,
                steamids: steam_id
            };

            const response = await axios.get(url, { params });
            const data = response.data;

            if (data.response && data.response.players && data.response.players.length > 0) {
                const player = data.response.players[0];
                
                profile_info.persona_name = player.personaname || 'unknown';
                profile_info.profile_url = player.profileurl || '';
                profile_info.avatar = player.avatar || '';
                profile_info.avatar_medium = player.avatarmedium || '';
                profile_info.avatar_full = player.avatarfull || '';
                profile_info.status = this.get_persona_status(player.personastate || 0);
                
                if (player.realname) {
                    profile_info.real_name = player.realname;
                }
                
                if (player.loccountrycode) {
                    profile_info.country = player.loccountrycode;
                }
                
                if (player.timecreated) {
                    const created_date = new Date(player.timecreated * 1000);
                    profile_info.account_created = created_date.toISOString().split('T')[0];
                }
                
                if (player.gameextrainfo) {
                    profile_info.currently_playing = player.gameextrainfo;
                }
            }
        } catch (error) {
            profile_info.error = `could not fetch profile info: ${error.message}`;
        }

        return profile_info;
    }

    // получение информации об играх
    async get_player_games(steam_id) {
        const games_info = {};

        try {
            if (this.api_key === 'YOUR_STEAM_API_KEY') {
                games_info.games_info = 'api key required for games information';
                return games_info;
            }

            const url = `${this.base_url}/IPlayerService/GetOwnedGames/v0001/`;
            const params = {
                key: this.api_key,
                steamid: steam_id,
                format: 'json',
                include_appinfo: '1',
                include_played_free_games: '1'
            };

            const response = await axios.get(url, { params });
            const data = response.data;

            if (data.response) {
                if (data.response.game_count !== undefined) {
                    games_info.total_games = data.response.game_count;
                }
                
                if (data.response.games) {
                    const games = data.response.games.slice(0, 5); // первые 5 игр
                    const recent_games = games.map(game => game.name || 'unknown');
                    games_info.recent_games = recent_games.join(', ');
                    
                    // считываем общее время игры
                    const total_playtime = games.reduce((sum, game) => sum + (game.playtime_forever || 0), 0);
                    games_info.total_playtime_hours = Math.floor(total_playtime / 60);
                }
            }
        } catch (error) {
            games_info.games_error = `could not fetch games: ${error.message}`;
        }

        return games_info;
    }

    // получение информации о друзьях
    async get_player_friends(steam_id) {
        const friends_info = {};

        try {
            if (this.api_key === 'YOUR_STEAM_API_KEY') {
                friends_info.friends_info = 'api key required for friends information';
                return friends_info;
            }

            const url = `${this.base_url}/ISteamUser/GetFriendList/v0001/`;
            const params = {
                key: this.api_key,
                steamid: steam_id,
                relationship: 'friend'
            };

            const response = await axios.get(url, { params });
            const data = response.data;

            if (data.friendslist && data.friendslist.friends) {
                friends_info.total_friends = data.friendslist.friends.length;
            } else if (response.status === 401) {
                friends_info.friends = 'profile is private';
            }
        } catch (error) {
            friends_info.friends_error = `could not fetch friends: ${error.message}`;
        }

        return friends_info;
    }

    // получение текстового статуса
    get_persona_status(status) {
        const status_map = {
            0: 'offline',
            1: 'online',
            2: 'busy',
            3: 'away',
            4: 'snooze',
            5: 'looking to trade',
            6: 'looking to play'
        };
        return status_map[status] || 'unknown';
    }

    // веб скрапинг профиля steam
    async scrape_profile(steam_id) {
        try {
            console.log(`[*] скрапинг профиля steam: ${steam_id}`);
            
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            await page.goto(`${this.community_url}/profiles/${steam_id}`, {
                waitUntil: 'networkidle2'
            });

            const scraped_data = await page.evaluate(() => {
                const data = {};
                
                // попытка извлечь имя профиля
                const persona_name = document.querySelector('.persona_name');
                if (persona_name) {
                    data.persona_name = persona_name.textContent.trim();
                }

                // попытка извлечь статус
                const status = document.querySelector('.persona_status');
                if (status) {
                    data.status_text = status.textContent.trim();
                }

                // попытка извлечь информацию о уровне
                const level = document.querySelector('.friendPlayerLevelNum');
                if (level) {
                    data.player_level = level.textContent.trim();
                }

                // попытка извлечь информацию о текущей игре
                const current_game = document.querySelector('.profile_in_game_name');
                if (current_game) {
                    data.currently_playing = current_game.textContent.trim();
                }

                // попытка извлечь информацию о баннере профиля
                const profile_banner = document.querySelector('.profile_header_bg');
                if (profile_banner) {
                    const bg_style = profile_banner.style.backgroundImage;
                    if (bg_style) {
                        data.profile_banner_url = bg_style.slice(5, -2); // удаляем url(" и ")
                    }
                }

                return data;
            });

            await browser.close();
            
            console.log('[+] данные профиля steam получены');
            return scraped_data;
        } catch (error) {
            console.log(`[!] ошибка скрапинга профиля steam: ${error.message}`);
            return null;
        }
    }

    // поиск игр в магазине steam
    async search_games(query, limit = 5) {
        try {
            console.log(`[*] поиск игр в steam: ${query}`);
            
            const url = `${this.store_url}/search/results/`;
            const params = {
                term: query,
                category1: 998, // игры
                supportedlang: 'russian',
               ndl: 'russian'
            };

            const response = await axios.get(url, { params });
            const $ = cheerio.load(response.data);
            
            const games = [];
            $('.search_result_row').slice(0, limit).each((index, element) => {
                const game_element = $(element);
                const game = {
                    title: game_element.find('.title').text().trim(),
                    price: game_element.find('.search_price').text().trim(),
                    release_date: game_element.find('.search_released').text().trim(),
                    review_summary: game_element.find('.search_review_summary').text().trim(),
                    url: game_element.attr('href'),
                    image_url: game_element.find('img').attr('src')
                };
                games.push(game);
            });

            return {
                query: query,
                games: games,
                total_found: games.length
            };
        } catch (error) {
            console.log(`[!] ошибка поиска игр: ${error.message}`);
            return null;
        }
    }

    // проверка существования профиля
    async check_profile_exists(username) {
        try {
            const steam_id = await this.resolve_vanity_url(username);
            if (!steam_id) {
                steam_id = await this.search_by_direct_method(username);
            }
            return steam_id !== null;
        } catch (error) {
            return false;
        }
    }

    // экспорт результатов
    export_results(results) {
        return JSON.stringify(results, null, 2);
    }

    // валидация steam id
    validate_steam_id(steam_id) {
        const result = {
            valid: false,
            type: '',
            steamid64: ''
        };

        try {
            if (steam_id.startsWith('STEAM_')) {
                result.valid = true;
                result.type = 'steamid';
                result.steamid64 = this.convert_steamid_to_64(steam_id);
            } else if (/^\d{17}$/.test(steam_id)) {
                result.valid = true;
                result.type = 'steamid64';
                result.steamid64 = steam_id;
            } else {
                result.type = 'custom_url';
                result.valid = /^[a-zA-Z0-9_-]{2,32}$/.test(steam_id);
            }
        } catch (error) {
            result.error = error.message;
        }

        return result;
    }
}

module.exports = steam_scraper;
