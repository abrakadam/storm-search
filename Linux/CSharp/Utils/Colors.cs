using System;
using Colorful.Console;
using System.Drawing;

namespace StormSearch.Utils
{
    public class Colors
    {
        public static void PrintBanner()
        {
            Console.Clear();
            Console.WriteLine();
            Console.WriteLineStyled("╔══════════════════════════════════════════════════════════════╗", Color.Cyan);
            Console.WriteLineStyled("║                                                              ║", Color.Cyan);
            Console.WriteLineStyled("║                    STORM SEARCH                               ║", Color.Cyan);
            Console.WriteLineStyled("║                                                              ║", Color.Cyan);
            Console.WriteLineStyled("║         Утилита поиска никнеймов и информации                ║", Color.White);
            Console.WriteLineStyled("║                                                              ║", Color.White);
            Console.WriteLineStyled("║   Поддерживаемые платформы:                                  ║", Color.Gray);
            Console.WriteLineStyled("║   • Minecraft     • Steam        • XBOX                     ║", Color.Green);
            Console.WriteLineStyled("║                                                              ║", Color.Gray);
            Console.WriteLineStyled("╚══════════════════════════════════════════════════════════════╝", Color.Cyan);
            Console.WriteLine();
        }

        public static void PrintSuccess(string message)
        {
            Console.WriteLineStyled($"[+] {message}", Color.Green);
        }

        public static void PrintError(string message)
        {
            Console.WriteLineStyled($"[-] {message}", Color.Red);
        }

        public static void PrintWarning(string message)
        {
            Console.WriteLineStyled($"[!] {message}", Color.Yellow);
        }

        public static void PrintInfo(string message)
        {
            Console.WriteLineStyled($"[*] {message}", Color.Cyan);
        }

        public static void PrintPlatform(string platform, string username)
        {
            Console.WriteLineStyled($"\n[*] Поиск в {platform}: {username}", Color.Magenta);
            Console.WriteLineStyled(new string('─', 50), Color.DarkGray);
        }

        public static void PrintResult(string key, string value)
        {
            Console.WriteLineStyled($"   {key}:", Color.White);
            Console.WriteLineStyled($"   {value}", Color.Gray);
            Console.WriteLine();
        }

        public static void PrintSeparator()
        {
            Console.WriteLineStyled(new string('═', 60), Color.DarkGray);
        }

        public static void PrintLoading(string message)
        {
            Console.WriteStyled($"[*] {message}", Color.Yellow);
        }
    }
}
