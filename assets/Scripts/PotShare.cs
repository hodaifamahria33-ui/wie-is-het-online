using System;
using UnityEngine;

namespace WieIsHetOnline
{
    public static class PotShare
    {
        public static void CopyPotCode(string potCode)
        {
            if (string.IsNullOrWhiteSpace(potCode))
            {
                Debug.LogWarning("Geen potcode om te kopiëren.");
                return;
            }

            var code = potCode.Trim().ToUpperInvariant();
            GUIUtility.systemCopyBuffer = code;
            Debug.Log($"Potcode gekopieerd: {code}");
        }
    }
}
