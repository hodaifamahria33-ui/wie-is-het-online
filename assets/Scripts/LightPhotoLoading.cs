using System;
using System.Collections;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace WieIsHetOnline
{
    public class LightPhotoLoading : MonoBehaviour
    {
        const float Duration = 1.2f;

        GameObject overlay;
        FloatingCardBackground floater;
        bool isRunning;

        public void Build(Transform canvas)
        {
            overlay = new GameObject("PhotoLoading", typeof(RectTransform), typeof(CanvasGroup));
            overlay.transform.SetParent(canvas, false);
            Stretch(overlay.GetComponent<RectTransform>());

            var top = new Color(0.91f, 0.96f, 1f, 1f);
            var bottom = new Color(0.98f, 0.94f, 1f, 1f);
            var bg = CreateImage(overlay.transform, Color.white);
            Stretch(bg.rectTransform);
            bg.sprite = CreateGradient(top, bottom);

            var decor = new GameObject("Photos", typeof(RectTransform));
            decor.transform.SetParent(overlay.transform, false);
            Stretch(decor.GetComponent<RectTransform>());

            var slots = new (Vector2 pos, Vector2 size, float rot)[]
            {
                (new(-280, 120), new(140, 175), -10f),
                (new(300, 90), new(130, 165), 12f),
                (new(-240, -130), new(125, 158), 7f),
                (new(260, -150), new(135, 168), -8f),
                (new(0, 200), new(115, 148), 4f),
                (new(40, -220), new(120, 152), -5f),
            };

            var motions = new FloatingCardBackground.CardMotion[slots.Length];
            for (var i = 0; i < slots.Length; i++)
            {
                var s = slots[i];
                motions[i] = new FloatingCardBackground.CardMotion
                {
                    rect = CreatePolaroid(decor.transform, s.pos, s.size, s.rot),
                    drift = new Vector2(i % 2 == 0 ? 5f : -4f, i % 3 == 0 ? 3f : -2f),
                    bobSpeed = 0.5f + i * 0.1f,
                    bobAmount = 18f + i * 3f,
                    rotateSpeed = 0.35f + i * 0.06f
                };
            }

            floater = decor.AddComponent<FloatingCardBackground>();
            floater.SetCards(motions);

            var center = new GameObject("Center", typeof(RectTransform));
            center.transform.SetParent(overlay.transform, false);
            var crt = center.GetComponent<RectTransform>();
            crt.anchorMin = crt.anchorMax = new Vector2(0.5f, 0.5f);
            crt.sizeDelta = new Vector2(700, 200);
            crt.anchoredPosition = Vector2.zero;

            var title = CreateText(center.transform, "Potje wordt gemaakt…", 48, new Vector2(0, 20), new Color(0.24f, 0.18f, 0.36f, 1f));
            var sub = CreateText(center.transform, "Foto's worden geladen", 30, new Vector2(0, -40), new Color(0.55f, 0.36f, 0.96f, 0.85f));

            overlay.SetActive(false);
            overlay.transform.SetAsLastSibling();
        }

        public void Play(Action onComplete)
        {
            if (isRunning) return;
            StartCoroutine(Run(onComplete));
        }

        IEnumerator Run(Action onComplete)
        {
            isRunning = true;
            overlay.SetActive(true);
            var cg = overlay.GetComponent<CanvasGroup>();
            if (cg == null) cg = overlay.AddComponent<CanvasGroup>();
            cg.alpha = 0f;

            var t = 0f;
            while (t < Duration)
            {
                t += Time.deltaTime;
                var p = Mathf.Clamp01(t / Duration);
                cg.alpha = Mathf.Min(p * 3f, 1f);
                yield return null;
            }

            cg.alpha = 1f;
            yield return new WaitForSeconds(0.1f);

            overlay.SetActive(false);
            isRunning = false;
            onComplete?.Invoke();
        }

        static RectTransform CreatePolaroid(Transform parent, Vector2 pos, Vector2 size, float rot)
        {
            var go = new GameObject("Photo", typeof(RectTransform), typeof(CanvasGroup), typeof(Image));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = size;
            rt.anchoredPosition = pos;
            rt.localRotation = Quaternion.Euler(0f, 0f, rot);

            go.GetComponent<CanvasGroup>().alpha = 0.9f;
            var img = go.GetComponent<Image>();
            img.sprite = CardArt.Card;
            img.color = Color.white;
            img.raycastTarget = false;

            var face = new GameObject("Face", typeof(RectTransform), typeof(Image));
            face.transform.SetParent(go.transform, false);
            var fr = face.GetComponent<RectTransform>();
            fr.anchorMin = new Vector2(0.12f, 0.18f);
            fr.anchorMax = new Vector2(0.88f, 0.9f);
            fr.offsetMin = fr.offsetMax = Vector2.zero;
            var fi = face.GetComponent<Image>();
            fi.sprite = CardArt.Face;
            fi.preserveAspect = true;
            fi.color = new Color(0.55f, 0.45f, 0.9f, 0.6f);
            fi.raycastTarget = false;

            return rt;
        }

        static TextMeshProUGUI CreateText(Transform parent, string text, int size, Vector2 pos, Color color)
        {
            var go = new GameObject("Text", typeof(RectTransform), typeof(TextMeshProUGUI));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = new Vector2(650, 80);
            rt.anchoredPosition = pos;
            var tmp = go.GetComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = size;
            tmp.fontStyle = FontStyles.Bold;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = color;
            return tmp;
        }

        static Image CreateImage(Transform parent, Color color)
        {
            var go = new GameObject("Img", typeof(RectTransform), typeof(Image));
            go.transform.SetParent(parent, false);
            var img = go.GetComponent<Image>();
            img.color = color;
            img.raycastTarget = true;
            return img;
        }

        static void Stretch(RectTransform rt)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = rt.offsetMax = Vector2.zero;
        }

        static Sprite CreateGradient(Color top, Color bottom)
        {
            const int h = 256;
            var tex = new Texture2D(2, h, TextureFormat.RGBA32, false);
            for (var y = 0; y < h; y++)
            {
                var c = Color.Lerp(bottom, top, y / (float)(h - 1));
                tex.SetPixel(0, y, c);
                tex.SetPixel(1, y, c);
            }
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, 2, h), new Vector2(0.5f, 0.5f), 100f);
        }
    }
}
