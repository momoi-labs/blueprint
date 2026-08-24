/* Prototype behaviour only — enough to review states, not production code. */
(function () {
  var root = document.documentElement;

  /* Three states. "system" is the default and means: no attribute, let
     `color-scheme` follow the OS. An explicit choice is what gets stored. */
  var THEME_META = {
    system: { icon: "#i-monitor", label: "System" },
    light:  { icon: "#i-sun",     label: "Light" },
    dark:   { icon: "#i-moon",    label: "Dark" }
  };

  /* Three states. "system" is the default and means: no attribute, let
     `color-scheme` follow the OS. An explicit choice is what gets stored.
     Every candidate selector in the gallery is synced from here. */
  function applyTheme(theme) {
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    try { localStorage.setItem("kiso-theme", theme); } catch (e) {}
    var meta = THEME_META[theme] || THEME_META.system;

    document.querySelectorAll("[data-theme-value]").forEach(function (b) {
      var on = b.dataset.themeValue === theme;
      b.setAttribute(b.getAttribute("role") === "menuitemradio" ? "aria-checked" : "aria-selected", String(on));
    });
    document.querySelectorAll("[data-theme-cycle-label]").forEach(function (el) { el.textContent = meta.label; });
    document.querySelectorAll("[data-theme-cycle] use").forEach(function (el) { el.setAttribute("href", meta.icon); });
    document.querySelectorAll("[data-theme-current]").forEach(function (el) { el.textContent = meta.label; });
    document.querySelectorAll("[data-theme-menu-icon]").forEach(function (el) { el.setAttribute("href", meta.icon); });
    document.querySelectorAll("[data-theme-system-switch]").forEach(function (el) { el.checked = theme === "system"; });
    document.querySelectorAll("[data-theme-explicit] button").forEach(function (b) { b.disabled = theme === "system"; });

    var os = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    var resolved = theme === "system" ? os : theme;
    document.querySelectorAll("[data-theme-read-stored]").forEach(function (el) { el.textContent = theme; });
    document.querySelectorAll("[data-theme-read-resolved]").forEach(function (el) {
      el.textContent = resolved + (theme === "system" ? " (from OS)" : " (forced)");
    });
    document.querySelectorAll("[data-theme-read-os]").forEach(function (el) { el.textContent = os; });
  }

  applyTheme(root.getAttribute("data-theme") || "system");

  /* In "system" the OS can change under us — re-run so the readout follows. */
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    applyTheme(root.getAttribute("data-theme") || "system");
  });

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-theme-value]");
    if (t) {
      applyTheme(t.dataset.themeValue);
      document.querySelectorAll("[data-theme-menu-list]").forEach(function (m) { m.classList.add("hidden"); });
      return;
    }

    var cyc = e.target.closest("[data-theme-cycle]");
    if (cyc) {
      var order = ["system", "light", "dark"];
      var now = root.getAttribute("data-theme") || "system";
      applyTheme(order[(order.indexOf(now) + 1) % order.length]);
      return;
    }

    var trig = e.target.closest("[data-theme-menu]");
    var list = document.querySelector("[data-theme-menu-list]");
    if (trig && list) {
      var open = list.classList.toggle("hidden");
      trig.setAttribute("aria-expanded", String(!open));
      return;
    }
    if (list && !list.classList.contains("hidden")) {
      list.classList.add("hidden");
      document.querySelectorAll("[data-theme-menu]").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    }

    if (e.target.closest("[data-open-dialog]")) { open("[data-dialog]"); return; }
    if (e.target.closest("[data-open-palette]")) { open("[data-palette]"); return; }
    if (e.target.closest("[data-open-toast]")) { toast(); return; }
    if (e.target.closest("[data-close]")) { closeAll(); return; }
    if (e.target.matches(".overlay")) { closeAll(); return; }

    // segmented controls, tabs, and button groups
    var seg = e.target.closest(".segmented button, .tabs button");
    if (seg && (seg.hasAttribute("data-theme-value"))) return;
    if (seg) {
      seg.parentElement.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-selected", "false"); });
      seg.setAttribute("aria-selected", "true");
      return;
    }
    var grp = e.target.closest(".btn-group .btn");
    if (grp) {
      grp.parentElement.querySelectorAll(".btn").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      grp.setAttribute("aria-pressed", "true");
    }
  });

  function open(sel) {
    var el = document.querySelector(sel);
    if (!el) return;
    el.classList.remove("hidden");
    var input = el.querySelector("input");
    if (input) input.focus();
  }
  function closeAll() {
    document.querySelectorAll(".overlay").forEach(function (el) { el.classList.add("hidden"); });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAll();
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); open("[data-palette]"); }
  });

  var n = 0;
  function toast() {
    var region = document.querySelector("[data-toasts]");
    if (!region) return;
    n++;
    var el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.innerHTML =
      '<svg class="icon success"><use href="#i-check"/></svg>' +
      '<div class="grow"><p class="alert-title">Application deployed</p>' +
      '<p class="alert-body">demo-' + n + " is reachable at demo-" + n + '.home.lan.</p></div>' +
      '<button class="btn btn-ghost btn-icon btn-xs" aria-label="Dismiss"><svg class="icon icon-sm"><use href="#i-x"/></svg></button>';
    el.querySelector("button").addEventListener("click", function () { el.remove(); });
    region.appendChild(el);
    setTimeout(function () { el.remove(); }, 5000);
  }

  document.addEventListener("change", function (e) {
    var sw = e.target.closest("[data-theme-system-switch]");
    if (!sw) return;
    applyTheme(sw.checked ? "system" : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  });

  // Split pane (console screen)
  var splitter = document.querySelector("[data-splitter]");
  if (splitter) {
    var dragging = false;
    splitter.addEventListener("pointerdown", function (e) { dragging = true; splitter.setPointerCapture(e.pointerId); splitter.classList.add("dragging"); });
    splitter.addEventListener("pointerup", function () { dragging = false; splitter.classList.remove("dragging"); });
    splitter.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var pane = splitter.previousElementSibling;
      var box = pane.parentElement.getBoundingClientRect();
      var pct = Math.min(75, Math.max(25, ((e.clientX - box.left) / box.width) * 100));
      pane.style.flexBasis = pct + "%";
    });
  }
})();
