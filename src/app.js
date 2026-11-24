/* 영어 표현 수첩 — 앱 로직 */
(function () {
  'use strict';

  var DATA = JSON.parse(document.getElementById('data').textContent);
  var STORE_KEY = 'engnote:stars:v1';
  var WEEK = ['일', '월', '화', '수', '목', '금', '토'];

  /* ── 데이터 준비 ─────────────────────── */
  var ITEMS = [];
  DATA.sessions.forEach(function (s) {
    s.items.forEach(function (it, i) {
      ITEMS.push({
        id: s.date + '-' + String(i + 1).padStart(2, '0'),
        date: s.date,
        label: s.label || '',
        kind: it.kind || '표현',
        imp: Math.max(0, Math.min(3, Math.floor(Number(it.importance)) || 0)),
        en: it.en || '',
        ko: it.ko || '',
        nuance: it.nuance || '',
        exEn: (it.example && it.example.en) || '',
        exKo: (it.example && it.example.ko) || '',
        also: it.also || [],
        note: it.note || '',
        mine: it.mine || ''
      });
    });
  });
  ITEMS.sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.id < b.id ? -1 : 1;
  });

  var SESSION_LABEL = {};
  DATA.sessions.forEach(function (s) { SESSION_LABEL[s.date] = s.label || ''; });

  function loadStars() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function saveStars() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(stars)); } catch (e) {}
  }

  var stars = loadStars();
  var state = { tab: 'all', q: '', date: 'all', open: {} };

  /* ── DOM ─────────────────────────────── */
  var elList = document.getElementById('list');
  var elEmpty = document.getElementById('empty');
  var elEmptyTxt = document.getElementById('emptyTxt');
  var elTabs = document.getElementById('tabs');
  var elDates = document.getElementById('dates');
  var elSearch = document.getElementById('searchWrap');
  var elQ = document.getElementById('q');
  var elClear = document.getElementById('clear');
  var elFootCount = document.getElementById('footCount');
  var elBuilt = document.getElementById('built');

  var KIND_CLASS = { '표현': '', '단어': 'voca', '숙어': 'idiom', '문장': 'sent' };
  var IMP_LABEL = { 1: '가끔 쓰는 표현', 2: '자주 쓰는 표현', 3: '핵심 표현' };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function hl(text) {
    var safe = esc(text);
    if (!state.q) return safe;
    var re = new RegExp('(' + escRe(esc(state.q)) + ')', 'ig');
    return safe.replace(re, '<mark>$1</mark>');
  }

  function isStar(id) { return stars.indexOf(id) !== -1; }

  function dateLabel(d) {
    var p = d.split('-');
    var dt = new Date(+p[0], +p[1] - 1, +p[2]);
    var today = new Date();
    var sameYear = today.getFullYear() === +p[0];
    var head = sameYear ? (+p[1] + '.' + p[2]) : (p[0] + '.' + p[1] + '.' + p[2]);
    return head + ' (' + WEEK[dt.getDay()] + ')';
  }

  function hits(it) {
    var q = state.q.trim().toLowerCase();
    if (!q) return true;
    var hay = [it.en, it.ko, it.nuance, it.exEn, it.exKo, it.note].join(' ');
    it.also.forEach(function (a) { hay += ' ' + a.en + ' ' + a.ko; });
    return hay.toLowerCase().indexOf(q) !== -1;
  }

  function visible() {
    return ITEMS.filter(function (it) {
      if (state.tab === 'star' && !isStar(it.id)) return false;
      if (state.tab === 'date' && state.date !== 'all' && it.date !== state.date) return false;
      return hits(it);
    });
  }

  /* ── 카드 ─────────────────────────────── */
  function card(it) {
    var kind = it.kind;
    var isSent = kind === '문장';
    var cls = 'card' + (isSent ? ' sent' : '') + (state.open[it.id] ? ' open' : '');
    var h = '<article class="' + cls + '" data-id="' + it.id + '" role="button" tabindex="0" aria-expanded="' + (state.open[it.id] ? 'true' : 'false') + '">';

    h += '<button class="star' + (isStar(it.id) ? ' on' : '') + '" data-star="' + it.id + '" aria-pressed="' + (isStar(it.id) ? 'true' : 'false') + '" aria-label="중요 표시">' + (isStar(it.id) ? '★' : '☆') + '</button>';

    h += '<div class="row1">';
    if (it.imp) {
      var impStars = new Array(it.imp + 1).join('★');
      h += '<span class="imp i' + it.imp + '" role="img" aria-label="중요도 ' + it.imp + '단계 · ' + IMP_LABEL[it.imp] + '" title="중요도 ' + it.imp + '/3 · ' + IMP_LABEL[it.imp] + '">' + impStars + '</span>';
    }
    h += '<span class="badge ' + (KIND_CLASS[kind] || '') + '">' + esc(kind) + '</span><span class="meta">' + dateLabel(it.date) + '</span></div>';
    h += '<h2>' + hl(it.en) + '</h2>';
    h += '<p class="ko">' + hl(it.ko) + '</p>';
    if (it.nuance) h += '<p class="nuance">' + hl(it.nuance) + '</p>';

    if (it.exEn || it.exKo) {
      h += '<div class="ex">';
      if (it.exEn) h += '<p class="en">' + hl(it.exEn) + '</p>';
      if (it.exKo) h += '<p class="tr">' + hl(it.exKo) + '</p>';
      h += '</div>';
    }

    if (it.also.length) {
      h += '<div class="also"><span class="lb">함께 쓰는</span>';
      it.also.forEach(function (a) {
        h += '<span class="chip"><b>' + hl(a.en) + '</b>';
        if (a.ko) h += ' <span>·</span> ' + hl(a.ko);
        h += '</span>';
      });
      h += '</div>';
    }

    if (it.note || it.mine) {
      h += '<div class="more">';
      if (it.note) h += '<p><span class="k">메모</span>' + hl(it.note) + '</p>';
      if (it.mine) h += '<p><span class="k">내가 쓴 문장 → 첨삭</span><span class="mine">' + hl(it.mine) + '</span></p>';
      h += '</div>';
    }

    h += '</article>';
    return h;
  }

  /* ── 렌더 ─────────────────────────────── */
  function render() {
    var list = visible();
    var out = '';

    if (!list.length) {
      elList.innerHTML = '';
      elEmpty.classList.add('on');
      if (state.q.trim()) {
        elEmptyTxt.innerHTML = '<b>' + esc(state.q.trim()) + '</b> 검색 결과가 없어요.<br>다른 표현으로 찾아보세요.';
      } else if (state.tab === 'star') {
        elEmptyTxt.innerHTML = '아직 중요 표시한 표현이 없어요.<br>카드 오른쪽 <b>☆</b>를 눌러 모아 두세요.';
      } else {
        elEmptyTxt.innerHTML = '아직 담긴 표현이 없어요.';
      }
    } else {
      elEmpty.classList.remove('on');
      if (state.tab === 'date') {
        var last = null;
        list.forEach(function (it) {
          if (it.date !== last) {
            var n = list.filter(function (x) { return x.date === it.date; }).length;
            out += '<div class="dayhead"><span class="d">' + dateLabel(it.date) + '</span>' +
                   '<span class="l">' + esc(SESSION_LABEL[it.date] || '') + '</span>' +
                   '<span class="n">' + n + '개</span></div>';
            last = it.date;
          }
          out += card(it);
        });
      } else {
        list.forEach(function (it) { out += card(it); });
      }
      elList.innerHTML = out;
    }

    updateCounts();

    // 날짜 스트립
    var dates = [];
    ITEMS.forEach(function (it) { if (dates.indexOf(it.date) === -1) dates.push(it.date); });
    if (state.tab === 'date' && dates.length > 1) {
      elDates.classList.add('on');
      var dh = '<button data-date="all" aria-pressed="' + (state.date === 'all') + '">전체</button>';
      dates.forEach(function (d) {
        dh += '<button data-date="' + d + '" aria-pressed="' + (state.date === d) + '">' + dateLabel(d) + '</button>';
      });
      elDates.innerHTML = dh;
    } else {
      elDates.classList.remove('on');
      elDates.innerHTML = '';
    }

    // 검색창 상태
    elSearch.classList.toggle('has', !!state.q);

    // 푸터
    var exprs = ITEMS.filter(function (i) { return i.kind !== '문장'; }).length;
    var sents = ITEMS.filter(function (i) { return i.kind === '문장'; }).length;
    elFootCount.textContent = '표현 ' + exprs + ' · 문장 ' + sents;
    elBuilt.textContent = (DATA.updated || '').replace(/-/g, '.');
  }

  function updateCounts() {
    var cAll = elTabs.querySelector('[data-tab="all"] .cnt');
    var cStar = elTabs.querySelector('[data-tab="star"] .cnt');
    if (cAll) cAll.textContent = ITEMS.length;
    if (cStar) cStar.textContent = stars.length;
  }

  function setTab(tab) {
    state.tab = tab;
    if (tab !== 'date') state.date = 'all';
    Array.prototype.forEach.call(elTabs.querySelectorAll('button'), function (b) {
      b.setAttribute('aria-selected', b.dataset.tab === tab ? 'true' : 'false');
    });
    render();
  }

  /* ── 이벤트 ───────────────────────────── */
  elTabs.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-tab]');
    if (b) setTab(b.dataset.tab);
  });

  elDates.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-date]');
    if (!b) return;
    state.date = b.dataset.date;
    render();
  });

  elList.addEventListener('click', function (e) {
    var st = e.target.closest('[data-star]');
    if (st) {
      e.preventDefault();
      e.stopPropagation();
      var id = st.dataset.star;
      var i = stars.indexOf(id);
      if (i === -1) stars.push(id); else stars.splice(i, 1);
      saveStars();
      var on = i === -1;
      st.classList.toggle('on', on);
      st.setAttribute('aria-pressed', on ? 'true' : 'false');
      st.textContent = on ? '★' : '☆';
      updateCounts();
      if (state.tab === 'star') render();
      return;
    }
    var c = e.target.closest('.card');
    if (!c) return;
    toggleCard(c);
  });

  function toggleCard(c) {
    var cid = c.dataset.id;
    if (state.open[cid]) delete state.open[cid]; else state.open[cid] = true;
    var open = !!state.open[cid];
    c.classList.toggle('open', open);
    c.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  elList.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var c = e.target.closest('.card');
    if (!c) return;
    e.preventDefault();
    toggleCard(c);
  });

  var t = null;
  elQ.addEventListener('input', function () {
    clearTimeout(t);
    var v = elQ.value;
    t = setTimeout(function () { state.q = v; render(); }, 90);
  });
  elQ.addEventListener('search', function () { state.q = elQ.value; render(); });

  elClear.addEventListener('click', function () {
    elQ.value = '';
    state.q = '';
    render();
    elQ.focus();
  });

  setTab('all');
})();
