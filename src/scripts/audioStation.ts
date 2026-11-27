declare const Chart: any;

const API_KEY =
  //   import.meta.env.PUBLIC_LASTFM_API_KEY || "800d9d25a04d76a3434ef7a13e823aa1";
  // const USER = import.meta.env.PUBLIC_LASTFM_USER || "yogpp";
  "800d9d25a04d76a3434ef7a13e823aa1";
const USER = "yogpp";
const BASE_URL = "https://ws.audioscrobbler.com/2.0/";

let allTracks: any[] = [];
let currentPage = 1;
const tracksPerPage = 7;
let genreChart: any = null;

let collageType: "albums" | "artists" = "albums";
let collagePeriod = "1month";
let currentCollageItems: any[] = [];

let frequencyChart: any = null;
let freqDailyData: { labels: string[]; values: number[] } | null = null;
let freqHourlyData: { labels: string[]; values: number[] } | null = null;
let freqMode: "daily" | "hourly" = "daily";

const imageCache: Record<string, string> = {};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const $id = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T | null;

async function fetchLastFm(params: Record<string, string>) {
  const qs = new URLSearchParams({
    ...params,
    user: USER,
    api_key: API_KEY,
    format: "json",
  });
  const res = await fetch(`${BASE_URL}?${qs.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function getFallbackAvatar(name: string): string {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#2c2422"/>
    <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="#d47633" font-family="monospace" font-weight="bold" font-size="64">${initials}</text>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

// Lightweight JSONP helper untuk Deezer API (menghindari CORS tanpa jQuery)
function fetchJsonp(url: string, timeoutMs = 4000): Promise<any> {
  return new Promise((resolve) => {
    const cbName = `dz_cb_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement("script");
    let settled = false;

    const cleanup = () => {
      if (settled) return;
      settled = true;
      delete (window as any)[cbName];
      script.remove();
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve(null);
    }, timeoutMs);

    (window as any)[cbName] = (data: any) => {
      clearTimeout(timer);
      cleanup();
      resolve(data);
    };

    const sep = url.includes("?") ? "&" : "?";
    script.src = `${url}${sep}output=jsonp&callback=${cbName}`;
    script.onerror = () => {
      clearTimeout(timer);
      cleanup();
      resolve(null);
    };
    document.body.appendChild(script);
  });
}

async function searchDeezer(query: string) {
  const res = await fetchJsonp(
    `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=3`,
  );
  return res?.data || [];
}

async function searchDeezerArtist(name: string) {
  const res = await fetchJsonp(
    `https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=3`,
  );
  return res?.data || [];
}

async function getArtistImage(name: string): Promise<string> {
  const cacheKey = `artist:${name.toLowerCase()}`;
  if (imageCache[cacheKey]) return imageCache[cacheKey];

  try {
    const artists = await searchDeezerArtist(name);
    const match =
      artists.find((a: any) => a.name?.toLowerCase() === name.toLowerCase()) ||
      artists[0];

    if (
      match?.picture_medium &&
      !match.picture_medium.includes("/artist//") &&
      !match.picture_medium.includes("default")
    ) {
      imageCache[cacheKey] = match.picture_medium;
      return match.picture_medium;
    }
  } catch {}

  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(name)}&entity=album&limit=5`,
    );
    if (res.ok) {
      const data = await res.json();
      const itunesMatch =
        (data.results || []).find(
          (r: any) => r.artistName.toLowerCase() === name.toLowerCase(),
        ) ||
        (data.results || []).find((r: any) =>
          r.artistName.toLowerCase().includes(name.toLowerCase()),
        );
      if (itunesMatch) {
        const url = itunesMatch.artworkUrl100.replace("100x100bb", "300x300bb");
        imageCache[cacheKey] = url;
        return url;
      }
    }
  } catch {}

  return getFallbackAvatar(name);
}

async function getTrackArtwork(
  trackName: string,
  artistName: string,
): Promise<string> {
  const cacheKey = `track:${artistName.toLowerCase()}-${trackName.toLowerCase()}`;
  if (imageCache[cacheKey]) return imageCache[cacheKey];

  try {
    const results = await searchDeezer(
      `artist:"${artistName}" track:"${trackName}"`,
    );
    if (results[0]?.album?.cover_medium) {
      imageCache[cacheKey] = results[0].album.cover_medium;
      return results[0].album.cover_medium;
    }

    const loose = await searchDeezer(`${trackName} ${artistName}`);
    const validMatch = loose.find((item: any) =>
      item.artist?.name.toLowerCase().includes(artistName.toLowerCase()),
    );
    if (validMatch?.album?.cover_medium) {
      imageCache[cacheKey] = validMatch.album.cover_medium;
      return validMatch.album.cover_medium;
    }
  } catch {}

  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(trackName + " " + artistName)}&entity=song&country=JP&limit=5`,
    );
    if (res.ok) {
      const data = await res.json();
      const itunesMatch = (data.results || []).find((r: any) =>
        r.artistName.toLowerCase().includes(artistName.toLowerCase()),
      );
      if (itunesMatch) {
        const url = itunesMatch.artworkUrl100.replace("100x100bb", "200x200bb");
        imageCache[cacheKey] = url;
        return url;
      }
    }
  } catch {}

  return getFallbackAvatar(artistName);
}

async function getAlbumArtwork(
  albumName: string,
  artistName: string,
  lastFmImages?: any[],
): Promise<string> {
  if (Array.isArray(lastFmImages)) {
    const xl =
      lastFmImages.find((i) => i.size === "extralarge")?.["#text"] ||
      lastFmImages.find((i) => i.size === "large")?.["#text"];
    if (xl && !xl.includes("2a96cbd8b46e442fc41c2b86b821562f")) {
      return xl;
    }
  }

  const cacheKey = `album:${artistName.toLowerCase()}-${albumName.toLowerCase()}`;
  if (imageCache[cacheKey]) return imageCache[cacheKey];

  try {
    const results = await searchDeezer(
      `artist:"${artistName}" album:"${albumName}"`,
    );
    if (results[0]?.album?.cover_big) {
      imageCache[cacheKey] = results[0].album.cover_big;
      return results[0].album.cover_big;
    }
  } catch {}

  return getTrackArtwork(albumName, artistName);
}

async function loadUserProfile() {
  try {
    const data = await fetchLastFm({ method: "user.getinfo" });
    if (data.user) {
      const avatarEl = $id<HTMLImageElement>("user-avatar");
      const nameEl = $id("user-display-name");
      if (avatarEl && data.user.image?.[2]?.["#text"]) {
        avatarEl.src = data.user.image[2]["#text"];
      }
      if (nameEl && data.user.realname) {
        nameEl.textContent = data.user.realname;
      }
    }
  } catch {}
}

async function loadFavoriteTracks(mode: "loved" | "top7d" = "loved") {
  const container = $id("favorite-tracks-grid");
  if (!container) return;

  container.innerHTML = `<div class="col-span-full font-mono text-brown-muted py-3 text-[0.85rem]">Fetching ${mode === "loved" ? "loved tracks" : "top rotation"}...</div>`;

  try {
    const params: Record<string, string> = {
      method: mode === "loved" ? "user.getlovedtracks" : "user.gettoptracks",
      limit: "8",
    };
    if (mode !== "loved") params.period = "7day";

    const res = await fetchLastFm(params);
    const tracks =
      mode === "loved"
        ? res.lovedtracks?.track || []
        : res.toptracks?.track || [];

    if (!tracks.length) {
      container.innerHTML = `<div class="col-span-full text-brown-muted py-2 text-[0.88rem]">Belum ada lagu di daftar ini.</div>`;
      return;
    }

    const cardsHtml: string[] = [];
    for (const t of tracks) {
      const artist = t.artist.name;
      const artImg = await getTrackArtwork(t.name, artist);
      const fallback = getFallbackAvatar(artist);
      const badge =
        mode === "loved"
          ? `<i class="fa-solid fa-heart"></i>`
          : `${t.playcount}x`;

      cardsHtml.push(`
        <a href="${t.url}" target="_blank" rel="noopener" class="flex items-center gap-3 py-2.5 px-3.5 border border-border-warm rounded-[10px] bg-bg-warm no-underline text-inherit transition-all duration-200 hover:border-accent hover:bg-bg-card hover:translate-x-0.5">
          <img src="${artImg}" class="w-[46px] h-[46px] rounded-lg object-cover shrink-0" alt="${t.name}" loading="lazy" onerror="this.onerror=null;this.src='${fallback}'">
          <div class="overflow-hidden flex-1">
            <h6 class="font-bold mb-0 truncate text-[0.9rem] text-brown-dark">${t.name}</h6>
            <p class="text-brown-muted mb-0 truncate text-[0.82rem]">${artist}</p>
          </div>
          <span class="text-[0.72rem] text-amber-eye bg-amber-eye/12 py-0.5 px-2 rounded-md whitespace-nowrap font-semibold">${badge}</span>
        </a>
      `);
      await sleep(120);
    }

    container.innerHTML = cardsHtml.join("");
  } catch {
    container.innerHTML = `<div class="col-span-full text-red-500 text-[0.88rem]">Gagal memuat daftar lagu favorit.</div>`;
  }
}

function renderRecentPage(page: number) {
  currentPage = page;
  const start = (page - 1) * tracksPerPage;
  const paged = allTracks.slice(start, start + tracksPerPage);
  const listEl = $id("recent-list");
  if (!listEl) return;

  listEl.innerHTML = paged
    .map((t) => {
      const fallback = getFallbackAvatar(t.artist["#text"]);
      const imgSrc = t.image?.[2]?.["#text"] || fallback;
      return `
        <div class="flex items-center gap-3 py-2.5 border-b border-border-warm last:border-b-0">
          <img src="${imgSrc}" class="w-11 h-11 rounded-lg object-cover shrink-0" alt="${t.name}" onerror="this.onerror=null;this.src='${fallback}'">
          <div class="overflow-hidden">
            <h6 class="mb-0 truncate font-bold text-[0.9rem] text-brown-dark">${t.name}</h6>
            <p class="mb-0 text-brown-muted text-[0.82rem] truncate">${t.artist["#text"]}</p>
          </div>
        </div>`;
    })
    .join("");

  const pageInfo = $id("page-info");
  const prevBtn = $id<HTMLButtonElement>("prev-page");
  const nextBtn = $id<HTMLButtonElement>("next-page");
  if (pageInfo) pageInfo.textContent = String(currentPage).padStart(2, "0");
  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = start + tracksPerPage >= allTracks.length;
}

async function fetchArtistInfo(name: string) {
  try {
    const d = await fetchLastFm({ method: "artist.getinfo", artist: name });
    const bioEl = $id("artist-bio");
    if (bioEl && d.artist) {
      bioEl.innerHTML =
        d.artist.bio?.summary?.split("<a")[0] || "No bio available.";
    }
  } catch {}
}

async function fetchSimilar(name: string) {
  try {
    const d = await fetchLastFm({
      method: "artist.getsimilar",
      artist: name,
      limit: "12",
    });
    const simEl = $id("similar-artists");
    if (simEl && d.similarartists?.artist) {
      simEl.innerHTML = d.similarartists.artist
        .map(
          (art: any) =>
            `<div class="py-2 px-2.5 rounded-lg text-[0.76rem] text-[#f2ece9] bg-[#382e2b] border border-[#4a3d39] truncate font-mono">${art.name}</div>`,
        )
        .join("");
    }
  } catch {}
}

function renderGenreChart(labels: string[], data: number[]) {
  const canvas = $id<HTMLCanvasElement>("genreChart");
  if (!canvas || typeof Chart === "undefined") return;

  if (genreChart) genreChart.destroy();
  const mutedColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--brown-muted")
      .trim() || "#7c6f6b";

  genreChart = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            "#d47633",
            "#87685d",
            "#2c2422",
            "#a68579",
            "#cbbeb9",
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      cutout: "68%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: mutedColor,
            boxWidth: 10,
            font: { size: 11, family: "JetBrains Mono" },
          },
        },
      },
    },
  });
}

async function loadCollage() {
  const grid = $id("collage-grid");
  if (!grid) return;

  grid.innerHTML = `<div class="py-12 text-center font-mono text-brown-muted col-span-full text-[0.85rem]">Preparing ${collageType} data...</div>`;

  const method =
    collageType === "albums" ? "user.gettopalbums" : "user.gettopartists";

  try {
    const data = await fetchLastFm({
      method,
      period: collagePeriod,
      limit: "9",
    });

    const rawList =
      collageType === "albums"
        ? data.topalbums?.album || []
        : data.topartists?.artist || [];

    if (!rawList.length) {
      grid.innerHTML = `<div class="py-8 text-center text-brown-muted col-span-full text-[0.88rem]">No listening data for this period.</div>`;
      return;
    }

    const items = [];
    for (let i = 0; i < rawList.length; i++) {
      const entry = rawList[i];
      const isAlbum = collageType === "albums";
      const title = entry.name;
      const subtitle = isAlbum
        ? `${entry.artist.name} · ${entry.playcount} plays`
        : `${entry.playcount} plays`;
      const artistForFallback = isAlbum ? entry.artist.name : entry.name;

      const imgUrl = isAlbum
        ? await getAlbumArtwork(entry.name, entry.artist.name, entry.image)
        : await getArtistImage(entry.name);

      items.push({
        rank: String(i + 1).padStart(2, "0"),
        title,
        subtitle,
        url: entry.url,
        imgUrl,
        fallback: getFallbackAvatar(artistForFallback),
      });

      if (!isAlbum) await sleep(100);
    }

    currentCollageItems = items;

    grid.innerHTML = items
      .map(
        (item, idx) => `
          <a href="${item.url}" target="_blank" rel="noopener" class="collage-tile" title="${item.title} (${item.subtitle})">
            <span class="collage-rank">${idx === 0 ? "#01" : "#" + item.rank}</span>
            <img src="${item.imgUrl}" alt="${item.title}" loading="lazy" onerror="this.onerror=null;this.src='${item.fallback}'">
            <div class="collage-overlay">
              <div class="collage-title truncate">${item.title}</div>
              <div class="collage-sub truncate">${item.subtitle}</div>
            </div>
          </a>`,
      )
      .join("");
  } catch {
    grid.innerHTML = `<div class="py-8 text-center text-red-500 col-span-full text-[0.88rem]">Failed to load Last.fm collage.</div>`;
  }
}

async function exportCollagePNG() {
  if (!currentCollageItems.length) return;
  const btn = $id<HTMLButtonElement>("downloadCollageBtn");
  const origHtml = btn?.innerHTML || "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>Rendering';
  }

  const isMobile = window.innerWidth <= 768;
  const cols = isMobile ? 3 : 4;
  const rows = isMobile ? 4 : 3;
  const width = isMobile ? 900 : 1000;
  const unit = width / cols;
  const height = unit * rows;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#181413";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const layout = isMobile
    ? [
        [0, 0, 2],
        [2, 0, 1],
        [2, 1, 1],
        [0, 2, 1],
        [1, 2, 1],
        [2, 2, 1],
        [0, 3, 1],
        [1, 3, 1],
        [2, 3, 1],
      ]
    : [
        [0, 0, 2],
        [2, 0, 1],
        [3, 0, 1],
        [2, 1, 1],
        [3, 1, 1],
        [0, 2, 1],
        [1, 2, 1],
        [2, 2, 1],
        [3, 2, 1],
      ];

  const loadImg = (src: string, fallback: string): Promise<HTMLImageElement> =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => {
        const fb = new Image();
        fb.onload = () => resolve(fb);
        fb.src = fallback;
      };
      img.src = src;
    });

  for (let i = 0; i < Math.min(currentCollageItems.length, 9); i++) {
    const item = currentCollageItems[i];
    const [col, row, span] = layout[i];
    const x = col * unit;
    const y = row * unit;
    const boxSize = unit * span;

    const img = await loadImg(item.imgUrl, item.fallback);
    ctx.drawImage(img, x, y, boxSize, boxSize);

    const grad = ctx.createLinearGradient(
      0,
      y + boxSize * 0.55,
      0,
      y + boxSize,
    );
    grad.addColorStop(0, "rgba(24, 20, 19, 0)");
    grad.addColorStop(1, "rgba(24, 20, 19, 0.92)");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, boxSize, boxSize);

    const isHero = span === 2;
    const pad = isHero ? 22 : 14;
    const titleFontSize = isHero ? 26 : 16;
    const subFontSize = isHero ? 16 : 12;

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${titleFontSize}px sans-serif`;
    ctx.fillText(
      item.title.slice(0, isHero ? 30 : 21),
      x + pad,
      y + boxSize - (isHero ? 44 : 30),
    );

    ctx.fillStyle = "#d47633";
    ctx.font = `bold ${subFontSize}px monospace`;
    const label = isHero
      ? `#01 · ${item.subtitle}`
      : `#${item.rank} · ${item.subtitle}`;
    ctx.fillText(
      label.slice(0, isHero ? 36 : 25),
      x + pad,
      y + boxSize - (isHero ? 18 : 12),
    );
  }

  const link = document.createElement("a");
  link.download = `yog-lastfm-${collageType}-${collagePeriod}${isMobile ? "-3x4" : ""}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = origHtml;
  }
}

async function loadObsession() {
  const card = $id("obsession-card");
  try {
    const res = await fetchLastFm({
      method: "user.gettoptracks",
      period: "7day",
      limit: "1",
    });
    const topTrack = res.toptracks?.track?.[0];
    if (!topTrack) {
      if (card) card.style.display = "none";
      return;
    }

    const trackName = topTrack.name;
    const artistName = topTrack.artist.name;

    if ($id("obsession-track")) $id("obsession-track")!.textContent = trackName;
    if ($id("obsession-artist"))
      $id("obsession-artist")!.textContent = artistName;
    if ($id("obsession-plays"))
      $id("obsession-plays")!.textContent = `${topTrack.playcount}x`;
    if ($id("obsession-sublabel"))
      $id("obsession-sublabel")!.textContent = "THIS WEEK";
    if ($id("obsession-meta"))
      $id("obsession-meta")!.textContent = "7-DAY PEAK ROTATION";
    const linkEl = $id<HTMLAnchorElement>("obsession-link");
    if (linkEl) linkEl.href = topTrack.url;

    const artEl = $id<HTMLImageElement>("obsession-art");
    if (artEl) {
      artEl.src = getFallbackAvatar(artistName);
      artEl.src = await getTrackArtwork(trackName, artistName);
    }
  } catch {
    if (card) card.style.display = "none";
  }
}

async function loadFrequencyGraph() {
  try {
    const nowSec = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = nowSec - 7 * 24 * 60 * 60;
    const res = await fetchLastFm({
      method: "user.getrecenttracks",
      from: String(sevenDaysAgo),
      limit: "200",
    });

    const tracks = res.recenttracks?.track || [];
    const completed = tracks.filter((t: any) => t.date?.uts);

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dailyCounts: { key: string; label: string }[] = [];
    const dayMap: Record<string, number> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const label =
        i === 0 ? "Today" : `${dayNames[d.getDay()]} ${d.getDate()}`;
      dayMap[key] = 0;
      dailyCounts.push({ key, label });
    }

    const hourlyLabels = Array.from(
      { length: 24 },
      (_, h) => `${String(h).padStart(2, "0")}:00`,
    );
    const hourlyCounts = new Array(24).fill(0);

    completed.forEach((t: any) => {
      const dt = new Date(parseInt(t.date.uts, 10) * 1000);
      const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
      if (Object.prototype.hasOwnProperty.call(dayMap, key)) {
        dayMap[key] += 1;
      }
      hourlyCounts[dt.getHours()] += 1;
    });

    freqDailyData = {
      labels: dailyCounts.map((d) => d.label),
      values: dailyCounts.map((d) => dayMap[d.key]),
    };

    freqHourlyData = {
      labels: hourlyLabels,
      values: hourlyCounts,
    };

    if ($id("freq-total-7d")) {
      $id("freq-total-7d")!.textContent = completed.length.toLocaleString();
    }
    renderFrequencyChart();
  } catch (e) {
    console.error("Failed to load frequency graph:", e);
  }
}

function renderFrequencyChart() {
  const canvasEl = $id<HTMLCanvasElement>("frequencyChart");
  if (
    !canvasEl ||
    !freqDailyData ||
    !freqHourlyData ||
    typeof Chart === "undefined"
  )
    return;

  const isDaily = freqMode === "daily";
  const activeData = isDaily ? freqDailyData : freqHourlyData;

  let maxVal = 0;
  let peakIdx = 0;
  activeData.values.forEach((v, idx) => {
    if (v > maxVal) {
      maxVal = v;
      peakIdx = idx;
    }
  });

  if ($id("freq-peak-label")) {
    $id("freq-peak-label")!.textContent =
      maxVal > 0 ? `${activeData.labels[peakIdx]} (${maxVal}x)` : "—";
  }

  const mutedColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--brown-muted")
      .trim() || "#87685d";
  const gridColor = "rgba(135, 104, 93, 0.14)";

  if (frequencyChart) frequencyChart.destroy();

  const ctx = canvasEl.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 0, 240);
  gradient.addColorStop(0, "rgba(212, 118, 51, 0.45)");
  gradient.addColorStop(1, "rgba(212, 118, 51, 0.02)");

  frequencyChart = new Chart(ctx, {
    type: isDaily ? "bar" : "line",
    data: {
      labels: activeData.labels,
      datasets: [
        {
          label: "Scrobbles",
          data: activeData.values,
          backgroundColor: isDaily
            ? activeData.values.map((_, i) =>
                i === peakIdx ? "#d47633" : "rgba(135, 104, 93, 0.55)",
              )
            : gradient,
          borderColor: "#d47633",
          borderWidth: isDaily ? 0 : 2.5,
          borderRadius: isDaily ? 8 : 0,
          maxBarThickness: 44,
          fill: !isDaily,
          tension: 0.35,
          pointRadius: isDaily ? 0 : 3,
          pointHoverRadius: 5,
          pointBackgroundColor: "#d47633",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#181413",
          titleFont: { family: "JetBrains Mono", size: 11 },
          bodyFont: { family: "JetBrains Mono", size: 12 },
          padding: 10,
          displayColors: false,
          callbacks: {
            label: (ctx: any) => `${ctx.parsed.y} scrobbles`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: mutedColor,
            font: { family: "JetBrains Mono", size: 11 },
            maxRotation: 0,
            autoSkip: !isDaily,
            maxTicksLimit: isDaily ? 7 : 8,
          },
        },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: { color: gridColor },
          ticks: {
            precision: 0,
            color: mutedColor,
            font: { family: "JetBrains Mono", size: 11 },
          },
        },
      },
    },
  });
}

async function updateDashboard() {
  // 1. Recent Tracks & Now Playing
  fetchLastFm({ method: "user.getrecenttracks", limit: "50" })
    .then((data) => {
      allTracks = data.recenttracks.track || [];
      const current = allTracks[0];
      if (!current) return;

      if ($id("track-name")) $id("track-name")!.textContent = current.name;
      if ($id("artist-name"))
        $id("artist-name")!.textContent = current.artist["#text"];
      if ($id("album-name"))
        $id("album-name")!.textContent = current.album["#text"];
      if ($id("total-scrobbles")) {
        $id("total-scrobbles")!.textContent = parseInt(
          data.recenttracks["@attr"].total,
          10,
        ).toLocaleString();
      }

      const artEl = $id<HTMLImageElement>("album-art");
      if (artEl && current.image?.[3]?.["#text"]) {
        artEl.src = current.image[3]["#text"];
      }

      const statusEl = $id("status-text");
      const vizEl = $id("viz");
      if (current["@attr"]?.nowplaying) {
        if (statusEl) {
          statusEl.textContent = "NOW PLAYING";
          statusEl.style.backgroundColor = "var(--eye-amber)";
        }
        if (vizEl) vizEl.style.display = "flex";
      } else {
        if (statusEl) {
          statusEl.textContent = "LAST PLAYED";
          statusEl.style.backgroundColor = "var(--accent-color)";
        }
        if (vizEl) vizEl.style.display = "none";
      }

      fetchArtistInfo(current.artist["#text"]);
      renderRecentPage(1);
    })
    .catch(() => {});

  // 2. Top Artist 30D for Similar Engine + Collage
  fetchLastFm({ method: "user.gettopartists", period: "30day", limit: "1" })
    .then((data) => {
      const artists = data.topartists?.artist || [];
      if (artists.length > 0) {
        if ($id("fav-artist-name"))
          $id("fav-artist-name")!.textContent = artists[0].name;
        fetchSimilar(artists[0].name);
      }
    })
    .catch(() => {});

  loadCollage();

  // 3. All-Time Top 10 Artists
  fetchLastFm({ method: "user.gettopartists", period: "overall", limit: "10" })
    .then(async (data) => {
      const artists = data.topartists?.artist || [];
      const listEl = $id("all-time-top-list");
      if (!artists.length || !listEl) return;

      const maxPlays = parseInt(artists[0].playcount, 10) || 1;
      listEl.innerHTML = artists
        .map((top: any, index: number) => {
          const rank = String(index + 1).padStart(2, "0");
          const plays = parseInt(top.playcount, 10);
          const pct = Math.max(8, Math.round((plays / maxPlays) * 100));
          const fallback = getFallbackAvatar(top.name);

          return `
            <a href="${top.url}" target="_blank" rel="noopener" class="group flex items-center gap-3 pb-2.5 border-b border-border-warm last:border-b-0 last:pb-0 no-underline text-inherit transition-transform duration-200 hover:translate-x-0.5">
              <div class:list class="font-mono text-[0.82rem] font-bold w-6 shrink-0 ${index === 0 ? "text-amber-eye" : "text-brown-muted"}">${rank}</div>
              <img src="${fallback}" class="top-artist-thumb w-10 h-10 rounded-full object-cover shrink-0 border-[1.5px] ${index === 0 ? "border-amber-eye" : "border-border-warm"} bg-[#2c2422]" alt="${top.name}" loading="lazy" />
              <div class="overflow-hidden flex-1">
                <div class="flex justify-between items-baseline gap-2">
                  <h6 class="font-bold mb-0 truncate text-[0.9rem] text-brown-dark">${top.name}</h6>
                  <span class="font-mono text-brown-muted text-[0.72rem] whitespace-nowrap">${plays.toLocaleString()}</span>
                </div>
                <div class="w-full h-1 bg-bg-warm rounded-full overflow-hidden mt-1.5">
                  <div class="h-full rounded-full transition-all duration-500 ${index === 0 ? "bg-amber-eye" : "bg-accent"}" style="width: ${pct}%;"></div>
                </div>
              </div>
            </a>`;
        })
        .join("");

      const thumbs =
        listEl.querySelectorAll<HTMLImageElement>(".top-artist-thumb");
      for (let i = 0; i < artists.length; i++) {
        const realImg = await getArtistImage(artists[i].name);
        if (thumbs[i]) thumbs[i].src = realImg;
        await sleep(110);
      }
    })
    .catch(() => {});

  // 4. 7-Day Genre Mix
  fetchLastFm({ method: "user.gettopartists", period: "7day", limit: "5" })
    .then(async (data) => {
      const artists = data.topartists?.artist || [];
      const tagCounts: Record<string, number> = {};
      for (const art of artists) {
        try {
          const tagData = await fetchLastFm({
            method: "artist.gettoptags",
            artist: art.name,
          });
          const topTags = (tagData.toptags?.tag || []).slice(0, 3);
          topTags.forEach((t: any) => {
            const forbidden = ["seen live", "favorites", "all", "awesome"];
            if (!forbidden.includes(t.name.toLowerCase())) {
              tagCounts[t.name] = (tagCounts[t.name] || 0) + 1;
            }
          });
        } catch {}
      }
      const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      if (sortedTags.length > 0) {
        renderGenreChart(
          sortedTags.map((t) => t[0]),
          sortedTags.map((t) => t[1]),
        );
      }
    })
    .catch(() => {});
}

// Event Bindings
export function initAudioStation() {
  $id("prev-page")?.addEventListener("click", () => {
    if (currentPage > 1) renderRecentPage(currentPage - 1);
  });

  $id("next-page")?.addEventListener("click", () => {
    if (currentPage * tracksPerPage < allTracks.length) {
      renderRecentPage(currentPage + 1);
    }
  });

  document
    .querySelectorAll<HTMLButtonElement>(".fav-tab-btn")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".fav-tab-btn")
          .forEach((b) =>
            b.classList.remove(
              "active",
              "bg-accent",
              "text-white",
              "border-accent",
            ),
          );
        btn.classList.add("active", "bg-accent", "text-white", "border-accent");
        const mode = (btn.dataset.mode as "loved" | "top7d") || "loved";
        loadFavoriteTracks(mode);
      });
    });

  document
    .querySelectorAll<HTMLButtonElement>("[data-collage-type]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll("[data-collage-type]")
          .forEach((b) =>
            b.classList.remove("active", "bg-accent", "text-white"),
          );
        btn.classList.add("active", "bg-accent", "text-white");
        collageType =
          (btn.dataset.collageType as "albums" | "artists") || "albums";
        loadCollage();
      });
    });

  document
    .querySelectorAll<HTMLButtonElement>("[data-collage-period]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll("[data-collage-period]")
          .forEach((b) =>
            b.classList.remove("active", "bg-accent", "text-white"),
          );
        btn.classList.add("active", "bg-accent", "text-white");
        collagePeriod = btn.dataset.collagePeriod || "1month";
        loadCollage();
      });
    });

  $id("downloadCollageBtn")?.addEventListener("click", exportCollagePNG);

  document
    .querySelectorAll<HTMLButtonElement>("[data-freq-mode]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll("[data-freq-mode]")
          .forEach((b) =>
            b.classList.remove("active", "bg-accent", "text-white"),
          );
        btn.classList.add("active", "bg-accent", "text-white");
        freqMode = (btn.dataset.freqMode as "daily" | "hourly") || "daily";
        renderFrequencyChart();
      });
    });

  (async function boot() {
    loadUserProfile();
    await updateDashboard();
    loadObsession();
    loadFrequencyGraph();
    await sleep(600);
    await loadFavoriteTracks("loved");
  })();

  setInterval(updateDashboard, 50000);
}
