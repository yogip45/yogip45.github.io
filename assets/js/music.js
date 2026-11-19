const API_KEY = "800d9d25a04d76a3434ef7a13e823aa1";
const USER = "yogpp";
const BASE_URL = "https://ws.audioscrobbler.com/2.0/";
let allTracks = [],
  currentPage = 1,
  tracksPerPage = 7,
  genreChart;

// State Collage (pindah ke atas agar siap saat init() pertama kali jalan)
let collageType = "albums";
let collagePeriod = "1month";
let currentCollageItems = [];

const imageCache = {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getFallbackAvatar(name) {
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

function searchDeezer(query) {
  return new Promise((resolve) => {
    $.ajax({
      url: `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=3&output=jsonp`,
      dataType: "jsonp",
      timeout: 4000,
      success: (res) => resolve(res && res.data ? res.data : []),
      error: () => resolve([]),
    });
  });
}

function searchDeezerArtist(name) {
  return new Promise((resolve) => {
    $.ajax({
      url: `https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=3&output=jsonp`,
      dataType: "jsonp",
      timeout: 4000,
      success: (res) => resolve(res && res.data ? res.data : []),
      error: () => resolve([]),
    });
  });
}

async function getArtistImage(name) {
  const cacheKey = `artist:${name.toLowerCase()}`;
  if (imageCache[cacheKey]) return imageCache[cacheKey];

  try {
    const artists = await searchDeezerArtist(name);
    const match =
      artists.find(
        (a) => a.name && a.name.toLowerCase() === name.toLowerCase(),
      ) || artists[0];

    if (
      match &&
      match.picture_medium &&
      !match.picture_medium.includes("/artist//") &&
      !match.picture_medium.includes("default")
    ) {
      imageCache[cacheKey] = match.picture_medium;
      return match.picture_medium;
    }
  } catch (e) {}

  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(name)}&entity=album&limit=5`,
    );
    if (res.ok) {
      const data = await res.json();
      const itunesMatch =
        (data.results || []).find(
          (r) => r.artistName.toLowerCase() === name.toLowerCase(),
        ) ||
        (data.results || []).find((r) =>
          r.artistName.toLowerCase().includes(name.toLowerCase()),
        );
      if (itunesMatch) {
        const url = itunesMatch.artworkUrl100.replace("100x100bb", "300x300bb");
        imageCache[cacheKey] = url;
        return url;
      }
    }
  } catch (e) {}

  return getFallbackAvatar(name);
}

async function getTrackArtwork(trackName, artistName) {
  const cacheKey = `track:${artistName.toLowerCase()}-${trackName.toLowerCase()}`;
  if (imageCache[cacheKey]) return imageCache[cacheKey];

  try {
    const results = await searchDeezer(
      `artist:"${artistName}" track:"${trackName}"`,
    );
    if (
      results.length > 0 &&
      results[0].album &&
      results[0].album.cover_medium
    ) {
      imageCache[cacheKey] = results[0].album.cover_medium;
      return results[0].album.cover_medium;
    }

    const looseResults = await searchDeezer(`${trackName} ${artistName}`);
    const validMatch = looseResults.find(
      (item) =>
        item.artist &&
        item.artist.name.toLowerCase().includes(artistName.toLowerCase()),
    );
    if (validMatch && validMatch.album && validMatch.album.cover_medium) {
      imageCache[cacheKey] = validMatch.album.cover_medium;
      return validMatch.album.cover_medium;
    }
  } catch (e) {}

  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(trackName + " " + artistName)}&entity=song&country=JP&limit=5`,
    );
    if (res.ok) {
      const data = await res.json();
      const itunesMatch = (data.results || []).find((r) =>
        r.artistName.toLowerCase().includes(artistName.toLowerCase()),
      );
      if (itunesMatch) {
        const url = itunesMatch.artworkUrl100.replace("100x100bb", "200x200bb");
        imageCache[cacheKey] = url;
        return url;
      }
    }
  } catch (e) {}

  return getFallbackAvatar(artistName);
}

$.getJSON(
  `${BASE_URL}?method=user.getinfo&user=${USER}&api_key=${API_KEY}&format=json`,
  function (data) {
    if (data.user) {
      const u = data.user;
      if (u.image[2]["#text"])
        $("#user-avatar").attr("src", u.image[2]["#text"]);
      if (u.realname) $("#user-display-name").text(u.realname);
    }
  },
);

async function loadFavoriteTracks(mode = "loved") {
  const container = $("#favorite-tracks-grid");
  container.html(
    `<div class="col-12 font-mono text-muted py-3" style="font-size: 0.85rem">Fetching ${mode === "loved" ? "loved tracks" : "top rotation"}...</div>`,
  );

  try {
    const method =
      mode === "loved" ? "user.getlovedtracks" : "user.gettoptracks";
    const periodParam = mode === "loved" ? "" : "&period=7day";
    const res = await $.getJSON(
      `${BASE_URL}?method=${method}&user=${USER}&api_key=${API_KEY}${periodParam}&limit=8&format=json`,
    );

    const tracks =
      mode === "loved"
        ? res.lovedtracks?.track || []
        : res.toptracks?.track || [];

    if (tracks.length === 0) {
      container.html(
        `<div class="col-12 text-muted py-2" style="font-size: 0.88rem">Belum ada lagu di daftar ini.</div>`,
      );
      return;
    }

    let cardsHtml = [];
    for (const t of tracks) {
      const artist = t.artist.name;
      const artImg = await getTrackArtwork(t.name, artist);
      const fallback = getFallbackAvatar(artist);
      const badge =
        mode === "loved"
          ? `<i class="fa-solid fa-heart"></i>`
          : `${t.playcount}x`;

      cardsHtml.push(`
              <div class="col-md-6">
                <a href="${t.url}" target="_blank" rel="noopener" class="fav-track-card">
                  <img src="${artImg}" class="fav-track-cover" alt="${t.name}" loading="lazy" onerror="this.onerror=null;this.src='${fallback}'">
                  <div class="overflow-hidden flex-grow-1">
                    <h6 class="fw-bold mb-0 text-truncate track-title">${t.name}</h6>
                    <p class="text-muted mb-0 text-truncate track-artist">${artist}</p>
                  </div>
                  <span class="fav-badge">${badge}</span>
                </a>
              </div>`);
      await sleep(120);
    }

    container.hide().html(cardsHtml.join("")).fadeIn(200);
  } catch (err) {
    container.html(
      `<div class="col-12 text-danger" style="font-size: 0.88rem">Gagal memuat daftar lagu favorit.</div>`,
    );
  }
}

async function updateDashboard() {
  $.getJSON(
    `${BASE_URL}?method=user.getrecenttracks&user=${USER}&api_key=${API_KEY}&format=json&limit=50`,
    function (data) {
      allTracks = data.recenttracks.track;
      const current = allTracks[0];
      $("#track-name").text(current.name);
      $("#artist-name").text(current.artist["#text"]);
      $("#album-name").text(current.album["#text"]);
      $("#total-scrobbles").text(
        parseInt(data.recenttracks["@attr"].total).toLocaleString(),
      );
      if (current.image[3]["#text"])
        $("#album-art").attr("src", current.image[3]["#text"]);

      if (current["@attr"] && current["@attr"].nowplaying) {
        $("#status-text")
          .text("NOW PLAYING")
          .css("background-color", "var(--eye-amber)");
        $("#viz").css("display", "flex");
      } else {
        $("#status-text")
          .text("LAST PLAYED")
          .css("background-color", "var(--accent-color)");
        $("#viz").hide();
      }
      fetchArtistInfo(current.artist["#text"]);
      renderRecentPage(1);
    },
  );

  // 2. Top Artist untuk Similar Engine + 3x3 Collage
  $.getJSON(
    `${BASE_URL}?method=user.gettopartists&user=${USER}&api_key=${API_KEY}&period=30day&limit=1&format=json`,
    function (data) {
      const artists = data.topartists?.artist || [];
      if (artists.length > 0) {
        $("#fav-artist-name").text(artists[0].name);
        fetchSimilar(artists[0].name);
      }
    },
  );
  loadCollage();

  // 3. All-Time Top 10 (dengan Profile Picture & Playcount Bar ala Last.fm)
  $.getJSON(
    `${BASE_URL}?method=user.gettopartists&user=${USER}&api_key=${API_KEY}&period=overall&limit=10&format=json`,
    async function (data) {
      const artists = (data.topartists && data.topartists.artist) || [];
      if (!artists.length) return;

      const maxPlays = parseInt(artists[0].playcount, 10) || 1;
      let html = "";

      artists.forEach(function (top, index) {
        const rank = String(index + 1).padStart(2, "0");
        const plays = parseInt(top.playcount, 10);
        const pct = Math.max(8, Math.round((plays / maxPlays) * 100));
        const fallback = getFallbackAvatar(top.name);

        html += `
                <a href="${top.url}" target="_blank" rel="noopener" class="top-artist-row">
                  <div class="top-artist-rank">${rank}</div>
                  <img
                    src="${fallback}"
                    class="top-artist-thumb"
                    alt="${top.name}"
                    loading="lazy" />
                  <div class="overflow-hidden flex-grow-1">
                    <div class="d-flex justify-content-between align-items-baseline gap-2">
                      <h6 class="fw-bold mb-0 text-truncate track-title">${top.name}</h6>
                      <span class="font-mono text-muted" style="font-size: 0.72rem; white-space: nowrap;">
                        ${plays.toLocaleString()}
                      </span>
                    </div>
                    <div class="top-artist-bar-bg">
                      <div class="top-artist-bar-fill" style="width: ${pct}%;"></div>
                    </div>
                  </div>
                </a>`;
      });

      $("#all-time-top-list").html(html);

      // Muat foto profil tiap artis secara bertahap berdasarkan urutan array artists
      const $thumbs = $("#all-time-top-list .top-artist-thumb");
      for (let i = 0; i < artists.length; i++) {
        const realImg = await getArtistImage(artists[i].name);
        $thumbs.eq(i).attr("src", realImg);
        await sleep(110);
      }
    },
  );

  $.getJSON(
    `${BASE_URL}?method=user.gettopartists&user=${USER}&api_key=${API_KEY}&period=7day&limit=5&format=json`,
    async function (data) {
      const artists = data.topartists.artist;
      let tagCounts = {};
      for (let art of artists) {
        try {
          const tagData = await $.getJSON(
            `${BASE_URL}?method=artist.gettoptags&artist=${encodeURIComponent(art.name)}&api_key=${API_KEY}&format=json`,
          );
          const topTags = tagData.toptags.tag.slice(0, 3);
          topTags.forEach((t) => {
            const forbidden = ["seen live", "favorites", "all", "awesome"];
            if (!forbidden.includes(t.name.toLowerCase())) {
              tagCounts[t.name] = (tagCounts[t.name] || 0) + 1;
            }
          });
        } catch (e) {}
      }
      const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      if (sortedTags.length > 0) {
        renderChart(
          sortedTags.map((t) => t[0]),
          sortedTags.map((t) => t[1]),
        );
      }
    },
  );
}

function renderRecentPage(page) {
  currentPage = page;
  const start = (page - 1) * tracksPerPage;
  const paged = allTracks.slice(start, start + tracksPerPage);
  let html = "";
  paged.forEach((t) => {
    const fallback = getFallbackAvatar(t.artist["#text"]);
    const imgSrc = t.image[2]["#text"] || fallback;
    html += `
            <div class="recent-item">
              <img src="${imgSrc}" class="recent-img" onerror="this.onerror=null;this.src='${fallback}'">
              <div class="overflow-hidden">
                <h6 class="mb-0 text-truncate fw-bold track-title">${t.name}</h6>
                <p class="mb-0 text-muted track-artist">${t.artist["#text"]}</p>
              </div>
            </div>`;
  });
  $("#recent-list").hide().html(html).fadeIn(200);
  $("#page-info").text(String(currentPage).padStart(2, "0"));
  $("#prev-page").prop("disabled", currentPage === 1);
  $("#next-page").prop("disabled", start + tracksPerPage >= allTracks.length);
}

function fetchArtistInfo(name) {
  $.getJSON(
    `${BASE_URL}?method=artist.getinfo&artist=${encodeURIComponent(name)}&api_key=${API_KEY}&format=json`,
    (d) => {
      if (d.artist)
        $("#artist-bio").html(
          d.artist.bio.summary.split("<a")[0] || "No bio available.",
        );
    },
  );
}

function fetchSimilar(name) {
  $.getJSON(
    `${BASE_URL}?method=artist.getsimilar&artist=${encodeURIComponent(name)}&api_key=${API_KEY}&limit=12&format=json`,
    (d) => {
      let html = "";
      if (d.similarartists && d.similarartists.artist) {
        d.similarartists.artist.forEach((art) => {
          html += `<div class="col-6 col-md-3"><div class="similar-pill text-truncate font-mono">${art.name}</div></div>`;
        });
        $("#similar-artists").html(html);
      }
    },
  );
}

function renderChart(labels, data) {
  const ctx = document.getElementById("genreChart").getContext("2d");
  if (genreChart) genreChart.destroy();
  genreChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
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
            color: getComputedStyle(document.documentElement)
              .getPropertyValue("--brown-muted")
              .trim(),
            boxWidth: 10,
            font: { size: 11, family: "JetBrains Mono" },
          },
        },
      },
    },
  });
}

$(document).on("click", "#prev-page", () => {
  if (currentPage > 1) renderRecentPage(currentPage - 1);
});
$(document).on("click", "#next-page", () => {
  if (currentPage * tracksPerPage < allTracks.length)
    renderRecentPage(currentPage + 1);
});

$(document).on("click", ".fav-tab-btn", function () {
  $(".fav-tab-btn").removeClass("active");
  $(this).addClass("active");
  loadFavoriteTracks($(this).data("mode"));
});

(async function init() {
  await updateDashboard();
  loadObsession();
  loadFrequencyGraph();
  await sleep(600);
  await loadFavoriteTracks("loved");
})();

setInterval(updateDashboard, 50000);

async function getAlbumArtwork(albumName, artistName, lastFmImages) {
  // Prioritaskan gambar resolusi besar langsung dari Last.fm jika tersedia
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
    if (results.length > 0 && results[0].album?.cover_big) {
      imageCache[cacheKey] = results[0].album.cover_big;
      return results[0].album.cover_big;
    }
  } catch (e) {}

  return getTrackArtwork(albumName, artistName);
}

async function loadCollage() {
  const grid = $("#collage-grid");
  grid.html(
    `<div class="py-5 text-center font-mono text-muted" style="grid-column: 1 / -1; font-size: 0.85rem;">Preparing ${collageType} data...</div>`,
  );

  const method =
    collageType === "albums" ? "user.gettopalbums" : "user.gettopartists";

  try {
    const data = await $.getJSON(
      `${BASE_URL}?method=${method}&user=${USER}&api_key=${API_KEY}&period=${collagePeriod}&limit=9&format=json`,
    );

    const rawList =
      collageType === "albums"
        ? data.topalbums?.album || []
        : data.topartists?.artist || [];

    if (rawList.length === 0) {
      grid.html(
        `<div class="py-4 text-center text-muted" style="grid-column: 1 / -1; font-size: 0.88rem;">No listening data for this period.</div>`,
      );
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

    const tilesHtml = items
      .map(
        (item, idx) => `
              <a href="${item.url}" target="_blank" rel="noopener" class="collage-tile" title="${item.title} (${item.subtitle})">
                <span class="collage-rank">${idx === 0 ? "#01" : "#" + item.rank}</span>
                <img src="${item.imgUrl}" alt="${item.title}" loading="lazy" onerror="this.onerror=null;this.src='${item.fallback}'">
                <div class="collage-overlay">
                  <div class="collage-title text-truncate">${item.title}</div>
                  <div class="collage-sub text-truncate">${item.subtitle}</div>
                </div>
              </a>`,
      )
      .join("");

    grid.hide().html(tilesHtml).fadeIn(220);
  } catch (err) {
    grid.html(
      `<div class="py-4 text-center text-danger" style="grid-column: 1 / -1; font-size: 0.88rem;">Failed to load Last.fm collage.</div>`,
    );
  }
}

// Export Bento Collage menjadi file PNG (Responsif: Landscape di Desktop, Portrait di Mobile)
async function exportCollagePNG() {
  if (!currentCollageItems.length) return;
  const $btn = $("#downloadCollageBtn");
  const origHtml = $btn.html();
  $btn
    .prop("disabled", true)
    .html('<i class="fa-solid fa-spinner fa-spin me-1"></i>Rendering');

  const isMobile = window.innerWidth <= 768;

  // Konfigurasi grid berbeda untuk Desktop (4x3) vs Mobile (2x6)
  const cols = isMobile ? 2 : 4;
  const rows = isMobile ? 6 : 3;
  const width = isMobile ? 720 : 1000;
  const unit = width / cols;
  const height = unit * rows;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#181413";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Peta koordinat [col, row, span] untuk 9 item
  const layout = isMobile
    ? [
        [0, 0, 2], // #01 (2x2 penuh di atas)
        [0, 2, 1], // #02
        [1, 2, 1], // #03
        [0, 3, 1], // #04
        [1, 3, 1], // #05
        [0, 4, 1], // #06
        [1, 4, 1], // #07
        [0, 5, 1], // #08
        [1, 5, 1], // #09
      ]
    : [
        [0, 0, 2], // #01 (2x2 di kiri atas)
        [2, 0, 1], // #02
        [3, 0, 1], // #03
        [2, 1, 1], // #04
        [3, 1, 1], // #05
        [0, 2, 1], // #06
        [1, 2, 1], // #07
        [2, 2, 1], // #08
        [3, 2, 1], // #09
      ];

  const loadImg = (src, fallback) =>
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

    // Gradasi gelap di bagian bawah tiap ubin
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

    // Teks judul & subjudul proporsional
    const isHero = span === 2;
    const pad = isHero ? (isMobile ? 24 : 20) : 14;
    const titleFontSize = isHero ? (isMobile ? 28 : 24) : isMobile ? 18 : 15;
    const subFontSize = isHero ? (isMobile ? 17 : 15) : isMobile ? 13 : 11;

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${titleFontSize}px sans-serif`;
    ctx.fillText(
      item.title.slice(0, isHero ? 30 : 22),
      x + pad,
      y + boxSize - (isHero ? 44 : 30),
    );

    ctx.fillStyle = "#d47633";
    ctx.font = `bold ${subFontSize}px monospace`;
    const label = isHero
      ? `#01 · ${item.subtitle}`
      : `#${item.rank} · ${item.subtitle}`;
    ctx.fillText(
      label.slice(0, isHero ? 36 : 26),
      x + pad,
      y + boxSize - (isHero ? 18 : 12),
    );
  }

  const link = document.createElement("a");
  link.download = `yog-lastfm-${collageType}-${collagePeriod}${isMobile ? "-mobile" : ""}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();

  $btn.prop("disabled", false).html(origHtml);
}
// Event Listeners untuk Kontrol Collage
$(document).on("click", "[data-collage-type]", function () {
  $("[data-collage-type]").removeClass("active");
  $(this).addClass("active");
  collageType = $(this).data("collage-type");
  loadCollage();
});

$(document).on("click", "[data-collage-period]", function () {
  $("[data-collage-period]").removeClass("active");
  $(this).addClass("active");
  collagePeriod = $(this).data("collage-period");
  loadCollage();
});

$(document).on("click", "#downloadCollageBtn", exportCollagePNG);

const MANUAL_OBSESSION = null;
async function loadObsession() {
  try {
    const res = await $.getJSON(
      `${BASE_URL}?method=user.gettoptracks&user=${USER}&api_key=${API_KEY}&period=7day&limit=1&format=json`,
    );
    const topTrack =
      res.toptracks && res.toptracks.track && res.toptracks.track[0];

    if (!topTrack) {
      $("#obsession-card").hide();
      return;
    }

    const trackName = topTrack.name;
    const artistName = topTrack.artist.name;

    $("#obsession-track").text(trackName);
    $("#obsession-artist").text(artistName);
    $("#obsession-plays").text(`${topTrack.playcount}x`);
    $("#obsession-sublabel").text("THIS WEEK");
    $("#obsession-meta").text("7-DAY PEAK ROTATION");
    $("#obsession-link").attr("href", topTrack.url);
    $("#obsession-art").attr("src", getFallbackAvatar(artistName));

    const artImg = await getTrackArtwork(trackName, artistName);
    $("#obsession-art").attr("src", artImg);
  } catch (e) {
    $("#obsession-card").hide();
  }
}
let frequencyChart = null;
let freqDailyData = null;
let freqHourlyData = null;
let freqMode = "daily";

async function loadFrequencyGraph() {
  try {
    const nowSec = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = nowSec - 7 * 24 * 60 * 60;

    // Ambil scrobble 7 hari terakhir (hingga 200 track terbaru)
    const res = await $.getJSON(
      `${BASE_URL}?method=user.getrecenttracks&user=${USER}&api_key=${API_KEY}&from=${sevenDaysAgo}&limit=200&format=json`,
    );

    const tracks = (res.recenttracks && res.recenttracks.track) || [];
    // Filter track yang punya timestamp (abaikan item 'nowplaying' yang belum selesai)
    const completed = tracks.filter((t) => t.date && t.date.uts);

    // 1. Hitung distribusi 7 hari terakhir (urut dari 6 hari lalu -> hari ini)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dailyLabels = [];
    const dailyCounts = [];
    const dayMap = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const label =
        i === 0 ? "Today" : `${dayNames[d.getDay()]} ${d.getDate()}`;
      dayMap[key] = 0;
      dailyLabels.push(key);
      dailyCounts.push({ key, label });
    }

    // 2. Hitung distribusi per jam (00 - 23)
    const hourlyLabels = Array.from(
      { length: 24 },
      (_, h) => `${String(h).padStart(2, "0")}:00`,
    );
    const hourlyCounts = new Array(24).fill(0);

    completed.forEach((t) => {
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

    $("#freq-total-7d").text(completed.length.toLocaleString());
    renderFrequencyChart();
  } catch (e) {
    console.error("Failed to load frequency graph:", e);
  }
}

function renderFrequencyChart() {
  const canvasEl = document.getElementById("frequencyChart");
  if (!canvasEl || !freqDailyData || !freqHourlyData) return;

  const isDaily = freqMode === "daily";
  const activeData = isDaily ? freqDailyData : freqHourlyData;

  // Cari puncak (peak day / peak hour)
  let maxVal = 0;
  let peakIdx = 0;
  activeData.values.forEach((v, idx) => {
    if (v > maxVal) {
      maxVal = v;
      peakIdx = idx;
    }
  });
  $("#freq-peak-label").text(
    maxVal > 0 ? `${activeData.labels[peakIdx]} (${maxVal}x)` : "—",
  );

  const mutedColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--brown-muted")
      .trim() || "#87685d";
  const gridColor = "rgba(135, 104, 93, 0.14)";

  if (frequencyChart) frequencyChart.destroy();

  const ctx = canvasEl.getContext("2d");
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
            label: (ctx) => `${ctx.parsed.y} scrobbles`,
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

$(document).on("click", "[data-freq-mode]", function () {
  $("[data-freq-mode]").removeClass("active");
  $(this).addClass("active");
  freqMode = $(this).data("freq-mode");
  renderFrequencyChart();
});
