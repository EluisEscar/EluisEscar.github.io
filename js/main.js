const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const navToggle = document.querySelector(".nav-toggle");
const navShell = document.querySelector(".nav-shell");
const navLinks = [...document.querySelectorAll(".nav-links a")];
const trackedSections = [...document.querySelectorAll("main section[id]")];

const closeMobileNav = () => {
  if (!navToggle || !navShell) return;
  navToggle.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Abrir navegacion");
  navShell.classList.remove("is-open");
};

const openMobileNav = () => {
  if (!navToggle || !navShell) return;
  navToggle.classList.add("is-open");
  navToggle.setAttribute("aria-expanded", "true");
  navToggle.setAttribute("aria-label", "Cerrar navegacion");
  navShell.classList.add("is-open");
};

if (navToggle && navShell) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.classList.contains("is-open");
    if (isOpen) {
      closeMobileNav();
    } else {
      openMobileNav();
    }
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 991.98) closeMobileNav();
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 991.98) closeMobileNav();
  });
}

const setActiveLink = (id) => {
  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${id}`;
    link.classList.toggle("is-active", isActive);
  });
};

if ("IntersectionObserver" in window) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveLink(entry.target.id);
      });
    },
    {
      rootMargin: "-35% 0px -45% 0px",
      threshold: 0.2,
    }
  );

  trackedSections.forEach((section) => navObserver.observe(section));
}

const languageNodes = [...document.querySelectorAll(".language-node")];
const languagePanel = document.querySelector("#languagePanel");
const languageName = document.querySelector("#languageName");
const languageRole = document.querySelector("#languageRole");
const languageSummary = document.querySelector("#languageSummary");
const languageTools = document.querySelector("#languageTools");

const applyLanguage = (node) => {
  languageNodes.forEach((item) => {
    const isActive = item === node;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  if (!languagePanel) return;

  const accent = node.dataset.accent || "#4bdcff";
  languagePanel.style.setProperty("--panel-accent", accent);

  if (languageName) languageName.textContent = node.dataset.name || "";
  if (languageRole) languageRole.textContent = node.dataset.role || "";
  if (languageSummary) languageSummary.textContent = node.dataset.summary || "";
  if (languageTools) languageTools.textContent = node.dataset.tools || "";
};

languageNodes.forEach((node) => {
  node.addEventListener("mouseenter", () => applyLanguage(node));
  node.addEventListener("focus", () => applyLanguage(node));
  node.addEventListener("click", () => applyLanguage(node));
});

if (languageNodes.length > 0) applyLanguage(languageNodes[0]);
