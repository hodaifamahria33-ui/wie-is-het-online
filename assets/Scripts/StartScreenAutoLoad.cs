using UnityEngine;

namespace WieIsHetOnline
{
    public static class StartScreenAutoLoad
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Load()
        {
            if (Object.FindObjectOfType<GameUI>() != null)
                return;

            var go = new GameObject("GameUI");
            go.AddComponent<GameUI>();
        }
    }
}
