using UnityEngine;

namespace WieIsHetOnline
{
    public static class CardArt
    {
        static Sprite card;
        static Sprite face;

        public static Sprite Card => card ??= CreateCard();
        public static Sprite Face => face ??= CreateFace();

        static Sprite CreateCard()
        {
            const int w = 64, h = 88;
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
            for (var y = 0; y < h; y++)
            for (var x = 0; x < w; x++)
            {
                var border = x < 3 || x >= w - 3 || y < 3 || y >= h - 3;
                tex.SetPixel(x, y, new Color(0.92f, 0.9f, 0.98f, border ? 0.5f : 0.95f));
            }
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), 100f);
        }

        static Sprite CreateFace()
        {
            const int s = 64;
            var tex = new Texture2D(s, s, TextureFormat.RGBA32, false);
            for (var y = 0; y < s; y++)
            for (var x = 0; x < s; x++)
                tex.SetPixel(x, y, Color.clear);

            FillCircle(tex, s / 2, s / 2 - 2, 26, new Color(0.55f, 0.62f, 0.85f, 1f));
            FillCircle(tex, s / 2 - 10, s / 2 + 4, 5, new Color(0.2f, 0.15f, 0.3f, 0.8f));
            FillCircle(tex, s / 2 + 10, s / 2 + 4, 5, new Color(0.2f, 0.15f, 0.3f, 0.8f));
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.5f), 100f);
        }

        static void FillCircle(Texture2D tex, int cx, int cy, int radius, Color color)
        {
            for (var y = -radius; y <= radius; y++)
            for (var x = -radius; x <= radius; x++)
            {
                if (x * x + y * y > radius * radius) continue;
                var px = cx + x;
                var py = cy + y;
                if (px < 0 || py < 0 || px >= tex.width || py >= tex.height) continue;
                tex.SetPixel(px, py, color);
            }
        }
    }
}
