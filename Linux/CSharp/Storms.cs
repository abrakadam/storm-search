using System;
using System.CommandLine;
using System.Threading.Tasks;
using System.Linq;
using StormSearch.Utils;
using StormSearch.Search.Minecraft;
using StormSearch.Search.Steam;
using StormSearch.Search.XBOX;

namespace StormSearch
{
    public class Storms
    {
        private static readonly string[] AvailablePlatforms = { "minecraft", "steam", "xbox", "all" };
        
        public static async Task<int> RunStormsCommand(string[] args)
        {
            // парсинг аргументов в стиле sherlock
            if (args.Length == 0)
            {
                ShowStormsHelp();
                return 1;
            }

            var username = args[0];
            var platforms = new List<string>();
            var verbose = false;
            var output = "";

            // парсинг флагов
            for (int i = 1; i < args.Length; i++)
            {
                var arg = args[i].ToLower();
                
                switch (arg)
                {
                    case "-v":
                    case "--verbose":
                        verbose = true;
                        break;
                    case "-o":
                    case "--output":
                        if (i + 1 < args.Length)
                        {
                            output = args[i + 1];
                            i++; // пропустить следующий аргумент
                        }
                        break;
                    case "-p":
                    case "--platform":
                        if (i + 1 < args.Length)
                        {
                            var platformArg = args[i + 1].ToLower();
                            if (platformArg == "all")
                            {
                                platforms.AddRange(AvailablePlatforms.Where(p => p != "all"));
                            }
                            else if (AvailablePlatforms.Contains(platformArg))
                            {
                                platforms.Add(platformArg);
                            }
                            else
                            {
                                Colors.PrintError($"неизвестная платформа: {platformArg}");
                                return 1;
                            }
                            i++; // пропустить следующий аргумент
                        }
                        break;
                    case "-h":
                    case "--help":
                        ShowStormsHelp();
                        return 0;
                    default:
                        if (arg.StartsWith("-"))
                        {
                            Colors.PrintError($"неизвестный флаг: {arg}");
                            return 1;
                        }
                        break;
                }
            }

            // если платформы не указаны, ищем по всем
            if (platforms.Count == 0)
            {
                platforms.AddRange(AvailablePlatforms.Where(p => p != "all"));
            }

            // вывод информации о поиске
            Console.WriteLine($"[*] storm search - поиск пользователя: {username}");
            if (verbose)
            {
                Console.WriteLine($"[*] платформы: {string.Join(", ", platforms)}");
                if (!string.IsNullOrEmpty(output))
                {
                    Console.WriteLine($"[*] вывод в файл: {output}");
                }
            }
            Console.WriteLine("═".PadRight(60, '═'));

            var results = new Dictionary<string, object>();

            // поиск по указанным платформам
            foreach (var platform in platforms)
            {
                try
                {
                    if (verbose)
                    {
                        Console.WriteLine($"[*] поиск в {platform}...");
                    }

                    object result = null;
                    
                    switch (platform)
                    {
                        case "minecraft":
                            result = await SearchMinecraftUser(username, verbose);
                            break;
                        case "steam":
                            result = await SearchSteamUser(username, verbose);
                            break;
                        case "xbox":
                            result = await SearchXboxUser(username, verbose);
                            break;
                    }

                    if (result != null)
                    {
                        results[platform] = result;
                    }

                    Console.WriteLine();
                    await Task.Delay(1000); // задержка между запросами
                }
                catch (Exception ex)
                {
                    Colors.PrintError($"ошибка при поиске в {platform}: {ex.Message}");
                }
            }

            // вывод результатов
            PrintStormsResults(username, results, verbose);

            // сохранение в файл если указано
            if (!string.IsNullOrEmpty(output))
            {
                await SaveResultsToFile(results, output, verbose);
            }

            return 0;
        }

        private static async Task<object> SearchMinecraftUser(string username, bool verbose)
        {
            try
            {
                var searcher = new MinecraftSearcher();
                var result = await searcher.SearchPlayerAsync(username);
                
                if (verbose && result != null)
                {
                    Console.WriteLine($"[+] minecraft: найден - {result.Username}");
                }
                
                return result;
            }
            catch (Exception ex)
            {
                if (verbose)
                {
                    Colors.PrintError($"minecraft ошибка: {ex.Message}");
                }
                return null;
            }
        }

        private static async Task<object> SearchSteamUser(string username, bool verbose)
        {
            try
            {
                var searcher = new SteamSearcher();
                var result = await searcher.SearchPlayerAsync(username);
                
                if (verbose && result != null)
                {
                    Console.WriteLine($"[+] steam: найден - {result.Username}");
                }
                
                return result;
            }
            catch (Exception ex)
            {
                if (verbose)
                {
                    Colors.PrintError($"steam ошибка: {ex.Message}");
                }
                return null;
            }
        }

        private static async Task<object> SearchXboxUser(string username, bool verbose)
        {
            try
            {
                var searcher = new XboxSearcher();
                var result = await searcher.SearchPlayerAsync(username);
                
                if (verbose && result != null)
                {
                    Console.WriteLine($"[+] xbox: найден - {result.Username}");
                }
                
                return result;
            }
            catch (Exception ex)
            {
                if (verbose)
                {
                    Colors.PrintError($"xbox ошибка: {ex.Message}");
                }
                return null;
            }
        }

        private static void PrintStormsResults(string username, Dictionary<string, object> results, bool verbose)
        {
            Console.WriteLine("═".PadRight(60, '═'));
            Console.WriteLine($"[*] результаты поиска для: {username}");
            Console.WriteLine("═".PadRight(60, '═'));
            Console.WriteLine();

            if (results.Count == 0)
            {
                Colors.PrintError("пользователь не найден ни на одной платформе");
                return;
            }

            var foundCount = 0;
            foreach (var kvp in results)
            {
                var platform = kvp.Key;
                var result = kvp.Value;

                if (result is SearchResult searchResult && searchResult.Found)
                {
                    foundCount++;
                    Colors.PrintSuccess($"{platform}: найден");
                    
                    Console.WriteLine($"   пользователь: {searchResult.Username}");
                    if (!string.IsNullOrEmpty(searchResult.Id))
                    {
                        Console.WriteLine($"   id: {searchResult.Id}");
                    }
                    
                    if (searchResult.AdditionalInfo.Count > 0)
                    {
                        Console.WriteLine("   дополнительная информация:");
                        foreach (var info in searchResult.AdditionalInfo.Take(3)) // показываем первые 3 поля
                        {
                            Console.WriteLine($"     {info.Key}: {info.Value}");
                        }
                        if (searchResult.AdditionalInfo.Count > 3)
                        {
                            Console.WriteLine($"     ... и еще {searchResult.AdditionalInfo.Count - 3} полей");
                        }
                    }
                }
                else
                {
                    Colors.PrintWarning($"{platform}: не найден");
                }
                Console.WriteLine();
            }

            Console.WriteLine("═".PadRight(60, '═'));
            Console.WriteLine($"[*] статистика: найдено на {foundCount} из {results.Count} платформ");
            
            if (verbose)
            {
                Console.WriteLine($"[*] выполнено за: {DateTime.Now:HH:mm:ss}");
            }
        }

        private static async Task SaveResultsToFile(Dictionary<string, object> results, string filename, bool verbose)
        {
            try
            {
                var json = System.Text.Json.JsonSerializer.Serialize(results, new System.Text.Json.JsonSerializerOptions 
                { 
                    WriteIndented = true 
                });
                
                await File.WriteAllTextAsync(filename, json);
                
                if (verbose)
                {
                    Colors.PrintSuccess($"результаты сохранены в: {filename}");
                }
            }
            catch (Exception ex)
            {
                Colors.PrintError($"ошибка сохранения файла: {ex.Message}");
            }
        }

        private static void ShowStormsHelp()
        {
            Console.WriteLine();
            Colors.PrintInfo("storm search - утилита поиска никнеймов (стиль sherlock)");
            Console.WriteLine();
            Console.WriteLine("использование:");
            Console.WriteLine("  storms <username> [опции]");
            Console.WriteLine();
            Console.WriteLine("опции:");
            Console.WriteLine("  -p, --platform <платформа>  указать платформу (minecraft, steam, xbox, all)");
            Console.WriteLine("  -v, --verbose             подробный вывод");
            Console.WriteLine("  -o, --output <файл>      сохранить результаты в файл");
            Console.WriteLine("  -h, --help                 показать эту справку");
            Console.WriteLine();
            Console.WriteLine("платформы:");
            Console.WriteLine("  minecraft    - поиск игроков minecraft");
            Console.WriteLine("  steam        - поиск профилей steam");
            Console.WriteLine("  xbox         - поиск профилей xbox");
            Console.WriteLine("  all          - поиск по всем платформам (по умолчанию)");
            Console.WriteLine();
            Console.WriteLine("примеры:");
            Console.WriteLine("  storms abrakadam");
            Console.WriteLine("  storms player123 -p minecraft");
            Console.WriteLine("  storms username -v -o results.json");
            Console.WriteLine("  storms gamer -p steam,minecraft -v");
            Console.WriteLine();
            Console.WriteLine("примечание: без указания платформ поиск выполняется по всем доступным платформам");
        }
    }
}
