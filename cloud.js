(function () {
  "use strict";

  const MIN_PASSWORD_LENGTH = 8;

  let client = null;
  let currentSession = null;
  let authListeners = [];
  let lastSyncAt = 0;
  let lastPushError = null;

  function getConfig() {
    if (typeof window === "undefined") return null;
    return window.ZombieClickerConfig || null;
  }

  function stripConfigValue(value) {
    if (typeof value !== "string") return "";
    // U+FEFF can sneak in via Windows/PowerShell when setting GH secrets
    return value.replace(/^\uFEFF/, "").trim();
  }

  function isConfigured() {
    const cfg = getConfig();
    if (!cfg) return false;
    const url = stripConfigValue(cfg.supabaseUrl);
    const key = stripConfigValue(cfg.supabaseAnonKey);
    if (!url || !key) return false;
    if (url.indexOf("YOUR-PROJECT") !== -1) return false;
    if (key.indexOf("YOUR-ANON") !== -1) return false;
    if (url.indexOf("https://") !== 0) return false;
    if (key.length < 20) return false;
    return true;
  }

  function hasSdk() {
    return typeof window !== "undefined"
      && window.supabase
      && typeof window.supabase.createClient === "function";
  }

  function translateAuthError(err) {
    const msg = err && err.message ? String(err.message) : "Error de autenticación";
    const lower = msg.toLowerCase();
    if (lower.indexOf("invalid login") !== -1) return "Email o contraseña incorrectos";
    if (lower.indexOf("already registered") !== -1) return "Ese email ya tiene una cuenta";
    if (lower.indexOf("user already") !== -1) return "Ese email ya tiene una cuenta";
    if (lower.indexOf("password") !== -1 && lower.indexOf("at least") !== -1) {
      return "La contraseña debe tener al menos " + MIN_PASSWORD_LENGTH + " caracteres";
    }
    if (lower.indexOf("invalid") !== -1 && lower.indexOf("email") !== -1) return "Email inválido";
    if (lower.indexOf("rate limit") !== -1 || lower.indexOf("too many") !== -1) {
      return "Demasiados intentos. Probá en un momento.";
    }
    if (lower.indexOf("failed to fetch") !== -1 || lower.indexOf("network") !== -1) {
      return "Sin conexión: se guarda en este dispositivo";
    }
    return msg;
  }

  function notifyAuth(event, session) {
    currentSession = session || null;
    authListeners.forEach(function (cb) {
      try { cb(currentSession, event); } catch (e) {}
    });
  }

  function init() {
    if (client) return true;
    if (!isConfigured() || !hasSdk()) return false;
    const cfg = getConfig();
    client = window.supabase.createClient(
      stripConfigValue(cfg.supabaseUrl),
      stripConfigValue(cfg.supabaseAnonKey)
    );
    client.auth.onAuthStateChange(function (event, session) {
      notifyAuth(event, session);
    });
    return true;
  }

  function hasSession() {
    return !!(currentSession && currentSession.user);
  }

  function getSession() {
    if (!client) {
      return Promise.resolve(null);
    }
    return client.auth.getSession().then(function (res) {
      currentSession = res.data && res.data.session ? res.data.session : null;
      return currentSession;
    }).catch(function () {
      return null;
    });
  }

  function onAuthChange(cb) {
    if (typeof cb === "function") authListeners.push(cb);
  }

  function checkDisplayNameTaken(displayName) {
    if (!client) return Promise.resolve(false);
    return client.rpc("display_name_taken", { p_name: displayName }).then(function (res) {
      if (res.error) return false;
      return res.data === true;
    }).catch(function () {
      return false;
    });
  }

  function claimProfile(userId, displayName) {
    return client.from("profiles").insert({
      id: userId,
      display_name: displayName
    }).then(function (res) {
      if (!res.error) return { ok: true };
      const code = res.error.code || "";
      const msg = (res.error.message || "").toLowerCase();
      if (code === "23505" || msg.indexOf("duplicate") !== -1 || msg.indexOf("unique") !== -1) {
        return { ok: false, error: "Ese apodo ya existe." };
      }
      return { ok: false, error: "No se pudo guardar el apodo." };
    });
  }

  function signUp(email, password, displayName) {
    if (!client) return Promise.resolve({ ok: false, error: "La nube no está configurada." });
    const name = typeof displayName === "string" ? displayName.trim() : "";
    if (typeof Game === "undefined" || !Game.isValidDisplayName(name)) {
      return Promise.resolve({ ok: false, error: "El apodo debe tener 3–16 letras, números o _." });
    }
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return Promise.resolve({
        ok: false,
        error: "La contraseña debe tener al menos " + MIN_PASSWORD_LENGTH + " caracteres."
      });
    }
    if (!email || String(email).indexOf("@") === -1) {
      return Promise.resolve({ ok: false, error: "Email inválido" });
    }

    return checkDisplayNameTaken(name).then(function (taken) {
      if (taken) return { ok: false, error: "Ese apodo ya existe." };
      return client.auth.signUp({
        email: String(email).trim(),
        password: password,
        options: { data: { display_name: name } }
      }).then(function (res) {
        if (res.error) return { ok: false, error: translateAuthError(res.error) };
        const session = res.data && res.data.session;
        const user = res.data && res.data.user;
        if (!session || !user) {
          return { ok: true, needsEmailConfirm: true };
        }
        currentSession = session;
        return claimProfile(user.id, name).then(function (claimed) {
          if (!claimed.ok) return claimed;
          return { ok: true, needsEmailConfirm: false };
        });
      });
    }).catch(function (err) {
      return { ok: false, error: translateAuthError(err) };
    });
  }

  function signIn(email, password) {
    if (!client) return Promise.resolve({ ok: false, error: "La nube no está configurada." });
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return Promise.resolve({
        ok: false,
        error: "La contraseña debe tener al menos " + MIN_PASSWORD_LENGTH + " caracteres."
      });
    }
    return client.auth.signInWithPassword({
      email: String(email || "").trim(),
      password: password
    }).then(function (res) {
      if (res.error) return { ok: false, error: translateAuthError(res.error) };
      currentSession = res.data && res.data.session ? res.data.session : null;
      return { ok: true };
    }).catch(function (err) {
      return { ok: false, error: translateAuthError(err) };
    });
  }

  function signOut() {
    if (!client) return Promise.resolve({ ok: true });
    return client.auth.signOut().then(function () {
      currentSession = null;
      return { ok: true };
    }).catch(function (err) {
      return { ok: false, error: translateAuthError(err) };
    });
  }

  function getProfile() {
    if (!client || !hasSession()) return Promise.resolve(null);
    const uid = currentSession.user.id;
    return client.from("profiles").select("display_name").eq("id", uid).maybeSingle()
      .then(function (res) {
        if (res.error || !res.data) {
          const meta = currentSession.user.user_metadata || {};
          const fallback = meta.display_name || "";
          return fallback ? { display_name: fallback } : null;
        }
        return res.data;
      }).catch(function () {
        return null;
      });
  }

  function payloadToState(payload) {
    if (!payload || typeof payload !== "object") return null;
    if (Object.keys(payload).length === 0) return null;
    if (typeof Game === "undefined" || typeof Game.deserialize !== "function") return null;
    return Game.deserialize(JSON.stringify(payload));
  }

  function pullSave() {
    if (!client) return Promise.resolve(null);
    return getSession().then(function (session) {
      if (!session || !session.user) return null;
      return client.from("saves")
        .select("payload, updated_at")
        .eq("user_id", session.user.id)
        .maybeSingle()
        .then(function (res) {
          if (res.error || !res.data) return null;
          return payloadToState(res.data.payload);
        });
    }).catch(function () {
      return null;
    });
  }

  function pushSave(state) {
    if (!client || !state) {
      return Promise.resolve({ ok: false, skipped: true });
    }
    const run = function (session) {
      if (!session || !session.user) {
        return { ok: false, skipped: true };
      }
      const stats = typeof Game !== "undefined" && Game.cloudStatsFromState
        ? Game.cloudStatsFromState(state)
        : { total_brains_earned: 0, prestige_souls: 0, best_bps: 0 };
      let payload = {};
      try {
        payload = JSON.parse(Game.serialize(state));
      } catch (e) {
        return { ok: false, error: "No se pudo serializar el save" };
      }
      return client.from("saves").upsert({
        user_id: session.user.id,
        payload: payload,
        updated_at: new Date().toISOString(),
        total_brains_earned: stats.total_brains_earned,
        prestige_souls: stats.prestige_souls,
        best_bps: stats.best_bps
      }).then(function (res) {
        if (res.error) {
          lastPushError = res.error;
          return { ok: false, error: translateAuthError(res.error) };
        }
        lastSyncAt = Date.now();
        lastPushError = null;
        return { ok: true };
      });
    };
    const start = hasSession() ? Promise.resolve(currentSession) : getSession();
    return start.then(run).catch(function (err) {
      lastPushError = err;
      return { ok: false, offline: true, error: translateAuthError(err) };
    });
  }

  function getLastSyncAt() {
    return lastSyncAt;
  }

  const Cloud = {
    MIN_PASSWORD_LENGTH: MIN_PASSWORD_LENGTH,
    isConfigured: isConfigured,
    init: init,
    hasSession: hasSession,
    getSession: getSession,
    onAuthChange: onAuthChange,
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    getProfile: getProfile,
    pullSave: pullSave,
    pushSave: pushSave,
    getLastSyncAt: getLastSyncAt
  };

  if (typeof window !== "undefined") {
    window.Cloud = Cloud;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Cloud;
  }
})();
