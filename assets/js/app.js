/* =========================================================
   Asialuxe — landing logic
   ========================================================= */
(function () {
  "use strict";

  /* ---------- CONFIG ----------
     LEAD_ENDPOINT — серверный обработчик заявок (lead.php лежит рядом с index.html).
     Ничего настраивать в JS не нужно: chat_id и токен задаются в lead.php.
  */
  var CONFIG = {
    LEAD_ENDPOINT: "lead.php",
    GADS_CONVERSION: "AW-18224907931/aHBPCMqxxrscEJuNqPJD", // send_to для конверсии
    MIN_FILL_MS: 2500, // антибот: форма не может быть отправлена быстрее
    LANG_MODAL_DELAY_MS: 3000, // поп-ап языка — после прогрузки страницы
    TURNSTILE_SITE_KEY: window.TURNSTILE_SITE_KEY || "",
    UTM_STORAGE_KEY: "al_utm"
  };

  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- i18n ---------- */
  var dict = window.I18N || {};
  var savedLang = localStorage.getItem("al_lang");
  var lang = (savedLang === "uz") ? "uz" : "ru";

  function t(key) {
    return (dict[lang] && dict[lang][key]) || (dict.ru && dict.ru[key]) || key;
  }

  /* ---------- UTM (сохраняем метки первого визита) ---------- */
  function initUtm() {
    var params = new URLSearchParams(location.search);
    var utm = {};
    var hasNew = false;
    UTM_KEYS.forEach(function (key) {
      var val = params.get(key);
      if (val) {
        utm[key] = val.slice(0, 120);
        hasNew = true;
      }
    });
    if (hasNew) {
      try { sessionStorage.setItem(CONFIG.UTM_STORAGE_KEY, JSON.stringify(utm)); } catch (e) {}
    }
  }

  function getUtm() {
    try {
      var raw = sessionStorage.getItem(CONFIG.UTM_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function getAnalyticsParams(extra) {
    var utm = getUtm();
    var data = {
      lang: lang,
      page: "samarkand-antalya"
    };
    if (utm.utm_source) data.source = utm.utm_source;
    if (utm.utm_medium) data.medium = utm.utm_medium;
    if (utm.utm_campaign) data.campaign = utm.utm_campaign;
    if (utm.utm_content) data.content = utm.utm_content;
    if (utm.utm_term) data.term = utm.utm_term;
    if (extra) {
      Object.keys(extra).forEach(function (k) { data[k] = extra[k]; });
    }
    return data;
  }

  function appendUtmToPayload(data) {
    var utm = getUtm();
    UTM_KEYS.forEach(function (key) {
      if (utm[key]) data[key] = utm[key];
    });
    return data;
  }

  function lockBody(lock) {
    if (lock) {
      scrollLockPos = window.scrollY || window.pageYOffset || 0;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = "-" + scrollLockPos + "px";
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      document.body.classList.add("modal-open");
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      document.body.classList.remove("modal-open");
      window.scrollTo(0, scrollLockPos);
    }
  }

  var scrollLockPos = 0;

  function applyLang(l) {
    lang = (l === "uz") ? "uz" : "ru";
    localStorage.setItem("al_lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.classList.remove("lang-pending");
    document.body.setAttribute("data-lang", lang);

    $$("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var val = t(key);
      if (el.tagName === "OPTION" || el.children.length === 0) {
        el.textContent = val;
      } else {
        el.textContent = val;
      }
    });

    if (dict[lang] && dict[lang]["doc.title"]) document.title = dict[lang]["doc.title"];
    var langField = $("#formLang"); if (langField) langField.value = lang;

    $$("[data-lang-btn]").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-lang-btn") === lang);
    });
  }

  $$("[data-lang-btn]").forEach(function (b) {
    b.addEventListener("click", function () { applyLang(b.getAttribute("data-lang-btn")); });
  });

  /* ---------- language picker (first visit) ---------- */
  var langModal = $("#langModal");

  function openLangModal() {
    if (!langModal) return;
    document.documentElement.classList.add("lang-pending");
    langModal.hidden = false;
    lockBody(true);
    updateFabVisibility();
  }

  function closeLangModal() {
    if (!langModal) return;
    langModal.hidden = true;
    lockBody(false);
    document.documentElement.classList.remove("lang-pending");
    updateFabVisibility();
  }

  function pickLang(l) {
    applyLang(l);
    closeLangModal();
  }

  $$("[data-pick-lang]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      pickLang(btn.getAttribute("data-pick-lang"));
    });
  });

  /* ---------- header / menu ---------- */
  var header = $("#header");
  window.addEventListener("scroll", function () {
    header.classList.toggle("is-scrolled", window.scrollY > 10);
  }, { passive: true });

  var burger = $("#burger");
  var mobileMenu = $("#mobileMenu");
  var menuBackdrop = $("#menuBackdrop");

  function toggleMenu(open) {
    var willOpen = (typeof open === "boolean") ? open : mobileMenu.hidden;
    mobileMenu.hidden = !willOpen;
    if (menuBackdrop) menuBackdrop.hidden = !willOpen;
    burger.setAttribute("aria-expanded", String(willOpen));
    document.body.classList.toggle("menu-open", willOpen);
  }
  if (burger) {
    burger.addEventListener("click", function () { toggleMenu(); });
    $$("#mobileMenu a").forEach(function (a) { a.addEventListener("click", function () { toggleMenu(false); }); });
  }
  if (menuBackdrop) {
    menuBackdrop.addEventListener("click", function () { toggleMenu(false); });
  }

  /* ---------- mobile FAB visibility ---------- */
  var fabs = $$(".fab");
  function updateFabVisibility() {
    var langOpen = langModal && !langModal.hidden;
    var mobVisible = mobCta && mobCta.classList.contains("is-visible");
    var hide = langOpen || mobVisible || window.scrollY < window.innerHeight * 0.45;
    fabs.forEach(function (fab) {
      fab.classList.toggle("is-hidden", hide);
    });
  }
  window.addEventListener("scroll", updateFabVisibility, { passive: true });
  updateFabVisibility();
  var mobCta = $("#mobCta");
  var leadSection = $("#lead");
  if (mobCta && leadSection && "IntersectionObserver" in window) {
    var ctaIo = new IntersectionObserver(function (entries) {
      var leadVisible = entries[0].isIntersecting;
      var pastHero = window.scrollY > window.innerHeight * 0.5;
      var show = pastHero && !leadVisible;
      mobCta.classList.toggle("is-visible", show);
      mobCta.setAttribute("aria-hidden", String(!show));
      updateFabVisibility();
    }, { threshold: 0.05 });
    ctaIo.observe(leadSection);
    window.addEventListener("scroll", function () {
      if (window.scrollY <= window.innerHeight * 0.5) {
        mobCta.classList.remove("is-visible");
        mobCta.setAttribute("aria-hidden", "true");
      }
      updateFabVisibility();
    }, { passive: true });
  } else if (mobCta) {
    mobCta.classList.add("is-visible");
    mobCta.setAttribute("aria-hidden", "false");
  }

  /* ---------- reveal on scroll ---------- */
  var revealEls = $$(".card, .why__text, .why__media, .premium__text, .premium__media, .route, .faq__item, .pricecard, .section__head, .trust__item, .office");
  revealEls.forEach(function (el) { el.classList.add("reveal"); });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- year ---------- */
  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  /* ---------- modal ---------- */
  var modal = $("#successModal");
  function openModal() { modal.hidden = false; lockBody(true); }
  function closeModal() { modal.hidden = true; if (!langModal || langModal.hidden) lockBody(false); }
  $$("[data-close]").forEach(function (el) { el.addEventListener("click", closeModal); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal && !modal.hidden) closeModal();
  });

  /* ---------- form ---------- */
  var form = $("#leadForm");
  var msg = $("#formMsg");
  var submitBtn = $("#submitBtn");
  var tsField = $("#formTs");
  if (tsField) tsField.value = String(Date.now());

  function showMsg(text, type) {
    if (!msg) return;
    msg.hidden = false;
    msg.textContent = text;
    msg.className = "form-msg " + (type === "ok" ? "is-ok" : "is-error");
  }

  function isValidName(v) {
    v = v.trim();
    if (v.length < 3 || v.length > 80) return false;
    if (/\d/.test(v)) return false;
    if (/[#*@$%^&_=+\[\]{}|\\<>~`]/.test(v)) return false;
    if (/(.)\1{4,}/u.test(v)) return false;
    return (v.match(/\p{L}/gu) || []).length >= 2;
  }

  var UZ_OPS = ["90","91","93","94","95","97","98","99","33","50","88","77","20","71"];

  function isValidUzPhone(v) {
    var d = v.replace(/\D/g, "");
    if (!d || d.length > 12) return false;
    if (d.length === 9) d = "998" + d;
    if (d.length !== 12 || d.slice(0, 3) !== "998") return false;
    return UZ_OPS.indexOf(d.slice(3, 5)) !== -1;
  }

  function isValidComment(v) {
    v = v.trim();
    if (!v) return true;
    if (v.length > 500) return false;
    if (/(.)\1{6,}/.test(v)) return false;
    return (v.match(/\./g) || []).length <= v.length * 0.25;
  }

  function validateForm() {
    var ok = true;
    var nameEl = $("#f-name");
    var phoneEl = $("#f-phone");
    var commentEl = $("#f-comment");
    var nameBad = !isValidName(nameEl.value);
    var phoneBad = !isValidUzPhone(phoneEl.value);
    var commentBad = commentEl && !isValidComment(commentEl.value);

    nameEl.classList.toggle("is-invalid", nameBad);
    phoneEl.classList.toggle("is-invalid", phoneBad);
    if (commentEl) commentEl.classList.toggle("is-invalid", commentBad);

    if (nameBad) {
      showMsg(t("msg.validateName"), "error");
      ok = false;
    } else if (phoneBad) {
      showMsg(t("msg.validatePhone"), "error");
      ok = false;
    } else if (commentBad) {
      showMsg(t("msg.validateComment"), "error");
      ok = false;
    }
    return ok;
  }

  function initTurnstile() {
    if (!CONFIG.TURNSTILE_SITE_KEY) return;
    var field = $("#turnstileField");
    var box = $("#turnstileBox");
    if (!field || !box) return;
    field.hidden = false;

    var s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = function () {
      if (!window.turnstile) return;
      var widgetId = window.turnstile.render(box, {
        sitekey: CONFIG.TURNSTILE_SITE_KEY,
        theme: "light",
        appearance: "interaction-only",
        language: lang === "uz" ? "uz" : "ru"
      });
      box.setAttribute("data-widget-id", widgetId);
    };
    document.head.appendChild(s);
  }

  function getTurnstileToken() {
    var el = form && form.querySelector('input[name="cf-turnstile-response"]');
    return el ? el.value : "";
  }

  function resetTurnstile() {
    if (!window.turnstile || !CONFIG.TURNSTILE_SITE_KEY) return;
    var box = $("#turnstileBox");
    if (!box) return;
    var id = box.getAttribute("data-widget-id");
    if (id) window.turnstile.reset(id);
  }

  if (form) {
    var phoneEl = $("#f-phone");
    if (phoneEl) {
      phoneEl.addEventListener("input", function () {
        this.value = this.value.replace(/[^\d+\s()-]/g, "");
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (msg) msg.hidden = true;

      // honeypot
      if ((form.website && form.website.value) || (form.company && form.company.value)) { return; }
      // timing trap
      var elapsed = Date.now() - parseInt(tsField.value || "0", 10);
      if (elapsed < CONFIG.MIN_FILL_MS) {
        showMsg(t("msg.error"), "error");
        return;
      }
      if (!validateForm()) { return; }

      if (CONFIG.TURNSTILE_SITE_KEY && !getTurnstileToken()) {
        showMsg(t("msg.captcha"), "error");
        return;
      }

      var data = appendUtmToPayload({
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        contact: (form.querySelector('input[name="contact"]:checked') || {}).value || "",
        adults: form.adults.value,
        children: form.children.value,
        flightClass: form.flightClass.value,
        transfer: form.transfer.value,
        comment: form.comment.value.trim(),
        lang: lang,
        page: form.page.value,
        url: location.href,
        ref: document.referrer || "",
        ua: navigator.userAgent,
        elapsed: elapsed,
        turnstile: getTurnstileToken()
      });

      submitBtn.disabled = true;
      var origHtml = submitBtn.innerHTML;
      submitBtn.innerHTML = "<span>" + t("msg.sending") + "</span>";

      sendLead(data)
        .then(function () {
          form.reset();
          tsField.value = String(Date.now());
          resetTurnstile();
          fireConversion();
          openModal();
        })
        .catch(function (err) {
          showMsg(err && err.code === "captcha" ? t("msg.captcha") : t("msg.error"), "error");
          resetTurnstile();
        })
        .then(function () {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origHtml;
        });
    });
  }

  function sendLead(data) {
    return fetch(CONFIG.LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify(data)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (res) {
        if (!r.ok) {
          var err = new Error(res.error || ("bad status " + r.status));
          err.code = res.error || "";
          throw err;
        }
        if (res && res.ok === false) {
          var err2 = new Error(res.error || "server error");
          err2.code = res.error || "";
          throw err2;
        }
        return res;
      });
    });
  }

  /* ---------- analytics ---------- */
  function trackCallClick(place) {
    if (typeof gtag !== "function") return;
    gtag("event", "click_call", getAnalyticsParams({ call_place: place || "other" }));
  }

  function getCallPlace(link) {
    if (link.classList.contains("header__phone")) return "header";
    if (link.classList.contains("fab--call")) return "fab";
    if (link.closest(".lead")) return "lead";
    if (link.closest(".office")) return "office";
    if (link.closest(".footer")) return "footer";
    return "other";
  }

  function initCallTracking() {
    document.addEventListener("click", function (e) {
      var link = e.target.closest('a[href^="tel:"]');
      if (!link) return;
      trackCallClick(getCallPlace(link));
    });
  }

  function fireConversion() {
    if (typeof gtag !== "function") return;
    var params = getAnalyticsParams({ currency: "USD", value: 1.0 });
    // Google Ads conversion (Отправка формы для потенциальных клиентов)
    gtag("event", "conversion", {
      send_to: CONFIG.GADS_CONVERSION,
      value: 1.0,
      currency: "USD"
    });
    // GA4 qualify_lead
    gtag("event", "qualify_lead", params);
    // GA4 generate_lead
    gtag("event", "generate_lead", params);
  }

  /* ---------- office map (lazy) ---------- */
  var officeMap = $("#officeMap");
  var officeMapLoad = $("#officeMapLoad");
  var MAP_EMBED = "https://yandex.uz/map-widget/v1/?ll=66.937861%2C39.665842&z=19&l=map&pt=66.937604%2C39.665908%2Cpm2rdm";

  function loadOfficeMap() {
    if (!officeMap || officeMap.classList.contains("is-loaded")) return;
    var iframe = document.createElement("iframe");
    iframe.src = MAP_EMBED;
    iframe.title = "Asialuxe Travel на карте";
    iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
    iframe.setAttribute("allowfullscreen", "");
    officeMap.appendChild(iframe);
    officeMap.classList.add("is-loaded");
  }

  if (officeMapLoad) {
    officeMapLoad.addEventListener("click", loadOfficeMap);
  }

  /* ---------- trust marquee ---------- */
  var trustTrack = $("#trustTrack");
  var trustGroup = $("#trustGroup");
  if (trustTrack && trustGroup) {
    var trustClone = trustGroup.cloneNode(true);
    trustClone.removeAttribute("id");
    trustClone.classList.add("trust__group--clone");
    trustClone.setAttribute("aria-hidden", "true");
    trustTrack.appendChild(trustClone);
  }

  /* ---------- init ---------- */
  initUtm();
  applyLang(lang);
  initCallTracking();
  initTurnstile();
  if (!savedLang) {
    setTimeout(openLangModal, CONFIG.LANG_MODAL_DELAY_MS);
  }
})();
