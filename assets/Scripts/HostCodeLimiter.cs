using TMPro;
using UnityEngine;

namespace WieIsHetOnline
{
    [RequireComponent(typeof(TMP_InputField))]
    public class HostCodeLimiter : MonoBehaviour
    {
        TMP_InputField input;

        void Awake()
        {
            input = GetComponent<TMP_InputField>();
            input.characterLimit = 5;
            input.contentType = TMP_InputField.ContentType.Alphanumeric;
            input.onValueChanged.AddListener(Filter);
        }

        void Filter(string value)
        {
            if (input == null) return;

            var filtered = "";
            foreach (var c in value.ToUpperInvariant())
            {
                if (char.IsLetterOrDigit(c))
                    filtered += c;
            }

            if (filtered.Length > 5)
                filtered = filtered.Substring(0, 5);

            if (filtered != value)
            {
                input.SetTextWithoutNotify(filtered);
                input.caretPosition = filtered.Length;
            }
        }
    }
}
