/* YaneCLIBB Community v12.6. Pure browser UI; all privileged writes use Supabase RLS/RPC. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id),
    $$ = (s) => [...document.querySelectorAll(s)],
    esc = (x) =>
      String(x ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      ),
    safeUrl = (x) => {
      try {
        const u = new URL(x);
        return u.protocol === "https:" ? u.href : null;
      } catch {
        return null;
      }
    },
    money = (n) =>
      Number(n || 0).toLocaleString("en-US", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      }),
    num = (n) => Number(n || 0).toLocaleString(),
    fmtDate = (d) =>
      d ? new Date(d).toLocaleString(S.lang === "uk" ? "uk-UA" : S.lang === "en" ? "en-GB" : "ru-RU") : "—",
    cfg = window.YANE_CONFIG || {},
    S = {
      sb: null,
      user: null,
      profile: null,
      profiles: [],
      chats: [],
      oldest: null,
      hasMore: false,
      reply: null,
      lang: localStorage.getItem("ycl-language") || "ru",
      theme:
        localStorage.getItem("ycl-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
      page: "home",
      adminTab: "reports",
      authMode: "login",
      stats: [],
      clips: [],
      videos: [],
      lessons: [],
      releases: [],
      settings: null,
      selectedUser: null,
      month: new Date().toISOString().slice(0, 7),
      busy: false,
      chatChannel: null,
      lastAction: Date.now(),
      fx: null,
      openedProfile: null,
      aiHistory: [],
      aiImage: null,
      aiImageName: "",
      aiVideoFile: null,
      latestReport: null,
      profileMetrics: {},
      aiBusy: false,
    };
  const dict = {
    ru: {
      tagline: "КРЕАТОР ПЛАТФОРМА",
      navHome: "Главная",
      navAI: "ЯнеИИ",
      navSchool: "Школа монтажа",
      navDiagnose: "Диагностика",
      navVideos: "Видео",
      navClippers: "Нарезчики",
      navChat: "Общий чат",
      navStats: "Календарь и статистика",
      navRules: "Правила",
      navAdmin: "Управление",
      createContent: "Предложить видео",
      heroTitle: "Спроси",
      heroText:
        "Твой помощник по TikTok, Shorts, монтажу, дизайну, аналитике и созданию нарезок. Конкретные советы и пошаговые инструкции.",
      askAI: "Спросить ЯнеИИ →",
      fastActions: "Быстрые действия",
      quickAI: "Разбор и советы по монтажу",
      quickSchool: "Уроки и эффекты",
      quickStats: "Твой прогресс",
      quickChat: "Помощь нарезчиков",
      showAll: "Смотреть все →",
      yourProgress: "Твой прогресс",
      openCalendar: "Открыть календарь",
      aiTitle: "ЯнеИИ — твой помощник",
      aiSubtitle: "Спроси об эффектах, монтаже, музыке, просмотрах и загрузи фото для разбора.",
      schoolSub: "Подробные уроки для начинающих и опытных нарезчиков.",
      diagnoseSub: "Найди проблему и получи конкретные шаги её решения.",
      videosSub: "Подборка реальных нарезок, одобренных администрацией.",
      proposeVideo: "＋ Предложить видео",
      clippersSub: "Основной состав, связанный с настоящими аккаунтами.",
      occupiedSeats: "Места в основе",
      chatSub: "Сообщения синхронизируются через Supabase. Возле каждого сообщения есть кнопка жалобы.",
      send: "Отправить",
      calendar: "Календарь",
      rulesSub: "Подтверждённые правила и дополнительные положения сообщества.",
      profile: "Профиль",
    },
    uk: {
      tagline: "ПЛАТФОРМА КРЕАТОРІВ",
      navHome: "Головна",
      navAI: "ЯнеШІ",
      navSchool: "Школа монтажу",
      navDiagnose: "Діагностика",
      navVideos: "Відео",
      navClippers: "Нарізувачі",
      navChat: "Спільний чат",
      navStats: "Календар і статистика",
      navRules: "Правила",
      navAdmin: "Керування",
      createContent: "Запропонувати відео",
      heroTitle: "Запитай",
      heroText:
        "Твій помічник із TikTok, Shorts, монтажу, дизайну, аналітики та створення нарізок. Покрокові інструкції.",
      askAI: "Запитати ЯнеШІ →",
      fastActions: "Швидкі дії",
      quickAI: "Аналіз і поради щодо монтажу",
      quickSchool: "Уроки та ефекти",
      quickStats: "Твій прогрес",
      quickChat: "Допомога спільноти",
      showAll: "Переглянути все →",
      yourProgress: "Твій прогрес",
      openCalendar: "Відкрити календар",
      aiTitle: "ЯнеШІ — твій помічник",
      aiSubtitle: "Запитай про ефекти, монтаж, музику, перегляди та додай фото.",
      schoolSub: "Детальні уроки для початківців і досвідчених авторів.",
      diagnoseSub: "Знайди проблему та отримай покрокове рішення.",
      videosSub: "Добірка реальних нарізок, схвалених адміністрацією.",
      proposeVideo: "＋ Запропонувати відео",
      clippersSub: "Основна команда зі справжніми обліковими записами.",
      occupiedSeats: "Місця в команді",
      chatSub: "Повідомлення синхронізуються через Supabase. Біля кожного є кнопка скарги.",
      send: "Надіслати",
      calendar: "Календар",
      rulesSub: "Підтверджені правила та додаткові положення спільноти.",
      profile: "Профіль",
    },
    en: {
      tagline: "CREATOR PLATFORM",
      navHome: "Home",
      navAI: "YaneAI",
      navSchool: "Editing school",
      navDiagnose: "Troubleshooting",
      navVideos: "Videos",
      navClippers: "Clippers",
      navChat: "Community chat",
      navStats: "Calendar & statistics",
      navRules: "Rules",
      navAdmin: "Administration",
      createContent: "Suggest video",
      heroTitle: "Ask",
      heroText:
        "Your assistant for TikTok, Shorts, editing, design, analytics, and stream clips. Practical step-by-step guidance.",
      askAI: "Ask YaneAI →",
      fastActions: "Quick actions",
      quickAI: "Video reviews and editing tips",
      quickSchool: "Lessons and effects",
      quickStats: "Your progress",
      quickChat: "Creator community help",
      showAll: "View all →",
      yourProgress: "Your progress",
      openCalendar: "Open calendar",
      aiTitle: "YaneAI — your assistant",
      aiSubtitle: "Ask about effects, editing, sound, views, or attach a photo.",
      schoolSub: "Detailed tutorials for beginner and experienced editors.",
      diagnoseSub: "Find a problem and get actionable steps.",
      videosSub: "Real clips approved by community administrators.",
      proposeVideo: "＋ Suggest video",
      clippersSub: "Core editors linked to real user accounts.",
      occupiedSeats: "Core team seats",
      chatSub: "Messages sync through Supabase. You can report any message.",
      send: "Send",
      calendar: "Calendar",
      rulesSub: "Confirmed rules and additional community policies.",
      profile: "Profile",
    },
  };
  function t(key) {
    return (dict[S.lang] || dict.ru)[key] || dict.ru[key] || key;
  }
  function toast(msg, type) {
    const text = String(msg).replace(/^SANCTION:\s*/, "");
    notify({
      type:
        type ||
        (/ошиб|не удалось|нет доступа|запрещ|заблок|слишком|нельзя/i.test(text)
          ? "error"
          : /сохран|успеш|отправлен|обновл|выполн|удален|удалён/i.test(text)
            ? "success"
            : "info"),
      title: text,
      important: /SANCTION:|заблок|Мут/i.test(String(msg)),
    });
  }
  function html(id, content) {
    const el = $(id);
    if (el) {el.innerHTML = content;window.YANE_I18N?.refresh(el);}
  }
  function isAdmin() {
    return !!S.profile && S.profile.role === "admin" && !S.profile.is_banned;
  }
  function signed() {
    return !!S.user && !!S.profile;
  }
  function checkAuth(area) {
    if (!S.sb) {
      toast("Сначала подключи Supabase — см. README_УСТАНОВКА.md", "warning");
      return false;
    }
    if (!S.user) {
      $("auth-dialog").showModal();
      return false;
    }
    if (!S.profile) {
      toast("Профиль ещё загружается. Попробуй через секунду.", "warning");
      return false;
    }
    const r = restriction(area || "all");
    if (r) {
      notify({
        type: "warning",
        title: "Доступ ограничен",
        description: sanctionText(r),
        dedupe: "sanction-" + r.id,
        important: true,
      });
      return false;
    }
    return true;
  }
  function requireAdmin() {
    if (!isAdmin()) {
      toast("Доступ только для администрации");
      return false;
    }
    return true;
  }
  function avatar(p, extra = "") {
    const name = String(p?.username || p?.display_name || "Y");
    const raw = p?.avatar_url || "";
    const url = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(raw) && raw.length <= 180000 ? raw : safeUrl(raw);
    return `<span class="small-avatar ${extra}">${url ? `<img src="${esc(url)}" alt="">` : esc(name.slice(0, 1).toUpperCase())}${presenceMarkup(p)}</span>`;
  }
  function roleLabel(p) {
    return p?.role === "admin" ? "🛡 Администратор" : p?.role === "clipper" ? "🎬 Основной нарезчик" : "👤 Пользователь";
  }
  function go(page) {
    if (!$("screen-" + page)) page = "home";
    if (C.initialized && C.editing && page !== "home") cancelCustomization(true);
    S.page = page;
    $$(".screen").forEach((el) => el.classList.toggle("active", el.id === "screen-" + page));
    $$("[data-nav]").forEach((el) => el.classList.toggle("nav-active", el.dataset.nav === page));
    $("app").classList.remove("menu-open");
    $("scrim").hidden = true;
    window.scrollTo({
      top: 0,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
    history.replaceState(null, "", "#" + page);
    renderSectionRestriction();
    if (restriction(page) && !["home", "admin", "profile", "rules"].includes(page)) return;
    const jobs = {
      chat: loadChat,
      stats: loadStats,
      videos: loadVideos,
      clippers: loadClippers,
      admin: renderAdmin,
      school: loadLessons,
      rules: renderRules,
    };
    if (jobs[page]) Promise.resolve(jobs[page]()).catch((e) => toast(formatError(e), "error"));
    requestAnimationFrame(() => {
      revealCards();
      if (C.initialized) {
        updateNavIndicator();
        if (page === "home") refreshWidgetData();
      }
    });
  }
  function setTheme(theme) {
    S.theme = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = S.theme;
    $("app").dataset.theme = S.theme;
    $("theme-toggle").innerHTML = uiIcon(S.theme === "dark" ? "sun" : "moon");
    $("theme-toggle").setAttribute("aria-label", S.theme === "dark" ? "Светлая тема" : "Тёмная тема");
    localStorage.setItem("ycl-theme", S.theme);
    if (signed()) savePreferences();
    if (C.initialized) applyCustom(currentCustom());
  }
  function setLanguage(lang) {
    const openedLesson=S.openLesson;
    S.lang = ["ru", "uk", "en"].includes(lang) ? lang : "ru";
    document.documentElement.lang = S.lang;
    window.YANE_I18N?.setLanguage(S.lang);
    $("language-current").innerHTML =
      `<i class="flag flag-${S.lang}"></i>${{ ru: "RU", uk: "UA", en: "EN" }[S.lang]}<span>⌄</span>`;
    $("language-picker").open = false;
    localStorage.setItem("ycl-language", S.lang);
    $$("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    if (signed()) savePreferences();
    renderStats();
    renderLessons();
    renderDiagnostics();
    renderRules();
    renderClippers();
    renderVideos();
    renderProfile();
    renderReleases();
    if(!S.aiBusy && !S.aiHistory.length) renderAIHistory();
    window.YANE_I18N?.setLanguage(S.lang);
    if(openedLesson)openLesson(openedLesson);
    window.YANE_I18N?.refresh();
    updateAICooldown();
    syncAboutLanguage();
  }
  async function savePreferences() {
    if (!S.sb || !S.profile) return;
    const p = S.profile;
    const { error } = await S.sb.rpc("v11_update_profile", {
      new_name: p.username,
      new_avatar: p.avatar_url || "",
      new_socials: p.social_links || {},
      new_language: S.lang,
      new_theme: S.theme,
    });
    if (error) console.warn("Preferences:", error.message);
  }
  function connection(ok) {
    $("connection-status").textContent = ok ? "Supabase подключён" : "Нужна настройка Supabase";
    $("sidebar").querySelector(".live-dot").classList.toggle("on", ok);
    $("chat-status").textContent = ok ? "ONLINE" : "OFFLINE";
  }
  // This function never invents connection, users or content if Supabase is not configured.
  async function initBackend() {
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
      connection(false);
      showDisconnected();
      return;
    }
    if (!window.supabase?.createClient) {
      connection(false);
      toast("Библиотека Supabase не загрузилась. Проверь интернет.");
      return;
    }
    try {
      S.sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      S.sb.auth.onAuthStateChange((event, session) => {
        setTimeout(async () => {
          if (event === "PASSWORD_RECOVERY") {
            S.user = session?.user || null;
            const pw = await customPrompt("Ссылка подтверждена. Введи новый пароль (от 8 символов):");
            if (pw?.length >= 8) {
              const { error } = await S.sb.auth.updateUser({ password: pw });
              toast(error ? error.message : "Пароль обновлён");
            }
          }
          await setSession(session?.user || null);
        }, 0);
      });
      const {
        data: { user },
        error,
      } = await S.sb.auth.getUser();
      if (error && error.message && !/missing auth session/i.test(error.message)) console.warn(error.message);
      await setSession(user || null);
      connection(true);
      await Promise.allSettled([loadPublic(), loadReleases()]);
      S.chatChannel = S.sb
        .channel("ycl-v11-chat")
        .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" }, () => {
          if (S.page === "chat") loadChat();
        })
        .subscribe();
    } catch (e) {
      connection(false);
      toast("Supabase: " + e.message);
    }
  }
  function showDisconnected() {
    html("featured-videos", '<div class="empty">Подключи Supabase, чтобы публиковать настоящие видео.</div>');
    html("clippers-list", '<div class="empty">Нужна база пользователей Supabase.</div>');
    S.lessons=bundledLessons();renderLessons();
    html("chat-stream", '<div class="empty">Чат требует Supabase. См. инструкцию по установке.</div>');
    renderStats();
  }
  async function setSession(user) {
    const oldId = S.user?.id;
    S.user = user;
    S.profile = null;
    if (user && S.sb) {
      const { data, error } = await S.sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) console.warn("Profile:", error.message);
      S.profile = data || null;
    }
    if (oldId !== user?.id) S.stats = [];
    loadLocalPrefs();
    const p = S.profile;
    if (oldId !== user?.id) { S.avatarUntil = 0; S.nicknameUntil = 0; }
    if (p) refreshProfileLimits();
    html("top-avatar", p ? avatar(p).replace(/^<span[^>]*>|<\/span>$/g, "") : "Y");
    $("top-account-label").textContent = p ? p.username : "Войти";
    $$(".admin-only").forEach((el) => (el.hidden = !isAdmin()));

    if (p) {
      if (["ru", "uk", "en"].includes(p.language)) S.lang = p.language;
      if (["light", "dark"].includes(p.theme)) S.theme = p.theme;
    }
    setTheme(S.theme);
    setLanguage(S.lang);
    renderProfile();
    if (p) loadProfileMetrics(p.id);
    if (oldId !== user?.id) {
      S.notifications = [];
      S.status = null;
      S.aiUntil = 0;
      S.bugUntil = 0;
      S.openedProfile = null;
      S.profileRatings = {};
      S.aiHistory = [];
      S.aiImage = null;
      S.aiVideoFile = null;
      closeReview();
      S.latestReport = null;
      html(
        "ai-messages",
        '<div class="ai-answer"><b>ЯнеИИ ✦</b><p>Привет! Какой монтаж или эффект разберём?</p></div>',
      );
    }
    if (user && S.sb) {
      await Promise.allSettled([loadStats(), loadChat(), loadMySubmissions()]);
      loadAIHistory();
      loadLatestReport();
      if (!S.activityTimer) {
        S.activityTimer = setInterval(activityPulse, 60000);
      }
      activityPulse();
    } else {
      S.stats = [];
      S.chats = [];
      renderStats();
      renderChat();
    }
    renderVideos();
    await Promise.allSettled([refreshStatus(), loadNotifications(), loadAIConfig(), loadCounters()]);
    subscribeNotifications();
    if (S.page === "admin") renderAdmin();
  }
  async function loadProfiles() {
    if (!S.sb || !signed()) return;
    const { data, error } = await S.sb
      .from("profiles")
      .select(
        "id,username,display_name,avatar_url,role,created_at,activity_seconds,last_seen_at,is_banned,chat_muted_until,social_links",
      )
      .limit(1000);
    if (!error) S.profiles = data || [];
  }
  async function loadPublic() {
    if (!S.sb) return;
    const jobs = [
      S.sb.from("site_settings").select("*").eq("id", "main").maybeSingle(),
      S.sb.from("featured_videos").select("*").order("created_at", { ascending: false }).limit(30),
    ];
    const [settings, vids] = await Promise.all(jobs);
    if (!settings.error) S.settings = settings.data;
    if (!vids.error) S.videos = vids.data || [];
    renderRules();
    renderVideos();
    renderClippers();
    if (S.settings?.insert_download_url && safeUrl(S.settings.insert_download_url)) {
      $("insert-download").href = safeUrl(S.settings.insert_download_url);
      $("insert-download").hidden = false;
    }
  }
  function formatError(e) {
    return String(e?.message || e || "Неизвестная ошибка").slice(0, 250);
  }
  // Authentication, password reset and public profile.
  function authMode(mode) {
    S.authMode = mode;
    $$("[data-authmode]").forEach((b) => b.classList.toggle("active", b.dataset.authmode === mode));
    $("auth-nickname-label").hidden = mode !== "signup";
    $("auth-confirm-label").hidden = mode !== "signup";
    $("auth-password-label").hidden = mode === "reset";
    $("auth-password").required = mode !== "reset";
    $("auth-nickname").required = mode === "signup";
    $("auth-confirm").required = mode === "signup";
    $("auth-submit").textContent =
      mode === "signup" ? "Создать аккаунт" : mode === "reset" ? "Отправить письмо" : "Войти";
    $("auth-help").textContent =
      mode === "signup"
        ? "Для восстановления доступа нужен действительный email. Пароль хранится в Supabase Auth, не на сайте."
        : mode === "reset"
          ? "Получишь ссылку на email для сброса пароля."
          : "Email нужен для безопасного восстановления пароля.";
  }
  async function authSubmit(e) {
    e.preventDefault();
    if (!S.sb) return toast("Сначала настрой Supabase");
    const email = $("auth-email").value.trim(),
      password = $("auth-password").value,
      nick = $("auth-nickname").value.trim();
    let res;
    if (S.authMode === "signup") {
      if (password !== $("auth-confirm").value) return toast("Пароли не совпадают");
      if (!/^[a-zA-Z0-9_]{3,24}$/.test(nick)) return toast("Ник: 3–24 символа, латиница, цифры или _");
      res = await S.sb.auth.signUp({
        email,
        password,
        options: {
          data: { username: nick },
          emailRedirectTo: location.origin + location.pathname,
        },
      });
    } else if (S.authMode === "reset") {
      res = await S.sb.auth.resetPasswordForEmail(email, {
        redirectTo: location.origin + location.pathname,
      });
    } else res = await S.sb.auth.signInWithPassword({ email, password });
    if (res.error) return toast("Ошибка авторизации: " + formatError(res.error));
    $("auth-dialog").close();
    toast(
      S.authMode === "reset"
        ? "Проверь почту"
        : S.authMode === "signup" && !res.data.session
          ? "Проверь почту для подтверждения аккаунта"
          : "Успешный вход",
    );
    if (res.data?.user && res.data?.session) await setSession(res.data.user);
  }
  async function openProfile(id) {
    if (!S.sb || !checkAuth()) return;
    if (id) {
      const { data, error } = await S.sb
        .from("profiles")
        .select("id,username,display_name,avatar_url,role,created_at,activity_seconds,last_seen_at,social_links")
        .eq("id", id)
        .maybeSingle();
      if (error) return toast(formatError(error));
      S.openedProfile = data;
    } else S.openedProfile = S.profile;
    go("profile");
    renderProfile();
    loadProfileMetrics(S.openedProfile?.id);
    loadRatingProfile(S.openedProfile?.id);
    if (S.openedProfile?.id === S.user?.id) refreshProfileLimits();
  }
  function profileCopy(key) {
    const text = {
      ru: {confirm:"Подтвердить",cancel:"Отмена",title:"Подтвердите действие",changeAvatar:"Изменить аватарку",avatarReady:"Смена аватарки доступна",nicknameReady:"Смена никнейма доступна",avatarWait:"До смены аватарки:",nicknameWait:"До смены никнейма:",avatarConfirm:"Вы уверены, что хотите изменить аватарку? После подтверждения следующая смена будет доступна только через 30 минут",nicknameConfirm:"Вы уверены, что хотите изменить никнейм? После подтверждения следующая смена будет доступна только через 24 часа",choose:"Выбрать изображение",imageError:"Выберите JPEG, PNG или WebP до 10 МБ",avatarSaved:"Аватарка обновлена",working:"Обработка изображения…"},
      en: {confirm:"Confirm",cancel:"Cancel",title:"Confirm action",changeAvatar:"Change avatar",avatarReady:"Avatar change available",nicknameReady:"Nickname change available",avatarWait:"Next avatar change in:",nicknameWait:"Next nickname change in:",avatarConfirm:"Are you sure you want to change your avatar? After confirmation, the next change will be available in 30 minutes.",nicknameConfirm:"Are you sure you want to change your nickname? After confirmation, the next change will be available in 24 hours.",choose:"Choose an image",imageError:"Choose a JPEG, PNG or WebP image up to 10 MB",avatarSaved:"Avatar updated",working:"Processing image…"},
      uk: {confirm:"Підтвердити",cancel:"Скасувати",title:"Підтвердіть дію",changeAvatar:"Змінити аватарку",avatarReady:"Зміна аватарки доступна",nicknameReady:"Зміна нікнейму доступна",avatarWait:"До зміни аватарки:",nicknameWait:"До зміни нікнейму:",avatarConfirm:"Ви впевнені, що хочете змінити аватарку? Після підтвердження наступна зміна буде доступна лише через 30 хвилин.",nicknameConfirm:"Ви впевнені, що хочете змінити нікнейм? Після підтвердження наступна зміна буде доступна лише через 24 години.",choose:"Вибрати зображення",imageError:"Виберіть JPEG, PNG або WebP до 10 МБ",avatarSaved:"Аватарку оновлено",working:"Обробка зображення…"}
    };
    return (text[S.lang] || text.ru)[key];
  }
  let confirmationQueue = Promise.resolve();
  function customDialog(message, inputValue) {
    const run = () => new Promise(resolve => {
      const oldFocus = document.activeElement, dialog = document.createElement("dialog");
      dialog.className = "modal action-confirmation";
      dialog.setAttribute("aria-labelledby", "action-confirmation-title");
      dialog.setAttribute("aria-describedby", "action-confirmation-description");
      const translated = window.YANE_I18N?.translate(String(message)) || String(message);
      dialog.innerHTML = `<form method="dialog"><div class="action-confirmation-icon" aria-hidden="true">✦</div><h2 id="action-confirmation-title">${esc(profileCopy("title"))}</h2><p id="action-confirmation-description">${esc(translated)}</p>${inputValue !== undefined ? `<label><span class="sr-only">${esc(translated)}</span><input class="action-confirmation-input" type="${/парол|password/i.test(String(message)) ? "password" : "text"}" maxlength="1500" value="${esc(inputValue || "")}" autocomplete="off"/></label>` : ""}<div class="action-confirmation-buttons"><button class="btn btn-secondary" value="cancel" autofocus>${esc(profileCopy("cancel"))}</button><button class="btn btn-primary" value="confirm">${esc(profileCopy("confirm"))}</button></div></form>`;
      $("app").append(dialog);
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        const confirmed = dialog.returnValue === "confirm";
        const result = inputValue !== undefined ? confirmed ? dialog.querySelector("input").value : null : confirmed;
        dialog.remove();
        if (oldFocus?.isConnected) oldFocus.focus({preventScroll:true});
        resolve(result);
      };
      dialog.addEventListener("close", finish, {once:true});
      dialog.addEventListener("cancel", () => { dialog.returnValue = "cancel"; });
      dialog.addEventListener("click", e => {
        if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close("cancel"); }
      });
      dialog.showModal();
      if (inputValue !== undefined) dialog.querySelector("input").focus();
    });
    const task = confirmationQueue.then(run);
    confirmationQueue = task.catch(() => {});
    return task;
  }
  function customConfirm(message) { return customDialog(message); }
  function customPrompt(message, value = "") { return customDialog(message, value); }
  function remainingProfileTime(until) {
    const seconds = Math.max(0, Math.ceil((until - Date.now()) / 1000));
    return [Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60].map(n => String(n).padStart(2,"0")).join(":");
  }
  function updateProfileCooldowns() {
    const avatarLocked = S.avatarBusy || S.avatarUntil > Date.now(), nicknameLocked = S.nicknameUntil > Date.now();
    for (const id of ["profile-avatar-edit", "profile-avatar-choose"]) if ($(id)) $(id).disabled = !!avatarLocked;
    if ($("profile-avatar-choose")) $("profile-avatar-choose").textContent = profileCopy("choose");
    if ($("profile-name")) $("profile-name").readOnly = !!nicknameLocked;
    if ($("profile-avatar-cooldown")) $("profile-avatar-cooldown").textContent = S.avatarBusy ? profileCopy("working") : S.avatarUntil > Date.now() ? profileCopy("avatarWait") + " " + remainingProfileTime(S.avatarUntil) : profileCopy("avatarReady");
    if ($("profile-nickname-cooldown")) $("profile-nickname-cooldown").textContent = nicknameLocked ? profileCopy("nicknameWait") + " " + remainingProfileTime(S.nicknameUntil) : profileCopy("nicknameReady");
  }
  async function profileRequest(action, value, expectedUser) {
    if (expectedUser && S.user?.id !== expectedUser) throw new Error("Сессия изменилась. Открой профиль повторно.");
    if (typeof window.YANE_PROFILE_DEMO === "function") return window.YANE_PROFILE_DEMO(action, value);
    const session = await S.sb.auth.getSession();
    if (expectedUser && S.user?.id !== expectedUser) throw new Error("Сессия изменилась. Открой профиль повторно.");
    const token = session.data?.session?.access_token;
    if (!token) throw new Error("Для изменения профиля войди в аккаунт");
    const response = await fetch(cfg.profileFunction || "/api/profile", {
      method:action === "status" ? "GET" : "POST",
      headers:{Authorization:"Bearer " + token, "Content-Type":"application/json"},
      ...(action === "status" ? {} : {body:JSON.stringify({action,value})}),
      signal:AbortSignal.timeout(15000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 429 && data.retryAfter && (!expectedUser || expectedUser === S.user?.id)) {
        S[action === "avatar" ? "avatarUntil" : "nicknameUntil"] = Date.now() + data.retryAfter * 1000;
        updateProfileCooldowns();
      }
      throw new Error(data.error || "Не удалось изменить профиль. Проверь подключение и настройку сервера.");
    }
    return data;
  }
  function acceptProfileMutation(data) {
    if (data.profile && data.profile.id !== S.user?.id) return;
    S.avatarUntil = Number(data.avatarUntil) || 0;
    S.nicknameUntil = Number(data.nicknameUntil) || 0;
    if (data.profile) {
      S.profile = {...S.profile, ...data.profile};
      if (!S.openedProfile || S.openedProfile.id === S.user?.id) S.openedProfile = S.profile;
      const i = S.profiles.findIndex(x => x.id === S.profile.id);
      if (i >= 0) S.profiles[i] = {...S.profiles[i], ...S.profile};
      html("top-avatar", avatar(S.profile).replace(/^<span[^>]*>|<\/span>$/g, ""));
      $("top-account-label").textContent = S.profile.username;
    }
    updateProfileCooldowns();
  }
  async function refreshProfileLimits() {
    if (!S.user || !S.profile) return;
    const uid = S.user.id;
    try { const data = await profileRequest("status"); if (S.user?.id === uid) acceptProfileMutation(data); }
    catch (error) { console.warn("Profile limits:", error.message); }
  }
  async function changeProfileAvatar(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !signed() || S.avatarBusy || S.avatarUntil > Date.now()) return;
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type) || file.size > 10 * 1024 * 1024) return toast(profileCopy("imageError"), "warning");
    const uid = S.user.id;
    S.avatarBusy = true;
    updateProfileCooldowns();
    let url;
    try {
      url = URL.createObjectURL(file);
      const image = new Image();
      image.src = url;
      try { await image.decode(); } catch { throw new Error(profileCopy("imageError")); }
      if (!image.width || !image.height || image.width * image.height > 100000000) throw new Error(profileCopy("imageError"));
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 256;
      const ctx = canvas.getContext("2d"), size = Math.min(image.width,image.height);
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0,0,256,256);
      ctx.drawImage(image,(image.width-size)/2,(image.height-size)/2,size,size,0,0,256,256);
      const encoded = canvas.toDataURL("image/jpeg",0.86);
      if (encoded.length > 180000) throw new Error(profileCopy("imageError"));
      if (S.user?.id !== uid || !await customConfirm(profileCopy("avatarConfirm")) || S.user?.id !== uid) return;
      const result = await profileRequest("avatar",encoded,uid);
      if (S.user?.id !== uid) return;
      acceptProfileMutation(result);
      renderProfile();
      toast(profileCopy("avatarSaved"), "success");
    } catch (error) { toast(formatError(error), "error"); }
    finally { if(url) URL.revokeObjectURL(url); S.avatarBusy = false; updateProfileCooldowns(); }
  }
  function renderProfile() {
    if (!S.page || !$("profile-detail")) return;
    const p = S.openedProfile || S.profile;
    if (!p) {
      html("profile-detail", '<div class="empty">Войди, чтобы открыть свой профиль.</div>');
      $("profile-editor").hidden = true;
      return;
    }
    html(
      "profile-detail",
      `<div class="card"><div class="clipper-card">${S.user?.id === p.id ? `<button type="button" class="profile-avatar-edit" id="profile-avatar-edit" aria-label="${esc(profileCopy("changeAvatar"))}">${avatar(p)}<span class="profile-avatar-overlay">＋</span></button>` : avatar(p)}<div><h2><span translate="no">${esc(p.username)}</span></h2><span class="role-label">${roleLabel(p)}</span></div></div><div class="stat-cards" style="margin-top:18px"><div class="card"><span>Дата регистрации</span><strong style="font-size:14px">${esc(fmtDate(p.created_at).split(",")[0])}</strong></div><div class="card"><span>Реальная активность</span><strong>${Math.round((p.activity_seconds || 0) / 60)} мин</strong></div><div class="card"><span>Последняя активность</span><strong style="font-size:14px">${esc(fmtDate(p.last_seen_at))}</strong></div><div class="card"><span>Сообщений</span><strong>${S.profileMetrics[p.id] ? num(S.profileMetrics[p.id].message_count) : "—"}</strong></div><div class="card"><span>Опубликованных видео</span><strong>${S.profileMetrics[p.id] ? num(S.profileMetrics[p.id].video_count) : "—"}</strong></div><div class="card"><span>Просмотров в статистике</span><strong>${S.profileMetrics[p.id] ? num(S.profileMetrics[p.id].view_count) : "—"}</strong></div></div><div class="muted">${Object.entries(
        p.social_links || {},
      )
        .map(([k, v]) =>
          safeUrl(v) ? `<a href="${esc(safeUrl(v))}" target="_blank" rel="noopener noreferrer">${esc(k)} ↗</a>` : "",
        )
        .join("　")}</div></div>`,
    );
    $("profile-detail").insertAdjacentHTML(
      "beforeend",
      `<div class="card" id="profile-rating">${ratingProfileHTML(S.profileRatings?.[p.id])}</div>`,
    );
    const own = S.user?.id === p.id;
    $("profile-editor").hidden = !own;
    if (own) {
      $("profile-name").value = p.username || "";
      updateProfileCooldowns();
      $("profile-tiktok").value = p.social_links?.tiktok || "";
      $("profile-telegram").value = p.social_links?.telegram || "";
      updateProfileCooldowns();
    }
  }
  async function loadProfileMetrics(id) {
    if (!signed() || !id) return;
    const { data, error } = await S.sb.rpc("v11_public_profile_stats", {
      target_user: id,
    });
    if (!error && data?.[0]) {
      S.profileMetrics[id] = data[0];
      if (S.page === "profile" && (S.openedProfile?.id || S.profile?.id) === id) renderProfile();
    }
  }
  async function saveProfile(e) {
    e.preventDefault();
    if (!checkAuth("profile.edit") || S.profileSaving || S.profileConfirming) return;
    const uid = S.user.id;
    const name = $("profile-name").value.trim(), socials = {};
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(name)) return toast("Ник: 3–24 символа, A-Z, 0-9, _", "warning");
    for (const k of ["tiktok", "telegram"]) {
      const val = $("profile-" + k).value.trim();
      if (val) {
        if (!safeUrl(val)) return toast("Только HTTPS-ссылки");
        socials[k] = val;
      }
    }
    const changed = name !== S.profile.username;
    if (changed) {
      if (S.nicknameUntil > Date.now()) return toast(profileCopy("nicknameWait") + " " + remainingProfileTime(S.nicknameUntil), "warning");
      S.profileConfirming = true;
      let confirmed;
      try { confirmed = await customConfirm(profileCopy("nicknameConfirm")); }
      finally { S.profileConfirming = false; }
      if (!confirmed || S.user?.id !== uid) return;
    }
    S.profileSaving = true;
    const submit = $("profile-form").querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      if (changed) {
        const result = await profileRequest("nickname", name, uid);
        if (S.user?.id !== uid) return;
        acceptProfileMutation(result);
      }
      if (S.user?.id !== uid) return;
      const { error } = await S.sb.rpc("v11_update_profile", {
        new_name: S.profile.username,
        new_avatar: S.profile.avatar_url || "",
        new_socials: socials, new_language: S.lang, new_theme: S.theme,
      });
      if (error) throw error;
      if (S.user?.id !== uid) return;
      S.profile.social_links = socials;
      S.openedProfile = S.profile;
      renderProfile();
      toast("Профиль сохранён", "success");
    } catch (error) { toast(formatError(error), "error"); }
    finally { S.profileSaving = false; submit.disabled = false; updateProfileCooldowns(); }
  }
  async function activityPulse() {
    if (!signed() || document.hidden || Date.now() - S.lastAction > 150000) return;
    try {
      await S.sb.rpc("v11_activity_ping");
    } catch {}
  }
  // Chat with pagination, live updates, safe escaping, replies and reporting.
  async function loadChat(older = false) {
    if (!S.sb || !signed()) return;
    if (older && !S.oldest) return;
    let q = S.sb
      .from("chat_messages")
      .select("id,author_id,body,created_at,reply_to,removed")
      .eq("removed", false)
      .order("created_at", { ascending: false })
      .limit(35);
    if (older) q = q.lt("created_at", S.oldest);
    const { data, error } = await q;
    if (error) {
      html("chat-stream", '<div class="empty">Ошибка чата: ' + esc(error.message) + "</div>");
      return;
    }
    const rows = (data || []).reverse();
    if (older) {
      const prior = new Set(S.chats.map((x) => x.id));
      S.chats = [...rows.filter((x) => !prior.has(x.id)), ...S.chats];
    } else {
      const first = rows[0]?.created_at;
      const keep = rows.length < 35 ? [] : S.chats.filter((x) => first && x.created_at < first);
      const map = new Map(keep.map((x) => [x.id, x]));
      rows.forEach((x) => map.set(x.id, x));
      S.chats = [...map.values()].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }
    S.oldest = S.chats[0]?.created_at || null;
    S.hasMore = (data || []).length === 35;
    $("older-chat").hidden = !S.hasMore;
    await loadProfiles();
    renderChat(older);
  }
  function renderChat(older = false) {
    const box = $("chat-stream"),
      pinned = isPinned(box),
      top = box.scrollTop,
      height = box.scrollHeight;
    if (!signed()) {
      box.innerHTML = '<div class="empty">Войди, чтобы читать чат и отправлять сообщения.</div>';
      return;
    }
    const byId = new Map(S.profiles.map((x) => [x.id, x])),
      msgs = new Map(S.chats.map((x) => [x.id, x]));
    if (!S.chats.length) {
      box.innerHTML = '<div class="empty">Пока сообщений нет. Начни общение!</div>';
      return;
    }
    box.querySelector(".empty")?.remove();
    let added = 0;
    for (const m of S.chats) {
      let el = box.querySelector(`[data-message-id="${CSS.escape(String(m.id))}"]`);
      if (m.removed) {
        el?.remove();
        continue;
      }
      const u = byId.get(m.author_id),
        reply = m.reply_to ? msgs.get(m.reply_to) : null;
      const body = `<div class="bubble-header">${avatar(u)}<button data-user="${esc(m.author_id)}"><span translate="no">${esc(u?.username || "Участник")}</span></button><span class="role-label">${esc(roleLabel(u))}</span><time class="muted">${esc(fmtDate(m.created_at))}</time></div>${reply ? `<small class="muted" translate="no">↩ ${esc(reply.body.slice(0, 100))}</small>` : ""}<div class="bubble-text" translate="no">${esc(m.body)}</div><div class="bubble-actions"><button data-reply="${esc(m.id)}">↩ Ответить</button>${m.author_id !== S.user.id ? `<button data-report-message="${esc(m.id)}">⚑ Жалоба</button>` : ""}${isAdmin() ? `<button data-delete-message="${esc(m.id)}">✕ Удалить</button>` : ""}</div>`;
      if (!el) {
        el = document.createElement("article");
        el.dataset.messageId = m.id;
        el.className = "chat-bubble message-enter " + (m.author_id === S.user.id ? "mine" : "");
        el.innerHTML = body;
        const next = S.chats
          .slice(S.chats.indexOf(m) + 1)
          .map((x) => box.querySelector(`[data-message-id="${CSS.escape(String(x.id))}"]`))
          .find(Boolean);
        box.insertBefore(el, next || null);
        added++;
      } else if (el.innerHTML !== body) el.innerHTML = body;
    }
    box.querySelectorAll("[data-message-id]").forEach((el) => {
      if (!msgs.has(el.dataset.messageId)) el.remove();
    });
    if (older) box.scrollTop = top + (box.scrollHeight - height);
    else if (pinned) box.scrollTop = box.scrollHeight;
    else if (added) $("chat-new-messages").hidden = false;
  }
  async function sendChat() {
    if (!checkAuth("chat.send")) return;
    const body = $("chat-input").value.trim();
    if (!body || body.length > 1000) return toast("Сообщение: от 1 до 1000 символов");
    $("chat-send").disabled = true;
    try {
      const { error } = await S.sb.from("chat_messages").insert({ author_id: S.user.id, body, reply_to: S.reply });
      if (error) throw error;
      $("chat-input").value = "";
      S.reply = null;
      $("chat-reply").hidden = true;
      await loadChat();
    } catch (e) {
      toast(formatError(e));
    } finally {
      $("chat-send").disabled = false;
    }
  }
  function openReport(id) {
    if (!checkAuth("chat.report")) return;
    $("report-message-id").value = id;
    $("report-comment").value = "";
    $("report-dialog").showModal();
  }
  async function submitReport(e) {
    e.preventDefault();
    if (!checkAuth()) return;
    const reason = $("report-reason").value,
      comment = $("report-comment").value.trim(),
      text = (reason + (comment ? " — " + comment : "")).slice(0, 250);
    const { error } = await S.sb.from("chat_reports").insert({
      reporter_id: S.user.id,
      message_id: $("report-message-id").value,
      reason: text,
    });
    if (error) return toast(error.code === "23505" ? "Ты уже пожаловался на это сообщение" : formatError(error));
    $("report-dialog").close();
    toast("Жалоба отправлена в администрацию");
  }
  async function deleteChat(id) {
    if (!requireAdmin() || !await customConfirm("Скрыть сообщение для всех?")) return;
    const { error } = await S.sb.rpc("v11_delete_message", { message_id: id });
    if (error) return toast(formatError(error));
    await loadChat();
    toast("Сообщение скрыто");
  }
  // Videos and submissions use only real admin-approved URLs.
  async function loadVideos() {
    if (!S.sb) {
      renderVideos();
      return;
    }
    const { data, error } = await S.sb
      .from("featured_videos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25);
    if (!error) S.videos = data || [];
    renderVideos();
    if (signed()) loadMySubmissions();
  }
  function player(url) {
    const href = safeUrl(url);
    if (!href) return '<div class="video-preview">▣</div>';
    try {
      const u = new URL(href),
        host = u.hostname.replace(/^www\./, "");
      let id = "";
      if (host === "youtu.be") id = u.pathname.split("/")[1];
      else if (["youtube.com", "m.youtube.com"].includes(host))
        id = u.searchParams.get("v") || u.pathname.match(/^\/shorts\/([^/]+)/)?.[1];
      if (id && /^[\w-]{11}$/.test(id))
        return `<div class="video-preview"><iframe loading="lazy" title="YouTube video" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`;
      if (u.pathname.toLowerCase().endsWith(".mp4"))
        return `<div class="video-preview"><video controls preload="metadata" playsinline src="${esc(href)}"></video></div>`;
    } catch {}
    return '<div class="video-preview">▶</div>';
  }
  function videoCard(v) {
    return `<article class="card video-card">${player(v.source_url)}<h3><span translate="no">${esc(v.title)}</span></h3><p>Автор: ${esc(v.author)}</p><p><span translate="no">${esc(v.description || "")}</span></p><div class="meta">${esc(fmtDate(v.created_at))}</div><div class="video-actions"><a class="btn btn-secondary" href="${esc(safeUrl(v.source_url) || "#")}" target="_blank" rel="noopener noreferrer">Смотреть оригинал ↗</a><button class="btn btn-secondary" data-ai-video="${esc(v.id)}">✦ Обсудить с ЯнеИИ</button></div></article>`;
  }
  function renderVideos() {
    const list = S.videos.length
      ? S.videos.map(videoCard).join("")
      : '<div class="empty">Пока нет одобренных роликов. Участники могут предложить свои работы.</div>';
    html("featured-videos", list);
    html(
      "home-videos",
      S.videos.length
        ? S.videos.slice(0, 3).map(videoCard).join("")
        : '<div class="empty">Здесь появятся проверенные видео участников.</div>',
    );
  }
  async function sendSubmission(e) {
    e.preventDefault();
    if (!checkAuth("videos.submit")) return;
    const f = new FormData(e.target),
      url = safeUrl(f.get("source_url"));
    if (!url) return toast("Укажи правильную HTTPS-ссылку");
    const { error } = await S.sb.from("video_submissions").insert({
      author_id: S.user.id,
      title: String(f.get("title")).trim(),
      description: String(f.get("description") || "").trim(),
      author_credit: String(f.get("author_credit")).trim(),
      source_url: url,
    });
    if (error) return toast(formatError(error));
    $("submission-dialog").close();
    e.target.reset();
    toast("Заявка отправлена администраторам");
    loadMySubmissions();
  }
  async function loadMySubmissions() {
    if (!signed()) {
      $("my-submissions-card").hidden = true;
      return;
    }
    const { data, error } = await S.sb
      .from("video_submissions")
      .select("title,status,review_reason,created_at")
      .eq("author_id", S.user.id)
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) return;
    $("my-submissions-card").hidden = false;
    html(
      "my-submissions",
      data?.length
        ? `<div class="table-scroll"><table><thead><tr><th>Название</th><th>Дата</th><th>Решение</th><th>Комментарий</th></tr></thead><tbody>${data.map((v) => `<tr><td><span translate="no">${esc(v.title)}</span></td><td>${esc(fmtDate(v.created_at))}</td><td>${esc(v.status)}</td><td>${esc(v.review_reason || "—")}</td></tr>`).join("")}</tbody></table></div>`
        : "<p>Заявок пока нет.</p>",
    );
  }
  async function loadClippers() {
    if (S.sb && signed()) await loadProfiles();
    renderClippers();
    await loadLeaderboard();
  }
  function renderClippers() {
    const list = S.profiles.filter((x) => x.role === "clipper"),
      cap = Number(S.settings?.capacity || 10);
    $("clippers-capacity").textContent = list.length + " / " + cap;
    html(
      "clippers-list",
      list.length
        ? list
            .map(
              (p) =>
                `<div class="card clipper-card">${avatar(p)}<div><b><span translate="no">${esc(p.username)}</span></b><small class="muted">🎬 Основной нарезчик</small><button class="link-btn" data-user="${esc(p.id)}">Открыть профиль →</button></div></div>`,
            )
            .join("")
        : '<div class="empty">Основной состав ещё не назначен администратором.</div>',
    );
  }
  const RULE_TOPICS = [
    ['official_rules','Правила Янехера','Официальные правила не опубликованы. Администрация добавит только подтверждённые материалы.'],
    ['extra_rules','Правила сообщества','Дополнительные правила пока не опубликованы администрацией.'],
    ['chat_rules','Правила чата','Уважайте участников. Не отправляйте спам и угрозы. Используйте кнопку «Жалоба» возле сообщения, если заметили нарушение.'],
    ['video_rules','Публикация видео','Предлагайте только работы, на которые у вас есть права или разрешение автора. Подборка модерируется.']
  ];
  function renderRules() {
    const s = S.settings;
    html(
      "rules-boxes",
      RULE_TOPICS.map(([key,title,fallback],i)=>`<article class="card rule-topic"><span class="rule-number">0${i+1}</span><h3>${title}</h3><p class="rule-copy" ${s?.[key] ? 'translate="no"' : ''}>${esc(s?.[key] || fallback)}</p></article>`).join(''),
    );
    $("rules-banner").hidden = !s?.banner_path;
    if (s?.banner_path && S.sb) {
      const pub = S.sb.storage.from("banners").getPublicUrl(s.banner_path);
      if (pub.data?.publicUrl) {
        $("rules-image").src = pub.data.publicUrl;
        $("rules-download").href = pub.data.publicUrl;
        $("rules-download").download = s.banner_path.split("/").pop() || "banner.png";
      }
    }
  }
  // Cloud-based per-user video tracker; 5,000-view threshold and real role-based earnings.
  async function loadStats() {
    if (!signed()) {
      S.stats = [];
      renderStats();
      return;
    }
    const { data, error } = await S.sb
      .from("video_stats")
      .select("*")
      .eq("owner_id", S.user.id)
      .order("posted_on", { ascending: false })
      .limit(1000);
    if (error) {
      toast("Календарь: " + formatError(error));
      return;
    }
    S.stats = data || [];
    renderStats();
    legacyNotice();
    if (S.profile?.role === "clipper" && !S.fx) fetchRates();
  }
  function activeStats() {
    return S.stats.filter((x) => x.posted_on?.startsWith(S.month));
  }
  function calculated() {
    const valid = S.stats.filter((x) => Number(x.views) >= 5000),
      sum = valid.reduce((a, x) => a + Number(x.views), 0),
      earn = (sum * 150) / 1e6;
    return { valid, sum, earn };
  }
  function monthLabel(month) {
    return new Date(month + "-01T12:00:00").toLocaleDateString(
      S.lang === "en" ? "en-GB" : S.lang === "uk" ? "uk-UA" : "ru-RU",
      { month: "long", year: "numeric" },
    );
  }
  function amount(usd) {
    const cur = S.lang === "ru" ? "RUB" : S.lang === "uk" ? "UAH" : "USD";
    if (cur === "USD") return "$" + money(usd);
    const rate = S.fx?.rates?.[cur];
    return Number.isFinite(rate)
      ? (usd * rate).toLocaleString(S.lang === "ru" ? "ru-RU" : "uk-UA", {
          style: "currency",
          currency: cur,
          maximumFractionDigits: 2,
        })
      : "$" + money(usd) + " (нет курса " + cur + ")";
  }
  async function fetchRates() {
    try {
      const resp = await fetch("https://open.er-api.com/v6/latest/USD", {
        cache: "no-store",
        signal: AbortSignal.timeout(7000),
      });
      const data = await resp.json();
      if (data.result !== "success" || !Number.isFinite(data.rates?.UAH) || !Number.isFinite(data.rates?.RUB)) return;
      S.fx = data;
      renderStats();
    } catch (e) {
      console.warn("FX unavailable, USD fallback");
    }
  }
  function renderStats() {
    if (C.initialized) renderWidgetBasics();
    if (!$("stats-title")) return;
    const clipper = S.profile?.role === "clipper",
      list = activeStats(),
      eligible = list.filter((x) => Number(x.views) >= 5000),
      views = eligible.reduce((s, x) => s + Number(x.views), 0),
      global = calculated(),
      earned = (views * 150) / 1e6;
    $("stats-title").textContent = clipper ? "💰 Мой заработок" : "Путь к 500 000 просмотров";
    $("stats-hint").textContent = clipper
      ? "⚠️ Доход расчётный: $150 за 1 000 000 просмотров. Учитываются видео от 5 000 просмотров. Фактическая выплата может отличаться."
      : "⚠️ В статистику засчитываются только видео от 5 000 просмотров.";
    const today = new Date(),
      weekago = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
      todayISO = new Date().toISOString().slice(0, 10);
    const summ = clipper
      ? [
          [
            "За сегодня",
            amount(
              global.valid.filter((x) => x.posted_on === todayISO).reduce((s, x) => s + Number(x.views), 0) * 0.00015,
            ),
          ],
          [
            "За 7 дней",
            amount(
              global.valid.filter((x) => x.posted_on >= weekago).reduce((s, x) => s + Number(x.views), 0) * 0.00015,
            ),
          ],
          ["За месяц", amount(earned)],
          ["За всё время", amount(global.earn)],
          ["Всего просмотров", num(global.sum)],
          ["Засчитанных роликов", num(global.valid.length)],
        ]
      : [
          ["Просмотры месяца", num(views)],
          ["Прогресс", Math.min(100, Math.round((views / 500000) * 100)) + "%"],
          ["До цели", num(Math.max(0, 500000 - views))],
          ["Засчитано видео", num(eligible.length)],
          ["Всего роликов", num(list.length)],
        ];
    html(
      "stat-summary",
      summ.map(([k, v]) => `<div class="card"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join(""),
    );
    $("home-progress-title").textContent = !signed()
      ? "Войди, чтобы увидеть личную статистику."
      : clipper
        ? "Ориентировочный доход за всё время"
        : "Путь к 500 000 просмотров";
    $("home-progress-value").textContent = !signed()
      ? "—"
      : clipper
        ? amount(global.earn)
        : num(global.sum) + " / 500 000";
    $("home-progress-bar").style.width = clipper ? "0%" : Math.min(100, (global.sum / 500000) * 100) + "%";
    $("month-title").textContent = monthLabel(S.month);
    const year = Number(S.month.slice(0, 4)),
      month = Number(S.month.slice(5, 7)) - 1,
      nDays = new Date(year, month + 1, 0).getDate(),
      before = (new Date(year, month, 1).getDay() + 6) % 7,
      perDay = new Map();
    for (const x of list) {
      const day = Number(x.posted_on.slice(-2));
      perDay.set(day, (perDay.get(day) || 0) + (Number(x.views) >= 5000 ? Number(x.views) : 0));
    }
    html(
      "calendar-days",
      "<span></span>".repeat(before) +
        Array.from({ length: nDays }, (_, i) => {
          const day = i + 1,
            vc = perDay.get(day) || 0;
          return `<button data-stat-day="${day}" title="${day}: ${num(vc)}"><b>${day}</b><small>${vc ? (clipper ? amount(vc * 0.00015) : num(vc)) : "—"}</small></button>`;
        }).join(""),
    );
    html(
      "stats-journal",
      list.length
        ? `<div class="table-scroll"><table><thead><tr><th>Дата</th><th>Видео</th><th>Просмотры</th><th>${clipper ? "Доход" : "Статус"}</th><th>Действия</th></tr></thead><tbody>${list.map((x) => `<tr><td>${esc(x.posted_on)}</td><td>${esc(x.title)}</td><td>${num(x.views)}</td><td>${Number(x.views) >= 5000 ? (clipper ? esc(amount(Number(x.views) * 0.00015)) : "✓ Засчитано") : "Не достигнут порог 5000"}</td><td><div class="table-actions"><button data-edit-stat="${esc(x.id)}">Изменить</button><button data-delete-stat="${esc(x.id)}">Удалить</button></div></td></tr>`).join("")}</tbody></table></div>`
        : '<div class="empty">За выбранный месяц видео пока не добавлены.</div>',
    );
    if (clipper) {
      const el = $("stats-hint");
      el.textContent +=
        " " +
        (S.fx?.time_last_update_utc
          ? "Курс USD от " + S.fx.time_last_update_utc + "."
          : S.lang !== "en"
            ? "Конвертация недоступна — показываем USD."
            : "");
    }
  }
  async function saveStat(e) {
    e.preventDefault();
    if (!checkAuth()) return;
    const id = $("stat-id").value,
      title = $("stat-name").value.trim(),
      date = $("stat-date").value,
      views = Number($("stat-views").value),
      link = $("stat-url").value.trim();
    if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isSafeInteger(views) || views < 0 || views > 1e10)
      return toast("Неверные данные записи");
    if (link && !safeUrl(link)) return toast("Ссылка должна начинаться с HTTPS");
    const data = { title, posted_on: date, views, source_url: link || null };
    const req = id
      ? S.sb.from("video_stats").update(data).eq("id", id).eq("owner_id", S.user.id)
      : S.sb.from("video_stats").insert({ ...data, owner_id: S.user.id });
    const { error } = await req;
    if (error) return toast(formatError(error));
    $("stat-form").reset();
    $("stat-id").value = "";
    $("stats-form-title").textContent = "Добавить опубликованный ролик";
    toast(views < 5000 ? "Сохранено. Пока меньше 5000 — в прогресс не засчитывается." : "Видео сохранено");
    loadStats();
  }
  function editStat(id) {
    const v = S.stats.find((x) => x.id === id);
    if (!v) return;
    go("stats");
    $("stat-id").value = v.id;
    $("stat-name").value = v.title;
    $("stat-date").value = v.posted_on;
    $("stat-views").value = v.views;
    $("stat-url").value = v.source_url || "";
    $("stats-form-title").textContent = "Редактирование видео";
    $("stat-form").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  async function deleteStat(id) {
    if (!checkAuth() || !await customConfirm("Удалить запись видео?")) return;
    const { error } = await S.sb.from("video_stats").delete().eq("id", id).eq("owner_id", S.user.id);
    if (error) return toast(formatError(error));
    loadStats();
  }
  function shiftMonth(n) {
    const [y, m] = S.month.split("-").map(Number),
      d = new Date(y, m - 1 + n, 1);
    S.month = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    renderStats();
  }
  function legacyNotice() {
    if (!signed()) return;
    try {
      const raw = JSON.parse(localStorage.getItem("YaneCLIBB_v9_records") || "null");
      const exists = Array.isArray(raw?.entries) && raw.entries.length > 0;
      const flag = localStorage.getItem("ycl11-imported-" + S.user.id);
      $("stat-import").hidden = !(exists && !flag);
    } catch {
      $("stat-import").hidden = true;
    }
  }
  async function importLegacy() {
    if (!checkAuth()) return;
    if (!await customConfirm("Импортировать старые записи текущего браузера в этот аккаунт? Убедись, что это твои данные.")) return;
    try {
      const raw = JSON.parse(localStorage.getItem("YaneCLIBB_v9_records") || "null");
      let imported = 0;
      for (const item of raw?.entries || []) {
        const date = item.date,
          views = Number(item.views);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isSafeInteger(views) || views < 0) continue;
        const legacyId = String(item.id || date + "-" + imported).slice(0, 150);
        const { error } = await S.sb.from("video_stats").upsert(
          {
            owner_id: S.user.id,
            posted_on: date,
            title: String(item.title || "Видео из v10").slice(0, 120),
            views,
            legacy_id: legacyId,
          },
          { onConflict: "owner_id,legacy_id" },
        );
        if (error) throw error;
        imported++;
      }
      localStorage.setItem("ycl11-imported-" + S.user.id, "1");
      toast("Перенесено записей: " + imported);
      await loadStats();
    } catch (e) {
      toast("Импорт: " + formatError(e));
    }
  }
  // Editable lessons from Supabase, with language-specific content when available.
  function bundledLessons(){return (window.YANE_LESSONS||[]).map(x=>({...x,_bundled:true}));}
  async function loadLessons() {
    if (!S.sb) {
      renderLessons();
      return;
    }
    const { data, error } = await S.sb.from("lessons").select("*").order("sort_order", { ascending: true }).limit(250);
    if(error){
      S.lessons=bundledLessons();S.schoolFallback=true;renderLessons();
      toast('Серверные уроки недоступны. Открыта встроенная библиотека; прогресс сохраняется только в этом браузере.','warning');return;
    }
    S.schoolFallback=!(data||[]).length;
    S.lessons=data?.length?data:bundledLessons();
    renderLessons();
  }
  function localized(obj) {
    return String(obj?.[S.lang] || obj?.ru || obj?.en || obj?.uk || "");
  }
  function renderLessons() {
    if(!S.lessons.length&&!S.sb)S.lessons=bundledLessons();
    const old=$('school-category').value||'all',level=$('school-level').value||'all',cats=[...new Set(S.lessons.map(x=>x.category))];
    html('school-category','<option value="all">Все направления</option>'+cats.map(x=>`<option value="${esc(x)}">${esc(window.YANE_I18N?.translate(x)||x)}</option>`).join(''));
    const category=cats.includes(old)?old:'all';$('school-category').value=category;
    const query=($('school-search')?.value||'').trim().toLocaleLowerCase();
    const filtered=S.lessons.filter(x=>(category==='all'||x.category===category)&&(level==='all'||x.difficulty===level)&&(!query||[localized(x.title_i18n),localized(x.summary_i18n),window.YANE_I18N?.translate(x.category)||x.category].join(' ').toLocaleLowerCase().includes(query)));
    let completed=[];try{completed=JSON.parse(localStorage.getItem('ycl-local-lessons')||'[]');if(!Array.isArray(completed))completed=[];}catch{}
    html('school-overview',`<div><strong>Твоя школа монтажа</strong><p>От первого ролика до анимации, звука и публикации.</p></div><span class="school-count">${S.lessons.length} <small>уроков</small></span>`);
    html('school-categories',`<button data-school-category="all" aria-pressed="${category==='all'}">Все направления</button>`+cats.map(x=>`<button data-school-category="${esc(x)}" aria-pressed="${category===x}">${esc(window.YANE_I18N?.translate(x)||x)} <small>${S.lessons.filter(l=>l.category===x).length}</small></button>`).join(''));
    html('lessons-list',filtered.length?filtered.map(l=>`<article class="card lesson-card"><span class="tag">${esc(window.YANE_I18N?.translate(l.category)||l.category)}</span><span class="tag">${esc(levelLabel(l.difficulty))}</span><h3 translate="no">${esc(localized(l.title_i18n))}</h3><p translate="no">${esc(localized(l.summary_i18n))}</p><button class="btn btn-secondary" data-lesson="${esc(l.id)}">${completed.includes(l.id)&&l._bundled?'✓ ':''}Читать урок →</button></article>`).join(''):'<div class="empty">Ничего не найдено. Измени запрос или сбрось фильтры.</div>');
    S.openLesson=null;revealCards();
  }
  function levelLabel(level){return ({beginner:'Начинающий',intermediate:'Средний',advanced:'Продвинутый'})[level]||level;}
  function openLesson(id) {
    const l=S.lessons.find(x=>x.id===id);if(!l)return;
    S.openLesson=id;S.page='school';$$('.screen').forEach(el=>el.classList.toggle('active',el.id==='screen-school'));$$('[data-nav]').forEach(el=>el.classList.toggle('nav-active',el.dataset.nav==='school'));history.replaceState(null,'','#school');
    html('lessons-list',`<article class="card lesson-reader"><button class="btn btn-secondary" id="lesson-back">← Все уроки</button><h2 translate="no">${esc(localized(l.title_i18n))}</h2><span class="role-label">${esc(window.YANE_I18N?.translate(l.category)||l.category)} · ${esc(levelLabel(l.difficulty))}</span><div class="lesson-detail" translate="no">${esc(localized(l.content_i18n))}</div>${safeUrl(l.video_url)?`<a href="${esc(safeUrl(l.video_url))}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">Открыть видеоурок ↗</a>`:''}<div class="table-actions"><button class="btn btn-secondary" data-ask-lesson="${esc(l.id)}">✦ Спросить ЯнеИИ</button><button class="btn btn-primary" data-complete-lesson="${esc(l.id)}">✓ Урок пройден</button></div><small class="muted">${l._bundled?'Отметка сохраняется только в этом браузере.':'Личная отметка обучения не подтверждает выполнение задания и по умолчанию не даёт очков рейтинга.'}</small></article>`);
  }
  function diagnosticStepsState() {
    try { const value = JSON.parse(localStorage.getItem("ycl-diagnostic-steps") || "{}"); return value && typeof value === "object" && !Array.isArray(value) ? value : {}; } catch { return {}; }
  }
  function renderDiagnostics() {
    const cats = [
      ["all", "diagnostics", "Все проблемы"], ["export", "videos", "Экспорт"],
      ["sound", "audio", "Звук"], ["quality", "videos", "Картинка"],
      ["editor", "school", "Редактор"], ["publish", "videos", "Публикация"], ["start", "ai", "Начало"],
    ];
    S.diagCategory = cats.some(([key]) => key === S.diagCategory) ? S.diagCategory : "all";
    const translate = value => window.YANE_I18N?.translate(value) || value;
    const query = ($("diagnostic-search")?.value || "").trim().toLocaleLowerCase();
    const state = diagnosticStepsState();
    html("diagnostic-categories", cats.map(([key, icon, label]) => `<button class="category-card ${S.diagCategory === key ? "active" : ""}" data-diag-category="${key}" aria-pressed="${S.diagCategory === key}"><b>${uiIcon(icon)}</b><span>${esc(label)}</span><small>${key === "all" ? diagnosticData.length : diagnosticData.filter(d => d[0] === key).length}</small></button>`).join(""));
    const problems = diagnosticData.map((data, index) => ({data, index})).filter(({data}) =>
      (S.diagCategory === "all" || data[0] === S.diagCategory) && (!query || data.slice(1).flat().some(text => translate(String(text)).toLocaleLowerCase().includes(query) || String(text).toLocaleLowerCase().includes(query)))
    );
    html("diagnostic-result-count", `<span>Показано проблем:</span> <strong>${problems.length}</strong> / ${diagnosticData.length}`);
    html("diagnostics-list", problems.length ? `<div class="diagnostic-grid">${problems.map(({data: [cat, title, symptom, cause, steps, tip], index}) => {
      const checked = Array.isArray(state[index]) ? state[index] : [];
      const category = cats.find(([key]) => key === cat);
      return `<details class="diag-item" data-diagnostic="${index}"><summary><span class="diag-summary-text"><small>${esc(category?.[2] || cat)}</small><span>${esc(title)}</span></span><i>${uiIcon("chevron")}</i></summary><div class="diag-content"><div class="diag-context"><div><span class="eyebrow">СИМПТОМ</span><p>${esc(symptom)}</p></div><div><b>Возможная причина</b><p>${esc(cause)}</p></div></div><div class="diag-plan-head"><b>План решения</b><span><span>Шаги выполнены</span> <strong data-diag-progress="${index}">${steps.filter((_, n) => checked.includes(n)).length} / ${steps.length}</strong></span></div><ol class="diagnostic-steps">${steps.map((step, n) => `<li class="${checked.includes(n) ? "step-checked" : ""}"><label><input type="checkbox" data-diag-step="${index}" data-step-index="${n}" ${checked.includes(n) ? "checked" : ""}/><span>${esc(step)}</span></label></li>`).join("")}</ol><div class="info-notice">Совет: ${esc(tip)}</div><div class="diag-utilities"><button class="link-btn" data-diag-copy="${index}">Скопировать план</button><button class="link-btn" data-diag-reset="${index}">Сбросить шаги</button></div><small class="muted">Контрольный список сохраняется на этом устройстве.</small><div class="table-actions"><button class="btn btn-secondary" data-ask-faq="${esc(title)}">✦ Разобрать с ЯнеИИ</button><button class="btn btn-secondary" data-go="school">Уроки →</button><button class="link-btn" data-go="chat">Помощь в чате</button><button class="link-btn" data-open-bug>Сообщить об ошибке</button></div></div></details>`;
    }).join("")}</div>` : `<div class="diag-empty"><span>${uiIcon("diagnostics")}</span><h3>По этому запросу ничего не найдено</h3><p>Попробуй другое слово или выбери все категории.</p><button class="btn btn-secondary" data-diag-clear>Сбросить фильтры</button></div>`);
  }
  function saveDiagnosticStep(input) {
    const index = Number(input.dataset.diagStep), step = Number(input.dataset.stepIndex);
    if (!diagnosticData[index]?.[4]?.[step]) return;
    const state = diagnosticStepsState(), checked = new Set(Array.isArray(state[index]) ? state[index] : []);
    if (input.checked) checked.add(step); else checked.delete(step);
    state[index] = [...checked];
    try { localStorage.setItem("ycl-diagnostic-steps", JSON.stringify(state)); } catch { toast("Не удалось сохранить настройки на этом устройстве", "warning"); }
    input.closest("li").classList.toggle("step-checked", input.checked);
    const progress = document.querySelector(`[data-diag-progress="${index}"]`);
    if (progress) progress.textContent = `${checked.size} / ${diagnosticData[index][4].length}`;
  }
  // Gemini API: requests are authenticated and server-side account cooldown is atomic.
  async function loadAIHistory() {
    if (!signed()) return;
    const { data, error } = await S.sb
      .from("ai_messages")
      .select("id,question,answer,created_at")
      .eq("owner_id", S.user.id)
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) return;
    S.aiHistory = (data || []).reverse().flatMap((x) => [
      { role: "user", content: x.question },
      { role: "assistant", content: x.answer },
    ]);
    renderAIHistory();
  }
  function renderAIHistory() {
    const box = $("ai-messages"),
      pinned = isPinned(box),
      top = box.scrollTop;
    const config = S.aiConfig || defaultAI;
    box.innerHTML = S.aiHistory.length
      ? S.aiHistory
          .map(
            (m) =>
              `<div class="${m.role === "user" ? "ai-question" : "ai-answer"}">${m.role === "assistant" ? "<b>ЯнеИИ ✦</b>" : ""}<p translate="no">${esc(m.content)}</p></div>`,
          )
          .join("")
      : `<div class="ai-answer greeting"><b>ЯнеИИ ✦</b><p>${esc(config.greeting)}</p></div>`;
    html(
      "ai-starters",
      !S.aiHistory.length
        ? (config.starters || [])
            .map((s) => `<button class="starter" data-starter="${esc(s)}">${esc(s)} <span>↗</span></button>`)
            .join("")
        : "",
    );
    if (pinned) box.scrollTop = box.scrollHeight;
    else box.scrollTop = top;
  }
  function cooldownLeft() {
    return Math.max(
      0,
      Math.ceil((Math.max(S.aiUntil || 0,Number(localStorage.getItem("yane-ai-until-"+(S.user?.id||"guest")))||0) - Date.now()) / 1000),
      S.profile?.ai_last_used ? Math.ceil((new Date(S.profile.ai_last_used).getTime() + 15000 - Date.now()) / 1000) : 0,
    );
  }
  function updateAICooldown() {
    const n = cooldownLeft();
    const label = n ? `◷ ${n} ${S.lang==='en'?'s':'с'}` : signed() ? ({ru:'Интервал между запросами — 15 с',uk:'Інтервал між запитами — 15 с',en:'Minimum request interval: 15 seconds'})[S.lang] : ({ru:'Гостевой режим: 25 с · Войди в аккаунт для интервала 15 с',uk:'Гостьовий режим: 25 с · Увійди для інтервалу 15 с',en:'Guest mode: 25 seconds · Sign in for a 15-second interval'})[S.lang];
    const node=$("ai-cooldown");node.setAttribute('translate','no');if(node.textContent!==label)node.textContent=label;
    $("ai-send").disabled = S.aiBusy || n > 0 || !!restriction("ai.send");
    const left = Math.max(0, Math.ceil(((S.bugUntil || 0) - Date.now()) / 1000));
    $("bug-wait").textContent = left
      ? "Следующее обращение через " + duration(left)
      : "Не чаще одного обращения в час.";
    $("bug-submit").disabled = !!S.bugBusy || left > 0;
    if ($("sanction-banner") && !$("sanction-banner").hidden) renderSanctions();
  }
  async function fileAsJpeg(file, limit = 99000) {
    return new Promise((resolve, reject) => {
      const img = new Image(),
        url = URL.createObjectURL(file);
      img.onload = () => {
        try {
          const c = document.createElement("canvas");
          let scale = Math.min(1, (limit > 100000 ? 1600 : 950) / Math.max(img.width, img.height)),
            quality = 0.82,
            output = "";
          for (let i = 0; i < 9; i++) {
            c.width = Math.max(1, Math.round(img.width * scale));
            c.height = Math.max(1, Math.round(img.height * scale));
            const context = c.getContext("2d");
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, c.width, c.height);
            context.drawImage(img, 0, 0, c.width, c.height);
            output = c.toDataURL("image/jpeg", quality);
            if (output.length <= limit) break;
            scale *= 0.84;
            quality = Math.max(0.48, quality * 0.9);
          }
          if (output.length > limit) throw Error("Изображение слишком сложное для обработки. Уменьши его размер.");
          resolve(output);
        } catch (e) {
          reject(e);
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(Error("Изображение не открылось"));
      };
      img.src = url;
    });
  }
  async function aiFileChanged() {
    const f = $("ai-file").files?.[0];
    if (!f) return;
    if (f.type.startsWith("video/")) {
      S.aiImage = null;
      if (!["video/mp4", "video/webm", "video/quicktime"].includes(f.type) || f.size > 60 * 1024 * 1024) {
        S.aiVideoFile = null;
        return toast("Видео: MP4, WebM или MOV до 60 МБ");
      }
      if (!cfg.videoWorkerUrl) {
        S.aiVideoFile = null;
        $("ai-file").value = "";
        $("ai-attachment").hidden = false;
        $("ai-attachment").textContent =
          "Анализ видео и звука готов в исходниках, но видеосервер ещё не подключён. Администратору нужно развернуть video-worker и указать videoWorkerUrl в config.js.";
        return;
      }
      S.aiVideoFile = f;
      $("ai-attachment").hidden = false;
      $("ai-attachment").textContent =
        "🎬 " +
        f.name +
        " (" +
        (f.size / 1048576).toFixed(1) +
        " МБ). Будет загружено на видеосервер и Google Gemini вместе со звуком.";
      return;
    }
    S.aiVideoFile = null;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type) || f.size > 8e6)
      return toast("Выбери JPEG/PNG/WebP до 8 МБ");
    try {
      S.aiImage = await fileAsJpeg(f);
      S.aiImageName = f.name;
      $("ai-attachment").hidden = false;
      $("ai-attachment").textContent = "📎 " + f.name + " — кадр прикреплён. Будет отправлен Gemini при вопросе.";
    } catch (e) {
      toast(formatError(e));
    }
  }
  function aiContext(question) {
    const r = S.latestReport;
    if (!r) return undefined;
    const match =
      question.match(/(?:^|\D)(\d{1,3})\s*(?:-?\s*(?:я|й|ой|st|nd|rd|th))?\s*(?:секунд|сек\.?|с\b|second|sec)/i) ||
      question.match(/(\d{1,2}):(\d{2})/);
    const time = match ? (match[2] !== undefined ? Number(match[1]) * 60 + Number(match[2]) : Number(match[1])) : null;
    let segments = r.semantic?.segments || [];
    if (time !== null) segments = segments.filter((s) => s.start <= time && s.end >= time);
    else segments = segments.slice(0, 4);
    const clean = segments.map((s) => ({
      start: s.start,
      end: s.end,
      analysis: s.analysis,
    }));
    return {
      metadata: r.metadata,
      audio: r.audio,
      sceneCuts: (r.sceneCuts || []).slice(0, 150),
      segments: clean,
    };
  }
  async function sendAI() {
    if (S.aiBusy || (signed() && !checkAuth("ai.send"))) return;
    if (S.aiVideoFile) return sendVideoAnalysis();
    const text = $("ai-question").value.trim();
    if (!text && !S.aiImage) return toast("Напиши вопрос или прикрепи фото", "warning");
    if (cooldownLeft() > 0) return toast("Следующий вопрос через " + cooldownLeft() + " с", "warning");
    const {
      data: { session },
    } = signed() ? await S.sb.auth.getSession() : {data:{session:null}};
    if (signed() && !session?.access_token) return toast("Сессия закончилась — войди снова", "warning");
    const uid = S.user?.id;
    S.aiBusy = true;
    setAIState("thinking", "Отправка запроса");
    updateAICooldown();
    $("ai-question").value = "";
    const question = text || "Проанализируй прикреплённое изображение";
    S.aiHistory.push({ role: "user", content: question });
    renderAIHistory();
    const el = document.createElement("div");
    el.className = "ai-answer message-enter streaming";
    el.innerHTML = "<b>ЯнеИИ ✦</b><p>Готовлю ответ…</p>";
    $("ai-messages").appendChild(el);
    scrollIfPinned($("ai-messages"));
    try {
      const res = await fetch(cfg.aiFunction || "/api/yaneai", {
        method: "POST",
        headers: { "content-type": "application/json", ...(session?.access_token ? {Authorization: "Bearer " + session.access_token} : {}) },
        body: JSON.stringify({
          message: text,
          history: S.aiHistory.slice(0, -1).slice(-12),
          frames: S.aiImage ? [{ time: 0, image: S.aiImage }] : [],
          language: S.lang,
          report: aiContext(text),
          stream: true,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        if (d.waitSeconds) S.aiUntil = Date.now() + d.waitSeconds * 1000;
        throw Error(d.error || "Ошибка ЯнеИИ (" + res.status + ")");
      }
      S.aiUntil = Date.now() + (signed()?15000:25000);
      localStorage.setItem("yane-ai-until-"+(S.user?.id||"guest"),String(S.aiUntil));
      setAIState("thinking", "Готовит ответ");
      let answer = "";
      await readNDJSON(res, (evt) => {
        if (S.user?.id !== uid) return;
        if (evt.t === "error") throw Error(evt.error);
        if (evt.t === "chunk") {
          setAIState("thinking", "Пишет ответ");
          const pin = isPinned($("ai-messages"));
          answer += evt.text;
          el.querySelector("p").setAttribute("translate", "no");
          el.querySelector("p").textContent = answer;
          if (pin) $("ai-messages").scrollTop = $("ai-messages").scrollHeight;
          else $("ai-new-messages").hidden = false;
        }
        if (evt.t === "done") answer = evt.answer;
      });
      if (S.user?.id !== uid) return;
      if (!answer) throw Error("Не получен текст ответа");
      S.aiHistory.push({ role: "assistant", content: answer });
      el.querySelector("p").setAttribute("translate", "no");
      el.querySelector("p").textContent = answer;
      el.classList.remove("streaming");
      setAIState("ready");
      S.aiImage = null;
      $("ai-file").value = "";
      $("ai-attachment").hidden = true;
      const { error } = signed() ? await S.sb
        .from("ai_messages")
        .insert({ owner_id: uid, question: question.slice(0, 4500), answer: answer.slice(0, 16000) }) : {error:null};
      if (error) toast("Ответ получен, но история не сохранилась: " + formatError(error), "warning");
    } catch (e) {
      if (S.user?.id === uid) {
        setAIState("error", "Не удалось получить ответ");
        S.aiHistory.push({ role: "assistant", content: "Ответ не получен. " + formatError(e) });
        el.classList.remove("streaming");
        el.querySelector("p").textContent = "Ответ не получен. " + formatError(e);
        $("ai-question").value = text;
        toast(formatError(e), "error");
      }
    } finally {
      S.aiBusy = false;
      updateAICooldown();
      refreshStatus();
    }
  }
  async function clearAI() {
    if(!signed()){S.aiHistory=[];renderAIHistory();return;}
    if (!checkAuth()) return;
    if (!await customConfirm("Удалить историю ЯнеИИ для этого аккаунта?")) return;
    const { error } = await S.sb.from("ai_messages").delete().eq("owner_id", S.user.id);
    if (error) return toast(formatError(error));
    S.aiHistory = [];
    renderAIHistory();
    toast("История удалена");
  }
  function askAI(question) {
    if (signed() && !checkAuth("ai.send")) return;
    go("ai");
    $("ai-question").value = question;
    $("ai-question").focus();
  }

  async function loadLatestReport() {
    if (!signed()) return;
    const { data, error } = await S.sb
      .from("ai_reports")
      .select("report")
      .eq("owner_id", S.user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (!error) {
      S.latestReport = data?.[0]?.report || null;
      if (S.latestReport?.copyright) renderCopyright(S.latestReport, null);
    }
  }
  function timestamp(seconds) {
    const n = Math.max(0, Number(seconds) || 0);
    return String(Math.floor(n / 60)).padStart(2, "0") + ":" + String(Math.floor(n % 60)).padStart(2, "0");
  }
  function videoReportText(report) {
    if (report.demo) return ({
      ru: "Демонстрационный отчёт. Ваш файл не передавался на сервер и не анализировался. Проигрыватель использует выбранное вами локальное видео. Для настоящего анализа подключите видеосервер.",
      en: "Demonstration report. Your file was not uploaded or analyzed. The player uses the local video you selected. Connect a video server for real analysis.",
      uk: "Демонстраційний звіт. Ваш файл не передавався на сервер і не аналізувався. Програвач використовує вибране вами локальне відео. Для справжнього аналізу підключіть відеосервер."
    })[S.lang] || "Demonstration report";
    const lines = [];
    const meta = report.metadata || {};
    lines.push("🎬 Полный анализ видео со звуком (Gemini + FFmpeg)");
    lines.push(
      "Длительность: " +
        timestamp(meta.duration) +
        " · " +
        (meta.width || "?") +
        "×" +
        (meta.height || "?") +
        " · " +
        (meta.fps ?? "?") +
        " FPS",
    );
    lines.push(
      "Аудиодорожка: " +
        (meta.hasAudio ? "Есть" : "Нет") +
        " · Громкость LUFS: " +
        (report.audio?.integratedLufs ?? "нет измерения"),
    );
    lines.push("Вероятные склейки по FFmpeg: " + (report.sceneCuts || []).slice(0, 90).map(timestamp).join(", "));
    for (const s of report.semantic?.segments || []) {
      const a = s.analysis || {};
      lines.push("\n━━━ " + timestamp(s.start) + "–" + timestamp(s.end) + " ━━━");
      if (a.summary) lines.push("Содержание: " + a.summary);
      if (a.speech) lines.push("Речь: " + a.speech);
      if (a.music) lines.push("Музыка: " + a.music);
      for (const x of a.findings || [])
        lines.push(
          (x.time || "Без таймкода") +
            " · " +
            (x.category || "Наблюдение") +
            ": " +
            (x.observation || "") +
            " → " +
            (x.recommendation || ""),
        );
      for (const [k, v] of Object.entries(a.scores || {})) {
        if (v && typeof v === "object" && v.score != null) lines.push(k + ": " + v.score + "/10. " + (v.reason || ""));
      }
    }
    const cats = ["editing", "pacing", "sound", "effects", "picture"];
    const labels = {
      editing: "Монтаж",
      pacing: "Динамика",
      sound: "Звук",
      effects: "Эффекты",
      picture: "Качество картинки",
    };
    const totals = [];
    for (const c of cats) {
      const points = (report.semantic?.segments || [])
        .map((s) => s.analysis?.scores?.[c])
        .filter((v) => v && Number.isFinite(Number(v.score)) && Number(v.score) >= 0 && Number(v.score) <= 10);
      if (points.length) {
        const avg = points.reduce((sum, v) => sum + Number(v.score), 0) / points.length;
        totals.push(avg);
        lines.push(
          labels[c] + ": " + avg.toFixed(1) + "/10 — средняя оценка по " + points.length + " сегментам; причины выше.",
        );
      } else lines.push(labels[c] + ": недостаточно данных для оценки.");
    }
    if (totals.length)
      lines.push(
        "Общая оценка: " +
          (totals.reduce((s, v) => s + v, 0) / totals.length).toFixed(1) +
          "/10 — средняя по доступным оценкам, не прогноз охватов.",
      );
    lines.push(
      "\nВажно: исходный видеофайл и звуковая дорожка переданы модели, FFmpeg измеряет динамику всего таймлайна; Gemini может сэмплировать кадры и иногда ошибаться. Не гарантирует просмотры.",
    );
    return lines.join("\n");
  }
  async function sendVideoAnalysis() {
    if (!checkAuth("ai.send") || S.aiBusy || !S.aiVideoFile) return;
    if (cooldownLeft()) return toast("Следующий запрос через " + cooldownLeft() + " с", "warning");
    const file = S.aiVideoFile,
      base = String(cfg.videoWorkerUrl || "").replace(/\/$/, "");
    if (!safeUrl(base)) return toast("Видеосервер не настроен", "warning");
    if (!await customConfirm("Видео «" + file.name + "» со звуком будет отправлено на видеосервер и Google Gemini. Продолжить?"))
      return;
    const {
      data: { session },
    } = signed() ? await S.sb.auth.getSession() : {data:{session:null}};
    if (signed() && !session?.access_token) return toast("Выполни вход снова", "warning");
    const uid = S.user.id,
      question = $("ai-question").value.trim();
    S.aiBusy = true;
    setAIState("video", "Загрузка видео");
    $("analysis-live").hidden = false;
    analysisPhase("upload", "Передача файла на видеосервер");
    updateAICooldown();
    const el = document.createElement("div");
    el.className = "ai-answer processing";
    el.innerHTML =
      '<div class="processing-core">Y</div><b>Загрузка видео</b><progress max="100" value="0"></progress><small>0%</small>';
    $("ai-messages").appendChild(el);
    $("ai-messages").scrollTop = $("ai-messages").scrollHeight;
    try {
      const form = new FormData();
      form.append("file", file, file.name);
      form.append("question", question);
      form.append("language", S.lang);
      form.append("mode", $("analysis-mode").value);
      form.append("stream", "1");
      let report = null;
      await uploadVideo(
        base + "/analyze",
        session.access_token,
        form,
        (percent) => {
          setAIState("video", "Загрузка · " + percent + "%");
          el.querySelector("progress").value = percent;
          el.querySelector(".processing-core").style.setProperty("--p", percent * 3.6 + "deg");
          el.querySelector("small").textContent = percent + "% загружено";
        },
        (evt) => {
          if (evt.type === "error") throw Error(evt.detail || "Ошибка видеоанализа");
          if (evt.type === "stage") {
            const final = evt.stage === "report";
            setAIState("video", final ? "Подготовка результата" : "Анализирует видео");
            analysisPhase(final ? "result" : "analysis", evt.label || evt.stage);
            el.querySelector("b").textContent = final ? "Подготовка результата" : "Анализ видео";
            el.querySelector("progress").removeAttribute("value");
            el.querySelector("small").textContent = evt.label || evt.stage;
          }
          if (evt.type === "result") report = evt.data;
        },
      );
      if (S.user?.id !== uid) return;
      if (!report) throw Error("Видеосервер не вернул результат");
      S.latestReport = report;
      S.aiUntil = Date.now() + (signed()?15000:25000);
      localStorage.setItem("yane-ai-until-"+(S.user?.id||"guest"),String(S.aiUntil));
      setAIState("ready");
      analysisPhase("done", "Результат получен");
      const summary =
        videoReportText(report) +
        (report.copyright && !report.demo
          ? "\n\nАвторские риски: " + report.copyright.overall + "\n" + report.copyright.disclaimer
          : "");
      S.aiHistory.push({ role: "user", content: "Разбор видео " + file.name }, { role: "assistant", content: summary });
      renderAIHistory();
      renderCopyright(report, file);
      const saved = await S.sb.from("ai_reports").insert({ owner_id: uid, title: file.name.slice(0, 160), report });
      if (saved.error) toast("Отчёт не сохранился: " + formatError(saved.error), "warning");
      const msg = await S.sb
        .from("ai_messages")
        .insert({
          owner_id: uid,
          question: ("Разбор видео " + file.name).slice(0, 4500),
          answer: summary.slice(0, 16000),
        });
      if (msg.error) toast("История не сохранилась: " + formatError(msg.error), "warning");
      $("ai-question").value = "";
      S.aiVideoFile = null;
      $("ai-file").value = "";
      $("ai-attachment").hidden = true;
      toast("Анализ завершён", "success");
    } catch (e) {
      setAIState("error", "Ошибка видеоанализа");
      $("analysis-stage-detail").textContent = "Анализ остановлен: " + formatError(e);
      toast("Видеоанализ: " + formatError(e), "error");
    } finally {
      el.remove();
      S.aiBusy = false;
      updateAICooldown();
      refreshStatus();
    }
  }
  // Release history starts with unpublished draft v1; only actual published versions are shown.
  async function loadReleases() {
    if (!S.sb) return;
    const { data, error } = await S.sb.from("releases").select("*").order("version", { ascending: false });
    if (error) return;
    S.releases = data || [];
    renderReleases();
  }
  function releaseText(release, field) {
    const localizedValue=release[field+"_i18n"];
    if(localizedValue && typeof localizedValue === "object") return localizedValue[S.lang] || localizedValue.ru || localizedValue.en || "";
    const value=String(release[field] || "");
    // Published administrator content is translated only when bundled explicitly.
    return window.YANE_I18N?.has(value) ? window.YANE_I18N.translate(value) : value;
  }
  function renderReleases() {
    if (C.initialized) renderWidgetBasics();
    const visible = S.releases.filter((r) => r.is_published);
    html(
      "updates-list",
      visible.length
        ? visible
            .map(
              (r) =>
                `<div class="card"><span class="role-label">v${esc(r.version)}</span><h3><span translate="no">${esc(releaseText(r, "title"))}</span></h3><small class="muted">${esc(fmtDate(r.published_at || r.created_at))}</small><p><span translate="no">${esc(releaseText(r, "description"))}</span></p><div class="lesson-detail"><span translate="no">${esc(releaseText(r, "changes"))}</span></div></div>`,
            )
            .join("")
        : '<div class="empty">Опубликованных выпусков пока нет. Администратор опубликует v1 после проверки установки.</div>',
    );
  }
  // Admin panel: all views read real database data, all writes have server RLS/RPC checks.
  async function renderAdmin() {
    const personal = [
      ["personal", "☷", "Оформление и уведомления"],
      ["mybugs", "⚑", "Мои обращения"],
      ["restrictions", "◇", "Мои ограничения"],
    ];
    const admin = [
      ["reports", "⚑", "Жалобы"],
      ["users", "♧", "Люди"],
      ["submissions", "▣", "Заявки"],
      ["bugs", "⚒", "Обращения"],
      ["rating", "♔", "Рейтинг"],
      ["aiconfig", "✦", "Настройки ЯнеAI"],
      ["releases", "✎", "Обновления"],
      ["lessons", "✂", "Уроки"],
      ["rules", "≡", "Правила сайта"],
      ["settings", "⚙", "Настройки"],
      ["logs", "☷", "Логи"],
    ];
    const tabs = [...personal, ...(isAdmin() ? admin : [])];
    if (!tabs.some((x) => x[0] === S.adminTab)) S.adminTab = "personal";
    html(
      "admin-tabs",
      [["Личный кабинет", personal], ...(isAdmin() ? [["Администрирование", admin]] : [])].map(([title,items]) => `<section class="management-group"><h3>${title}</h3><div class="management-menu">${items.map(([k,i,l])=>`<button class="management-item ${k===S.adminTab?'active':''}" data-tab="${k}" aria-pressed="${k===S.adminTab}"><span class="management-icon" aria-hidden="true">${i}</span><span>${l}</span><span class="management-arrow" aria-hidden="true">↗</span></button>`).join('')}</div></section>`).join(''),
    );
    html("admin-content", '<div class="card skeleton" aria-label="Загрузка"></div>');
    try {
      if (S.adminTab === "personal") {
        renderPersonalSettings();
        return;
      }
      if (!signed()) {
        html(
          "admin-content",
          '<div class="card"><p>Войди в аккаунт, чтобы увидеть личные данные.</p><button class="btn btn-primary" id="management-login">Войти</button></div>',
        );
        return;
      }
      const handlers = {
        mybugs: loadBugs,
        restrictions: renderRestrictionPanel,
        reports: adminReports,
        users: adminUsers,
        submissions: adminSubmissions,
        bugs: loadBugs,
        rating: adminRating,
        aiconfig: adminAIConfig,
        releases: adminReleases,
        lessons: adminLessons,
        rules: adminRules,
        settings: adminSettings,
        logs: adminLogs,
      };
      if (!personal.some((x) => x[0] === S.adminTab) && !requireAdmin()) return;
      await handlers[S.adminTab]();
    } catch (e) {
      html("admin-content", `<div class="empty">${esc(formatError(e))}</div>`);
    }
  }
  async function adminReports() {
    const { data, error } = await S.sb
      .from("chat_reports")
      .select("id,message_id,reporter_id,reason,status,created_at")
      .eq("resolved", false)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    const reports = data || [];
    const ids = reports.map((x) => x.message_id),
      { data: msgs } = ids.length
        ? await S.sb.from("chat_messages").select("id,author_id,body,created_at,removed").in("id", ids)
        : { data: [] };
    const byMsg = new Map((msgs || []).map((x) => [x.id, x]));
    await loadProfiles();
    const byUser = new Map(S.profiles.map((x) => [x.id, x]));
    html(
      "admin-content",
      `<div class="card"><h3>🚩 Открытые жалобы: ${reports.length}</h3>${
        reports.length
          ? reports
              .map((r) => {
                const msg = byMsg.get(r.message_id),
                  p = byUser.get(msg?.author_id),
                  reporter = byUser.get(r.reporter_id);
                return `<article class="card"><b><span translate="no">${esc(r.reason)}</span></b><p>От: ${esc(reporter?.username || r.reporter_id)} · ${esc(fmtDate(r.created_at))}</p><div class="notice"><b>Сообщение ${msg?.removed ? "(уже скрыто)" : ""}: ${esc(p?.username || "Участник")}</b><p><span translate="no">${esc(msg?.body || "Сообщение недоступно")}</span></p></div><div class="table-actions"><button data-handle-report="${esc(r.id)}" data-decision="remove">Удалить сообщение</button><button data-handle-report="${esc(r.id)}" data-decision="resolved">Рассмотрено</button><button data-handle-report="${esc(r.id)}" data-decision="dismissed">Отклонить жалобу</button>${msg ? `<button data-admin-user="${esc(msg.author_id)}">Управлять автором</button>` : ""}</div></article>`;
              })
              .join("")
          : '<div class="empty">Новых жалоб нет.</div>'
      }</div>`,
    );
  }
  async function resolveReport(id, decision) {
    if (!requireAdmin()) return;
    const reason = await customPrompt("Комментарий администратора (необязательно):", "");
    if (reason === null) return;
    const { error } = await S.sb.rpc("v11_handle_report", {
      report_id: id,
      decision,
      note: reason,
    });
    if (error) return toast(formatError(error));
    toast("Жалоба обработана");
    renderAdmin();
  }
  async function adminUsers() {
    await loadProfiles();
    const users = S.profiles;
    html(
      "admin-content",
      `<div class="card"><h3>Участники (${users.length})</h3><input class="field-search" id="admin-search-users" placeholder="Найти по никнейму"><div id="admin-users-list"></div></div><div id="admin-user-actions"></div>`,
    );
    renderAdminUsersList();
  }
  function renderAdminUsersList() {
    const input = $("admin-search-users");
    if (!input) return;
    const q = input.value.toLowerCase(),
      users = S.profiles.filter((p) => p.username?.toLowerCase().includes(q));
    html(
      "admin-users-list",
      users.length
        ? `<div class="table-scroll"><table><thead><tr><th>Ник</th><th>Роль</th><th>Регистрация</th><th>Активность</th><th>Статус</th><th></th></tr></thead><tbody>${users.map((p) => `<tr><td><span translate="no">${esc(p.username)}</span></td><td>${roleLabel(p)}</td><td>${esc(fmtDate(p.created_at))}</td><td>${Math.round((p.activity_seconds || 0) / 60)} мин</td><td>${p.is_banned ? "Заблокирован" : "Активен"}</td><td><button class="btn btn-secondary" data-admin-user="${esc(p.id)}">Управлять</button></td></tr>`).join("")}</tbody></table></div>`
        : "<p>Пользователи не найдены.</p>",
    );
  }
  async function manageUser(id) {
    if (!requireAdmin()) return;
    const p = S.profiles.find((x) => x.id === id);
    if (!p) return toast("Аккаунт не найден", "warning");
    S.selectedUser = id;
    const { data: items, error } = await S.sb
      .from("sanctions")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(50);
    html(
      "admin-user-actions",
      `<div class="card"><h3>${esc(p.username)} · ${esc(roleLabel(p))}</h3><p>Роль сохраняется при ограничениях. Все действия записываются в журнал.</p><div class="table-actions"><button data-action-user="role_user">Пользователь</button><button data-action-user="role_clipper">Нарезчик</button><button data-action-user="role_admin">Администратор</button><button data-action-user="unmute">Снять муты</button><button data-action-user="unban">Снять блокировки</button></div><form id="sanction-form" class="grid-form"><label>Тип<select name="kind"><option value="mute">Мут</option><option value="ban">Блокировка</option><option value="restrict">Ограничение действия</option></select></label><label>Области (через запятую)<input name="scopes" value="chat" required></label><label>Срок<select name="duration"><option value="300">5 минут</option><option value="1800">30 минут</option><option value="86400">1 день</option><option value="604800">7 дней</option><option value="0">Навсегда</option></select></label><label>Причина<input name="reason" required minlength="2" maxlength="300"></label><button class="btn btn-primary" type="submit">Применить ограничение</button></form><small>Мут: chat, ai. Блокировка: all, chat, ai, school, videos, stats, clippers, bugs. Действия: chat.send, chat.report, ai.send, videos.submit, bugs.submit, profile.edit, stats.edit.</small><h3>История ограничений</h3>${error ? esc(error.message) : (items || []).map((r) => `<div class="notice"><b>${esc(r.kind)} · ${esc((r.scope || []).join(", "))}</b><p>${esc(r.reason)} · ${r.ends_at ? esc(fmtDate(r.ends_at)) : "навсегда"}</p><small>${esc(fmtDate(r.created_at))} ${r.revoked_at ? "· Снято" : r.ends_at && new Date(r.ends_at) < new Date() ? "· Истекло" : ""}</small>${!r.revoked_at && (!r.ends_at || new Date(r.ends_at) > new Date()) ? `<button class="btn btn-secondary" data-revoke-sanction="${r.id}">Снять</button>` : ""}</div>`).join("") || "<p>Ограничений нет.</p>"}</div>`,
    );
    $("admin-user-actions").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function adminAct(action, seconds) {
    if (!requireAdmin() || !S.selectedUser) return;
    const reason = await customPrompt("Причина действия (запишется в журнал):", "");
    if (reason === null) return;
    if (!await customConfirm("Подтвердить действие «" + action + "»?")) return;
    const { error } = await S.sb.rpc("v11_admin_action", {
      action_name: action,
      target_user: S.selectedUser,
      reason_text: reason,
      mute_seconds: seconds || 0,
    });
    if (error) return toast(formatError(error));
    toast("Действие выполнено");
    renderAdmin();
  }
  async function adminSubmissions() {
    const { data, error } = await S.sb
      .from("video_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    html(
      "admin-content",
      `<div class="card"><h3>▣ Заявки на публикацию</h3>${data?.length ? data.map((v) => `<article class="card"><b><span translate="no">${esc(v.title)}</span></b><span class="role-label">${esc(v.status)}</span><p>Автор: ${esc(v.author_credit)} · ${esc(fmtDate(v.created_at))}</p><p>${esc(v.description)}</p><a class="btn btn-secondary" href="${esc(safeUrl(v.source_url) || "#")}" target="_blank" rel="noopener noreferrer">Посмотреть оригинал ↗</a>${v.status === "pending" ? `<div class="table-actions"><button data-review-video="${esc(v.id)}" data-decision="approved">✅ Одобрить</button><button data-review-video="${esc(v.id)}" data-decision="rejected">❌ Отклонить</button></div>` : `<p>Комментарий: ${esc(v.review_reason || "—")}</p>`}</article>`).join("") : '<div class="empty">Заявок пока нет.</div>'}</div>`,
    );
  }
  async function reviewVideo(id, decision) {
    const reason = await customPrompt(decision === "rejected" ? "Причина отклонения:" : "Комментарий (необязательно):", "");
    if (reason === null) return;
    const { error } = await S.sb.rpc("v11_review_video", {
      item_id: id,
      decision,
      reason_text: reason,
    });
    if (error) return toast(formatError(error));
    toast("Решение сохранено");
    renderAdmin();
    loadVideos();
  }
  async function adminReleases() {
    await loadReleases();
    const max = Math.max(0, ...S.releases.map((v) => v.version));
    html(
      "admin-content",
      `<div class="admin-grid"><div class="card"><h3>✎ Новый релиз или черновик</h3><form id="release-form" class="stack-form"><label>Номер версии<input type="number" name="version" value="${max + 1}" min="1" required></label><label>Название<input name="title" minlength="3" maxlength="140" required></label><label>Описание<textarea name="description" rows="2"></textarea></label><label>Подробности<textarea name="changes" rows="5"></textarea></label><label><input type="checkbox" name="is_published"> Публиковать сразу (только проверенные изменения)</label><button class="btn btn-primary" type="submit">Сохранить выпуск</button></form></div><div class="card"><h3>Версии</h3>${S.releases.map((r) => `<div class="notice"><b>v${esc(r.version)} — ${esc(r.title)}</b><p>${r.is_published ? "Опубликовано" : "Черновик"} · ${esc(fmtDate(r.created_at))}</p><div class="table-actions"><button data-edit-release="${esc(r.id)}">Редактировать</button>${!r.is_published ? `<button data-publish-release="${esc(r.id)}">Опубликовать</button>` : ""}<button data-remove-release="${esc(r.id)}">Удалить</button></div></div>`).join("")}</div></div>`,
    );
  }
  async function saveRelease(e) {
    e.preventDefault();
    const form = e.target,
      f = new FormData(form),
      id = form.dataset.id;
    const record = {
      version: Number(f.get("version")),
      title: String(f.get("title")).trim(),
      description: String(f.get("description") || ""),
      changes: String(f.get("changes") || ""),
      is_published: !!f.get("is_published"),
    };
    if (record.is_published) record.published_at = new Date().toISOString();
    const req = id ? S.sb.from("releases").update(record).eq("id", id) : S.sb.from("releases").insert(record);
    const { error } = await req;
    if (error) return toast(formatError(error));
    toast("Релиз сохранён");
    renderAdmin();
  }
  function editRelease(id) {
    const r = S.releases.find((x) => String(x.id) === String(id)),
      form = $("release-form");
    if (!r || !form) return;
    form.dataset.id = r.id;
    for (const k of ["version", "title", "description", "changes"]) form.elements[k].value = r[k];
    form.elements.is_published.checked = r.is_published;
    form.scrollIntoView({ behavior: "smooth" });
  }
  async function releaseAction(id, action) {
    if (!requireAdmin()) return;
    const r = S.releases.find((x) => String(x.id) === String(id));
    if (!r) return;
    if (!await customConfirm(action === "publish" ? "Опубликовать проверенную версию v" + r.version + "?" : "Удалить запись?"))
      return;
    const q =
      action === "publish"
        ? S.sb
            .from("releases")
            .update({
              is_published: true,
              published_at: new Date().toISOString(),
            })
            .eq("id", id)
        : S.sb.from("releases").delete().eq("id", id);
    const { error } = await q;
    if (error) return toast(formatError(error));
    toast("Сохранено");
    renderAdmin();
  }
  async function adminLessons() {
    await loadLessons();
    html(
      "admin-content",
      `<div class="admin-grid"><div class="card"><h3>✂ Создать/изменить урок</h3><form id="lesson-form" class="stack-form"><label>Категория<input name="category" required placeholder="CapCut ПК"></label><label>Уровень<select name="difficulty"><option value="beginner">Начинающий</option><option value="intermediate">Средний</option><option value="advanced">Продвинутый</option></select></label><label>Заголовок RU<input name="title" required></label><label>Краткое описание RU<textarea name="summary" rows="2"></textarea></label><label>Текст урока RU<textarea name="content" rows="9" required></textarea></label><details><summary>Переводы урока: English / Українська</summary><label>Заголовок EN<input name="title_en"></label><label>Краткое описание EN<textarea name="summary_en" rows="2"></textarea></label><label>Текст урока EN<textarea name="content_en" rows="7"></textarea></label><label>Заголовок UK<input name="title_uk"></label><label>Краткое описание UK<textarea name="summary_uk" rows="2"></textarea></label><label>Текст урока UK<textarea name="content_uk" rows="7"></textarea></label></details><label>Ссылка на видеоурок (необязательно)<input type="url" name="video_url"></label><label>Порядок<input type="number" name="sort_order" value="0"></label><label><input type="checkbox" name="is_published" checked> Опубликовать</label><button class="btn btn-primary" type="submit">Сохранить урок</button></form></div><div class="card"><h3>Материалы: ${S.lessons.length}</h3>${S.lessons.map((l) => `<div class="notice"><b>${esc(localized(l.title_i18n))}</b><p>${esc(l.category)} · ${esc(l.difficulty)} · ${l.is_published ? "Опубликован" : "Черновик"}</p><div class="table-actions"><button data-edit-lesson="${esc(l.id)}">Редактировать</button><button data-delete-lesson="${esc(l.id)}">Удалить</button></div></div>`).join("")}</div></div>`,
    );
  }
  async function saveLesson(e) {
    e.preventDefault();
    const form = e.target,
      f = new FormData(form),
      id = form.dataset.id,
      old = S.lessons.find((x) => x.id === id);
    const row = {
      category: String(f.get("category")).trim(),
      difficulty: f.get("difficulty"),
      title_i18n: { ...(old?.title_i18n || {}), ru: String(f.get("title")) },
      summary_i18n: {
        ...(old?.summary_i18n || {}),
        ru: String(f.get("summary") || ""),
      },
      content_i18n: {
        ...(old?.content_i18n || {}),
        ru: String(f.get("content")),
      },
      video_url: safeUrl(f.get("video_url")) || null,
      sort_order: Number(f.get("sort_order") || 0),
      is_published: !!f.get("is_published"),
    };
    for(const lng of ['en','uk'])for(const key of ['title','summary','content'])row[key+'_i18n'][lng]=String(f.get(key+'_'+lng)||'').trim();
    const q = id ? S.sb.from("lessons").update(row).eq("id", id) : S.sb.from("lessons").insert(row);
    const { error } = await q;
    if (error) return toast(formatError(error));
    toast("Урок сохранён");
    renderAdmin();
  }
  function editLesson(id) {
    const l = S.lessons.find((x) => x.id === id),
      f = $("lesson-form");
    if (!l || !f) return;
    f.dataset.id = l.id;
    for (const k of ["category", "difficulty", "video_url", "sort_order"]) f.elements[k].value = l[k] ?? "";
    for (const k of ["title", "summary", "content"]) f.elements[k].value = l[k + "_i18n"]?.ru || "";
    for(const lng of ['en','uk'])for(const key of ['title','summary','content'])f.elements[key+'_'+lng].value=l[key+'_i18n']?.[lng]||'';
    f.elements.is_published.checked = l.is_published;
    f.scrollIntoView({ behavior: "smooth" });
  }
  async function deleteLesson(id) {
    if (!await customConfirm("Удалить урок без восстановления?")) return;
    const { error } = await S.sb.from("lessons").delete().eq("id", id);
    if (error) return toast(formatError(error));
    renderAdmin();
  }
  async function adminRules() {
    if (!requireAdmin()) return;
    html('admin-content',`<form id="rules-editor-form" class="rules-editor"><header class="rules-editor-heading"><span class="role-label">Только администрация</span><h2>Правила сообщества</h2><p>Измени текст нужной темы. После публикации его увидят все посетители.</p></header><div class="rules-editor-grid">${RULE_TOPICS.map(([key,title,fallback],i)=>`<section class="card"><label for="edit-${key}"><span class="rule-number">0${i+1}</span><h3>${title}</h3></label><textarea id="edit-${key}" name="${key}" rows="8" maxlength="25000" placeholder="${esc(fallback)}">${esc(S.settings?.[key]||'')}</textarea><details><summary>Предпросмотр</summary><p class="rule-copy" data-rule-preview="${key}" translate="no">${esc(S.settings?.[key]||fallback)}</p></details></section>`).join('')}</div><footer class="rules-editor-actions"><small>Пустое поле возвращает стандартный текст. Переносы строк сохраняются.</small><button class="btn btn-primary" type="submit">Опубликовать правила</button><span id="rules-save-status" role="status"></span></footer></form>`);
  }
  async function saveRules(e) {
    e.preventDefault();
    if (!requireAdmin()) return;
    const form=e.target, button=form.querySelector('[type="submit"]');
    if (button.disabled) return;
    const values=Object.fromEntries(RULE_TOPICS.map(([key])=>[key,form.elements[key].value.trim()]));
    if(Object.values(values).some(v=>v.length>25000))return toast('Не более 25 000 символов в каждой теме','warning');
    button.disabled=true; $('rules-save-status').textContent='Сохранение…';
    try {
      const {data,error}=await S.sb.rpc('v12_admin_save_rules',{rules:values});
      if(error)throw error;
      S.settings={...S.settings,...(data||values)};
      renderRules();
      $('rules-save-status').textContent='Правила опубликованы';
      toast('Правила опубликованы','success');
    } catch(error) {
      $('rules-save-status').textContent='Не удалось сохранить. Текст остался в редакторе.';
      toast(formatError(error),'error');
    } finally {button.disabled=false;}
  }
  document.addEventListener('input',e=>{
    if(!e.target.matches('#rules-editor-form textarea'))return;
    const [key,,fallback]=RULE_TOPICS.find(([key])=>key===e.target.name);
    document.querySelector(`[data-rule-preview="${key}"]`).textContent=e.target.value||fallback;
    $('rules-save-status').textContent='Есть неопубликованные изменения';
  });
  async function adminSettings() {
    const s = S.settings || {};
    html(
      "admin-content",
      `<div class="card" style="max-width:800px"><h3>⚙ Настройки сообщества</h3><form id="settings-form" class="stack-form"><label>Количество мест в основе<input type="number" name="capacity" min="1" max="1000" value="${Number(s.capacity) || 10}" required></label><label>HTTPS-ссылка на вставку<input name="insert_download_url" type="url" value="${esc(s.insert_download_url || "")}"></label><button class="btn btn-primary" type="submit">Сохранить настройки</button></form><hr><h3>Загрузка утверждённого баннера правил</h3><input id="banner-input" type="file" accept="image/png,image/jpeg"><button class="btn btn-secondary" id="banner-upload">Загрузить баннер</button></div>`,
    );
  }
  async function saveSettings(e) {
    e.preventDefault();
    if (!requireAdmin()) return;
    const f = new FormData(e.target),
      capacity = Number(f.get("capacity")),
      url = String(f.get("insert_download_url") || "").trim();
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1000) return toast("Места: от 1 до 1000");
    if (url && !safeUrl(url)) return toast("Нужна HTTPS-ссылка");
    const { error } = await S.sb
      .from("site_settings")
      .update({
        capacity,
        insert_download_url: url || null,
      })
      .eq("id", "main");
    if (error) return toast(formatError(error));
    toast("Настройки сохранены");
    await loadPublic();
  }
  async function uploadBanner() {
    const file = $("banner-input")?.files?.[0];
    if (!file || !["image/png", "image/jpeg"].includes(file.type) || file.size > 5e6)
      return toast("Только PNG/JPEG до 5 МБ");
    const path = "banner-" + Date.now() + (file.type === "image/png" ? ".png" : ".jpg");
    const up = await S.sb.storage.from("banners").upload(path, file, { contentType: file.type });
    if (up.error) return toast(formatError(up.error));
    const set = await S.sb.from("site_settings").update({ banner_path: path }).eq("id", "main");
    if (set.error) return toast(formatError(set.error));
    toast("Баннер обновлён");
    loadPublic();
  }
  async function adminLogs() {
    const { data, error } = await S.sb
      .from("admin_logs")
      .select("action,actor_id,target_id,details,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    await loadProfiles();
    const byUser = new Map(S.profiles.map((p) => [p.id, p.username]));
    html(
      "admin-content",
      `<div class="card"><h3>📋 Журнал действий</h3><input id="logs-filter" class="field-search" placeholder="Фильтр по типу события"><div id="logs-table"></div></div>`,
    );
    const render = () => {
      const q = $("logs-filter").value.toLowerCase();
      html(
        "logs-table",
        `<div class="table-scroll"><table><thead><tr><th>Время</th><th>Событие</th><th>Администратор</th><th>Детали</th></tr></thead><tbody>${(
          data || []
        )
          .filter((l) => (l.action + " " + (byUser.get(l.actor_id) || "")).toLowerCase().includes(q))
          .map(
            (l) =>
              `<tr><td>${esc(fmtDate(l.created_at))}</td><td>${esc(l.action)}</td><td>${esc(byUser.get(l.actor_id) || "Система")}</td><td>${esc(JSON.stringify(l.details || {})).slice(0, 200)}</td></tr>`,
          )
          .join("")}</tbody></table></div>`,
      );
    };
    $("logs-filter").addEventListener("input", render);
    render();
  }
  // v12 UI services. All privileged changes go through PostgreSQL RPC/RLS.
  const defaultAI = {
    greeting: "Привет! Я ЯнеИИ — помогу с монтажом, звуком, эффектами и продвижением. С чего начнём?",
    starters: [
      "Как выбрать лучший момент стрима?",
      "Почему видео теряет качество?",
      "Как уменьшить риск блокировки за музыку?",
    ],
    style: "friendly",
    customStyle: "",
    verbosity: "standard",
    tone: "",
    formatting: "Короткие абзацы, нумерованные шаги.",
    instructions: "",
    topics: ["Монтаж", "Нарезки стримов", "Обучение", "Сайт Yaneher"],
  };
  const categories = {
    system: "Система",
    updates: "Обновления",
    admin: "Администрация",
    bugs: "Обращения",
    sanctions: "Ограничения",
    videos: "Видео",
    rating: "Рейтинг",
  };
  const bugStatuses = {
    received: "Получено",
    checking: "Проверяется",
    fixing: "Исправляется",
    fixed: "Исправлено",
    rejected: "Отклонено",
  };
  const icons = { error: "!", success: "✓", warning: "!", info: "i" };
  S.notifications = [];
  S.noticeQueue = [];
  S.activeNotices = 0;
  S.noticeSeen = new Map();
  S.localNotices = [];
  S.profileRatings = {};
  S.prefs = { sound: false, lite: false, categories: {} };
  const prefKey = () => "ycl-v12-" + (S.user?.id || "guest");
  function loadLocalPrefs() {
    try {
      const x = JSON.parse(localStorage.getItem(prefKey()) || "{}");
      S.prefs = { sound: false, lite: false, categories: {}, ...(S.profile?.ui_prefs || {}), ...(x.prefs || {}) };
      S.localNotices = (Array.isArray(x.notices) ? x.notices : []).filter(n => categories[n.category] && icons[n.type]);
    } catch {
      S.prefs = { sound: false, lite: false, categories: {} };
      S.localNotices = [];
    }
    $("app").classList.toggle("lite-mode", !!S.prefs.lite);
    customPrefsLoaded();
  }
  function persistPrefs() {
    localStorage.setItem(prefKey(), JSON.stringify({ prefs: S.prefs, notices: S.localNotices.slice(0, 100) }));
  }
  async function saveUIPrefs() {
    persistPrefs();
    if (C.initialized) applyCustom(currentCustom());
    $("app").classList.toggle("lite-mode", !!S.prefs.lite);
    if (signed()) {
      const { error } = await S.sb.rpc("v12_save_ui_prefs", { prefs: S.prefs });
      if (error) toast("Не удалось сохранить настройки в аккаунте: " + formatError(error), "warning");
    }
  }
  function notify(input) {
    const n = { type: "info", category: "system", title: "Уведомление", description: "", ...input };
    if (!categories[n.category]) return;
    if (!icons[n.type]) n.type = "info";
    const key = n.dedupe || [n.type, n.title, n.description].join("|");
    const now = Date.now();
    if (now - (S.noticeSeen.get(key) || 0) < 8000) return;
    S.noticeSeen.set(key, now);
    if (S.noticeSeen.size > 300) S.noticeSeen.delete(S.noticeSeen.keys().next().value);
    if (n.important && !n.server) {
      S.localNotices.unshift({
        ...n,
        id: "local-" + now + "-" + Math.random().toString(36).slice(2, 7),
        body: n.description,
        created_at: new Date().toISOString(),
        read_at: null,
      });
      persistPrefs();
      updateUnread();
    }
    if (S.prefs.categories?.[n.category] === false && n.category !== "sanctions") return;
    S.noticeQueue.push(n);
    drainNotices();
  }
  function drainNotices() {
    if (S.activeNotices >= 3 || !S.noticeQueue.length) return;
    const n = S.noticeQueue.shift();
    S.activeNotices++;
    const el = document.createElement("article");
    el.className = "premium-notice type-" + n.type;
    el.setAttribute("role", n.type === "error" ? "alert" : "status");
    el.style.setProperty("--notice-duration", Number(currentCustom().noticeDuration || 6)+"s");
    el.innerHTML = `<span class="notice-symbol">${icons[n.type]}</span><div><b>${esc(n.title)}</b>${n.description ? `<p>${esc(n.description)}</p>` : ""}${n.link ? '<button class="notice-action">Открыть →</button>' : ""}</div><button class="notice-close" aria-label="Закрыть уведомление">×</button><span class="notice-progress"></span>`;
    let timer,
      remaining = Number(currentCustom().noticeDuration || 6) * 1000,
      started = Date.now(),
      closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      clearTimeout(timer);
      el.classList.add("notice-leave");
      setTimeout(() => {
        el.remove();
        S.activeNotices--;
        drainNotices();
      }, 200);
    };
    el.querySelector(".notice-close").onclick = close;
    el.querySelector(".notice-action")?.addEventListener("click", () => {
      openNoticeLink(n.link, n.category);
      close();
    });
    let paused=false;
    const pause=()=>{if(paused)return;paused=true;clearTimeout(timer);remaining-=Date.now()-started;el.classList.add('paused');};
    const resume=()=>{if(!paused||el.matches(':hover')||el.contains(document.activeElement))return;paused=false;started=Date.now();timer=setTimeout(close,Math.max(1,remaining));el.classList.remove('paused');};
    el.addEventListener('mouseenter',pause);el.addEventListener('mouseleave',resume);
    el.addEventListener('focusin',pause);el.addEventListener('focusout',()=>setTimeout(resume,0));
    $("notification-stack").appendChild(el);
    timer = setTimeout(close, remaining);
    playNoticeSound(n.type);
    drainNotices();
  }
  function playNoticeSound(type) {
    if (!S.prefs.sound) return;
    try {
      const ctx = S.audioContext || (S.audioContext = new (window.AudioContext || window.webkitAudioContext)());
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const notes =
        type === "error" ? [330, 247] : [660, 880];
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator(),
          g = ctx.createGain(),
          at = ctx.currentTime + i * 0.09;
        o.type = "sine";
        o.frequency.value = freq;
        g.gain.setValueAtTime(0, at);
        g.gain.linearRampToValueAtTime(0.06, at + 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, at + 0.28);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(at);
        o.stop(at + 0.3);
      });
    } catch {}
  }
  function allNotices() {
    return [...S.notifications, ...S.localNotices].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  function updateUnread() {
    const n = allNotices().filter((x) => !x.read_at).length;
    const badge = $("unread-count");
    badge.textContent = n > 99 ? "99+" : n;
    badge.hidden = !n;
    $("notification-bell").setAttribute("aria-label", "Уведомления, непрочитанных: " + n);
  }
  async function loadNotifications() {
    if (!signed()) {
      S.notifications = [];
      updateUnread();
      return;
    }
    const uid = S.user.id,
      { data, error } = await S.sb
        .from("notifications")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(100);
    if (error) {
      console.warn("Notifications:", error.message);
      return;
    }
    if (S.user?.id !== uid) return;
    S.notifications = (data || []).filter(n => categories[n.category] && icons[n.type]);
    updateUnread();
    if ($("notification-dialog").open) renderNotificationCenter();
  }
  function subscribeNotifications() {
    if (S.notificationChannel) {
      S.sb?.removeChannel(S.notificationChannel);
      S.notificationChannel = null;
    }
    if (!signed()) return;
    const uid = S.user.id;
    S.notificationChannel = S.sb
      .channel("v12-notices-" + uid)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: "user_id=eq." + uid },
        (evt) => {
          const n = evt.new;
          if (S.user?.id !== uid || !categories[n.category] || !icons[n.type]) return;
          S.notifications = [n, ...S.notifications.filter((x) => x.id !== n.id)].slice(0, 100);
          notify({ ...n, description: n.body, server: true, dedupe: n.dedupe_key || "server-" + n.id });
          updateUnread();
          if ($("notification-dialog").open) renderNotificationCenter();
          refreshStatus();
        },
      )
      .subscribe();
  }
  function renderNotificationCenter() {
    html(
      "notification-settings",
      `<details><summary>Настройки уведомлений</summary><div class="notification-options"><label><input type="checkbox" data-pref="sound" ${S.prefs.sound ? "checked" : ""}> Звуки уведомлений</label>${Object.entries(
        categories,
      )
        .map(
          ([k, l]) =>
            `<label><input type="checkbox" data-category-pref="${k}" ${S.prefs.categories?.[k] !== false ? "checked" : ""} ${k === "sanctions" ? "disabled" : ""}> ${esc(l)}</label>`,
        )
        .join(
          "",
        )}</div><small>Настройки категорий управляют всплывающими уведомлениями; история сохраняется. Ограничения отображаются всегда.</small></details>`,
    );
    const all = allNotices();
    html(
      "notification-list",
      all.length
        ? all
            .map(
              (n) =>
                `<article class="center-notice ${n.read_at ? "" : "unread"} type-${esc(n.type)}"><span class="notice-symbol">${icons[n.type] || "i"}</span><div><b>${esc(n.title)}</b><p>${esc(n.body || n.description || "")}</p><small>${esc(categories[n.category] || n.category)} · ${esc(fmtDate(n.created_at))}</small><div class="table-actions">${n.link ? `<button data-notice-link="${esc(n.link)}" data-notice-category="${esc(n.category)}">Открыть →</button>` : ""}${!n.read_at ? `<button data-read-notice="${esc(n.id)}">Прочитано</button>` : ""}</div></div></article>`,
            )
            .join("")
        : '<div class="empty">Новых событий пока нет.</div>',
    );
  }
  async function markNotices(ids = null) {
    const locals = ids ? ids.filter((x) => String(x).startsWith("local-")) : S.localNotices.map((x) => x.id),
      remote = ids ? ids.filter((x) => !String(x).startsWith("local-")) : null;
    S.localNotices.forEach((x) => {
      if (locals.includes(x.id)) x.read_at = new Date().toISOString();
    });
    persistPrefs();
    if (signed() && (!ids || remote.length)) {
      const { error } = await S.sb.rpc("v12_notifications_mark_read", { ids: remote });
      if (error) return toast(formatError(error), "error");
      await loadNotifications();
    }
    updateUnread();
    renderNotificationCenter();
  }
  function openNoticeLink(link, category) {
    if (link === "manage") {
      S.adminTab =
        category === "sanctions"
          ? "restrictions"
          : category === "admin" && isAdmin()
            ? "bugs"
            : category === "bugs"
              ? "mybugs"
              : "personal";
      go("admin");
    } else go(link);
  }
  function isPinned(box) {
    return box.scrollHeight - box.scrollTop - box.clientHeight < 90;
  }
  function scrollIfPinned(box) {
    if (isPinned(box)) box.scrollTop = box.scrollHeight;
  }
  function duration(n) {
    n = Math.max(0, Math.ceil(n));
    if (n >= 86400) return Math.ceil(n / 86400) + " дн.";
    if (n >= 3600) return Math.ceil(n / 3600) + " ч";
    if (n >= 60) return Math.ceil(n / 60) + " мин";
    return n + " с";
  }
  function activeSanctions() {
    const now = Date.now() + (S.serverOffset || 0);
    return (S.status?.sanctions || []).filter((r) => !r.ends_at || new Date(r.ends_at).getTime() > now);
  }
  function restriction(area) {
    const [part, action] = (area || "all").split(".");
    return activeSanctions().find(
      (r) =>
        (r.kind === "ban" && (r.scope.includes("all") || r.scope.includes(part))) ||
        (r.kind === "mute" && action === "send" && r.scope.includes(part)) ||
        (r.kind === "restrict" && r.scope.includes(area)),
    );
  }
  function sanctionText(r) {
    const seconds = r.ends_at
      ? Math.max(0, Math.ceil((new Date(r.ends_at) - Date.now() - (S.serverOffset || 0)) / 1000))
      : null;
    return `${r.kind === "mute" ? "Мут" : r.kind === "ban" ? "Блокировка" : "Ограничение"} ${seconds === null ? "навсегда" : "· осталось " + duration(seconds)}. Причина: ${r.reason || "Не указана"}. Разделы: ${(r.scope || []).join(", ")}`;
  }
  async function refreshStatus() {
    if (!signed()) {
      S.status = null;
      renderSanctions();
      return;
    }
    const uid = S.user.id,
      { data, error } = await S.sb.rpc("v12_my_status");
    if (error) {
      console.warn("Status:", error.message);
      return;
    }
    if (S.user?.id !== uid) return;
    const prev = S.status;
    S.status = data;
    S.serverOffset = new Date(data.server_time).getTime() - Date.now();
    S.aiUntil = Date.now() + Number(data.ai_wait || 0) * 1000;
    S.bugUntil = Date.now() + Number(data.bug_wait || 0) * 1000;
    if (S.profile) {
      S.profile.role = data.role;
      S.profile.is_banned = data.is_banned;
    }
    renderSanctions();
    updateAICooldown();
    if (prev?.role !== data.role) {
      $$(".admin-only").forEach((el) => (el.hidden = !isAdmin()));
      if (S.page === "admin") renderAdmin();
    }
  }
  function renderSanctions() {
    const list = activeSanctions();
    $("sanction-banner").hidden = !list.length;
    html("sanction-banner", list.map((r) => `<div><b>ⓘ ${esc(sanctionText(r))}</b></div>`).join(""));
    renderSectionRestriction();
  }
  function renderSectionRestriction() {
    $$(".section-restriction").forEach((x) => x.remove());
    $$(".screen-restricted").forEach((x) => x.classList.remove("screen-restricted"));
    if (["home", "rules", "admin", "profile"].includes(S.page)) return;
    const r = restriction(S.page);
    if (!r) {
      if (S.blockedScreens?.has(S.page)) {
        const page = S.page;
        S.blockedScreens.delete(page);
        setTimeout(() => {
          if (S.page === page) go(page);
        }, 0);
      }
      return;
    }
    if (!S.blockedScreens) S.blockedScreens = new Set();
    S.blockedScreens.add(S.page);
    const screen = $("screen-" + S.page);
    screen.classList.add("screen-restricted");
    screen.insertAdjacentHTML(
      "beforeend",
      `<div class="section-restriction card"><h2>Доступ ограничен</h2><p>${esc(sanctionText(r))}</p><button class="btn btn-secondary" data-go="admin">Мои ограничения →</button></div>`,
    );
  }
  async function renderRestrictionPanel() {
    await refreshStatus();
    html(
      "admin-content",
      `<div class="card"><h3>Мои ограничения</h3>${
        activeSanctions()
          .map((r) => `<div class="info-notice">${esc(sanctionText(r))}</div>`)
          .join("") || "<p>Активных ограничений нет.</p>"
      }<p>Сроки проверяются сервером. После истечения доступ возвращается автоматически, без повторного входа. Роль аккаунта не меняется.</p></div>`,
    );
  }
  async function loadAIConfig() {
    if (!S.sb) return;
    const { data, error } = await S.sb.rpc("v12_ai_public_config");
    if (!error) {
      S.aiConfig = data;
      if (!S.aiBusy && !S.aiHistory.length) renderAIHistory();
    }
  }
  async function loadCounters() {
    if (!S.sb) return;
    const { data, error } = await S.sb.rpc("v12_public_counters");
    if (error) return;
    const labels = {
      users: "Участников",
      videos: "Видео в подборке",
      analyzed: "Видео разобрано",
      views: "Просмотров в статистике",
    };
    html(
      "live-counters",
      Object.entries(labels)
        .map(
          ([k, l]) =>
            `<div><strong data-counter="${Number(data[k] || 0)}">${num(data[k])}</strong><span>${l}</span></div>`,
        )
        .join(""),
    );
    if (!S.prefs.lite && !matchMedia("(prefers-reduced-motion: reduce)").matches)
      $$("[data-counter]").forEach((el) => {
        const end = Number(el.dataset.counter),
          start = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - start) / 650);
          el.textContent = num(Math.round(end * (1 - Math.pow(1 - t, 3))));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
  }
  async function loadLeaderboard() {
    if (!signed()) {
      html("rating-board", '<div class="empty">Войди, чтобы открыть рейтинг сообщества.</div>');
      html("my-rank", "");
      return;
    }
    const period = $("rating-period").value;
    html("rating-board", '<div class="skeleton" aria-label="Загрузка рейтинга"></div>');
    const [board, rank, rules] = await Promise.all([
      S.sb.rpc("v12_leaderboard", { period, core_only: false, max_rows: 100 }),
      S.sb.rpc("v12_my_rank", { period, core_only: false }),
      S.sb.from("rating_rules").select("*"),
    ]);
    if (board.error) {
      html("rating-board", `<div class="empty">${esc(formatError(board.error))}</div>`);
      return;
    }
    const rows = board.data || [];
    html(
      "rating-board",
      rows.length
        ? `<div class="podium">${rows
            .slice(0, 3)
            .map(
              (p, i) =>
                `<button class="podium-card podium-${i + 1}" data-user="${esc(p.user_id)}"><span class="podium-place">${"#" + p.place}</span>${avatar(p)}<b><span translate="no">${esc(p.username)}</span></b><strong>${num(p.points)}</strong><small>очков</small></button>`,
            )
            .join(
              "",
            )}</div><div class="leader-list">${rows.map((p) => `<button class="leader-row ${p.user_id === S.user.id ? "is-me" : ""}" data-user="${esc(p.user_id)}"><span>#${p.place}</span>${avatar(p)}<b><span translate="no">${esc(p.username)}</span></b><strong>${num(p.points)} <small>очков</small></strong><span>↗</span></button>`).join("")}</div>`
        : '<div class="empty">Подтверждённых начислений пока нет. Здесь будут реальные результаты участников.</div>',
    );
    html(
      "my-rank",
      rank.error
        ? ""
        : `<div class="my-rank"><span>Твоя позиция: <b>${rank.data?.place ? "#" + rank.data.place : "ещё нет в рейтинге"}</b></span><strong>${num(rank.data?.points)} очков</strong></div>`,
    );
    html(
      "rating-public-rules",
      rules.error
        ? esc(rules.error.message)
        : (rules.data || [])
            .map(
              (r) =>
                `<div class="rule-row"><b><span translate="no">${esc(r.title)}</span></b><span>${r.active ? num(r.points) + " очков" : "Не начисляется"}</span><p><span translate="no">${esc(r.description)}</span></p></div>`,
            )
            .join(""),
    );
  }
  function ratingProfileHTML(r) {
    return r
      ? `<h3>Рейтинг</h3><div class="rating-stats"><b>${num(r.total)} <small>за всё время</small></b><b>${num(r.week)} <small>за неделю</small></b><b>${num(r.month)} <small>за месяц</small></b></div><details><summary>История начислений</summary>${(r.events || []).map((e) => `<div class="rule-row"><b>${e.points > 0 ? "+" : ""}${e.points} · ${esc(e.rule)}</b><small>${esc(fmtDate(e.created_at))}</small><p>${esc(e.reason)}</p></div>`).join("") || "<p>Начислений ещё нет.</p>"}</details>`
      : "<h3>Рейтинг</h3><p>Загрузка…</p>";
  }
  async function loadRatingProfile(id) {
    if (!id || !signed()) return;
    const { data, error } = await S.sb.rpc("v12_rating_profile", { target: id });
    if (!error) {
      S.profileRatings[id] = data;
      if ((S.openedProfile?.id || S.profile?.id) === id) renderProfile();
    } else if ($("profile-rating")) html("profile-rating", esc(error.message));
  }
  async function completeLesson(id, b) {
    if(S.lessons.find(x=>x.id===id)?._bundled){
      let done=[];try{done=JSON.parse(localStorage.getItem('ycl-local-lessons')||'[]');}catch{}
      const already=done.includes(id);if(!already){done.push(id);localStorage.setItem('ycl-local-lessons',JSON.stringify(done));}
      notify({type:'success',title:already?'Этот урок уже отмечен':'Урок отмечен как пройденный',description:'Отметка сохраняется только в этом браузере.',dedupe:'lesson-'+id});return;
    }

    if (!checkAuth("school.read")) return;
    b.disabled = true;
    try {
      const { data, error } = await S.sb.rpc("v12_complete_lesson", { target_lesson: id });
      if (error) throw error;
      b.textContent = "✓ Пройдено";
      b.classList.add("lesson-completed");
      notify({
        type: "success",
        title: data.already ? "Урок уже отмечен" : "Урок пройден",
        description: `Пройдено ${data.done} из ${data.total}`,
        dedupe: "lesson-" + id,
      });
      if (!data.already) celebrate(b);
      await loadNotifications();
      await refreshWidgetData();
    } catch (e) {
      toast(formatError(e), "error");
      b.disabled = false;
    }
  }
  function celebrate(anchor) {
    if (S.prefs.lite || reducedCustom() || economicalCustom()) return;
    for (let i = 0; i < 12; i++) {
      const p = document.createElement("i");
      p.className = "celebration-particle";
      p.style.setProperty("--x", (Math.random() - 0.5) * 180 + "px");
      p.style.setProperty("--y", -40 - Math.random() * 100 + "px");
      p.style.background = ["#a99aff", "#8edac4", "#ffcf86"][i % 3];
      anchor.appendChild(p);
      setTimeout(() => p.remove(), 850);
    }
  }
  async function readNDJSON(response, onEvent) {
    if (!response.headers.get("content-type")?.includes("ndjson")) {
      const d = await response.json();
      if (d.error) throw Error(d.error);
      onEvent({ t: "done", ...d });
      return;
    }
    const reader = response.body.getReader(),
      decoder = new TextDecoder();
    let pending = "";
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        pending += decoder.decode(value, { stream: true });
        let n;
        while ((n = pending.indexOf("\n")) >= 0) {
          const line = pending.slice(0, n).trim();
          pending = pending.slice(n + 1);
          if (line) onEvent(JSON.parse(line));
        }
      }
      pending += decoder.decode();
      if (pending.trim()) onEvent(JSON.parse(pending));
    } finally {
      reader.releaseLock();
    }
  }
  function uploadVideo(url, token, form, onUpload, onEvent) {
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest();
      let offset = 0,
        pending = "",
        failed = false;
      const parse = (final) => {
        pending += x.responseText.slice(offset);
        offset = x.responseText.length;
        let n;
        while ((n = pending.indexOf("\n")) >= 0) {
          const line = pending.slice(0, n).trim();
          pending = pending.slice(n + 1);
          if (line) onEvent(JSON.parse(line));
        }
        if (final && pending.trim()) {
          const obj = JSON.parse(pending);
          if (obj.detail || obj.error) throw Error(obj.detail || obj.error);
          onEvent(obj.type ? obj : { type: "result", data: obj });
          pending = "";
        }
      };
      x.open("POST", url);
      x.setRequestHeader("Authorization", "Bearer " + token);
      x.timeout = 900000;
      x.upload.onprogress = (e) => {
        if (e.lengthComputable) onUpload(Math.round((e.loaded / e.total) * 100));
      };
      x.onprogress = () => {
        if (x.status >= 200 && x.status < 300)
          try {
            parse(false);
          } catch (e) {
            failed = true;
            x.abort();
            reject(e);
          }
      };
      x.onload = () => {
        if (failed) return;
        try {
          if (x.status < 200 || x.status >= 300) {
            let d;
            try {
              d = JSON.parse(x.responseText);
            } catch {}
            throw Error(d?.detail || "Видеосервер: HTTP " + x.status);
          }
          parse(true);
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      x.onerror = () => reject(Error("Не удалось связаться с видеосервером"));
      x.ontimeout = () => reject(Error("Превышено время анализа видео"));
      x.onabort = () => {
        if (!failed) reject(Error("Загрузка отменена"));
      };
      x.send(form);
    });
  }
  function setReviewCollapsed(collapsed) {
    const box = $("video-review"), button = $("review-toggle"), body = $("review-body");
    S.reviewCollapsed = !!collapsed;
    box.classList.toggle("review-collapsed", !!collapsed);
    if (body) body.inert = !!collapsed;
    if (button) {
      button.setAttribute("aria-expanded", String(!collapsed));
      button.setAttribute("title", collapsed ? "Развернуть проигрыватель" : "Свернуть проигрыватель");
      button.setAttribute("aria-label", collapsed ? "Развернуть проигрыватель" : "Свернуть проигрыватель");
      button.innerHTML = `<span aria-hidden="true">${collapsed ? "⌄" : "⌃"}</span><span>${collapsed ? "Развернуть проигрыватель" : "Свернуть проигрыватель"}</span>`;
    }
    if (collapsed) $("review-player")?.pause();
    window.YANE_I18N?.refresh();
  }
  function closeReview() {
    const box = $("video-review");
    $("review-player")?.pause();
    box.classList.add("review-closing");
    S.reviewClosed = true;
    clearTimeout(S.reviewCloseTimer);
    S.reviewCloseTimer = setTimeout(() => {
      box.hidden = true;
      box.replaceChildren();
      box.classList.remove("review-closing", "review-collapsed");
      if (S.videoObjectURL) URL.revokeObjectURL(S.videoObjectURL);
      S.videoObjectURL = null;
    }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180);
  }
  function renderCopyright(report, file) {
    const c = report.copyright;
    if (!c) return;
    const prose = value => `<span ${report.demo ? "" : 'translate="no"'}>${esc(value)}</span>`;
    const levels = { low: ["🟢", "Низкий"], medium: ["🟡", "Средний"], high: ["🔴", "Высокий"] };
    clearTimeout(S.reviewCloseTimer);
    // Re-rendering metadata must not invalidate the attached video's object URL.
    if (file) {
      if (S.videoObjectURL) URL.revokeObjectURL(S.videoObjectURL);
      S.videoObjectURL = URL.createObjectURL(file);
      S.reviewCollapsed = false;
    }
    S.reviewClosed = false;
    $("video-review").hidden = false;
    $("video-review").classList.remove("review-closing");
    html("video-review", `<div class="copyright-report compact-review"><div class="review-toolbar"><div><span class="eyebrow">ПРЕДВАРИТЕЛЬНАЯ ПРОВЕРКА</span><h3>Авторские риски · ${(levels[c.overall] || ["⚪", "Не определён"]).join(" ")}</h3></div><div class="review-actions"><button class="link-btn" id="review-toggle" aria-controls="review-body" aria-expanded="true" title="Свернуть проигрыватель"></button><button class="icon-btn" id="review-close" title="Закрыть проигрыватель" aria-label="Закрыть проигрыватель">${uiIcon("close")}</button></div></div><div class="review-body" id="review-body"><div class="review-body-inner"><div class="review-overview ${S.videoObjectURL ? "has-video" : ""}">${S.videoObjectURL ? `<video controls playsinline preload="metadata" id="review-player" aria-label="Разбор видео" src="${esc(S.videoObjectURL)}"></video>` : ""}<div class="review-summary"><p>Это оценка вероятных рисков, а не проверка Content ID, лицензий или разрешений правообладателя.</p><div class="risk-timeline">${(c.risks || []).map((r) => `<button class="risk-marker risk-${esc(r.level)}" data-seek="${Number(r.start) || 0}" title="${esc(r.description)}">${(levels[r.level] || ["⚪"])[0]} ${timestamp(r.start)}</button>`).join("") || "<span>Риски не отмечены моделью. Это не доказывает отсутствие защищённых материалов.</span>"}</div></div></div><details class="review-details"><summary>Подробный отчёт <span>${(c.risks || []).length}</span></summary><div>${(c.risks || []).map((r) => `<article class="risk-card risk-${esc(r.level)}"><button data-seek="${Number(r.start) || 0}">${timestamp(r.start)}–${timestamp(r.end)} ▶</button><b>${(levels[r.level] || ["⚪", "Не определён"]).join(" ")} · ${prose(r.description)}</b><p><b>Причина:</b> ${prose(r.reason)}</p><p><b>Рекомендация:</b> ${prose(r.recommendation)}</p><small>Основание: ${r.source ? prose(r.source) : "модель"} · Уверенность: ${r.certainty ? prose(r.certainty) : "не установлена"}</small></article>`).join("")}<div class="info-notice">${c.disclaimer ? prose(c.disclaimer) : "Проверка ЯнеAI носит рекомендательный характер и не гарантирует отсутствие блокировок или ограничений после публикации."}</div><small>Метод: ${c.method ? prose(c.method) : "Модельная оценка по видео"}. Аудиоотпечатки: ${c.fingerprint?.status ? prose(c.fingerprint.status) : "не доступны"}.</small></div></details></div></div></div>`);
    setReviewCollapsed(S.reviewCollapsed || false);
  }
  function renderPersonalSettings() {
    html(
      "admin-content",
      `<div class="card"><h3>Оформление и уведомления</h3><p>Настройки сохраняются на этом устройстве${signed() ? " и в аккаунте" : ""}.</p><div class="notification-options"><label><input type="checkbox" data-pref="sound" ${S.prefs.sound ? "checked" : ""}> Звуки уведомлений</label><label><input type="checkbox" data-pref="lite" ${S.prefs.lite ? "checked" : ""}> Лёгкий режим · меньше эффектов</label></div><div class="table-actions"><button class="btn btn-secondary" data-open-custom="animations">✦ Кастомизация BETA</button><button class="btn btn-secondary" data-set-theme="light">☀ Светлая тема</button><button class="btn btn-secondary" data-set-theme="dark">☾ Тёмная тема</button><button class="btn btn-secondary" id="open-notification-settings">Центр уведомлений</button><button class="btn btn-secondary" data-open-bug>Сообщить об ошибке</button></div><div class="info-notice">Если в системе включено уменьшение движения, анимации сокращаются автоматически. Звуки по умолчанию выключены.</div></div>`,
    );
  }
  function openBug() {
    if (!checkAuth("bugs.submit")) return;
    const titles = {
      home: "Главная",
      ai: "ЯнеИИ",
      school: "Школа монтажа",
      diagnostics: "Диагностика",
      videos: "Видео",
      chat: "Общий чат",
      clippers: "Нарезчики",
      stats: "Статистика",
      admin: "Управления",
      rules: "Правила",
      profile: "Профиль",
    };
    $("bug-section").value = titles[S.page] || S.page;
    updateAICooldown();
    $("bug-dialog").showModal();
  }
  async function submitBug(e) {
    e.preventDefault();
    if (!checkAuth("bugs.submit") || S.bugBusy) return;
    if (S.bugUntil > Date.now())
      return toast("Следующее обращение через " + duration((S.bugUntil - Date.now()) / 1000), "warning");
    S.bugBusy = true;
    updateAICooldown();
    let path = null,
      submitted = false;
    try {
      const f = new FormData(e.target),
        file = $("bug-screenshot").files[0];
      if (file) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 3000000)
          throw Error("Скриншот: JPEG, PNG или WebP до 3 МБ");
        const data = await fileAsJpeg(file, 2900000);
        const blob = await (await fetch(data)).blob();
        path = S.user.id + "/" + crypto.randomUUID() + ".jpg";
        const { error } = await S.sb.storage
          .from("bug-screenshots")
          .upload(path, blob, { contentType: "image/jpeg", upsert: false });
        if (error) throw error;
      }
      const { data, error } = await S.sb.rpc("v12_submit_bug", {
        bug_category: f.get("category"),
        bug_section: String(f.get("section")).trim(),
        bug_description: String(f.get("description")).trim(),
        screenshot: path,
      });
      if (error) throw error;
      submitted = true;
      S.bugUntil = Date.now() + 3600000;
      $("bug-dialog").close();
      e.target.reset();
      notify({
        type: "success",
        title: "Заявка #" + data + " успешно отправлена",
        description: "Статус и ответ администрации появятся в уведомлениях.",
        dedupe: "bug-created-" + data,
      });
      await loadNotifications();
      if (S.page === "admin" && S.adminTab === "mybugs") loadBugs();
    } catch (err) {
      const m = formatError(err),
        wait = m.match(/BUG_COOLDOWN:(\d+)/);
      if (wait) S.bugUntil = Date.now() + Number(wait[1]) * 1000;
      toast(m.replace(/BUG_COOLDOWN:\d+\s*/, ""), "error");
    } finally {
      if (path && !submitted)
        await S.sb.storage
          .from("bug-screenshots")
          .remove([path])
          .catch(() => {});
      S.bugBusy = false;
      updateAICooldown();
    }
  }
  async function loadBugs() {
    const admin = isAdmin() && S.adminTab === "bugs";
    let q = S.sb.from("bug_reports").select("*").order("created_at", { ascending: false }).limit(100);
    if (!admin) q = q.eq("user_id", S.user.id);
    const { data, error } = await q;
    if (error) throw error;
    S.bugs = data || [];
    html(
      "admin-content",
      `<div class="card"><div class="section-label"><h3>${admin ? "Обращения участников" : "Мои обращения"}</h3><button class="btn btn-secondary" data-open-bug>Новое обращение</button></div><p>Показаны последние 100 заявок. Полная история каждой заявки доступна при открытии.</p><div class="bug-list">${S.bugs.map((r) => `<button class="bug-row" data-bug-detail="${r.id}"><b>#${r.id}</b><div><strong>${esc(r.section)}</strong><p>${esc(r.description.slice(0, 130))}</p><small>${esc(fmtDate(r.created_at))} · ${esc(r.category)}</small></div><span class="status-tag status-${r.status}">${esc(bugStatuses[r.status])}</span><span>↗</span></button>`).join("") || '<div class="empty">Обращений пока нет.</div>'}</div></div>`,
    );
  }
  async function showBug(id) {
    let r = S.bugs?.find((x) => String(x.id) === String(id));
    if (!r) {
      const { data, error } = await S.sb.from("bug_reports").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      r = data;
    }
    if (!r) return;
    S.currentBug = r;
    const { data: events, error } = await S.sb
      .from("bug_report_events")
      .select("*")
      .eq("report_id", id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    let screenshot = "";
    if (r.screenshot_path) {
      const s = await S.sb.storage.from("bug-screenshots").createSignedUrl(r.screenshot_path, 300);
      if (s.error) screenshot = "<p>Не удалось открыть скриншот: " + esc(formatError(s.error)) + "</p>";
      else if (safeUrl(s.data.signedUrl))
        screenshot = `<a href="${esc(s.data.signedUrl)}" target="_blank" rel="noopener noreferrer"><img class="bug-image" src="${esc(s.data.signedUrl)}" alt="Скриншот ошибки"></a><small>Закрытая ссылка действует 5 минут.</small>`;
    }
    html(
      "detail-content",
      `<span class="eyebrow">ОБРАЩЕНИЕ #${r.id}</span><h2>${esc(r.section)}</h2><span class="status-tag status-${r.status}">${esc(bugStatuses[r.status])}</span><p class="pre-wrap"><span translate="no">${esc(r.description)}</span></p>${screenshot}<h3>История</h3><div class="event-history">${(events || []).map((x) => `<article><small>${esc(fmtDate(x.created_at))}</small><b>${x.kind === "created" ? "Обращение получено" : x.kind === "status" ? esc(bugStatuses[x.status]) : "Ответ администрации"}</b><p>${esc(x.message)}</p></article>`).join("")}</div>${
        isAdmin()
          ? `<form id="bug-admin-form" class="stack-form"><label>Статус<select name="status">${Object.entries(
              bugStatuses,
            )
              .map(([k, l]) => `<option value="${k}" ${r.status === k ? "selected" : ""}>${l}</option>`)
              .join(
                "",
              )}</select></label><label>Ответ пользователю<textarea name="message" rows="3" maxlength="2000"></textarea></label><button type="submit" class="btn btn-primary">Сохранить и уведомить</button></form>`
          : ""
      }`,
    );
    if (!$("detail-dialog").open) $("detail-dialog").showModal();
  }
  async function adminAIConfig() {
    const { data, error } = await S.sb.rpc("v12_ai_admin_state");
    if (error) throw error;
    S.aiAdmin = data;
    S.editAI = structuredClone(data.draft);
    renderAIConfigForm();
  }
  function renderAIConfigForm() {
    const c = S.editAI || defaultAI;
    html(
      "admin-content",
      `<div class="admin-grid ai-admin-grid"><div class="card"><span class="eyebrow">YANEAI / CONTROL ROOM</span><h3>Настройки ЯнеAI</h3><p>Сохранение меняет только черновик. Опубликуй проверенную версию, чтобы применить её для всех.</p><form id="ai-config-form" class="stack-form"><label>Приветствие<textarea name="greeting" rows="3" maxlength="1500" required>${esc(c.greeting)}</textarea></label><button type="button" class="link-btn" id="ai-reset-greeting">Восстановить стандартное приветствие</button><fieldset><legend>Стартовые подсказки · до 8</legend><div id="starter-editor">${starterEditorHTML(c.starters)}</div><button type="button" class="btn btn-secondary" id="ai-add-starter">＋ Добавить подсказку</button></fieldset><div class="grid-form"><label>Стиль<select name="style">${[
        ["friendly", "Дружелюбный"],
        ["professional", "Профессиональный"],
        ["mentor", "Наставник"],
        ["custom", "Свой стиль"],
      ]
        .map(([k, l]) => `<option value="${k}" ${c.style === k ? "selected" : ""}>${l}</option>`)
        .join("")}</select></label><label>Подробность<select name="verbosity">${[
        ["short", "Кратко"],
        ["standard", "Стандартно"],
        ["detailed", "Подробно"],
      ]
        .map(([k, l]) => `<option value="${k}" ${c.verbosity === k ? "selected" : ""}>${l}</option>`)
        .join("")}</select></label></div>${[
        ["customStyle", "Описание своего стиля", 600],
        ["tone", "Тон и характер", 600],
        ["formatting", "Правила оформления", 1200],
        ["instructions", "Дополнительные инструкции", 4000],
      ]
        .map(
          ([k, l, max]) =>
            `<label>${l}<textarea name="${k}" maxlength="${max}" rows="${k === "instructions" ? 4 : 2}">${esc(c[k] || "")}</textarea></label>`,
        )
        .join(
          "",
        )}<label>Приоритетные темы · по одной в строке<textarea name="topics" rows="4">${esc((c.topics || []).join("\n"))}</textarea></label><div class="table-actions"><button type="submit" class="btn btn-secondary">Сохранить черновик</button><button type="button" class="btn btn-primary" id="ai-publish">Опубликовать</button><button type="button" class="btn btn-secondary" id="ai-reset-config">Сбросить к стандартным</button></div><button type="button" class="link-btn" id="ai-restore-previous">Восстановить предыдущую версию</button></form></div><div><div class="card"><h3>Тестовый чат</h3><p>Проверяет текущие поля без публикации. Использует реальный API и общий лимит 15 секунд.</p><div id="ai-test-output" class="ai-test-output"><p>${esc(c.greeting)}</p></div><form id="ai-test-form" class="stack-form"><label>Тестовый вопрос<textarea name="question" required maxlength="4500" rows="3" placeholder="Объясни, как улучшить звук"></textarea></label><button class="btn btn-primary" type="submit">Протестировать</button></form></div><div class="card"><h3>История версий</h3><p>Опубликована: ${S.aiAdmin.published_version ? "#" + S.aiAdmin.published_version : "стандартная"}</p>${(S.aiAdmin.versions || []).map((v) => `<div class="version-row"><b>#${v.id} · ${v.action === "restore" ? "Восстановление" : "Публикация"}</b><small>${esc(v.author)} · ${esc(fmtDate(v.created_at))}</small><p>${esc(v.note || "")}</p><div class="table-actions"><button data-view-ai-version="${v.id}">Посмотреть</button><button data-restore-ai-version="${v.id}">Восстановить</button></div></div>`).join("") || '<div class="empty">Опубликованных версий ещё нет.</div>'}</div></div></div>`,
    );
  }
  function starterEditorHTML(arr) {
    return (arr || [])
      .map(
        (s, i) =>
          `<div class="starter-edit-row"><input data-starter-index="${i}" value="${esc(s)}" maxlength="140" required aria-label="Подсказка ${i + 1}"><button type="button" data-starter-move="${i}" data-dir="-1" aria-label="Выше" ${i === 0 ? "disabled" : ""}>↑</button><button type="button" data-starter-move="${i}" data-dir="1" aria-label="Ниже" ${i === arr.length - 1 ? "disabled" : ""}>↓</button><button type="button" data-starter-remove="${i}" aria-label="Удалить">×</button></div>`,
      )
      .join("");
  }
  function collectAIConfig() {
    const f = new FormData($("ai-config-form"));
    return {
      greeting: f.get("greeting"),
      starters: $$("[data-starter-index]").map((x) => x.value.trim()),
      style: f.get("style"),
      customStyle: f.get("customStyle"),
      verbosity: f.get("verbosity"),
      tone: f.get("tone"),
      formatting: f.get("formatting"),
      instructions: f.get("instructions"),
      topics: String(f.get("topics") || "")
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean),
    };
  }
  async function saveAIConfig(publish = false) {
    if (!requireAdmin()) return;
    if (!$("ai-config-form").reportValidity()) return;
    const c = collectAIConfig();
    const { error } = await S.sb.rpc("v12_ai_save_draft", { cfg: c });
    if (error) throw error;
    if (publish) {
      const note = await customPrompt("Комментарий к публикации:", "");
      if (note === null) return;
      const r = await S.sb.rpc("v12_ai_publish", { note_text: note });
      if (r.error) throw r.error;
      await loadAIConfig();
      toast("Настройки ЯнеAI опубликованы", "success");
    } else toast("Черновик сохранён", "success");
    await adminAIConfig();
  }
  async function restoreAI(id) {
    if (
      !requireAdmin() ||
      !await customConfirm("Восстановить и опубликовать версию #" + id + "? Текущая версия останется в истории.")
    )
      return;
    const { error } = await S.sb.rpc("v12_ai_restore", { version_id: Number(id) });
    if (error) throw error;
    await loadAIConfig();
    await adminAIConfig();
    toast("Предыдущая версия восстановлена", "success");
  }
  async function testAI(e) {
    e.preventDefault();
    if (!requireAdmin()) return;
    if (cooldownLeft()) throw Error("Следующий запрос через " + cooldownLeft() + " с");
    const b = e.target.querySelector("button");
    b.disabled = true;
    setAIState("thinking", "Тестирует настройки");
    try {
      const question = new FormData(e.target).get("question");
      const {
        data: { session },
      } = await S.sb.auth.getSession();
      const r = await fetch(cfg.aiFunction || "/api/yaneai", {
        method: "POST",
        headers: { "content-type": "application/json", ...(session?.access_token ? {Authorization: "Bearer " + session.access_token} : {}) },
        body: JSON.stringify({ message: question, testConfig: collectAIConfig(), language: S.lang, stream: true }),
      });
      if (!r.ok) {
        const d = await r.json();
        if (d.waitSeconds) S.aiUntil = Date.now() + d.waitSeconds * 1000;
        throw Error(d.error || "Ошибка тестового чата");
      }
      S.aiUntil = Date.now() + (signed()?15000:25000);
      localStorage.setItem("yane-ai-until-"+(S.user?.id||"guest"),String(S.aiUntil));
      let text = "";
      html("ai-test-output", "<b>ЯнеИИ ✦</b><p></p>");
      await readNDJSON(r, (evt) => {
        if (evt.t === "error") throw Error(evt.error);
        if (evt.t === "chunk") text += evt.text;
        if (evt.t === "done") text = evt.answer;
        $("ai-test-output").querySelector("p").textContent = text;
      });
      setAIState("ready");
    } catch (e) {
      setAIState("error", "Ошибка тестового чата");
      throw e;
    } finally {
      b.disabled = false;
      refreshStatus();
    }
  }
  async function adminRating() {
    await loadProfiles();
    const { data, error } = await S.sb.rpc("v12_admin_rating_state");
    if (error) throw error;
    S.ratingAdmin = data;
    const users = S.profiles.map((p) => `<option value="${esc(p.id)}"><span translate="no">${esc(p.username)}</span></option>`).join("");
    html(
      "admin-content",
      `<div class="card"><h3>Правила начисления</h3><p>Самоотметки уроков по умолчанию без очков. Начисления за проверенные действия уникальны по источнику.</p>${data.rules.map((r) => `<form class="rating-rule-form grid-form" data-rule-code="${r.code}"><label>${esc(r.title)}<input name="points" type="number" min="-10000" max="10000" value="${r.points}" required></label><label class="check-label"><input name="active" type="checkbox" ${r.active ? "checked" : ""}> Начислять очки</label><label class="check-label"><input name="recalc" type="checkbox"> Пересчитать историю</label><button class="btn btn-secondary" type="submit">Сохранить правило</button></form>`).join("")}</div><div class="admin-grid"><div class="card"><h3>Проверенное действие / корректировка</h3><form id="rating-action-form" class="stack-form"><label>Участник<select name="user">${users}</select></label><label>Действие<select name="action"><option value="adjust">Ручная корректировка</option><option value="task">Проверенное задание</option></select></label><label>Очки корректировки<input name="delta" type="number" value="0" min="-100000" max="100000"></label><label>Уникальный ключ задания<input name="key" maxlength="100" placeholder="weekly-edit-2026-01"></label><label>Причина / название задания<textarea name="reason" required minlength="3" maxlength="300" rows="3"></textarea></label><button class="btn btn-primary" type="submit">Применить после проверки</button></form></div></div><div class="card"><h3>История правил</h3>${data.history.map((h) => `<div class="rule-row"><b>${esc(h.rule_code)}: ${h.old_points} → ${h.new_points}</b><p>${esc(h.author || "—")} · ${esc(fmtDate(h.changed_at))} · ${h.recalculated ? "Пересчитано " + h.affected + " записей" : "Без пересчёта"}</p></div>`).join("") || "<p>Изменений ещё нет.</p>"}</div><div class="card"><h3>Последние начисления · до 120</h3><div class="table-scroll"><table><thead><tr><th>Участник / время</th><th>Очки</th><th>Основание</th><th>Администратор</th><th></th></tr></thead><tbody>${data.events.map((v) => `<tr><td>${esc(v.username)}<small>${esc(fmtDate(v.created_at))}</small></td><td>${v.points}</td><td>${esc(v.reason)}<small>${esc(v.source_type)} / ${esc(v.source_id)}</small></td><td>${esc(v.author || "Система")}</td><td>${v.voided_at ? "Отменено" : `<button data-void-rating="${v.id}">Отменить</button>`}</td></tr>`).join("")}</tbody></table></div></div>`,
    );
  }
  const diagnosticData = [
    [
      "export",
      "Экспорт останавливается на одном месте",
      "Прогресс зависает или экспорт закрывается.",
      "Повреждённый фрагмент, тяжёлый эффект или нехватка ресурсов.",
      [
        "Сохрани копию проекта и отметь процент, на котором он останавливается.",
        "Экспортируй короткий участок вокруг проблемного кадра.",
        "Временно отключи эффекты на нём и замени исходник при необходимости.",
        "Освободи место и повтори экспорт с меньшим разрешением для проверки.",
      ],
      "Не удаляй исходники и кэш проекта без резервной копии.",
    ],
    [
      "export",
      "После экспорта чёрный экран",
      "В редакторе кадр есть, а в файле его нет.",
      "Декодер, прозрачность или несовместимый эффект.",
      [
        "Проверь экспорт в другом проигрывателе.",
        "Убедись, что нужная дорожка видима и не отключена.",
        "Попробуй H.264 в MP4 и программное кодирование.",
        "Если сбой локальный, перекодируй проблемный исходник.",
      ],
      "Сначала проверь небольшой фрагмент, а не весь проект.",
    ],
    [
      "export",
      "Неправильный формат файла",
      "Площадка не принимает результат.",
      "Неподдерживаемый контейнер или кодек.",
      [
        "Посмотри требования конкретной площадки.",
        "Выбери MP4 с видео H.264 и звуком AAC, если требования допускают.",
        "Не меняй расширение вручную — выполни экспорт или конвертацию.",
        "Проверь новый файл перед загрузкой.",
      ],
      "MP4 — контейнер, а не название видеокодека.",
    ],
    [
      "export",
      "Слишком большой размер видео",
      "Файл долго загружается и занимает много места.",
      "Чрезмерный битрейт, разрешение или длительность.",
      [
        "Сравни длительность и размер исходника.",
        "Убери лишнее и задай целевое разрешение.",
        "Снижай битрейт постепенно и сравнивай сложные сцены.",
        "Проверь требования загрузки до финального экспорта.",
      ],
      "Сильная компрессия ухудшает текст и быстрые движения.",
    ],
    [
      "export",
      "Экспорт не начинается",
      "Кнопка нажата, но файл не создаётся.",
      "Недоступная папка, недостаток места или ошибка редактора.",
      [
        "Сохрани проект и перезапусти редактор.",
        "Проверь свободное место и права на папку.",
        "Укажи локальную папку с простым именем.",
        "Проверь короткий экспорт в стандартном пресете.",
      ],
      "Не перезаписывай единственную рабочую версию проекта.",
    ],
    [
      "sound",
      "В готовом видео нет звука",
      "Видео воспроизводится без аудио.",
      "Заглушённая дорожка, неправильный выход или экспорт без аудио.",
      [
        "Проверь системную громкость и другой проигрыватель.",
        "Проверь mute, solo и громкость дорожек в редакторе.",
        "Включи экспорт аудио и выбери AAC при поддержке площадкой.",
        "Экспортируй тестовый отрывок.",
      ],
      "Проверь, есть ли аудиодорожка в исходнике.",
    ],
    [
      "sound",
      "Голос тише музыки",
      "Речь сложно разобрать.",
      "Музыка перекрывает голос по уровню и частотам.",
      [
        "Сначала выставь разборчивый голос без музыки.",
        "Плавно уменьши фон на репликах.",
        "Убери резкие пики и клиппинг.",
        "Проверь в наушниках и динамике телефона.",
      ],
      "Не нормализуй обе дорожки одинаково автоматически.",
    ],
    [
      "sound",
      "Треск и перегруз звука",
      "На громких моментах слышно искажение.",
      "Клиппинг исходника или перегруженная цепочка эффектов.",
      [
        "Посмотри индикаторы пиков на дорожке и мастере.",
        "Уменьши усиление до эффектов.",
        "Отключай плагины по одному, чтобы найти источник.",
        "Если испорчен исходник, замени звук либо аккуратно восстанови его.",
      ],
      "Простое снижение громкости не исправляет уже записанный клиппинг.",
    ],
    [
      "sound",
      "Звук постепенно уезжает",
      "В начале синхронно, в конце — нет.",
      "Переменный FPS или разные временные базы.",
      [
        "Проверь параметры исходного видео.",
        "Перекодируй переменную частоту кадров в постоянную.",
        "Поставь FPS проекта под исходник.",
        "Совмести характерные удары в начале и конце.",
      ],
      "Сдвиг всей дорожки помогает только при постоянном смещении.",
    ],
    [
      "sound",
      "Звук сдвинут на одинаковое время",
      "Голос и движение губ не совпадают.",
      "Постоянная задержка дорожки.",
      [
        "Найди отчётливый хлопок или удар.",
        "Совмести волну с соответствующим кадром.",
        "Проверь несколько точек по ролику.",
        "Отключи Bluetooth и проверь локальное воспроизведение.",
      ],
      "Беспроводные наушники могут добавлять задержку воспроизведения.",
    ],
    [
      "quality",
      "Видео размывается после публикации",
      "Локально чётко, на площадке — мыло.",
      "Повторное сжатие, низкий исходник или незавершённая обработка.",
      [
        "Сравни исходник и финальный файл на одном экране.",
        "Избегай передачи файла через сжимающие мессенджеры.",
        "Выбери достаточный битрейт и родной FPS.",
        "Подожди завершения обработки и проверь настройки качества загрузки.",
      ],
      "Экспорт в 4K не восстановит детали низкого исходника.",
    ],
    [
      "quality",
      "Неправильные FPS и рывки",
      "Движение выглядит неровным.",
      "Несогласованные FPS, пропуски кадров или перегруженный просмотр.",
      [
        "Сравни FPS исходника, проекта и экспорта.",
        "Для начала сохрани родную частоту исходника.",
        "Проверь финальный файл, а не только предпросмотр.",
        "Для замедления используй исходник с подходящей частотой кадров.",
      ],
      "Принудительные 60 FPS из 25 FPS не создают новых настоящих кадров.",
    ],
    [
      "quality",
      "Чёрные полосы по краям",
      "Картинка не заполняет вертикальный кадр.",
      "Разное соотношение сторон исходника и проекта.",
      [
        "Установи формат проекта 9:16 для вертикальной публикации.",
        "Выбери осмысленный кроп или фон.",
        "Следи за лицами, субтитрами и важными объектами.",
        "Проверь предпросмотр на телефоне.",
      ],
      "Не растягивай лица по горизонтали ради заполнения кадра.",
    ],
    [
      "quality",
      "Субтитры размыты или обрезаны",
      "Текст плохо читается на телефоне.",
      "Маленький шрифт, низкий контраст или выход за безопасную область.",
      [
        "Увеличь шрифт и сократи строки.",
        "Добавь контрастный фон или обводку.",
        "Отодвинь текст от краёв и кнопок площадки.",
        "Проверь финальное видео на телефоне.",
      ],
      "Перепроверь автоматическое распознавание слов и имён.",
    ],
    [
      "quality",
      "Цвет после экспорта отличается",
      "Файл бледнее или ярче предпросмотра.",
      "Разные цветовые профили, HDR/SDR или управление цветом.",
      [
        "Проверь параметры исходника и проекта.",
        "Для SDR-проекта используй согласованное управление цветом.",
        "Сравни файл в нескольких проигрывателях.",
        "Не исправляй вслепую цвет до проверки HDR и профилей.",
      ],
      "Разные экраны и режимы просмотра тоже меняют восприятие.",
    ],
    [
      "editor",
      "Редактор зависает",
      "Предпросмотр тормозит, интерфейс не отвечает.",
      "Тяжёлые исходники, эффекты, нехватка памяти или драйвер.",
      [
        "Сохрани проект и закрой лишние приложения.",
        "Уменьши качество предпросмотра или создай прокси.",
        "Отключи тяжёлые эффекты для проверки.",
        "Обновляй редактор и драйвер только с официальных источников.",
      ],
      "Прокси меняют скорость работы, а не качество финального экспорта.",
    ],
    [
      "editor",
      "Ошибка кодека при импорте",
      "Файл не открывается или виден только звук.",
      "Неподдерживаемый видеокодек или повреждённый контейнер.",
      [
        "Проверь файл в независимом проигрывателе.",
        "Посмотри реальный кодек, а не только расширение.",
        "Перекодируй копию в поддерживаемый редактором формат.",
        "Повтори импорт и сравни длительность и звук.",
      ],
      "Не устанавливай сомнительные пакеты кодеков.",
    ],
    [
      "editor",
      "Пропали исходники проекта",
      "Редактор показывает offline / media missing.",
      "Файлы перемещены, переименованы или диск недоступен.",
      [
        "Подключи исходный диск и найди оригинальные файлы.",
        "Используй relink / перепривязку медиа в редакторе.",
        "Проверь, что совпадают длительность и версии файлов.",
        "Собери архив проекта вместе с исходниками.",
      ],
      "Файл проекта обычно не содержит сами видео.",
    ],
    [
      "editor",
      "Не работает эффект или переход",
      "Эффект пропал или работает иначе.",
      "Изменение версии, недоступный плагин или неправильный порядок эффектов.",
      [
        "Проверь включение эффекта и ключевые кадры.",
        "Сравни версию редактора и доступность плагина.",
        "Проверь эффект в новом коротком проекте.",
        "Замени нестабильный эффект штатным аналогом.",
      ],
      "Перед обновлением сделай копию проекта.",
    ],
    [
      "publish",
      "Ошибка публикации",
      "Площадка отклоняет загрузку.",
      "Неверный формат, лимит длительности, сеть или ограничения аккаунта.",
      [
        "Прочитай точный текст ошибки.",
        "Сверь требования площадки и свойства файла.",
        "Проверь сеть и состояние аккаунта.",
        "Повтори один раз с тестовым коротким файлом; не создавай спам загрузками.",
      ],
      "Не обходи ограничения платформы новыми аккаунтами.",
    ],
    [
      "publish",
      "Музыка заблокирована",
      "После публикации звук отключён или ролик ограничен.",
      "Лицензия, региональные правила или совпадение Content ID.",
      [
        "Проверь уведомление площадки и точный участок.",
        "Выясни условия лицензии и права на конкретную запись.",
        "Замени дорожку на разрешённую для типа аккаунта и публикации.",
        "Оспаривай решение только при наличии прав и доказательств.",
      ],
      "«Без авторских прав» в названии не является лицензией.",
    ],
    [
      "publish",
      "Чужие кадры в нарезке",
      "В ролике есть клипы, логотипы или музыка других авторов.",
      "Неизвестные права на материалы.",
      [
        "Составь список сторонних материалов.",
        "Проверь разрешения и условия использования.",
        "Запусти рекомендательную проверку ЯнеAI, загрузив файл.",
        "При сомнениях замени материал или получи разрешение.",
      ],
      "Низкий риск модели не гарантирует разрешение на использование.",
    ],
    [
      "start",
      "Как выбрать момент стрима",
      "Непонятно, с чего начать нарезку.",
      "Сцена требует слишком длинного контекста.",
      [
        "Открой архив стримов и найди законченную эмоцию или событие.",
        "Отметь завязку и кульминацию.",
        "Убери паузы, сохрани понятный контекст.",
        "Покажи человеку, который не видел стрим.",
      ],
      "Короткая завершённая история лучше случайного набора эффектов.",
    ],
    [
      "start",
      "Мало просмотров",
      "Ролики набирают меньше ожидаемого.",
      "Слабый первый кадр, непонятный сюжет или неподходящая аудитория.",
      [
        "Посмотри удержание и источники трафика, если они доступны.",
        "Сократи вступление до первого значимого события.",
        "Сравни несколько осмысленно разных первых кадров.",
        "Оцени серию роликов, не делай вывод по одному.",
      ],
      "Монтаж не гарантирует охваты; используй реальные данные аналитики.",
    ],
    [
      "start",
      "Слишком много эффектов",
      "Ролик динамичный, но непонятный.",
      "Декор отвлекает от истории.",
      [
        "Собери смысловую версию без эффектов.",
        "Оставь акценты только в важных местах.",
        "Проверь, читается ли сюжет без звука.",
        "Удали эффект, если без него лучше.",
      ],
      "Каждый переход должен помогать сцене, а не просто занимать место.",
    ],
    [
      "start",
      "Как подготовить первый ролик",
      "Много настроек и непонятен порядок работы.",
      "Нет короткого рабочего процесса.",
      [
        "Создай проект нужного формата и сохрани его.",
        "Выбери фрагмент, обрежь паузы и выстрой историю.",
        "Настрой голос, субтитры и умеренные эффекты.",
        "Экспортируй тест, проверь телефон и права на материалы.",
      ],
      "Начни с одного законченного ролика и одного нового навыка.",
    ],
  ];
  function revealCards() {
    if (!S.revealObserver) return;
    $$(".screen.active .card,.screen.active .category-card").forEach((el) => {
      if (!el.dataset.reveal) {
        el.dataset.reveal = "1";
        el.classList.add("will-reveal");
        S.revealObserver.observe(el);
      }
    });
  }
  async function handleV12Click(e) {
    const b = e.target.closest("button,a");
    if (!b) return;
    try {
      if (b.dataset.language) {
        setLanguage(b.dataset.language);
        return;
      }
      if (b.dataset.setTheme) {
        setTheme(b.dataset.setTheme);
        return;
      }
      if (b.id === "notification-bell" || b.id === "open-notification-settings") {
        renderNotificationCenter();
        $("notification-dialog").showModal();
        loadNotifications();
        return;
      }
      if (b.id === "notifications-read") {
        await markNotices();
        return;
      }
      if (b.id === "notifications-clear") {
        if (signed()) {
          const { error } = await S.sb.rpc("v12_notifications_clear_read");
          if (error) throw error;
          await loadNotifications();
        }
        S.localNotices = S.localNotices.filter((x) => !x.read_at);
        persistPrefs();
        updateUnread();
        renderNotificationCenter();
        return;
      }
      if (b.dataset.readNotice) {
        await markNotices([b.dataset.readNotice]);
        return;
      }
      if (b.dataset.noticeLink) {
        $("notification-dialog").close();
        openNoticeLink(b.dataset.noticeLink, b.dataset.noticeCategory);
        return;
      }
      if (b.id === "management-login") {
        $("auth-dialog").showModal();
        return;
      }
      if (b.id === "open-bug" || b.hasAttribute("data-open-bug")) {
        openBug();
        return;
      }
      if (b.dataset.bugDetail) {
        await showBug(b.dataset.bugDetail);
        return;
      }
      if (b.dataset.diagCategory) {
        S.diagCategory = b.dataset.diagCategory;
        renderDiagnostics();
        return;
      }
      if (b.dataset.starter) {
        $("ai-question").value = b.dataset.starter;
        $("ai-question").focus();
        return;
      }
      if (b.id === "review-toggle") { setReviewCollapsed(!S.reviewCollapsed); return; }
      if (b.id === "review-close") { closeReview(); return; }
      if (b.hasAttribute("data-diag-clear")) {
        S.diagCategory = "all"; renderDiagnostics(); return;
      }
      if (b.hasAttribute("data-diag-reset")) {
        const index = Number(b.dataset.diagReset), state = diagnosticStepsState(); delete state[index];
        try { localStorage.setItem("ycl-diagnostic-steps", JSON.stringify(state)); } catch {}
        const item = b.closest("details");
        item?.querySelectorAll("[data-diag-step]").forEach(input => { input.checked = false; input.closest("li").classList.remove("step-checked"); });
        const progress = item?.querySelector("[data-diag-progress]"); if(progress) progress.textContent = `0 / ${diagnosticData[index]?.[4]?.length || 0}`;
        return;
      }
      if (b.hasAttribute("data-diag-copy")) {
        const data = diagnosticData[Number(b.dataset.diagCopy)]; if (!data) return;
        const translate = text => window.YANE_I18N?.translate(text) || text;
        const plan = [data[1], data[2], data[3], ...data[4].map((step, n) => `${n + 1}. ${step}`), data[5]].map(translate).join("\n\n");
        try { await navigator.clipboard.writeText(plan); toast("План решения скопирован", "success"); }
        catch { toast("Не удалось скопировать план", "warning"); }
        return;
      }
      if (b.hasAttribute("data-seek")) {
        const v = $("review-player");
        if (v) {
          setReviewCollapsed(false);
          const seek = Math.max(0, Number(b.dataset.seek) || 0);
          v.currentTime = Number.isFinite(v.duration) ? Math.min(seek, v.duration) : seek;
          v.play().catch(() => {});
          v.scrollIntoView({ behavior: "smooth", block: "center" });
        } else toast("Для перехода к моменту нужно повторно загрузить исходный файл", "info");
        return;
      }
      if (b.id === "chat-new-messages" || b.id === "ai-new-messages") {
        const box = $(b.id.startsWith("chat") ? "chat-stream" : "ai-messages");
        box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
        b.hidden = true;
        return;
      }
      if (b.dataset.completeLesson) {
        await completeLesson(b.dataset.completeLesson, b);
        return;
      }
      if (b.dataset.revokeSanction) {
        const reason = await customPrompt("Причина снятия:", "");
        if (reason === null) return;
        const { error } = await S.sb.rpc("v12_admin_revoke_sanction", {
          sanction_id: Number(b.dataset.revokeSanction),
          reason_text: reason,
        });
        if (error) throw error;
        await manageUser(S.selectedUser);
        toast("Ограничение снято", "success");
        return;
      }
      if (b.id === "ai-add-starter" || b.hasAttribute("data-starter-remove") || b.hasAttribute("data-starter-move")) {
        const c = collectAIConfig();
        if (b.id === "ai-add-starter") {
          if (c.starters.length >= 8) return toast("Максимум 8 подсказок", "warning");
          c.starters.push("Новая подсказка");
        }
        if (b.hasAttribute("data-starter-remove")) c.starters.splice(Number(b.dataset.starterRemove), 1);
        if (b.hasAttribute("data-starter-move")) {
          const i = Number(b.dataset.starterMove),
            j = i + Number(b.dataset.dir);
          if (j >= 0 && j < c.starters.length) [c.starters[i], c.starters[j]] = [c.starters[j], c.starters[i]];
        }
        html("starter-editor", starterEditorHTML(c.starters));
        return;
      }
      if (b.id === "ai-reset-greeting") {
        $("ai-config-form").elements.greeting.value = S.aiAdmin.defaults.greeting;
        return;
      }
      if (b.id === "ai-publish") {
        b.disabled = true;
        await saveAIConfig(true);
        return;
      }
      if (b.id === "ai-reset-config") {
        if (!await customConfirm("Сбросить черновик? Опубликованная версия не изменится.")) return;
        const { error } = await S.sb.rpc("v12_ai_reset_draft");
        if (error) throw error;
        await adminAIConfig();
        toast("Черновик сброшен", "success");
        return;
      }
      if (b.dataset.restoreAiVersion) {
        await restoreAI(b.dataset.restoreAiVersion);
        return;
      }
      if (b.id === "ai-restore-previous") {
        const v = S.aiAdmin.versions.find((x) => x.id !== S.aiAdmin.published_version);
        if (!v) return toast("Предыдущей версии ещё нет", "info");
        await restoreAI(v.id);
        return;
      }
      if (b.dataset.viewAiVersion) {
        const v = S.aiAdmin.versions.find((x) => String(x.id) === b.dataset.viewAiVersion);
        html(
          "detail-content",
          `<h2>Версия #${v.id}</h2><p>${esc(v.author)} · ${esc(fmtDate(v.created_at))}</p><pre class="config-preview">${esc(JSON.stringify(v.config, null, 2))}</pre>`,
        );
        $("detail-dialog").showModal();
        return;
      }
      if (b.dataset.voidRating) {
        const reason = await customPrompt("Причина отмены начисления:", "");
        if (reason === null) return;
        const { error } = await S.sb.rpc("v12_admin_void_event", {
          event_id: Number(b.dataset.voidRating),
          reason_text: reason,
        });
        if (error) throw error;
        await adminRating();
        toast("Начисление отменено", "success");
        return;
      }

    } catch (err) {
      toast(formatError(err), "error");
    } finally {
      if (b.id === "ai-publish" && b.isConnected) b.disabled = false;
    }
  }
  async function handleV12Submit(e) {
    const form = e.target,
      id = form.id;
    const known = [
      "bug-form",
      "bug-admin-form",
      "ai-config-form",
      "ai-test-form",
      "sanction-form",
      "rating-action-form",
    ];
    if (!known.includes(id) && !form.classList.contains("rating-rule-form")) return;
    e.preventDefault();
    const b = form.querySelector("[type=submit]");
    if (b?.disabled) return;
    if (b) b.disabled = true;
    try {
      const f = new FormData(form);
      let r;
      if (id === "bug-form") {
        await submitBug(e);
        return;
      }
      if (id === "ai-config-form") {
        await saveAIConfig();
        return;
      }
      if (id === "ai-test-form") {
        await testAI(e);
        return;
      }
      if (!requireAdmin()) return;
      if (id === "bug-admin-form") {
        r = await S.sb.rpc("v12_admin_bug_update", {
          report_id: S.currentBug.id,
          new_status: f.get("status"),
          message: f.get("message"),
        });
        if (r.error) throw r.error;
        await loadBugs();
        await showBug(S.currentBug.id);
        toast("Ответ сохранён, пользователь уведомлён", "success");
        return;
      }
      if (id === "sanction-form") {
        r = await S.sb.rpc("v12_admin_sanction", {
          target_user: S.selectedUser,
          kind_name: f.get("kind"),
          scope_list: String(f.get("scopes"))
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          duration_seconds: Number(f.get("duration")),
          reason_text: f.get("reason"),
        });
        if (r.error) throw r.error;
        await manageUser(S.selectedUser);
        toast("Ограничение применено", "success");
        return;
      }
      if (form.classList.contains("rating-rule-form")) {
        if (
          f.has("recalc") &&
          !await customConfirm("Пересчитать все действующие начисления по этому правилу? Изменение попадёт в историю.")
        )
          return;
        r = await S.sb.rpc("v12_admin_set_rule", {
          rule: form.dataset.ruleCode,
          new_points: Number(f.get("points")),
          new_active: f.has("active"),
          recalc: f.has("recalc"),
        });
      }
      if (id === "rating-action-form") {
        if (!await customConfirm("Действие проверено? Применить изменение рейтинга?")) return;
        const action = f.get("action"),
          target = f.get("user"),
          reason = f.get("reason");
        if (action === "adjust")
          r = await S.sb.rpc("v12_admin_rating_adjust", {
            target_user: target,
            delta: Number(f.get("delta")),
            reason_text: reason,
          });
        if (action === "task")
          r = await S.sb.rpc("v12_admin_award_task", {
            target_user: target,
            task_key: f.get("key"),
            task_title: reason,
          });
      }
      if (r?.error) throw r.error;
      toast("Изменения сохранены", "success");
      await adminRating();
    } catch (err) {
      toast(formatError(err), "error");
    } finally {
      if (b && b.isConnected) {
        if (b.id === "bug-submit") updateAICooldown();
        else b.disabled = false;
      }
    }
  }
  function uiIcon(name) {
    const paths = {
      audio: "M9 18V5l12-2v13M9 18a3 3 0 1 1-3-3c1.66 0 3 1.34 3 3M21 16a3 3 0 1 1-3-3c1.66 0 3 1.34 3 3",
      chevron: "m6 9 6 6 6-6",
      sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5",
      moon: "M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10",
      close: "M6 6l12 12M6 18 18 6",
      home: "M3 10 12 3l9 7v10h-6v-6H9v6H3Z",
      ai: "m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8Z",
      rules: "M6 4h13v16H6zM3 7h3M3 12h3M3 17h3M9 8h7M9 12h7M9 16h5",
      chat: "M3 4h18v13H8l-5 4ZM7 8h10M7 12h7",
      school: "M4 3v18M20 3v18M4 8h16M4 16h16M8 3v18M16 3v18",
      diagnostics: "m12 3 9 9-9 9-9-9ZM12 7v6M12 16h.01",
      videos: "M3 5h18v14H3Zm7 3 6 4-6 4Z",
      clippers:
        "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
      stats: "M4 20V4h16v16ZM8 16v-3M12 16V8M16 16v-5",
      admin: "M4 7h16M4 17h16M8 4v6M16 14v6",
      menu: "M4 6h16M4 12h16M4 18h16",
      edit: "m15 3 6 6-11 11H4v-6ZM13 5l6 6",
    };
    return `<svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.ai}"/></svg>`;
  }
  function syncAboutLanguage(){
    $$('[data-about-lang]').forEach(el=>el.hidden=el.dataset.aboutLang!==S.lang);
  }
  function openAbout(){
    syncAboutLanguage();
    $('app').classList.remove('menu-open');$('scrim').hidden=true;
    $('about-dialog').showModal();$('about-dialog').querySelector('.about-copy').scrollTop=0;
  }
  function setupV12() {
    loadLocalPrefs();
    setupCustomization();
    renderAIHistory();
    $$("[data-nav]").forEach((b) => {
      b.setAttribute("aria-label", b.querySelector("[data-i18n]")?.textContent || b.dataset.nav);
      b.title = b.getAttribute("aria-label");
      const icon = b.querySelector(".nav-icon");
      if (icon) icon.innerHTML = uiIcon(b.dataset.nav);
    });
    $$(".quick").forEach((b) => {
      const icon = b.querySelector("span");
      if (icon) icon.innerHTML = uiIcon(b.dataset.go);
    });
    $("menu-toggle").innerHTML = uiIcon("menu");
    $("side-close").innerHTML = uiIcon("close");
    $$(".modal-close").forEach((b) => (b.innerHTML = uiIcon("close")));
    $("updates-button").innerHTML = uiIcon("edit") + '<i class="notification-dot" id="release-dot" hidden></i>';
    const core = document.querySelector(".core-center");
    if (core) core.innerHTML = uiIcon("ai");

    document.addEventListener("click", handleV12Click);
    document.addEventListener("submit", handleV12Submit);
    document.addEventListener("change", async (e) => {
      if (e.target.id === "rating-period") loadLeaderboard();
      if (e.target.dataset.pref || e.target.dataset.categoryPref) {
        if (e.target.dataset.pref) S.prefs[e.target.dataset.pref] = e.target.checked;
        else S.prefs.categories = { ...S.prefs.categories, [e.target.dataset.categoryPref]: e.target.checked };
        await saveUIPrefs();
      }
    });
    document.addEventListener("click", (e) => {
      if (!$("language-picker").contains(e.target)) $("language-picker").open = false;
    });
    ["chat", "ai"].forEach((k) => {
      const box = $(k === "chat" ? "chat-stream" : "ai-messages");
      box.addEventListener(
        "scroll",
        () => {
          if (isPinned(box)) $(k + "-new-messages").hidden = true;
        },
        { passive: true },
      );
    });
    const drop = $("screen-ai").querySelector(".composer");
    drop.classList.add("upload-zone");
    drop.addEventListener("dragover", (e) => {
      e.preventDefault();
      drop.classList.add("drag-over");
    });
    drop.addEventListener("dragleave", () => drop.classList.remove("drag-over"));
    drop.addEventListener("drop", (e) => {
      e.preventDefault();
      drop.classList.remove("drag-over");
      const file = e.dataTransfer.files[0];
      if (file) {
        const d = new DataTransfer();
        d.items.add(file);
        $("ai-file").files = d.files;
        aiFileChanged();
      }
    });
    $$("dialog").forEach((d) => {
      d.addEventListener("click", (e) => {
        if (e.target === d) {
          const r = d.getBoundingClientRect();
          if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
        }
      });
    });
    if ("IntersectionObserver" in window) {
      S.revealObserver = new IntersectionObserver(
        (entries) =>
          entries.forEach((x) => {
            if (x.isIntersecting) {
              x.target.classList.add("is-revealed");
              S.revealObserver.unobserve(x.target);
            }
          }),
        { threshold: 0.05 },
      );
      revealCards();
    }
    if (matchMedia("(pointer:fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.addEventListener(
        "pointermove",
        (e) => {
          const b = e.target.closest(".btn-primary");
          if (b && !S.prefs.lite && !reducedCustom() && !economicalCustom() && currentCustom().intensity !== "low") {
            const r = b.getBoundingClientRect();
            b.style.translate = `${(e.clientX - r.x - r.width / 2) * 0.035}px ${(e.clientY - r.y - r.height / 2) * 0.045}px`;
            b.addEventListener("pointerleave", () => (b.style.translate = ""), { once: true });
          }
        },
        { passive: true },
      );
    }
    if (!sessionStorage.getItem("ycl-v12-intro")) {
      $("app").classList.add("intro");
      sessionStorage.setItem("ycl-v12-intro", "1");
      setTimeout(() => $("app").classList.remove("intro"), 700);
    }
    setInterval(() => {
      if (!document.hidden) {
        refreshStatus();
        loadNotifications();
        if (S.page === "chat" && signed()) loadChat();
      }
    }, 12000);
    window.addEventListener("focus", () => {
      refreshStatus();
      loadNotifications();
    });
    window.addEventListener("online", () => {
      if (S.sb) {
        refreshStatus();
        loadNotifications();
      } else initBackend();
    });
    window.addEventListener("beforeunload", () => {
      if (S.videoObjectURL) URL.revokeObjectURL(S.videoObjectURL);
    });
  }

  const BUTTON_LABELS={home:'Главная',ai:'ЯнеAI',rules:'Правила',chat:'Общий чат',school:'Школа монтажа',diagnostics:'Диагностика',videos:'Видео',clippers:'Нарезчики',stats:'Календарь и статистика',admin:'Управления'};
  function renderButtonSettings(c){
    const list=(key,title)=>`<section class="button-settings-section"><h4>${title}</h4><div class="button-settings-list">${c[key].map((v,i)=>`<div class="button-setting" data-button-setting="${v.id}"><span class="button-order">${i+1}</span><b>${BUTTON_LABELS[v.id]}${customThemeBadge()}</b><div class="button-row-actions"><button class="icon-btn" data-button-group="${key}" data-button-id="${v.id}" data-button-action="-1" aria-label="Выше" ${i===0?'disabled':''}>↑</button><button class="icon-btn" data-button-group="${key}" data-button-id="${v.id}" data-button-action="1" aria-label="Ниже" ${i===c[key].length-1?'disabled':''}>↓</button><button class="button-visibility" data-button-group="${key}" data-button-id="${v.id}" data-button-action="toggle" aria-pressed="${v.on}" ${v.id==='home'?'disabled':''}>${v.id==='home'?'Всегда доступна':v.on?'Скрыть':'Вернуть'}</button></div></div>`).join('')}</div></section>`;
    return `<div class="custom-tip">Стрелки меняют порядок. «Скрыть» убирает только твою кнопку, а не раздел сайта. Главная и вход в кастомизацию остаются доступны.</div>${list('quickActions','Быстрые действия на главной')}${list('navigation','Пункты главного меню')}<button class="btn btn-secondary" data-reset-buttons>Вернуть стандартные кнопки</button>`;
  }
  function applyButtonLayout(c){
    const grid=document.querySelector('#screen-home .quick-grid'),nav=$('nav');
    for(const v of c.quickActions){const wrapper=$("widget-quick-"+v.id);if(wrapper){wrapper.hidden=!v.on||!c.widgets.find(w=>w.id==="quick-"+v.id)?.on;}const el=grid?.querySelector(`[data-go="${v.id}"]`);if(el){if(grid.children[c.quickActions.indexOf(v)]!==el)grid.append(el);el.hidden=!v.on;}}
    if(grid){grid.hidden=!c.quickActions.some(v=>v.on);const label=grid.previousElementSibling;if(label)label.hidden=grid.hidden;}
    for(const v of c.navigation){const el=nav?.querySelector(`[data-nav="${v.id}"]`);if(el){if([...nav.querySelectorAll('[data-nav]')][c.navigation.indexOf(v)]!==el)nav.insertBefore(el,$('nav-indicator'));el.hidden=!v.on;}}
    const about=$('open-about'),admin=nav?.querySelector('[data-nav=admin]');
    if(about&&admin)admin.before(about);
    $('notification-stack').dataset.position=c.noticePosition;
  }
  // Personal interface preferences, staged until explicit Apply. No content/permissions writes.
  // Release switch: free placement and layout editors are suspended until rework.
  const VISUAL_EDITOR_ENABLED = false;
  const CUSTOM_DEFAULT = {
    arrival: "standard",
    click: "press",
    speed: "normal",
    intensity: "balanced",
    background: "aurora",
    lightBackground:"liquid",darkBackground:"aurora",bottomDock:true,dockRestored:true,placements:{},floatingPosition:null,
    glassMaterial:"solid",borderStrength:35,
    customColors:["#6750d8","#426bd6"],banner:"orbital",homeCanvasHeight:1100,
    accent: "purple",
    auroraSpeed: "normal",
    auroraStrength: 75,
    reactive: true,
    noticePosition: "top-right",
    noticeDuration: "6",
    quickActions: ["ai","school","stats","chat"].map(id=>({id,on:true})),
    navigation: ["home","ai","rules","chat","school","diagnostics","videos","clippers","stats","admin"].map(id=>({id,on:true})),
    opacity: 94,
    blur: "medium",
    glow: "low",
    radius: "standard",
    shadow: "soft",
    menu: "left",
    density: "standard",
    text: "standard",
    sounds: false,
    reduce: false,
    performance: "auto",
    widgets: [
      {id:"hero",on:true,size:"large"},
      {id:"counters",on:true,size:"large"},
      ...["ai","school","stats","chat"].map(id=>({id:"quick-"+id,on:true,size:"medium"})),
      { id: "stats", on: true, size: "small" },
      { id: "videos", on: true, size: "medium" },
      { id: "school", on: true, size: "small" },
      { id: "rating", on: false, size: "small" },
      { id: "calendar", on: false, size: "medium" },
      { id: "ai", on: false, size: "small" },
      { id: "news", on: true, size: "small" },
      { id: "links", on: true, size: "small" },
    ],
  };
  const CUSTOM_OPTIONS = {
    lightBackground:["liquid","mesh","standard","minimal"],darkBackground:["aurora","nebula","mesh","standard","minimal"],glassMaterial:["solid","pearl","ice","crystal","aqua"],banner:["orbital","studio","signal","minimal"],
    arrival: ["standard", "fade", "up", "down", "zoom", "scale", "spring", "none"],
    click: ["standard", "press", "ripple", "glow", "bounce", "pulse", "none"],
    speed: ["slow", "normal", "fast"],
    intensity: ["low", "balanced", "high"],
    background: ["aurora", "liquid", "nebula", "mesh", "standard", "minimal"],
    noticePosition: ["top-right","bottom-right","bottom-left"],
    noticeDuration: ["4","6","9"],
    accent: ["purple", "ocean", "emerald", "sunset", "rose", "mono", "custom"],
    auroraSpeed: ["slow", "normal", "fast"],
    blur: ["off", "medium", "strong"],
    glow: ["off", "low", "medium", "high"],
    radius: ["minimal", "standard", "large"],
    shadow: ["none", "soft", "strong"],
    menu: ["left", "top", "compact", "floating"],
    density: ["compact", "standard", "spacious"],
    text: ["small", "standard", "large"],
    performance: ["auto", "smooth", "economy"],
  };
  const CUSTOM_PALETTES = {
    purple: ["#6750d8", "#426bd6", "#b5a6ff", "#8bb4ff"],
    ocean: ["#1763b6", "#13718b", "#88bdff", "#80d3df"],
    emerald: ["#197457", "#246aa4", "#81d8b1", "#92b9f7"],
    sunset: ["#a64b35", "#b54273", "#ffb193", "#f5a3c5"],
    rose: ["#a33578", "#7750b2", "#ef9acd", "#bda6f3"],
    mono: ["#505966", "#697486", "#c3cbd7", "#a3adbd"],
  };
  const WIDGET_META = {
    hero:["ai","Главный баннер","Приветствие и быстрый переход к ЯнеAI"],
    counters:["stats","Счётчики сообщества","Участники, видео и просмотры"],
    "quick-ai":["ai","Кнопка ЯнеAI","Быстрый переход к помощнику"],
    "quick-school":["school","Кнопка школы монтажа","Быстрый переход к урокам"],
    "quick-stats":["stats","Кнопка статистики","Быстрый переход к календарю"],
    "quick-chat":["chat","Кнопка общего чата","Быстрый переход в сообщество"],
    stats: ["stats", "Статистика", "Твоя цель и подтверждённые просмотры"],
    videos: ["videos", "Последние видео", "Опубликованные работы сообщества"],
    school: ["school", "Прогресс обучения", "Пройденные уроки и переход в школу"],
    rating: ["clippers", "Рейтинг", "Лидеры по подтверждённым действиям"],
    calendar: ["stats", "Календарь", "Публикации из личной статистики"],
    ai: ["ai", "ЯнеAI", "Быстрый вопрос помощнику"],
    news: ["rules", "Новости", "Опубликованные обновления сайта"],
    links: ["chat", "Полезные ссылки", "Сообщество и архив стримов"],
  };
  const CUSTOM_TABS = [
    ["animations", "ai", "Анимации"],
    ["backgrounds", "moon", "Фоны"],
    ["colors", "sun", "Цвета интерфейса"],
    ["banner", "ai", "Главный баннер"],
    ["glass", "diagnostics", "Эффекты и стекло"],
    ["widgets", "videos", "Виджеты"],
    ["buttons", "edit", "Кнопки и меню"],
    ["layout", "menu", "Расположение"],
    ["visual", "edit", "Визуальный редактор"],
    ["advanced", "admin", "Дополнительно"],
  ];
  const C = {
    saved: structuredClone(CUSTOM_DEFAULT),
    draft: null,
    baseline: null,
    tab: "animations",
    editing: false,
    initialized: false,
    saving: false,
    session: crypto.randomUUID(),
    presence: new Map(),
    presenceOK: false,
    lastInput: Date.now(),
    widgetEpoch: 0,
    aiState: "ready",
  };
  function normalizeCustom(raw) {
    const x = structuredClone(CUSTOM_DEFAULT),
      r = raw && typeof raw === "object" ? raw : {};
    for (const [k, opts] of Object.entries(CUSTOM_OPTIONS)) if (opts.includes(r[k])) x[k] = r[k];
    for (const [k, min, max] of [
      ["opacity", 45, 100], ["borderStrength",0,100],
      ["auroraStrength", 20, 100],
    ])
      if (Number.isFinite(r[k])) x[k] = Math.min(max, Math.max(min, Math.round(r[k])));
    for (const k of ["sounds", "reduce", "reactive", "bottomDock"]) if(typeof r[k]==='boolean') x[k] = r[k];
    // Restore the links panel once for existing v12.6 preferences; later choices remain personal.
    x.bottomDock = r.dockRestored === true ? r.bottomDock !== false : true;
    if (Array.isArray(r.customColors)) x.customColors=x.customColors.map((v,i)=>/^#[0-9a-f]{6}$/i.test(r.customColors[i])?r.customColors[i].toLowerCase():v);
    if (["frosted","clear"].includes(r.glassMaterial)) x.glassMaterial=r.glassMaterial==="clear"?"crystal":"pearl";
    if(Number.isFinite(r.homeCanvasHeight))x.homeCanvasHeight=Math.max(600,Math.min(5000,r.homeCanvasHeight));
    if (Array.isArray(r.widgets)) {
      const seen = new Set(),
        arr = [];
      for (const w of r.widgets) {
        if (!w || !WIDGET_META[w.id] || seen.has(w.id)) continue;
        seen.add(w.id);
        arr.push({
          id: w.id,
          on: w.on === true,
          size: ["small", "medium", "large"].includes(w.size) ? w.size : "small",
        });
      }
      for (const w of x.widgets) if (!seen.has(w.id)) arr.push(w);
      // New home blocks retain their original position when loading v12.4 preferences.
      const added=x.widgets.filter(w=>!r.widgets.some(v=>v?.id===w.id)&&["hero","counters","quick-ai","quick-school","quick-stats","quick-chat"].includes(w.id));
      x.widgets = [...added,...arr.filter(w=>!added.some(v=>v.id===w.id))];
    }
    for(const key of ["quickActions","navigation"]){
      if(!Array.isArray(r[key]))continue;
      const valid=new Set(CUSTOM_DEFAULT[key].map(v=>v.id)),seen=new Set(),out=[];
      for(const v of r[key])if(v&&valid.has(v.id)&&!seen.has(v.id)){seen.add(v.id);out.push({id:v.id,on:v.id==='home'||v.on!==false});}
      for(const v of CUSTOM_DEFAULT[key])if(!seen.has(v.id))out.push({...v});
      x[key]=out;
    }
    for(const [id,pos] of Object.entries(r.placements||{}))if((['language-picker','updates-button','notification-bell','theme-toggle'].includes(id)||(id.startsWith('widget-')&&Object.hasOwn(WIDGET_META,id.slice(7))))&&pos&&['header','bottom','main','home'].includes(pos.zone))x.placements[id]={zone:pos.zone,x:Math.max(0,Math.min(1,Number(pos.x)||0)),y:Math.max(0,Math.min(1,Number(pos.y)||0))};
    if(r.floatingPosition)x.floatingPosition={x:Math.max(0,Math.min(1,Number(r.floatingPosition.x)||0)),y:Math.max(0,Math.min(1,Number(r.floatingPosition.y)||0))};
    if(!r.darkBackground&&CUSTOM_OPTIONS.darkBackground.includes(r.background))x.darkBackground=r.background;
    if(!r.lightBackground&&CUSTOM_OPTIONS.lightBackground.includes(r.background))x.lightBackground=r.background;
    return x;
  }
  // v12.5 — local appearance only. All changes share the existing draft/save transaction.
  const GLASS_STYLES = {
    pearl:{label:'Жемчужное стекло',desc:'Молочный блик и мягкая глубина',alpha:.86,blur:24,edge:'#e2d9ff',wash:'linear-gradient(145deg,#ffffff50,#c9bbf514 48%,#ffffff28)'},
    ice:{label:'Ледяное стекло',desc:'Холодный синий и чёткая грань',alpha:.73,blur:18,edge:'#a7dbff',wash:'linear-gradient(135deg,#d9edff50,#80bafc1c 48%,#c8e5ff38)'},
    crystal:{label:'Чистый кристалл',desc:'Прозрачная поверхность и тонкий свет',alpha:.60,blur:12,edge:'#ffffff',wash:'linear-gradient(120deg,#ffffff38,transparent 42%,#ffffff12 76%,#ffffff35)'},
    aqua:{label:'Голубая линза',desc:'Объёмный край и водяной перелив',alpha:.68,blur:20,edge:'#adf1ff',wash:'linear-gradient(160deg,#c4f7ff60,#78bdeb1c 47%,#a9d9f340)'},
    solid:{label:'Без стекла',desc:'Сплошная поверхность',alpha:1,blur:0,edge:'#9aa8bf',wash:'none'}
  };
  function colorRGB(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
  function luminance(hex){return colorRGB(hex).map(n=>{const v=n/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((v,n,i)=>v+n*[.2126,.7152,.0722][i],0);}
  function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
  function readableAccent(hex,dark){let rgb=colorRGB(hex);for(let n=0;n<50;n++){const h='#'+rgb.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');if(contrast(h,dark?'#1c202e':'#ffffff')>=4.5)return h;rgb=rgb.map(v=>v+(dark?255-v:-v)*.06);}return dark?'#ffffff':'#151927';}
  function customPalette(c){if(c.accent!=='custom')return CUSTOM_PALETTES[c.accent];const [a,b]=c.customColors;return [a,b,readableAccent(a,true),readableAccent(b,true)];}
  function accentText(a,b){const white=Math.min(contrast(a,'#ffffff'),contrast(b,'#ffffff')),black=Math.min(contrast(a,'#101522'),contrast(b,'#101522'));return Math.max(white,black)<4.5||white>=black?'#ffffff':'#101522';}
  function accentOverlay(a,b){return Math.min(contrast(a,accentText(a,b)),contrast(b,accentText(a,b)))<4.5?'linear-gradient(#0009,#0009)':'linear-gradient(transparent,transparent)';}
  function sizeLabel(size){return {small:'Компактный',medium:'Средний',large:'Большой'}[size];}
  function placedWidgetWidth(el,c){const size=c.widgets.find(w=>w.id===el.dataset.widgetId)?.size||'small';return `min(${ {small:340,medium:660,large:1100}[size]}px, 100%)`;}
  function socialIcon(kind){const paths={telegram:'<path d="m21 3-3.3 17-5.2-4-2.7 2.5.5-5.4L19 5.4 8 12.2 3 10.6Z"/>',twitch:'<path d="M5 2 2 7v15h6v-3h4l3-3h4l3-3V2ZM19 12l-4 4h-4l-3 3v-3H5V5h14Z"/><path d="M10 7h2v5h-2Zm5 0h2v5h-2Z"/>',drive:'<path d="m9 2 6 0 8 14h-6Z"/><path d="M9 2 1 16l3 6 8-14Z"/><path d="m5 22 3-6h15l-3 6Z"/>',download:'<path d="M11 2h2v11l4-4 1.4 1.4L12 17l-6.4-6.6L7 9l4 4ZM3 18h2v3h14v-3h2v5H3Z"/>'};return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">${paths[kind]}</svg>`;}
  function renderColorControls(c){return `<section class="custom-color-box"><div class="section-label"><h4>Свои цвета</h4><button class="btn btn-secondary" data-custom-choice="accent" data-value="custom" aria-pressed="${c.accent==='custom'}">${c.accent==='custom'?'Выбрано':'Использовать свои цвета'}</button></div><p>Выбери цвет палитрой или вставь HEX-код. Первый цвет — основной, второй — градиент.</p><div class="custom-color-fields">${c.customColors.map((hex,i)=>`<label><span>${i?'Второй цвет':'Основной цвет'}</span><span class="color-input-pair"><input type="color" data-accent-color="${i}" value="${hex}" aria-label="${i?'Второй цвет':'Основной цвет'}"><input type="text" data-accent-hex="${i}" value="${hex}" maxlength="7" pattern="#[0-9a-fA-F]{6}" spellcheck="false" aria-label="HEX ${i+1}" placeholder="#6750d8"></span></label>`).join('')}</div><small>Для текста автоматически подбирается читаемый оттенок.</small><p class="color-input-error" role="status" hidden>Введи цвет в формате #RRGGBB.</p></section>`;}
  function renderGlassControls(c){return `<div class="glass-choices">${Object.entries(GLASS_STYLES).filter(([id])=>id!=='solid').map(([id,g],i)=>`<button data-glass-style="${id}" class="glass-choice ${c.glassMaterial===id?'selected':''}" aria-pressed="${c.glassMaterial===id}"><span class="glass-demo-backdrop"><span class="glass-demo-pane" style="--demo-wash:${g.wash};--demo-blur:${g.blur}px;--demo-edge:${g.edge};--demo-alpha:${g.alpha*.9}"><i>0${i+1}</i><b>Aa</b><span>YaneCLIBB</span></span></span><b>${g.label}</b><small>${g.desc}</small></button>`).join('')}</div><div class="custom-inline-actions"><button class="btn btn-secondary" data-custom-choice="glassMaterial" data-value="solid" aria-pressed="${c.glassMaterial==='solid'}">Без стекла</button>${customThemeBadge()}</div>`+sliderControl('opacity','Плотность материала',45,100)+sliderControl('borderStrength','Выраженность контура',0,100,5)+selectControl('blur','Размытие фона',[['off','Выключено'],['medium','Среднее'],['strong','Сильное']])+selectControl('radius','Скругление углов',[['minimal','Минимальное'],['standard','Стандартное'],['large','Увеличенное']])+selectControl('glow','Свечение элементов',[['off','Выключено'],['low','Слабое'],['medium','Среднее'],['high','Яркое']])+selectControl('shadow','Тени карточек',[['none','Без теней'],['soft','Мягкие'],['strong','Выразительные']])+`<p class="custom-tip">Стиль виден сразу на панелях и карточках. Надписи остаются непрозрачными. В режиме экономии стекло упрощается.</p>`;}
  function bannerArt(){return `<div class="banner-extra-art" aria-hidden="true"><div class="studio-art"><span>YANE / STUDIO</span><div class="studio-screen">✦<i></i></div><div class="studio-tracks"><i></i><i></i><i></i></div></div><div class="signal-art">${Array.from({length:19},(_,i)=>`<i style="--bar:${24+Math.round(62*Math.abs(Math.sin(i*.7)))}%;--delay:${i*-.13}s"></i>`).join('')}</div><div class="minimal-art"><span>Y</span><i>AI</i></div></div>`;}
  function renderBannerChoices(c){return `<div class="banner-choices">${[['orbital','Орбита','Основной · знакомый стиль'],['studio','Монтажная студия','Рабочее пространство автора'],['signal','Сигнал','Ритм, звук и движение'],['minimal','Типографика','Чистый акцент на главном']].map(([id,title,desc])=>`<button class="banner-choice ${c.banner===id?'selected':''}" data-custom-choice="banner" data-value="${id}" aria-pressed="${c.banner===id}"><span class="banner-mini" data-banner-mini="${id}"></span><span><b>${title}</b><small>${desc}</small></span><i>${c.banner===id?'✓':'↗'}</i></button>`).join('')}</div><p class="custom-tip">Баннер меняет оформление, сохраняя текст и кнопку ЯнеAI.</p>`;}
  function inertClone(el){const clone=el.cloneNode(true);clone.removeAttribute('id');clone.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));clone.querySelectorAll('.widget-edit-bar,.widget-options-trigger').forEach(n=>n.remove());clone.querySelectorAll('[data-widget-id]').forEach(n=>n.removeAttribute('data-widget-id'));clone.removeAttribute('data-widget-id');clone.classList.remove('visual-movable');clone.hidden=false;clone.removeAttribute('style');clone.setAttribute('inert','');clone.setAttribute('aria-hidden','true');return clone;}
  function fillBannerPreviews(){const hero=document.querySelector('#widget-hero .hero');if(!hero)return;document.querySelectorAll('[data-banner-mini]').forEach(box=>{const clone=inertClone(hero);clone.dataset.banner=box.dataset.bannerMini;box.replaceChildren(clone);});}
  let widgetDialogState=null;
  function openWidgetOptions(id,size){
    if(C.saving||!WIDGET_META[id])return;
    let dialog=$('widget-options-dialog');
    if(!dialog){
      dialog=document.createElement('dialog');dialog.id='widget-options-dialog';dialog.className='modal widget-options-dialog';dialog.setAttribute('aria-labelledby','widget-options-title');$('app').append(dialog);
      dialog.addEventListener('close',()=>{widgetDialogState=null;});
      dialog.addEventListener('click',async e=>{
        const b=e.target.closest('button');if(!b||!widgetDialogState)return;
        if(b.dataset.previewSize){widgetDialogState.size=b.dataset.previewSize;renderWidgetOptions();return;}
        if(b.hasAttribute('data-widget-options-cancel')){dialog.close();return;}
        const {id,size}=widgetDialogState;
        if(b.hasAttribute('data-widget-options-move')){if(!VISUAL_EDITOR_ENABLED)return;dialog.close();startVisualEditor();selectVisualItem('widget-'+id);$('widget-'+id).scrollIntoView({block:'center',behavior:'instant'});return;}
        if(!b.hasAttribute('data-widget-options-apply')&&!b.hasAttribute('data-widget-options-remove'))return;
        const standalone=!C.draft;
        if(standalone){C.baseline=structuredClone(C.saved);C.draft=structuredClone(C.saved);}
        const w=C.draft.widgets.find(w=>w.id===id);w.size=size;w.on=!b.hasAttribute('data-widget-options-remove');
        if(id.startsWith('quick-'))C.draft.quickActions.find(v=>v.id===id.slice(6)).on=w.on;
        if(!w.on)delete C.draft.placements['widget-'+id];
        dialog.close();applyCustom(C.draft);
        if(standalone)await commitCustomization();else if($('customization-dialog').open)renderCustomization();
      });
    }
    const w=currentCustom().widgets.find(w=>w.id===id);
    widgetDialogState={id,size:size||w.size,on:w.on};renderWidgetOptions();if(!dialog.open)dialog.showModal();
    requestAnimationFrame(updateWidgetPreviewScale);
  }
  function renderWidgetOptions(){
    const {id,size,on}=widgetDialogState,dialog=$('widget-options-dialog');
    dialog.innerHTML=`<div class="widget-options-heading"><div><span class="eyebrow">ВИДЖЕТ / ПРЕДПРОСМОТР</span><h2 id="widget-options-title">${WIDGET_META[id][1]}</h2></div><button class="icon-btn" data-widget-options-cancel aria-label="Закрыть">×</button></div><p>${WIDGET_META[id][2]}</p><div class="widget-size-options" role="group" aria-label="Размер виджета">${['small','medium','large'].map(v=>`<button class="btn ${v===size?'btn-primary':'btn-secondary'}" data-preview-size="${v}" aria-pressed="${v===size}">${sizeLabel(v)}</button>`).join('')}</div><div class="widget-size-stage"><div id="widget-size-preview"></div></div><p class="fineprint">Предпросмотр масштаба на компьютере. На телефоне блок занимает ширину экрана.</p><div class="widget-options-actions"><button class="btn btn-secondary" data-widget-options-move ${on&&VISUAL_EDITOR_ENABLED?'':'disabled'} title="Визуальный редактор на доработке">Переместить</button><button class="btn btn-secondary remove-widget" data-widget-options-remove ${on?'':'disabled'}>Удалить с главной</button></div><div class="widget-options-footer"><button class="btn btn-secondary" data-widget-options-cancel>Отмена</button><button class="btn btn-primary" data-widget-options-apply>${on?'Подтвердить размер':'Добавить на главную'}</button></div>`;
    const source=$('widget-'+id),clone=inertClone(source);clone.dataset.size=size;clone.classList.add('widget-preview-clone');const width={small:340,medium:660,large:1100}[size];clone.style.width=width+'px';$('widget-size-preview').append(clone);window.YANE_I18N?.refresh(dialog);requestAnimationFrame(updateWidgetPreviewScale);
  }
  function updateWidgetPreviewScale(){const box=$('widget-size-preview'),clone=box?.firstElementChild;if(!clone)return;const scale=Math.min(1,box.clientWidth/clone.offsetWidth);clone.style.transform=`scale(${scale})`;box.style.height=Math.ceil(clone.offsetHeight*scale)+'px';}
  document.addEventListener('contextmenu',e=>{const widget=e.target.closest('[data-widget-id]');if(!widget||e.target.closest('input,textarea,[contenteditable]')||C.saving)return;e.preventDefault();openWidgetOptions(widget.dataset.widgetId);});
  document.addEventListener('keydown',e=>{if(e.key==='F10'&&e.shiftKey){const w=e.target.closest('[data-widget-id]');if(w){e.preventDefault();openWidgetOptions(w.dataset.widgetId);}}});
  document.addEventListener('input',e=>{
    const el=e.target;if(!C.draft||(!el.hasAttribute('data-accent-color')&&!el.hasAttribute('data-accent-hex')))return;
    const i=Number(el.dataset.accentColor??el.dataset.accentHex),valid=/^#[0-9a-f]{6}$/i.test(el.value);
    el.setAttribute('aria-invalid',String(!valid));const error=document.querySelector('.color-input-error');if(error)error.hidden=valid;if(!valid)return;
    C.draft.customColors[i]=el.value.toLowerCase();C.draft.accent='custom';
    document.querySelectorAll(`[data-accent-color="${i}"],[data-accent-hex="${i}"]`).forEach(n=>{if(n!==el)n.value=el.value;});
    document.querySelectorAll('[data-custom-choice="accent"]').forEach(b=>{b.classList.toggle('selected',b.dataset.value==='custom');b.setAttribute('aria-pressed',String(b.dataset.value==='custom'));});
    applyCustom(C.draft);updateCustomPreview();
  });
  addEventListener('resize',updateWidgetPreviewScale);

  function currentCustom() {
    return C.draft || C.saved;
  }
  function reducedCustom() {
    return currentCustom().reduce || matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function economicalCustom(c = currentCustom()) {
    return (
      c.performance === "economy" ||
      S.prefs.lite ||
      (c.performance === "auto" &&
        ((navigator.deviceMemory && navigator.deviceMemory <= 4) ||
          (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)))
    );
  }
  function customPrefsLoaded() {
    if (!C.initialized) return;
    cancelCustomization(true);
    C.saved = normalizeCustom(S.profile?.ui_prefs?.customization || S.prefs.customization);
    C.presence.clear();
    C.presenceOK = false;
    C.widgetEpoch++;
    C.widgetLoading = false;
    for (const id of ["school", "rating"])
      html("widget-body-" + id, widgetHead(id) + "<p>Загрузка личных данных…</p>");
    applyCustom(C.saved);
    setAIState("ready");
    requestAnimationFrame(() => {
      presenceHeartbeat();
      loadPresence();
      refreshWidgetData();
    });
  }
  function applyCustom(input) {
    const c = normalizeCustom(input),
      app = $("app"),
      dark = S.theme === "dark",
      p = customPalette(c),
      econ = economicalCustom(c),
      reduced = c.reduce || matchMedia("(prefers-reduced-motion: reduce)").matches;
    Object.assign(app.dataset, {
      background: dark ? c.darkBackground : c.lightBackground,
      accent: c.accent,
      banner:c.banner,
      menu: c.menu,
      density: c.density,
      textSize: c.text,
      arrival: c.arrival,
      clickFx: c.click,
      intensity: c.intensity,
      glow: c.glow,
      radius: c.radius,
      shadows: c.shadow,
      performance: econ ? "economy" : "smooth",
      motion: reduced ? "reduced" : "full",
    });
    const vars = {
      "--primary": c.accent === "custom" ? readableAccent(c.customColors[0],dark) : dark ? p[2] : p[0],
      "--primary2": c.accent === "custom" ? readableAccent(c.customColors[1],dark) : dark ? p[3] : p[1],
      "--accent-ink": p[0],
      "--accent-start": p[0],
      "--accent-end": p[1],
      "--accent-on": accentText(p[0],p[1]),
      "--accent-button-overlay": accentOverlay(p[0],p[1]),
      "--aurora-a": dark ? p[2] : p[0],
      "--aurora-b": dark ? p[3] : p[1],
      "--panel-alpha": String(c.opacity / 100),
      "--glass-blur": { off: "0px", medium: "12px", strong: "24px" }[c.blur],
      "--led-strength": { off: "0", low: ".10", medium: ".20", high: ".32" }[c.glow],
      "--led-size": { off: "0px", low: "12px", medium: "22px", high: "34px" }[c.glow],
      "--custom-radius": { minimal: "8px", standard: "12px", large: "20px" }[c.radius],
      "--fx-duration": { slow: "460ms", normal: "280ms", fast: "160ms" }[c.speed],
      "--arrival-distance": { low: "6px", balanced: "14px", high: "22px" }[c.intensity],
      "--arrival-name": {
        standard: "customStandard",
        fade: "customFade",
        up: "customUp",
        down: "customDown",
        zoom: "customZoom",
        scale: "customScale",
        spring: "customSpring",
        none: "none",
      }[c.arrival],
      "--aurora-duration": { slow: "38s", normal: "23s", fast: "14s" }[c.auroraSpeed],
      "--aurora-opacity": String((c.auroraStrength / 100) * 0.52),
      "--custom-gap": { compact: "12px", standard: "24px", spacious: "32px" }[c.density],
      "--custom-padding": { compact: "16px", standard: "24px", spacious: "32px" }[c.density],
      "--custom-text": { small: "15px", standard: "16px", large: "18px" }[c.text],
    };
    for (const [k, v] of Object.entries(vars)) app.style.setProperty(k, v);
    if($('custom-save-status'))$('custom-save-status').textContent=JSON.stringify(c)===JSON.stringify(C.saved)?'Твоё оформление':'Предпросмотр · ещё не сохранено';
    const rgb = dark ? "28,32,46" : "255,255,255";
    app.style.setProperty("--surface-rgb", rgb);
    app.style.setProperty("--surface-solid", dark ? "#1c202e" : "#ffffff");
    app.style.setProperty("--led-color", `color-mix(in srgb, ${dark ? p[2] : p[0]} ${ { off: 0, low: 10, medium: 20, high: 32 }[c.glow]}%, transparent)`);
    app.style.setProperty("--surface", `rgba(${rgb},${c.opacity / 100})`);
    app.style.setProperty(
      "--shadow",
      c.shadow === "none"
        ? "none"
        : c.shadow === "strong"
          ? dark
            ? "0 14px 36px #0005"
            : "0 12px 32px #29395718"
          : dark
            ? "0 4px 16px #0002"
            : "0 4px 16px #29395708",
    );
    app.classList.toggle("custom-reduced", reduced);
    app.classList.toggle("custom-economy", econ);
    if (C.initialized) {
      applyButtonLayout(c);
      window.YANE_BACKGROUND?.update({...c,background:dark?c.darkBackground:c.lightBackground}, dark, econ, reduced || (econ && (c.performance==='economy'||S.prefs.lite)));
      renderWidgetLayout(c);
      applyVisualLayout(c);
      document.querySelectorAll(".hero").forEach(el=>el.dataset.banner=c.banner);
      requestAnimationFrame(updateNavIndicator);
    }
  }
  // Placement metadata is personal and staged in the same draft as other customization.
  const VISUAL_ITEMS = '#language-picker,#updates-button,#notification-bell,#theme-toggle,[data-widget-id]';
  const visualHomes = new Map(), visualTabIndexes = new Map();
  let visualActive = false, visualDrag = null, visualScrollFrame = 0;
  function visualZone(name) {
    return name === 'header' ? document.querySelector('.topbar') : $(name === 'home' ? 'custom-dashboard' : name === 'bottom' ? 'visual-bottom-zone' : 'visual-main-zone');
  }
  function stopVisualEditor() {
    visualActive = false;
    visualDrag = null;
    cancelAnimationFrame(visualScrollFrame);
    visualScrollFrame = 0;
    $('app').classList.remove('visual-editing');
    $('visual-placement-controls')?.remove();
    $$('.visual-movable').forEach(el => {
      el.classList.remove('visual-movable');
      const previous = visualTabIndexes.get(el.id);
      if (previous == null) el.removeAttribute('tabindex'); else el.setAttribute('tabindex', previous);
    });
  }
  function ensureVisualLayout() {
    if ($('visual-dock')) return;
    const dock = document.createElement('footer');
    dock.id = 'visual-dock';
    dock.innerHTML = '<nav id="visual-links"></nav><div id="visual-bottom-zone"></div>';
    document.querySelector('.workspace').append(dock);
    const main = document.createElement('div');
    main.id = 'visual-main-zone';
    document.querySelector('.topbar').after(main);
    const grip = document.createElement('button');
    grip.id = 'floating-grip';
    grip.type = 'button';
    grip.setAttribute('aria-label', 'Переместить панель');
    grip.innerHTML = '<span></span>';
    document.querySelector('.sidebar').prepend(grip);
    const social=[
      ['telegram','https://t.me/yaneher','Telegram Yaneher','Официальный канал'],
      ['telegram','https://t.me/yaneher_narezki','Telegram нарезчиков','Помощь и правила'],
      ['twitch','https://www.twitch.tv/yaneher','Twitch · Yaneher','Прямые эфиры'],
      ['drive',document.querySelector('a.drive-link').href,'Архив всех стримов Янехера','Google Drive · исходники для нарезок']
    ];
    $('visual-links').innerHTML=social.map(([kind,href,title,sub])=>`<a class="dock-link dock-${kind}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${socialIcon(kind)}<span><b>${title}</b><small>${sub}</small></span><i aria-hidden="true">↗</i></a>`).join('');
    const download = document.createElement('button');
    download.className = 'btn btn-secondary dock-download';
    download.innerHTML = socialIcon('download')+'<span>Скачать вставку</span>';
    download.addEventListener('click', () => {
      const source = $('insert-download');
      if (source && !source.hidden && safeUrl(source.href)) window.open(source.href, '_blank', 'noopener');
      else toast('Ссылка на вставку пока не добавлена', 'info');
    });
    $('visual-links').append(download);
  }
  function applyVisualLayout(c) {
    ensureVisualLayout();
    // Public links must remain available without an account, including stale guest preferences.
    $('visual-dock').hidden = signed() && !c.bottomDock;
    const app = $('app'), material = c.glassMaterial;
    app.dataset.material = material;
    const glass=GLASS_STYLES[material]||GLASS_STYLES.pearl;
    const alpha=material==='solid'?1:c.opacity/100*glass.alpha;
    const surface=`rgba(${app.style.getPropertyValue('--surface-rgb')},${alpha})`;
    app.style.setProperty('--panel-alpha',String(alpha));
    app.style.setProperty('--surface',surface);
    app.style.setProperty('--material-surface',surface);
    app.style.setProperty('--glass-blur', material==='solid'||c.blur==='off'?'0px':(c.blur==='strong'?glass.blur*1.4:glass.blur)+'px');
    app.style.setProperty('--glass-wash',glass.wash);
    app.style.setProperty('--glass-edge',String(c.borderStrength/100));
    app.style.setProperty('--custom-outline',`color-mix(in srgb,${glass.edge} ${Math.max(10,c.borderStrength)}%,transparent)`);
    const side = document.querySelector('.sidebar');
    if (c.menu === 'floating' && c.floatingPosition && innerWidth > 1000) {
      side.style.left = c.floatingPosition.x * Math.max(0, innerWidth - side.offsetWidth) + 'px';
      side.style.top = c.floatingPosition.y * Math.max(0, innerHeight - side.offsetHeight) + 'px';
      side.style.bottom = 'auto';
    } else { side.style.left = ''; side.style.top = ''; side.style.bottom = ''; }

    const grid = $('custom-dashboard'), placed = [];
    document.querySelectorAll(VISUAL_ITEMS).forEach(el => {
      // Home widgets follow the user's ordered list, not stale original DOM anchors.
      if (!el.dataset.widgetId && !visualHomes.has(el.id)) {
        const marker = document.createComment('home ' + el.id);
        el.before(marker);
        visualHomes.set(el.id, marker);
      }
      let pos = VISUAL_EDITOR_ENABLED ? c.placements[el.id] : null;
      if ((pos?.zone === 'bottom' && !c.bottomDock) || (innerWidth < 700 && !visualActive)) pos = null;
      if (!pos) {
        if (el.dataset.widgetId) { if (grid && el.parentNode !== grid) grid.append(el); }
        else { const marker = visualHomes.get(el.id); if (marker?.parentNode && el.previousSibling !== marker) marker.after(el); }
        for (const key of ['position','left','top','width']) el.style[key] = '';
        return;
      }
      const zone = visualZone(pos.zone);
      if (el.parentNode !== zone) zone.append(el);
      el.style.position = 'absolute';
      if (el.dataset.widgetId) el.style.width = placedWidgetWidth(el,c);
      if (!el.hidden) placed.push({el, pos, zone});
    });
    if (grid) {
      const order = c.widgets.map(w => $('widget-' + w.id)).filter(el => el?.parentNode === grid);
      if (order.some((el, i) => grid.children[i] !== el)) order.forEach(el => grid.append(el));
    }
    // Measure after changing the card width; tall widgets must remain inside their drop area.
    for (const name of ['header', 'main', 'home', 'bottom']) {
      const zone = visualZone(name), items = placed.filter(item => item.pos.zone === name);
      const base = name === 'header' ? (visualActive ? 130 : 70) : name === 'home' ? c.homeCanvasHeight : name === 'main' ? 360 : 200;
      zone.style.minHeight = items.length ? Math.max(base, ...items.map(({el}) => el.offsetHeight + 32)) + 'px' : '';
    }
    placed.forEach(({el, pos, zone}) => {
      el.style.left = pos.x * Math.max(0, zone.clientWidth - el.offsetWidth) + 'px';
      el.style.top = pos.y * Math.max(0, zone.clientHeight - el.offsetHeight) + 'px';
    });
  }
  function selectVisualItem(id) {
    if ($('visual-element')) $('visual-element').value = id;
    if ($('visual-destination')) $('visual-destination').value = C.draft?.placements[id]?.zone || ($(id)?.dataset.widgetId ? 'home' : 'header');
  }
  function startVisualEditor() {
    if(!VISUAL_EDITOR_ENABLED){toast("Визуальный редактор на доработке", "info");return;}
    if (!C.draft) { C.baseline = structuredClone(C.saved); C.draft = structuredClone(C.saved); }
    C.draft.homeCanvasHeight=Math.max(C.draft.homeCanvasHeight,$('custom-dashboard').scrollHeight);
    C.draft.bottomDock = true;
    C.editing = true;
    visualActive = true;
    $('customization-dialog').close();
    go('home');
    $('app').classList.remove('layout-editing');
    $('app').classList.add('visual-editing');
    applyCustom(C.draft);
    $('layout-toolbar').hidden = false;
    $('layout-toolbar').querySelector('small').textContent='Перетаскивай блоки. Правый клик — размер и удаление.';
    const zones = ['Верхняя панель','Область для элементов и виджетов','Главная страница','Нижняя панель'];
    ['header','main','home','bottom'].forEach((name,i) => visualZone(name).dataset.zoneLabel = window.YANE_I18N?.translate(zones[i])||zones[i]);
    const elements = [...document.querySelectorAll(VISUAL_ITEMS)].filter(el => !el.hidden);
    elements.forEach(el => {
      if (!visualTabIndexes.has(el.id)) visualTabIndexes.set(el.id, el.getAttribute('tabindex'));
      el.classList.add('visual-movable');
      el.tabIndex = 0;
    });
    $('visual-placement-controls')?.remove();
    const controls = document.createElement('div');
    controls.id = 'visual-placement-controls';
    const labels = {'language-picker':'Язык','updates-button':'Обновления сайта','notification-bell':'Уведомления','theme-toggle':'Тема'};
    controls.innerHTML = `<label>Элемент<select id="visual-element">${elements.map(el => `<option value="${el.id}">${esc(el.dataset.widgetId ? WIDGET_META[el.dataset.widgetId][1] : labels[el.id])}</option>`).join('')}</select></label><label>Область<select id="visual-destination">${['header','main','home','bottom'].map((name,i) => `<option value="${name}">${zones[i]}</option>`).join('')}</select></label><button class="btn btn-secondary" id="visual-place">Переместить</button>`;
    $('layout-toolbar').append(controls);
    controls.querySelector('#visual-element').addEventListener('change', e => selectVisualItem(e.target.value));
    controls.querySelector('#visual-place').addEventListener('click', () => {
      const id = $('visual-element').value, zone = $('visual-destination').value;
      C.draft.placements[id] = {zone, x:0.1, y:0.1};
      applyVisualLayout(C.draft);
      $(id).scrollIntoView({block:'center',behavior:'instant'});
      $(id).focus({preventScroll:true});
    });
    selectVisualItem(elements[0]?.id);
    window.YANE_I18N?.refresh(controls);
  }
  async function persistFloatingPosition() {
    if (C.draft) return;
    const uid = S.user?.id, prefs = {...S.prefs, customization:structuredClone(C.saved)};
    S.prefs = prefs;
    persistPrefs();
    if (!signed()) return;
    try {
      const {error} = await S.sb.rpc('v12_save_ui_prefs', {prefs});
      if (error) throw error;
      if (S.user?.id === uid) S.profile.ui_prefs = prefs;
    } catch (error) { toast('Не удалось сохранить: ' + formatError(error), 'warning'); }
  }
  function dragVisualAt(x, y) {
    if (!visualDrag) return;
    const {el, grip, dx, dy, pointerId} = visualDrag, c = C.draft || C.saved;
    if (grip) {
      const left = Math.max(0,Math.min(innerWidth - el.offsetWidth,x - dx));
      const top = Math.max(0,Math.min(innerHeight - el.offsetHeight,y - dy));
      el.style.left = left + 'px'; el.style.top = top + 'px'; el.style.bottom = 'auto';
      c.floatingPosition = {x:left/Math.max(1,innerWidth - el.offsetWidth),y:top/Math.max(1,innerHeight - el.offsetHeight)};
      return;
    }
    const zoneName = ['header','bottom','home','main'].find(name => {
      const r = visualZone(name).getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });
    if (!zoneName) return;
    const zone = visualZone(zoneName);
    if (el.parentNode !== zone) {
      zone.append(el);
      // Reparenting releases pointer capture in some browsers; retain touch dragging.
      try { el.setPointerCapture(pointerId); } catch {}
    }
    el.style.position = 'absolute';
    if (el.dataset.widgetId) el.style.width = placedWidgetWidth(el,c);
    zone.style.minHeight = Math.max(zone.clientHeight,el.offsetHeight + 32) + 'px';
    const r = zone.getBoundingClientRect();
    const left = Math.max(0,Math.min(zone.clientWidth-el.offsetWidth,x-r.left-dx));
    const top = Math.max(0,Math.min(zone.clientHeight-el.offsetHeight,y-r.top-dy));
    el.style.left = left + 'px'; el.style.top = top + 'px';
    c.placements[el.id] = {zone:zoneName,x:left/Math.max(1,zone.clientWidth-el.offsetWidth),y:top/Math.max(1,zone.clientHeight-el.offsetHeight)};
    selectVisualItem(el.id);
  }
  function scrollVisualDrag() {
    visualScrollFrame = 0;
    if (!visualDrag || visualDrag.grip) return;
    const {x,y} = visualDrag, speed = y < 65 ? -14 : y > innerHeight - 65 ? 14 : 0;
    if (speed) {
      window.scrollTo({top:scrollY + speed,behavior:'instant'});
      dragVisualAt(x,y);
    }
    visualScrollFrame = requestAnimationFrame(scrollVisualDrag);
  }
  document.addEventListener('pointerdown', e => {
    const grip = e.target.closest('#floating-grip');
    const el = grip ? document.querySelector('.sidebar') : visualActive ? e.target.closest('.visual-movable') : null;
    if (!el || e.button !== 0 || C.saving || e.target.closest('[data-widget-menu]')) return;
    if (grip && ($('app').dataset.menu !== 'floating' || innerWidth <= 1000)) return;
    e.preventDefault(); e.stopPropagation();
    const r = el.getBoundingClientRect();
    visualDrag = {el,grip:!!grip,dx:e.clientX-r.left,dy:e.clientY-r.top,x:e.clientX,y:e.clientY,pointerId:e.pointerId};
    el.setPointerCapture(e.pointerId);
    if (!grip) { el.focus({preventScroll:true}); selectVisualItem(el.id); visualScrollFrame = requestAnimationFrame(scrollVisualDrag); }
  },true);
  document.addEventListener('pointermove', e => {
    if (!visualDrag) return;
    e.preventDefault();
    visualDrag.x = e.clientX; visualDrag.y = e.clientY;
    dragVisualAt(e.clientX,e.clientY);
  },{passive:false});
  const finishVisualDrag = () => {
    const wasFloating = visualDrag?.grip;
    visualDrag = null;
    cancelAnimationFrame(visualScrollFrame); visualScrollFrame = 0;
    if (wasFloating) persistFloatingPosition();
  };
  document.addEventListener('pointerup', finishVisualDrag);
  document.addEventListener('pointercancel', finishVisualDrag);
  document.addEventListener('click', e => {
    if (visualActive && e.target.closest('.visual-movable') && !e.target.closest('[data-widget-menu]')) { e.preventDefault(); e.stopImmediatePropagation(); }
  },true);
  document.addEventListener('keydown', e => {
    const arrows = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
    if (e.target.id === 'floating-grip' && arrows.includes(e.key) && innerWidth > 1000) {
      e.preventDefault();
      const c = currentCustom(), side = document.querySelector('.sidebar'), r = side.getBoundingClientRect();
      const pos = c.floatingPosition || {x:r.left/Math.max(1,innerWidth-side.offsetWidth),y:r.top/Math.max(1,innerHeight-side.offsetHeight)};
      pos.x = Math.max(0,Math.min(1,pos.x + (e.key === 'ArrowRight' ? .03 : e.key === 'ArrowLeft' ? -.03 : 0)));
      pos.y = Math.max(0,Math.min(1,pos.y + (e.key === 'ArrowDown' ? .03 : e.key === 'ArrowUp' ? -.03 : 0)));
      c.floatingPosition = pos; applyVisualLayout(c); persistFloatingPosition(); return;
    }
    if (!visualActive || $('widget-options-dialog')?.open) return;
    if (e.key === 'Escape') { cancelCustomization(); return; }
    const el = e.target.closest('.visual-movable');
    if (!el || !arrows.includes(e.key)) return;
    e.preventDefault();
    const pos = C.draft.placements[el.id] || {zone:el.dataset.widgetId ? 'home' : 'header',x:0,y:0};
    pos.x = Math.max(0,Math.min(1,pos.x + (e.key === 'ArrowRight' ? .03 : e.key === 'ArrowLeft' ? -.03 : 0)));
    pos.y = Math.max(0,Math.min(1,pos.y + (e.key === 'ArrowDown' ? .03 : e.key === 'ArrowUp' ? -.03 : 0)));
    C.draft.placements[el.id] = pos;
    applyVisualLayout(C.draft);
    selectVisualItem(el.id);
  });
  addEventListener('resize', () => { if (C.initialized) applyVisualLayout(currentCustom()); });

  function customThemeBadge() {
    return `<small class="theme-scope-badge">Обе темы</small>`;
  }
  function selectControl(key, label, entries, help = "") {
    return `<label class="custom-field"><span><b>${label}</b>${customThemeBadge()}</span><select data-custom="${key}">${entries.map(([v, l]) => `<option value="${v}" ${currentCustom()[key] === v ? "selected" : ""}>${l}</option>`).join("")}</select>${help ? `<small>${help}</small>` : ""}</label>`;
  }
  function sliderControl(key, label, min, max, step = 1, values = null) {
    const value = currentCustom()[key],
      idx = values ? values.findIndex((x) => x[0] === value) : value;
    return `<label class="custom-field custom-range"><span><b>${label}</b>${customThemeBadge()}<output data-output="${key}">${values ? values[idx][1] : value + "%"}</output></span><input type="range" data-custom="${key}" ${values ? 'data-range-options="' + values.map((x) => x[0]).join(",") + '"' : ""} min="${min}" max="${max}" step="${step}" value="${idx}"></label>`;
  }
  function toggleControl(key, label, help) {
    return `<label class="custom-toggle"><span><b>${label}</b>${customThemeBadge()}<small>${help}</small></span><input type="checkbox" role="switch" data-custom="${key}" ${key === "bottomDock" && !signed() ? "checked disabled" : currentCustom()[key] ? "checked" : ""}></label>`;
  }
  function openCustomization(tab) {
    if (C.saving) return;
    if (!C.draft) {
      C.baseline = structuredClone(C.saved);
      C.draft = structuredClone(C.saved);
    }
    if (tab) C.tab = tab;
    stopVisualEditor();
    applyCustom(C.draft);
    C.editing = false;
    $("app").classList.remove("layout-editing");
    $("layout-toolbar").hidden = true;
    renderCustomization();
    $("customization-dialog").showModal();
    $("app").classList.remove("menu-open");
    $("scrim").hidden = true;
  }
  function renderCustomization() {
    const c = currentCustom();
    html(
      "custom-tabs",
      CUSTOM_TABS.map(
        ([id, icon, label]) =>
          `<button role="tab" id="custom-tab-${id}" aria-controls="custom-panel" aria-selected="${id === C.tab}" tabindex="${id === C.tab ? "0" : "-1"}" data-custom-tab="${id}" class="${id === C.tab ? "selected" : ""}">${uiIcon(icon)}<span>${label}</span>${id === "backgrounds" ? '<i class="tab-new">LIVE</i>' : id === "glass" ? '<i class="tab-new">БЕТА</i>' : id === "visual" ? '<i class="tab-new">На доработке</i>' : ""}</button>`,
      ).join(""),
    );
    $("custom-panel").setAttribute("aria-labelledby", "custom-tab-" + C.tab);
    const title = CUSTOM_TABS.find((t) => t[0] === C.tab)[2],
      desc = {
        animations: "Плавность, которую ты чувствуешь. Без лишнего движения.",
        backgrounds: "Создай атмосферу своего рабочего пространства.",
        colors: "Один акцент объединяет весь интерфейс.",
        banner:"Четыре характера главной страницы. Выбери свой.",
        glass: "Прозрачность и глубина, не мешающие читать.",
        widgets: "Только полезное. Настрой свою главную страницу.",
        buttons: "Собери удобное меню и оставь только нужные быстрые действия.",
        layout: "Интерфейс под твой ритм работы.",
        visual:"Визуальный редактор на доработке",
        advanced: "Комфорт, доступность и бережный расход ресурсов.",
      }[C.tab];
    let body = "";
    if (C.tab === "animations")
      body =
        selectControl("arrival", "Появление элементов", [
          ["standard", "Стандартная"],
          ["fade", "Fade In"],
          ["up", "Slide Up"],
          ["down", "Slide Down"],
          ["zoom", "Zoom In"],
          ["scale", "Scale & Fade"],
          ["spring", "Spring"],
          ["none", "Без анимации"],
        ]) +
        selectControl("click", "Нажатие", [
          ["standard", "Стандартная"],
          ["press", "Press"],
          ["ripple", "Ripple"],
          ["glow", "Glow"],
          ["bounce", "Bounce"],
          ["pulse", "Pulse"],
          ["none", "Без анимации"],
        ]) +
        sliderControl("speed", "Скорость", 0, 2, 1, [
          ["slow", "Медленно"],
          ["normal", "Нормально"],
          ["fast", "Быстро"],
        ]) +
        selectControl("intensity", "Интенсивность", [
          ["low", "Минимальная"],
          ["balanced", "Сбалансированная · рекомендуется"],
          ["high", "Максимальная"],
        ]);
    if (C.tab === "backgrounds") body=['light','dark'].map(theme=>`<section class="theme-background-group"><h4>${theme==='dark'?'☾ Тёмная тема':'☀ Светлая тема'}</h4><div class="background-choices">${(theme==='dark'?[['aurora','Живая Aurora'],['nebula','Звёздная туманность'],['mesh','Цветная дымка'],['standard','Стандартный'],['minimal','Минималистичный']]:[['liquid','Жемчужный свет'],['mesh','Пастельная дымка'],['standard','Стандартный'],['minimal','Минималистичный']]).map(([id,label])=>`<button class="background-choice ${c[theme+'Background']===id?'selected':''}" data-theme-background="${theme}" data-value="${id}"><span class="background-thumb thumb-${id}" data-theme="${theme}"><canvas data-background-preview="${id}" data-preview-theme="${theme}"></canvas></span><b>${label}</b><small>${theme==='dark'?'Только тёмная тема':'Только светлая тема'}</small></button>`).join('')}</div></section>`).join('')+sliderControl('auroraStrength','Сила переливов',20,100,5)+selectControl('auroraSpeed','Скорость фона',[['slow','Спокойная'],['normal','Сбалансированная'],['fast','Живая']])+toggleControl('reactive','Реакция на курсор','Мягкое движение света за курсором.');
    if(C.tab === "banner") body=renderBannerChoices(c);
    if (C.tab === "buttons") body = renderButtonSettings(c);
    if (C.tab === "colors")
      body = `<div class="color-choices">${[
        ["purple", "Aurora Purple", "Фиолетовый / синий"],
        ["ocean", "Ocean Blue", "Океанский / голубой"],
        ["emerald", "Emerald Green", "Изумрудный / синий"],
        ["sunset", "Sunset", "Тёплый / розовый"],
        ["rose", "Rose", "Розовый / фиолетовый"],
        ["mono", "Monochrome", "Нейтральный / графит"],
      ]
        .map(
          ([id, label, desc]) =>
            `<button class="palette-choice ${c.accent === id ? "selected" : ""}" data-custom-choice="accent" data-value="${id}" aria-pressed="${c.accent === id}"><span class="palette-swatch" style="--swatch-a:${CUSTOM_PALETTES[id][0]};--swatch-b:${CUSTOM_PALETTES[id][1]}"></span><b>${label}</b>${customThemeBadge()}<small>${desc}</small><i>${c.accent === id ? "✓" : ""}</i></button>`,
        )
        .join(
          "",
        )}</div><div class="semantic-demo"><span class="semantic-success">✓ Успех</span><span class="semantic-warning">! Внимание</span><span class="semantic-error">! Ошибка</span></div><p class="custom-tip">Смысловые цвета уведомлений остаются неизменными.</p>`;
    if(C.tab==='colors')body+=renderColorControls(c);
    if(C.tab === 'glass')body=renderGlassControls(c);
    if(C.tab === 'widgets')body=`<p class="custom-tip">Нажми на виджет: размер с предпросмотром или удаление с главной.</p><div class="widget-settings">${c.widgets.map(w=>`<button class="widget-setting widget-setting-button" data-widget-menu="${w.id}"><span class="widget-mini">${uiIcon(WIDGET_META[w.id][0])}</span><span><b>${WIDGET_META[w.id][1]}</b><small>${WIDGET_META[w.id][2]}</small><small>${sizeLabel(w.size)} · ${w.on?'На главной':'Скрыт'}</small></span><span class="widget-setting-arrow">↗</span></button>`).join('')}</div><div class="custom-inline-actions"><button class="btn btn-primary" data-visual-edit>Переместить виджеты</button><button class="btn btn-secondary" data-edit-layout>Порядок в сетке</button><button class="link-btn" data-reset-widgets>Стандартный набор</button></div>`;
    if (C.tab === "layout")
      body = `<div class="menu-choices">${[
        ["left", "Слева"],
        ["top", "Сверху"],
        ["compact", "Компактное"],
        ["floating", "Плавающее"],
      ]
        .map(
          ([id, label]) =>
            `<button class="menu-choice ${c.menu === id ? "selected" : ""}" data-custom-choice="menu" data-value="${id}" aria-pressed="${c.menu === id}"><span class="menu-thumb menu-thumb-${id}"><i></i><b></b><em></em></span><strong>${label}</strong>${customThemeBadge()}<small>${c.menu === id ? "Выбрано" : "Выбрать"}</small></button>`,
        )
        .join(
          "",
        )}</div><div class="custom-tip">На телефоне все варианты используют удобное выдвижное меню. На компьютере доступны четыре разные компоновки.</div><button class="btn btn-primary" data-edit-layout>${uiIcon("edit")} Редактировать расположение</button>`;
    if(C.tab === "layout")body+=toggleControl("bottomDock","Нижняя панель ссылок","Telegram, Twitch, архив и загрузки. Дополнительная область для виджетов.");
    if(C.tab === "visual")body=`<section class="editor-unavailable"><span class="editor-status">На доработке</span><h4>Визуальный редактор временно отключён</h4><p>Мы дорабатываем систему перемещения элементов. Она станет доступна в одном из следующих обновлений.</p><button class="btn btn-secondary" data-visual-edit disabled>Редактор недоступен</button></section>`;
    if (C.tab === "advanced")
      body =
        selectControl("density", "Плотность", [
          ["compact", "Компактная"],
          ["standard", "Стандартная"],
          ["spacious", "Просторная"],
        ]) +
        selectControl("text", "Размер текста", [
          ["small", "Маленький · 15 px"],
          ["standard", "Стандартный · 16 px"],
          ["large", "Крупный · 18 px"],
        ]) +
        toggleControl("sounds", "Звуки взаимодействия", "Короткий тихий отклик при нажатии. По умолчанию выключен.") +
        toggleControl(
          "reduce",
          "Уменьшение движения",
          "Без интенсивных анимаций. Настройки системы учитываются всегда.",
        ) +
        selectControl("performance", "Производительность", [
          ["auto", "Автоматический"],
          ["smooth", "Максимальная плавность"],
          ["economy", "Экономия ресурсов"],
        ]) +
        selectControl("noticePosition", "Положение уведомлений", [["top-right","Справа сверху"],["bottom-right","Справа снизу"],["bottom-left","Слева снизу"]]) +
        selectControl("noticeDuration", "Длительность уведомления", [["4","4 секунды"],["6","6 секунд"],["9","9 секунд"]]) +
        `<button class="btn btn-secondary" data-preview-notice>Проверить уведомление</button><div class="custom-tip" id="custom-performance-note">${economicalCustom(c) ? "Сейчас используется облегчённое оформление." : "Декоративные эффекты включены."} Основные функции доступны в любом режиме.</div>`;
    html(
      "custom-panel",
      `<div class="custom-category-heading"><span class="eyebrow">${String(CUSTOM_TABS.findIndex((t) => t[0] === C.tab) + 1).padStart(2, "0")} / PERSONAL INTERFACE</span><h3>${title}</h3><p>${desc}</p></div><div class="custom-controls">${body}</div><details class="custom-preview-mobile" open><summary>Живой предпросмотр</summary><div class="custom-preview" data-preview-bg="${c.background}"><div class="custom-preview-card" id="custom-mobile-preview-card"><span class="mini-ai-core">${uiIcon("ai")}</span><b>Твоё пространство</b><p>Цвета, стекло и плавность — в одном стиле.</p><button class="btn btn-primary" data-preview-replay>Проверить нажатие</button></div></div></details>`,
    );
    $("custom-scope").textContent = signed() ? "Сохранение в твоём профиле" : "Сохранение в этом браузере";
    $("custom-save-status").textContent =
      JSON.stringify(c) === JSON.stringify(C.saved) ? "Твоё оформление" : "Предпросмотр · ещё не сохранено";
    if(!VISUAL_EDITOR_ENABLED){
      $$('#customization-dialog [data-visual-edit],#customization-dialog [data-edit-layout],#customization-dialog [data-visual-reset]').forEach(b=>{b.disabled=true;b.title='Визуальный редактор на доработке';});
      if(['widgets','layout'].includes(C.tab))$('custom-panel').querySelector('.custom-controls').insertAdjacentHTML('beforeend','<p class="editor-status-note">Перемещение элементов временно отключено — на доработке.</p>');
    }
    updateCustomPreview(true);
    fillBannerPreviews();
    requestAnimationFrame(()=>{$$('[data-background-preview]').forEach(canvas=>window.YANE_BACKGROUND?.preview(canvas,{...c,background:canvas.dataset.backgroundPreview},canvas.dataset.previewTheme==='dark'));});
    window.YANE_I18N?.refresh($("customization-dialog"));
    requestAnimationFrame(() => {
      const tabs = $("custom-tabs"),
        active = $("custom-tab-" + C.tab);
      if (tabs && active && innerWidth < 1001)
        tabs.scrollTo({ left: Math.max(0, active.offsetLeft - tabs.offsetLeft - 12), behavior: "auto" });
    });
  }
  function updateCustomPreview(animate = false) {
    const c = currentCustom();
    $("custom-preview-palette").textContent = {
      purple: "Aurora Purple",
      ocean: "Ocean Blue",
      emerald: "Emerald Green",
      sunset: "Sunset",
      rose: "Rose",
      mono: "Monochrome",
      custom:"Свои цвета",
    }[c.accent];
    $("custom-preview-background").textContent = {
      aurora: "Живая Aurora", liquid: "Жидкий свет", nebula: "Звёздная туманность", mesh: "Цветная дымка",
      standard: "Фирменный фон",
      minimal: "Минимализм",
    }[S.theme==="dark"?c.darkBackground:c.lightBackground];
    $("custom-preview-motion").textContent = reducedCustom()
      ? "Движение сокращено"
      : { slow: "Спокойный ритм", normal: "Сбалансированный ритм", fast: "Быстрый ритм" }[c.speed];
    $("custom-preview").dataset.previewBg = S.theme==="dark"?c.darkBackground:c.lightBackground;
    $$(".custom-preview").forEach(el=>el.dataset.previewBg=S.theme==="dark"?c.darkBackground:c.lightBackground);
    $$('.custom-preview').forEach(box=>{let canvas=box.querySelector('.live-preview-canvas');if(!canvas){canvas=document.createElement('canvas');canvas.className='live-preview-canvas';box.prepend(canvas);}requestAnimationFrame(()=>window.YANE_BACKGROUND?.preview(canvas,{...c,background:S.theme==='dark'?c.darkBackground:c.lightBackground},S.theme==='dark'));});
    if (animate) animateCustomElement($("custom-preview-card"));
    animateCustomElement($("custom-mobile-preview-card"));
  }
  function animationFrames(type, intensity) {
    const amount = { low: 5, balanced: 14, high: 22 }[intensity],
      f = {
        standard: [
          { opacity: 0, transform: "translateY(6px)" },
          { opacity: 1, transform: "none" },
        ],
        fade: [{ opacity: 0 }, { opacity: 1 }],
        up: [
          { opacity: 0, transform: `translateY(${amount}px)` },
          { opacity: 1, transform: "none" },
        ],
        down: [
          { opacity: 0, transform: `translateY(-${amount}px)` },
          { opacity: 1, transform: "none" },
        ],
        zoom: [{ transform: "scale(.94)" }, { transform: "none" }],
        scale: [
          { opacity: 0, transform: "scale(.94)" },
          { opacity: 1, transform: "none" },
        ],
        spring: [
          { opacity: 0, transform: `translateY(${amount}px) scale(.97)` },
          { opacity: 1, transform: "translateY(-3px) scale(1.01)", offset: 0.75 },
          { opacity: 1, transform: "none" },
        ],
      };
    return f[type];
  }
  function animateCustomElement(el) {
    if (!el || reducedCustom() || economicalCustom()) return;
    const c = currentCustom(),
      frames = animationFrames(c.arrival, c.intensity);
    if (!frames || !el.animate) return;
    el.getAnimations().forEach((a) => a.cancel());
    el.animate(frames, {
      duration: { slow: 460, normal: 280, fast: 160 }[c.speed],
      easing: "cubic-bezier(.2,.7,.2,1)",
    });
  }
  function cancelCustomization(silent = false) {
    if (C.saving) return;
    if (!C.draft && !C.editing) return;
    const old = C.baseline || C.saved;
    C.draft = null;
    C.baseline = null;
    C.editing = false;
    $("app").classList.remove("layout-editing");
    if ($("layout-toolbar")) $("layout-toolbar").hidden = true;
    if ($("customization-dialog")?.open) $("customization-dialog").close();
    stopVisualEditor();
    applyCustom(old);
    if (!silent && $("open-customization")) $("open-customization").focus();
  }
  async function commitCustomization() {
    if (C.saving || !C.draft) return;
    const invalidColor=document.querySelector('[data-accent-hex][aria-invalid="true"]');
    if($("customization-dialog").open&&invalidColor){invalidColor.focus();return;}
    const userId = S.user?.id,
      next = normalizeCustom(C.draft),
      prefs = { ...S.prefs, customization: next };
    C.saving = true;
    $$("[data-apply-custom]").forEach((b) => (b.disabled = true));
    try {
      if (signed()) {
        const { error } = await S.sb.rpc("v12_save_ui_prefs", { prefs });
        if (error) throw error;
        if (S.user?.id !== userId) throw Error("Аккаунт изменился. Настройки не применены к текущему пользователю.");
        S.profile.ui_prefs = prefs;
      }
      S.prefs = prefs;
      C.saved = next;
      C.draft = null;
      C.baseline = null;
      C.editing = false;
      persistPrefs();
      stopVisualEditor();
      applyCustom(next);
      $("app").classList.remove("layout-editing");
      $("layout-toolbar").hidden = true;
      $("customization-dialog").close();
      notify({
        type: "success",
        title: "Оформление сохранено",
        description: signed() ? "Персональные настройки сохранены в профиле." : "Настройки сохранены в этом браузере.",
        dedupe: "custom-saved",
      });
      $("open-customization").classList.add("custom-saved");
      setTimeout(() => $("open-customization").classList.remove("custom-saved"), 900);
    } catch (e) {
      toast("Не удалось сохранить: " + formatError(e), "error");
    } finally {
      C.saving = false;
      $$("[data-apply-custom]").forEach((b) => (b.disabled = false));
    }
  }
  function startLayoutEditor() {
    if(!VISUAL_EDITOR_ENABLED){toast("Визуальный редактор на доработке", "info");return;}
    if (!C.draft) {
      C.baseline = structuredClone(C.saved);
      C.draft = structuredClone(C.saved);
    }
    C.editing = true;
    $("layout-toolbar").querySelector("small").textContent="Перетаскивай за ручку или используй ↑ ↓";
    $("customization-dialog").close();
    go("home");
    $("app").classList.add("layout-editing");
    $("layout-toolbar").hidden = false;
    renderWidgetLayout(C.draft);
    applyVisualLayout(C.draft);
    document.querySelector("#layout-toolbar [data-apply-custom]")?.focus();
  }
  function moveWidget(id, delta, target = null) {
    if (!VISUAL_EDITOR_ENABLED || !C.draft) return;
    const arr = C.draft.widgets,
      from = arr.findIndex((w) => w.id === id);
    let to = target ? arr.findIndex((w) => w.id === target) : from + delta;
    if (from < 0 || to < 0 || to >= arr.length || to === from) return;
    const [w] = arr.splice(from, 1);
    arr.splice(to, 0, w);
    renderWidgetLayout(C.draft);
    applyVisualLayout(C.draft);
    $("layout-announcement").textContent = WIDGET_META[id][1] + ": позиция " + (to + 1);
    requestAnimationFrame(() => document.querySelector(`[data-widget-id="${id}"] [data-drag-widget]`)?.focus());
  }
  function renderWidgetLayout(c) {
    const grid = $("custom-dashboard");
    if (!grid) return;
    const order = Array.from(grid.children)
        .map((x) => x.dataset.widgetId)
        .join(","),
      nextOrder = c.widgets.filter(w=>!VISUAL_EDITOR_ENABLED || !c.placements["widget-"+w.id] || c.placements["widget-"+w.id].zone==="home").map((w) => w.id).join(",");
    if (order !== nextOrder) {
      for (const w of c.widgets) {
        const el = $("widget-" + w.id);
        if (el && (!VISUAL_EDITOR_ENABLED || !c.placements[el.id] || c.placements[el.id].zone==="home")) grid.appendChild(el);
      }
    }
    for (const w of c.widgets) {
      const el = $("widget-" + w.id);
      if (!el) continue;
      el.hidden = !w.on || (w.id.startsWith("quick-") && c.quickActions.find(v=>v.id===w.id.slice(6))?.on===false);
      el.dataset.size = w.size;
      const size = el.querySelector("[data-editor-size]");
      if (size) size.value = w.size;
      el.querySelectorAll("[data-widget-up],[data-widget-down]").forEach(
        (b) =>
          (b.disabled = b.hasAttribute("data-widget-up")
            ? c.widgets.indexOf(w) === 0
            : c.widgets.indexOf(w) === c.widgets.length - 1),
      );
    }
    grid.classList.toggle("no-widgets", !c.widgets.some((w) => w.on));
    $("empty-dashboard").hidden = c.widgets.some((w) => w.on);
  }
  function initDashboard() {
    const home = $("screen-home"),
      old = home.querySelector(".home-grid"),
      main = old.querySelector(".home-main"),
      rail = old.querySelector(".home-rail"),
      video = $("home-videos"),
      videoHeading = video.previousElementSibling,
      quick = main.querySelector(".quick-grid"),
      quickHeading = quick.previousElementSibling;
    const homeContent={hero:home.querySelector(".hero"),counters:$("live-counters")};
    homeContent.hero.insertAdjacentHTML("beforeend",bannerArt());
    quick.querySelectorAll(".quick").forEach(el=>homeContent["quick-"+el.dataset.go]=el);
    quickHeading.remove();
    const grid = document.createElement("div");
    grid.id = "custom-dashboard";
    grid.className = "custom-dashboard";
    old.before(grid);
    for (const id of Object.keys(WIDGET_META)) {
      const [icon, title] = WIDGET_META[id],
        el = document.createElement("section");
      el.id = "widget-" + id;
      el.className = "dashboard-widget card";
      el.dataset.widgetId = id;
      el.innerHTML = `<div class="widget-edit-bar"><button class="drag-handle" data-drag-widget="${id}" aria-label="Переместить ${title}" title="Перетащи или используй стрелки">${uiIcon("admin")}</button><b>${title}</b><button data-widget-up="${id}" aria-label="${title}: выше">↑</button><button data-widget-down="${id}" aria-label="${title}: ниже">↓</button><select data-editor-size="${id}" aria-label="${title}: размер"><option value="small">S</option><option value="medium">M</option><option value="large">L</option></select><button data-editor-hide="${id}" aria-label="Скрыть ${title}">×</button></div><div class="widget-body" id="widget-body-${id}"></div>`;
      if(homeContent[id]){el.classList.add("home-block");el.dataset.homeBlock=id;}
      el.insertAdjacentHTML("afterbegin",`<button class="widget-options-trigger" data-widget-menu="${id}" aria-label="Настроить виджет: ${title}" title="Настроить виджет">•••</button>`);
      grid.appendChild(el);
      if(homeContent[id])$("widget-body-"+id).append(homeContent[id]);
    }
    $("widget-body-stats").appendChild(rail.firstElementChild);
    $("widget-body-links").appendChild(rail.firstElementChild);
    $("widget-body-videos").append(videoHeading, video);
    old.remove();
    const empty = document.createElement("div");
    empty.id = "empty-dashboard";
    empty.className = "empty";
    empty.innerHTML =
      'На главной пока нет виджетов. <button class="link-btn" data-open-custom="widgets">Добавить виджеты →</button>';
    grid.after(empty);
    for (const id of ["school", "rating", "calendar", "ai", "news"])
      html(
        "widget-body-" + id,
        `<div class="widget-title">${uiIcon(WIDGET_META[id][0])}<h3>${WIDGET_META[id][1]}</h3></div><p>Данные появятся после подключения.</p>`,
      );
    renderWidgetLayout(C.saved);
  }
  function widgetHead(id, extra = "") {
    return `<div class="widget-title">${uiIcon(WIDGET_META[id][0])}<h3>${WIDGET_META[id][1]}</h3>${extra}</div>`;
  }
  function renderWidgetBasics() {
    if (!C.initialized) return;
    const v = S.stats.filter((x) => !x.deleted),
      month = new Date().toISOString().slice(0, 7);
    html(
      "widget-body-ai",
      widgetHead("ai", `<span class="mini-ai-core" data-ai-core aria-hidden="true">${uiIcon("ai")}</span>`) +
        `<p>От идеи до готового ролика.<br>Задай вопрос — разберём по шагам.</p><form id="widget-ai-form"><label class="sr-only" for="widget-ai-question">Вопрос ЯнеAI</label><input id="widget-ai-question" placeholder="Как улучшить звук?" maxlength="4500" required><button class="btn btn-primary" type="submit">Спросить ${uiIcon("ai")}</button></form><small>Используется общий лимит AI · 15 секунд</small>`,
    );
    const today = new Date(),
      start = new Date(today.getFullYear(), today.getMonth(), 1),
      days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate(),
      offset = (start.getDay() + 6) % 7,
      counts = new Map();
    for (const x of v) {
      const date = String(x.posted_on || x.video_date || x.date || "").slice(0, 10);
      if (date.startsWith(month)) counts.set(Number(date.slice(8)), (counts.get(Number(date.slice(8))) || 0) + 1);
    }
    html(
      "widget-body-calendar",
      widgetHead("calendar") +
        `<p>${monthLabel(month)}</p><div class="widget-calendar" aria-label="Календарь публикаций">${["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => `<small>${d}</small>`).join("")}${"<span></span>".repeat(offset)}${Array.from({ length: days }, (_, i) => `<button data-widget-date="${month}-${String(i + 1).padStart(2, "0")}" class="${counts.has(i + 1) ? "has-posts" : ""} ${today.getDate() === i + 1 ? "today" : ""}" aria-label="${i + 1}: ${counts.get(i + 1) || 0} публикаций">${i + 1}${counts.has(i + 1) ? "<i></i>" : ""}</button>`).join("")}</div><button class="link-btn" data-go="stats">Календарь и статистика →</button>${!signed() ? "<small>Войди, чтобы увидеть свои публикации.</small>" : ""}`,
    );
    const news = S.releases.filter((x) => x.is_published).slice(0, 3);
    html(
      "widget-body-news",
      widgetHead("news") +
        (news.length
          ? news
              .map(
                (x) =>
                  `<article class="widget-news"><small>v${esc(x.version)} · ${esc(fmtDate(x.published_at || x.created_at))}</small><b>${esc(x.title)}</b><p>${esc((x.description || "").slice(0, 160))}</p></article>`,
              )
              .join("")
          : "<p>Опубликованных обновлений пока нет.</p>") +
        `<button class="link-btn" data-widget-news>Все обновления →</button>`,
    );
    syncAIState();
  }
  async function refreshWidgetData() {
    if (!C.initialized || C.widgetLoading) return;
    C.widgetLoading = true;
    const epoch = ++C.widgetEpoch,
      uid = S.user?.id;
    try {
      renderWidgetBasics();
      if (!S.sb || !signed()) {
        for (const id of ["school", "rating"])
          html(
            "widget-body-" + id,
            widgetHead(id) +
              '<p>Войди в аккаунт, чтобы увидеть свои данные.</p><button class="btn btn-secondary" data-widget-login>Войти</button>',
          );
        return;
      }
      const results = await Promise.allSettled([
        S.sb.rpc("v12_home_widgets"),
        S.sb.rpc("v12_leaderboard", { period: "all", core_only: false, max_rows: 3 }),
      ]);
      if (uid !== S.user?.id || epoch !== C.widgetEpoch) return;
      const read = (i) => (results[i].status === "fulfilled" && !results[i].value.error ? results[i].value.data : null);
      const school = read(0),
        board = read(1);
      html(
        "widget-body-school",
        widgetHead("school") +
          (school
            ? `<strong class="widget-number">${num(school.done)} <small>/ ${num(school.total)} уроков</small></strong><progress max="${Math.max(1, school.total)}" value="${school.done}" aria-label="Прогресс обучения"></progress><p>${school.total ? "Твой личный прогресс. Продолжай в удобном темпе." : "Уроки ещё не опубликованы."}</p>`
            : "<p>Не удалось загрузить прогресс. Проверь подключение и миграцию v12.1.</p>") +
          '<button class="link-btn" data-go="school">Открыть школу →</button>',
      );
      html(
        "widget-body-rating",
        widgetHead("rating") +
          (board
            ? board
                .map(
                  (p) =>
                    `<button class="widget-leader" data-user="${esc(p.user_id)}"><span>#${num(p.place)}</span>${avatar(S.profiles.find((x) => x.id === p.user_id) || p)}<b><span translate="no">${esc(p.username)}</span></b><strong>${num(p.points)}</strong></button>`,
                )
                .join("") || "<p>Пока нет подтверждённых начислений.</p>"
            : "<p>Рейтинг недоступен. Повтори позже.</p>") +
          '<button class="link-btn" data-go="clippers">Весь рейтинг →</button>',
      );
      refreshPresenceBadges();
    } finally {
      if (epoch === C.widgetEpoch) C.widgetLoading = false;
    }
  }
  function updateNavIndicator() {
    const nav = $("nav"),
      line = $("nav-indicator"),
      active = nav.querySelector(".nav-active");
    if (!line || !active) return;
    const nr = nav.getBoundingClientRect(),
      r = active.getBoundingClientRect(),
      horizontal = S.page !== "none" && $("app").dataset.menu === "top" && innerWidth > 1000;
    line.style.width = (horizontal ? r.width - 16 : 3) + "px";
    line.style.height = (horizontal ? 3 : r.height - 18) + "px";
    line.style.transform = `translate(${Math.round(r.left - nr.left + nav.scrollLeft + (horizontal ? 8 : 0))}px,${Math.round(r.top - nr.top + nav.scrollTop + (horizontal ? r.height - 3 : 9))}px)`;
    line.classList.add("ready");
  }
  function setAIState(state, detail = "") {
    C.aiState = state;
    C.aiDetail = detail;
    syncAIState();
  }
  function syncAIState() {
    const available = !!cfg.supabaseUrl && !!cfg.supabaseAnonKey,
      offline = !navigator.onLine;
    const state = offline ? "offline" : C.aiState === "ready" && !available ? "unconfigured" : C.aiState;
    const labels = {
      ready: "Готов к запросу",
      thinking: "Думает",
      video: "Анализирует видео",
      error: "Ошибка",
      offline: "Нет соединения",
      unconfigured: "Нужна настройка API",
    };
    $$("[data-ai-core]").forEach((el) => {
      el.dataset.state = state;
      el.setAttribute("title", labels[state]);
    });
    const label = $("ai-live-label");
    if (label) label.textContent = C.aiDetail || labels[state];
    const pill = $("ai-state-pill");
    if (pill) {
      pill.dataset.state = state;
      pill.textContent = labels[state];
    }
  }
  function analysisPhase(phase, detail = "") {
    const order = ["upload", "analysis", "result"],
      at = order.indexOf(phase);
    $$("[data-analysis-phase]").forEach((el) => {
      const i = order.indexOf(el.dataset.analysisPhase),
        done = phase === "done" || i < at;
      el.classList.toggle("complete", done);
      el.classList.toggle("current", !done && i === at);
      el.setAttribute("aria-current", !done && i === at ? "step" : "false");
    });
    if ($("analysis-stage-detail")) $("analysis-stage-detail").textContent = detail;
  }
  async function presenceHeartbeat() {
    if (!signed() || !S.sb || C.presencePending) return;
    C.presencePending = true;
    try {
      const { error } = await S.sb.rpc("v12_presence_heartbeat", {
        session_key: C.session,
        is_active: Date.now() - C.lastInput < 90000,
        is_visible: !document.hidden,
      });
      if (error) {
        C.presenceOK = false;
        C.presence.clear();
        refreshPresenceBadges();
      }
    } catch {
      C.presenceOK = false;
    } finally {
      C.presencePending = false;
    }
  }
  async function loadPresence() {
    if (!signed() || !S.sb) {
      C.presence.clear();
      C.presenceOK = false;
      refreshPresenceBadges();
      return;
    }
    const uid = S.user.id;
    try {
      const { data, error } = await S.sb.rpc("v12_presence_snapshot");
      if (uid !== S.user?.id) return;
      if (error) throw error;
      C.presence = new Map((data || []).map((x) => [x.user_id, x.state]));
      C.presenceAt = Date.now();
      C.presenceOK = true;
    } catch {
      C.presence.clear();
      C.presenceOK = false;
    }
    refreshPresenceBadges();
  }
  function presenceMarkup(p) {
    const id = p?.id || p?.user_id;
    if (!id) return "";
    return `<i class="presence-badge" data-presence-id="${esc(id)}" hidden></i>`;
  }
  function refreshPresenceBadges() {
    const fresh = C.presenceOK && Date.now() - C.presenceAt < 90000;
    $$("[data-presence-id]").forEach((el) => {
      let state = fresh ? C.presence.get(el.dataset.presenceId) : null;
      if (el.dataset.presenceId === S.user?.id && fresh)
        state = document.hidden || Date.now() - C.lastInput >= 90000 ? "idle" : "active";
      el.hidden = !state;
      const changed = el.dataset.state !== (state || "unknown");
      el.dataset.state = state || "unknown";
      const label =
        { active: "Активен на сайте", idle: "На сайте, без активности", offline: "Не в сети" }[state] ||
        "Статус неизвестен";
      const localizedLabel=window.YANE_I18N?.translate(label)||label;
      if(el.title!==localizedLabel)el.title=localizedLabel;
      if(el.getAttribute("aria-label")!==localizedLabel)el.setAttribute("aria-label",localizedLabel);
      if (changed) el.innerHTML = state === "idle" ? uiIcon("moon") : "";
    });
  }
  async function clickCustomization(e) {
    const b = e.target.closest("button");
    if (!b) return;
    if(b.dataset.widgetMenu){openWidgetOptions(b.dataset.widgetMenu);return;}
    if(b.dataset.glassStyle){C.draft.glassMaterial=b.dataset.glassStyle;C.draft.opacity=90;C.draft.blur="medium";C.draft.borderStrength=60;applyCustom(C.draft);renderCustomization();return;}
    if(b.dataset.themeBackground){C.draft[b.dataset.themeBackground+'Background']=b.dataset.value;setTheme(b.dataset.themeBackground);applyCustom(C.draft);renderCustomization();return;}
    if(b.hasAttribute('data-visual-edit')){startVisualEditor();return;}
    if(b.hasAttribute('data-visual-reset')){if(!VISUAL_EDITOR_ENABLED)return;C.draft.placements={};C.draft.floatingPosition=null;applyCustom(C.draft);return;}
    if(b.hasAttribute('data-preview-notice')){notify({type:'success',title:'Так выглядит уведомление',description:'Можно закрыть крестиком. При наведении или фокусе таймер останавливается.',dedupe:'preview-'+Date.now()});return;}
    if(b.dataset.buttonGroup){
      const key=b.dataset.buttonGroup,arr=C.draft?.[key];if(!arr)return;
      const i=arr.findIndex(v=>v.id===b.dataset.buttonId);if(i<0)return;
      if(b.dataset.buttonAction==='toggle'){if(arr[i].id!=='home')arr[i].on=!arr[i].on;}
      else {const to=i+Number(b.dataset.buttonAction);if(to>=0&&to<arr.length){const [v]=arr.splice(i,1);arr.splice(to,0,v);}}
      if(key==='quickActions'){let j=0;const ordered=arr.map(v=>({...C.draft.widgets.find(w=>w.id==='quick-'+v.id),on:v.on}));C.draft.widgets=C.draft.widgets.map(w=>w.id.startsWith('quick-')?ordered[j++]:w);}
      applyCustom(C.draft);renderCustomization();
      document.querySelector(`[data-button-group="${key}"][data-button-id="${b.dataset.buttonId}"][data-button-action="${b.dataset.buttonAction}"]`)?.focus();return;
    }
    if(b.hasAttribute('data-reset-buttons')){C.draft.widgets.forEach(w=>{if(w.id.startsWith('quick-'))w.on=true;});C.draft.quickActions=structuredClone(CUSTOM_DEFAULT.quickActions);C.draft.navigation=structuredClone(CUSTOM_DEFAULT.navigation);applyCustom(C.draft);renderCustomization();return;}
    if (b.id === "open-customization" || b.hasAttribute("data-open-custom")) {
      openCustomization(b.dataset.openCustom);
      return;
    }
    if (b.dataset.customTab) {
      C.tab = b.dataset.customTab;
      renderCustomization();
      $("custom-tab-" + C.tab)?.focus();
      return;
    }
    if (b.hasAttribute("data-cancel-custom")) {
      cancelCustomization();
      return;
    }
    if (b.hasAttribute("data-apply-custom")) {
      commitCustomization();
      return;
    }
    if (b.hasAttribute("data-reset-custom")) {
      if (await customConfirm("Восстановить стандартное оформление? Нажми «Применить», чтобы сохранить.")) {
        C.draft = structuredClone(CUSTOM_DEFAULT);
        applyCustom(C.draft);
        renderCustomization();
      }
      return;
    }
    if (b.dataset.customChoice) {
      C.draft[b.dataset.customChoice] = b.dataset.value;
      applyCustom(C.draft);
      renderCustomization();
      return;
    }
    if (b.dataset.widgetToggle) {
      const w = C.draft.widgets.find((w) => w.id === b.dataset.widgetToggle);
      w.on = !w.on;
      applyCustom(C.draft);
      renderCustomization();
      if (w.on) refreshWidgetData();
      return;
    }
    if (b.hasAttribute("data-edit-layout")) {
      startLayoutEditor();
      return;
    }
    if (b.hasAttribute("data-reset-widgets")) {
      C.draft.widgets = structuredClone(CUSTOM_DEFAULT.widgets);
      C.draft.quickActions = structuredClone(CUSTOM_DEFAULT.quickActions);
      for(const id of Object.keys(C.draft.placements))if(id.startsWith("widget-"))delete C.draft.placements[id];
      applyCustom(C.draft);
      renderCustomization();
      return;
    }
    if (b.dataset.widgetUp) {
      moveWidget(b.dataset.widgetUp, -1);
      return;
    }
    if (b.dataset.widgetDown) {
      moveWidget(b.dataset.widgetDown, 1);
      return;
    }
    if (b.dataset.editorHide) {
      C.draft.widgets.find((w) => w.id === b.dataset.editorHide).on = false;
      renderWidgetLayout(C.draft);
      return;
    }
    if (b.hasAttribute("data-preview-replay")) {
      animateCustomElement($("custom-preview-card"));
      animateCustomElement($("custom-mobile-preview-card"));
      return;
    }
    if (b.hasAttribute("data-widget-news")) {
      $("updates-dialog").showModal();
      return;
    }
    if (b.hasAttribute("data-widget-login")) {
      authMode("login");
      $("auth-dialog").showModal();
      return;
    }
    if (b.dataset.widgetDate) {
      go("stats");
      $("stat-date").value = b.dataset.widgetDate;
      return;
    }
  }
  function customInput(e) {
    const el = e.target;
    if (el.dataset.custom && C.draft) {
      const key = el.dataset.custom;
      if (el.type === "checkbox") C.draft[key] = el.checked;
      else if (el.dataset.rangeOptions) C.draft[key] = el.dataset.rangeOptions.split(",")[Number(el.value)];
      else C.draft[key] = el.type === "range" ? Number(el.value) : el.value;
      applyCustom(C.draft);
      const output = document.querySelector(`[data-output="${key}"]`);
      if (output)
        output.textContent = el.dataset.rangeOptions
          ? window.YANE_I18N?.translate({ slow: "Медленно", normal: "Нормально", fast: "Быстро" }[C.draft[key]]) || { slow: "Медленно", normal: "Нормально", fast: "Быстро" }[C.draft[key]]
          : el.value + "%";
      $("custom-save-status").textContent = "Предпросмотр · ещё не сохранено";
      updateCustomPreview(el.type !== "range");
      if (key === "performance") renderCustomization();
    }
    const id = el.dataset.widgetSize || el.dataset.editorSize;
    if (id && C.draft) {const size=el.value;el.value=C.draft.widgets.find(w=>w.id===id).size;openWidgetOptions(id,size);}
  }
  function handleClickEffect(e) {
    const b = e.target.closest("button,.quick");
    if (!b || b.disabled) return;
    const c = currentCustom();
    if (c.sounds) playInterfaceSound();
    if (reducedCustom() || economicalCustom(c)) return;
    const strength = { low: 0.985, balanced: 0.96, high: 0.93 }[c.intensity],
      duration = { slow: 420, normal: 260, fast: 150 }[c.speed];
    if (c.click === "ripple") {
      const rect = b.getBoundingClientRect(),
        r = document.createElement("i");
      r.className = "click-ripple";
      r.style.left = (e.clientX ? e.clientX - rect.x : rect.width / 2) + "px";
      r.style.top = (e.clientY ? e.clientY - rect.y : rect.height / 2) + "px";
      b.classList.add("ripple-host");
      b.appendChild(r);
      r.animate(
        [
          { transform: "translate(-50%,-50%) scale(0)", opacity: 0.3 },
          { transform: "translate(-50%,-50%) scale(1)", opacity: 0 },
        ],
        { duration: duration * 1.7 },
      )
        .finished.catch(() => {})
        .finally(() => r.remove());
      return;
    }
    const frames = {
      standard: [{ filter: "brightness(1.12)" }, { filter: "brightness(1)" }],
      press: [{ transform: `scale(${strength})` }, { transform: "none" }],
      glow: [
        { boxShadow: "0 0 0 transparent" },
        { boxShadow: "0 0 22px var(--primary)" },
        { boxShadow: "0 0 0 transparent" },
      ],
      bounce: [{ transform: `scale(${strength})` }, { transform: "scale(1.025)" }, { transform: "none" }],
      pulse: [{ opacity: 1 }, { opacity: 0.65 }, { opacity: 1 }],
    }[c.click];
    if (frames && b.animate) b.animate(frames, { duration, easing: "ease-out" });
  }
  function playInterfaceSound() {
    try {
      const ctx = S.audioContext || (S.audioContext = new (window.AudioContext || window.webkitAudioContext)());
      ctx.resume().catch(() => {});
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.frequency.setValueAtTime(620, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.055);
      g.gain.setValueAtTime(0.018, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.075);
    } catch {}
  }
  function setupCustomization() {
    C.saved = normalizeCustom(S.prefs.customization);
    C.initialized = true;
    initDashboard();
    applyCustom(C.saved);
    $("customization-dialog").addEventListener("cancel", (e) => {
      e.preventDefault();
      cancelCustomization();
    });
    $("customization-dialog").addEventListener("close", () => {
      if ($("customization-dialog").open) return;
      if (!C.editing && !C.saving && C.draft) cancelCustomization(true);
    });
    document.addEventListener("click", clickCustomization);
    document.addEventListener("click", handleClickEffect);
    document.addEventListener("input", customInput);
    document.addEventListener("change", (e) => {
      if (e.target.tagName === "SELECT" || e.target.type === "checkbox") customInput(e);
    });
    document.addEventListener("keydown", (e) => {
      const tab = e.target.closest("[data-custom-tab]");
      if (tab && ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        const i = CUSTOM_TABS.findIndex((t) => t[0] === C.tab),
          next =
            e.key === "Home"
              ? 0
              : e.key === "End"
                ? CUSTOM_TABS.length - 1
                : (i + (["ArrowRight", "ArrowDown"].includes(e.key) ? 1 : CUSTOM_TABS.length - 1)) % CUSTOM_TABS.length;
        C.tab = CUSTOM_TABS[next][0];
        renderCustomization();
        $("custom-tab-" + C.tab)?.focus();
      }
      const h = e.target.closest("[data-drag-widget]");
      if (h && C.editing && ["ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        moveWidget(h.dataset.dragWidget, e.key === "ArrowUp" ? -1 : 1);
      }
    });
    document.addEventListener("submit", (e) => {
      if (e.target.id === "widget-ai-form") {
        e.preventDefault();
        const question = $("widget-ai-question").value.trim();
        if (question) askAI(question);
      }
    });
    let drag = null;
    document.addEventListener("pointerdown", (e) => {
      const h = e.target.closest("[data-drag-widget]");
      if (!h || !C.editing || visualActive || e.button !== 0) return;
      drag = { id: h.dataset.dragWidget, handle: h, x: e.clientX, y: e.clientY, moved: false };
      h.setPointerCapture(e.pointerId);
    });
    document.addEventListener("pointermove", (e) => {
      if (!drag) return;
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 8) drag.moved = true;
      if (!drag.moved) return;
      const target = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-widget-id]");
      $$(".widget-drop-target").forEach((x) => x.classList.remove("widget-drop-target"));
      if (target && target.dataset.widgetId !== drag.id) {
        target.classList.add("widget-drop-target");
        drag.target = target.dataset.widgetId;
      }
      if (e.clientY < 90) scrollBy(0, -12);
      if (e.clientY > innerHeight - 90) scrollBy(0, 12);
    });
    const drop = (e) => {
      if (!drag) return;
      const { id, target, moved } = drag;
      drag = null;
      $$(".widget-drop-target").forEach((x) => x.classList.remove("widget-drop-target"));
      if (moved && target) moveWidget(id, 0, target);
    };
    document.addEventListener("pointerup", drop);
    document.addEventListener("pointercancel", () => {
      drag = null;
      $$(".widget-drop-target").forEach((x) => x.classList.remove("widget-drop-target"));
    });
    const nav = $("nav"),
      line = document.createElement("i");
    line.id = "nav-indicator";
    line.setAttribute("aria-hidden", "true");
    nav.appendChild(line);
    nav.addEventListener("scroll", updateNavIndicator, { passive: true });
    new ResizeObserver(() => requestAnimationFrame(updateNavIndicator)).observe(nav);
    window.addEventListener("resize", updateNavIndicator);
    document.fonts?.ready.then(updateNavIndicator);
    for (const event of ["pointermove", "pointerdown", "keydown", "touchstart", "scroll"])
      document.addEventListener(
        event,
        () => {
          const idle = Date.now() - C.lastInput >= 90000;
          C.lastInput = Date.now();
          if (idle) {
            presenceHeartbeat();
            refreshPresenceBadges();
          }
        },
        { passive: true },
      );
    document.addEventListener("visibilitychange", () => {
      presenceHeartbeat();
      if (!document.hidden) {
        loadPresence();
        refreshWidgetData();
      }
    });
    setInterval(() => {
      presenceHeartbeat();
      loadPresence();
    }, 30000);
    setInterval(refreshPresenceBadges, 10000);
    window.addEventListener("online", () => {
      setAIState("ready");
      presenceHeartbeat();
      loadPresence();
    });
    window.addEventListener("offline", syncAIState);
    matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", () => applyCustom(currentCustom()));
    new MutationObserver(() => {
      clearTimeout(C.badgeTimer);
      C.badgeTimer = setTimeout(refreshPresenceBadges, 120);
    }).observe($("content"), { childList: true, subtree: true });
    $$("[data-ai-core],.custom-preview-card .mini-ai-core").forEach((el) => (el.innerHTML = uiIcon("ai")));
    $("open-bug").innerHTML = uiIcon("edit") + "<span>Сообщить об ошибке</span>";
    $("open-customization").innerHTML = uiIcon("ai") + '<span>Кастомизация</span><span class="beta-pill">BETA</span>';
    $$("[data-open-custom].icon-btn").forEach((el) => (el.innerHTML = uiIcon("admin")));
    $$("[data-cancel-custom].icon-btn").forEach((el) => (el.innerHTML = uiIcon("close")));
    setAIState("ready");
    refreshWidgetData();
  }

  // Event delegation: every visible control has a real handler.
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("button,a");
    if (!b) return;
    if(b.id === "open-about"){openAbout();return;}
    if (b.dataset.nav) {
      go(b.dataset.nav);
      return;
    }
    if (b.dataset.go) {
      go(b.dataset.go);
      return;
    }
    if (b.dataset.user) {
      openProfile(b.dataset.user);
      return;
    }
    if (b.dataset.reportMessage) {
      openReport(b.dataset.reportMessage);
      return;
    }
    if (b.dataset.reply) {
      const m = S.chats.find((x) => x.id === b.dataset.reply);
      S.reply = b.dataset.reply;
      $("chat-reply").hidden = false;
      $("chat-reply").innerHTML =
        `Ответ на: ${esc(m?.body?.slice(0, 130) || "сообщение")} <button id="cancel-reply">✕</button>`;
      $("chat-input").focus();
      return;
    }
    if (b.dataset.deleteMessage) {
      deleteChat(b.dataset.deleteMessage);
      return;
    }
    if (b.dataset.editStat) {
      editStat(b.dataset.editStat);
      return;
    }
    if (b.dataset.deleteStat) {
      deleteStat(b.dataset.deleteStat);
      return;
    }
    if (b.dataset.statDay) {
      $("stat-date").value = S.month + "-" + String(b.dataset.statDay).padStart(2, "0");
      $("stat-name").focus();
      return;
    }
    if (b.dataset.aiVideo) {
      const v = S.videos.find((x) => x.id === b.dataset.aiVideo);
      if (v)
        askAI(
          `Обсудим эту нарезку: «${v.title}», автор ${v.author}. Ссылка: ${v.source_url}. По одной ссылке не утверждай, что просмотрел видео. Дай критерии проверки монтажа и план анализа.`,
        );
      return;
    }
    if (b.dataset.lesson) {
      openLesson(b.dataset.lesson);
      return;
    }
    if (b.dataset.askLesson) {
      const l = S.lessons.find((x) => x.id === b.dataset.askLesson);
      if (l) askAI("Объясни ещё подробнее: " + localized(l.title_i18n));
      return;
    }
    if (b.dataset.askFaq) {
      askAI("Помоги с проблемой: " + b.dataset.askFaq + ". Дай пошаговую инструкцию для CapCut.");
      return;
    }
    if (b.dataset.authmode) {
      authMode(b.dataset.authmode);
      return;
    }
    if (b.dataset.tab) {
      S.adminTab = b.dataset.tab;
      renderAdmin();
      return;
    }
    if (b.dataset.handleReport) {
      resolveReport(b.dataset.handleReport, b.dataset.decision);
      return;
    }
    if (b.dataset.adminUser) {
      S.adminTab = "users";
      if (!$("admin-users-list")) await renderAdmin();
      manageUser(b.dataset.adminUser);
      return;
    }
    if (b.dataset.actionUser) {
      adminAct(b.dataset.actionUser, Number(b.dataset.seconds) || 0);
      return;
    }
    if (b.dataset.reviewVideo) {
      reviewVideo(b.dataset.reviewVideo, b.dataset.decision);
      return;
    }
    if (b.dataset.editRelease) {
      editRelease(b.dataset.editRelease);
      return;
    }
    if (b.dataset.publishRelease) {
      releaseAction(b.dataset.publishRelease, "publish");
      return;
    }
    if (b.dataset.removeRelease) {
      releaseAction(b.dataset.removeRelease, "remove");
      return;
    }
    if (b.dataset.editLesson) {
      editLesson(b.dataset.editLesson);
      return;
    }
    if (b.dataset.deleteLesson) {
      deleteLesson(b.dataset.deleteLesson);
      return;
    }
    if (b.id === "menu-toggle") {
      $("app").classList.toggle("menu-open");
      $("scrim").hidden = !$("app").classList.contains("menu-open");
      return;
    }
    if (b.id === "side-close") {
      $("app").classList.remove("menu-open");
      $("scrim").hidden = true;
      return;
    }
    if (b.id === "theme-toggle") {
      setTheme(S.theme === "dark" ? "light" : "dark");
      return;
    }
    if (b.id === "account-button") {
      if (signed()) openProfile();
      else $("auth-dialog").showModal();
      return;
    }
    if (b.id === "updates-button") {
      $("updates-dialog").showModal();
      loadReleases();
      return;
    }
    if (b.id === "create-button" || b.id === "propose-video") {
      if (checkAuth("videos.submit")) $("submission-dialog").showModal();
      return;
    }
    if (b.id === "older-chat") {
      loadChat(true);
      return;
    }
    if (b.id === "chat-send") {
      sendChat();
      return;
    }
    if (b.id === "cancel-reply") {
      S.reply = null;
      $("chat-reply").hidden = true;
      return;
    }
    if (b.id === "ai-send") {
      sendAI();
      return;
    }
    if (b.id === "ai-clear") {
      clearAI();
      return;
    }
    if (b.id === "prev-month") {
      shiftMonth(-1);
      return;
    }
    if (b.id === "next-month") {
      shiftMonth(1);
      return;
    }
    if (b.id === "stat-clear") {
      $("stat-form").reset();
      $("stat-id").value = "";
      $("stats-form-title").textContent = "Добавить опубликованный ролик";
      return;
    }
    if (b.id === "import-legacy") {
      importLegacy();
      return;
    }
    if (b.id === "signout") {
      if (S.sb) {
        await S.sb.auth.signOut();
        S.openedProfile = null;
        toast("Ты вышел из аккаунта");
        go("home");
      }
      return;
    }
    if (b.id === "lesson-back") {
      renderLessons();
      return;
    }
    if (b.id === "banner-upload") {
      uploadBanner();
      return;
    }
  });
  document.addEventListener("submit", (e) => {
    const id = e.target.id;
    const handlers = {
      "auth-form": authSubmit,
      "report-form": submitReport,
      "submission-form": sendSubmission,
      "stat-form": saveStat,
      "profile-form": saveProfile,
      "release-form": saveRelease,
      "lesson-form": saveLesson,
      "settings-form": saveSettings,
      "rules-editor-form": saveRules,
    };
    if (handlers[id]) {
      e.preventDefault();
      Promise.resolve(handlers[id](e)).catch((err) => toast(formatError(err)));
    }
  });
  $("scrim").addEventListener("click", () => {
    $("app").classList.remove("menu-open");
    $("scrim").hidden = true;
  });

  $("profile-avatar-file").addEventListener("change", changeProfileAvatar);
  document.addEventListener("click", e => {
    if (e.target.closest("#profile-avatar-edit, #profile-avatar-choose")) {
      if (S.avatarBusy || S.avatarUntil > Date.now()) return;
      $("profile-avatar-file").click();
    }
  });
  setInterval(updateProfileCooldowns, 1000);
  $("ai-file").addEventListener("change", aiFileChanged);
  $("diagnostic-search")?.addEventListener("input", renderDiagnostics);
  document.addEventListener("change", e => { if (e.target.matches("[data-diag-step]")) saveDiagnosticStep(e.target); });
  $("school-category").addEventListener("change", renderLessons);
  $('school-search')?.addEventListener('input',renderLessons);
  document.addEventListener('click',e=>{const b=e.target.closest('[data-school-category]');if(b){$('school-category').value=b.dataset.schoolCategory;renderLessons();}});
  $("school-level").addEventListener("change", renderLessons);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.ctrlKey && S.page === "ai") {
      e.preventDefault();
      sendAI();
    }
    if (e.key === "Enter" && e.ctrlKey && S.page === "chat") {
      e.preventDefault();
      sendChat();
    }
  });
  document.addEventListener("input", (e) => {
    if (["click", "mousemove", "touchstart", "keydown", "input"].includes(e.type)) S.lastAction = Date.now();
    if (e.target.id === "admin-search-users") renderAdminUsersList();
  });
  for (const event of ["click", "keydown", "touchstart"])
    document.addEventListener(
      event,
      () => {
        S.lastAction = Date.now();
      },
      { passive: true },
    );
  setupV12();
  // periodic timer only updates text; enforcement lives in PostgreSQL.
  setInterval(updateAICooldown, 1000);
  window.addEventListener('storage',e=>{if(e.key?.startsWith('yane-ai-until-'))updateAICooldown();});
  $("stat-date").value = new Date().toISOString().slice(0, 10);
  setTheme(S.theme);
  setLanguage(S.lang);
  $("ai-disclosure").textContent = cfg.videoWorkerUrl
    ? "Полный видеоанализ: файл со звуком передаётся отдельно на ваш видеосервер и Google Gemini после подтверждения. Отчёты доступны только владельцу аккаунта."
    : "Для фото кадры передаются Google Gemini. Чтобы анализировать полные видео со звуком, разверните отдельный video-worker (инструкция в README).";
  authMode("login");
  renderDiagnostics();
  renderLessons();
  renderVideos();
  renderRules();
  renderClippers();
  renderStats();
  const initial = location.hash.slice(1);
  if (
    [
      "home",
      "ai",
      "school",
      "diagnostics",
      "videos",
      "clippers",
      "chat",
      "stats",
      "rules",
      "profile",
      "admin",
    ].includes(initial)
  )
    go(initial);
  initBackend();
})();
