/* =============================================================
   app.js — Dashboard Kanwil Ditjenpas Kaltim-Utara
   Handles: login/logout, routing, laporan harian (user & admin),
   laporan bulanan (drive links), infografis charts, JFT data,
   admin panel (user management, logs, settings), profil modal.
   ============================================================= */

"use strict";

/* ============================================================
   CONSTANTS & GLOBALS
   ============================================================ */

var HARI_LIST = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];
var BULAN_LIST = {
  1: "Januari",
  2: "Februari",
  3: "Maret",
  4: "April",
  5: "Mei",
  6: "Juni",
  7: "Juli",
  8: "Agustus",
  9: "September",
  10: "Oktober",
  11: "November",
  12: "Desember",
};

var ACCOUNTS = [
  {
    username: "admin",
    password: "admin123",
    role: "admin",
    nama: "Admin Kanwil",
    unit: null,
  },
  {
    username: "bapas_smr",
    password: "smr123",
    role: "user",
    nama: "Operator Bapas Samarinda",
    unit: "smr",
  },
  {
    username: "bapas_bpp",
    password: "bpp123",
    role: "user",
    nama: "Operator Bapas Balikpapan",
    unit: "bpp",
  },
  {
    username: "bapas_trk",
    password: "trk123",
    role: "user",
    nama: "Operator Bapas Tarakan",
    unit: "trk",
  },
];

var USERS_DB = ACCOUNTS.slice();

var currentUser = null;
var currentRole = null;
var _lastTotalKlien = 0;

var ACTIVITY_LOG = [];
var ARSIP_DB = [];

/* Drive link storage per bapas per folder-type */
var DRIVE_LINKS = {
  smr: {
    registrasi_litmas: "",
    pengawasan: "",
    pendampingan: "",
    pembimbingan: "",
    pelibatan: "",
    infografis_profil: "",
  },
  bpp: {
    registrasi_litmas: "",
    pengawasan: "",
    pendampingan: "",
    pembimbingan: "",
    pelibatan: "",
    infografis_profil: "",
  },
  trk: {
    registrasi_litmas: "",
    pengawasan: "",
    pendampingan: "",
    pembimbingan: "",
    pelibatan: "",
    infografis_profil: "",
  },
};

var FOLDER_LABELS = [
  { key: "registrasi_litmas", label: "📋 Registrasi & Litmas" },
  { key: "pengawasan", label: "📊 Pengawasan" },
  { key: "pendampingan", label: "⚖️ Pendampingan" },
  { key: "pembimbingan", label: "👥 Pembimbingan" },
  { key: "pelibatan", label: "🔗 Pelibatan Masyarakat" },
  { key: "infografis_profil", label: "📁 Data Infografis Profil Bapas" },
];

/* BAPAS_DATA — shared between Patch script and app.js */
var BAPAS_DATA = { smr: null, bpp: null, trk: null };
try {
  var _bd = localStorage.getItem("bapasData");
  if (_bd) BAPAS_DATA = JSON.parse(_bd);
} catch (e) {}

function saveBapasData() {
  try {
    localStorage.setItem("bapasData", JSON.stringify(BAPAS_DATA));
  } catch (e) {}
}

/* Chart.js instances */
var _charts = {};

/* ============================================================
   UTILITY
   ============================================================ */

function fmt(n) {
  return n !== undefined && n !== null ? n.toLocaleString("id-ID") : "—";
}

function el(id) {
  return document.getElementById(id);
}

function showToast(msg, dur) {
  var t = el("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(function () {
    t.classList.remove("show");
  }, dur || 2800);
}

function logActivity(msg) {
  var now = new Date().toLocaleString("id-ID");
  var user = currentUser ? currentUser.username : "system";
  ACTIVITY_LOG.unshift("[" + now + "] " + user + ": " + msg);
  if (ACTIVITY_LOG.length > 200) ACTIVITY_LOG.length = 200;
  renderActivityLog();
}

function renderActivityLog() {
  var logEl = el("activity-log");
  if (!logEl) return;
  if (!ACTIVITY_LOG.length) {
    logEl.innerHTML =
      '<span style="color:var(--text3)">Belum ada aktivitas.</span>';
    return;
  }
  logEl.innerHTML = ACTIVITY_LOG.map(function (l) {
    return "<div>" + l + "</div>";
  }).join("");
}

function openModal(id) {
  var m = el(id);
  if (m) m.style.display = "flex";
}

function closeModal(id) {
  var m = el(id);
  if (m) m.style.display = "none";
}

function destroyChart(id) {
  if (_charts[id]) {
    try {
      _charts[id].destroy();
    } catch (e) {}
    delete _charts[id];
  }
}

function makeChart(id, config) {
  destroyChart(id);
  var canvas = el(id);
  if (!canvas) return;
  try {
    _charts[id] = new Chart(canvas, config);
  } catch (e) {}
}

/* ============================================================
   AUTH — LOGIN / LOGOUT
   ============================================================ */

var _selectedRole = "user";

function selectRole(role, btn) {
  _selectedRole = role;
  document.querySelectorAll(".role-btn").forEach(function (b) {
    b.classList.remove("selected");
  });
  if (btn) btn.classList.add("selected");
}

function doLogin() {
  var u = (el("login-user").value || "").trim();
  var p = (el("login-pass").value || "").trim();
  var errEl = el("login-err");

  var acc = USERS_DB.find(function (a) {
    return a.username === u && a.password === p;
  });
  if (!acc) {
    if (errEl) errEl.style.display = "block";
    return;
  }
  if (errEl) errEl.style.display = "none";

  currentUser = acc;
  currentRole = acc.role;

  el("login-screen").style.display = "none";
  el("app").style.display = "flex";

  initApp();
  logActivity("Login berhasil: " + acc.nama + " [" + acc.role + "]");
}

function doLogout() {
  currentUser = null;
  currentRole = null;
  el("app").style.display = "none";
  el("login-screen").style.display = "flex";
  el("login-user").value = "";
  el("login-pass").value = "";
  // Reset charts
  Object.keys(_charts).forEach(function (k) {
    destroyChart(k);
  });
}

/* ============================================================
   APP INIT
   ============================================================ */

function initApp() {
  if (!currentUser) return;

  /* Sidebar user info */
  var initial = currentUser.nama
    ? currentUser.nama.charAt(0).toUpperCase()
    : "U";
  setText("sb-username", currentUser.nama);
  setText(
    "sb-role-text",
    currentRole === "admin" ? "Admin Kanwil" : "Operator Bapas",
  );
  setText("sb-avatar", initial);
  setText("tb-avatar", initial);

  var badge = el("sb-role-badge");
  if (badge) {
    badge.textContent = currentRole === "admin" ? "Admin" : "Operator";
    badge.className = "su-badge " + currentRole;
  }

  /* Admin-only elements */
  document.querySelectorAll(".admin-only").forEach(function (e) {
    e.style.display = currentRole === "admin" ? "" : "none";
  });

  /* Date */
  updateDateDisplay();

  /* Page init */
  goPage("dashboard", null);
  setupLaporanHarian();
  renderFolderCards();
  renderUserTable();
  renderActivityLog();
  syncOvJft();

  /* Restore saved BAPAS_DATA into infografis */
  if (BAPAS_DATA.smr || BAPAS_DATA.bpp || BAPAS_DATA.trk) {
    updateInfografisFromBapasData();
  }

  /* btn-save-arsip visibility */
  var btnS = el("btn-save-arsip");
  if (btnS)
    btnS.style.display = currentRole === "admin" ? "inline-block" : "none";
}

function setText(id, txt) {
  var e = el(id);
  if (e) e.textContent = txt;
}

function updateDateDisplay() {
  var now = new Date();
  var str =
    HARI_LIST[now.getDay()] +
    ", " +
    now.getDate() +
    " " +
    BULAN_LIST[now.getMonth() + 1] +
    " " +
    now.getFullYear();
  var dateEl = el("tb-date");
  if (dateEl) dateEl.textContent = "📅 " + str;
}

/* ============================================================
   SIDEBAR / NAVIGATION
   ============================================================ */

function toggleSidebar() {
  var sb = el("sidebar");
  var ov = el("sb-overlay");
  if (!sb) return;
  sb.classList.toggle("open");
  if (ov) ov.classList.toggle("show");
}

function closeSidebar() {
  var sb = el("sidebar");
  var ov = el("sb-overlay");
  if (sb) sb.classList.remove("open");
  if (ov) ov.classList.remove("show");
}

function goPage(pageId, navItem) {
  /* Deactivate all pages */
  document.querySelectorAll(".page").forEach(function (p) {
    p.classList.remove("active");
  });
  /* Deactivate all nav items */
  document.querySelectorAll(".nav-item").forEach(function (n) {
    n.classList.remove("active");
  });

  var page = el("page-" + pageId);
  if (page) page.classList.add("active");

  if (navItem) navItem.classList.add("active");

  /* Update topbar title */
  var titles = {
    dashboard: "Dashboard",
    "laporan-harian": "Laporan Harian",
    "laporan-bulanan": "Laporan Bulanan",
    infografis: "Infografis",
    "jft-infografis": "Infografis JFT",
    admin: "Panel Admin",
  };
  setText("topbar-title", titles[pageId] || pageId);

  closeSidebar();

  /* Lazy init charts when page becomes visible */
  if (pageId === "infografis") initInfografisCharts();
  if (pageId === "jft-infografis") initJftInfografisCharts();
}

/* ============================================================
   LAPORAN HARIAN — USER VIEW
   ============================================================ */

function setupLaporanHarian() {
  if (!currentUser) return;

  if (currentRole === "admin") {
    el("lh-user-view").style.display = "none";
    el("lh-admin-view").style.display = "block";

    /* Auto-fill date for admin */
    var now = new Date();
    var hari = HARI_LIST[now.getDay()];
    var tgl =
      now.getDate() +
      " " +
      BULAN_LIST[now.getMonth() + 1] +
      " " +
      now.getFullYear();
    var metaHari = el("meta-hari-admin");
    if (metaHari) metaHari.value = hari + ", " + tgl;

    /* Render manual forms */
    ["smr", "bpp", "trk"].forEach(function (b) {
      renderManualForm(b);
    });
    refreshRekapStatus();
  } else {
    el("lh-user-view").style.display = "block";
    el("lh-admin-view").style.display = "none";

    var unit = currentUser.unit || "smr";
    var names = {
      smr: "Bapas Kelas I Samarinda",
      bpp: "Bapas Kelas I Balikpapan",
      trk: "Bapas Kelas II Tarakan",
    };
    var colors = { smr: "#1d4ed8", bpp: "#d97706", trk: "#6d28d9" };
    var badges = { smr: "SMR", bpp: "BPP", trk: "TRK" };

    setText("lh-bapas-title", "Laporan Harian " + (names[unit] || "Bapas"));
    setText("lh-bapas-badge", badges[unit] || unit.toUpperCase());
    var badgeEl = el("lh-bapas-badge");
    if (badgeEl) badgeEl.style.background = colors[unit] || "#1d4ed8";
    setText("input-bapas-label", names[unit] || "Bapas");

    /* Auto-fill date */
    var now2 = new Date();
    var metaHariU = el("meta-hari");
    if (metaHariU && !metaHariU.value) {
      metaHariU.value =
        HARI_LIST[now2.getDay()] +
        ", " +
        now2.getDate() +
        " " +
        BULAN_LIST[now2.getMonth() + 1] +
        " " +
        now2.getFullYear();
    }

    lockOtherJft(unit);
  }
}

function lockOtherJft(unit) {
  ["smr", "bpp", "trk"].forEach(function (b) {
    var block = el("jft-" + b + "-block");
    if (!block) return;
    if (b !== unit) {
      block.querySelectorAll("input").forEach(function (inp) {
        inp.disabled = true;
        inp.style.opacity = "0.5";
      });
    }
  });
}

function recalcTotals() {
  var dl = parseInt(el("inp_dl").value) || 0;
  var dp = parseInt(el("inp_dp").value) || 0;
  var al = parseInt(el("inp_al").value) || 0;
  var ap = parseInt(el("inp_ap").value) || 0;
  el("inp_dt").value = dl + dp;
  el("inp_at").value = al + ap;
  el("inp_total").value = dl + dp + al + ap;
}

function submitLaporanBapas() {
  if (!currentUser) return;
  var unit = currentUser.unit || "smr";
  var errEl = el("err-input");
  if (errEl) errEl.style.display = "none";

  var dl = parseInt(el("inp_dl").value) || 0;
  var dp = parseInt(el("inp_dp").value) || 0;
  var al = parseInt(el("inp_al").value) || 0;
  var ap = parseInt(el("inp_ap").value) || 0;

  if (dl + dp + al + ap === 0) {
    if (errEl) {
      errEl.textContent =
        "⚠ Isi minimal data klien dewasa atau anak terlebih dahulu.";
      errEl.style.display = "block";
    }
    return;
  }

  var data = {
    unit: unit,
    pengirim: currentUser.nama,
    waktu: new Date().toLocaleString("id-ID"),
    dl: dl,
    dp: dp,
    dt: dl + dp,
    al: al,
    ap: ap,
    at: al + ap,
    total: dl + dp + al + ap,
    pb: parseInt(el("inp_pb").value) || 0,
    cb: parseInt(el("inp_cb").value) || 0,
    cmb: parseInt(el("inp_cmb").value) || 0,
    cmk: parseInt(el("inp_cmk").value) || 0,
    asimilasi: parseInt(el("inp_asimilasi").value) || 0,
    asimilasi_pend: parseInt(el("inp_asimilasi_pend").value) || 0,
    litmas: parseInt(el("inp_litmas").value) || 0,
    narkotika: parseInt(el("inp_narkotika").value) || 0,
    bekerja: parseInt(el("inp_bekerja").value) || 0,
    diversi: parseInt(el("inp_diversi").value) || 0,
    akot: parseInt(el("inp_akot").value) || 0,
    sekolah: parseInt(el("inp_sekolah").value) || 0,
    lpks: parseInt(el("inp_lpks").value) || 0,
    latker: parseInt(el("inp_latker").value) || 0,
    teroris: parseInt(el("inp_teroris").value) || 0,
    catatan: (el("inp_catatan").value || "").trim(),
    jft: getJftDataForUnit(unit),
  };

  BAPAS_DATA[unit] = data;
  saveBapasData();
  syncHiddenGenderInputs(unit, dl, dp, al, ap);

  var sb = el("submit-status");
  if (sb) {
    sb.style.display = "block";
    sb.style.background = "#dcfce7";
    sb.style.color = "#166534";
    sb.style.border = "1px solid #86efac";
    sb.innerHTML =
      "✅ Laporan berhasil dikirim ke Kanwil! (" + data.waktu + ")";
  }

  showToast("✅ Laporan " + unit.toUpperCase() + " berhasil dikirim!");
  logActivity(
    "Kirim laporan: " +
      currentUser.nama +
      " [" +
      unit.toUpperCase() +
      "] — " +
      data.total +
      " klien",
  );
}

function getJftDataForUnit(unit) {
  var pfx = "jft_" + unit + "_";
  if (unit === "smr" || unit === "bpp" || unit === "trk") {
    return {
      apk: parseInt((el(pfx + "apk") || {}).value) || 0,
      pertama: parseInt((el(pfx + "pertama") || {}).value) || 0,
      muda: parseInt((el(pfx + "muda") || {}).value) || 0,
      madya: parseInt((el(pfx + "madya") || {}).value) || 0,
    };
  }
  return {};
}

function syncHiddenGenderInputs(unit, dl, dp, al, ap) {
  var pre = "g_" + unit + "_";
  function sv(id, v) {
    var e = el(id);
    if (e) e.value = v;
  }
  sv(pre + "dl", dl);
  sv(pre + "dp", dp);
  sv(pre + "al", al);
  sv(pre + "ap", ap);
}

function resetInputBapas() {
  [
    "inp_dl",
    "inp_dp",
    "inp_al",
    "inp_ap",
    "inp_pb",
    "inp_cb",
    "inp_cmb",
    "inp_cmk",
    "inp_asimilasi",
    "inp_asimilasi_pend",
    "inp_litmas",
    "inp_narkotika",
    "inp_bekerja",
    "inp_diversi",
    "inp_akot",
    "inp_sekolah",
    "inp_lpks",
    "inp_latker",
    "inp_teroris",
  ].forEach(function (id) {
    var e = el(id);
    if (e) e.value = 0;
  });
  var cat = el("inp_catatan");
  if (cat) cat.value = "";
  recalcTotals();
  var sb = el("submit-status");
  if (sb) sb.style.display = "none";
  var err = el("err-input");
  if (err) err.style.display = "none";
}

/* ============================================================
   JFT TOTALS (User form)
   ============================================================ */

function updateJftTotal(unit) {
  var pfx = "jft_" + unit + "_";
  var keys =
    unit === "kanwil"
      ? ["pertama", "muda", "madya"]
      : ["apk", "pertama", "muda", "madya"];
  var total = keys.reduce(function (s, k) {
    return s + (parseInt((el(pfx + k) || {}).value) || 0);
  }, 0);
  var totEl = el("jft-" + unit + "-total");
  if (totEl) totEl.textContent = total;
}

function updateJftTotalAdmin(unit) {
  var pfx = "jft_" + unit + "_";
  var sfx = "_a";
  var keys =
    unit === "kanwil"
      ? ["pertama", "muda", "madya"]
      : ["apk", "pertama", "muda", "madya"];
  var total = keys.reduce(function (s, k) {
    return s + (parseInt((el(pfx + k + sfx) || {}).value) || 0);
  }, 0);
  var totEl = el("jft-" + unit + "-total-a");
  if (totEl) totEl.textContent = total;
  syncOvJft();
}

function syncOvJft() {
  /* Sync overview JFT cards from user-form inputs */
  var units = ["kanwil", "smr", "bpp", "trk"];
  var totals = {};
  units.forEach(function (u) {
    var pfx = "jft_" + u + "_";
    var keys =
      u === "kanwil"
        ? ["pertama", "muda", "madya"]
        : ["apk", "pertama", "muda", "madya"];
    totals[u] = keys.reduce(function (s, k) {
      return s + (parseInt((el(pfx + k) || {}).value) || 0);
    }, 0);
  });
  function sv(id, v) {
    var e = el(id);
    if (e) e.textContent = v;
  }
  sv("ov-jft-kanwil", totals.kanwil);
  sv("ov-jft-smr", totals.smr);
  sv("ov-jft-bpp", totals.bpp);
  sv("ov-jft-trk", totals.trk);
  var grand = totals.kanwil + totals.smr + totals.bpp + totals.trk;
  sv("ov-total-jft", grand);
  sv("ov-total-jft-hero", grand);
}

/* ============================================================
   ADMIN — REKAP STATUS & PANELS
   ============================================================ */

function refreshRekapStatus() {
  var names = { smr: "Samarinda", bpp: "Balikpapan", trk: "Tarakan" };
  ["smr", "bpp", "trk"].forEach(function (b) {
    var d = BAPAS_DATA[b];
    var dot = el("rstat-dot-" + b);
    var time = el("rstat-time-" + b);
    var badge = el("rstat-badge-" + b);
    var bdg = el("badge-" + b);

    if (d) {
      if (dot) {
        dot.style.background = "#22c55e";
        dot.style.boxShadow = "0 0 6px #22c55e";
      }
      if (time) time.textContent = "Diterima: " + d.waktu;
      if (badge) {
        badge.textContent = d.total + " klien";
        badge.style.color = "#166534";
        badge.style.background = "#dcfce7";
      }
      if (bdg) {
        bdg.textContent = names[b] + ": " + d.total + " klien ✓";
        bdg.className = "badge ok";
      }
      renderRekapPanel(b, d);
      syncJftAdmin(b, d.jft);
    } else {
      if (dot) {
        dot.style.background = "#d1d5db";
        dot.style.boxShadow = "none";
      }
      if (time) time.textContent = "Belum ada kiriman";
      if (badge) {
        badge.textContent = "—";
        badge.style.color = "";
        badge.style.background = "";
      }
      if (bdg) {
        bdg.textContent = names[b] + ": belum ada kiriman";
        bdg.className = "badge";
      }
    }
  });
}

function syncJftAdmin(unit, jft) {
  if (!jft) return;
  var pfx = "jft_" + unit + "_";
  ["apk", "pertama", "muda", "madya"].forEach(function (k) {
    if (jft[k] !== undefined) {
      var e = el(pfx + k + "_a");
      if (e) e.value = jft[k];
    }
  });
  updateJftTotalAdmin(unit);
  var ab = el("jft-" + unit + "-auto");
  if (ab) {
    ab.style.display = "inline";
    ab.style.background = "#dcfce7";
    ab.style.color = "#166534";
  }
}

var REKAP_FIELDS = [
  { id: "dl", label: "Klien Dewasa Laki-laki" },
  { id: "dp", label: "Klien Dewasa Perempuan" },
  { id: "dt", label: "Total Dewasa", computed: true },
  { id: "al", label: "Klien Anak Laki-laki" },
  { id: "ap", label: "Klien Anak Perempuan" },
  { id: "at", label: "Total Anak", computed: true },
  { id: "total", label: "TOTAL KLIEN", computed: true },
  { id: "pb", label: "PB (Pembebasan Bersyarat)" },
  { id: "cb", label: "CB (Cuti Bersyarat)" },
  { id: "cmb", label: "CMB (Cuti Menjelang Bebas)" },
  { id: "cmk", label: "CMK" },
  { id: "asimilasi", label: "Asimilasi Kerja" },
  { id: "asimilasi_pend", label: "Asimilasi Pendidikan" },
  { id: "litmas", label: "Litmas" },
  { id: "narkotika", label: "Klien Narkotika" },
  { id: "bekerja", label: "Klien Bekerja" },
  { id: "diversi", label: "Diversi" },
  { id: "akot", label: "AKOT" },
  { id: "sekolah", label: "Klien Sekolah" },
  { id: "lpks", label: "LPKS" },
  { id: "latker", label: "Latker" },
  { id: "teroris", label: "Klien Teroris" },
];

function renderRekapPanel(unit, d) {
  var infoEl = el("rekap-info-" + unit);
  var dataEl = el("rekap-data-" + unit);
  var gridEl = el("rekap-grid-" + unit);
  var catEl = el("rekap-catatan-" + unit);
  if (!gridEl) return;
  if (infoEl) infoEl.style.display = "none";
  if (dataEl) dataEl.style.display = "block";

  gridEl.innerHTML = REKAP_FIELDS.map(function (f) {
    var val = d[f.id] !== undefined ? d[f.id] : 0;
    var bold = f.computed
      ? ' style="font-weight:700;background:var(--bg2)"'
      : "";
    return (
      '<div class="rekap-row"' +
      bold +
      ">" +
      '<span class="rekap-label">' +
      f.label +
      "</span>" +
      '<span class="rekap-val">' +
      val +
      "</span></div>"
    );
  }).join("");

  if (catEl) {
    if (d.catatan) {
      catEl.style.display = "block";
      catEl.textContent = "📝 Catatan: " + d.catatan;
    } else {
      catEl.style.display = "none";
    }
  }
}

/* ============================================================
   ADMIN — MANUAL FORM
   ============================================================ */

function renderManualForm(unit) {
  var container = el("manual-form-" + unit);
  if (!container) return;

  var fields = [
    { id: "dl", label: "Dewasa Laki-laki" },
    { id: "dp", label: "Dewasa Perempuan" },
    { id: "al", label: "Anak Laki-laki" },
    { id: "ap", label: "Anak Perempuan" },
    { id: "pb", label: "PB" },
    { id: "cb", label: "CB" },
    { id: "cmb", label: "CMB" },
    { id: "cmk", label: "CMK" },
    { id: "asimilasi", label: "Asimilasi Kerja" },
    { id: "asimilasi_pend", label: "Asimilasi Pend" },
    { id: "litmas", label: "Litmas" },
    { id: "narkotika", label: "Narkotika" },
    { id: "bekerja", label: "Bekerja" },
    { id: "diversi", label: "Diversi" },
    { id: "akot", label: "AKOT" },
    { id: "sekolah", label: "Sekolah" },
    { id: "lpks", label: "LPKS" },
    { id: "latker", label: "Latker" },
    { id: "teroris", label: "Teroris" },
  ];

  var html = '<div class="form-grid-3" style="margin-bottom:10px">';
  fields.forEach(function (f) {
    var val = BAPAS_DATA[unit] ? BAPAS_DATA[unit][f.id] || 0 : 0;
    html +=
      '<div class="field"><label>' +
      f.label +
      "</label>" +
      '<input type="number" id="mf_' +
      unit +
      "_" +
      f.id +
      '" value="' +
      val +
      '" min="0"/></div>';
  });
  html += "</div>";
  html +=
    '<div class="field" style="margin-bottom:10px"><label>Catatan</label>' +
    '<textarea id="mf_' +
    unit +
    '_catatan" style="height:60px">' +
    (BAPAS_DATA[unit] ? BAPAS_DATA[unit].catatan || "" : "") +
    "</textarea></div>";
  html +=
    '<button class="btn-primary" onclick="applyManualForm(\'' +
    unit +
    '\')" style="width:100%">✅ Terapkan Data Manual</button>';

  container.innerHTML = html;
}

function applyManualForm(unit) {
  var fields = [
    "dl",
    "dp",
    "al",
    "ap",
    "pb",
    "cb",
    "cmb",
    "cmk",
    "asimilasi",
    "asimilasi_pend",
    "litmas",
    "narkotika",
    "bekerja",
    "diversi",
    "akot",
    "sekolah",
    "lpks",
    "latker",
    "teroris",
  ];
  var d = BAPAS_DATA[unit] || {};
  fields.forEach(function (f) {
    var inp = el("mf_" + unit + "_" + f);
    if (inp) d[f] = parseInt(inp.value) || 0;
  });
  var cat = el("mf_" + unit + "_catatan");
  if (cat) d.catatan = cat.value.trim();
  d.unit = unit;
  d.waktu = d.waktu || new Date().toLocaleString("id-ID");
  d.pengirim = d.pengirim || "Admin (manual)";
  d.dt = (d.dl || 0) + (d.dp || 0);
  d.at = (d.al || 0) + (d.ap || 0);
  d.total = d.dt + d.at;
  BAPAS_DATA[unit] = d;
  saveBapasData();
  refreshRekapStatus();
  updateInfografisFromBapasData();
  showToast("✅ Data " + unit.toUpperCase() + " (manual) diterapkan!");
  logActivity(
    "Input manual: " + unit.toUpperCase() + " — " + d.total + " klien",
  );
}

/* ============================================================
   ADMIN — GENERATE REKAP LAPORAN
   ============================================================ */

function generateLaporan() {
  var tgl = (el("meta-hari-admin") || {}).value || "";
  var pukul = (el("meta-pukul-admin") || {}).value || "08.00 WITA";
  var nama = (el("meta-nama-admin") || {}).value || "";
  var nip = (el("meta-nip-admin") || {}).value || "";

  /* JFT totals from admin form */
  function jftAdm(unit) {
    var pfx = "jft_" + unit + "_";
    var sfx = "_a";
    var keys =
      unit === "kanwil"
        ? ["pertama", "muda", "madya"]
        : ["apk", "pertama", "muda", "madya"];
    return keys.reduce(function (s, k) {
      return s + (parseInt((el(pfx + k + sfx) || {}).value) || 0);
    }, 0);
  }

  var jftKw = jftAdm("kanwil");
  var jftSmr = jftAdm("smr");
  var jftBpp = jftAdm("bpp");
  var jftTrk = jftAdm("trk");
  var jftTotal = jftKw + jftSmr + jftBpp + jftTrk;

  function gd(unit, field) {
    var d = BAPAS_DATA[unit];
    return d ? d[field] || 0 : 0;
  }

  var smrDt = gd("smr", "dt"),
    smrAt = gd("smr", "at"),
    smrTot = gd("smr", "total");
  var bppDt = gd("bpp", "dt"),
    bppAt = gd("bpp", "at"),
    bppTot = gd("bpp", "total");
  var trkDt = gd("trk", "dt"),
    trkAt = gd("trk", "at"),
    trkTot = gd("trk", "total");
  var grandTot = smrTot + bppTot + trkTot;

  var lines = [];
  lines.push("LAPORAN HARIAN BIDANG PEMBIMBINGAN KEMASYARAKATAN");
  lines.push("Kanwil Ditjenpas Kalimantan Timur-Utara");
  lines.push("─".repeat(50));
  lines.push("Hari/Tanggal : " + tgl);
  lines.push("Pukul       : " + pukul);
  lines.push("");
  lines.push("I. DATA JFT PEMBIMBING KEMASYARAKATAN");
  lines.push("   Total JFT        : " + jftTotal + " orang");
  lines.push("   Kanwil Ditjenpas : " + jftKw + " orang");
  lines.push("   Bapas Samarinda  : " + jftSmr + " orang");
  lines.push("   Bapas Balikpapan : " + jftBpp + " orang");
  lines.push("   Bapas Tarakan    : " + jftTrk + " orang");
  lines.push("");
  lines.push("II. DATA KLIEN PEMASYARAKATAN");
  lines.push("   ┌─────────────────────┬────────┬──────┬───────┐");
  lines.push("   │ Satuan              │ Dewasa │ Anak │ Total │");
  lines.push("   ├─────────────────────┼────────┼──────┼───────┤");
  lines.push(
    "   │ Bapas Samarinda     │  " +
      String(smrDt).padStart(5) +
      " │" +
      String(smrAt).padStart(5) +
      " │" +
      String(smrTot).padStart(6) +
      " │",
  );
  lines.push(
    "   │ Bapas Balikpapan    │  " +
      String(bppDt).padStart(5) +
      " │" +
      String(bppAt).padStart(5) +
      " │" +
      String(bppTot).padStart(6) +
      " │",
  );
  lines.push(
    "   │ Bapas Tarakan       │  " +
      String(trkDt).padStart(5) +
      " │" +
      String(trkAt).padStart(5) +
      " │" +
      String(trkTot).padStart(6) +
      " │",
  );
  lines.push("   ├─────────────────────┼────────┼──────┼───────┤");
  lines.push(
    "   │ TOTAL               │  " +
      String(smrDt + bppDt + trkDt).padStart(5) +
      " │" +
      String(smrAt + bppAt + trkAt).padStart(5) +
      " │" +
      String(grandTot).padStart(6) +
      " │",
  );
  lines.push("   └─────────────────────┴────────┴──────┴───────┘");
  lines.push("");

  var units = [
    { k: "smr", n: "BAPAS KELAS I SAMARINDA" },
    { k: "bpp", n: "BAPAS KELAS I BALIKPAPAN" },
    { k: "trk", n: "BAPAS KELAS II TARAKAN" },
  ];
  units.forEach(function (u, idx) {
    lines.push(idx + 3 + ". " + u.n);
    if (!BAPAS_DATA[u.k]) {
      lines.push("   (Data belum diterima)");
      lines.push("");
      return;
    }
    var d = BAPAS_DATA[u.k];
    lines.push("   Klien Dewasa L/P  : " + d.dl + " / " + d.dp + " = " + d.dt);
    lines.push("   Klien Anak L/P    : " + d.al + " / " + d.ap + " = " + d.at);
    lines.push("   Total Klien       : " + d.total);
    if (d.pb) lines.push("   PB                : " + d.pb);
    if (d.cb) lines.push("   CB                : " + d.cb);
    if (d.cmb) lines.push("   CMB               : " + d.cmb);
    if (d.cmk) lines.push("   CMK               : " + d.cmk);
    if (d.asimilasi) lines.push("   Asimilasi Kerja   : " + d.asimilasi);
    if (d.asimilasi_pend)
      lines.push("   Asimilasi Pend    : " + d.asimilasi_pend);
    if (d.litmas) lines.push("   Litmas            : " + d.litmas);
    if (d.narkotika) lines.push("   Klien Narkotika   : " + d.narkotika);
    if (d.bekerja) lines.push("   Klien Bekerja     : " + d.bekerja);
    if (d.diversi) lines.push("   Diversi           : " + d.diversi);
    if (d.akot) lines.push("   AKOT              : " + d.akot);
    if (d.sekolah) lines.push("   Klien Sekolah     : " + d.sekolah);
    if (d.lpks) lines.push("   LPKS              : " + d.lpks);
    if (d.latker) lines.push("   Latker            : " + d.latker);
    if (d.teroris) lines.push("   Klien Teroris     : " + d.teroris);
    if (d.catatan) lines.push("   Catatan           : " + d.catatan);
    lines.push("");
  });

  lines.push("─".repeat(50));
  lines.push("Mengetahui,");
  lines.push("Kepala Bidang Pembimbingan Kemasyarakatan");
  lines.push("");
  lines.push(nama);
  lines.push("NIP. " + nip);

  var result = lines.join("\n");
  el("result-text").textContent = result;
  el("result-area").style.display = "block";

  _lastTotalKlien = grandTot;
  setText("ov-total-klien", fmt(grandTot));
  setText("ov-total-klien-hero", fmt(grandTot));

  updateInfografisFromBapasData();
  showToast("✅ Rekap laporan berhasil di-generate!");
  logActivity("Generate rekap laporan kanwil — total klien: " + grandTot);
  el("result-area").scrollIntoView({ behavior: "smooth" });
}

function clearAll() {
  BAPAS_DATA = { smr: null, bpp: null, trk: null };
  saveBapasData();
  el("result-area").style.display = "none";
  setText("result-text", "");
  refreshRekapStatus();
  updateInfografisFromBapasData();
  showToast("🗑 Semua data dibersihkan");
  logActivity("Bersihkan semua data rekap");
}

function copyResult() {
  var txt = (el("result-text") || {}).textContent || "";
  if (!txt) {
    showToast("⚠ Tidak ada teks untuk disalin");
    return;
  }
  navigator.clipboard
    .writeText(txt)
    .then(function () {
      showToast("📋 Teks berhasil disalin!");
    })
    .catch(function () {
      /* Fallback */
      var ta = document.createElement("textarea");
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("📋 Teks berhasil disalin!");
    });
}

function doSaveArsip() {
  var txt = (el("result-text") || {}).textContent || "";
  if (!txt.trim()) {
    showToast("⚠ Generate rekap dulu sebelum menyimpan");
    return;
  }
  var now = new Date();
  var rec = {
    id: Date.now(),
    tanggal: now.toLocaleDateString("id-ID"),
    hari: HARI_LIST[now.getDay()],
    dewasa:
      (BAPAS_DATA.smr ? BAPAS_DATA.smr.dt : 0) +
      (BAPAS_DATA.bpp ? BAPAS_DATA.bpp.dt : 0) +
      (BAPAS_DATA.trk ? BAPAS_DATA.trk.dt : 0),
    anak:
      (BAPAS_DATA.smr ? BAPAS_DATA.smr.at : 0) +
      (BAPAS_DATA.bpp ? BAPAS_DATA.bpp.at : 0) +
      (BAPAS_DATA.trk ? BAPAS_DATA.trk.at : 0),
    laporan: txt,
  };
  ARSIP_DB.unshift(rec);
  showToast("✅ Tersimpan ke arsip!");
  logActivity("Simpan arsip laporan: " + rec.tanggal);
}

/* ============================================================
   TABS & PANELS
   ============================================================ */

function switchTab(unit, btn) {
  document.querySelectorAll(".panel").forEach(function (p) {
    p.classList.remove("active");
  });
  document.querySelectorAll(".tab").forEach(function (t) {
    t.classList.remove("active");
  });
  var panel = el("panel-" + unit);
  if (panel) panel.classList.add("active");
  if (btn) btn.classList.add("active");
}

/* ============================================================
   LAPORAN BULANAN — DRIVE LINKS
   ============================================================ */

function renderFolderCards() {
  /* Load saved links */
  try {
    var saved = localStorage.getItem("driveLinks");
    if (saved) DRIVE_LINKS = JSON.parse(saved);
  } catch (e) {}

  ["smr", "bpp", "trk"].forEach(function (unit) {
    var container = el("folders-" + unit);
    if (!container) return;
    container.innerHTML = "";
    FOLDER_LABELS.forEach(function (folder) {
      var link = (DRIVE_LINKS[unit] && DRIVE_LINKS[unit][folder.key]) || "";
      var item = document.createElement("div");
      item.className = "lapbul-folder-item";
      item.innerHTML =
        '<span class="lapbul-folder-icon">📂</span>' +
        '<span class="lapbul-folder-name">' +
        folder.label +
        "</span>";
      if (link) {
        item.style.cursor = "pointer";
        item.title = "Buka: " + link;
        item.addEventListener("click", function () {
          window.open(link, "_blank");
        });
      } else {
        item.style.opacity = "0.5";
        item.title =
          "Link belum diset (admin dapat mengubah via ⚙️ Edit Link Drive)";
      }
      container.appendChild(item);
    });
  });
}

function openDriveLinkModal() {
  /* Populate inputs with current saved links */
  try {
    var saved = localStorage.getItem("driveLinks");
    if (saved) DRIVE_LINKS = JSON.parse(saved);
  } catch (e) {}

  ["smr", "bpp", "trk"].forEach(function (unit) {
    FOLDER_LABELS.forEach(function (folder) {
      var inp = el("di-" + unit + "-" + folder.key);
      if (inp)
        inp.value = (DRIVE_LINKS[unit] && DRIVE_LINKS[unit][folder.key]) || "";
    });
  });
  openModal("modal-drive-link");
  switchDriveTab("smr");
}

function switchDriveTab(unit) {
  ["smr", "bpp", "trk"].forEach(function (u) {
    var btn = el("dtab-btn-" + u);
    var panel = el("dtab-" + u);
    if (btn) btn.classList.toggle("dtab-active", u === unit);
    if (panel) panel.style.display = u === unit ? "block" : "none";
  });
}

function saveDriveLinks() {
  ["smr", "bpp", "trk"].forEach(function (unit) {
    if (!DRIVE_LINKS[unit]) DRIVE_LINKS[unit] = {};
    FOLDER_LABELS.forEach(function (folder) {
      var inp = el("di-" + unit + "-" + folder.key);
      if (inp) DRIVE_LINKS[unit][folder.key] = inp.value.trim();
    });
  });
  try {
    localStorage.setItem("driveLinks", JSON.stringify(DRIVE_LINKS));
  } catch (e) {}
  closeModal("modal-drive-link");
  renderFolderCards();
  showToast("✅ Link Google Drive tersimpan!");
  logActivity("Perbarui link Google Drive");
}

/* ============================================================
   ADMIN — USER MANAGEMENT
   ============================================================ */

function renderUserTable() {
  var tbody = el("user-table-body");
  if (!tbody) return;
  var unitNames = {
    smr: "Bapas Samarinda",
    bpp: "Bapas Balikpapan",
    trk: "Bapas Tarakan",
    null: "—",
  };

  tbody.innerHTML = USERS_DB.map(function (u, i) {
    return (
      "<tr>" +
      "<td><code>" +
      u.username +
      "</code></td>" +
      "<td>" +
      u.nama +
      "</td>" +
      '<td><span class="su-badge ' +
      u.role +
      '" style="display:inline-block">' +
      (u.role === "admin" ? "Admin" : "Operator") +
      "</span></td>" +
      "<td>" +
      (unitNames[u.unit] || "—") +
      "</td>" +
      "<td>" +
      (u.username !== "admin"
        ? '<button class="btn-secondary" style="font-size:11px;padding:3px 10px" onclick="deleteUser(' +
          i +
          ')">Hapus</button>'
        : '<span style="color:var(--text3);font-size:11px">—</span>') +
      "</td></tr>"
    );
  }).join("");
}

function openAddUserModal() {
  openModal("modal-add-user");
  var nu = el("new-username");
  if (nu) nu.value = "";
  var np = el("new-password");
  if (np) np.value = "";
  var nn = el("new-nama");
  if (nn) nn.value = "";
  var nr = el("new-role");
  if (nr) nr.value = "user";
  var uw = el("unit-field-wrap");
  if (uw) uw.style.display = "flex";
  toggleUnitField();
}

function toggleUnitField() {
  var role = (el("new-role") || {}).value;
  var wrap = el("unit-field-wrap");
  if (wrap) wrap.style.display = role === "admin" ? "none" : "flex";
}

function doAddUser() {
  var u = ((el("new-username") || {}).value || "").trim();
  var p = ((el("new-password") || {}).value || "").trim();
  var n = ((el("new-nama") || {}).value || "").trim();
  var r = (el("new-role") || {}).value || "user";
  var unit = (el("new-unit") || {}).value || "smr";
  if (!u || !p || !n) {
    showToast("⚠ Lengkapi semua field");
    return;
  }
  if (
    USERS_DB.find(function (a) {
      return a.username === u;
    })
  ) {
    showToast("⚠ Username sudah ada");
    return;
  }
  var acc = {
    username: u,
    password: p,
    role: r,
    nama: n,
    unit: r === "user" ? unit : null,
  };
  USERS_DB.push(acc);
  ACCOUNTS.push(acc);
  closeModal("modal-add-user");
  renderUserTable();
  showToast("✅ User " + u + " berhasil ditambahkan");
  logActivity("Tambah user: " + u + " [" + r + "]");
}

function deleteUser(idx) {
  var acc = USERS_DB[idx];
  if (!acc || acc.username === "admin") {
    showToast("⚠ Tidak dapat menghapus akun ini");
    return;
  }
  if (!confirm("Hapus user " + acc.username + "?")) return;
  USERS_DB.splice(idx, 1);
  var ai = ACCOUNTS.findIndex(function (a) {
    return a.username === acc.username;
  });
  if (ai > -1) ACCOUNTS.splice(ai, 1);
  renderUserTable();
  showToast("🗑 User " + acc.username + " dihapus");
  logActivity("Hapus user: " + acc.username);
}

/* ============================================================
   ADMIN — PANEL TABS
   ============================================================ */

function switchAdminTab(tab, btn) {
  document.querySelectorAll(".admin-tab").forEach(function (t) {
    t.classList.remove("active");
  });
  document.querySelectorAll(".admin-panel").forEach(function (p) {
    p.classList.remove("active");
  });
  if (btn) btn.classList.add("active");
  var panel = el("ap-" + tab);
  if (panel) panel.classList.add("active");
}

/* ============================================================
   ARSIP MODAL
   ============================================================ */

function openArsipModal(id) {
  var rec = ARSIP_DB.find(function (r) {
    return r.id === id;
  });
  if (!rec) return;
  setText("modal-arsip-title", "Laporan " + rec.hari + ", " + rec.tanggal);
  var body = el("modal-arsip-body");
  if (body)
    body.innerHTML =
      '<pre style="white-space:pre-wrap;font-size:12px;max-height:400px;overflow-y:auto">' +
      rec.laporan +
      "</pre>";
  openModal("modal-arsip");
}

function copyArsipContent() {
  var pre = document.querySelector("#modal-arsip-body pre");
  if (!pre) return;
  var txt = pre.textContent;
  navigator.clipboard
    .writeText(txt)
    .then(function () {
      showToast("📋 Laporan tersalin!");
    })
    .catch(function () {
      var ta = document.createElement("textarea");
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("📋 Laporan tersalin!");
    });
}

/* ============================================================
   PROFIL MODAL
   ============================================================ */

function openProfilModal() {
  if (!currentUser) return;
  var nameInp = el("profil-nama-input");
  var userDisp = el("profil-username-display");
  if (nameInp) nameInp.value = currentUser.nama;
  if (userDisp) userDisp.value = currentUser.username;
  var prev = el("profil-preview-initial");
  if (prev)
    prev.textContent = (currentUser.nama || "U").charAt(0).toUpperCase();
  openModal("modal-profil");
}

function saveProfil() {
  var nameInp = el("profil-nama-input");
  var newName = nameInp ? nameInp.value.trim() : "";
  if (!newName) {
    showToast("⚠ Nama tidak boleh kosong");
    return;
  }
  currentUser.nama = newName;
  var acc = USERS_DB.find(function (a) {
    return a.username === currentUser.username;
  });
  if (acc) acc.nama = newName;
  setText("sb-username", newName);
  var init = newName.charAt(0).toUpperCase();
  setText("sb-avatar", init);
  setText("tb-avatar", init);
  closeModal("modal-profil");
  showToast("✅ Profil berhasil disimpan!");
  logActivity("Ubah profil: nama → " + newName);
}

function previewFotoProfil(input) {
  if (!input.files || !input.files[0]) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    var prev = el("profil-preview");
    if (prev) prev.style.backgroundImage = "url(" + e.target.result + ")";
    var init = el("profil-preview-initial");
    if (init) init.style.display = "none";
  };
  reader.readAsDataURL(input.files[0]);
}

/* ============================================================
   INFOGRAFIS — UPDATE DATA FROM BAPAS INPUTS
   ============================================================ */

function updateInfografisFromBapasData() {
  ["smr", "bpp", "trk"].forEach(function (b) {
    var d = BAPAS_DATA[b];
    var dw = d ? d.dt : 0;
    var an = d ? d.at : 0;
    var tot = d ? d.total : 0;

    function sv(id, v) {
      var e = el(id);
      if (e) e.textContent = v || "—";
    }
    sv("inf-total-" + b, tot);
    sv("inf-total-" + b + "-dew", dw);
    sv("inf-total-" + b + "-anak", an);
    sv("lbl-inf-" + b + "-total", tot);
    sv("lbl-inf-" + b + "-dew", dw);
    sv("lbl-inf-" + b + "-anak", an);

    syncHiddenGenderInputs(
      b,
      d ? d.dl : 0,
      d ? d.dp : 0,
      d ? d.al : 0,
      d ? d.ap : 0,
    );
  });

  var totSmr = BAPAS_DATA.smr ? BAPAS_DATA.smr.total : 0;
  var totBpp = BAPAS_DATA.bpp ? BAPAS_DATA.bpp.total : 0;
  var totTrk = BAPAS_DATA.trk ? BAPAS_DATA.trk.total : 0;
  var totalDew =
    (BAPAS_DATA.smr ? BAPAS_DATA.smr.dt : 0) +
    (BAPAS_DATA.bpp ? BAPAS_DATA.bpp.dt : 0) +
    (BAPAS_DATA.trk ? BAPAS_DATA.trk.dt : 0);
  var totalAnak =
    (BAPAS_DATA.smr ? BAPAS_DATA.smr.at : 0) +
    (BAPAS_DATA.bpp ? BAPAS_DATA.bpp.at : 0) +
    (BAPAS_DATA.trk ? BAPAS_DATA.trk.at : 0);
  var grandTotal = totSmr + totBpp + totTrk;

  function sv(id, v) {
    var e = el(id);
    if (e) e.textContent = v || "—";
  }
  sv("inf-total-semua", grandTotal);
  sv("inf-total-semua-dew", totalDew);
  sv("inf-total-semua-anak", totalAnak);

  /* Update charts if they exist */
  updateInfografisCharts();
  updateBapasDonutCharts();
}

/* ============================================================
   INFOGRAFIS PAGE — CHARTS
   ============================================================ */

function refreshInfografis() {
  updateInfografisFromBapasData();
  initInfografisCharts();
  showToast("🔄 Data infografis diperbarui");
}

function initInfografisCharts() {
  var smrDt = BAPAS_DATA.smr ? BAPAS_DATA.smr.dt : 0;
  var smrAt = BAPAS_DATA.smr ? BAPAS_DATA.smr.at : 0;
  var bppDt = BAPAS_DATA.bpp ? BAPAS_DATA.bpp.dt : 0;
  var bppAt = BAPAS_DATA.bpp ? BAPAS_DATA.bpp.at : 0;
  var trkDt = BAPAS_DATA.trk ? BAPAS_DATA.trk.dt : 0;
  var trkAt = BAPAS_DATA.trk ? BAPAS_DATA.trk.at : 0;

  var smrTot = smrDt + smrAt;
  var bppTot = bppDt + bppAt;
  var trkTot = trkDt + trkAt;

  /* Bar chart — klien per bapas */
  makeChart("chart-klien-total-bar", {
    type: "bar",
    data: {
      labels: ["Samarinda", "Balikpapan", "Tarakan"],
      datasets: [
        {
          label: "Dewasa",
          data: [smrDt, bppDt, trkDt],
          backgroundColor: [
            "rgba(59,130,246,0.8)",
            "rgba(245,158,11,0.8)",
            "rgba(139,92,246,0.8)",
          ],
        },
        {
          label: "Anak",
          data: [smrAt, bppAt, trkAt],
          backgroundColor: [
            "rgba(59,130,246,0.35)",
            "rgba(245,158,11,0.35)",
            "rgba(139,92,246,0.35)",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { font: { size: 11 } } },
      },
      scales: {
        x: { stacked: false },
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  });

  /* Donut — total per bapas */
  makeChart("chart-klien-total-donut", {
    type: "doughnut",
    data: {
      labels: ["Samarinda", "Balikpapan", "Tarakan"],
      datasets: [
        {
          data: [smrTot, bppTot, trkTot],
          backgroundColor: [
            "rgba(59,130,246,0.85)",
            "rgba(245,158,11,0.85)",
            "rgba(139,92,246,0.85)",
          ],
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { font: { size: 11 } } },
      },
    },
  });

  /* Per-bapas donuts */
  updateBapasDonutCharts();
}

function updateInfografisCharts() {
  /* Re-render if charts already exist */
  if (_charts["chart-klien-total-bar"] || _charts["chart-klien-total-donut"]) {
    initInfografisCharts();
  }
}

function updateBapasDonutCharts() {
  var configs = [
    {
      id: "chart-inf-smr-doughnut",
      key: "smr",
      colors: ["rgba(59,130,246,0.9)", "rgba(16,185,129,0.9)"],
    },
    {
      id: "chart-inf-bpp-doughnut",
      key: "bpp",
      colors: ["rgba(245,158,11,0.9)", "rgba(249,115,22,0.9)"],
    },
    {
      id: "chart-inf-trk-doughnut",
      key: "trk",
      colors: ["rgba(139,92,246,0.9)", "rgba(99,102,241,0.9)"],
    },
  ];
  configs.forEach(function (c) {
    var d = BAPAS_DATA[c.key];
    var dw = d ? d.dt : 0;
    var an = d ? d.at : 0;
    var tot = dw + an;
    if (tot === 0) {
      destroyChart(c.id);
      return;
    }
    makeChart(c.id, {
      type: "doughnut",
      data: {
        labels: ["Dewasa", "Anak"],
        datasets: [
          {
            data: [dw, an],
            backgroundColor: c.colors,
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: "65%",
        plugins: { legend: { display: false } },
      },
    });
  });
}

/* ============================================================
   JFT INFOGRAFIS PAGE — CHARTS
   ============================================================ */

function refreshJftInfografis() {
  initJftInfografisCharts();
  showToast("🔄 Data JFT diperbarui");
}

function initJftInfografisCharts() {
  /* Read from user-form JFT inputs (prefer admin inputs if admin) */
  function getJft(unit) {
    var sfx = currentRole === "admin" ? "_a" : "";
    var pfx = "jft_" + unit + "_";
    var keys =
      unit === "kanwil"
        ? ["pertama", "muda", "madya"]
        : ["apk", "pertama", "muda", "madya"];
    var breakdown = {};
    keys.forEach(function (k) {
      breakdown[k] = parseInt((el(pfx + k + sfx) || {}).value) || 0;
    });
    return breakdown;
  }

  var kw = getJft("kanwil");
  var smr = getJft("smr");
  var bpp = getJft("bpp");
  var trk = getJft("trk");

  function sum(obj) {
    return Object.values(obj).reduce(function (s, v) {
      return s + v;
    }, 0);
  }

  var kwTotal = sum(kw);
  var smrTotal = sum(smr);
  var bppTotal = sum(bpp);
  var trkTotal = sum(trk);
  var grand = kwTotal + smrTotal + bppTotal + trkTotal;

  /* Update labels */
  function sv(id, v) {
    var e = el(id);
    if (e) e.textContent = v;
  }
  sv("inf-jft-total", grand);
  sv("inf-jft-kanwil", kwTotal);
  sv("jft-donut-center-val", grand || "—");
  sv("jft-leg-kw", kwTotal);
  sv("jft-leg-smr", smrTotal);
  sv("jft-leg-bpp", bppTotal);
  sv("jft-leg-trk", trkTotal);
  sv("jft-leg-total", grand);

  /* Per-unit breakdown labels */
  function setBar(prefix, val, total) {
    sv("inf-" + prefix, val);
    var bar = el("inf-" + prefix.replace("-", "") + "-bar1");
    /* skip bar styling if element doesn't exist */
  }

  /* JFT breakdown bars for kanwil */
  sv("inf-kw-1", kw.pertama || 0);
  sv("inf-kw-2", kw.muda || 0);
  sv("inf-kw-3", kw.madya || 0);

  /* Donut chart — per unit */
  if (grand > 0) {
    makeChart("chart-jft-donut-unit", {
      type: "doughnut",
      data: {
        labels: ["Kanwil", "Samarinda", "Balikpapan", "Tarakan"],
        datasets: [
          {
            data: [kwTotal, smrTotal, bppTotal, trkTotal],
            backgroundColor: [
              "rgba(13,37,64,0.85)",
              "rgba(16,185,129,0.85)",
              "rgba(245,158,11,0.85)",
              "rgba(139,92,246,0.85)",
            ],
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: "68%",
        plugins: { legend: { display: false } },
      },
    });
  }

  /* Bar chart per unit */
  makeChart("chart-jft-bar-unit", {
    type: "bar",
    data: {
      labels: ["Kanwil", "Samarinda", "Balikpapan", "Tarakan"],
      datasets: [
        {
          label: "Jumlah PK",
          data: [kwTotal, smrTotal, bppTotal, trkTotal],
          backgroundColor: [
            "rgba(13,37,64,0.8)",
            "rgba(16,185,129,0.8)",
            "rgba(245,158,11,0.8)",
            "rgba(139,92,246,0.8)",
          ],
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });

  /* Per-unit bar charts */
  var unitConfigs = [
    { id: "chart-jft-bar-smr", data: smr, color: "rgba(16,185,129,0.8)" },
    { id: "chart-jft-bar-bpp", data: bpp, color: "rgba(245,158,11,0.8)" },
    { id: "chart-jft-bar-trk", data: trk, color: "rgba(139,92,246,0.8)" },
  ];
  unitConfigs.forEach(function (uc) {
    var keys = Object.keys(uc.data);
    var vals = keys.map(function (k) {
      return uc.data[k];
    });
    if (
      !vals.some(function (v) {
        return v > 0;
      })
    ) {
      destroyChart(uc.id);
      return;
    }
    makeChart(uc.id, {
      type: "bar",
      data: {
        labels: keys.map(function (k) {
          return k.charAt(0).toUpperCase() + k.slice(1);
        }),
        datasets: [
          {
            label: "JFT",
            data: vals,
            backgroundColor: uc.color,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  });
}

/* ============================================================
   DOM READY — expose globals
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
  /* Expose all functions globally so inline onclick="" in HTML works */
  var fns = [
    "selectRole",
    "doLogin",
    "doLogout",
    "initApp",
    "goPage",
    "toggleSidebar",
    "closeSidebar",
    "recalcTotals",
    "submitLaporanBapas",
    "resetInputBapas",
    "updateJftTotal",
    "updateJftTotalAdmin",
    "syncOvJft",
    "generateLaporan",
    "clearAll",
    "copyResult",
    "doSaveArsip",
    "switchTab",
    "openDriveLinkModal",
    "switchDriveTab",
    "saveDriveLinks",
    "renderManualForm",
    "applyManualForm",
    "refreshRekapStatus",
    "openAddUserModal",
    "doAddUser",
    "deleteUser",
    "toggleUnitField",
    "switchAdminTab",
    "openArsipModal",
    "copyArsipContent",
    "openProfilModal",
    "saveProfil",
    "previewFotoProfil",
    "closeModal",
    "openModal",
    "refreshInfografis",
    "refreshJftInfografis",
    "updateInfografisFromBapasData",
  ];
  fns.forEach(function (name) {
    if (typeof window[name] === "undefined") {
      window[name] = eval(name); // eslint-disable-line
    }
  });

  /* Inject lapbul-folder-item CSS if not present */
  var st = document.createElement("style");
  st.textContent = [
    ".lapbul-folder-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:9px;border:1px solid var(--border);margin-bottom:7px;background:var(--card);transition:background .15s,border-color .15s;}",
    ".lapbul-folder-item:hover{background:var(--bg2);border-color:var(--gold);}",
    ".lapbul-folder-icon{font-size:18px;flex-shrink:0;}",
    ".lapbul-folder-name{font-size:13px;color:var(--navy);font-weight:500;}",
    ".dtab-btn{padding:7px 14px;border-radius:8px;border:1px solid var(--border);background:var(--bg2);font-size:12.5px;font-weight:600;cursor:pointer;color:var(--text2);}",
    ".dtab-btn.dtab-active{background:var(--navy);color:#fff;border-color:var(--navy);}",
    ".drive-field-row{display:flex;flex-direction:column;gap:4px;margin-bottom:10px;}",
    ".drive-field-row label{font-size:12px;font-weight:600;color:var(--text2);}",
    ".drive-field-row input{padding:8px 11px;border:1px solid var(--border);border-radius:7px;font-size:12px;background:var(--bg2);color:var(--text);outline:none;}",
    ".drive-field-row input:focus{border-color:var(--gold);}",
    ".toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(20px);background:#0d2540;color:#fff;padding:10px 22px;border-radius:999px;font-size:13px;font-weight:600;z-index:9999;opacity:0;transition:all .3s;pointer-events:none;}",
    ".toast.show{opacity:1;transform:translateX(-50%) translateY(0);}",
    ".badge.ok{background:#dcfce7!important;color:#166534!important;}",
    ".panel{display:none;}.panel.active{display:block;}",
    ".admin-panel{display:none;}.admin-panel.active{display:block;}",
    ".tab{padding:7px 16px;border-radius:8px 8px 0 0;border:1px solid var(--border);border-bottom:none;background:var(--bg2);font-size:12.5px;font-weight:600;cursor:pointer;color:var(--text2);margin-right:4px;}",
    ".tab.active{background:var(--card);color:var(--navy);border-bottom:2px solid var(--gold);}",
    ".admin-tab{padding:7px 16px;border-radius:8px;border:1px solid var(--border);background:var(--bg2);font-size:12.5px;font-weight:600;cursor:pointer;color:var(--text2);margin-right:6px;margin-bottom:14px;}",
    ".admin-tab.active{background:var(--navy);color:#fff;border-color:var(--navy);}",
    ".status-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;}",
    ".badge{display:inline-block;padding:4px 10px;border-radius:20px;font-size:11.5px;font-weight:600;background:#e5e7eb;color:#374151;}",
    ".user-table{width:100%;border-collapse:collapse;font-size:13px;}",
    ".user-table th,.user-table td{padding:9px 12px;text-align:left;border-bottom:1px solid var(--border);}",
    ".user-table th{font-weight:700;color:var(--navy);background:var(--bg2);}",
    ".su-badge.admin{background:#fef3c7;color:#92400e;}",
    ".su-badge.user{background:#dbeafe;color:#1e40af;}",
  ].join("");
  document.head.appendChild(st);
});
