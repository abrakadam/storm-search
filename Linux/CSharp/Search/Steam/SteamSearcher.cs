using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Web;
using StormSearch.Utils;

namespace StormSearch.Search.Steam
{
    public class SteamSearcher
    {
        private readonly HttpClient _httpClient;
        private const string STEAM_API_KEY = "YOUR_STEAM_API_KEY";
        
        public SteamSearcher()
        {
            _httpClient = new HttpClient();
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "StormSearch/1.0");
        }

        public async Task<SearchResult?> SearchPlayerAsync(string username)
        {
            try
            {
                Colors.PrintLoading($"поиск профиля steam: {username}");
                Console.WriteLine();
                
                var result = new SearchResult
                {
                    Platform = "steam",
                    Username = username,
                    Id = "",
                    Found = false
                };

                // сначала ищем по vanity url
                var steamId = await ResolveVanityUrlAsync(username);
                
                if (string.IsNullOrEmpty(steamId))
                {
                    // если не нашли, пробуем прямой поиск
                    steamId = await SearchByDirectMethodAsync(username);
                }
                
                if (string.IsNullOrEmpty(steamId))
                {
                    Colors.PrintError("профиль steam не найден");
                    return result;
                }

                result.Id = steamId;
                result.Found = true;

                // получаем детальную информацию о профиле
                var profileInfo = await GetProfileSummaryAsync(steamId);
                result.AdditionalInfo = profileInfo;

                Colors.PrintSuccess("профиль steam найден!");
                return result;
            }
            catch (Exception ex)
            {
                Colors.PrintError($"ошибка при поиске: {ex.Message}");
                return null;
            }
        }

        private async Task<string?> ResolveVanityUrlAsync(string username)
        {
            try
            {
                if (STEAM_API_KEY == "YOUR_STEAM_API_KEY")
                {
                    Colors.PrintWarning("steam api ключ не установлен");
                    return null;
                }

                var url = $"https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key={STEAM_API_KEY}&vanityurl={HttpUtility.UrlEncode(username)}";
                var response = await _httpClient.GetStringAsync(url);
                var data = JsonSerializer.Deserialize<JsonElement>(response);

                if (data.TryGetProperty("response", out var responseElement) && 
                    responseElement.TryGetProperty("success", out var success) && 
                    success.GetInt32() == 1)
                {
                    return responseElement.GetProperty("steamid").GetString();
                }
            }
            catch (Exception ex)
            {
                Colors.PrintWarning($"ошибка при разрешении vanity url: {ex.Message}");
            }

            return null;
        }

        private async Task<string?> SearchByDirectMethodAsync(string username)
        {
            try
            {
                // проверяем различные форматы steam id
                if (username.StartsWith("STEAM_"))
                {
                    return ConvertSteamIdTo64(username);
                }
                else if (username.Length == 17 && long.TryParse(username, out _))
                {
                    return username; // уже steamid64
                }
                else
                {
                    // пробуем найти через поиск в сообществе
                    return await SearchCommunityAsync(username);
                }
            }
            catch
            {
                return null;
            }
        }

        private async Task<string?> SearchCommunityAsync(string username)
        {
            try
            {
                var searchUrl = $"https://steamcommunity.com/search/users/#text={HttpUtility.UrlEncode(username)}";
                var response = await _httpClient.GetStringAsync(searchUrl);
                
                if (response.Contains("searchPersonaName"))
                {
                    Colors.PrintWarning("найдены возможные совпадения. требуется ручная проверка.");
                    return "FOUND_BUT_NEED_VERIFICATION";
                }
            }
            catch
            {
                // игнорируем ошибки
            }

            return null;
        }

        private string? ConvertSteamIdTo64(string steamId)
        {
            try
            {
                var parts = steamId.Split(':');
                if (parts.Length == 3 && parts[0] == "STEAM")
                {
                    var y = int.Parse(parts[1]);
                    var z = long.Parse(parts[2]);
                    var steamId64 = z * 2 + 76561197960265728 + y;
                    return steamId64.ToString();
                }
            }
            catch
            {
                // игнорируем ошибки парсинга
            }

            return null;
        }

        private async Task<Dictionary<string, string>> GetProfileSummaryAsync(string steamId)
        {
            var info = new Dictionary<string, string>();

            try
            {
                if (STEAM_API_KEY == "YOUR_STEAM_API_KEY")
                {
                    info["profile_url"] = $"https://steamcommunity.com/profiles/{steamId}";
                    info["api_key"] = "required for detailed information";
                    return info;
                }

                var url = $"https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={STEAM_API_KEY}&steamids={steamId}";
                var response = await _httpClient.GetStringAsync(url);
                var data = JsonSerializer.Deserialize<JsonElement>(response);

                if (data.TryGetProperty("response", out var responseElement) && 
                    responseElement.TryGetProperty("players", out var players) && 
                    players.GetArrayLength() > 0)
                {
                    var player = players[0];
                    
                    info["persona_name"] = player.GetProperty("personaname").GetString() ?? "";
                    info["profile_url"] = player.GetProperty("profileurl").GetString() ?? "";
                    info["avatar"] = player.GetProperty("avatar").GetString() ?? "";
                    info["status"] = GetPersonaStatus(player.GetProperty("personastate").GetInt32());
                    
                    if (player.TryGetProperty("realname", out var realName))
                    {
                        info["real_name"] = realName.GetString() ?? "";
                    }
                    
                    if (player.TryGetProperty("loccountrycode", out var countryCode))
                    {
                        info["country"] = countryCode.GetString() ?? "";
                    }
                    
                    if (player.TryGetProperty("timecreated", out var timeCreated))
                    {
                        var createdDate = DateTimeOffset.FromUnixTimeSeconds(timeCreated.GetInt64()).DateTime;
                        info["account_created"] = createdDate.ToString("yyyy-MM-dd HH:mm:ss");
                    }
                    
                    if (player.TryGetProperty("gameextrainfo", out var gameInfo))
                    {
                        info["currently_playing"] = gameInfo.GetString() ?? "";
                    }
                }
            }
            catch (Exception ex)
            {
                info["error"] = $"could not fetch profile info: {ex.Message}";
            }

            return info;
        }

        private string GetPersonaStatus(int status)
        {
            return status switch
            {
                0 => "offline",
                1 => "online",
                2 => "busy",
                3 => "away",
                4 => "snooze",
                5 => "looking to trade",
                6 => "looking to play",
                _ => "unknown"
            };
        }

        public async Task<bool> CheckPlayerExistsAsync(string username)
        {
            try
            {
                var steamId = await ResolveVanityUrlAsync(username);
                if (string.IsNullOrEmpty(steamId))
                {
                    steamId = await SearchByDirectMethodAsync(username);
                }
                return !string.IsNullOrEmpty(steamId);
            }
            catch
            {
                return false;
            }
        }

        public async Task<string> GetSteamId64Async(string username)
        {
            var steamId = await ResolveVanityUrlAsync(username);
            if (string.IsNullOrEmpty(steamId))
            {
                steamId = await SearchByDirectMethodAsync(username);
            }
            return steamId ?? "";
        }
    }
}
