using System;
using System.Collections;
using UnityEngine;

namespace WieIsHetOnline
{
    public class ScreenTransition : MonoBehaviour
    {
        const float Duration = 0.3f;

        bool isRunning;

        public void Play(GameObject from, GameObject to, Action onComplete = null)
        {
            if (isRunning) return;
            StartCoroutine(Run(from, to, onComplete));
        }

        IEnumerator Run(GameObject from, GameObject to, Action onComplete)
        {
            isRunning = true;

            var fromCg = EnsureGroup(from);
            var toCg = EnsureGroup(to);

            to.SetActive(true);
            toCg.alpha = 0f;
            to.transform.localScale = Vector3.one * 0.96f;
            from.transform.localScale = Vector3.one;

            var t = 0f;
            while (t < Duration)
            {
                t += Time.deltaTime;
                var p = Mathf.Clamp01(t / Duration);
                var ease = p * p * (3f - 2f * p);

                fromCg.alpha = 1f - ease;
                toCg.alpha = ease;
                from.transform.localScale = Vector3.one * (1f - 0.04f * ease);
                to.transform.localScale = Vector3.one * (0.96f + 0.04f * ease);

                yield return null;
            }

            fromCg.alpha = 0f;
            toCg.alpha = 1f;
            to.transform.localScale = Vector3.one;
            from.SetActive(false);
            from.transform.localScale = Vector3.one;
            fromCg.alpha = 1f;

            isRunning = false;
            onComplete?.Invoke();
        }

        static CanvasGroup EnsureGroup(GameObject go)
        {
            var cg = go.GetComponent<CanvasGroup>();
            if (cg == null) cg = go.AddComponent<CanvasGroup>();
            cg.alpha = 1f;
            return cg;
        }
    }
}
