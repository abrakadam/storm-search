// веб скрапер для minecraft
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

class minecraft_scraper {
    constructor() {
        this.base_url = 'https://api.mojang.com';
        this.session_url = 'https://sessionserver.mojang.com';
        this.minecraft_net = 'https://www.minecraft.net';
    }

    // поиск игрока minecraft
    async search_player(username) {
        try {
            console.log(`[*] поиск игрока minecraft: ${username}`);
            
            // получение uuid через api
            const uuid = await this.get_uuid(username);
            if (!uuid) {
                console.log('[-] игрок не найден');
                return null;
            }

            // получение детальной информации о профиле
            const profile_info = await this.get_profile_info(uuid);
            
            // получение истории имен
            const name_history = await this.get_name_history(uuid);
            
            // получение информации о скине
            const skin_info = await this.get_skin_info(uuid);

            const result = {
                platform: 'minecraft',
                username: username,
                uuid: uuid,
                found: true,
                profile_info: profile_info,
                name_history: name_history,
                skin_info: skin_info
            };

            console.log('[+] игрок minecraft найден!');
            return result;
        } catch (error) {
            console.log(`[-] ошибка при поиске: ${error.message}`);
            return null;
        }
    }

    // получение uuid игрока
    async get_uuid(username) {
        try {
            const response = await axios.get(`${this.base_url}/users/profiles/minecraft/${username}`);
            
            if (response.status === 204) {
                return null;
            }

            return response.data.id;
        } catch (error) {
            if (error.response && error.response.status === 204) {
                return null;
            }
            throw error;
        }
    }

    // получение информации о профиле
    async get_profile_info(uuid) {
        try {
            const response = await axios.get(`${this.session_url}/session/minecraft/profile/${uuid}`);
            const data = response.data;

            const profile_info = {
                player_name: data.name || username,
                uuid: uuid,
                properties: {}
            };

            // парсинг свойств профиля
            if (data.properties && data.properties.length > 0) {
                const property = data.properties[0];
                if (property.value) {
                    try {
                        const decoded_value = Buffer.from(property.value, 'base64').toString('utf8');
                        const texture_data = JSON.parse(decoded_value);
                        
                        if (texture_data.textures) {
                            const textures = texture_data.textures;
                            
                            if (textures.SKIN) {
                                profile_info.properties.skin_url = textures.SKIN.url;
                            }
                            
                            if (textures.CAPE) {
                                profile_info.properties.cape_url = textures.CAPE.url;
                            }
                        }
                        
                        if (texture_data.profileName) {
                            profile_info.properties.profile_name = texture_data.profileName;
                        }
                    } catch (parse_error) {
                        console.log(`[!] ошибка парсинга текстур: ${parse_error.message}`);
                    }
                }
            }

            return profile_info;
        } catch (error) {
            console.log(`[!] ошибка получения информации о профиле: ${error.message}`);
            return {};
        }
    }

    // получение истории имен
    async get_name_history(uuid) {
        try {
            const response = await axios.get(`${this.base_url}/user/profiles/${uuid}/names`);
            const names = response.data.map(entry => entry.name);
            
            return {
                names: names,
                history_string: names.join(' -> '),
                total_changes: names.length - 1
            };
        } catch (error) {
            console.log(`[!] ошибка получения истории имен: ${error.message}`);
            return {
                names: [],
                history_string: 'недоступно',
                total_changes: 0
            };
        }
    }

    // получение информации о скине
    async get_skin_info(uuid) {
        try {
            const skin_urls = {
                avatar: `https://crafatar.com/avatars/${uuid}`,
                head: `https://crafatar.com/renders/head/${uuid}`,
                body: `https://crafatar.com/renders/body/${uuid}`,
                skin: `https://crafatar.com/skins/${uuid}`,
                cape: `https://crafatar.com/capes/${uuid}`
            };

            return {
                crafatar_urls: skin_urls,
                download_links: skin_urls,
                note: 'crafatar provides minecraft skin and avatar services'
            };
        } catch (error) {
            console.log(`[!] ошибка получения информации о скине: ${error.message}`);
            return {};
        }
    }

    // проверка существования игрока
    async check_player_exists(username) {
        try {
            const uuid = await this.get_uuid(username);
            return uuid !== null;
        } catch (error) {
            return false;
        }
    }

    // получение информации о сервере minecraft
    async get_server_status(server_ip, port = 25565) {
        try {
            // это упрощенная версия - в реальном приложении здесь был бы пинг сервера
            const server_info = {
                server_ip: server_ip,
                port: port,
                status: 'unknown',
                players_online: 'n/a',
                version: 'n/a',
                motd: 'n/a',
                note: 'server ping requires additional library (mc-ping)'
            };

            console.log('[!] проверка сервера требует дополнительной библиотеки');
            return server_info;
        } catch (error) {
            console.log(`[!] ошибка проверки сервера: ${error.message}`);
            return null;
        }
    }

    // веб скрапинг minecraft.net для дополнительной информации
    async scrape_minecraft_net(username) {
        try {
            console.log(`[*] скрапинг minecraft.net для: ${username}`);
            
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            
            await page.goto(`https://www.minecraft.net/en-us/profile/${username}`, {
                waitUntil: 'networkidle2'
            });

            const scraped_data = await page.evaluate(() => {
                const data = {};
                
                // попытка извлечь имя профиля
                const profile_name = document.querySelector('.profile-name');
                if (profile_name) {
                    data.profile_name = profile_name.textContent.trim();
                }

                // попытка извлечь информацию о скине
                const skin_img = document.querySelector('.skin-image');
                if (skin_img) {
                    data.skin_image_url = skin_img.src;
                }

                // попытка извлечь информацию о покупках
                const purchases = document.querySelector('.purchase-info');
                if (purchases) {
                    data.purchase_info = purchases.textContent.trim();
                }

                return data;
            });

            await browser.close();
            
            console.log('[+] данные с minecraft.net получены');
            return scraped_data;
        } catch (error) {
            console.log(`[!] ошибка скрапинга minecraft.net: ${error.message}`);
            return null;
        }
    }

    // поиск связанных аккаунтов
    async find_linked_accounts(username) {
        try {
            console.log(`[*] поиск связанных аккаунтов для: ${username}`);
            
            const linked_accounts = {
                minecraft_net: await this.scrape_minecraft_net(username),
                realms: await this.check_realms_access(username),
                marketplace: await this.check_marketplace_activity(username)
            };

            return linked_accounts;
        } catch (error) {
            console.log(`[!] ошибка поиска связанных аккаунтов: ${error.message}`);
            return null;
        }
    }

    // проверка доступа к realms
    async check_realms_access(username) {
        try {
            // упрощенная проверка realms
            return {
                status: 'unknown',
                note: 'realms access requires authentication',
                check_url: 'https://www.minecraft.net/en-us/realms'
            };
        } catch (error) {
            return null;
        }
    }

    // проверка активности в marketplace
    async check_marketplace_activity(username) {
        try {
            // упрощенная проверка marketplace
            return {
                status: 'unknown',
                note: 'marketplace activity requires authentication',
                check_url: 'https://www.minecraft.net/en-us/marketplace'
            };
        } catch (error) {
            return null;
        }
    }

    // экспорт результатов в json
    export_results(results) {
        return JSON.stringify(results, null, 2);
    }

    // валидация имени пользователя
    validate_username(username) {
        // правила minecraft: 3-16 символов, только буквы, цифры, подчеркивания
        const pattern = /^[a-zA-Z0-9_]{3,16}$/;
        return {
            valid: pattern.test(username),
            rules: {
                length: '3-16 characters',
                allowed_chars: 'letters, numbers, underscores',
                no_spaces: 'no spaces allowed'
            }
        };
    }
}

module.exports = minecraft_scraper;
