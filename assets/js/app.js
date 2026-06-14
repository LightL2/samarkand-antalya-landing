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
    MIN_FILL_MS: 2500 // антибот: форма не может быть отправлена быстрее
  };

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- i18n ---------- */
  var dict = window.I18N || {};
  var savedLang = localStorage.getItem("al_lang");
  var lang = (savedLang === "uz") ? "uz" : "ru";

  function t(key) {
    return (dict[lang] && dict[lang][key]) || (dict.ru && dict.ru[key]) || key;
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
  var revealEls = $$(".card, .why__text, .why__media, .route, .faq__item, .pricecard, .section__head, .trust__item, .office");
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

  function validate() {
    var ok = true;
    var name = $("#f-name"), phone = $("#f-phone");
    [name, phone].forEach(function (f) {
      var bad = !f.value.trim() || (f === phone && f.value.replace(/\D/g, "").length < 7);
      f.classList.toggle("is-invalid", bad);
      if (bad) ok = false;
    });
    return ok;
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (msg) msg.hidden = true;

      // honeypot
      if (form.website && form.website.value) { return; }
      // timing trap
      var elapsed = Date.now() - parseInt(tsField.value || "0", 10);
      if (elapsed < CONFIG.MIN_FILL_MS) {
        showMsg(t("msg.error"), "error");
        return;
      }
      if (!validate()) { showMsg(t("msg.validate"), "error"); return; }

      var data = {
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
        elapsed: elapsed
      };

      submitBtn.disabled = true;
      var origHtml = submitBtn.innerHTML;
      submitBtn.innerHTML = "<span>" + t("msg.sending") + "</span>";

      sendLead(data)
        .then(function () {
          form.reset();
          tsField.value = String(Date.now());
          fireConversion();
          openModal();
        })
        .catch(function () {
          showMsg(t("msg.error"), "error");
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
      if (!r.ok) throw new Error("bad status " + r.status);
      return r.json().catch(function () { return {}; });
    }).then(function (res) {
      if (res && res.ok === false) throw new Error(res.error || "server error");
      return res;
    });
  }

  /* ---------- analytics ---------- */
  function fireConversion() {
    if (typeof gtag !== "function") return;
    // Google Ads conversion (Отправка формы для потенциальных клиентов)
    gtag('event', 'conversion', {
      'send_to': CONFIG.GADS_CONVERSION,
      'value': 1.0,
      'currency': 'USD'
    });
    // GA4 generate_lead
    gtag('event', 'generate_lead', {
      'currency': 'USD',
      'value': 1.0,
      'lang': lang,
      'page': 'samarkand-antalya'
    });
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

  /* ---------- init ---------- */
  applyLang(lang);
  if (!savedLang) openLangModal();
})();
