using System.Collections;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace WieIsHetOnline
{
    public class GameUI : MonoBehaviour
    {
        static readonly Color DarkBgTop = new(0.11f, 0.06f, 0.21f, 1f);
        static readonly Color DarkBgBottom = new(0.07f, 0.09f, 0.19f, 1f);
        static readonly Color AccentBlue = new(0.49f, 0.78f, 0.91f, 1f);
        static readonly Color ButtonYellow = new(1f, 0.92f, 0.16f, 1f);
        static readonly Color TextDark = new(0.12f, 0.08f, 0.2f, 1f);

        static readonly Color LightBgTop = new(0.91f, 0.96f, 1f, 1f);
        static readonly Color LightBgBottom = new(0.96f, 0.93f, 1f, 1f);
        static readonly Color LightText = new(0.24f, 0.18f, 0.36f, 1f);
        static readonly Color LightAccent = new(0.55f, 0.36f, 0.96f, 1f);
        static readonly Color LightHostBtn = new(0.91f, 0.47f, 0.39f, 1f);
        static readonly Color LightJoinBtn = Color.white;
        static readonly Color MenuBgTop = new(0.05f, 0.08f, 0.27f, 1f);
        static readonly Color MenuBgBottom = new(0.06f, 0.46f, 0.43f, 1f);
        static readonly Color MenuTitleColor = Color.white;
        static readonly Color MenuHostBtn = new(0.02f, 0.71f, 0.83f, 1f);

        GameObject startPanel;
        GameObject menuPanel;
        GameObject hostPanel;
        GameObject hostLobbyPanel;
        GameObject joinPanel;
        GameObject joinSuccessPanel;
        GameObject gamePanel;
        GameObject gameCountdownRoot;
        GameObject gameTableRoot;
        TextMeshProUGUI countdownLabel;
        TextMeshProUGUI countdownNumber;
        Coroutine gameCountdownRoutine;
        ScreenTransition transition;
        LightPhotoLoading photoLoading;

        TMP_InputField hostCodeInput;
        TMP_InputField joinCodeInput;
        TextMeshProUGUI hostErrorLabel;
        TextMeshProUGUI joinErrorLabel;
        TextMeshProUGUI hostLobbyCodeLabel;
        TextMeshProUGUI joinSuccessCodeLabel;
        TextMeshProUGUI copyBtnLabel;
        Image copyBtnImage;
        Coroutine copyFeedbackRoutine;
        static readonly Color CopyBtnNormal = new(0.49f, 0.36f, 0.88f, 1f);
        static readonly Color CopyBtnSuccess = new(0.2f, 0.78f, 0.45f, 1f);
        string currentPotCode = "";
        string currentJoinCode = "";

        void Awake()
        {
            Build();

            var linkCode = JoinLink.TryGetJoinCodeFromCurrentUrl();
            if (!string.IsNullOrEmpty(linkCode))
                JoinViaLink(linkCode);
            else
                ShowStart();
        }

        void Build()
        {
            foreach (Transform child in transform)
                Destroy(child.gameObject);

            EnsureEventSystem();

            var canvasGo = new GameObject("Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            canvasGo.transform.SetParent(transform, false);

            var canvas = canvasGo.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;

            var scaler = canvasGo.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;

            var screensRoot = new GameObject("Screens", typeof(RectTransform));
            screensRoot.transform.SetParent(canvasGo.transform, false);
            Stretch(screensRoot.GetComponent<RectTransform>());

            startPanel = BuildStartPanel(screensRoot.transform);
            menuPanel = BuildMenuPanel(screensRoot.transform);
            hostPanel = BuildHostPanel(screensRoot.transform);
            hostLobbyPanel = BuildHostLobbyPanel(screensRoot.transform);
            joinPanel = BuildJoinPanel(screensRoot.transform);
            joinSuccessPanel = BuildJoinSuccessPanel(screensRoot.transform);
            gamePanel = BuildGamePanel(screensRoot.transform);

            transition = gameObject.AddComponent<ScreenTransition>();
            photoLoading = gameObject.AddComponent<LightPhotoLoading>();
            photoLoading.Build(canvasGo.transform);

            BuildLangPicker(canvasGo.transform);
        }

        void HideAllPanels()
        {
            startPanel.SetActive(false);
            menuPanel.SetActive(false);
            hostPanel.SetActive(false);
            hostLobbyPanel.SetActive(false);
            joinPanel.SetActive(false);
            joinSuccessPanel.SetActive(false);
            gamePanel.SetActive(false);
        }

        void ShowStart()
        {
            HideAllPanels();
            startPanel.SetActive(true);
        }

        void GoToMenu() => transition.Play(startPanel, menuPanel);

        void GoToStart() => transition.Play(menuPanel, startPanel);

        void GoToHost() => transition.Play(menuPanel, hostPanel);

        void GoToMenuFromHost()
        {
            if (gamePanel.activeSelf)
                transition.Play(gamePanel, menuPanel);
            else if (hostLobbyPanel.activeSelf)
                transition.Play(hostLobbyPanel, menuPanel);
            else
                transition.Play(hostPanel, menuPanel);
        }

        void OnCopyPotCode()
        {
            if (string.IsNullOrEmpty(currentPotCode))
                return;
            PotShare.CopyPotCode(currentPotCode);
            if (copyFeedbackRoutine != null)
                StopCoroutine(copyFeedbackRoutine);
            copyFeedbackRoutine = StartCoroutine(CopyFeedbackRoutine());
        }

        IEnumerator CopyFeedbackRoutine()
        {
            if (copyBtnLabel != null)
                copyBtnLabel.text = Localization.Get("btnCopyDone");
            if (copyBtnImage != null)
                copyBtnImage.color = CopyBtnSuccess;

            if (hostLobbyCodeLabel != null)
            {
                var rt = hostLobbyCodeLabel.rectTransform;
                var t = 0f;
                const float dur = 0.45f;
                var startScale = rt.localScale;
                while (t < dur)
                {
                    t += Time.deltaTime;
                    var s = 1f + Mathf.Sin(t / dur * Mathf.PI) * 0.12f;
                    rt.localScale = startScale * s;
                    hostLobbyCodeLabel.color = Color.Lerp(LightAccent, CopyBtnSuccess, Mathf.Sin(t / dur * Mathf.PI));
                    yield return null;
                }
                rt.localScale = startScale;
                hostLobbyCodeLabel.color = LightAccent;
            }

            yield return new WaitForSeconds(1.6f);

            if (copyBtnLabel != null)
                copyBtnLabel.text = Localization.Get("btnCopy");
            if (copyBtnImage != null)
                copyBtnImage.color = CopyBtnNormal;
            copyFeedbackRoutine = null;
        }

        void OnStartGame()
        {
            if (string.IsNullOrEmpty(currentPotCode))
            {
                Debug.LogWarning("Geen potcode — maak eerst een potje.");
                return;
            }
            transition.Play(hostLobbyPanel, gamePanel, () => BeginGameCountdown());
        }

        void GoBackFromGame()
        {
            if (gameCountdownRoutine != null)
            {
                StopCoroutine(gameCountdownRoutine);
                gameCountdownRoutine = null;
            }
            if (gameCountdownRoot != null) gameCountdownRoot.SetActive(false);
            if (gameTableRoot != null) gameTableRoot.SetActive(false);
            transition.Play(gamePanel, hostLobbyPanel);
        }

        void BeginGameCountdown()
        {
            if (gameCountdownRoutine != null)
                StopCoroutine(gameCountdownRoutine);
            if (gameCountdownRoot != null) gameCountdownRoot.SetActive(true);
            if (gameTableRoot != null) gameTableRoot.SetActive(false);
            gameCountdownRoutine = StartCoroutine(GameCountdownRoutine());
        }

        IEnumerator GameCountdownRoutine()
        {
            for (var n = 5; n >= 0; n--)
            {
                if (countdownNumber != null)
                    countdownNumber.text = n > 0 ? n.ToString() : Localization.Get("countdownGo");
                yield return new WaitForSeconds(1f);
            }
            if (gameCountdownRoot != null) gameCountdownRoot.SetActive(false);
            if (gameTableRoot != null) gameTableRoot.SetActive(true);
            gameCountdownRoutine = null;
        }

        void GoToJoin() => transition.Play(menuPanel, joinPanel);

        void GoToMenuFromJoin()
        {
            if (joinSuccessPanel.activeSelf)
                transition.Play(joinSuccessPanel, menuPanel);
            else
                transition.Play(joinPanel, menuPanel);
        }

        void JoinViaLink(string code)
        {
            currentJoinCode = code.Trim().ToUpperInvariant();
            if (joinCodeInput != null)
                joinCodeInput.SetTextWithoutNotify(currentJoinCode);

            HideAllPanels();
            RunJoinLoading();
        }

        void OnJoinGame()
        {
            var code = joinCodeInput != null ? joinCodeInput.text.Trim().ToUpperInvariant() : "";
            if (code.Length < 1)
            {
                if (joinErrorLabel != null)
                    joinErrorLabel.text = Localization.Get("errJoin");
                return;
            }

            if (joinErrorLabel != null)
                joinErrorLabel.text = "";

            currentJoinCode = code;
            HideAllPanels();
            RunJoinLoading();
        }

        void RunJoinLoading()
        {
            photoLoading.Play(() =>
            {
                if (joinSuccessCodeLabel != null)
                    joinSuccessCodeLabel.text = currentJoinCode;
                joinSuccessPanel.SetActive(true);
                Debug.Log("Speler joined potje: " + currentJoinCode);
            });
        }

        void OnMakePot()
        {
            var code = hostCodeInput != null ? hostCodeInput.text.Trim().ToUpperInvariant() : "";
            if (code.Length < 1)
            {
                if (hostErrorLabel != null)
                    hostErrorLabel.text = Localization.Get("errHost");
                return;
            }

            if (hostErrorLabel != null)
                hostErrorLabel.text = "";

            currentPotCode = code;
            photoLoading.Play(() =>
            {
                if (hostLobbyCodeLabel != null)
                    hostLobbyCodeLabel.text = currentPotCode;
                transition.Play(hostPanel, hostLobbyPanel);
            });
        }

        GameObject BuildStartPanel(Transform parent)
        {
            var panel = CreatePanel(parent, "StartPanel");
            BuildStartPhotoBackground(panel.transform);
            var beginBtn = CreateButton(panel.transform, "LET'S BEGIN", new Vector2(640, 130), Vector2.zero,
                ButtonYellow, TextDark, 48, GoToMenu);
            var beginRt = beginBtn.GetComponent<RectTransform>();
            beginRt.anchorMin = beginRt.anchorMax = new Vector2(0.5f, 0f);
            beginRt.anchoredPosition = new Vector2(0, 118);
            BuildStartTagline(panel.transform);
            return panel;
        }

        static void BuildStartTagline(Transform parent)
        {
            var go = new GameObject("Tagline", typeof(RectTransform), typeof(TextMeshProUGUI));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 0f);
            rt.sizeDelta = new Vector2(1000, 50);
            rt.anchoredPosition = new Vector2(0, 42);

            var tmp = go.GetComponent<TextMeshProUGUI>();
            tmp.text = "Raad het personage · Speel met vrienden online";
            tmp.fontSize = 28;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = new Color(AccentBlue.r, AccentBlue.g, AccentBlue.b, 0.9f);
        }

        static void BuildStartPhotoBackground(Transform parent)
        {
            var photo = CreateImage(parent, "StartPhoto", Color.white, false);
            var photoRt = photo.rectTransform;
            photoRt.anchorMin = Vector2.zero;
            photoRt.anchorMax = Vector2.one;
            photoRt.offsetMin = new Vector2(0, 50);
            photoRt.offsetMax = new Vector2(0, 220);
            var sprite = StartScreenArt.Background;
            if (sprite != null)
            {
                photo.sprite = sprite;
                photo.preserveAspect = false;
            }
            else
            {
                photo.sprite = CreateGradientSprite(DarkBgTop, DarkBgBottom);
            }

            var shade = CreateImage(parent, "StartShade", Color.white, false);
            Stretch(shade.rectTransform);
            shade.sprite = CreateGradientSprite(
                new Color(0.1f, 0.06f, 0.18f, 0.1f),
                new Color(0.05f, 0.03f, 0.12f, 0.88f));
        }

        GameObject BuildMenuPanel(Transform parent)
        {
            var panel = CreatePanel(parent, "MenuPanel");
            BuildBackground(panel.transform, MenuBgTop, MenuBgBottom, new Color(0.22f, 0.74f, 0.97f, 1f), 0.35f);
            BuildMenuDecor(panel.transform);
            BuildTitleKey(panel.transform, "menuTitle", 80, MenuTitleColor);

            RegisterButtonLabel(CreateButton(panel.transform, Localization.Get("btnHost"), new Vector2(560, 110), new Vector2(0, 40),
                MenuHostBtn, Color.white, 40, GoToHost), "btnHost");
            RegisterButtonLabel(CreateButton(panel.transform, Localization.Get("btnJoin"), new Vector2(560, 100), new Vector2(0, -100),
                LightJoinBtn, LightText, 34, GoToJoin), "btnJoin");
            RegisterButtonLabel(CreateButton(panel.transform, Localization.Get("btnBack"), new Vector2(280, 72), new Vector2(0, -280),
                new Color(0.88f, 0.84f, 0.98f, 1f), LightAccent, 28, GoToStart), "btnBack");

            return panel;
        }

        GameObject BuildHostPanel(Transform parent)
        {
            var panel = CreatePanel(parent, "HostPanel");
            panel.SetActive(false);
            BuildBackground(panel.transform, LightBgTop, LightBgBottom, LightAccent, 0.12f);
            BuildMenuDecor(panel.transform);

            BuildTitleKey(panel.transform, "hostTitle", 100, LightText);

            Localization.Register(CreateLabel(panel.transform, Localization.Get("hostHint"), 28, new Vector2(0, 20),
                new Color(LightText.r, LightText.g, LightText.b, 0.65f)), "hostHint");

            hostCodeInput = CreateCodeInput(panel.transform, new Vector2(420, 90), new Vector2(0, -60));
            hostErrorLabel = CreateLabel(panel.transform, "", 26, new Vector2(0, -130),
                new Color(0.9f, 0.35f, 0.4f, 1f));

            RegisterButtonLabel(CreateButton(panel.transform, Localization.Get("btnMakePot"), new Vector2(520, 110), new Vector2(0, -220),
                LightHostBtn, Color.white, 40, OnMakePot), "btnMakePot");
            RegisterButtonLabel(CreateButton(panel.transform, Localization.Get("btnBack"), new Vector2(280, 72), new Vector2(0, -340),
                new Color(0.88f, 0.84f, 0.98f, 1f), LightAccent, 28, GoToMenuFromHost), "btnBack");

            return panel;
        }

        GameObject BuildHostLobbyPanel(Transform parent)
        {
            var panel = CreatePanel(parent, "HostLobbyPanel");
            panel.SetActive(false);
            BuildBackground(panel.transform, LightBgTop, LightBgBottom, LightAccent, 0.12f);
            BuildMenuDecor(panel.transform);

            BuildTitleKey(panel.transform, "lobbyTitle", 120, LightText);

            hostLobbyCodeLabel = CreateLabel(panel.transform, "-----", 96, new Vector2(0, -20), LightAccent);
            hostLobbyCodeLabel.characterSpacing = 14;

            Localization.Register(CreateLabel(panel.transform, Localization.Get("lobbyHint"), 30, new Vector2(0, -110),
                new Color(LightText.r, LightText.g, LightText.b, 0.7f)), "lobbyHint");

            var copyBtn = CreateButton(panel.transform, Localization.Get("btnCopy"), new Vector2(560, 100), new Vector2(0, -200),
                CopyBtnNormal, Color.white, 34, OnCopyPotCode);
            copyBtnImage = copyBtn.GetComponent<Image>();
            copyBtnLabel = copyBtn.GetComponentInChildren<TextMeshProUGUI>();
            RegisterButtonLabel(copyBtn, "btnCopy");
            RegisterButtonLabel(CreateButton(panel.transform, Localization.Get("btnStart"), new Vector2(560, 100), new Vector2(0, -310),
                LightHostBtn, Color.white, 34, OnStartGame), "btnStart");

            RegisterButtonLabel(CreateButton(panel.transform, Localization.Get("btnBack"), new Vector2(280, 72), new Vector2(0, -420),
                new Color(0.88f, 0.84f, 0.98f, 1f), LightAccent, 28, GoToMenuFromHost), "btnBack");

            return panel;
        }

        GameObject BuildGamePanel(Transform parent)
        {
            var panel = CreatePanel(parent, "GamePanel");
            panel.SetActive(false);
            BuildBackground(panel.transform, MenuBgTop, MenuBgBottom, LightAccent, 0.2f);

            gameCountdownRoot = new GameObject("Countdown", typeof(RectTransform));
            gameCountdownRoot.transform.SetParent(panel.transform, false);
            Stretch(gameCountdownRoot.GetComponent<RectTransform>());

            var cdLabel = CreateLabel(gameCountdownRoot.transform, Localization.Get("countdownLabel"), 36,
                new Vector2(0, 80), new Color(0.85f, 0.82f, 1f, 0.9f));
            Localization.Register(cdLabel, "countdownLabel");

            countdownNumber = CreateLabel(gameCountdownRoot.transform, "5", 160, new Vector2(0, -40), Color.white);

            gameTableRoot = new GameObject("GameTable", typeof(RectTransform));
            gameTableRoot.transform.SetParent(panel.transform, false);
            Stretch(gameTableRoot.GetComponent<RectTransform>());
            gameTableRoot.SetActive(false);

            var tableHint = CreateLabel(gameTableRoot.transform,
                "Speeltafel — voeg 3D/foto's toe in Unity", 32, Vector2.zero,
                new Color(0.9f, 0.88f, 1f, 0.85f));

            var giveUpBtn = CreateButton(gameTableRoot.transform, Localization.Get("btnGiveUp"),
                new Vector2(200, 64), Vector2.zero,
                new Color(0.86f, 0.15f, 0.15f, 1f), Color.white, 26, GoBackFromGame);
            var giveUpRt = giveUpBtn.GetComponent<RectTransform>();
            giveUpRt.anchorMin = giveUpRt.anchorMax = new Vector2(0f, 1f);
            giveUpRt.pivot = new Vector2(0f, 1f);
            giveUpRt.anchoredPosition = new Vector2(28, -28);
            RegisterButtonLabel(giveUpBtn, "btnGiveUp");

            return panel;
        }

        GameObject BuildJoinPanel(Transform parent)
        {
            var panel = CreatePanel(parent, "JoinPanel");
            panel.SetActive(false);
            BuildBackground(panel.transform, LightBgTop, LightBgBottom, LightAccent, 0.12f);
            BuildMenuDecor(panel.transform);

            BuildTitleKey(panel.transform, "joinTitle", 100, LightText);
            Localization.Register(CreateLabel(panel.transform, Localization.Get("joinHint"), 26, new Vector2(0, 20),
                new Color(LightText.r, LightText.g, LightText.b, 0.65f)), "joinHint");

            joinCodeInput = CreateCodeInput(panel.transform, new Vector2(420, 90), new Vector2(0, -50));
            joinErrorLabel = CreateLabel(panel.transform, "", 26, new Vector2(0, -120),
                new Color(0.9f, 0.35f, 0.4f, 1f));

            RegisterButtonLabel(CreateButton(panel.transform, Localization.Get("btnJoinGame"), new Vector2(520, 110), new Vector2(0, -210),
                LightAccent, Color.white, 40, OnJoinGame), "btnJoinGame");
            RegisterButtonLabel(CreateButton(panel.transform, Localization.Get("btnBack"), new Vector2(280, 72), new Vector2(0, -330),
                new Color(0.88f, 0.84f, 0.98f, 1f), LightAccent, 28, GoToMenuFromJoin), "btnBack");

            return panel;
        }

        GameObject BuildJoinSuccessPanel(Transform parent)
        {
            var panel = CreatePanel(parent, "JoinSuccessPanel");
            panel.SetActive(false);
            BuildBackground(panel.transform, LightBgTop, LightBgBottom, LightAccent, 0.12f);
            BuildMenuDecor(panel.transform);

            BuildTitleKey(panel.transform, "joinedTitle", 120, LightText);
            joinSuccessCodeLabel = CreateLabel(panel.transform, "-----", 96, new Vector2(0, -20), LightAccent);
            joinSuccessCodeLabel.characterSpacing = 14;

            Localization.Register(CreateLabel(panel.transform, Localization.Get("joinedHint"), 30, new Vector2(0, -120),
                new Color(LightText.r, LightText.g, LightText.b, 0.7f)), "joinedHint");

            RegisterButtonLabel(CreateButton(panel.transform, Localization.Get("btnBack"), new Vector2(280, 72), new Vector2(0, -300),
                new Color(0.88f, 0.84f, 0.98f, 1f), LightAccent, 28, GoToMenuFromJoin), "btnBack");

            return panel;
        }

        static TextMeshProUGUI CreateLabel(Transform parent, string text, int fontSize, Vector2 pos, Color color)
        {
            var go = new GameObject("Label", typeof(RectTransform), typeof(TextMeshProUGUI));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = new Vector2(900, 100);
            rt.anchoredPosition = pos;
            var tmp = go.GetComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = fontSize;
            tmp.fontStyle = FontStyles.Bold;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = color;
            return tmp;
        }

        static TMP_InputField CreateCodeInput(Transform parent, Vector2 size, Vector2 pos)
        {
            var root = new GameObject("CodeInput", typeof(RectTransform), typeof(Image), typeof(TMP_InputField), typeof(HostCodeLimiter));
            root.transform.SetParent(parent, false);
            var rt = root.GetComponent<RectTransform>();
            rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = size;
            rt.anchoredPosition = pos;

            var bg = root.GetComponent<Image>();
            bg.sprite = CreateRoundedSprite(20);
            bg.type = Image.Type.Sliced;
            bg.color = Color.white;

            var textGo = new GameObject("Text", typeof(RectTransform), typeof(TextMeshProUGUI));
            textGo.transform.SetParent(root.transform, false);
            var textRt = textGo.GetComponent<RectTransform>();
            Stretch(textRt);
            textRt.offsetMin = new Vector2(20, 8);
            textRt.offsetMax = new Vector2(-20, -8);

            var text = textGo.GetComponent<TextMeshProUGUI>();
            text.fontSize = 42;
            text.fontStyle = FontStyles.Bold;
            text.alignment = TextAlignmentOptions.Center;
            text.color = LightText;

            var phGo = new GameObject("Placeholder", typeof(RectTransform), typeof(TextMeshProUGUI));
            phGo.transform.SetParent(root.transform, false);
            var phRt = phGo.GetComponent<RectTransform>();
            Stretch(phRt);
            phRt.offsetMin = new Vector2(20, 8);
            phRt.offsetMax = new Vector2(-20, -8);
            var ph = phGo.GetComponent<TextMeshProUGUI>();
            ph.text = "bijv. FUN42";
            ph.fontSize = 32;
            ph.fontStyle = FontStyles.Italic;
            ph.color = new Color(LightAccent.r, LightAccent.g, LightAccent.b, 0.45f);
            ph.alignment = TextAlignmentOptions.Center;

            var input = root.GetComponent<TMP_InputField>();
            input.textComponent = text;
            input.placeholder = ph;
            input.characterLimit = 5;

            return input;
        }

        static void BuildMenuDecor(Transform parent)
        {
            var root = new GameObject("MenuDecor", typeof(RectTransform));
            root.transform.SetParent(parent, false);
            Stretch(root.GetComponent<RectTransform>());

            var bubbles = new (Vector2 pos, float size, Color color, float alpha)[]
            {
                (new(-720, 260), 180f, new Color(1f, 0.75f, 0.65f, 1f), 0.35f),
                (new(740, 200), 150f, new Color(0.55f, 0.85f, 1f, 1f), 0.4f),
                (new(-680, -240), 130f, new Color(0.75f, 0.65f, 1f, 1f), 0.35f),
                (new(700, -280), 160f, new Color(1f, 0.85f, 0.55f, 1f), 0.38f),
                (new(-200, 360), 100f, new Color(0.65f, 0.95f, 0.85f, 1f), 0.45f),
                (new(250, -360), 110f, new Color(1f, 0.7f, 0.85f, 1f), 0.4f),
            };

            foreach (var b in bubbles)
                CreateBubble(root.transform, b.pos, b.size, b.color, b.alpha);

            var polaroids = new (Vector2 pos, Vector2 size, float rot, float alpha)[]
            {
                (new(-420, 120), new(130, 165), -8f, 0.85f),
                (new(450, 80), new(120, 155), 10f, 0.82f),
                (new(-380, -160), new(115, 148), 6f, 0.8f),
                (new(400, -140), new(125, 158), -11f, 0.83f),
            };

            var motions = new FloatingCardBackground.CardMotion[polaroids.Length];
            for (var i = 0; i < polaroids.Length; i++)
            {
                var p = polaroids[i];
                motions[i] = new FloatingCardBackground.CardMotion
                {
                    rect = CreateLightPolaroid(root.transform, p.pos, p.size, p.rot, p.alpha),
                    drift = new Vector2(i % 2 == 0 ? 3f : -2.5f, i % 3 == 0 ? 1.5f : -1.5f),
                    bobSpeed = 0.35f + i * 0.08f,
                    bobAmount = 10f + i * 2f,
                    rotateSpeed = 0.2f + i * 0.04f
                };
            }

            root.AddComponent<FloatingCardBackground>().SetCards(motions);

            CreateMenuQuestionMark(root.transform, new Vector2(-550, -30), 72);
            CreateMenuQuestionMark(root.transform, new Vector2(560, 40), 64);
            CreateMenuQuestionMark(root.transform, new Vector2(0, -300), 56);
        }

        static void CreateBubble(Transform parent, Vector2 pos, float size, Color color, float alpha)
        {
            var go = new GameObject("Bubble", typeof(RectTransform), typeof(Image));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = new Vector2(size, size);
            rt.anchoredPosition = pos;

            var img = go.GetComponent<Image>();
            img.sprite = CreateCircleSprite();
            img.color = new Color(color.r, color.g, color.b, alpha);
            img.raycastTarget = false;
        }

        static void CreateMenuQuestionMark(Transform parent, Vector2 pos, int fontSize)
        {
            var go = new GameObject("Question", typeof(RectTransform), typeof(TextMeshProUGUI));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = new Vector2(80, 80);
            rt.anchoredPosition = pos;

            var tmp = go.GetComponent<TextMeshProUGUI>();
            tmp.text = "?";
            tmp.fontSize = fontSize;
            tmp.fontStyle = FontStyles.Bold;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = new Color(LightAccent.r, LightAccent.g, LightAccent.b, 0.25f);
            tmp.raycastTarget = false;
        }

        static RectTransform CreateLightPolaroid(Transform parent, Vector2 pos, Vector2 size, float rot, float alpha)
        {
            var cardGo = new GameObject("Polaroid", typeof(RectTransform), typeof(CanvasGroup), typeof(Image));
            cardGo.transform.SetParent(parent, false);

            var rt = cardGo.GetComponent<RectTransform>();
            rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = size;
            rt.anchoredPosition = pos;
            rt.localRotation = Quaternion.Euler(0f, 0f, rot);

            cardGo.GetComponent<CanvasGroup>().alpha = alpha;

            var img = cardGo.GetComponent<Image>();
            img.sprite = CardArt.Card;
            img.color = Color.white;
            img.raycastTarget = false;

            var face = new GameObject("Face", typeof(RectTransform), typeof(Image));
            face.transform.SetParent(cardGo.transform, false);
            var faceRt = face.GetComponent<RectTransform>();
            faceRt.anchorMin = new Vector2(0.12f, 0.18f);
            faceRt.anchorMax = new Vector2(0.88f, 0.9f);
            faceRt.offsetMin = faceRt.offsetMax = Vector2.zero;
            var faceImg = face.GetComponent<Image>();
            faceImg.sprite = CardArt.Face;
            faceImg.preserveAspect = true;
            faceImg.color = new Color(0.65f, 0.55f, 0.95f, 0.55f);
            faceImg.raycastTarget = false;

            return rt;
        }

        static Sprite CreateCircleSprite()
        {
            const int s = 64;
            var tex = new Texture2D(s, s, TextureFormat.RGBA32, false);
            var center = s / 2f;
            var r = s / 2f - 1;
            for (var y = 0; y < s; y++)
            for (var x = 0; x < s; x++)
            {
                var d = (x - center) * (x - center) + (y - center) * (y - center);
                tex.SetPixel(x, y, d <= r * r ? Color.white : Color.clear);
            }
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.5f), 100f);
        }

        static GameObject CreatePanel(Transform parent, string name)
        {
            var panel = new GameObject(name, typeof(RectTransform), typeof(CanvasGroup));
            panel.transform.SetParent(parent, false);
            Stretch(panel.GetComponent<RectTransform>());
            return panel;
        }

        static void BuildTitle(Transform parent, string text, float y, Color color)
        {
            var go = new GameObject("Title", typeof(RectTransform), typeof(TextMeshProUGUI));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = new Vector2(1200, 320);
            rt.anchoredPosition = new Vector2(0, y);

            var tmp = go.GetComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = 100;
            tmp.fontStyle = FontStyles.Bold;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = color;
        }

        static void BuildTitleKey(Transform parent, string key, float y, Color color)
        {
            var go = new GameObject("Title", typeof(RectTransform), typeof(TextMeshProUGUI));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = new Vector2(1200, 320);
            rt.anchoredPosition = new Vector2(0, y);

            var tmp = go.GetComponent<TextMeshProUGUI>();
            tmp.fontSize = 100;
            tmp.fontStyle = FontStyles.Bold;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = color;
            Localization.Register(tmp, key);
        }

        static void RegisterButtonLabel(Button btn, string key)
        {
            var tmp = btn.GetComponentInChildren<TextMeshProUGUI>();
            if (tmp != null)
                Localization.Register(tmp, key);
        }

        static void BuildLangPicker(Transform canvas)
        {
            var root = new GameObject("LangPicker", typeof(RectTransform));
            root.transform.SetParent(canvas, false);
            var rootRt = root.GetComponent<RectTransform>();
            rootRt.anchorMin = rootRt.anchorMax = new Vector2(1f, 1f);
            rootRt.pivot = new Vector2(1f, 1f);
            rootRt.anchoredPosition = new Vector2(-20, -20);
            rootRt.sizeDelta = new Vector2(200, 120);

            var globeBtn = CreateButton(root.transform, "🌍", new Vector2(48, 48), new Vector2(-24, -24),
                Color.white, LightText, 28, () => ToggleLangMenu(root.transform.Find("LangMenu")));
            var globeRt = globeBtn.GetComponent<RectTransform>();
            globeRt.anchorMin = globeRt.anchorMax = new Vector2(1f, 1f);
            globeRt.pivot = new Vector2(1f, 1f);

            var menu = new GameObject("LangMenu", typeof(RectTransform), typeof(CanvasGroup));
            menu.transform.SetParent(root.transform, false);
            var menuRt = menu.GetComponent<RectTransform>();
            menuRt.anchorMin = menuRt.anchorMax = new Vector2(1f, 1f);
            menuRt.pivot = new Vector2(1f, 1f);
            menuRt.anchoredPosition = new Vector2(-24, -80);
            menuRt.sizeDelta = new Vector2(160, 88);

            var menuBg = menu.AddComponent<Image>();
            menuBg.sprite = CreateRoundedSprite(10);
            menuBg.type = Image.Type.Sliced;
            menuBg.color = Color.white;

            var nlBtn = CreateButton(menu.transform, Localization.Get("langNl"), new Vector2(150, 36), new Vector2(0, 18),
                new Color(0.93f, 0.91f, 0.99f, 1f), LightText, 22,
                () => { Localization.SetLang(Localization.Lang.Nl); menu.SetActive(false); });
            var enBtn = CreateButton(menu.transform, Localization.Get("langEn"), new Vector2(150, 36), new Vector2(0, -22),
                new Color(0.93f, 0.91f, 0.99f, 1f), LightText, 22,
                () => { Localization.SetLang(Localization.Lang.En); menu.SetActive(false); });

            RegisterButtonLabel(nlBtn, "langNl");
            RegisterButtonLabel(enBtn, "langEn");
            menu.SetActive(false);
        }

        static void ToggleLangMenu(Transform menu)
        {
            if (menu == null) return;
            menu.gameObject.SetActive(!menu.gameObject.activeSelf);
        }

        static void BuildFooter(Transform parent)
        {
            var go = new GameObject("Footer", typeof(RectTransform), typeof(TextMeshProUGUI));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 0f);
            rt.sizeDelta = new Vector2(1000, 60);
            rt.anchoredPosition = new Vector2(0, 48);

            var tmp = go.GetComponent<TextMeshProUGUI>();
            tmp.text = "Raad het personage · Speel met vrienden online";
            tmp.fontSize = 30;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = new Color(AccentBlue.r, AccentBlue.g, AccentBlue.b, 0.75f);
        }

        static Button CreateButton(Transform parent, string label, Vector2 size, Vector2 pos,
            Color bg, Color textColor, int fontSize, UnityEngine.Events.UnityAction onClick)
        {
            var btnGo = new GameObject(label + "Button", typeof(RectTransform), typeof(Image), typeof(Button));
            btnGo.transform.SetParent(parent, false);
            var rt = btnGo.GetComponent<RectTransform>();
            rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = size;
            rt.anchoredPosition = pos;

            var img = btnGo.GetComponent<Image>();
            img.sprite = CreateRoundedSprite(14);
            img.type = Image.Type.Sliced;
            img.color = bg;

            var btn = btnGo.GetComponent<Button>();
            var colors = btn.colors;
            colors.normalColor = bg;
            colors.highlightedColor = Color.Lerp(bg, Color.white, 0.2f);
            colors.pressedColor = Color.Lerp(bg, Color.black, 0.15f);
            btn.colors = colors;
            btn.onClick.AddListener(onClick);

            var labelGo = new GameObject("Label", typeof(RectTransform), typeof(TextMeshProUGUI));
            labelGo.transform.SetParent(btnGo.transform, false);
            Stretch(labelGo.GetComponent<RectTransform>());

            var tmp = labelGo.GetComponent<TextMeshProUGUI>();
            tmp.text = label;
            tmp.fontSize = fontSize;
            tmp.fontStyle = FontStyles.Bold;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = textColor;

            return btn;
        }

        static void EnsureEventSystem()
        {
            if (Object.FindObjectOfType<UnityEngine.EventSystems.EventSystem>() != null)
                return;

            new GameObject("EventSystem",
                typeof(UnityEngine.EventSystems.EventSystem),
                typeof(UnityEngine.EventSystems.StandaloneInputModule));
        }

        static void BuildBackground(Transform parent, Color top, Color bottom, Color glowColor, float glowAlpha)
        {
            var bg = CreateImage(parent, "Background", Color.white, false);
            Stretch(bg.rectTransform);
            bg.sprite = CreateGradientSprite(top, bottom);

            var glow = CreateImage(parent, "Glow",
                new Color(glowColor.r, glowColor.g, glowColor.b, glowAlpha), false);
            var rt = glow.rectTransform;
            rt.anchorMin = new Vector2(0.15f, 0.25f);
            rt.anchorMax = new Vector2(0.85f, 0.8f);
            rt.offsetMin = rt.offsetMax = Vector2.zero;
        }

        static void BuildFloatingCards(Transform parent, bool lightTheme)
        {
            if (lightTheme) return;
            var root = new GameObject("FloatingCards", typeof(RectTransform));
            root.transform.SetParent(parent, false);
            Stretch(root.GetComponent<RectTransform>());

            var placements = new (Vector2 pos, Vector2 size, float rot, float alpha)[]
            {
                (new(-820, 220), new(200, 260), -14f, 0.14f),
                (new(820, 160), new(190, 245), 11f, 0.12f),
                (new(-780, -220), new(175, 230), 8f, 0.10f),
                (new(760, -260), new(185, 240), -9f, 0.11f),
                (new(0, 340), new(160, 210), 5f, 0.09f),
                (new(120, -340), new(170, 225), -6f, 0.10f),
                (new(-380, 20), new(150, 200), 4f, 0.08f),
                (new(400, -40), new(150, 200), -7f, 0.08f),
            };

            var motions = new FloatingCardBackground.CardMotion[placements.Length];
            for (var i = 0; i < placements.Length; i++)
            {
                var p = placements[i];
                var card = CreateCard(root.transform, p.pos, p.size, p.rot, p.alpha);
                motions[i] = new FloatingCardBackground.CardMotion
                {
                    rect = card,
                    drift = new Vector2(i % 2 == 0 ? 4f : -3f, i % 3 == 0 ? 2f : -2f),
                    bobSpeed = 0.4f + i * 0.07f,
                    bobAmount = 12f + i * 2f,
                    rotateSpeed = 0.25f + i * 0.05f
                };
            }

            root.AddComponent<FloatingCardBackground>().SetCards(motions);
        }

        static RectTransform CreateCard(Transform parent, Vector2 pos, Vector2 size, float rot, float alpha)
        {
            var cardGo = new GameObject("Card", typeof(RectTransform), typeof(CanvasGroup), typeof(Image));
            cardGo.transform.SetParent(parent, false);

            var rt = cardGo.GetComponent<RectTransform>();
            rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = size;
            rt.anchoredPosition = pos;
            rt.localRotation = Quaternion.Euler(0f, 0f, rot);

            cardGo.GetComponent<CanvasGroup>().alpha = alpha;

            var img = cardGo.GetComponent<Image>();
            img.sprite = CardArt.Card;
            img.color = new Color(1f, 1f, 1f, 0.92f);
            img.raycastTarget = false;

            var face = new GameObject("Face", typeof(RectTransform), typeof(Image));
            face.transform.SetParent(cardGo.transform, false);
            var faceRt = face.GetComponent<RectTransform>();
            faceRt.anchorMin = new Vector2(0.15f, 0.2f);
            faceRt.anchorMax = new Vector2(0.85f, 0.88f);
            faceRt.offsetMin = faceRt.offsetMax = Vector2.zero;
            var faceImg = face.GetComponent<Image>();
            faceImg.sprite = CardArt.Face;
            faceImg.preserveAspect = true;
            faceImg.color = new Color(1f, 1f, 1f, 0.35f);
            faceImg.raycastTarget = false;

            return rt;
        }

        static Image CreateImage(Transform parent, string name, Color color, bool raycast)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image));
            go.transform.SetParent(parent, false);
            var img = go.GetComponent<Image>();
            img.color = color;
            img.raycastTarget = raycast;
            return img;
        }

        static void Stretch(RectTransform rt)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = rt.offsetMax = Vector2.zero;
        }

        static Sprite CreateGradientSprite(Color top, Color bottom)
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

        static Sprite CreateRoundedSprite(int radius)
        {
            const int size = 128;
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            var r = radius * (size / 128f);
            for (var y = 0; y < size; y++)
            for (var x = 0; x < size; x++)
            {
                var inside = InsideRoundRect(x, y, size, size, r);
                tex.SetPixel(x, y, inside ? Color.white : Color.clear);
            }
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), 100f, 0,
                SpriteMeshType.FullRect, new Vector4(r, r, r, r));
        }

        static bool InsideRoundRect(int x, int y, int w, int h, float radius)
        {
            var rx = Mathf.Clamp(x, radius, w - radius - 1);
            var ry = Mathf.Clamp(y, radius, h - radius - 1);
            if (x >= radius && x < w - radius) return true;
            if (y >= radius && y < h - radius) return true;
            var dx = x - rx;
            var dy = y - ry;
            return dx * dx + dy * dy <= radius * radius;
        }
    }
}
