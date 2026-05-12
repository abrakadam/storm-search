using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Text;
using StormSearch.Utils;

namespace StormSearch.Search.Minecraft
{
    public class MinecraftSearcher
    {
        private readonly HttpClient _httpClient;
        
        public MinecraftSearcher()
        {
            _httpClient = new HttpClient();
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "StormSearch/1.0");
        }

        public async Task<SearchResult?> SearchPlayerAsync(string username)
        {
            try
            {
                Colors.PrintLoading($"поиск игрока minecraft: {username}");
                Console.WriteLine();
                
                // получение uuid по имени
                var uuidResponse = await _httpClient.GetStringAsync($"https://api.mojang.com/users/profiles/minecraft/{username}");
                var uuidData = JsonSerializer.Deserialize<JsonElement>(uuidResponse);
                
                if (uuidData.ValueKind != JsonValueKind.Object)
                {
                    Colors.PrintError("игрок не найден");
                    return null;
                }

                var uuid = uuidData.GetProperty("id").GetString();
                var name = uuidData.GetProperty("name").GetString();

                var result = new SearchResult
                {
                    Platform = "minecraft",
                    Username = name ?? username,
                    Id = uuid ?? "",
                    Found = true
                };

                // парсинг свойств профиля
                var profileResponse = await _httpClient.GetStringAsync($"https://sessionserver.mojang.com/session/minecraft/profile/{uuid}");
                var profileData = JsonSerializer.Deserialize<JsonElement>(profileResponse);

                if (profileData.TryGetProperty("properties", out var properties) && properties.GetArrayLength() > 0)
                {
                    var property = properties[0];
                    if (property.TryGetProperty("value", out var value))
                    {
                        var decodedValue = Encoding.UTF8.GetString(Convert.FromBase64String(value.GetString() ?? ""));
                        var textureData = JsonSerializer.Deserialize<JsonElement>(decodedValue);
                        
                        if (textureData.TryGetProperty("textures", out var textures))
                        {
                            if (textures.TryGetProperty("SKIN", out var skin))
                            {
                                result.AdditionalInfo["skin_url"] = skin.GetProperty("url").GetString() ?? "";
                            }
                            
                            if (textures.TryGetProperty("CAPE", out var cape))
                            {
                                result.AdditionalInfo["cape_url"] = cape.GetProperty("url").GetString() ?? "";
                            }
                        }
                        
                        if (textureData.TryGetProperty("profileName", out var profileName))
                        {
                            result.AdditionalInfo["profile_name"] = textureData.GetProperty("profileName").GetString() ?? "";
                        }
                    }
                }

                // получение истории имен
                try
                {
                    var nameHistoryResponse = await _httpClient.GetStringAsync($"https://api.mojang.com/user/profiles/{uuid}/names");
                    var nameHistoryData = JsonSerializer.Deserialize<JsonElement>(nameHistoryResponse);
                    
                    var history = new List<string>();
                    foreach (var nameEntry in nameHistoryData.EnumerateArray())
                    {
                        history.Add(nameEntry.GetProperty("name").GetString() ?? "");
                    }
                    result.AdditionalInfo["name_history"] = string.Join(" -> ", history);
                }
                catch
                {
                    result.AdditionalInfo["name_history"] = "недоступно";
                }

                Colors.PrintSuccess("игрок minecraft найден!");
                return result;
            }
            catch (HttpRequestException ex)
            {
                Colors.PrintError($"ошибка сети: {ex.Message}");
                return null;
            }
            catch (Exception ex)
            {
                Colors.PrintError($"ошибка при поиске: {ex.Message}");
                return null;
            }
        }

        public async Task<bool> CheckPlayerExistsAsync(string username)
        {
            try
            {
                var response = await _httpClient.GetAsync($"https://api.mojang.com/users/profiles/minecraft/{username}");
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        public async Task<string> GetPlayerUUIDAsync(string username)
        {
            try
            {
                var response = await _httpClient.GetStringAsync($"https://api.mojang.com/users/profiles/minecraft/{username}");
                var data = JsonSerializer.Deserialize<JsonElement>(response);
                return data.GetProperty("id").GetString() ?? "";
            }
            catch
            {
                return "";
            }
        }
    }

    public class SearchResult
    {
        public string Platform { get; set; } = "";
        public string Username { get; set; } = "";
        public string Id { get; set; } = "";
        public bool Found { get; set; }
        public Dictionary<string, string> AdditionalInfo { get; set; } = new();
    }
}
