using UnityEngine;

namespace WieIsHetOnline
{
    public static class StartScreenArt
    {
        static Sprite background;

        public static Sprite Background
        {
            get
            {
                if (background != null)
                    return background;

                var tex = Resources.Load<Texture2D>("og-image");
                if (tex == null)
                    return null;

                background = Sprite.Create(
                    tex,
                    new Rect(0, 0, tex.width, tex.height),
                    new Vector2(0.5f, 0.5f),
                    100f);
                return background;
            }
        }
    }
}
