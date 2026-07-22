#!/usr/bin/env node
/**
 * generate-filelist.js
 * ./src/components/ui 아래 .html 파일을 스캔해 ./src/html/filelist.html 생성
 * 실행: node scripts/generate-filelist.js
 */

const fs = require('fs');
const path = require('path');

const SCAN_ROOT  = path.resolve(__dirname, '../src/components/ui');
const OUT_DIR    = path.resolve(__dirname, '../src/html');
const OUT_FILE   = path.join(OUT_DIR, 'filelist.html');
const DATA_FILE  = path.resolve(__dirname, 'filelist-data.json');
const EXCLUDE    = new Set(['filelist.html', 'index.html']);
const TODAY      = new Date().toISOString().slice(0, 10);

/* filelist-data.json 로드 (없으면 빈 객체) */
const fileData = fs.existsSync(DATA_FILE)
  ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  : {};

/* ── 분류 맵 ── */
const CATEGORY_KO = {
  auth:       '인증',
  community:  '커뮤니티',
  home:       '홈',
  mypage:     '마이페이지',
  spot:       '스팟',
  travel:     '여행',
  wishlist:   '위시리스트',
};

/* 소분류: 폴더+파일명 기반 */
function subCategory(folder, base) {
  const map = {
    'auth/login':                  '로그인',
    'auth/signup':                 '회원가입',
    'auth/oauth-onboarding':       'OAuth 온보딩',
    'community/community-feed':    '피드',
    'community/community-post':    '게시글 상세',
    'community/community-write':   '게시글 작성',
    'home/home':                   '홈',
    'home/map':                    '지도',
    'mypage/mypage':               '마이페이지',
    'mypage/profile-edit':         '프로필 편집',
    'mypage/notification':         '알림',
    'mypage/follow':               '팔로우',
    'mypage/photo-map':            '포토맵',
    'mypage/my-photos':            '내 사진',
    'mypage/my-reviews':           '내 리뷰',
    'mypage/setting':              '설정',
    'mypage/inquiry-list':         '1:1 문의 목록',
    'mypage/inquiry-detail':       '1:1 문의 상세',
    'mypage/inquiry-write':        '1:1 문의 작성',
    'mypage/faq':                  '자주 묻는 질문',
    'mypage/terms':                '이용약관',
    'mypage/privacy':              '개인정보 처리방침',
    'mypage/licenses':             '오픈소스 라이선스',
    'spot/spot-list':              '목록',
    'spot/spot-detail':            '상세',
    'spot/spot-change':            '수정',
    'spot/spot-register':          '등록',
    'spot/review-write':           '리뷰 작성',
    'travel/travel-list':          '코스 목록',
    'travel/travel-new':           '코스 생성',
    'travel/travel-plan':          '코스 상세',
    'wishlist/wishlist':           '위시리스트',
    'wishlist/wishlist-setting':   '위시리스트 설정',
  };
  return map[`${folder}/${base}`] || base;
}

/* 담당자 맵 */
const ASSIGNEE = {
  'auth/login':                '박예은',
  'auth/signup':               '박예은',
  'auth/oauth-onboarding':     '박예은',
  'community/community-feed':  '소영재',
  'community/community-post':  '소영재',
  'community/community-write': '소영재',
  'home/home':                 '박예은',
  'home/map':                  '박예은',
  'mypage/follow':             '이예인',
  'mypage/my-photos':          '모정민',
  'mypage/my-reviews':         '모정민',
  'mypage/mypage':             '모정민',
  'mypage/faq':                '박예은',
  'mypage/terms':              '박예은',
  'mypage/privacy':            '박예은',
  'mypage/licenses':           '박예은',
  'mypage/notification':       '모정민',
  'mypage/photo-map':          '모정민',
  'mypage/profile-edit':       '모정민',
  'mypage/setting':            '전체',
  'spot/photo-detail':         '소영재',
  'spot/review-write':         '박예은',
  'spot/spot-change':          '모정민',
  'spot/spot-detail':          '박예은',
  'spot/spot-list':            '이예인',
  'spot/spot-register':        '소영재',
  'travel/travel-list':        '모정민',
  'travel/travel-new':         '모정민',
  'travel/travel-plan':        '모정민',
  'wishlist/wishlist':         '모정민',
  'wishlist/wishlist-setting': '모정민',
};

/* 상태 → CSS 클래스 */
function statusClass(s) {
  if (s === '완료')  return 'done';
  if (s === '진행중') return 'wip';
  return 'todo';
}

/* 구분 판별: 파일명/경로에 modal 포함 → MODAL, 아니면 PAGE */
function pageType(folder, filename) {
  if (/modal/i.test(filename) || /modal/i.test(folder)) return 'MODAL';
  return 'PAGE';
}

/* ── 파일 스캔 ── */
function scan(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...scan(full));
    } else if (entry.name.endsWith('.html') && !EXCLUDE.has(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

const files = scan(SCAN_ROOT).sort();

/* filelist.html → scanRoot 상대경로 계산용 */
const relBase = path.relative(OUT_DIR, SCAN_ROOT); // '../../src/components/ui' 아니라 '../components/ui'

const rows = files.map(fp => {
  const rel      = path.relative(SCAN_ROOT, fp);          // e.g. auth/login.html
  const parts    = rel.split(path.sep);
  const folder   = parts.slice(0, -1).join('/');           // e.g. auth
  const filename = parts[parts.length - 1];
  const base     = filename.replace('.html', '');
  const href     = path.join(relBase, rel).replace(/\\/g, '/'); // Windows 호환

  return {
    cat1: CATEGORY_KO[folder] || folder,
    cat2: folder,
    cat3: subCategory(folder, base),
    type: pageType(folder, filename),
    assignee: ASSIGNEE[`${folder}/${base}`] || '',
    href,
    filename,
    rel,
    ...{ uiStatus: '미시작', apiStatus: '미시작', date: '', note: '' },
    ...(fileData[rel.replace(/\\/g, '/')] ?? {}),
  };
});

/* ── HTML 생성 ── */
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function rowHtml(r) {
  const typeBadge = r.type === 'MODAL'
    ? `<span class="badge badge--modal">MODAL</span>`
    : `<span class="badge badge--page">PAGE</span>`;
  return `
    <tr>
      <td>${escapeHtml(r.cat1)}</td>
      <td>${escapeHtml(r.cat2)}</td>
      <td>${escapeHtml(r.cat3)}</td>
      <td>${typeBadge}</td>
      <td><a href="${r.href}" target="_blank" rel="noopener">${escapeHtml(r.rel.replace(/\\/g, '/'))}</a></td>
      <td>${escapeHtml(r.assignee)}</td>
      <td><span class="status status--${statusClass(r.uiStatus)}">${escapeHtml(r.uiStatus)}</span></td>
      <td><span class="status status--${statusClass(r.apiStatus)}">${escapeHtml(r.apiStatus)}</span></td>
      <td>${escapeHtml(r.date)}</td>
      <td>${escapeHtml(r.note)}</td>
    </tr>`;
}

const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PNG 퍼블리싱 파일 목록</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, 'Pretendard Variable', 'Pretendard', sans-serif;
      font-size: 14px;
      background: #f5f5f7;
      color: #1c1c1e;
      padding: 32px 24px 64px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.4px;
      margin-bottom: 4px;
    }
    .meta {
      font-size: 12px;
      color: rgba(0,0,0,0.4);
      margin-bottom: 24px;
    }
    /* 필터 */
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }
    .filter-btn {
      padding: 5px 14px;
      border-radius: 20px;
      border: 1px solid rgba(0,0,0,0.12);
      background: #fff;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .filter-btn.is-active, .filter-btn:hover {
      background: #000;
      color: #fff;
      border-color: #000;
    }
    /* 테이블 래퍼 */
    .table-wrap {
      overflow-x: auto;
      border-radius: 14px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      min-width: 760px;
    }
    thead th {
      background: #f5f5f7;
      padding: 11px 14px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: rgba(0,0,0,0.45);
      letter-spacing: 0.2px;
      border-bottom: 1px solid rgba(0,0,0,0.07);
      white-space: nowrap;
    }
    tbody tr {
      border-bottom: 1px solid rgba(0,0,0,0.05);
      transition: background 0.1s;
    }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: #fafafa; }
    tbody td {
      padding: 11px 14px;
      vertical-align: middle;
      white-space: nowrap;
    }
    tbody td:nth-child(10) { color: rgba(0,0,0,0.3); font-style: italic; }
    a {
      color: #e31b59;
      text-decoration: none;
      font-weight: 500;
    }
    a:hover { text-decoration: underline; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .badge--page  { background: rgba(52,199,89,0.12);  color: #1a7a35; }
    .badge--modal { background: rgba(255,159,10,0.12); color: #a05a00; }
    .status {
      font-size: 12px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .status--todo { background: rgba(0,0,0,0.05); color: rgba(0,0,0,0.35); }
    .status--wip  { background: rgba(255,159,10,0.12); color: #a05a00; }
    .status--done { background: rgba(52,199,89,0.12);  color: #1a7a35; }
    .summary {
      margin-top: 16px;
      font-size: 13px;
      color: rgba(0,0,0,0.4);
    }
    @media (max-width: 600px) {
      body { padding: 20px 12px 48px; }
      h1 { font-size: 18px; }
    }
  </style>
</head>
<body>
  <h1>PNG 퍼블리싱 파일 목록</h1>
  <p class="meta">생성일: ${TODAY} · 총 ${rows.length}개 파일 · 스캔 루트: src/components/ui</p>

  <div class="filters">
    <button class="filter-btn is-active" onclick="filterAll(this)">전체</button>
    ${[...new Set(rows.map(r => r.cat1))].map(c =>
      `<button class="filter-btn" onclick="filterCat(this,'${c}')">${c}</button>`
    ).join('\n    ')}
  </div>

  <div class="table-wrap">
    <table id="fileTable">
      <thead>
        <tr>
          <th>대분류</th>
          <th>중분류</th>
          <th>소분류</th>
          <th>구분</th>
          <th>경로/파일명</th>
          <th>담당자</th>
          <th>UI 작업여부</th>
          <th>API 연동여부</th>
          <th>최종작업일</th>
          <th>비고</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(rowHtml).join('')}
      </tbody>
    </table>
  </div>
  <p class="summary" id="summary">표시: ${rows.length}개</p>

  <script>
    function filterAll(btn) {
      setActive(btn);
      document.querySelectorAll('#fileTable tbody tr').forEach(tr => tr.style.display = '');
      updateSummary();
    }
    function filterCat(btn, cat) {
      setActive(btn);
      let count = 0;
      document.querySelectorAll('#fileTable tbody tr').forEach(tr => {
        const show = tr.children[0].textContent.trim() === cat;
        tr.style.display = show ? '' : 'none';
        if (show) count++;
      });
      updateSummary(count);
    }
    function setActive(btn) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
    }
    function updateSummary(n) {
      const total = document.querySelectorAll('#fileTable tbody tr').length;
      document.getElementById('summary').textContent = '표시: ' + (n ?? total) + '개';
    }

    /* ── broken link 체크 (콘솔 출력) ── */
    (function checkLinks() {
      if (window.location.protocol === 'file:') {
        console.info('[filelist] file:// 환경에서는 링크 검증을 건너뜁니다. Live Server 등 로컬 서버 사용 시 검증됩니다.');
        return;
      }
      const links = document.querySelectorAll('a[target="_blank"]');
      const broken = [];
      let checked = 0;
      links.forEach(a => {
        fetch(a.href, { method: 'HEAD', cache: 'no-store' })
          .then(res => { if (!res.ok) broken.push(a.href); })
          .catch(() => broken.push(a.href))
          .finally(() => {
            checked++;
            if (checked === links.length) {
              if (broken.length) {
                console.warn('[filelist] Broken links (' + broken.length + '):');
                broken.forEach(u => console.warn(' ✗', u));
              } else {
                console.info('[filelist] 링크 검증 완료 — broken link 없음 (' + links.length + '개)');
              }
            }
          });
      });
    })();
  </script>
</body>
</html>`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, html, 'utf8');

console.log(`\n✓ 생성 완료: ${OUT_FILE}`);
console.log(`  파일 수: ${rows.length}개`);
rows.forEach(r => console.log(`  - ${r.rel}`));
