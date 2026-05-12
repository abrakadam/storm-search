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
    class Program
    {
        static async Task<int> Main(string[] args)
        {
            // проверяем вызов команды storms
            if (args.Length > 0 && args[0].ToLower() == "storms")
            {
                var stormsArgs = args.Skip(1).ToArray();
                return await Storms.RunStormsCommand(stormsArgs);
            }

            Colors.PrintBanner();

            // создаем опции командной строки
            var usernameOption = new Option<string>(
                name: "--username",
                description: "имя пользователя для поиска")
            {
                IsRequired = false
            }.FromAmong("username", "u");

            var platformOption = new Option<string>(
                name: "--platform",
                description: "платформа для поиска")
            {
                IsRequired = false
            }.FromAmong("minecraft", "steam", "xbox");

            var allOption = new Option<bool>(
                name: "--all",
                description: "поиск по всем платформам")
            {
                IsRequired = false
            };

            var interactiveOption = new Option<bool>(
                name: "--interactive",
                description: "интерактивный режим")
            {
                IsRequired = false
            };

            var rootCommand = new RootCommand("Storm Search - Утилита поиска никнеймов и информации")
            {
                usernameOption,
                platformOption,
                allOption,
                interactiveOption
            };

            rootCommand.SetHandler(async (username, platform, all, interactive) =>
            {
                if (interactive)
                {
                    await RunInteractiveMode();
                }
                else if (string.IsNullOrEmpty(username))
                {
                    Colors.PrintError("необходимо указать имя пользователя (--username)");
                    Console.WriteLine("\nиспользуйте: storms <username> для быстрого поиска");
                    return;
                }
                else if (all)
                {
                    await SearchAllPlatforms(username);
                }
                else if (string.IsNullOrEmpty(platform))
                {
                    Colors.PrintError("необходимо указать платформу (--platform) или использовать --all");
                    Console.WriteLine("\nиспользуйте: storms <username> для быстрого поиска по всем платформам");
                    return;
                }
                else
                {
                    await SearchPlatform(username, platform);
                }
            }, usernameOption, platformOption, allOption, interactiveOption);

            return await rootCommand.InvokeAsync(args);
        }
