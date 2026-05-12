/* ============================================================
   Dashboard Kanwil Ditjenpas Kaltim-Utara — app.js
   ============================================================ */

/* ===== STATE ===== */
var currentUser = null;
var currentRole = "user";
var selectedLoginRole = "user";
var laporan_count = 0;
var lastResult = "";
var currentArsipDetail = null;
var activityLog = [];

var ACCOUNTS = [
  {
    username: "admin",
    password: "admin123",
    role: "admin",
    nama: "Administrator Kanwil",
  },
  {
    username: "user",
    password: "user123",
    role: "user",
    nama: "Operator Kanwil",
  },
  {
    username: "bapas_smr",
    password: "smr123",
    role: "bapas",
    nama: "Operator Bapas Samarinda",
    unit: "smr",
    unitLabel: "Bapas Kelas I Samarinda",
  },
  {
    username: "bapas_bpp",
    password: "bpp123",
    role: "bapas",
    nama: "Operator Bapas Balikpapan",
    unit: "bpp",
    unitLabel: "Bapas Kelas I Balikpapan",
  },
  {
    username: "bapas_trk",
    password: "trk123",
    role: "bapas",
    nama: "Operator Bapas Tarakan",
    unit: "trk",
    unitLabel: "Bapas Kelas II Tarakan",
  },
];

var USERS_DB = [...ACCOUNTS];

var ARSIP_DB = [];
// Format harian: {id, tanggal, hari, dewasa, anak, laporan}
// Diisi otomatis setiap Generate Laporan dijalankan

var HARI_LIST = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];
var BULAN_LIST = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/* ===== GDRIVE LINKS — per Bapas, 6 folder masing-masing ===== */
var DRIVE_LINKS = {
  smr: {
    registrasi_litmas:
      "https://drive.google.com/drive/folders/1OqkDAWbm88N0XWYTgDHIGiIR8vr0fxz5?usp=drive_link",
    pengawasan:
      "https://drive.google.com/drive/folders/1JEJnE80tIDxFwVE2dua08vR13MplViip?usp=drive_link",
    pendampingan:
      "https://drive.google.com/drive/folders/1r-UUG71NKNYp6rkqQqPgfX8sCDc3w2OC?usp=drive_link",
    pembimbingan:
      "https://drive.google.com/drive/folders/14KSImoCFf0OTU_fFTlqZRbeyt1uXbVyp?usp=drive_link",
    pelibatan:
      "https://drive.google.com/drive/folders/1AvUElQ5ILEJwBRKONmhKzGt5we5GUgln?usp=drive_link",
    infografis_profil:
      "https://drive.google.com/drive/folders/1yVJh4as2ksE1EZUFPnLNWEFLZf7Dl74n?usp=drive_link",
  },
  bpp: {
    registrasi_litmas:
      "https://drive.google.com/drive/folders/1KIe5vthXH0UGPfucP9d1lM4o6B5fwGG0?usp=drive_link",
    pengawasan:
      "https://drive.google.com/drive/folders/13kYQxil-DYeAjFN_uqx31DTu3HmXHdjl?usp=drive_link",
    pendampingan:
      "https://drive.google.com/drive/folders/1Ry-dTk2SmXgqEu3oxi-Xd2NQ7iP4ZbFp?usp=drive_link",
    pembimbingan:
      "https://drive.google.com/drive/folders/1gYGtP1qso7qgLQQ-1x0OQ2cI69DM6104?usp=drive_link",
    pelibatan:
      "https://drive.google.com/drive/folders/1zxN87cFteEXAG9yzibLk5dUBK9xR2OnO?usp=drive_link",
    infografis_profil:
      "https://drive.google.com/drive/folders/1XA4dvQqYL7Ne7rKouiUh4mBBksmm1k1_?usp=drive_link",
  },
  trk: {
    registrasi_litmas:
      "https://drive.google.com/drive/folders/1KIe5vthXH0UGPfucP9d1lM4o6B5fwGG0?usp=drive_link",
    pengawasan:
      "https://drive.google.com/drive/folders/1mszDNHYCWyy6hGvj7psaHqmhuErHnO4m?usp=drive_link",
    pendampingan:
      "https://drive.google.com/drive/folders/1VB-RdMdAm8QjqeiX4AOz2IY9sJb8Dlb0?usp=drive_link",
    pembimbingan:
      "https://drive.google.com/drive/folders/1QTVF-CC7iRV9sqJkPLsgcOB_wEvjpOWT?usp=drive_link",
    pelibatan:
      "https://drive.google.com/drive/folders/1Jws39Z5BGEb40nRiQXLFssFC2zDLJjZW?usp=drive_link",
    infografis_profil:
      "https://drive.google.com/drive/folders/1Z4x7fO4K259M-F5EV1He9d45B2eDjNa8?usp=drive_link",
  },
};

var charts = {};

/* ===== LOGIN ===== */
function selectRole(role, el) {
  selectedLoginRole = role;
  document
    .querySelectorAll(".role-btn")
    .forEach((b) => b.classList.remove("selected"));
  el.classList.add("selected");
}

function doLogin() {
  var u = document.getElementById("login-user").value.trim();
  var p = document.getElementById("login-pass").value;
  var err = document.getElementById("login-err");
  // Bapas login pakai role 'user' selector
  var acc = ACCOUNTS.find(function (a) {
    return (
      a.username === u &&
      a.password === p &&
      (a.role === selectedLoginRole ||
        (selectedLoginRole === "user" && a.role === "bapas"))
    );
  });
  if (!acc) {
    err.style.display = "block";
    return;
  }
  err.style.display = "none";
  currentUser = acc;
  currentRole = acc.role;
  try {
    localStorage.setItem(
      "dashSession",
      JSON.stringify({ username: acc.username, role: acc.role }),
    );
  } catch (e) {}
  document.getElementById("login-screen").style.display = "none";
  var app = document.getElementById("app");
  app.style.display = "flex";
  app.classList.add("ready");
  if (currentRole === "admin") {
    app.classList.add("is-admin");
    app.classList.remove("is-bapas");
  } else if (currentRole === "bapas") {
    app.classList.add("is-bapas");
    app.classList.remove("is-admin");
  } else {
    app.classList.remove("is-admin");
    app.classList.remove("is-bapas");
  }
  setupUserUI();
  initApp();
  logActivity("Login: " + acc.nama + " (" + acc.role + ")");
}

function doLogout() {
  logActivity("Logout: " + currentUser.nama);
  stopAdminRealtimeListener();
  currentUser = null;
  try {
    localStorage.removeItem("dashSession");
    sessionStorage.removeItem("lastPage");
  } catch (e) {}
  document.getElementById("app").style.display = "none";
  document
    .getElementById("app")
    .classList.remove("ready", "is-admin", "is-bapas");
  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("login-user").value = "";
  document.getElementById("login-pass").value = "";
}

function setupUserUI() {
  var u = currentUser;
  document.getElementById("sb-username").textContent = u.nama;
  document.getElementById("sb-role-text").textContent =
    u.role === "admin"
      ? "Administrator"
      : u.role === "bapas"
        ? u.unitLabel || "Operator Bapas"
        : "Operator";
  var av = document.getElementById("sb-avatar");
  var tbav = document.getElementById("tb-avatar");
  if (u.foto) {
    av.style.backgroundImage = "url(" + u.foto + ")";
    av.style.backgroundSize = "cover";
    av.style.backgroundPosition = "center";
    av.textContent = "";
    tbav.style.backgroundImage = "url(" + u.foto + ")";
    tbav.style.backgroundSize = "cover";
    tbav.style.backgroundPosition = "center";
    tbav.textContent = "";
  } else {
    av.style.backgroundImage = "";
    av.textContent = u.nama[0].toUpperCase();
    tbav.style.backgroundImage = "";
    tbav.textContent = u.nama[0].toUpperCase();
  }
  av.className =
    "su-avatar" +
    (u.role === "admin" ? " admin-av" : u.role === "bapas" ? " bapas-av" : "");
  var badge = document.getElementById("sb-role-badge");
  badge.textContent =
    u.role === "admin" ? "Admin" : u.role === "bapas" ? "Bapas" : "User";
  badge.className = "su-badge " + u.role;
  tbav.className =
    "tb-avatar" +
    (u.role === "admin" ? " admin" : u.role === "bapas" ? " bapas" : "");
  var btnSave = document.getElementById("btn-save-arsip");
  if (btnSave)
    btnSave.style.display = u.role === "admin" ? "inline-block" : "none";
  var gc = document.getElementById("gender-input-card");
  if (gc) gc.style.display = u.role === "admin" ? "block" : "none";
}

/* ===== INIT ===== */
function initApp() {
  var now = new Date();
  var hari = HARI_LIST[now.getDay()];
  var tgl = now.getDate();
  var bln = BULAN_LIST[now.getMonth() + 1];
  var thn = now.getFullYear();
  var tanggal = hari + ", " + tgl + " " + bln + " " + thn;
  document.getElementById("tb-date").textContent = "📅 " + tanggal;
  document.getElementById("meta-hari").value = tanggal;

  ["kanwil", "smr", "bpp", "trk"].forEach(updateJftTotal);
  syncOvJft();

  // Isi total klien dari laporan harian terakhir jika sudah ada
  if (ARSIP_DB.length > 0) {
    var latest = ARSIP_DB[0];
    _lastTotalKlien = (latest.dewasa || 0) + (latest.anak || 0);
  }
  var _initDisp = _lastTotalKlien > 0 ? fmt(_lastTotalKlien) : "—";
  var _elKInit = document.getElementById("ov-total-klien");
  var _elKHInit = document.getElementById("ov-total-klien-hero");
  if (_elKInit) _elKInit.textContent = _initDisp;
  if (_elKHInit) _elKHInit.textContent = _initDisp;

  renderArsip();
  renderOvArsip();
  renderUserTable();
  renderActivityLog();
  renderAllFolderLists();
  setTimeout(initCharts, 100);
  setTimeout(renderJftDoughnuts, 150);
  // Firebase init + Bapas form + admin badge
  setTimeout(function () {
    initFirebase();
    if (currentRole === "bapas") {
      setTimeout(renderBapasInputForm, 300);
      // Muat data hari ini dari Firebase untuk sync dashboard JFT & klien
      setTimeout(function() {
        if (_fbReady) {
          loadAllBapasData(getTanggalIso(), function(all) {
            syncDashboardFromBapasData(all);
          });
        }
      }, 500);
    } else if (currentRole === "admin") {
      // startAdminRealtimeListener sudah dipanggil di dalam initFirebase() saat berhasil
      // Tambahkan fallback jika Firebase membutuhkan waktu lebih lama
      setTimeout(function () {
        if (_fbReady) {
          startAdminRealtimeListener();
          updateAdminBadgeCount();
        }
      }, 600);
    } else {
      // Role user biasa: muat data Firebase untuk dashboard
      setTimeout(function() {
        if (_fbReady) {
          loadAllBapasData(getTanggalIso(), function(all) {
            syncDashboardFromBapasData(all);
          });
        }
      }, 500);
    }
  }, 100);
  // Restore halaman terakhir sebelum refresh (dari sessionStorage atau hash URL)
  var validPages = ["dashboard", "laporan-harian", "laporan-bulanan", "infografis", "jft-infografis", "admin"];
  var savedPage = null;
  try { savedPage = sessionStorage.getItem("lastPage"); } catch(e) {}
  // Cek juga hash di URL (misal #laporan-harian)
  var hashPage = window.location.hash ? window.location.hash.replace("#", "") : null;
  var targetPage = (hashPage && validPages.indexOf(hashPage) >= 0) ? hashPage
                 : (savedPage && validPages.indexOf(savedPage) >= 0) ? savedPage
                 : "dashboard";
  // Jika halaman admin tapi role bukan admin, fallback ke dashboard
  if (targetPage === "admin" && currentRole !== "admin") targetPage = "dashboard";
  history.replaceState({ page: targetPage }, "", "#" + targetPage);
  if (targetPage !== "dashboard") {
    goPage(targetPage, null, true);
  }
}

/* ===== PAGE NAVIGATION ===== */
function goPage(id, navEl, skipHistory) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  var page = document.getElementById("page-" + id);
  if (page) page.classList.add("active");
  if (navEl) navEl.classList.add("active");
  else {
    document.querySelectorAll(".nav-item").forEach((n) => {
      if (
        n.getAttribute("onclick") &&
        n.getAttribute("onclick").includes("'" + id + "'")
      )
        n.classList.add("active");
    });
  }
  var titles = {
    dashboard: "Dashboard",
    "laporan-harian": "Laporan Harian",
    "laporan-bulanan": "Laporan Bulanan",
    infografis: "Infografis",
    "jft-infografis": "Infografis JFT",
    admin: "Panel Admin",
  };
  document.getElementById("topbar-title").textContent = titles[id] || id;
  // Catat ke history browser agar tombol back bisa navigasi antar halaman
  if (!skipHistory && currentUser) {
    history.pushState({ page: id }, "", "#" + id);
  }
  // Simpan halaman terakhir ke sessionStorage agar tetap saat refresh
  try { sessionStorage.setItem("lastPage", id); } catch(e) {}
  if (id === "dashboard") {
    setTimeout(function () {
      syncOvJft();
      var _elK = document.getElementById("ov-total-klien");
      var _elKH = document.getElementById("ov-total-klien-hero");
      var _v = _lastTotalKlien > 0 ? fmt(_lastTotalKlien) : "—";
      if (_elK) _elK.textContent = _v;
      if (_elKH) _elKH.textContent = _v;
      // Muat data terkini dari Firebase untuk semua role
      if (_fbReady) {
        loadAllBapasData(getTanggalIso(), function(all) {
          syncDashboardFromBapasData(all);
        });
      }
    }, 50);
  }
  if (id === "infografis") {
    setTimeout(refreshInfografis, 200);
  }
  if (id === "laporan-harian") {
    if (currentRole === "bapas") setTimeout(renderBapasInputForm, 200);
    else if (currentRole === "admin") {
      setTimeout(function () {
        if (_fbReady) {
          startAdminRealtimeListener();
          updateAdminBadgeCount();
        } else {
          var statusEl = document.getElementById("admin-bapas-status");
          if (statusEl) {
            statusEl.innerHTML = '<div style="color:#f59e0b;font-size:13px;padding:8px 0;">⚠ Koneksi ke server belum siap. Coba refresh halaman.</div>';
          }
        }
      }, 200);
    }
  }
  if (id === "jft-infografis") {
    setTimeout(refreshJftInfografis, 200);
  }
  closeSidebar();
}

/* ===== SIDEBAR ===== */
function toggleSidebar() {
  var sb = document.getElementById("sidebar");
  var ov = document.getElementById("sb-overlay");
  sb.classList.toggle("open");
  ov.style.display = sb.classList.contains("open") ? "block" : "none";
}
function closeSidebar() {
  var sb = document.getElementById("sidebar");
  var ov = document.getElementById("sb-overlay");
  sb.classList.remove("open");
  ov.style.display = "none";
}

/* ===== TAB SWITCHING ===== */
function switchTab(id, el) {
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".panel")
    .forEach((p) => p.classList.remove("active"));
  el.classList.add("active");
  document.getElementById("panel-" + id).classList.add("active");
}

function switchAdminTab(id, el) {
  document
    .querySelectorAll(".admin-tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".admin-panel")
    .forEach((p) => p.classList.remove("active"));
  el.classList.add("active");
  document.getElementById("ap-" + id).classList.add("active");
}

/* ===== BADGE ===== */
function updateBadge(id) {
  var txt = document.getElementById("txt-" + id).value.trim();
  var badge = document.getElementById("badge-" + id);
  var label =
    id === "smr" ? "Samarinda" : id === "bpp" ? "Balikpapan" : "Tarakan";
  if (txt.length > 20) {
    badge.className = "badge ok";
    badge.textContent = label + ": sudah diisi ✓";
  } else {
    badge.className = "badge";
    badge.textContent = label + ": belum diisi";
  }
}

/* ===== JFT TOTAL ===== */
function updateJftTotal(unit) {
  var ids =
    unit === "kanwil"
      ? ["jft_kanwil_pertama", "jft_kanwil_muda", "jft_kanwil_madya"]
      : [
          "jft_" + unit + "_apk",
          "jft_" + unit + "_pertama",
          "jft_" + unit + "_muda",
          "jft_" + unit + "_madya",
        ];
  var total = ids.reduce(function (s, id) {
    var el = document.getElementById(id);
    return s + (el ? parseInt(el.value) || 0 : 0);
  }, 0);
  var _jftEl = document.getElementById("jft-" + unit + "-total");
  if (_jftEl) _jftEl.textContent = total;
}

function syncOvJft() {
  function iv(id) {
    var el = document.getElementById(id);
    return el ? parseInt(el.value) || 0 : 0;
  }
  var kw =
    iv("jft_kanwil_pertama") + iv("jft_kanwil_muda") + iv("jft_kanwil_madya");
  var smr =
    iv("jft_smr_apk") +
    iv("jft_smr_pertama") +
    iv("jft_smr_muda") +
    iv("jft_smr_madya");
  var bpp =
    iv("jft_bpp_apk") +
    iv("jft_bpp_pertama") +
    iv("jft_bpp_muda") +
    iv("jft_bpp_madya");
  var trk =
    iv("jft_trk_apk") +
    iv("jft_trk_pertama") +
    iv("jft_trk_muda") +
    iv("jft_trk_madya");
  var tot = kw + smr + bpp + trk;
  document.getElementById("ov-jft-kanwil").textContent = kw;
  document.getElementById("ov-jft-smr").textContent = smr;
  document.getElementById("ov-jft-bpp").textContent = bpp;
  document.getElementById("ov-jft-trk").textContent = trk;
  document.getElementById("ov-total-jft").textContent = tot;
  var heroJft = document.getElementById("ov-total-jft-hero");
  if (heroJft) heroJft.textContent = tot;
  ["inf-jft-kanwil", "inf-jft-smr", "inf-jft-bpp", "inf-jft-trk"].forEach(
    function (id, i) {
      var el = document.getElementById(id);
      if (el) el.textContent = [kw, smr, bpp, trk][i];
    },
  );
  var totalEl = document.getElementById("inf-jft-total");
  if (totalEl) totalEl.textContent = tot;
  // kanwil bars
  var kwp = iv("jft_kanwil_pertama"),
    kwm = iv("jft_kanwil_muda"),
    kwma = iv("jft_kanwil_madya");
  setBar("inf-kw-1", kwp, "inf-kw-bar1", kwp, kw || 1);
  setBar("inf-kw-2", kwm, "inf-kw-bar2", kwm, kw || 1);
  setBar("inf-kw-3", kwma, "inf-kw-bar3", kwma, kw || 1);
  // smr
  var sa = iv("jft_smr_apk"),
    sp = iv("jft_smr_pertama"),
    sm = iv("jft_smr_muda"),
    sma = iv("jft_smr_madya");
  setBar("inf-smr-0", sa, "inf-smr-bar0", sa, smr || 1);
  setBar("inf-smr-1", sp, "inf-smr-bar1", sp, smr || 1);
  setBar("inf-smr-2", sm, "inf-smr-bar2", sm, smr || 1);
  setBar("inf-smr-3", sma, "inf-smr-bar3", sma, smr || 1);
  // bpp
  var ba = iv("jft_bpp_apk"),
    bp = iv("jft_bpp_pertama"),
    bm = iv("jft_bpp_muda"),
    bma = iv("jft_bpp_madya");
  setBar("inf-bpp-0", ba, "inf-bpp-bar0", ba, bpp || 1);
  setBar("inf-bpp-1", bp, "inf-bpp-bar1", bp, bpp || 1);
  setBar("inf-bpp-2", bm, "inf-bpp-bar2", bm, bpp || 1);
  setBar("inf-bpp-3", bma, "inf-bpp-bar3", bma, bpp || 1);
  // trk
  var ta = iv("jft_trk_apk"),
    tp = iv("jft_trk_pertama"),
    tm = iv("jft_trk_muda"),
    tma = iv("jft_trk_madya");
  setBar("inf-trk-0", ta, "inf-trk-bar0", ta, trk || 1);
  setBar("inf-trk-1", tp, "inf-trk-bar1", tp, trk || 1);
  setBar("inf-trk-2", tm, "inf-trk-bar2", tm, trk || 1);
  setBar("inf-trk-3", tma, "inf-trk-bar3", tma, trk || 1);
}

function setBar(labelId, val, barId, v, max) {
  var lel = document.getElementById(labelId);
  if (lel) lel.textContent = val;
  var bel = document.getElementById(barId);
  if (bel) bel.style.width = Math.round((v / max) * 100) + "%";
}

/* ===== PARSER ===== */
function extractNum(text, patterns) {
  for (var i = 0; i < patterns.length; i++) {
    var m = text.match(patterns[i]);
    if (m) {
      var raw = m[1].replace(/[.,\s]/g, "");
      var num = parseInt(raw, 10);
      if (!isNaN(num)) return num;
    }
  }
  return null;
}

/* Ekstrak jumlah (L+P) dari blok bertipe:
   Kata Kunci
   L : 123 orang
   P : 45 orang
   Jumlah : 168 orang
   Juga mendukung format "Kata Kunci : 168 (150L + 18P)" */
function extractBlockTotal(text, keyword) {
  var esc = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Format "Jumlah : X" setelah keyword (dalam 120 karakter)
  var re1 = new RegExp(
    esc + "[\\s\\S]{0,120}?jumlah\\s*[=:]\\s*([\\d.,]+)",
    "i",
  );
  var m1 = text.match(re1);
  if (m1) return parseInt(m1[1].replace(/[.,]/g, ""), 10);
  // Format "keyword : X (YL + ZP)"
  var re2 = new RegExp(esc + "\\s*[:\\-]?\\s*([\\d.,]+)\\s*\\(", "i");
  var m2 = text.match(re2);
  if (m2) return parseInt(m2[1].replace(/[.,]/g, ""), 10);
  // Format "keyword : X"
  var re3 = new RegExp("^" + esc + "\\s*[:\\-]?\\s*([\\d.,]+)", "im");
  var m3 = text.match(re3);
  if (m3) return parseInt(m3[1].replace(/[.,]/g, ""), 10);
  return null;
}

function extractIntFromLine(text, keyword) {
  return extractBlockTotal(text, keyword);
}

function parseReport(text) {
  var t = text,
    d = {};

  // Pisahkan teks menjadi bagian Dewasa dan Anak
  // Cari posisi "Klien Anak" (bukan "Klien Anak Sekolah") sebagai pemisah
  var splitPos = -1;
  var anakMatch = t.match(/klien anak(?!\s*sekolah)(?!\s*narkotika)/i);
  if (anakMatch) splitPos = anakMatch.index;
  var tDew = splitPos >= 0 ? t.substring(0, splitPos) : t;
  var tAnak = splitPos >= 0 ? t.substring(splitPos) : "";

  // --- KLIEN DEWASA TOTAL ---
  var mDew = tDew.match(/klien dewasa[\s\S]{0,200}?jumlah\s*[=:]\s*([\d.,]+)/i);
  if (mDew) {
    d.dewasa = parseInt(mDew[1].replace(/[.,]/g, ""), 10);
  } else {
    // Coba format "Klien Dewasa\nL:X\nP:Y\nJumlah:Z" dengan rentang lebih besar
    var mDew2 = t.match(/klien dewasa[\s\S]{0,400}?jumlah\s*[=:]\s*([\d.,]+)/i);
    d.dewasa = mDew2 ? parseInt(mDew2[1].replace(/[.,]/g, ""), 10) : null;
  }

  // --- KLIEN ANAK TOTAL ---
  var mAnak = tAnak.match(/klien anak[\s\S]{0,200}?jumlah\s*[=:]\s*([\d.,]+)/i);
  d.anak = mAnak ? parseInt(mAnak[1].replace(/[.,]/g, ""), 10) : null;

  // --- BAGIAN DEWASA ---
  d.pb_dewasa = extractBlockTotal(tDew, "pb");
  d.cb_dewasa = extractBlockTotal(tDew, "cb");
  d.cmb_dewasa = extractBlockTotal(tDew, "cmb");
  d.cmk_dewasa = extractBlockTotal(tDew, "cmk");

  var asimDew = tDew.match(
    /asimila[si]*[\s\S]{0,120}?jumlah\s*[=:]\s*([\d.,]+)/i,
  );
  d.asim_dewasa = asimDew
    ? parseInt(asimDew[1].replace(/[.,]/g, ""), 10)
    : null;

  // Klien Bekerja (hanya di bagian dewasa)
  d.bekerja =
    extractBlockTotal(tDew, "klien bekerja") ||
    extractNum(tDew, [/klien bekerja[\s\S]{0,120}jumlah\s*[=:]\s*([\d.,]+)/i]);

  // Tipikor (hanya dewasa)
  d.tipikor =
    extractBlockTotal(tDew, "klien tipikor") ||
    extractNum(tDew, [/tipikor[\s\S]{0,120}jumlah\s*[=:]\s*([\d.,]+)/i]);

  // PiB dewasa
  d.pib_dewasa = extractBlockTotal(tDew, "pib");

  // Narkotika dewasa — potong teks hanya di sekitar blok "Klien Narkotika" agar tidak ambil Bekerja
  var nDewBlock = tDew.match(
    /klien narkotika([\s\S]{0,150}?)(?=klien bekerja|permintaan|penyelesaian|pib|$)/i,
  );
  var nDewVal = nDewBlock
    ? extractNum(nDewBlock[0], [/jumlah\s*[=:]\s*([\d.,]+)/i])
    : null;
  if (nDewVal === null) {
    var nDew2 = tDew.match(
      /klien narkotika[\s\S]{0,120}jumlah\s*[=:]\s*([\d.,]+)/i,
    );
    nDewVal = nDew2 ? parseInt(nDew2[1].replace(/[.,]/g, ""), 10) : null;
  }

  // Teroris dewasa — potong blok "Klien Teroris" saja
  var terDewBlock = tDew.match(
    /klien teroris([\s\S]{0,150}?)(?=klien tipikor|klien narkotika|klien bekerja|pib|permintaan|$)/i,
  );
  var terDewVal = terDewBlock
    ? extractNum(terDewBlock[0], [/jumlah\s*[=:]\s*([\d.,]+)/i])
    : null;
  if (terDewVal === null) {
    var terDew2 = tDew.match(
      /klien teroris[\s\S]{0,120}jumlah\s*[=:]\s*([\d.,]+)/i,
    );
    terDewVal = terDew2 ? parseInt(terDew2[1].replace(/[.,]/g, ""), 10) : null;
  }

  // Litmas dewasa - format "Permintaan Litmas Dewasa 2026: 337 (320L + 17P)"
  d.litmas_dew_req = extractNum(tDew, [
    /permintaan litmas dewasa\s*\d{0,4}\s*[:\-]?\s*([\d.,]+)/i,
    /permintaan litmas[\s\S]{0,50}?dewasa\s*\d{0,4}\s*[:\-]?\s*([\d.,]+)/i,
  ]);
  d.litmas_dew_done = extractNum(tDew, [
    /penyelesaian litmas dewasa\s*\d{0,4}\s*[:\-]?\s*([\d.,]+)/i,
    /penyelesaian litmas[\s\S]{0,50}?dewasa\s*\d{0,4}\s*[:\-]?\s*([\d.,]+)/i,
  ]);
  // Belum penyelesaian litmas dewasa
  d.litmas_dew_belum = extractNum(tDew, [
    /belum\s+penyelesaian\s+litmas\s+dewasa\s*\d{0,4}\s*[:\-]?\s*([\d.,]+)/i,
    /belum\s+terselesaikan\s+dewasa\s*\d{0,4}\s*[:\-]?\s*([\d.,]+)/i,
  ]);

  // Permintaan berdasarkan UPT
  d.req_lapas = extractNum(tDew, [/lapas\s*[:\-]\s*([\d.,]+)/i]);
  d.req_rutan = extractNum(tDew, [/rutan\s*[:\-]\s*([\d.,]+)/i]);

  // --- BAGIAN ANAK ---
  d.pb_anak = extractBlockTotal(tAnak, "pb");
  d.cb_anak = extractBlockTotal(tAnak, "cb");
  d.cmb_anak = extractBlockTotal(tAnak, "cmb");
  d.cmk_anak = extractBlockTotal(tAnak, "cmk");

  var asimAnak = tAnak.match(
    /asimila[si]*[\s\S]{0,120}?jumlah\s*[=:]\s*([\d.,]+)/i,
  );
  d.asim_anak = asimAnak
    ? parseInt(asimAnak[1].replace(/[.,]/g, ""), 10)
    : null;

  // LPKS/Latker (anak)
  d.latker = extractNum(tAnak, [
    /lpks[\s\S]{0,60}jumlah\s*[=:]\s*([\d.,]+)/i,
    /latker[\s\S]{0,60}jumlah\s*[=:]\s*([\d.,]+)/i,
    /lpks\/latker[\s\S]{0,60}jumlah\s*[=:]\s*([\d.,]+)/i,
  ]);

  // Narkotika anak — blok "Klien Narkotika" di bagian anak
  var nAnakBlock = tAnak.match(
    /klien narkotika([\s\S]{0,150}?)(?=teroris|pib|akot|diversi|klien anak sekolah|permintaan|$)/i,
  );
  var nAnakVal = nAnakBlock
    ? extractNum(nAnakBlock[0], [/jumlah\s*[=:]\s*([\d.,]+)/i])
    : null;
  if (nAnakVal === null) {
    var nAnak2 = tAnak.match(
      /klien narkotika[\s\S]{0,120}jumlah\s*[=:]\s*([\d.,]+)/i,
    );
    nAnakVal = nAnak2 ? parseInt(nAnak2[1].replace(/[.,]/g, ""), 10) : null;
  }

  // Parser per-seksi untuk bagian anak — split berdasarkan baris header
  // Ambil blok teks antara keyword dan keyword berikutnya
  function getSection(fullText, keyword) {
    var lines = fullText.split("\n");
    var kl = keyword.toLowerCase();
    var start = -1;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().trim().indexOf(kl) === 0) {
        start = i;
        break;
      }
    }
    if (start < 0) return "";
    // Kumpulkan baris sampai baris header berikutnya (baris pendek tanpa angka atau baris bermakna)
    var block = [];
    for (var j = start; j < Math.min(start + 8, lines.length); j++) {
      block.push(lines[j]);
      if (j > start && /^jumlah/i.test(lines[j].trim())) break;
    }
    return block.join("\n");
  }
  function jumlahFrom(block) {
    if (!block) return null;
    var m = block.match(/jumlah\s*[=:]\s*([\d.,]+)/i);
    return m ? parseInt(m[1].replace(/[.,]/g, ""), 10) : null;
  }

  var terAnakVal = jumlahFrom(getSection(tAnak, "teroris"));
  d.pib_anak = jumlahFrom(getSection(tAnak, "pib"));
  d.akot = jumlahFrom(getSection(tAnak, "akot"));
  d.diversi = jumlahFrom(getSection(tAnak, "diversi"));
  d.sekolah = jumlahFrom(getSection(tAnak, "klien anak sekolah"));

  d.narkotika =
    nDewVal !== null || nAnakVal !== null
      ? (nDewVal || 0) + (nAnakVal || 0)
      : null;
  d.teroris =
    terDewVal !== null || terAnakVal !== null
      ? (terDewVal || 0) + (terAnakVal || 0)
      : null;

  // Litmas anak - format "Permintaan Litmas Anak 2026: 14 orang"
  d.litmas_anak_req = extractNum(tAnak, [
    /permintaan litmas anak\s*\d{0,4}\s*[:\-]?\s*([\d.,]+)/i,
  ]);
  d.litmas_anak_done = extractNum(tAnak, [
    /penyelesaian litmas anak\s*\d{0,4}\s*[:\-]?\s*([\d.,]+)/i,
  ]);
  d.litmas_anak_belum = extractNum(tAnak, [
    /belum\s+terselesaikan\s*\d{0,4}\s*[:\-]?\s*([\d.,]+)/i,
    /belum\s+penyelesaian\s+litmas\s+anak\s*\d{0,4}\s*[:\-]?\s*([\d.,]+)/i,
  ]);

  return d;
}

var previewTimers = {};
var PREVIEW_FIELDS = [
  // Dewasa
  { key: "dewasa", label: "Klien Dewasa" },
  { key: "pb_dewasa", label: "PB (Dewasa)" },
  { key: "cb_dewasa", label: "CB (Dewasa)" },
  { key: "cmb_dewasa", label: "CMB (Dewasa)" },
  { key: "cmk_dewasa", label: "CMK (Dewasa)" },
  { key: "asim_dewasa", label: "Asimilasi (Dewasa)" },
  { key: "tipikor", label: "Klien Tipikor" },
  { key: "pib_dewasa", label: "PiB (Dewasa)" },
  { key: "bekerja", label: "Klien Bekerja" },
  // Litmas Dewasa
  { key: "litmas_dew_req", label: "Litmas Dew.(Req)" },
  { key: "litmas_dew_done", label: "Litmas Dew.(Done)" },
  { key: "litmas_dew_belum", label: "Litmas Dew.(Belum)" },
  // Anak
  { key: "anak", label: "Klien Anak" },
  { key: "pb_anak", label: "PB (Anak)" },
  { key: "cb_anak", label: "CB (Anak)" },
  { key: "cmb_anak", label: "CMB (Anak)" },
  { key: "cmk_anak", label: "CMK (Anak)" },
  { key: "asim_anak", label: "Asimilasi (Anak)" },
  { key: "latker", label: "LPKS/Latker" },
  { key: "pib_anak", label: "PiB (Anak)" },
  { key: "akot", label: "AKOT" },
  { key: "diversi", label: "Diversi" },
  { key: "sekolah", label: "Klien Anak Sekolah" },
  // Litmas Anak
  { key: "litmas_anak_req", label: "Litmas Anak(Req)" },
  { key: "litmas_anak_done", label: "Litmas Anak(Done)" },
  { key: "litmas_anak_belum", label: "Litmas Anak(Belum)" },
  // Gabungan
  { key: "narkotika", label: "Narkotika (Total)" },
  { key: "teroris", label: "Teroris (Total)" },
];
function livePreview(id) {
  var txt = document.getElementById("txt-" + id).value.trim();
  var prev = document.getElementById("prev-" + id);
  var grid = document.getElementById("prev-" + id + "-grid");
  if (txt.length < 20) {
    prev.classList.remove("show");
    return;
  }
  clearTimeout(previewTimers[id]);
  previewTimers[id] = setTimeout(function () {
    var data = parseReport(txt);
    var html = "";
    PREVIEW_FIELDS.forEach(function (f) {
      var v =
        data[f.key] !== undefined && data[f.key] !== null ? data[f.key] : null;
      var cls = v === null ? "" : v > 0 ? "found" : "zero";
      var disp = v === null ? "—" : Number(v).toLocaleString("id-ID");
      html +=
        '<div class="parse-item ' +
        cls +
        '"><div class="key">' +
        f.label +
        '</div><div class="val">' +
        disp +
        "</div></div>";
    });
    grid.innerHTML = html;
    prev.classList.add("show");
  }, 400);
}
function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ===== GENERATOR ===== */
function n(v) {
  return v !== null && v !== undefined ? v : 0;
}
function fmt(v) {
  return Number(v).toLocaleString("id-ID");
}
function buildJft() {
  function iv(id, def) {
    var el = document.getElementById(id);
    return el ? parseInt(el.value) || 0 : def;
  }
  var jft = {
    kanwil_pertama: iv("jft_kanwil_pertama", 0),
    kanwil_muda: iv("jft_kanwil_muda", 2),
    kanwil_madya: iv("jft_kanwil_madya", 2),
    smr_apk: iv("jft_smr_apk", 1),
    smr_pertama: iv("jft_smr_pertama", 12),
    smr_muda: iv("jft_smr_muda", 7),
    smr_madya: iv("jft_smr_madya", 4),
    bpp_apk: iv("jft_bpp_apk", 0),
    bpp_pertama: iv("jft_bpp_pertama", 16),
    bpp_muda: iv("jft_bpp_muda", 6),
    bpp_madya: iv("jft_bpp_madya", 5),
    trk_apk: iv("jft_trk_apk", 0),
    trk_pertama: iv("jft_trk_pertama", 10),
    trk_muda: iv("jft_trk_muda", 1),
    trk_madya: iv("jft_trk_madya", 2),
  };
  jft.kanwil_total = jft.kanwil_pertama + jft.kanwil_muda + jft.kanwil_madya;
  jft.smr_total = jft.smr_apk + jft.smr_pertama + jft.smr_muda + jft.smr_madya;
  jft.bpp_total = jft.bpp_apk + jft.bpp_pertama + jft.bpp_muda + jft.bpp_madya;
  jft.trk_total = jft.trk_apk + jft.trk_pertama + jft.trk_muda + jft.trk_madya;
  jft.grand_total =
    jft.kanwil_total + jft.smr_total + jft.bpp_total + jft.trk_total;
  return jft;
}

function buildLaporan(smr, bpp, trk, jft, hari, pukul, nama, nip) {
  var zwj = "\u200E",
    out = "";
  out +=
    "Laporan Harian Data Pembimbing Kemasyarakatan dan Klien Balai Pemasyarakatan Wilayah Kalimantan Timur-Utara\n\n";
  out += "Yth.\nDirektur Pembimbingan Kemasyarakatan\n\n";
  out +=
    "Dari :\nKepala Bidang Pembimbingan Kemasyarakatan Kanwil Direktorat Jenderal Pemasyarakatan Kalimantan Timur\n\n";
  out +=
    "Tembusan :\nDirektur Jenderal Pemasyarakatan Kementerian Imigrasi dan Pemasyarakatan RI\n\n";
  out +=
    "Bersama ini kami sampaikan Laporan Harian Data Pembimbing Kemasyarakatan dan Klien Balai Pemasyarakatan Wilayah Kalimantan Timur-Utara pada \n";
  out += "Hari/Tgl\t: " + hari + "\nPukul   \t: " + pukul + "\n";
  out += "\nI.DATA JFT PK : " + jft.grand_total + " ORANG\n\n";
  out += "Kanwil Ditjenpas        \t: " + jft.kanwil_total + " orang\n";
  out += "•PK Pertama             \t: " + jft.kanwil_pertama + " orang\n";
  out += "•PK Muda                \t: " + jft.kanwil_muda + " orang\n";
  out += "•PK Madya               \t: " + jft.kanwil_madya + " orang\n";
  out += "Bapas Kelas I Samarinda \t: " + jft.smr_total + " orang\n";
  out +=
    "•APK                    \t: " +
    jft.smr_apk +
    " orang\n•PK Pertama             \t: " +
    jft.smr_pertama +
    " orang\n•PK Muda                \t: " +
    jft.smr_muda +
    " orang\n•PK Madya               \t: " +
    jft.smr_madya +
    " orang\n";
  out += "Bapas Kelas I Balikpapan\t: " + jft.bpp_total + " orang\n";
  out +=
    "•APK                    \t: " +
    jft.bpp_apk +
    " orang\n•PK Pertama             \t: " +
    jft.bpp_pertama +
    " orang\n•PK Muda                \t: " +
    jft.bpp_muda +
    " orang\n•PK Madya               \t: " +
    jft.bpp_madya +
    " orang\n";
  out += "Bapas Kelas II Tarakan  \t: " + jft.trk_total + " orang\n";
  out +=
    "•APK                    \t: " +
    jft.trk_apk +
    " orang\n•PK Pertama             \t: " +
    jft.trk_pertama +
    " orang\n•PK Muda                \t: " +
    jft.trk_muda +
    " orang\n•PK Madya               \t: " +
    jft.trk_madya +
    " orang\n";
  var smrDew = n(smr.dewasa),
    smrAnak = n(smr.anak),
    bppDew = n(bpp.dewasa),
    bppAnak = n(bpp.anak),
    trkDew = n(trk.dewasa),
    trkAnak = n(trk.anak);
  var totalDew = smrDew + bppDew + trkDew,
    totalAnak = smrAnak + bppAnak + trkAnak,
    totalKlien = totalDew + totalAnak;
  out += "\nII.DATA KLIEN :  " + fmt(totalKlien) + " ORANG\n";
  out +=
    zwj +
    "Bapas Kelas I Samarinda  : " +
    fmt(smrDew + smrAnak) +
    " orang\n•Dewasa\t\t:  " +
    fmt(smrDew) +
    " orang\n•Anak\t\t:  " +
    smrAnak +
    " orang\n\n";
  out +=
    zwj +
    "Bapas Kelas I Balikpapan : " +
    fmt(bppDew + bppAnak) +
    " orang\n•Dewasa\t\t:  " +
    fmt(bppDew) +
    " orang\n•Anak\t\t:  " +
    bppAnak +
    " orang\n\n";
  out +=
    zwj +
    "Bapas Kelas II Tarakan   :  " +
    fmt(trkDew + trkAnak) +
    " orang\n•Dewasa\t\t: " +
    fmt(trkDew) +
    " orang\n•Anak\t\t: " +
    trkAnak +
    " orang\n";
  out += "\nIII.PENELITIAN KEMASYARAKATAN\n\n";
  var units = [
    { label: "Bapas Kelas I Samarinda", data: smr },
    { label: "Bapas Kelas I Balikpapan", data: bpp },
    { label: "Bapas Kelas II Tarakan", data: trk },
  ];
  units.forEach(function (u) {
    out +=
      u.label +
      "\n•Permintaan Litmas\n1. Dewasa \t: " +
      n(u.data.litmas_dew_req) +
      " orang\n2. Anak \t: " +
      n(u.data.litmas_anak_req) +
      " orang\n* Penyelesaian Litmas\n1. Dewasa \t: " +
      n(u.data.litmas_dew_done) +
      " orang\n2. Anak \t: " +
      n(u.data.litmas_anak_done) +
      " orang\n\n";
  });
  out += "IV.KLIEN INTEGRASI DEWASA\n\n";
  units.forEach(function (u) {
    out +=
      u.label +
      "\n•Asimilasi \t: " +
      n(u.data.asim_dewasa) +
      " orang\n•PB            \t: " +
      fmt(n(u.data.pb_dewasa)) +
      " orang\n•CB            \t: " +
      n(u.data.cb_dewasa) +
      " orang\n•CMB         \t: " +
      n(u.data.cmb_dewasa) +
      " orang\n•CMK         \t: " +
      n(u.data.cmk_dewasa) +
      " orang\n•PiB           \t: " +
      n(u.data.pib_dewasa) +
      " orang\n\n";
  });
  out += "V.KLIEN INTEGRASI ANAK\n\n";
  units.forEach(function (u) {
    out +=
      u.label +
      "\n•Asimilasi \t: " +
      n(u.data.asim_anak) +
      " orang\n•PB            \t: " +
      n(u.data.pb_anak) +
      " orang\n•CB            \t: " +
      n(u.data.cb_anak) +
      " orang\n•CMB         \t: " +
      n(u.data.cmb_anak) +
      " orang\n•CMK         \t: " +
      n(u.data.cmk_anak) +
      " orang\n•PiB           \t: " +
      n(u.data.pib_anak) +
      " orang\n\n";
  });
  out += "VI. PENDAMPINGAN DIVERSI DAN PERADILAN\n\n";
  out +=
    zwj +
    "Bapas Kelas I Samarinda  : " +
    n(smr.diversi) +
    " orang\n" +
    zwj +
    "Bapas Kelas I Balikpapan : " +
    n(bpp.diversi) +
    " orang\n" +
    zwj +
    "Bapas Kelas II Tarakan   : " +
    n(trk.diversi) +
    " orang\n\n";
  out +=
    "VII. AKOT\n\n" +
    zwj +
    "Bapas Kelas I Samarinda  : " +
    n(smr.akot) +
    " orang\n" +
    zwj +
    "Bapas Kelas I Balikpapan : " +
    n(bpp.akot) +
    " orang\n" +
    zwj +
    "Bapas Kelas II Tarakan   : " +
    n(trk.akot) +
    " orang\n\n";
  out +=
    "VIII. PELATIHAN KERJA / LPKS\n\n" +
    zwj +
    "Bapas Kelas I Samarinda  : " +
    n(smr.latker) +
    " orang\n" +
    zwj +
    "Bapas Kelas I Balikpapan : " +
    n(bpp.latker) +
    " orang\n" +
    zwj +
    "Bapas Kelas II Tarakan   : " +
    n(trk.latker) +
    " orang\n\n";
  out +=
    "IX. KLIEN SEKOLAH\n\n" +
    zwj +
    "Bapas Kelas I Samarinda  : " +
    n(smr.sekolah) +
    " orang\n" +
    zwj +
    "Bapas Kelas I Balikpapan : " +
    n(bpp.sekolah) +
    " orang\n" +
    zwj +
    "Bapas Kelas II Tarakan   : " +
    n(trk.sekolah) +
    " orang\n\n";
  out +=
    "X. KLIEN BEKERJA\n\n" +
    zwj +
    "Bapas Kelas I Samarinda  : " +
    fmt(n(smr.bekerja)) +
    " orang\n" +
    zwj +
    "Bapas Kelas I Balikpapan : " +
    fmt(n(bpp.bekerja)) +
    " orang\n" +
    zwj +
    "Bapas Kelas II Tarakan   : " +
    fmt(n(trk.bekerja)) +
    " orang\n\n";
  out +=
    zwj +
    "XI. KLIEN TERORIS\n\n" +
    zwj +
    "Bapas Kelas I Samarinda  : " +
    n(smr.teroris) +
    " orang\n" +
    zwj +
    "Bapas Kelas I Balikpapan : " +
    n(bpp.teroris) +
    " orang\n" +
    zwj +
    "Bapas Kelas II Tarakan   : " +
    n(trk.teroris) +
    " orang\n\n";
  out +=
    zwj +
    "XII. KLIEN NARKOTIKA\n\n" +
    zwj +
    "Bapas Kelas I Samarinda  : " +
    fmt(n(smr.narkotika)) +
    " orang\n" +
    zwj +
    "Bapas Kelas I Balikpapan : " +
    fmt(n(bpp.narkotika)) +
    " orang\n" +
    zwj +
    "Bapas Kelas II Tarakan   : " +
    fmt(n(trk.narkotika)) +
    " orang\n\n";
  out +=
    zwj +
    "XIII. PENUTUP\n\n" +
    zwj +
    "Demikian laporan ini kami sampaikan, atas perhatian diucapkan terima kasih.\n\n";
  out +=
    "Kepala Bidang Pembimbingan Kemasyarakatan\n\n\nttd\n\n" +
    nama +
    "\nNIP. " +
    nip;
  return out;
}

/* ===== UPDATE TOTAL KLIEN AKTIF DI DASHBOARD ===== */
var _lastTotalKlien = 0;
try {
  var _saved = localStorage.getItem("totalKlienAktif");
  if (_saved) _lastTotalKlien = parseInt(_saved) || 0;
} catch (e) {}

function updateTotalKlienAktif(total) {
  if (total > 0) _lastTotalKlien = total;
  var display = _lastTotalKlien > 0 ? fmt(_lastTotalKlien) : "—";
  var elKlien = document.getElementById("ov-total-klien");
  var elKlienHero = document.getElementById("ov-total-klien-hero");
  if (elKlien) elKlien.textContent = display;
  if (elKlienHero) elKlienHero.textContent = display;
}

function generateLaporan() {
  var txtSmr = document.getElementById("txt-smr").value.trim();
  var txtBpp = document.getElementById("txt-bpp").value.trim();
  var txtTrk = document.getElementById("txt-trk").value.trim();
  var errEl = document.getElementById("err-msg");
  var missing = [];
  if (!txtSmr) missing.push("Bapas Kelas I Samarinda");
  if (!txtBpp) missing.push("Bapas Kelas I Balikpapan");
  if (!txtTrk) missing.push("Bapas Kelas II Tarakan");
  if (missing.length > 0) {
    errEl.textContent =
      "⚠ Semua laporan Bapas harus diisi. Belum terisi: " +
      missing.join(", ") +
      ".";
    errEl.style.display = "block";
    return;
  }
  errEl.style.display = "none";
  var smr = txtSmr ? parseReport(txtSmr) : {};
  var bpp = txtBpp ? parseReport(txtBpp) : {};
  var trk = txtTrk ? parseReport(txtTrk) : {};
  // Simpan ke state global untuk infografis & JFT infografis
  _parsedKlien.smr = { dewasa: n(smr.dewasa), anak: n(smr.anak) };
  _parsedKlien.bpp = { dewasa: n(bpp.dewasa), anak: n(bpp.anak) };
  _parsedKlien.trk = { dewasa: n(trk.dewasa), anak: n(trk.anak) };
  var jft = buildJft();
  var hari =
    document.getElementById("meta-hari").value.trim() || getTanggalHariIni();
  var pukul =
    document.getElementById("meta-pukul").value.trim() || "08.00 Wita";
  var nama =
    document.getElementById("meta-nama").value.trim() ||
    "Huzaifah Makmur Hidayah";
  var nip =
    document.getElementById("meta-nip").value.trim() || "197505241999021001";
  var result = buildLaporan(smr, bpp, trk, jft, hari, pukul, nama, nip);
  lastResult = result;
  document.getElementById("result-text").textContent = result;
  var ra = document.getElementById("result-area");
  ra.style.display = "block";
  laporan_count++;
  var _elLH = document.getElementById("ov-laporan-hari");
  if (_elLH) _elLH.textContent = laporan_count;

  // Hitung total klien
  var totalKlien =
    n(smr.dewasa) +
    n(smr.anak) +
    (n(bpp.dewasa) + n(bpp.anak)) +
    (n(trk.dewasa) + n(trk.anak));
  // Fallback dari teks laporan jika parse gagal
  if (totalKlien === 0) {
    var mTotal = result.match(/DATA KLIEN\s*:\s*([\d.,\s\u00a0]+?)\s*ORANG/i);
    if (mTotal) totalKlien = parseInt(mTotal[1].replace(/\D/g, ""), 10) || 0;
  }
  // Update dashboard — pola langsung sama seperti JFT
  if (totalKlien > 0) {
    _lastTotalKlien = totalKlien;
    try {
      localStorage.setItem("totalKlienAktif", totalKlien);
    } catch (e) {}
  }
  var _dispK = _lastTotalKlien > 0 ? fmt(_lastTotalKlien) : "—";
  var _elK = document.getElementById("ov-total-klien");
  var _elKH = document.getElementById("ov-total-klien-hero");
  if (_elK) _elK.textContent = _dispK;
  if (_elKH) _elKH.textContent = _dispK;

  syncInfTotalKlien();
  syncJftInfografisFromLaporan();

  // Auto-save ke laporan harian — per tanggal, kalau tanggal sama di-update
  var totalDew = n(smr.dewasa) + n(bpp.dewasa) + n(trk.dewasa);
  var totalAnak = n(smr.anak) + n(bpp.anak) + n(trk.anak);
  var existIdx = ARSIP_DB.findIndex(function (a) {
    return a.tanggal === hari;
  });
  if (existIdx >= 0) {
    ARSIP_DB[existIdx].dewasa = totalDew;
    ARSIP_DB[existIdx].anak = totalAnak;
    ARSIP_DB[existIdx].laporan = result;
  } else {
    var newId = ARSIP_DB.length
      ? Math.max.apply(
          null,
          ARSIP_DB.map(function (x) {
            return x.id;
          }),
        ) + 1
      : 1;
    ARSIP_DB.unshift({
      id: newId,
      tanggal: hari,
      dewasa: totalDew,
      anak: totalAnak,
      laporan: result,
    });
  }

  setTimeout(function () {
    ra.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 150);
  showToast("Laporan berhasil di-generate! ✓", "success");
  logActivity("Generate laporan harian oleh " + currentUser.nama);
}

function getTanggalHariIni() {
  var now = new Date();
  return (
    HARI_LIST[now.getDay()] +
    ", " +
    now.getDate() +
    " " +
    BULAN_LIST[now.getMonth() + 1] +
    " " +
    now.getFullYear()
  );
}

function clearAll() {
  ["smr", "bpp", "trk"].forEach(function (id) {
    var ta = document.getElementById("txt-" + id);
    if (ta) ta.value = "";
    updateBadge(id);
    var prev = document.getElementById("prev-" + id);
    if (prev) prev.classList.remove("show");
  });
  document.getElementById("result-area").style.display = "none";
  document.getElementById("err-msg").style.display = "none";
}

function copyResult() {
  var text = document.getElementById("result-text").textContent;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(function () {
        showToast("Laporan berhasil disalin! 📋", "success");
      })
      .catch(fallback);
  } else {
    fallback();
  }
  function fallback() {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0;";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      showToast("Laporan disalin!", "success");
    } catch (e) {}
    document.body.removeChild(ta);
  }
}

function saveToArsip() {
  if (currentRole !== "admin") {
    showToast("Hanya admin yang dapat menyimpan arsip.", "error");
    return;
  }
  showToast("Laporan disimpan ke arsip! ✓", "success");
  logActivity("Simpan laporan ke arsip oleh " + currentUser.nama);
}

/* ===== LAPORAN BULANAN — GDRIVE per Bapas ===== */
var FOLDER_KEYS = [
  "registrasi_litmas",
  "pengawasan",
  "pendampingan",
  "pembimbingan",
  "pelibatan",
  "infografis_profil",
];
var FOLDER_META = {
  registrasi_litmas: {
    label: "Registrasi &amp; Litmas",
    ico: "📋",
    bg: "#f0fdf4",
  },
  pengawasan: { label: "Pengawasan", ico: "📊", bg: "#eff6ff" },
  pendampingan: { label: "Pendampingan", ico: "⚖️", bg: "#fffbeb" },
  pembimbingan: { label: "Pembimbingan", ico: "👥", bg: "#fdf4ff" },
  pelibatan: { label: "Pelibatan Masyarakat", ico: "🔗", bg: "#fff1f2" },
  infografis_profil: {
    label: "Data Infografis Profil Bapas",
    ico: "📁",
    bg: "#f8fafc",
  },
};

/* Render folder list dinamis untuk satu Bapas */
function renderFolderList(unit) {
  var container = document.getElementById("folders-" + unit);
  if (!container) return;
  var links = DRIVE_LINKS[unit] || {};
  container.innerHTML = FOLDER_KEYS.map(function (k) {
    var m = FOLDER_META[k];
    var url = links[k] || "";
    if (url) {
      return (
        '<a class="lapbul-folder-row" href="' +
        url +
        '" target="_blank" rel="noopener noreferrer"' +
        " onclick=\"if(currentUser)logActivity('Buka " +
        k +
        " " +
        unit.toUpperCase() +
        " oleh '+currentUser.nama)\">" +
        '<div class="lapbul-folder-ico" style="background:' +
        m.bg +
        '">' +
        m.ico +
        "</div>" +
        '<div class="lapbul-folder-text"><div class="lapbul-folder-name">' +
        m.label +
        "</div>" +
        '<div class="lapbul-folder-ext">Excel · Bulanan</div></div>' +
        '<div class="lapbul-folder-arr">↗</div></a>'
      );
    } else {
      return (
        '<div class="lapbul-folder-row lapbul-folder-empty">' +
        '<div class="lapbul-folder-ico" style="background:#f1f5f9;opacity:.5">' +
        m.ico +
        "</div>" +
        '<div class="lapbul-folder-text"><div class="lapbul-folder-name" style="opacity:.5">' +
        m.label +
        "</div>" +
        '<div class="lapbul-folder-ext" style="color:#f59e0b">⚠ Link belum diatur</div></div>' +
        '<div class="lapbul-folder-arr" style="opacity:.3">—</div></div>'
      );
    }
  }).join("");
}

function renderAllFolderLists() {
  ["smr", "bpp", "trk"].forEach(renderFolderList);
}

/* Tab switching di modal */
var _activeDriveTab = "smr";
function switchDriveTab(unit) {
  _activeDriveTab = unit;
  ["smr", "bpp", "trk"].forEach(function (u) {
    var panel = document.getElementById("dtab-" + u);
    var btn = document.getElementById("dtab-btn-" + u);
    if (panel) panel.style.display = u === unit ? "" : "none";
    if (btn) {
      if (u === unit) btn.classList.add("dtab-active");
      else btn.classList.remove("dtab-active");
    }
  });
}

function openDriveLinkModal() {
  if (currentRole !== "admin") {
    showToast("Hanya admin yang dapat mengubah link Drive.", "error");
    return;
  }
  ["smr", "bpp", "trk"].forEach(function (unit) {
    FOLDER_KEYS.forEach(function (k) {
      var el = document.getElementById("di-" + unit + "-" + k);
      if (el) el.value = (DRIVE_LINKS[unit] && DRIVE_LINKS[unit][k]) || "";
    });
  });
  switchDriveTab("smr");
  openModal("modal-drive-link");
}

function saveDriveLinks() {
  ["smr", "bpp", "trk"].forEach(function (unit) {
    FOLDER_KEYS.forEach(function (k) {
      var el = document.getElementById("di-" + unit + "-" + k);
      if (el) DRIVE_LINKS[unit][k] = el.value.trim();
    });
  });
  renderAllFolderLists();
  closeModal("modal-drive-link");
  showToast("Link Google Drive semua Bapas berhasil diperbarui! ✓", "success");
  logActivity("Update link Drive oleh " + currentUser.nama);
}

/* Stub agar panggilan lama tidak error */
function updateAllDriveBtnState() {
  renderAllFolderLists();
}

/* ===== ARSIP ===== */
function renderArsip() {
  var list = document.getElementById("arsip-list");
  var empty = document.getElementById("arsip-empty");
  if (!list) return;
  var q = (
    (document.getElementById("search-arsip") &&
      document.getElementById("search-arsip").value) ||
    ""
  ).toLowerCase();
  var filtered = ARSIP_DB.filter(function (a) {
    return !q || (a.tanggal || "").toLowerCase().includes(q);
  });
  if (!filtered.length) {
    list.innerHTML = "";
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";
  list.innerHTML = filtered
    .map(function (a) {
      return (
        '<div class="arsip-card" onclick="viewArsip(' +
        a.id +
        ')">' +
        '<div class="arsip-month-badge">' +
        a.tanggal +
        "</div>" +
        "<h3>Laporan Harian</h3>" +
        '<div class="arsip-meta">' +
        '<span class="arsip-chip">👥 ' +
        fmt(a.dewasa) +
        " Dewasa</span>" +
        '<span class="arsip-chip">👦 ' +
        a.anak +
        " Anak</span>" +
        '<span class="arsip-chip">📊 ' +
        fmt(a.dewasa + a.anak) +
        " Total</span>" +
        "</div>" +
        '<div class="arsip-actions">' +
        '<button class="btn-accent" onclick="event.stopPropagation();viewArsip(' +
        a.id +
        ')">Lihat Detail</button>' +
        (currentRole === "admin"
          ? '<button class="btn-danger" onclick="event.stopPropagation();deleteArsip(' +
            a.id +
            ')">🗑</button>'
          : "") +
        "</div>" +
        "</div>"
      );
    })
    .join("");
}

function renderOvArsip() {
  var list = document.getElementById("ov-arsip-list");
  if (list) {
    var recent = ARSIP_DB.slice(0, 4);
    if (recent.length === 0) {
      list.innerHTML =
        '<div style="color:var(--text3);font-size:13px;padding:12px 0;">Belum ada laporan harian yang di-generate.</div>';
    } else {
      list.innerHTML = recent
        .map(function (a) {
          return (
            '<div class="arsip-card" onclick="goPage(\'laporan-harian\',null)" style="cursor:pointer;">' +
            '<div class="arsip-month-badge">' +
            a.tanggal +
            "</div>" +
            "<h3>Laporan Harian</h3>" +
            '<div class="arsip-meta">' +
            '<span class="arsip-chip">👥 ' +
            fmt(a.dewasa) +
            " Dewasa</span>" +
            '<span class="arsip-chip">👦 ' +
            a.anak +
            " Anak</span>" +
            '<span class="arsip-chip">📊 ' +
            fmt(a.dewasa + a.anak) +
            " Total</span>" +
            "</div>" +
            "</div>"
          );
        })
        .join("");
    }
  }
  var ovArsip = document.getElementById("ov-arsip");
  if (ovArsip) ovArsip.textContent = ARSIP_DB.length;
}

function viewArsip(id) {
  var a = ARSIP_DB.find((x) => x.id === id);
  if (!a) return;
  currentArsipDetail = a;
  document.getElementById("modal-arsip-title").textContent =
    "Detail Laporan — " + a.tanggal;
  document.getElementById("modal-arsip-body").innerHTML =
    '<div class="detail-section"><h4>Informasi Umum</h4>' +
    '<div class="detail-row"><span>Tanggal</span><span>' +
    a.tanggal +
    "</span></div>" +
    "</div>" +
    '<div class="detail-section"><h4>Data Klien</h4>' +
    '<div class="detail-row"><span>Klien Dewasa</span><span>' +
    fmt(a.dewasa) +
    " orang</span></div>" +
    '<div class="detail-row"><span>Klien Anak</span><span>' +
    a.anak +
    " orang</span></div>" +
    '<div class="detail-row"><span>Total Klien</span><span>' +
    fmt(a.dewasa + a.anak) +
    " orang</span></div>" +
    "</div>" +
    (a.laporan
      ? '<div class="detail-section"><h4>Teks Laporan</h4><pre style="font-size:11px;max-height:200px;overflow-y:auto;">' +
        escHtml(a.laporan) +
        "</pre></div>"
      : "");
  openModal("modal-arsip");
}

function copyArsipContent() {
  if (!currentArsipDetail) return;
  var a = currentArsipDetail;
  var text =
    a.laporan ||
    "Laporan Harian " +
      a.tanggal +
      "\nKlien Dewasa: " +
      fmt(a.dewasa) +
      "\nKlien Anak: " +
      a.anak +
      "\nTotal: " +
      fmt(a.dewasa + a.anak);
  navigator.clipboard && navigator.clipboard.writeText(text);
  showToast("Laporan disalin!", "success");
}

function deleteArsip(id) {
  if (!confirm("Hapus arsip ini?")) return;
  ARSIP_DB = ARSIP_DB.filter((x) => x.id !== id);
  renderArsip();
  renderOvArsip();
  showToast("Arsip dihapus.", "success");
  logActivity("Hapus arsip id=" + id + " oleh " + currentUser.nama);
}

function openAddArsipModal() {
  document.getElementById("modal-add-arsip") && openModal("modal-add-arsip");
}

function doAddArsip() {
  var b = document.getElementById("add-bulan").value;
  var t = parseInt(document.getElementById("add-tahun").value) || 2025;
  var d = parseInt(document.getElementById("add-dewasa").value) || 0;
  var a = parseInt(document.getElementById("add-anak").value) || 0;
  var c = document.getElementById("add-catatan").value;
  var l = document.getElementById("add-laporan-text").value;
  var newId = ARSIP_DB.length
    ? Math.max.apply(
        null,
        ARSIP_DB.map((x) => x.id),
      ) + 1
    : 1;
  ARSIP_DB.unshift({
    id: newId,
    bulan: b,
    tahun: t,
    bapas: "Semua",
    dewasa: d,
    anak: a,
    catatan: c,
    laporan: l,
  });
  closeModal("modal-add-arsip");
  renderArsip();
  renderOvArsip();
  showToast("Arsip berhasil ditambahkan! ✓", "success");
  logActivity("Tambah arsip " + b + " " + t + " oleh " + currentUser.nama);
}

/* ===== USERS ===== */
function renderUserTable() {
  var tbody = document.getElementById("user-table-body");
  if (!tbody) return;
  tbody.innerHTML = USERS_DB.map(function (u) {
    return (
      "<tr><td><code style=\"font-family:'DM Mono',monospace;font-size:12px;\">" +
      u.username +
      "</code></td>" +
      "<td>" +
      u.nama +
      "</td>" +
      '<td><span class="role-pill ' +
      u.role +
      '">' +
      u.role +
      "</span></td>" +
      '<td><span class="online-dot"></span>Aktif</td>' +
      '<td><button class="btn-danger" onclick="deleteUser(\'' +
      u.username +
      "')\">Hapus</button></td></tr>"
    );
  }).join("");
}

function openAddUserModal() {
  openModal("modal-add-user");
}

function doAddUser() {
  var un = document.getElementById("new-username").value.trim();
  var pw = document.getElementById("new-password").value;
  var nm = document.getElementById("new-nama").value.trim();
  var rl = document.getElementById("new-role").value;
  if (!un || !pw || !nm) {
    showToast("Semua field harus diisi.", "error");
    return;
  }
  if (USERS_DB.find((u) => u.username === un)) {
    showToast("Username sudah ada.", "error");
    return;
  }
  var nu = { username: un, password: pw, role: rl, nama: nm };
  USERS_DB.push(nu);
  ACCOUNTS.push(nu);
  closeModal("modal-add-user");
  renderUserTable();
  showToast("User " + un + " berhasil ditambahkan!", "success");
  logActivity("Tambah user " + un + " (" + rl + ") oleh " + currentUser.nama);
}

function deleteUser(username) {
  if (username === currentUser.username) {
    showToast("Tidak dapat menghapus akun sendiri.", "error");
    return;
  }
  if (!confirm("Hapus user " + username + "?")) return;
  USERS_DB = USERS_DB.filter((u) => u.username !== username);
  renderUserTable();
  showToast("User dihapus.", "success");
  logActivity("Hapus user " + username + " oleh " + currentUser.nama);
}

/* ===== ACTIVITY LOG ===== */
function logActivity(msg) {
  var now = new Date();
  var ts =
    "[" +
    now.getHours().toString().padStart(2, "0") +
    ":" +
    now.getMinutes().toString().padStart(2, "0") +
    "] ";
  activityLog.unshift(ts + msg);
  renderActivityLog();
}
function renderActivityLog() {
  var el = document.getElementById("activity-log");
  if (!el) return;
  el.innerHTML = activityLog.length
    ? activityLog
        .map(function (l) {
          return "<div>" + escHtml(l) + "</div>";
        })
        .join("")
    : '<div style="color:var(--text3);">Belum ada aktivitas.</div>';
}

/* ===== CHARTS — PER BAPAS (Dewasa & Anak masing-masing) ===== */
function getGenderData() {
  function iv(id) {
    var el = document.getElementById(id);
    return el ? parseInt(el.value) || 0 : 0;
  }
  return {
    smr: {
      dl: iv("g_smr_dl"),
      dp: iv("g_smr_dp"),
      al: iv("g_smr_al"),
      ap: iv("g_smr_ap"),
    },
    bpp: {
      dl: iv("g_bpp_dl"),
      dp: iv("g_bpp_dp"),
      al: iv("g_bpp_al"),
      ap: iv("g_bpp_ap"),
    },
    trk: {
      dl: iv("g_trk_dl"),
      dp: iv("g_trk_dp"),
      al: iv("g_trk_al"),
      ap: iv("g_trk_ap"),
    },
  };
}

function getJftData() {
  function iv(id) {
    var el = document.getElementById(id);
    return el ? parseInt(el.value) || 0 : 0;
  }
  return [
    iv("jft_kanwil_pertama") + iv("jft_kanwil_muda") + iv("jft_kanwil_madya"),
    iv("jft_smr_apk") +
      iv("jft_smr_pertama") +
      iv("jft_smr_muda") +
      iv("jft_smr_madya"),
    iv("jft_bpp_apk") +
      iv("jft_bpp_pertama") +
      iv("jft_bpp_muda") +
      iv("jft_bpp_madya"),
    iv("jft_trk_apk") +
      iv("jft_trk_pertama") +
      iv("jft_trk_muda") +
      iv("jft_trk_madya"),
  ];
}

function destroyChart(id) {
  if (charts[id]) {
    charts[id].destroy();
    delete charts[id];
  }
}

function initCharts() {
  var g = getGenderData();
  var jftVals = getJftData();

  var defaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: { size: 11, family: "Plus Jakarta Sans" },
          padding: 10,
          boxWidth: 12,
        },
      },
    },
  };

  /* ---- Bapas Samarinda: Dewasa & Anak ---- */
  destroyChart("smr-dewasa");
  charts["smr-dewasa"] = new Chart(
    document.getElementById("chart-smr-dewasa"),
    {
      type: "doughnut",
      data: {
        labels: ["Laki-laki", "Perempuan"],
        datasets: [
          {
            data: [g.smr.dl, g.smr.dp],
            backgroundColor: ["rgba(59,130,246,.9)", "rgba(244,114,182,.9)"],
            borderWidth: 0,
            hoverOffset: 5,
          },
        ],
      },
      options: {
        ...defaults,
        cutout: "62%",
        plugins: {
          ...defaults.plugins,
          title: {
            display: true,
            text: "Dewasa — " + (g.smr.dl + g.smr.dp) + " org",
            font: { size: 11 },
            color: "#475569",
            padding: { bottom: 4 },
          },
        },
      },
    },
  );

  destroyChart("smr-anak");
  charts["smr-anak"] = new Chart(document.getElementById("chart-smr-anak"), {
    type: "doughnut",
    data: {
      labels: ["Laki-laki", "Perempuan"],
      datasets: [
        {
          data: [g.smr.al, g.smr.ap],
          backgroundColor: ["rgba(16,185,129,.9)", "rgba(251,191,36,.9)"],
          borderWidth: 0,
          hoverOffset: 5,
        },
      ],
    },
    options: {
      ...defaults,
      cutout: "62%",
      plugins: {
        ...defaults.plugins,
        title: {
          display: true,
          text: "Anak — " + (g.smr.al + g.smr.ap) + " org",
          font: { size: 11 },
          color: "#475569",
          padding: { bottom: 4 },
        },
      },
    },
  });

  /* ---- Bapas Balikpapan: Dewasa & Anak ---- */
  destroyChart("bpp-dewasa");
  charts["bpp-dewasa"] = new Chart(
    document.getElementById("chart-bpp-dewasa"),
    {
      type: "doughnut",
      data: {
        labels: ["Laki-laki", "Perempuan"],
        datasets: [
          {
            data: [g.bpp.dl, g.bpp.dp],
            backgroundColor: ["rgba(245,158,11,.9)", "rgba(244,114,182,.9)"],
            borderWidth: 0,
            hoverOffset: 5,
          },
        ],
      },
      options: {
        ...defaults,
        cutout: "62%",
        plugins: {
          ...defaults.plugins,
          title: {
            display: true,
            text: "Dewasa — " + (g.bpp.dl + g.bpp.dp) + " org",
            font: { size: 11 },
            color: "#475569",
            padding: { bottom: 4 },
          },
        },
      },
    },
  );

  destroyChart("bpp-anak");
  charts["bpp-anak"] = new Chart(document.getElementById("chart-bpp-anak"), {
    type: "doughnut",
    data: {
      labels: ["Laki-laki", "Perempuan"],
      datasets: [
        {
          data: [g.bpp.al, g.bpp.ap],
          backgroundColor: ["rgba(249,115,22,.9)", "rgba(251,191,36,.9)"],
          borderWidth: 0,
          hoverOffset: 5,
        },
      ],
    },
    options: {
      ...defaults,
      cutout: "62%",
      plugins: {
        ...defaults.plugins,
        title: {
          display: true,
          text: "Anak — " + (g.bpp.al + g.bpp.ap) + " org",
          font: { size: 11 },
          color: "#475569",
          padding: { bottom: 4 },
        },
      },
    },
  });

  /* ---- Bapas Tarakan: Dewasa & Anak ---- */
  destroyChart("trk-dewasa");
  charts["trk-dewasa"] = new Chart(
    document.getElementById("chart-trk-dewasa"),
    {
      type: "doughnut",
      data: {
        labels: ["Laki-laki", "Perempuan"],
        datasets: [
          {
            data: [g.trk.dl, g.trk.dp],
            backgroundColor: ["rgba(139,92,246,.9)", "rgba(244,114,182,.9)"],
            borderWidth: 0,
            hoverOffset: 5,
          },
        ],
      },
      options: {
        ...defaults,
        cutout: "62%",
        plugins: {
          ...defaults.plugins,
          title: {
            display: true,
            text: "Dewasa — " + (g.trk.dl + g.trk.dp) + " org",
            font: { size: 11 },
            color: "#475569",
            padding: { bottom: 4 },
          },
        },
      },
    },
  );

  destroyChart("trk-anak");
  charts["trk-anak"] = new Chart(document.getElementById("chart-trk-anak"), {
    type: "doughnut",
    data: {
      labels: ["Laki-laki", "Perempuan"],
      datasets: [
        {
          data: [g.trk.al, g.trk.ap],
          backgroundColor: ["rgba(99,102,241,.9)", "rgba(251,191,36,.9)"],
          borderWidth: 0,
          hoverOffset: 5,
        },
      ],
    },
    options: {
      ...defaults,
      cutout: "62%",
      plugins: {
        ...defaults.plugins,
        title: {
          display: true,
          text: "Anak — " + (g.trk.al + g.trk.ap) + " org",
          font: { size: 11 },
          color: "#475569",
          padding: { bottom: 4 },
        },
      },
    },
  });

  /* ---- Bar gabungan Dewasa & Anak per Bapas ---- */
  destroyChart("klien-compare");
  var labels = ["Samarinda", "Balikpapan", "Tarakan"];
  charts["klien-compare"] = new Chart(
    document.getElementById("chart-klien-compare"),
    {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Klien Dewasa",
            data: [
              g.smr.dl + g.smr.dp,
              g.bpp.dl + g.bpp.dp,
              g.trk.dl + g.trk.dp,
            ],
            backgroundColor: "rgba(59,130,246,.85)",
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: "Klien Anak",
            data: [
              g.smr.al + g.smr.ap,
              g.bpp.al + g.bpp.ap,
              g.trk.al + g.trk.ap,
            ],
            backgroundColor: "rgba(16,185,129,.85)",
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: { size: 11, family: "Plus Jakarta Sans" },
              padding: 12,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(0,0,0,.05)" },
            ticks: { font: { size: 11 } },
          },
          x: { grid: { display: false } },
        },
      },
    },
  );

  /* ---- JFT compare (bar) ---- */
  destroyChart("jft-compare");
  charts["jft-compare"] = new Chart(
    document.getElementById("chart-jft-compare"),
    {
      type: "bar",
      data: {
        labels: ["Kanwil", "Samarinda", "Balikpapan", "Tarakan"],
        datasets: [
          {
            label: "Jumlah PK",
            data: jftVals,
            backgroundColor: [
              "rgba(13,37,64,.85)",
              "rgba(16,185,129,.85)",
              "rgba(245,158,11,.85)",
              "rgba(139,92,246,.85)",
            ],
            borderRadius: 7,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(0,0,0,.05)" },
            ticks: { font: { size: 11 } },
          },
        },
      },
    },
  );
}

function refreshInfografis() {
  syncOvJft();
  syncInfTotalKlien();
  initCharts();
  renderJftDoughnuts();
}

/* ===== TOTAL KLIEN INFOGRAFIS (dari hasil parse laporan harian) ===== */
// Data klien tersimpan setelah generate laporan
var _parsedKlien = {
  smr: { dewasa: 0, anak: 0 },
  bpp: { dewasa: 0, anak: 0 },
  trk: { dewasa: 0, anak: 0 },
};

function syncInfTotalKlien() {
  var d = _parsedKlien;
  var smrDew = n(d.smr.dewasa),
    smrAnak = n(d.smr.anak);
  var bppDew = n(d.bpp.dewasa),
    bppAnak = n(d.bpp.anak);
  var trkDew = n(d.trk.dewasa),
    trkAnak = n(d.trk.anak);
  var smrTot = smrDew + smrAnak,
    bppTot = bppDew + bppAnak,
    trkTot = trkDew + trkAnak;
  var grandDew = smrDew + bppDew + trkDew,
    grandAnak = smrAnak + bppAnak + trkAnak,
    grand = grandDew + grandAnak;
  function setEl(id, v) {
    var el = document.getElementById(id);
    if (el) el.textContent = grand > 0 ? fmt(v) : "—";
  }
  function setElSub(id, v) {
    var el = document.getElementById(id);
    if (el) el.textContent = grand > 0 ? fmt(v) : "—";
  }
  setEl("inf-total-smr", smrTot);
  setElSub("inf-total-smr-dew", smrDew);
  setElSub("inf-total-smr-anak", smrAnak);
  setEl("inf-total-bpp", bppTot);
  setElSub("inf-total-bpp-dew", bppDew);
  setElSub("inf-total-bpp-anak", bppAnak);
  setEl("inf-total-trk", trkTot);
  setElSub("inf-total-trk-dew", trkDew);
  setElSub("inf-total-trk-anak", trkAnak);
  setEl("inf-total-semua", grand);
  setElSub("inf-total-semua-dew", grandDew);
  setElSub("inf-total-semua-anak", grandAnak);
  renderKlienTotalCharts(
    smrDew,
    smrAnak,
    bppDew,
    bppAnak,
    trkDew,
    trkAnak,
    grand,
  );
  renderBapasDoughnuts(smrDew, smrAnak, bppDew, bppAnak, trkDew, trkAnak);
}

function renderBapasDoughnuts(
  smrDew,
  smrAnak,
  bppDew,
  bppAnak,
  trkDew,
  trkAnak,
) {
  var configs = [
    {
      id: "chart-inf-smr-doughnut",
      dew: smrDew,
      anak: smrAnak,
      lblDew: "lbl-inf-smr-dew",
      lblAnak: "lbl-inf-smr-anak",
      lblTotal: "lbl-inf-smr-total",
      colors: ["rgba(59,130,246,.9)", "rgba(16,185,129,.9)"],
    },
    {
      id: "chart-inf-bpp-doughnut",
      dew: bppDew,
      anak: bppAnak,
      lblDew: "lbl-inf-bpp-dew",
      lblAnak: "lbl-inf-bpp-anak",
      lblTotal: "lbl-inf-bpp-total",
      colors: ["rgba(245,158,11,.9)", "rgba(249,115,22,.9)"],
    },
    {
      id: "chart-inf-trk-doughnut",
      dew: trkDew,
      anak: trkAnak,
      lblDew: "lbl-inf-trk-dew",
      lblAnak: "lbl-inf-trk-anak",
      lblTotal: "lbl-inf-trk-total",
      colors: ["rgba(139,92,246,.9)", "rgba(99,102,241,.9)"],
    },
  ];
  configs.forEach(function (c) {
    destroyChart(c.id);
    var canvas = document.getElementById(c.id);
    if (!canvas) return;
    var total = c.dew + c.anak;
    var hasData = total > 0;
    var dLabel = document.getElementById(c.lblDew);
    if (dLabel) dLabel.textContent = hasData ? fmt(c.dew) : "—";
    var aLabel = document.getElementById(c.lblAnak);
    if (aLabel) aLabel.textContent = hasData ? fmt(c.anak) : "—";
    var tLabel = document.getElementById(c.lblTotal);
    if (tLabel) tLabel.textContent = hasData ? fmt(total) : "—";
    charts[c.id] = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: ["Klien Dewasa", "Klien Anak"],
        datasets: [
          {
            data: hasData ? [c.dew, c.anak] : [1, 1],
            backgroundColor: hasData
              ? c.colors
              : ["rgba(220,220,220,.4)", "rgba(220,220,220,.2)"],
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                if (!hasData) return "Belum ada data";
                var pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0;
                return (
                  ctx.label +
                  ": " +
                  Number(ctx.raw).toLocaleString("id-ID") +
                  " org (" +
                  pct +
                  "%)"
                );
              },
            },
          },
        },
      },
    });
  });
}

function renderJftDoughnuts() {
  function iv(id) {
    var el = document.getElementById(id);
    return el ? parseInt(el.value) || 0 : 0;
  }
  var kw =
    iv("jft_kanwil_pertama") + iv("jft_kanwil_muda") + iv("jft_kanwil_madya");
  var smr =
    iv("jft_smr_apk") +
    iv("jft_smr_pertama") +
    iv("jft_smr_muda") +
    iv("jft_smr_madya");
  var bpp =
    iv("jft_bpp_apk") +
    iv("jft_bpp_pertama") +
    iv("jft_bpp_muda") +
    iv("jft_bpp_madya");
  var trk =
    iv("jft_trk_apk") +
    iv("jft_trk_pertama") +
    iv("jft_trk_muda") +
    iv("jft_trk_madya");
  var grand = kw + smr + bpp + trk;
  var hasData = grand > 0;

  /* Isi angka legend kustom & center */
  function setLeg(id, v) {
    var el = document.getElementById(id);
    if (el) el.textContent = hasData ? v : "—";
  }
  setLeg("jft-leg-kw", kw);
  setLeg("jft-leg-smr", smr);
  setLeg("jft-leg-bpp", bpp);
  setLeg("jft-leg-trk", trk);
  setLeg("jft-leg-total", grand);
  var center = document.getElementById("jft-donut-center-val");
  if (center) center.textContent = hasData ? grand : "—";

  /* Donut per unit kerja */
  destroyChart("jft-donut-unit");
  var c1 = document.getElementById("chart-jft-donut-unit");
  if (c1) {
    charts["jft-donut-unit"] = new Chart(c1, {
      type: "doughnut",
      data: {
        labels: [
          "Kanwil",
          "Bapas Samarinda",
          "Bapas Balikpapan",
          "Bapas Tarakan",
        ],
        datasets: [
          {
            data: hasData ? [kw, smr, bpp, trk] : [1, 1, 1, 1],
            backgroundColor: hasData
              ? [
                  "rgba(13,37,64,.85)",
                  "rgba(16,185,129,.85)",
                  "rgba(245,158,11,.85)",
                  "rgba(139,92,246,.85)",
                ]
              : [
                  "rgba(220,220,220,.4)",
                  "rgba(220,220,220,.3)",
                  "rgba(220,220,220,.2)",
                  "rgba(220,220,220,.1)",
                ],
            borderWidth: 0,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                if (!hasData) return "Belum ada data";
                var pct = grand > 0 ? Math.round((ctx.raw / grand) * 100) : 0;
                return ctx.label + ": " + ctx.raw + " PK (" + pct + "%)";
              },
            },
          },
        },
      },
    });
  }
}

function renderKlienTotalCharts(
  smrDew,
  smrAnak,
  bppDew,
  bppAnak,
  trkDew,
  trkAnak,
  grand,
) {
  var labels = ["Bapas Samarinda", "Bapas Balikpapan", "Bapas Tarakan"];
  var dewData = [smrDew, bppDew, trkDew];
  var anakData = [smrAnak, bppAnak, trkAnak];
  var totData = [smrDew + smrAnak, bppDew + bppAnak, trkDew + trkAnak];
  var colors = [
    "rgba(59,130,246,.85)",
    "rgba(245,158,11,.85)",
    "rgba(139,92,246,.85)",
  ];

  /* Bar chart */
  destroyChart("klien-total-bar");
  var canvasBar = document.getElementById("chart-klien-total-bar");
  if (canvasBar) {
    charts["klien-total-bar"] = new Chart(canvasBar, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Klien Dewasa",
            data: dewData,
            backgroundColor: [
              "rgba(59,130,246,.8)",
              "rgba(245,158,11,.8)",
              "rgba(139,92,246,.8)",
            ],
            borderRadius: 7,
            borderSkipped: false,
          },
          {
            label: "Klien Anak",
            data: anakData,
            backgroundColor: [
              "rgba(96,165,250,.7)",
              "rgba(251,191,36,.7)",
              "rgba(196,181,253,.7)",
            ],
            borderRadius: 7,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: { size: 11, family: "Plus Jakarta Sans" },
              padding: 10,
              boxWidth: 12,
            },
          },
          tooltip: {
            callbacks: {
              label: function (c) {
                return (
                  c.dataset.label +
                  ": " +
                  Number(c.raw).toLocaleString("id-ID") +
                  " orang"
                );
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(0,0,0,.05)" },
            ticks: {
              font: { size: 11 },
              callback: function (v) {
                return Number(v).toLocaleString("id-ID");
              },
            },
          },
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
      },
    });
  }

  /* Donut total per Bapas */
  destroyChart("klien-total-donut");
  var canvasDon = document.getElementById("chart-klien-total-donut");
  if (canvasDon) {
    charts["klien-total-donut"] = new Chart(canvasDon, {
      type: "doughnut",
      data: {
        labels: ["Samarinda", "Balikpapan", "Tarakan"],
        datasets: [
          {
            data: totData,
            backgroundColor: colors,
            borderWidth: 2,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "58%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: { size: 11, family: "Plus Jakarta Sans" },
              padding: 10,
              boxWidth: 12,
            },
          },
          tooltip: {
            callbacks: {
              label: function (c) {
                var pct = grand > 0 ? Math.round((c.raw / grand) * 100) : 0;
                return (
                  c.label +
                  ": " +
                  Number(c.raw).toLocaleString("id-ID") +
                  " org (" +
                  pct +
                  "%)"
                );
              },
            },
          },
        },
      },
    });
  }
}

/* ===== JFT INFOGRAFIS (dari input JFT di Laporan Harian) ===== */
function syncJftInfografisFromLaporan() {
  // Ambil data langsung dari form JFT laporan harian
  function iv(id) {
    var el = document.getElementById(id);
    return el ? parseInt(el.value) || 0 : 0;
  }
  var kw =
    iv("jft_kanwil_pertama") + iv("jft_kanwil_muda") + iv("jft_kanwil_madya");
  var smr =
    iv("jft_smr_apk") +
    iv("jft_smr_pertama") +
    iv("jft_smr_muda") +
    iv("jft_smr_madya");
  var bpp =
    iv("jft_bpp_apk") +
    iv("jft_bpp_pertama") +
    iv("jft_bpp_muda") +
    iv("jft_bpp_madya");
  var trk =
    iv("jft_trk_apk") +
    iv("jft_trk_pertama") +
    iv("jft_trk_muda") +
    iv("jft_trk_madya");
  var grand = kw + smr + bpp + trk;
  function setEl(id, v) {
    var el = document.getElementById(id);
    if (el) el.textContent = v;
  }
  setEl("inf-jft-kanwil", kw);
  setEl("inf-jft-smr", smr);
  setEl("inf-jft-bpp", bpp);
  setEl("inf-jft-trk", trk);
  setEl("inf-jft-total", grand);
  // bars Kanwil
  var kwp = iv("jft_kanwil_pertama"),
    kwm = iv("jft_kanwil_muda"),
    kwma = iv("jft_kanwil_madya");
  setBar("inf-kw-1", kwp, "inf-kw-bar1", kwp, kw || 1);
  setBar("inf-kw-2", kwm, "inf-kw-bar2", kwm, kw || 1);
  setBar("inf-kw-3", kwma, "inf-kw-bar3", kwma, kw || 1);
  // Samarinda
  var sa = iv("jft_smr_apk"),
    sp = iv("jft_smr_pertama"),
    sm = iv("jft_smr_muda"),
    sma = iv("jft_smr_madya");
  setBar("inf-smr-0", sa, "inf-smr-bar0", sa, smr || 1);
  setBar("inf-smr-1", sp, "inf-smr-bar1", sp, smr || 1);
  setBar("inf-smr-2", sm, "inf-smr-bar2", sm, smr || 1);
  setBar("inf-smr-3", sma, "inf-smr-bar3", sma, smr || 1);
  // Balikpapan
  var ba = iv("jft_bpp_apk"),
    bp = iv("jft_bpp_pertama"),
    bm = iv("jft_bpp_muda"),
    bma = iv("jft_bpp_madya");
  setBar("inf-bpp-0", ba, "inf-bpp-bar0", ba, bpp || 1);
  setBar("inf-bpp-1", bp, "inf-bpp-bar1", bp, bpp || 1);
  setBar("inf-bpp-2", bm, "inf-bpp-bar2", bm, bpp || 1);
  setBar("inf-bpp-3", bma, "inf-bpp-bar3", bma, bpp || 1);
  // Tarakan
  var ta = iv("jft_trk_apk"),
    tp = iv("jft_trk_pertama"),
    tm = iv("jft_trk_muda"),
    tma = iv("jft_trk_madya");
  setBar("inf-trk-0", ta, "inf-trk-bar0", ta, trk || 1);
  setBar("inf-trk-1", tp, "inf-trk-bar1", tp, trk || 1);
  setBar("inf-trk-2", tm, "inf-trk-bar2", tm, trk || 1);
  setBar("inf-trk-3", tma, "inf-trk-bar3", tma, trk || 1);
  // rebuild chart
  if (charts["jft-compare"]) {
    charts["jft-compare"].destroy();
    delete charts["jft-compare"];
  }
  var canvas = document.getElementById("chart-jft-compare");
  if (canvas) {
    charts["jft-compare"] = new Chart(canvas, {
      type: "bar",
      data: {
        labels: ["Kanwil", "Samarinda", "Balikpapan", "Tarakan"],
        datasets: [
          {
            label: "Jumlah PK",
            data: [kw, smr, bpp, trk],
            backgroundColor: [
              "rgba(13,37,64,.85)",
              "rgba(16,185,129,.85)",
              "rgba(245,158,11,.85)",
              "rgba(139,92,246,.85)",
            ],
            borderRadius: 7,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(0,0,0,.05)" },
            ticks: { font: { size: 11 } },
          },
        },
      },
    });
  }
  renderJftDoughnuts();
}

function refreshJftInfografis() {
  syncJftInfografisFromLaporan();
  showToast("Data JFT diperbarui dari Laporan Harian ✓", "success");
}
/* ===== PROFIL ===== */
var profilFotoData = null; // base64 foto profil sementara

function openProfilModal() {
  var u = currentUser;
  if (!u) return;
  document.getElementById("profil-nama-input").value = u.nama;
  document.getElementById("profil-username-display").value = u.username;
  // tampilkan foto atau inisial
  var preview = document.getElementById("profil-preview");
  var initial = document.getElementById("profil-preview-initial");
  profilFotoData = u.foto || null;
  if (u.foto) {
    preview.style.backgroundImage = "url(" + u.foto + ")";
    preview.style.backgroundSize = "cover";
    preview.style.backgroundPosition = "center";
    initial.style.display = "none";
  } else {
    preview.style.backgroundImage = "";
    initial.style.display = "";
    initial.textContent = u.nama[0].toUpperCase();
  }
  openModal("modal-profil");
}

function previewFotoProfil(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  var reader = new FileReader();
  reader.onload = function (e) {
    profilFotoData = e.target.result;
    var preview = document.getElementById("profil-preview");
    var initial = document.getElementById("profil-preview-initial");
    preview.style.backgroundImage = "url(" + profilFotoData + ")";
    preview.style.backgroundSize = "cover";
    preview.style.backgroundPosition = "center";
    initial.style.display = "none";
  };
  reader.readAsDataURL(file);
}

function saveProfil() {
  var namaBaru = document.getElementById("profil-nama-input").value.trim();
  if (!namaBaru) {
    showToast("Nama tidak boleh kosong", "error");
    return;
  }
  currentUser.nama = namaBaru;
  if (profilFotoData) currentUser.foto = profilFotoData;
  // Update di ACCOUNTS & USERS_DB
  var acc = ACCOUNTS.find(function (a) {
    return a.username === currentUser.username;
  });
  if (acc) {
    acc.nama = namaBaru;
    if (profilFotoData) acc.foto = profilFotoData;
  }
  var dbu = USERS_DB.find(function (a) {
    return a.username === currentUser.username;
  });
  if (dbu) {
    dbu.nama = namaBaru;
    if (profilFotoData) dbu.foto = profilFotoData;
  }
  setupUserUI();
  closeModal("modal-profil");
  showToast("Profil berhasil diperbarui ✓", "success");
  logActivity("Edit profil: " + namaBaru);
}

function openModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add("open");
}
function closeModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove("open");
}
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("modal-overlay"))
    e.target.classList.remove("open");
});

/* ===== TOAST ===== */
var toastTimer;
function showToast(msg, type) {
  var el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast " + (type || "");
  clearTimeout(toastTimer);
  setTimeout(function () {
    el.classList.add("show");
  }, 10);
  toastTimer = setTimeout(function () {
    el.classList.remove("show");
  }, 3200);
}

/* ===== RESTORE SESSION (agar tidak balik login saat back/refresh) ===== */
(function restoreSession() {
  try {
    var saved = localStorage.getItem("dashSession");
    if (!saved) return;
    var sess = JSON.parse(saved);
    var acc = ACCOUNTS.find(function (a) {
      return a.username === sess.username && a.role === sess.role;
    });
    if (!acc) {
      localStorage.removeItem("dashSession");
      return;
    }
    currentUser = acc;
    currentRole = acc.role;
    document.getElementById("login-screen").style.display = "none";
    var app = document.getElementById("app");
    app.style.display = "flex";
    app.classList.add("ready");
    if (currentRole === "admin") {
      app.classList.add("is-admin");
      app.classList.remove("is-bapas");
    } else if (currentRole === "bapas") {
      app.classList.add("is-bapas");
      app.classList.remove("is-admin");
    } else {
      app.classList.remove("is-admin");
      app.classList.remove("is-bapas");
    }
    setupUserUI();
    initApp();
  } catch (e) {
    try {
      localStorage.removeItem("dashSession");
    } catch (e2) {}
  }
})();

/* ===== BROWSER BACK/FORWARD NAVIGATION ===== */
window.addEventListener("popstate", function (e) {
  if (!currentUser) return; // belum login, biarkan browser handle
  var pageId = e.state && e.state.page ? e.state.page : "dashboard";
  goPage(pageId, null, true); // skipHistory=true agar tidak double-push
});

/* ===================================================================
   SISTEM LAPORAN HARIAN BAPAS — Firebase Realtime Database
   Data dikirim Bapas → tersimpan di Firebase → Admin baca real-time
   =================================================================== */

/* ===== FIREBASE CONFIG =====
   Ganti nilai di bawah dengan config Firebase project Anda.
   Cara: https://console.firebase.google.com → Project Settings → Web App
   ============================= */
var FIREBASE_CONFIG = {
  apiKey: "AIzaSyBEdez7MY1SbWAP38xnbjXH3UvpByVSZK8",
  authDomain: "pkkaltim-fd817.firebaseapp.com",
  databaseURL:
    "https://pkkaltim-fd817-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pkkaltim-fd817",
  storageBucket: "pkkaltim-fd817.firebasestorage.app",
  messagingSenderId: "625690499874",
  appId: "1:625690499874:web:ae2c7144337d48daed237b",
};

/* ===== FIREBASE INIT ===== */
var _fbApp = null;
var _fbDb = null;
var _fbReady = false;
var _fbListenerUnsubscribe = null;

function initFirebase() {
  try {
    if (typeof firebase === "undefined") {
      console.warn("[Firebase] SDK belum dimuat. Pastikan script Firebase ada di index.html");
      showFirebaseError("Firebase SDK tidak ditemukan. Periksa koneksi internet.");
      _updateAdminStatusOffline("Firebase SDK tidak ditemukan. Periksa koneksi internet.");
      return;
    }
    if (!_fbApp) {
      _fbApp = firebase.initializeApp(FIREBASE_CONFIG);
    }
    _fbDb = firebase.database();
    _fbReady = true;
    console.log("[Firebase] Terhubung ✓");
    // Langsung jalankan listener admin jika sudah login sebagai admin
    if (currentRole === "admin") {
      startAdminRealtimeListener();
    }
  } catch (e) {
    console.error("[Firebase] Gagal init:", e);
    showFirebaseError("Gagal terhubung ke Firebase: " + e.message);
    _updateAdminStatusOffline("Gagal terhubung ke Firebase: " + e.message);
  }
}

function _updateAdminStatusOffline(msg) {
  var statusEl = document.getElementById("admin-bapas-status");
  if (statusEl) {
    statusEl.innerHTML = '<div style="color:#ef4444;font-size:13px;padding:8px 0;">⚠ ' + (msg || "Tidak dapat terhubung ke server.") + '</div>';
  }
}

function showFirebaseError(msg) {
  var el = document.getElementById("firebase-status");
  if (el) {
    el.textContent = "⚠ " + msg;
    el.style.display = "block";
    el.className = "firebase-err";
  }
}
function showFirebaseOk(msg) {
  var el = document.getElementById("firebase-status");
  if (el) {
    el.textContent = "✅ " + msg;
    el.style.display = "block";
    el.className = "firebase-ok";
  }
}

/* ===== PATH HELPER ===== */
function getTanggalIso() {
  var now = new Date();
  return (
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0")
  );
}

function bapasPath(unit, tanggal) {
  // Firebase path: /laporan_harian/2025-05-12/smr
  return "laporan_harian/" + tanggal + "/" + unit;
}

/* ===== SIMPAN DATA BAPAS KE FIREBASE ===== */
function saveBapasLaporan(unit, tanggal, data, onSuccess, onError) {
  if (!_fbReady || !_fbDb) {
    if (onError) onError("Firebase belum siap.");
    return;
  }
  var payload = {
    unit: unit,
    tanggal: tanggal,
    data: data,
    submittedAt: new Date().toISOString(),
    submittedBy: currentUser ? currentUser.nama : unit,
  };
  _fbDb
    .ref(bapasPath(unit, tanggal))
    .set(payload)
    .then(function () {
      if (onSuccess) onSuccess(payload);
    })
    .catch(function (e) {
      if (onError) onError(e.message || e);
    });
}

/* ===== BACA SEKALI (untuk render awal) ===== */
function loadBapasLaporan(unit, tanggal, callback) {
  if (!_fbReady || !_fbDb) {
    if (callback) callback(null);
    return;
  }
  _fbDb
    .ref(bapasPath(unit, tanggal))
    .once("value")
    .then(function (snap) {
      if (callback) callback(snap.val());
    })
    .catch(function () {
      if (callback) callback(null);
    });
}

function loadAllBapasData(tanggal, callback) {
  if (!_fbReady || !_fbDb) {
    if (callback) callback({ smr: null, bpp: null, trk: null });
    return;
  }
  _fbDb
    .ref("laporan_harian/" + tanggal)
    .once("value")
    .then(function (snap) {
      var val = snap.val() || {};
      if (callback)
        callback({
          smr: val.smr || null,
          bpp: val.bpp || null,
          trk: val.trk || null,
        });
    })
    .catch(function () {
      if (callback) callback({ smr: null, bpp: null, trk: null });
    });
}

/* ===== SYNC DASHBOARD DARI DATA BAPAS (Firebase) =====
   Dipanggil setiap kali data masuk dari masing-masing unit Bapas.
   Memperbarui: total klien, JFT per unit, dan chart dashboard.
   ======================================================= */
function syncDashboardFromBapasData(all) {
  // --- 1. Total Klien dari input tiap Bapas ---
  function getNum(rec, key) {
    return rec && rec.data && rec.data[key] ? parseInt(rec.data[key]) || 0 : 0;
  }

  var smrDew  = getNum(all.smr, "dewasa");
  var smrAnak = getNum(all.smr, "anak");
  var bppDew  = getNum(all.bpp, "dewasa");
  var bppAnak = getNum(all.bpp, "anak");
  var trkDew  = getNum(all.trk, "dewasa");
  var trkAnak = getNum(all.trk, "anak");

  var totalKlien = smrDew + smrAnak + bppDew + bppAnak + trkDew + trkAnak;

  if (totalKlien > 0) {
    _lastTotalKlien = totalKlien;
    try { localStorage.setItem("totalKlienAktif", totalKlien); } catch(e) {}
    var dispK = fmt(totalKlien);
    var elK   = document.getElementById("ov-total-klien");
    var elKH  = document.getElementById("ov-total-klien-hero");
    if (elK)  elK.textContent  = dispK;
    if (elKH) elKH.textContent = dispK;
  }

  // Simpan ke _parsedKlien agar infografis juga bisa sync
  _parsedKlien.smr = { dewasa: smrDew, anak: smrAnak };
  _parsedKlien.bpp = { dewasa: bppDew, anak: bppAnak };
  _parsedKlien.trk = { dewasa: trkDew, anak: trkAnak };

  // --- 2. JFT tiap unit dari input Bapas ---
  function getJft(rec) {
    if (!rec || !rec.data) return 0;
    var d = rec.data;
    return (parseInt(d.jft_apk)     || 0) +
           (parseInt(d.jft_pertama) || 0) +
           (parseInt(d.jft_muda)    || 0) +
           (parseInt(d.jft_madya)   || 0);
  }

  var jftSmr = getJft(all.smr);
  var jftBpp = getJft(all.bpp);
  var jftTrk = getJft(all.trk);

  // Baca JFT Kanwil dari input lokal (tetap diisi manual oleh Kanwil)
  function iv(id) {
    var el = document.getElementById(id);
    return el ? parseInt(el.value) || 0 : 0;
  }
  var jftKanwil = iv("jft_kanwil_pertama") + iv("jft_kanwil_muda") + iv("jft_kanwil_madya");

  // Update card JFT di dashboard overview
  var ov = {
    "ov-jft-kanwil": jftKanwil,
    "ov-jft-smr":    jftSmr,
    "ov-jft-bpp":    jftBpp,
    "ov-jft-trk":    jftTrk,
    "ov-total-jft":  jftKanwil + jftSmr + jftBpp + jftTrk,
    "ov-total-jft-hero": jftKanwil + jftSmr + jftBpp + jftTrk,
  };
  Object.keys(ov).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = ov[id];
  });

  // Update input tersembunyi JFT Bapas agar syncOvJft() konsisten jika dipanggil lagi
  function setInputVal(id, val) {
    var el = document.getElementById(id);
    if (el) el.value = val;
  }
  if (all.smr && all.smr.data) {
    var sd = all.smr.data;
    setInputVal("jft_smr_apk",     sd.jft_apk     || 0);
    setInputVal("jft_smr_pertama", sd.jft_pertama  || 0);
    setInputVal("jft_smr_muda",    sd.jft_muda     || 0);
    setInputVal("jft_smr_madya",   sd.jft_madya    || 0);
  }
  if (all.bpp && all.bpp.data) {
    var bd = all.bpp.data;
    setInputVal("jft_bpp_apk",     bd.jft_apk     || 0);
    setInputVal("jft_bpp_pertama", bd.jft_pertama  || 0);
    setInputVal("jft_bpp_muda",    bd.jft_muda     || 0);
    setInputVal("jft_bpp_madya",   bd.jft_madya    || 0);
  }
  if (all.trk && all.trk.data) {
    var td = all.trk.data;
    setInputVal("jft_trk_apk",     td.jft_apk     || 0);
    setInputVal("jft_trk_pertama", td.jft_pertama  || 0);
    setInputVal("jft_trk_muda",    td.jft_muda     || 0);
    setInputVal("jft_trk_madya",   td.jft_madya    || 0);
  }

  console.log("[Dashboard] Sync dari data Bapas: klien=" + totalKlien +
    " | JFT SMR=" + jftSmr + " BPP=" + jftBpp + " TRK=" + jftTrk);
}

/* ===== REAL-TIME LISTENER (admin) ===== */
function startAdminRealtimeListener() {
  if (!_fbReady || !_fbDb) {
    var statusEl = document.getElementById("admin-bapas-status");
    if (statusEl) {
      statusEl.innerHTML = '<div style="color:#f59e0b;font-size:13px;padding:8px 0;">⚠ Gagal terhubung ke server. Pastikan koneksi internet aktif lalu refresh halaman.</div>';
    }
    return;
  }
  stopAdminRealtimeListener();
  var tanggal = getTanggalIso();
  var ref = _fbDb.ref("laporan_harian/" + tanggal);
  _fbListenerUnsubscribe = ref.on(
    "value",
    function (snap) {
      var val = snap.val() || {};
      var all = {
        smr: val.smr || null,
        bpp: val.bpp || null,
        trk: val.trk || null,
      };
      _renderAdminRekapFromData(all);
      _renderAdminStatusFromData(all);
      updateAdminBadgeCountFromData(all);
      // ✅ Sync dashboard (total klien & JFT tiap unit) dari input masing-masing Bapas
      syncDashboardFromBapasData(all);
    },
    function (err) {
      console.error("[Firebase] Listener error:", err);
    },
  );
}

function stopAdminRealtimeListener() {
  if (_fbListenerUnsubscribe && _fbDb) {
    try {
      var tanggal = getTanggalIso();
      _fbDb
        .ref("laporan_harian/" + tanggal)
        .off("value", _fbListenerUnsubscribe);
    } catch (e) {}
    _fbListenerUnsubscribe = null;
  }
}

/* ===== RENDER FORM BAPAS ===== */
function renderBapasInputForm() {
  var u = currentUser;
  if (!u || u.role !== "bapas") return;
  var unit = u.unit;
  var unitLabel = u.unitLabel;
  var container = document.getElementById("bapas-form-container");
  if (!container) return;

  var tanggal = getTanggalIso();
  var hari = document.getElementById("meta-hari")
    ? document.getElementById("meta-hari").value
    : getTanggalHariIni();
  var colorMap = { smr: "#2563eb", bpp: "#d97706", trk: "#7c3aed" };
  var color = colorMap[unit] || "#2563eb";

  var fields = [
    {
      group: "DATA JFT PK",
      items: [
        { key: "jft_apk", label: "APK" },
        { key: "jft_pertama", label: "PK Pertama" },
        { key: "jft_muda", label: "PK Muda" },
        { key: "jft_madya", label: "PK Madya" },
      ],
    },
    {
      group: "KLIEN DEWASA",
      items: [
        { key: "dewasa", label: "Jumlah Klien Dewasa" },
        { key: "pb_dewasa", label: "PB Dewasa" },
        { key: "cb_dewasa", label: "CB Dewasa" },
        { key: "cmb_dewasa", label: "CMB Dewasa" },
        { key: "cmk_dewasa", label: "CMK Dewasa" },
        { key: "asim_dewasa", label: "Asimilasi Dewasa" },
        { key: "pib_dewasa", label: "PiB Dewasa" },
        { key: "bekerja", label: "Klien Bekerja" },
        { key: "narkotika_dewasa", label: "Narkotika (Dewasa)" },
        { key: "teroris_dewasa", label: "Teroris (Dewasa)" },
      ],
    },
    {
      group: "LITMAS DEWASA",
      items: [
        { key: "litmas_dew_req", label: "Permintaan Litmas Dewasa" },
        { key: "litmas_dew_done", label: "Penyelesaian Litmas Dewasa" },
      ],
    },
    {
      group: "KLIEN ANAK",
      items: [
        { key: "anak", label: "Jumlah Klien Anak" },
        { key: "pb_anak", label: "PB Anak" },
        { key: "cb_anak", label: "CB Anak" },
        { key: "cmb_anak", label: "CMB Anak" },
        { key: "cmk_anak", label: "CMK Anak" },
        { key: "asim_anak", label: "Asimilasi Anak" },
        { key: "pib_anak", label: "PiB Anak" },
        { key: "akot", label: "AKOT" },
        { key: "diversi", label: "Diversi" },
        { key: "sekolah", label: "Klien Anak Sekolah" },
        { key: "latker", label: "LPKS / Latker" },
        { key: "narkotika_anak", label: "Narkotika (Anak)" },
        { key: "teroris_anak", label: "Teroris (Anak)" },
      ],
    },
    {
      group: "LITMAS ANAK",
      items: [
        { key: "litmas_anak_req", label: "Permintaan Litmas Anak" },
        { key: "litmas_anak_done", label: "Penyelesaian Litmas Anak" },
      ],
    },
  ];

  // Load existing data from Firebase, then render
  container.innerHTML =
    '<div class="bapas-loading">⏳ Memuat data dari server...</div>';
  loadBapasLaporan(unit, tanggal, function (existing) {
    var d = existing && existing.data ? existing.data : {};

    var statusHtml = "";
    if (existing) {
      var sat = new Date(existing.submittedAt);
      statusHtml =
        '<div class="bapas-status-ok">✅ Data sudah dikirim ke Admin Kanwil pada ' +
        sat.toLocaleString("id-ID") +
        ". Anda masih bisa memperbarui data hari ini.</div>";
    } else {
      statusHtml =
        '<div class="bapas-status-pending">⏳ Belum ada data yang dikirim hari ini. Isi form di bawah lalu tekan <strong>Kirim ke Admin</strong>.</div>';
    }

    var formHtml =
      '<div class="bapas-form-header" style="border-left:4px solid ' +
      color +
      '">' +
      '<div class="bapas-form-unit-badge" style="background:' +
      color +
      '">' +
      unitLabel +
      "</div>" +
      '<div class="bapas-form-date">📅 ' +
      hari +
      "</div>" +
      "</div>" +
      statusHtml;

    fields.forEach(function (grp) {
      formHtml +=
        '<div class="bapas-group"><div class="bapas-group-title">' +
        grp.group +
        '</div><div class="bapas-field-grid">';
      grp.items.forEach(function (item) {
        var val = d[item.key] !== undefined ? d[item.key] : 0;
        formHtml +=
          '<div class="bapas-field">' +
          "<label>" +
          item.label +
          "</label>" +
          '<input type="number" min="0" id="bf_' +
          item.key +
          '" value="' +
          val +
          '">' +
          "</div>";
      });
      formHtml += "</div></div>";
    });

    formHtml +=
      '<div class="bapas-form-actions">' +
      '<button class="btn-primary" onclick="submitBapasLaporan()">📤 Kirim ke Admin Kanwil</button>' +
      '<button class="btn-secondary" onclick="resetBapasForm()">🔄 Reset Form</button>' +
      "</div>" +
      '<div class="bapas-err" id="bapas-err" style="display:none"></div>';

    container.innerHTML = formHtml;
  });
}

function getBapasFormData() {
  var keys = [
    "jft_apk",
    "jft_pertama",
    "jft_muda",
    "jft_madya",
    "dewasa",
    "pb_dewasa",
    "cb_dewasa",
    "cmb_dewasa",
    "cmk_dewasa",
    "asim_dewasa",
    "pib_dewasa",
    "bekerja",
    "narkotika_dewasa",
    "teroris_dewasa",
    "litmas_dew_req",
    "litmas_dew_done",
    "anak",
    "pb_anak",
    "cb_anak",
    "cmb_anak",
    "cmk_anak",
    "asim_anak",
    "pib_anak",
    "akot",
    "diversi",
    "sekolah",
    "latker",
    "narkotika_anak",
    "teroris_anak",
    "litmas_anak_req",
    "litmas_anak_done",
  ];
  var d = {};
  keys.forEach(function (k) {
    var el = document.getElementById("bf_" + k);
    d[k] = el ? parseInt(el.value) || 0 : 0;
  });
  return d;
}

function submitBapasLaporan() {
  var u = currentUser;
  if (!u || u.role !== "bapas") return;
  if (!_fbReady) {
    showToast("Koneksi Firebase belum siap. Tunggu sebentar.", "error");
    return;
  }
  var tanggal = getTanggalIso();
  var hariTanggal = document.getElementById("meta-hari")
    ? document.getElementById("meta-hari").value
    : getTanggalHariIni();
  var data = getBapasFormData();
  data.hariTanggal = hariTanggal;

  if ((data.dewasa || 0) + (data.anak || 0) === 0) {
    var errEl = document.getElementById("bapas-err");
    if (errEl) {
      errEl.textContent =
        "⚠ Mohon isi minimal data Klien Dewasa atau Klien Anak.";
      errEl.style.display = "block";
    }
    return;
  }

  var btn = document.querySelector("#bapas-form-container .btn-primary");
  if (btn) {
    btn.textContent = "⏳ Mengirim...";
    btn.disabled = true;
  }

  saveBapasLaporan(
    u.unit,
    tanggal,
    data,
    function (payload) {
      showToast("✅ Data berhasil dikirim ke Admin Kanwil!", "success");
      logActivity("Submit laporan harian oleh " + u.nama);
      // Sync dashboard dengan data yang baru dikirim (berlaku untuk role bapas)
      var _syncAll = { smr: null, bpp: null, trk: null };
      _syncAll[u.unit] = payload;
      syncDashboardFromBapasData(_syncAll);
      renderBapasInputForm();
    },
    function (errMsg) {
      showToast("Gagal kirim: " + errMsg, "error");
      if (btn) {
        btn.textContent = "📤 Kirim ke Admin Kanwil";
        btn.disabled = false;
      }
    },
  );
}

function resetBapasForm() {
  if (!confirm("Reset semua nilai form ke 0?")) return;
  var inputs = document.querySelectorAll(
    "#bapas-form-container input[type=number]",
  );
  inputs.forEach(function (el) {
    el.value = 0;
  });
  showToast("Form direset.", "success");
}

/* ===== ADMIN — Badge & Status ===== */
function updateAdminBadgeCount() {
  var tanggal = getTanggalIso();
  loadAllBapasData(tanggal, function (all) {
    updateAdminBadgeCountFromData(all);
  });
}

function updateAdminBadgeCountFromData(all) {
  var count = (all.smr ? 1 : 0) + (all.bpp ? 1 : 0) + (all.trk ? 1 : 0);
  var badge = document.getElementById("bapas-submit-badge");
  if (badge) {
    badge.textContent = count + "/3";
    badge.className =
      "bapas-count-badge " +
      (count === 3 ? "full" : count > 0 ? "partial" : "");
  }
}

function _renderAdminStatusFromData(all) {
  var units = [
    { key: "smr", label: "Bapas Kelas I Samarinda", color: "#2563eb" },
    { key: "bpp", label: "Bapas Kelas I Balikpapan", color: "#d97706" },
    { key: "trk", label: "Bapas Kelas II Tarakan", color: "#7c3aed" },
  ];
  var statusHtml = '<div class="admin-bapas-status-row">';
  units.forEach(function (u) {
    var rec = all[u.key];
    if (rec) {
      var sat = new Date(rec.submittedAt);
      statusHtml +=
        '<div class="admin-bapas-card submitted" style="border-left-color:' +
        u.color +
        '">' +
        '<div class="abc-title" style="color:' +
        u.color +
        '">✅ ' +
        u.label +
        "</div>" +
        '<div class="abc-time">Dikirim: ' +
        sat.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }) +
        " WITA</div>" +
        '<div class="abc-by">oleh: ' +
        rec.submittedBy +
        "</div>" +
        "</div>";
    } else {
      statusHtml +=
        '<div class="admin-bapas-card pending" style="border-left-color:#94a3b8">' +
        '<div class="abc-title" style="color:#94a3b8">⏳ ' +
        u.label +
        "</div>" +
        '<div class="abc-time">Belum mengirim</div>' +
        "</div>";
    }
  });
  statusHtml += "</div>";
  var statusEl = document.getElementById("admin-bapas-status");
  if (statusEl) statusEl.innerHTML = statusHtml;
}

function renderAdminRekap() {
  var rekapEl = document.getElementById("admin-rekap-area");
  if (rekapEl)
    rekapEl.innerHTML =
      '<div class="bapas-loading">⏳ Mengambil data dari server...</div>';
  var tanggal = getTanggalIso();
  loadAllBapasData(tanggal, function (all) {
    _renderAdminRekapFromData(all);
  });
}

/* ===== HELPER: parse data Bapas dari record Firebase (dipakai di beberapa tempat) ===== */
function _makeParseData(rec) {
  var emptyData = {
    dewasa: 0, anak: 0,
    pb_dewasa: 0, cb_dewasa: 0, cmb_dewasa: 0, cmk_dewasa: 0,
    asim_dewasa: 0, pib_dewasa: 0, bekerja: 0,
    narkotika: 0, teroris: 0,
    pb_anak: 0, cb_anak: 0, cmb_anak: 0, cmk_anak: 0,
    asim_anak: 0, pib_anak: 0,
    akot: 0, diversi: 0, sekolah: 0, latker: 0,
    litmas_dew_req: 0, litmas_dew_done: 0,
    litmas_anak_req: 0, litmas_anak_done: 0,
  };
  if (!rec) return emptyData;
  var d = rec.data || rec || {};
  return {
    dewasa: parseInt(d.dewasa) || 0,
    anak: parseInt(d.anak) || 0,
    pb_dewasa: parseInt(d.pb_dewasa) || 0,
    cb_dewasa: parseInt(d.cb_dewasa) || 0,
    cmb_dewasa: parseInt(d.cmb_dewasa) || 0,
    cmk_dewasa: parseInt(d.cmk_dewasa) || 0,
    asim_dewasa: parseInt(d.asim_dewasa) || 0,
    pib_dewasa: parseInt(d.pib_dewasa) || 0,
    bekerja: parseInt(d.bekerja) || 0,
    narkotika: (parseInt(d.narkotika_dewasa) || 0) + (parseInt(d.narkotika_anak) || 0),
    teroris: (parseInt(d.teroris_dewasa) || 0) + (parseInt(d.teroris_anak) || 0),
    pb_anak: parseInt(d.pb_anak) || 0,
    cb_anak: parseInt(d.cb_anak) || 0,
    cmb_anak: parseInt(d.cmb_anak) || 0,
    cmk_anak: parseInt(d.cmk_anak) || 0,
    asim_anak: parseInt(d.asim_anak) || 0,
    pib_anak: parseInt(d.pib_anak) || 0,
    akot: parseInt(d.akot) || 0,
    diversi: parseInt(d.diversi) || 0,
    sekolah: parseInt(d.sekolah) || 0,
    latker: parseInt(d.latker) || 0,
    litmas_dew_req: parseInt(d.litmas_dew_req) || 0,
    litmas_dew_done: parseInt(d.litmas_dew_done) || 0,
    litmas_anak_req: parseInt(d.litmas_anak_req) || 0,
    litmas_anak_done: parseInt(d.litmas_anak_done) || 0,
  };
}

function _renderAdminRekapFromData(all) {
  var rekapEl = document.getElementById("admin-rekap-area");
  if (!rekapEl) return;

  var anyData = all.smr || all.bpp || all.trk;
  if (!anyData) {
    rekapEl.innerHTML =
      '<div class="rekap-empty">📭 Belum ada data dari Bapas hari ini. Tunggu kiriman data dari masing-masing Bapas.</div>';
    return;
  }

  var smrData = _makeParseData(all.smr);
  var bppData = _makeParseData(all.bpp);
  var trkData = _makeParseData(all.trk);

  var jft = buildJft();
  if (all.smr && all.smr.data) {
    var sd = all.smr.data;
    var smrJft =
      (sd.jft_apk || 0) +
      (sd.jft_pertama || 0) +
      (sd.jft_muda || 0) +
      (sd.jft_madya || 0);
    if (smrJft > 0) {
      jft.smr_apk = sd.jft_apk || 0;
      jft.smr_pertama = sd.jft_pertama || 0;
      jft.smr_muda = sd.jft_muda || 0;
      jft.smr_madya = sd.jft_madya || 0;
      jft.smr_total = smrJft;
    }
  }
  if (all.bpp && all.bpp.data) {
    var bd = all.bpp.data;
    var bppJft =
      (bd.jft_apk || 0) +
      (bd.jft_pertama || 0) +
      (bd.jft_muda || 0) +
      (bd.jft_madya || 0);
    if (bppJft > 0) {
      jft.bpp_apk = bd.jft_apk || 0;
      jft.bpp_pertama = bd.jft_pertama || 0;
      jft.bpp_muda = bd.jft_muda || 0;
      jft.bpp_madya = bd.jft_madya || 0;
      jft.bpp_total = bppJft;
    }
  }
  if (all.trk && all.trk.data) {
    var td = all.trk.data;
    var trkJft =
      (td.jft_apk || 0) +
      (td.jft_pertama || 0) +
      (td.jft_muda || 0) +
      (td.jft_madya || 0);
    if (trkJft > 0) {
      jft.trk_apk = td.jft_apk || 0;
      jft.trk_pertama = td.jft_pertama || 0;
      jft.trk_muda = td.jft_muda || 0;
      jft.trk_madya = td.jft_madya || 0;
      jft.trk_total = trkJft;
    }
  }
  jft.grand_total =
    jft.kanwil_total + jft.smr_total + jft.bpp_total + jft.trk_total;

  var hari = document.getElementById("meta-hari")
    ? document.getElementById("meta-hari").value
    : getTanggalHariIni();
  var pukul = document.getElementById("meta-pukul")
    ? document.getElementById("meta-pukul").value
    : "08.00 WITA";
  var nama = document.getElementById("meta-nama")
    ? document.getElementById("meta-nama").value
    : "Huzaifah Makmur Hidayah";
  var nip = document.getElementById("meta-nip")
    ? document.getElementById("meta-nip").value
    : "197505241999021001";

  var result = buildLaporan(
    smrData,
    bppData,
    trkData,
    jft,
    hari,
    pukul,
    nama,
    nip,
  );
  lastResult = result;

  var missingUnits = [];
  if (!all.smr) missingUnits.push("Samarinda");
  if (!all.bpp) missingUnits.push("Balikpapan");
  if (!all.trk) missingUnits.push("Tarakan");

  var warningHtml =
    missingUnits.length > 0
      ? '<div class="rekap-warning">⚠ Data belum masuk dari: <strong>' +
        missingUnits.join(", ") +
        "</strong>. Nilai 0 dipakai untuk Bapas tersebut.</div>"
      : '<div class="rekap-complete">✅ Data dari semua 3 Bapas sudah masuk. Rekap lengkap!</div>';

  rekapEl.innerHTML =
    warningHtml +
    '<div class="result-card" style="margin-top:12px">' +
    '<div class="result-header">' +
    '<span class="result-label">📋 Rekap Laporan Kanwil</span>' +
    '<div style="display:flex;gap:8px">' +
    '<button type="button" class="btn-success" onclick="copyResult()">📋 Salin teks</button>' +
    "</div></div>" +
    '<div class="result-body"><pre id="result-text">' +
    escHtml(result) +
    "</pre></div>" +
    "</div>";

  var totalDew =
    (smrData.dewasa || 0) + (bppData.dewasa || 0) + (trkData.dewasa || 0);
  var totalAnak =
    (smrData.anak || 0) + (bppData.anak || 0) + (trkData.anak || 0);
  var hari2 = hari;
  var existIdx = ARSIP_DB.findIndex(function (a) {
    return a.tanggal === hari2;
  });
  if (existIdx >= 0) {
    ARSIP_DB[existIdx].dewasa = totalDew;
    ARSIP_DB[existIdx].anak = totalAnak;
    ARSIP_DB[existIdx].laporan = result;
  } else {
    var newId2 = ARSIP_DB.length
      ? Math.max.apply(
          null,
          ARSIP_DB.map(function (x) {
            return x.id;
          }),
        ) + 1
      : 1;
    ARSIP_DB.unshift({
      id: newId2,
      tanggal: hari2,
      dewasa: totalDew,
      anak: totalAnak,
      laporan: result,
    });
  }
  renderOvArsip();
}

function refreshAdminRekap() {
  renderAdminRekap();
}

function clearBapasDataToday() {
  if (currentRole !== "admin") {
    showToast("Hanya admin yang bisa reset data.", "error");
    return;
  }
  if (!_fbReady || !_fbDb) {
    showToast("Firebase belum siap.", "error");
    return;
  }
  if (!confirm("Reset semua data kiriman Bapas hari ini dari server?")) return;
  var tanggal = getTanggalIso();
  _fbDb
    .ref("laporan_harian/" + tanggal)
    .remove()
    .then(function () {
      renderAdminRekap();
      updateAdminBadgeCount();
      showToast("Data hari ini direset dari server.", "success");
      logActivity("Reset data Bapas hari ini oleh " + currentUser.nama);
    })
    .catch(function (e) {
      showToast("Gagal reset: " + e.message, "error");
    });
}
