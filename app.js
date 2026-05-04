/* ============================================================
   Generator Laporan Harian Kanwil — Kaltim-Utara
   app.js — logika utama (parser, generator, UI)
   ============================================================ */

/* ============================================================
   KONFIGURASI
   ============================================================ */
var KABID_NAMA = 'Huzaifah Makmur Hidayah';
var KABID_NIP  = '197505241999021001';

var HARI_LIST  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
var BULAN_LIST = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

var PREVIEW_FIELDS = [
  { key: 'dewasa',           label: 'Klien Dewasa' },
  { key: 'anak',             label: 'Klien Anak' },
  { key: 'pb_dewasa',        label: 'PB (Dewasa)' },
  { key: 'cb_dewasa',        label: 'CB (Dewasa)' },
  { key: 'cmb_dewasa',       label: 'CMB' },
  { key: 'cmk_dewasa',       label: 'CMK' },
  { key: 'asim_dewasa',      label: 'Asimilasi Dew.' },
  { key: 'pb_anak',          label: 'PB (Anak)' },
  { key: 'cb_anak',          label: 'CB (Anak)' },
  { key: 'asim_anak',        label: 'Asimilasi Anak' },
  { key: 'litmas_dew_req',   label: 'Litmas Dew. (Req)' },
  { key: 'litmas_dew_done',  label: 'Litmas Dew. (Done)' },
  { key: 'litmas_anak_req',  label: 'Litmas Anak (Req)' },
  { key: 'litmas_anak_done', label: 'Litmas Anak (Done)' },
  { key: 'diversi',          label: 'Diversi' },
  { key: 'akot',             label: 'AKOT' },
  { key: 'latker',           label: 'Latker/LPKS' },
  { key: 'sekolah',          label: 'Klien Sekolah' },
  { key: 'bekerja',          label: 'Klien Bekerja' },
  { key: 'narkotika',        label: 'Narkotika (Dew+Anak)' },
  { key: 'teroris',          label: 'Teroris (Dew+Anak)' },
];

/* ============================================================
   TANGGAL OTOMATIS
   ============================================================ */
function getTanggalHariIni() {
  var now   = new Date();
  var hari  = HARI_LIST[now.getDay()];
  var tgl   = now.getDate();
  var bulan = BULAN_LIST[now.getMonth() + 1];
  var tahun = now.getFullYear();
  return hari + ', ' + tgl + ' ' + bulan + ' ' + tahun;
}

/* ============================================================
   TAB SWITCHING
   ============================================================ */
function switchTab(id, el) {
  document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
  el.classList.add('active');
  document.getElementById('panel-' + id).classList.add('active');
}

/* ============================================================
   STATUS BADGE
   ============================================================ */
function updateBadge(id) {
  var txt   = document.getElementById('txt-' + id).value.trim();
  var badge = document.getElementById('badge-' + id);
  var label = id === 'smr' ? 'Samarinda' : id === 'bpp' ? 'Balikpapan' : 'Tarakan';
  if (txt.length > 20) {
    badge.className  = 'badge ok';
    badge.textContent = label + ': sudah diisi ✓';
  } else {
    badge.className  = 'badge';
    badge.textContent = label + ': belum diisi';
  }
}

/* ============================================================
   JFT TOTAL CALCULATOR
   ============================================================ */
function updateJftTotal(unit) {
  var ids = unit === 'kanwil'
    ? ['jft_kanwil_pertama', 'jft_kanwil_muda', 'jft_kanwil_madya']
    : ['jft_' + unit + '_apk', 'jft_' + unit + '_pertama', 'jft_' + unit + '_muda', 'jft_' + unit + '_madya'];

  var total = ids.reduce(function(sum, id) {
    var el = document.getElementById(id);
    return sum + (el ? (parseInt(el.value) || 0) : 0);
  }, 0);

  document.getElementById('jft-' + unit + '-total').textContent = total;
}

/* ============================================================
   PARSER — port dari parser.php ke JavaScript
   ============================================================ */

function extractNum(text, patterns) {
  for (var i = 0; i < patterns.length; i++) {
    var m = text.match(patterns[i]);
    if (m) {
      var raw = m[1].replace(/[.,\s]/g, '');
      var num = parseInt(raw, 10);
      if (!isNaN(num)) return num;
    }
  }
  return null;
}

function extractIntFromLine(text, keyword) {
  var esc = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Format 1: "KEYWORD : angka" di baris yang sama
  var re1 = new RegExp('^' + esc + '\\s*[:\\-]?\\s*([\\d.,]+)', 'im');
  var m1  = text.match(re1);
  if (m1) return parseInt(m1[1].replace(/[.,]/g, ''), 10);
  // Format 2: "KEYWORD ... Jumlah : angka"
  var re2 = new RegExp(esc + '[\\s\\S]{0,60}?jumlah\\s*[=:]\\s*([\\d.,]+)', 'i');
  var m2  = text.match(re2);
  if (m2) return parseInt(m2[1].replace(/[.,]/g, ''), 10);
  return null;
}

function parseReport(text) {
  var t = text;
  var d = {};

  // ---- KLIEN DEWASA TOTAL ----
  var mDew = t.match(/klien dewasa[\s\S]{0,200}?jumlah\s*[=:]\s*([\d.,]+)/i);
  if (mDew) {
    d.dewasa = parseInt(mDew[1].replace(/[.,]/g,''), 10);
  } else {
    var mDew2 = t.match(/jumlah\s*[=:]\s*([\d.,]+)\s*orang/i);
    d.dewasa = mDew2 ? parseInt(mDew2[1].replace(/[.,]/g,''), 10) : null;
  }

  // ---- KLIEN ANAK TOTAL ----
  var mAnak = t.match(/klien anak[\s\S]{0,200}?jumlah\s*[=:]\s*([\d.,]+)/i);
  d.anak = mAnak ? parseInt(mAnak[1].replace(/[.,]/g,''), 10) : null;

  // ---- INTEGRASI DEWASA ----
  d.pb_dewasa  = extractIntFromLine(t, 'pb');
  d.cb_dewasa  = extractIntFromLine(t, 'cb');
  d.cmb_dewasa = extractIntFromLine(t, 'cmb');
  d.cmk_dewasa = extractIntFromLine(t, 'cmk');

  // Asimilasi dewasa — kemunculan pertama
  var asimJumlahAll = t.match(/asimila[si]*[\s\S]{0,60}?jumlah\s*[=:]\s*([\d.,]+)/i);
  var asimAll       = t.match(/asimila[si]*\s*[:\-]?\s*([\d.,]+)/i);
  if (asimJumlahAll) {
    d.asim_dewasa = parseInt(asimJumlahAll[1].replace(/[.,]/g,''), 10);
  } else if (asimAll) {
    d.asim_dewasa = parseInt(asimAll[1].replace(/[.,]/g,''), 10);
  } else {
    d.asim_dewasa = null;
  }

  // ---- KLIEN ANAK DETAIL ----
  var anakMatch = t.match(/klien anak[\s\S]{0,1500}/i);
  if (anakMatch) {
    var ab = anakMatch[0];
    d.pb_anak  = extractIntFromLine(ab, 'pb');
    d.cb_anak  = extractIntFromLine(ab, 'cb');
    d.cmb_anak = extractIntFromLine(ab, 'cmb');

    var asirum    = ab.match(/asirum[\s\S]{0,60}?jumlah\s*[=:]\s*([\d.,]+)/i);
    var asimAnakJ = ab.match(/asimila[si]*[\s\S]{0,60}?jumlah\s*[=:]\s*([\d.,]+)/i);
    var asimAnak  = ab.match(/asimila[si]*\s*[:\-]?\s*([\d.,]+)/i);
    if (asirum) {
      d.asim_anak = parseInt(asirum[1].replace(/[.,]/g,''), 10);
    } else if (asimAnakJ) {
      d.asim_anak = parseInt(asimAnakJ[1].replace(/[.,]/g,''), 10);
    } else if (asimAnak) {
      d.asim_anak = parseInt(asimAnak[1].replace(/[.,]/g,''), 10);
    } else {
      d.asim_anak = null;
    }
  } else {
    d.pb_anak   = null;
    d.cb_anak   = null;
    d.asim_anak = null;
    d.cmb_anak  = null;
  }

  // ---- LITMAS ----
  d.litmas_dew_req = extractNum(t, [
    /permintaan litmas dewasa\s*\d{0,4}\s*[:\-]?\s*([\d.,]+)/i,
    /permintaan[\s\S]{0,5}dewasa\s*\d{0,4}\s*[:\-]?\s*([\d.,]+)/i,
    /permintaan litmas[\s\S]{0,50}dewasa\s*[:\-]?\s*([\d.,]+)/i,
  ]);
  d.litmas_dew_done = extractNum(t, [
    /penyelesaian litmas dewasa\s*\d{0,4}\s*[:\-]?\s*([\d.,]+)/i,
    /penyelesaian[\s\S]{0,5}dewasa\s*\d{0,4}\s*[:\-]?\s*([\d.,]+)/i,
    /penyelesaian litmas[\s\S]{0,50}dewasa\s*[:\-]?\s*([\d.,]+)/i,
  ]);
  d.litmas_anak_req = extractNum(t, [
    /permintaan litmas anak\s*\d{0,4}\s*[:\-]?\s*([\d.,]+)/i,
    /permintaan[\s\S]{0,5}anak\s*\d{0,4}\s*[:\-]?\s*([\d.,]+)/i,
  ]);
  d.litmas_anak_done = extractNum(t, [
    /penyelesaian litmas anak\s*\d{0,4}\s*[:\-]?\s*([\d.,]+)/i,
    /penyelesaian[\s\S]{0,5}anak\s*\d{0,4}\s*[:\-]?\s*([\d.,]+)/i,
  ]);

  // ---- DIVERSI ----
  d.diversi = extractNum(t, [
    /diversi\s*[:\-]?\s*([\d.,]+)/i,
    /diversi[\s\S]{0,50}jumlah\s*[=:]\s*([\d.,]+)/i,
  ]);

  // ---- AKOT ----
  d.akot = extractNum(t, [
    /^akot\s*\n[\s\S]{0,60}jumlah\s*[=:]\s*([\d.,]+)/im,
    /akot[\s\S]{0,60}jumlah\s*[=:]\s*([\d.,]+)/i,
    /^akot\s*[:\-]?\s*([\d.,]+)/im,
  ]);

  // ---- PELATIHAN KERJA / LPKS / LATKER ----
  d.latker = extractNum(t, [
    /lpks\s*\/?s*latker[\s\S]{0,60}jumlah\s*[=:]\s*([\d.,]+)/i,
    /latker[\s\S]{0,60}jumlah\s*[=:]\s*([\d.,]+)/i,
    /pelatihan kerja[\s\S]{0,60}jumlah\s*[=:]\s*([\d.,]+)/i,
    /lpks[\s\S]{0,60}jumlah\s*[=:]\s*([\d.,]+)/i,
  ]);

  // ---- KLIEN SEKOLAH ----
  d.sekolah = extractNum(t, [
    /klien anak sekolah\s*[:\-]?\s*([\d.,]+)/i,
    /anak sekolah\s*[:\-]?\s*([\d.,]+)/i,
    /klien sekolah\s*[:\-]?\s*([\d.,]+)/i,
    /sekolah\s*[:\-]?\s*([\d.,]+)/i,
  ]);

  // ---- KLIEN BEKERJA ----
  d.bekerja = extractNum(t, [
    /klien bekerja[\s\S]{0,80}jumlah\s*[=:]\s*([\d.,]+)/i,
    /bekerja\s*\n[\s\S]{0,80}jumlah\s*[=:]\s*([\d.,]+)/i,
  ]);

  // ---- NARKOTIKA ----
  var splitAnakPos = t.search(/klien anak/i);
  var tDewPart  = splitAnakPos >= 0 ? t.substring(0, splitAnakPos) : t;
  var tAnakPart = splitAnakPos >= 0 ? t.substring(splitAnakPos)    : '';

  var narkDew = extractNum(tDewPart, [
    /klien narkotika[\s\S]{0,60}jumlah\s*[=:]\s*([\d.,]+)/i,
    /klien narkoba[\s\S]{0,80}jumlah\s*[=:]\s*([\d.,]+)/i,
    /narkoba[\s\S]{0,80}jumlah\s*[=:]\s*([\d.,]+)/i,
    /narkotika[\s\S]{0,80}jumlah\s*[=:]\s*([\d.,]+)/i,
  ]);
  var narkAnak = tAnakPart ? extractNum(tAnakPart, [
    /klien narkotika\s*[:\-]\s*([\d.,]+)/i,
    /klien narkoba\s*[:\-]\s*([\d.,]+)/i,
    /narkotika[\s\S]{0,60}jumlah\s*[=:]\s*([\d.,]+)/i,
    /narkoba[\s\S]{0,60}jumlah\s*[=:]\s*([\d.,]+)/i,
    /narkotika\s*[:\-]\s*([\d.,]+)/i,
  ]) : null;

  d.narkotika = (narkDew !== null || narkAnak !== null)
    ? (narkDew || 0) + (narkAnak || 0) : null;

  // ---- TERORIS ----
  var terisDew = extractNum(tDewPart, [
    /klien teroris\s*[:\-]?\s*([\d.,]+)/i,
    /teroris\s*[:\-]?\s*([\d.,]+)/i,
  ]);
  var terisAnak = tAnakPart ? extractNum(tAnakPart, [
    /klien teroris\s*[:\-]?\s*([\d.,]+)/i,
    /teroris\s*[:\-]?\s*([\d.,]+)/i,
  ]) : null;

  d.teroris = (terisDew !== null || terisAnak !== null)
    ? (terisDew || 0) + (terisAnak || 0) : null;

  return d;
}

/* ============================================================
   LIVE PREVIEW (client-side, tanpa AJAX)
   ============================================================ */
var previewTimers = {};

function livePreview(id) {
  var txt    = document.getElementById('txt-' + id).value.trim();
  var prevEl = document.getElementById('prev-' + id);
  var gridEl = document.getElementById('prev-' + id + '-grid');

  if (txt.length < 20) {
    prevEl.classList.remove('show');
    return;
  }

  clearTimeout(previewTimers[id]);
  previewTimers[id] = setTimeout(function() {
    var data = parseReport(txt);
    renderPreviewGrid(gridEl, data);
    prevEl.classList.add('show');
  }, 400);
}

function renderPreviewGrid(gridEl, data) {
  var html = '';
  PREVIEW_FIELDS.forEach(function(f) {
    var v    = (data[f.key] !== undefined && data[f.key] !== null) ? data[f.key] : null;
    var cls  = v === null ? '' : v > 0 ? 'found' : 'zero';
    var disp = v === null ? '—' : Number(v).toLocaleString('id-ID');
    html += '<div class="parse-item ' + cls + '">'
          + '<div class="key">' + escHtml(f.label) + '</div>'
          + '<div class="val">' + disp + '</div>'
          + '</div>';
  });
  gridEl.innerHTML = html;
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ============================================================
   GENERATOR — port dari generator.php ke JavaScript
   ============================================================ */
function n(val) { return val !== null && val !== undefined ? val : 0; }

function fmt(val) {
  return Number(val).toLocaleString('id-ID');
}

function buildJft() {
  function iv(id, def) { var el = document.getElementById(id); return el ? (parseInt(el.value)||0) : def; }
  var jft = {
    kanwil_pertama: iv('jft_kanwil_pertama', 0),
    kanwil_muda:    iv('jft_kanwil_muda',    2),
    kanwil_madya:   iv('jft_kanwil_madya',   2),
    smr_apk:        iv('jft_smr_apk',        1),
    smr_pertama:    iv('jft_smr_pertama',    12),
    smr_muda:       iv('jft_smr_muda',        7),
    smr_madya:      iv('jft_smr_madya',       4),
    bpp_apk:        iv('jft_bpp_apk',         0),
    bpp_pertama:    iv('jft_bpp_pertama',     16),
    bpp_muda:       iv('jft_bpp_muda',         6),
    bpp_madya:      iv('jft_bpp_madya',        5),
    trk_apk:        iv('jft_trk_apk',         0),
    trk_pertama:    iv('jft_trk_pertama',     10),
    trk_muda:       iv('jft_trk_muda',         1),
    trk_madya:      iv('jft_trk_madya',        2),
  };
  jft.kanwil_total = jft.kanwil_pertama + jft.kanwil_muda + jft.kanwil_madya;
  jft.smr_total    = jft.smr_apk  + jft.smr_pertama  + jft.smr_muda  + jft.smr_madya;
  jft.bpp_total    = jft.bpp_apk  + jft.bpp_pertama  + jft.bpp_muda  + jft.bpp_madya;
  jft.trk_total    = jft.trk_apk  + jft.trk_pertama  + jft.trk_muda  + jft.trk_madya;
  jft.grand_total  = jft.kanwil_total + jft.smr_total + jft.bpp_total + jft.trk_total;
  return jft;
}

function buildLaporan(smr, bpp, trk, jft, hari, pukul, nama, nip) {
  var zwj = '\u200E';
  var out = '';

  out += 'Laporan Harian Data Pembimbing Kemasyarakatan dan Klien Balai Pemasyarakatan Wilayah Kalimantan Timur-Utara\n';
  out += '\n';
  out += 'Yth.\n';
  out += 'Direktur Pembimbingan Kemasyarakatan\n';
  out += '\n';
  out += 'Dari :\n';
  out += 'Kepala Bidang Pembimbingan Kemasyarakatan Kanwil Direktorat Jenderal Pemasyarakatan Kalimantan Timur\n';
  out += '\n';
  out += 'Tembusan :\n';
  out += 'Direktur Jenderal Pemasyarakatan Kementerian Imigrasi dan Pemasyarakatan RI\n';
  out += '\n';
  out += 'Bersama ini kami sampaikan Laporan Harian Data Pembimbing Kemasyarakatan dan Klien Balai Pemasyarakatan Wilayah Kalimantan Timur-Utara pada \n';
  out += 'Hari/Tgl\t: ' + hari + '\n';
  out += 'Pukul\t: ' + pukul + '\n';

  // ---- I. DATA JFT ----
  out += '\n';
  out += 'I.DATA JFT PK : ' + jft.grand_total + ' ORANG\n';
  out += '\n';
  out += 'Kanwil Ditjenpas  \t: ' + jft.kanwil_total + ' orang\n';
  out += '•PK Pertama    \t           \t: ' + jft.kanwil_pertama + ' orang\n';
  out += '•PK Muda         \t           \t: ' + jft.kanwil_muda + ' orang\n';
  out += '•PK Madya                       \t: ' + jft.kanwil_madya + ' orang\n';
  out += 'Bapas Kelas I Samarinda \t: ' + jft.smr_total + ' orang\n';
  out += '•APK                        \t: ' + jft.smr_apk + ' orang\n';
  out += '•PK Pertama    \t           \t: ' + jft.smr_pertama + ' orang\n';
  out += '•PK Muda         \t           \t: ' + jft.smr_muda + ' orang\n';
  out += '•PK Madya                       \t: ' + jft.smr_madya + ' orang\n';
  out += 'Bapas Kelas I Balikpapan \t: ' + jft.bpp_total + ' orang\n';
  out += '•APK                           \t: ' + jft.bpp_apk + ' orang\n';
  out += '•PK Pertama    \t           \t: ' + jft.bpp_pertama + ' orang\n';
  out += '•PK Muda         \t           \t: ' + jft.bpp_muda + ' orang\n';
  out += '•PK Madya                       \t: ' + jft.bpp_madya + ' orang\n';
  out += 'Bapas Kelas II Tarakan \t: ' + jft.trk_total + ' orang\n';
  out += '•APK                           \t: ' + jft.trk_apk + ' orang\n';
  out += '•PK Pertama    \t           \t: ' + jft.trk_pertama + ' orang\n';
  out += '•PK Muda         \t           \t: ' + jft.trk_muda + ' orang\n';
  out += '•PK Madya                       \t: ' + jft.trk_madya + ' orang\n';

  // ---- II. DATA KLIEN ----
  var smrDew  = n(smr.dewasa);  var smrAnak = n(smr.anak);
  var bppDew  = n(bpp.dewasa);  var bppAnak = n(bpp.anak);
  var trkDew  = n(trk.dewasa);  var trkAnak = n(trk.anak);
  var totalDew   = smrDew + bppDew + trkDew;
  var totalAnak  = smrAnak + bppAnak + trkAnak;
  var totalKlien = totalDew + totalAnak;

  out += '\n';
  out += 'II.DATA KLIEN :  ' + fmt(totalKlien) + ' ORANG\n';
  out += zwj + 'Bapas Kelas I Samarinda    : ' + fmt(smrDew + smrAnak) + ' orang\n';
  out += '•Dewasa\t\t:  ' + fmt(smrDew) + ' orang\n';
  out += '•Anak\t\t                :  ' + smrAnak + ' orang\n';
  out += '\n';
  out += zwj + 'Bapas Kelas I Balikpapan : ' + fmt(bppDew + bppAnak) + ' orang\n';
  out += '•Dewasa\t\t:  ' + fmt(bppDew) + ' orang\n';
  out += '•Anak\t\t                :  ' + bppAnak + ' orang\n';
  out += '\n';
  out += zwj + 'Bapas Kelas II Tarakan      :  ' + fmt(trkDew + trkAnak) + ' orang\n';
  out += '•Dewasa\t\t: ' + fmt(trkDew) + ' orang\n';
  out += '•Anak\t\t                : ' + trkAnak + ' orang\n';

  // ---- III. LITMAS ----
  out += '\n';
  out += 'III.PENELITIAN KEMASYARAKATAN\n';
  out += '\n';

  var units = [
    { label: 'Bapas Kelas I Samarinda',  data: smr },
    { label: 'Bapas Kelas I Balikpapan', data: bpp },
    { label: 'Bapas Kelas II Tarakan',   data: trk },
  ];
  units.forEach(function(u) {
    out += u.label + '     \n';
    out += '•Permintaan Litmas\n';
    out += '1. Dewasa \t: ' + n(u.data.litmas_dew_req)  + ' orang\n';
    out += '2. Anak \t:   ' + n(u.data.litmas_anak_req) + ' orang\n';
    out += '* Penyelesaian Litmas\n';
    out += '1. Dewasa \t: ' + n(u.data.litmas_dew_done)  + ' orang\n';
    out += '2. Anak \t: '   + n(u.data.litmas_anak_done) + ' orang\n';
    out += '\n';
  });

  // ---- IV. INTEGRASI DEWASA ----
  out += 'IV.KLIEN INTEGRASI DEWASA\n';
  out += '\n';
  units.forEach(function(u) {
    out += u.label + '\n';
    out += '•Asimilasi \t: ' + n(u.data.asim_dewasa)  + ' orang\n';
    out += '•PB            \t: ' + fmt(n(u.data.pb_dewasa)) + ' orang\n';
    out += '•CB            \t: ' + n(u.data.cb_dewasa)  + ' orang\n';
    out += '•CMB         \t: ' + n(u.data.cmb_dewasa) + ' orang\n';
    out += '•CMK         \t: ' + n(u.data.cmk_dewasa) + ' orang\n';
    out += '\n';
  });

  // ---- V. INTEGRASI ANAK ----
  out += 'V.KLIEN INTEGRASI ANAK\n';
  out += '\n';
  units.forEach(function(u) {
    out += u.label + '\n';
    out += '•Asimilasi \t: ' + n(u.data.asim_anak) + ' orang\n';
    out += '•PB            \t: ' + n(u.data.pb_anak)   + ' orang\n';
    out += '•CB            \t: ' + n(u.data.cb_anak)   + ' orang\n';
    out += '\n';
  });

  // ---- VI. DIVERSI ----
  out += 'VI. PENDAMPINGAN DIVERSI DAN PERADILAN\n';
  out += '\n';
  out += zwj + 'Bapas Kelas I Samarinda : '    + n(smr.diversi) + ' orang\n';
  out += zwj + 'Bapas Kelas I Balikpapan : '   + n(bpp.diversi) + ' orang\n';
  out += zwj + 'Bapas Kelas II Tarakan      : ' + n(trk.diversi) + ' orang\n';
  out += zwj + '\n';

  // ---- VII. AKOT ----
  out += 'VII. AKOT\n';
  out += '\n';
  out += zwj + 'Bapas Kelas I Samarinda : '    + n(smr.akot) + ' orang\n';
  out += zwj + 'Bapas Kelas I Balikpapan : '   + n(bpp.akot) + ' orang\n';
  out += zwj + 'Bapas Kelas II Tarakan      : ' + n(trk.akot) + ' orang\n';

  // ---- VIII. PELATIHAN KERJA ----
  out += '\n';
  out += 'VIII. PELATIHAN KERJA\n';
  out += '\n';
  out += zwj + 'Bapas Kelas I Samarinda: '      + n(smr.latker) + ' orang\n';
  out += zwj + 'Bapas Kelas I Balikpapan : '    + n(bpp.latker) + ' orang\n';
  out += zwj + 'Bapas Kelas II Tarakan      : '  + n(trk.latker) + ' orang\n';

  // ---- IX. KLIEN SEKOLAH ----
  out += '\n';
  out += 'IX. KLIEN SEKOLAH\n';
  out += '\n';
  out += zwj + 'Bapas Kelas I Samarinda : '    + n(smr.sekolah) + ' orang\n';
  out += zwj + 'Bapas Kelas I Balikpapan :  '  + n(bpp.sekolah) + ' orang\n';
  out += zwj + 'Bapas Kelas II Tarakan      : ' + n(trk.sekolah) + ' orang\n';

  // ---- X. KLIEN BEKERJA ----
  out += '\n';
  out += 'X. KLIEN BEKERJA\n';
  out += '\n';
  out += zwj + 'Bapas Kelas I Samarinda : '    + fmt(n(smr.bekerja)) + ' orang\n';
  out += zwj + 'Bapas Kelas I Balikpapan : '   + fmt(n(bpp.bekerja)) + ' orang\n';
  out += zwj + 'Bapas Kelas II Tarakan      : ' + fmt(n(trk.bekerja)) + ' orang\n';

  // ---- XI. TERORIS ----
  out += '\n';
  out += zwj + 'XI. KLIEN TERORIS\n';
  out += '\n';
  out += zwj + 'Bapas Kelas I Samarinda : '    + n(smr.teroris) + ' orang\n';
  out += zwj + 'Bapas Kelas I Balikpapan : '   + n(bpp.teroris) + ' orang\n';
  out += zwj + 'Bapas Kelas II Tarakan      : ' + n(trk.teroris) + ' orang\n';

  // ---- XII. NARKOTIKA ----
  out += '\n';
  out += zwj + 'XII. KLIEN NARKOTIKA\n';
  out += '\n';
  out += zwj + 'Bapas Kelas I Samarinda : '    + fmt(n(smr.narkotika)) + ' orang\n';
  out += zwj + 'Bapas Kelas I Balikpapan : '   + fmt(n(bpp.narkotika)) + ' orang\n';
  out += zwj + 'Bapas Kelas II Tarakan      :  ' + fmt(n(trk.narkotika)) + ' orang\n';

  // ---- XIII. PENUTUP ----
  out += '\n';
  out += zwj + 'XIII. PENUTUP\n';
  out += zwj + '\n';
  out += zwj + 'Demikian laporan ini kami sampaikan, atas perhatian diucapkan terima kasih.\n';
  out += '\n';
  out += 'Kepala Bidang Pembimbingan Kemasyarakatan\n';
  out += '\n\n';
  out += 'ttd\n\n';
  out += nama + '\n';
  out += 'NIP. ' + nip;

  return out;
}

/* ============================================================
   MAIN: GENERATE LAPORAN
   ============================================================ */
function generateLaporan() {
  var txtSmr = document.getElementById('txt-smr').value.trim();
  var txtBpp = document.getElementById('txt-bpp').value.trim();
  var txtTrk = document.getElementById('txt-trk').value.trim();
  var errEl  = document.getElementById('err-msg');

  if (!txtSmr && !txtBpp && !txtTrk) {
    errEl.textContent = '⚠ Harap paste minimal satu laporan Bapas terlebih dahulu.';
    errEl.style.display = 'block';
    return;
  }
  errEl.style.display = 'none';

  var smr = txtSmr ? parseReport(txtSmr) : {};
  var bpp = txtBpp ? parseReport(txtBpp) : {};
  var trk = txtTrk ? parseReport(txtTrk) : {};
  var jft = buildJft();

  var hari  = document.getElementById('meta-hari').value.trim()  || getTanggalHariIni();
  var pukul = document.getElementById('meta-pukul').value.trim() || '08.00 Wita';
  var nama  = document.getElementById('meta-nama').value.trim()  || KABID_NAMA;
  var nip   = document.getElementById('meta-nip').value.trim()   || KABID_NIP;

  var result = buildLaporan(smr, bpp, trk, jft, hari, pukul, nama, nip);

  document.getElementById('result-text').textContent = result;
  var ra = document.getElementById('result-area');
  ra.style.display = 'block';
  setTimeout(function() { ra.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 150);
}

/* ============================================================
   CLEAR ALL
   ============================================================ */
function clearAll() {
  ['smr','bpp','trk'].forEach(function(id) {
    var ta = document.getElementById('txt-' + id);
    if (ta) ta.value = '';
    updateBadge(id);
    var prev = document.getElementById('prev-' + id);
    if (prev) prev.classList.remove('show');
  });
  document.getElementById('result-area').style.display = 'none';
  document.getElementById('err-msg').style.display = 'none';
}

/* ============================================================
   COPY RESULT
   ============================================================ */
function copyResult() {
  var text = document.getElementById('result-text').textContent;
  var btn  = document.querySelector('.btn-copy');
  var orig = btn.textContent;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      btn.textContent = '✅ Tersalin!';
      setTimeout(function() { btn.textContent = orig; }, 2500);
    }).catch(fallbackCopy);
  } else {
    fallbackCopy();
  }

  function fallbackCopy() {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      btn.textContent = '✅ Tersalin!';
      setTimeout(function() { btn.textContent = orig; }, 2500);
    } catch(e) {}
    document.body.removeChild(ta);
  }
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {
  // Tanggal otomatis
  var tanggal = getTanggalHariIni();
  document.getElementById('header-date').textContent = '📅 ' + tanggal;
  document.getElementById('meta-hari').value = tanggal;

  // Init JFT totals
  ['kanwil','smr','bpp','trk'].forEach(updateJftTotal);
});
