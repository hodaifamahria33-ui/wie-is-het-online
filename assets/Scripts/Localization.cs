using System.Collections.Generic;
using TMPro;
using UnityEngine;

namespace WieIsHetOnline
{
    public static class Localization
    {
        public enum Lang { Nl, En }

        static Lang _current = Lang.Nl;
        static readonly List<(TextMeshProUGUI tmp, string key)> Labels = new();

        static readonly Dictionary<string, (string nl, string en)> Strings = new()
        {
            ["menuTitle"] = ("Kies hoe je\n<size=64><color=#8B5CF6>wilt spelen</color></size>",
                "Choose how you\n<size=64><color=#8B5CF6>want to play</color></size>"),
            ["btnHost"] = ("HOST GAME", "HOST GAME"),
            ["btnJoin"] = ("JOIN MET CODE", "JOIN WITH CODE"),
            ["btnBack"] = ("TERUG", "BACK"),
            ["hostTitle"] = ("Kies je\n<size=56><color=#8B5CF6>potcode</color></size>",
                "Choose your\n<size=56><color=#8B5CF6>game code</color></size>"),
            ["hostHint"] = ("Max 5 letters of cijfers", "Max 5 letters or numbers"),
            ["btnMakePot"] = ("MAAK POTJE", "CREATE GAME"),
            ["lobbyTitle"] = ("Je potje is\n<size=52><color=#8B5CF6>klaar!</color></size>",
                "Your game is\n<size=52><color=#8B5CF6>ready!</color></size>"),
            ["lobbyHint"] = ("Deel deze code met je vrienden", "Share this code with friends"),
            ["btnCopy"] = ("KOPIEER DE CODE", "COPY THE CODE"),
            ["btnCopyDone"] = ("✓ Gekopieerd!", "✓ Copied!"),
            ["btnStart"] = ("START GAME", "START GAME"),
            ["countdownLabel"] = ("Potje start over", "Game starts in"),
            ["countdownGo"] = ("START!", "GO!"),
            ["btnGiveUp"] = ("OPGEVEN", "GIVE UP"),
            ["joinTitle"] = ("Join een\n<size=56><color=#8B5CF6>potje</color></size>",
                "Join a\n<size=56><color=#8B5CF6>game</color></size>"),
            ["joinHint"] = ("Vul de code in", "Enter the game code"),
            ["btnJoinGame"] = ("JOIN GAME", "JOIN GAME"),
            ["joinedTitle"] = ("Je zit in\n<size=56><color=#8B5CF6>het potje!</color></size>",
                "You're in\n<size=56><color=#8B5CF6>the game!</color></size>"),
            ["joinedHint"] = ("Wacht tot de host het spel start", "Wait for the host to start"),
            ["errHost"] = ("Kies een code (max 5 tekens)", "Pick a code (max 5 characters)"),
            ["errJoin"] = ("Vul een potcode in", "Enter a game code"),
            ["langNl"] = ("Nederlands", "Nederlands"),
            ["langEn"] = ("English", "English"),
        };

        public static Lang Current => _current;

        public static string Get(string key)
        {
            if (!Strings.TryGetValue(key, out var pair))
                return key;
            return _current == Lang.En ? pair.en : pair.nl;
        }

        public static void SetLang(Lang lang)
        {
            _current = lang;
            Refresh();
        }

        public static void Register(TextMeshProUGUI tmp, string key)
        {
            if (tmp == null) return;
            Labels.Add((tmp, key));
            tmp.text = Get(key);
        }

        public static void Refresh()
        {
            foreach (var (tmp, key) in Labels)
            {
                if (tmp != null)
                    tmp.text = Get(key);
            }
        }
    }
}
