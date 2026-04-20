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

const escapeHtml = (value) => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const makePluginCard = (name, enabled = false) => {
  const safeName = escapeHtml(name);
  const icon = enabled ? "⚙" : "i";
  const toggleClass = enabled ? "toggle on" : "toggle";
  return `
    <article class="plugin-card reveal visible">
      <div class="plugin-head"><h4 data-plugin-name>${safeName}</h4><span class="plugin-icons">${icon}</span><span class="${toggleClass}"></span></div>
      <p data-plugin-desc>${safeName} plugin from the official src/plugins directory.</p>
    </article>
  `;
};

const fetchAllReleases = async () => {
  const all = [];
  let page = 1;

  while (true) {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100&page=${page}`, { cache: "no-store" });
    if (!res.ok) break;
    const chunk = await res.json();
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    all.push(...chunk);
    if (chunk.length < 100) break;
    page += 1;
  }

  return all;
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
    setHrefAll("[data-release-page]", releaseUrl);
    if (windowsExe?.browser_download_url) setHrefAll("[data-win-download]", windowsExe.browser_download_url);
    if (linuxZip?.browser_download_url) setHrefAll("[data-linux-download]", linuxZip.browser_download_url);
    if (macZip?.browser_download_url) setHrefAll("[data-macos-download]", macZip.browser_download_url);

    const versionLabel = document.querySelector("[data-version-label]");
    if (versionLabel) versionLabel.textContent = `Version ${tag}`;

    const mainDownload = document.querySelector("[data-release-page].btn-primary");
    if (mainDownload) {
      const svg = mainDownload.querySelector("svg")?.outerHTML || "";
      mainDownload.innerHTML = `${svg}Download ${tag} (All Platforms)`;
    }

  } catch {
    // Keep existing static fallbacks if API is unavailable.
  }
};

const updateTotalDownloads = async () => {
  try {
    const releases = await fetchAllReleases();
    const totalDownloads = releases.reduce((releaseSum, release) => {
      const assets = Array.isArray(release.assets) ? release.assets : [];
      return releaseSum + assets.reduce((assetSum, asset) => assetSum + (asset.download_count || 0), 0);
    }, 0);

    const dlEl = document.getElementById("dl-num");
    animateNumber(dlEl, totalDownloads, 1200);
  } catch {
    // Keep existing static fallback if API is unavailable.
  }
};

const updatePluginCount = async () => {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/src/plugins`, { cache: "no-store" });
    if (!res.ok) return;
    const entries = await res.json();
    const plugins = Array.isArray(entries)
      ? entries.filter((entry) => entry.type === "dir" && !entry.name.startsWith("_"))
      : [];

    const count = plugins.length;
    const el = document.getElementById("plugin-count");
    animateNumber(el, count, 900);

    const listEl = document.getElementById("plugins-list");
    if (listEl && plugins.length > 0) {
      const cards = plugins
        .slice(0, 20)
        .map((plugin, index) => makePluginCard(plugin.name, index % 4 === 0))
        .join("");
      listEl.innerHTML = cards;
    }
  } catch {
    // Keep static fallback if API is unavailable.
  }
};

updateFromLatestRelease();
updateTotalDownloads();
updatePluginCount();
