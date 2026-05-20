using UnityEngine;

namespace WieIsHetOnline
{
    public class FloatingCardBackground : MonoBehaviour
    {
        [System.Serializable]
        public struct CardMotion
        {
            public RectTransform rect;
            public Vector2 drift;
            public float bobSpeed;
            public float bobAmount;
            public float rotateSpeed;
        }

        CardMotion[] cards = System.Array.Empty<CardMotion>();
        Vector2[] startPositions = System.Array.Empty<Vector2>();

        public void SetCards(CardMotion[] motion)
        {
            cards = motion ?? System.Array.Empty<CardMotion>();
            startPositions = new Vector2[cards.Length];
            for (var i = 0; i < cards.Length; i++)
                if (cards[i].rect != null)
                    startPositions[i] = cards[i].rect.anchoredPosition;
        }

        void Update()
        {
            if (cards == null || cards.Length == 0) return;

            var t = Time.time;
            for (var i = 0; i < cards.Length; i++)
            {
                var c = cards[i];
                if (c.rect == null) continue;

                var bob = Mathf.Sin(t * c.bobSpeed + i) * c.bobAmount;
                c.rect.anchoredPosition = startPositions[i] + c.drift * t + new Vector2(0f, bob);
                c.rect.localRotation = Quaternion.Euler(0f, 0f, Mathf.Sin(t * c.rotateSpeed + i * 0.7f) * 6f);
            }
        }
    }
}
