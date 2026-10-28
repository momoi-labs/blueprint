/* Prototype behaviour only: enough to review the scope switcher, not
   production code. The React component is ScopeSwitcher in kiso-react. */
(function () {
  var LEVELS = {
    org: { name: "Organization", list: "Organizations", options: [
      { value: "acme", label: "Acme" }, { value: "umbrella", label: "Umbrella Corporation" }],
      destination: { href: "#settings", label: "Organization settings" } },
    project: { name: "Project", list: "Projects", all: { value: "all", label: "All projects" }, options: [
      { value: "checkout", label: "Checkout" }, { value: "billing", label: "Billing" }, { value: "analytics", label: "Analytics" }],
      destination: { href: "#projects", label: "Manage projects" } },
    server: { name: "Server", list: "Servers", all: { value: "all", label: "All servers" }, searchable: true, options: [],
      destination: { href: "#server", label: "Open server details" } }
  };
  var SERVERS = { checkout: ["db-prod-01", "db-prod-02", "db-replica-01"], billing: ["billing-01"], analytics: [] };
  for (var i = 1; i <= 14; i++) SERVERS.analytics.push("metrics-" + (i < 10 ? "0" : "") + i);
  var PAGES = { summary: "Summary", metrics: "Metrics", logs: "Logs", events: "Events" };
  var ORDER = ["org", "project", "server"];

  var listPopup = document.querySelector("[data-list-popup]");
  var levelsPopup = document.querySelector("[data-levels-popup]");
  var compact = document.querySelector("[data-compact]");
  var list = listPopup.querySelector("[role=listbox]");
  var filter = listPopup.querySelector(".scope-filter");
  var input = filter.querySelector("input");
  var status = listPopup.querySelector("[role=status]");
  var destinations = listPopup.querySelector(".scope-destinations");
  list.id = "scope-list";
  input.setAttribute("aria-controls", list.id);

  function scope() {
    var q = new URLSearchParams(location.search);
    return { page: q.get("page") || "metrics", org: q.get("org") || "acme", project: q.get("project") || "checkout", server: q.get("server") || "db-prod-01" };
  }
  function url(s) { return "?" + new URLSearchParams(s).toString(); }

  // Server choices follow the project; "All projects" groups them by project.
  function options(level, s) {
    if (level !== "server") return LEVELS[level].options;
    var projects = s.project === "all" ? Object.keys(SERVERS) : [s.project];
    var out = [];
    projects.forEach(function (p) {
      var label = LEVELS.project.options.filter(function (o) { return o.value === p; })[0].label;
      SERVERS[p].forEach(function (name) { out.push({ value: name, label: name, group: s.project === "all" ? label : undefined }); });
    });
    return out;
  }
  function nameOf(level, s) {
    var value = s[level], def = LEVELS[level];
    if (def.all && value === def.all.value) return def.all.label;
    var found = options(level, s).filter(function (o) { return o.value === value; })[0];
    return found ? found.label : value;
  }

  function render() {
    var s = scope();
    document.querySelectorAll(".scope-trigger").forEach(function (t) {
      var level = t.dataset.level, label = nameOf(level, s);
      t.querySelector(".scope-name").textContent = label;
      t.setAttribute("aria-label", LEVELS[level].name + " " + label);
    });
    var names = ORDER.map(function (l) { return nameOf(l, s); });
    compact.querySelector(".scope-name").textContent = names[2];
    compact.setAttribute("aria-label", "Scope: " + names.join(" / "));
    document.querySelectorAll("[data-page]").forEach(function (a) {
      var p = a.dataset.page;
      a.href = url({ page: p, org: s.org, project: s.project, server: s.server });
      if (p === s.page) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    document.querySelector("[data-page-title]").textContent = PAGES[s.page];
    document.querySelector("[data-page-scope]").textContent = names.join(" / ");
  }

  // A switch keeps the page and resets each level below to its "All" choice.
  function choose(level, value) {
    var s = scope();
    if (s[level] === value) return;
    s[level] = value;
    if (level === "org") { s.project = "all"; s.server = "all"; }
    if (level === "project") s.server = "all";
    history.pushState(null, "", url(s));
    render();
  }

  var open = null; // { level, trigger, query, active, inLevels }

  function place(popup, trigger) {
    var r = trigger.getBoundingClientRect();
    popup.hidden = false;
    var width = popup.offsetWidth;
    popup.style.minWidth = Math.max(r.width, 256) + "px";
    popup.style.left = Math.max(16, Math.min(r.left, innerWidth - width - 16)) + "px";
    popup.style.top = r.bottom + 4 + "px";
    popup.style.maxHeight = Math.max(160, innerHeight - r.bottom - 20) + "px";
  }

  function visible() {
    var s = scope(), def = LEVELS[open.level], q = open.query.trim().toLowerCase();
    var named = options(open.level, s).filter(function (o) { return !q || o.label.toLowerCase().indexOf(q) !== -1; });
    var all = def.all && !q && options(open.level, s).length ? [def.all] : [];
    return all.concat(named);
  }

  function draw() {
    var s = scope(), def = LEVELS[open.level], items = visible(), values = items.map(function (o) { return o.value; });
    if (values.indexOf(open.active) === -1) open.active = values.indexOf(s[open.level]) !== -1 ? s[open.level] : values[0] || null;
    list.textContent = "";
    var group, container = list;
    items.forEach(function (o, index) {
      if (o.group && o.group !== group) {
        group = o.group;
        container = document.createElement("div");
        container.setAttribute("role", "group");
        container.className = "scope-group";
        container.setAttribute("aria-label", group);
        var heading = document.createElement("div");
        heading.className = "scope-group-label t-caps";
        heading.setAttribute("aria-hidden", "true");
        heading.textContent = group;
        container.appendChild(heading);
        list.appendChild(container);
      }
      var el = document.createElement("div");
      el.id = "scope-opt-" + o.value.replace(/[^\w-]/g, "_");
      el.setAttribute("role", "option");
      el.className = "scope-option";
      el.setAttribute("aria-selected", String(o.value === s[open.level]));
      if (def.all && o === def.all) el.dataset.all = "";
      if (o.value === open.active) el.dataset.active = "";
      el.innerHTML = '<span class="scope-option-text"></span><svg class="icon icon-sm scope-check" aria-hidden="true"><use href="#i-check"/></svg>';
      el.firstChild.textContent = o.label;
      el.addEventListener("pointermove", function () { if (open.active !== o.value) { open.active = o.value; draw(); } });
      el.addEventListener("click", function () { pick(o.value); });
      (o.group ? container : list).appendChild(el);
    });
    var activeId = open.active ? "scope-opt-" + open.active.replace(/[^\w-]/g, "_") : null;
    var target = def.searchable ? input : list;
    if (activeId) target.setAttribute("aria-activedescendant", activeId); else target.removeAttribute("aria-activedescendant");
    if (activeId) document.getElementById(activeId).scrollIntoView({ block: "nearest" });
    var q = open.query.trim();
    status.textContent = !options(open.level, s).length ? "No " + def.list.toLowerCase() + " in this project."
      : q && !items.length ? "No " + def.list.toLowerCase() + " match \"" + q + "\"" : "";
  }

  function openList(level, trigger, inLevels) {
    var def = LEVELS[level];
    open = { level: level, trigger: trigger, query: "", active: scope()[level], inLevels: inLevels };
    listPopup.setAttribute("aria-label", "Switch " + def.name.toLowerCase());
    list.setAttribute("aria-label", def.list);
    filter.hidden = !def.searchable;
    list.tabIndex = def.searchable ? -1 : 0;
    input.value = "";
    input.setAttribute("aria-label", "Filter " + def.list.toLowerCase());
    input.placeholder = "Filter " + def.list.toLowerCase();
    if (def.searchable) list.removeAttribute("aria-activedescendant"); else input.removeAttribute("aria-activedescendant");
    destinations.innerHTML = '<a class="menu-item scope-destination"></a>';
    destinations.firstChild.href = def.destination.href;
    destinations.firstChild.textContent = def.destination.label;
    trigger.setAttribute("aria-expanded", "true");
    draw();
    place(listPopup, trigger);
    // Scroll only once the popup is shown and sized.
    if (open.active) document.getElementById("scope-opt-" + open.active.replace(/[^\w-]/g, "_")).scrollIntoView({ block: "nearest" });
    (def.searchable ? input : list).focus();
  }

  function closeList(focus) {
    if (!open) return;
    var trigger = open.trigger;
    trigger.setAttribute("aria-expanded", "false");
    listPopup.hidden = true;
    open = null;
    if (focus === "trigger") trigger.focus();
    return trigger;
  }

  function openLevels() {
    compact.setAttribute("aria-expanded", "true");
    place(levelsPopup, compact);
    levelsPopup.querySelector(".scope-trigger").focus();
  }
  function closeLevels(focus) {
    compact.setAttribute("aria-expanded", "false");
    levelsPopup.hidden = true;
    if (focus === "trigger") compact.focus();
    if (focus === "next") nextAfter(compact).focus();
  }

  function pick(value) {
    var level = open.level, inLevels = open.inLevels;
    closeList(inLevels ? null : "trigger");
    choose(level, value);
    if (inLevels) closeLevels("trigger");
  }

  function tabbables(root) {
    return Array.prototype.filter.call(root.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), [tabindex='0']"),
      function (el) { return el.getClientRects().length > 0; });
  }
  function nextAfter(el) {
    var all = tabbables(document).filter(function (x) { return !listPopup.contains(x) && !levelsPopup.contains(x); });
    return all[all.indexOf(el) + 1] || el;
  }

  var typed = { text: "", at: 0 };
  function onKey(event) {
    if (!open || event.isComposing) return;
    var inInput = event.target === input, items = visible(), values = items.map(function (o) { return o.value; });
    var index = values.indexOf(open.active);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!items.length) return;
      open.active = values[(index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length];
      draw();
    } else if (!inInput && (event.key === "Home" || event.key === "End")) {
      event.preventDefault();
      open.active = values[event.key === "Home" ? 0 : values.length - 1];
      draw();
    } else if (event.key === "Enter" || (!inInput && event.key === " ")) {
      event.preventDefault();
      if (open.active) pick(open.active);
    } else if (!inInput && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      var now = Date.now();
      typed = { text: now - typed.at > 500 ? event.key : typed.text + event.key, at: now };
      var start = index + (typed.text.length === 1 ? 1 : 0);
      var order = items.slice(start).concat(items.slice(0, start));
      var found = order.filter(function (o) { return o.label.toLowerCase().indexOf(typed.text.toLowerCase()) === 0; })[0];
      if (found) { open.active = found.value; draw(); }
    }
  }
  input.addEventListener("input", function () { open.query = input.value; open.active = null; draw(); });
  input.addEventListener("keydown", onKey);
  list.addEventListener("keydown", onKey);

  listPopup.addEventListener("keydown", function (event) {
    if (event.key === "Escape") { event.preventDefault(); closeList("trigger"); return; }
    if (event.key !== "Tab") return;
    var focusable = tabbables(listPopup);
    if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) {
      // Past the last control, move on from the trigger: the next level in
      // the compact popup, or the next control in the page.
      event.preventDefault();
      var inLevels = open.inLevels, trigger = closeList();
      if (inLevels) {
        var levels = tabbables(levelsPopup), next = levels[levels.indexOf(trigger) + 1];
        if (next) next.focus(); else closeLevels("next");
      } else nextAfter(trigger).focus();
    } else if (event.shiftKey && document.activeElement === focusable[0]) {
      event.preventDefault();
      closeList("trigger");
    }
  });
  levelsPopup.addEventListener("keydown", function (event) {
    if (event.key === "Escape") { event.preventDefault(); closeLevels("trigger"); return; }
    if (event.key !== "Tab") return;
    var focusable = tabbables(levelsPopup);
    if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) { event.preventDefault(); closeLevels("next"); }
    else if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); closeLevels("trigger"); }
  });

  document.querySelectorAll(".scope-trigger").forEach(function (trigger) {
    var inLevels = levelsPopup.contains(trigger);
    function toggle() { if (open && open.trigger === trigger) closeList("trigger"); else { closeList(); openList(trigger.dataset.level, trigger, inLevels); } }
    trigger.addEventListener("click", toggle);
    trigger.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); closeList(); openList(trigger.dataset.level, trigger, inLevels); }
    });
  });
  compact.addEventListener("click", function () { if (levelsPopup.hidden) openLevels(); else closeLevels("trigger"); });
  document.addEventListener("pointerdown", function (event) {
    if (open && !listPopup.contains(event.target) && event.target.closest(".scope-trigger") !== open.trigger) closeList();
    if (!levelsPopup.hidden && !levelsPopup.contains(event.target) && !listPopup.contains(event.target) && !compact.contains(event.target)) closeLevels();
  });
  destinations.addEventListener("click", function () { var inLevels = open && open.inLevels; closeList(); if (inLevels) closeLevels(); });
  document.querySelector("[data-pages]").addEventListener("click", function (event) {
    var link = event.target.closest("a[href]");
    if (!link) return;
    event.preventDefault();
    history.pushState(null, "", link.getAttribute("href"));
    render();
  });
  addEventListener("popstate", function () { closeList(); closeLevels(); render(); });
  render();
})();
