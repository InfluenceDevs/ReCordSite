const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -50px 0px" }
);

document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${Math.min(i * 55, 260)}ms`;
  revealObserver.observe(el);
});

const REPO = "InfluenceDevs/ReCord";

const animateNumber = (element, target, duration = 1600) => {
  if (!element) return;
  const start = Number(element.textContent.replace(/,/g, "")) || 0;
  const delta = Math.max(0, target - start);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const t0 = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - t0) / duration, 1);
    const value = Math.round(start + delta * easeOut(progress));
    element.textContent = value.toLocaleString();
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
};

const setHrefAll = (selector, href) => {
  document.querySelectorAll(selector).forEach((el) => {
    el.setAttribute("href", href);
  });
};

const updateFromLatestRelease = async () => {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { cache: "no-store" });
    if (!res.ok) return;
    const release = await res.json();

    const assets = Array.isArray(release.assets) ? release.assets : [];
    const byName = (fragment) => assets.find((a) => a.name.toLowerCase().includes(fragment.toLowerCase()));

    const windowsExe = byName("recordsetup.exe");
    const linuxZip = byName("linux-installer");
    const macZip = byName("macos-installer");

    const releaseUrl = release.html_url || `https://github.com/${REPO}/releases/latest`;
    const tag = release.tag_name || "latest";
    const totalDownloads = assets.reduce((sum, a) => sum + (a.download_count || 0), 0);

    setHrefAll("[data-release-page]", releaseUrl);
    if (windowsExe?.browser_download_url) setHrefAll("[data-win-download]", windowsExe.browser_download_url);
    if (linuxZip?.browser_download_url) setHrefAll("[data-linux-download]", linuxZip.browser_download_url);
    if (macZip?.browser_download_url) setHrefAll("[data-macos-download]", macZip.browser_download_url);

    const versionLabel = document.querySelector("[data-version-label]");
    if (versionLabel) versionLabel.textContent = `Version ${tag}`;

    const mainDownload = document.querySelector("[data-release-page].btn-primary");
    if (mainDownload) mainDownload.innerHTML = `${mainDownload.innerHTML.split("</svg>")[0]}</svg>Download ${tag} (All Platforms)`;

    const dlEl = document.getElementById("dl-num");
    animateNumber(dlEl, totalDownloads, 1200);
  } catch {
    // Keep existing static fallbacks if API is unavailable.
  }
};

const updatePluginCount = async () => {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/src/plugins`, { cache: "no-store" });
    if (!res.ok) return;
    const entries = await res.json();
    const count = Array.isArray(entries) ? entries.length : 0;
    const el = document.getElementById("plugin-count");
    animateNumber(el, count, 900);
  } catch {
    // Keep static fallback if API is unavailable.
  }
};

updateFromLatestRelease();
updatePluginCount();
