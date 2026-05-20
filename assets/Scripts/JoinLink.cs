using System;
using UnityEngine;

namespace WieIsHetOnline
{
    public static class JoinLink
    {
        /// <summary>
        /// Zet dit op je live game-URL (WebGL), bv. https://jouwsite.nl/wie-is-het/index.html
        /// Leeg = op WebGL wordt de huidige pagina-URL gebruikt.
        /// </summary>
        public static string ShareBaseUrl = "";

        public static string BuildJoinUrl(string potCode)
        {
            var code = potCode?.Trim().ToUpperInvariant() ?? "";
            var baseUrl = GetBaseUrl();
            var separator = baseUrl.Contains("?") ? "&" : "?";
            return baseUrl + separator + "join=" + Uri.EscapeDataString(code);
        }

        public static string BuildWhatsAppMessage(string potCode)
        {
            return BuildJoinUrl(potCode);
        }

        public static string TryParseJoinCode(string url)
        {
            if (string.IsNullOrEmpty(url)) return null;

            var queryStart = url.IndexOf('?');
            if (queryStart < 0 || queryStart >= url.Length - 1)
                return null;

            var query = url.Substring(queryStart + 1);
            foreach (var part in query.Split('&'))
            {
                var eq = part.IndexOf('=');
                if (eq <= 0) continue;

                var key = part.Substring(0, eq);
                var value = part.Substring(eq + 1);

                if (key == "join" || key == "code")
                {
                    var code = Uri.UnescapeDataString(value).Trim().ToUpperInvariant();
                    if (code.Length > 0 && code.Length <= 5)
                        return code;
                }
            }

            return null;
        }

        public static string TryGetJoinCodeFromCurrentUrl()
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            return TryParseJoinCode(Application.absoluteURL);
#else
            return TryParseJoinCode(Application.absoluteURL);
#endif
        }

        static string GetBaseUrl()
        {
            if (!string.IsNullOrWhiteSpace(ShareBaseUrl))
                return ShareBaseUrl.TrimEnd('/');

#if UNITY_WEBGL && !UNITY_EDITOR
            var abs = Application.absoluteURL;
            if (!string.IsNullOrEmpty(abs))
            {
                var q = abs.IndexOf('?');
                return q > 0 ? abs.Substring(0, q) : abs;
            }
#endif
            return "https://wieishetonline.nl/play";
        }
    }
}
