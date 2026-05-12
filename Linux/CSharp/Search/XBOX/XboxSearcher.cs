using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Web;
using StormSearch.Utils;

namespace StormSearch.Search.XBOX
{
    public class XboxSearcher
    {
        private readonly HttpClient _httpClient;
        private const string XBOX_API_KEY = "YOUR_XBOX_API_KEY";
        
        public XboxSearcher()
        {
            _httpClient = new HttpClient();
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "StormSearch/1.0");
            _httpClient.DefaultRequestHeaders.Add("X-Contract-Version", "2");
        }

        public async Task<SearchResult?> SearchPlayerAsync(string gamertag)
        {
            try
            {
                Colors.PrintLoading($"поиск профиля xbox: {gamertag}");
                Console.WriteLine();
                
                var result = new SearchResult
                {
                    Platform = "xbox",
                    Username = gamertag,
                    Id = "",
                    Found = false
                };

                // проверяем валидность gamertag
                if (!IsValidGamertag(gamertag))
                {
                    Colors.PrintError("неверный формат gamertag");
                    result.AdditionalInfo["validation"] = "invalid gamertag format";
                    result.AdditionalInfo["valid_format"] = "3-15 characters, letters, numbers, spaces, no special characters except hyphens";
                    return result;
                }

                // поиск профиля через xbox api
                var profileInfo = await GetProfileInfoAsync(gamertag);
                if (profileInfo != null)
                {
                    result.Found = true;
                    result.AdditionalInfo = profileInfo;
                    Colors.PrintSuccess("профиль xbox найден!");
                }
                else
                {
                    Colors.PrintError("профиль xbox не найден");
                    result.AdditionalInfo["status"] = "not found";
                }

                return result;
            }
            catch (Exception ex)
            {
                Colors.PrintError($"ошибка при поиске: {ex.Message}");
                return null;
            }
        }

        private bool IsValidGamertag(string gamertag)
        {
            // правила xbox gamertag: 3-15 символов, буквы, цифры, пробелы
            // не может начинаться или заканчиваться пробелом
            if (string.IsNullOrEmpty(gamertag) || gamertag.Length < 3 || gamertag.Length > 15)
            {
                return false;
            }

            if (gamertag.StartsWith(" ") || gamertag.EndsWith(" "))
            {
                return false;
            }

            // проверяем на допустимые символы
            foreach (char c in gamertag)
            {
                if (!char.IsLetterOrDigit(c) && c != ' ' && c != '-')
                {
                    return false;
                }
            }

            return true;
        }

        private async Task<Dictionary<string, string>?> GetProfileInfoAsync(string gamertag)
        {
            try
            {
                // xbox live api требует аутентификацию
                // используем альтернативные методы поиска
                
                // метод 1: поиск через xbox.com
                var webInfo = await SearchViaWebAsync(gamertag);
                if (webInfo != null)
                {
                    return webInfo;
                }

                // метод 2: проверка через сторонние api (ограниченно)
                var apiInfo = await SearchViaThirdPartyAPIAsync(gamertag);
                if (apiInfo != null)
                {
                    return apiInfo;
                }

                return null;
            }
            catch (Exception ex)
            {
                Colors.PrintWarning($"ошибка при получении информации о профиле: {ex.Message}");
                return null;
            }
        }

        private async Task<Dictionary<string, string>?> SearchViaWebAsync(string gamertag)
        {
            try
            {
                // поиск через xbox.com
                var searchUrl = $"https://www.xbox.com/en-us/search?q={HttpUtility.UrlEncode(gamertag)}";
                var response = await _httpClient.GetStringAsync(searchUrl);
                
                // базовый парсинг html для поиска профилей
                if (response.Contains("gamertag") || response.Contains("profile"))
                {
                    var info = new Dictionary<string, string>
                    {
                        ["gamertag"] = gamertag,
                        ["profile_url"] = $"https://www.xbox.com/en-us/profile/search?q={HttpUtility.UrlEncode(gamertag)}",
                        ["search_method"] = "web search",
                        ["status"] = "found via web search"
                    };

                    // пытаемся извлечь дополнительную информацию
                    ExtractAdditionalInfo(response, info);
                    
                    return info;
                }
            }
            catch (Exception ex)
            {
                Colors.PrintWarning($"ошибка веб поиска: {ex.Message}");
            }

            return null;
        }

        private async Task<Dictionary<string, string>?> SearchViaThirdPartyAPIAsync(string gamertag)
        {
            try
            {
                // использование сторонних api для xbox данных
                // это пример с ограниченной функциональностью
                var apiUrl = $"https://xboxapi.com/v2/xuid/{HttpUtility.UrlEncode(gamertag)}";
                
                // устанавливаем заголовок api ключа если доступен
                if (XBOX_API_KEY != "YOUR_XBOX_API_KEY")
                {
                    _httpClient.DefaultRequestHeaders.Add("X-AUTH", XBOX_API_KEY);
                }

                var response = await _httpClient.GetAsync(apiUrl);
                if (response.IsSuccessStatusCode)
                {
                    var xuid = await response.Content.ReadAsStringAsync();
                    
                    var info = new Dictionary<string, string>
                    {
                        ["gamertag"] = gamertag,
                        ["xuid"] = xuid.Trim('"'),
                        ["profile_url"] = $"https://www.xbox.com/en-us/profile/xuid/{xuid.Trim('"')}",
                        ["search_method"] = "third party api",
                        ["status"] = "found via api"
                    };

                    return info;
                }
            }
            catch (Exception ex)
            {
                Colors.PrintWarning($"ошибка поиска через api: {ex.Message}");
            }

            return null;
        }

        private void ExtractAdditionalInfo(string htmlContent, Dictionary<string, string> info)
        {
            try
            {
                // базовый парсинг html для извлечения информации
                // в реальном приложении здесь был бы более сложный парсинг
                
                if (htmlContent.Contains("online"))
                {
                    info["presence_status"] = "online";
                }
                else if (htmlContent.Contains("offline"))
                {
                    info["presence_status"] = "offline";
                }

                // поиск информации об играх
                if (htmlContent.Contains("playing"))
                {
                    info["currently_playing"] = "detected";
                }

                // поиск информации о репутации
                if (htmlContent.Contains("reputation"))
                {
                    info["reputation_info"] = "available";
                }
            }
            catch
            {
                // игнорируем ошибки парсинга
            }
        }

        public async Task<bool> CheckGamertagExistsAsync(string gamertag)
        {
            try
            {
                if (!IsValidGamertag(gamertag))
                {
                    return false;
                }

                var profileInfo = await GetProfileInfoAsync(gamertag);
                return profileInfo != null;
            }
            catch
            {
                return false;
            }
        }

        public async Task<string> GetXuidAsync(string gamertag)
        {
            try
            {
                var apiInfo = await SearchViaThirdPartyAPIAsync(gamertag);
                if (apiInfo != null && apiInfo.ContainsKey("xuid"))
                {
                    return apiInfo["xuid"];
                }
            }
            catch
            {
                // игнорируем ошибки
            }

            return "";
        }

        public async Task<Dictionary<string, string>> GetGamertagSuggestionsAsync(string partialGamertag)
        {
            var suggestions = new Dictionary<string, string>();
            
            try
            {
                // генерация предложений на основе частичного ввода
                // это упрощенная версия
                var searchUrl = $"https://www.xbox.com/en-us/search?q={HttpUtility.UrlEncode(partialGamertag)}";
                var response = await _httpClient.GetStringAsync(searchUrl);
                
                suggestions["search_url"] = searchUrl;
                suggestions["suggestions_available"] = "check xbox.com for suggestions";
                suggestions["note"] = "xbox api requires authentication for detailed suggestions";
            }
            catch (Exception ex)
            {
                suggestions["error"] = $"could not get suggestions: {ex.Message}";
            }

            return suggestions;
        }

        public Dictionary<string, string> GetGamertagRules()
        {
            return new Dictionary<string, string>
            {
                ["length"] = "3-15 characters",
                ["allowed_chars"] = "letters, numbers, spaces, hyphens",
                ["no_start_end_spaces"] = "cannot start or end with space",
                ["case_insensitive"] = "gamertags are case insensitive",
                ["unique"] = "must be unique across xbox live",
                ["change_limit"] = "can be changed once for free, then costs"
            };
        }
    }
}
