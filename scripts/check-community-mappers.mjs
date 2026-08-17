// 커뮤니티 매퍼 자체 점검. 테스트 러너가 없는 저장소라 프레임워크 없이 assert만 쓴다.
//   node scripts/check-community-mappers.mjs
// 매퍼는 타입 import만 하므로(런타임 의존 없음) tsc로 단독 컴파일해서 그대로 불러온다.
// 타입 해석 오류(@/ 경로)는 emit을 막지 않으므로 무시한다 — 타입 검사는 `npx tsc --noEmit`이 따로 한다.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const outDir = mkdtempSync(join(tmpdir(), 'png-mapcheck-'));
try {
  execFileSync(
    'npx',
    ['tsc', 'src/utils/communityMappers.ts', '--outDir', outDir, '--module', 'esnext', '--target', 'es2022', '--skipLibCheck'],
    { stdio: 'pipe' },
  );
} catch {
  // 경로 별칭 미해석으로 인한 비정상 종료 — 아래 import가 실패하면 그때 진짜 문제다.
}

const m = await import(pathToFileURL(join(outDir, 'communityMappers.js')).href);

// ── initialsOf ──────────────────────────────────────────────────────────
assert.equal(m.initialsOf('sunset_jk'), 'SU');
assert.equal(m.initialsOf('김지우'), '김');
assert.equal(m.initialsOf('  '), '?', '공백만 있는 닉네임도 빈 아바타가 되면 안 된다');

// ── formatRelativeTime ──────────────────────────────────────────────────
// 서버 LocalDateTime은 오프셋 없는 "서버 로컬 시각"이다. toISOString()은 UTC라
// 한국(+9)에서 9시간 어긋나므로, 서버가 보내는 형태 그대로 로컬 시각을 만든다.
const pad = (n) => String(n).padStart(2, '0');
const ago = (ms) => {
  const d = new Date(Date.now() - ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
assert.equal(m.formatRelativeTime(ago(30 * 1000)), '방금');
assert.equal(m.formatRelativeTime(ago(5 * 60 * 1000)), '5분 전');
assert.equal(m.formatRelativeTime(ago(90 * 60 * 1000)), '1시간 전');
assert.equal(m.formatRelativeTime(ago(3 * 24 * 3600 * 1000)), '3일 전');
assert.match(m.formatRelativeTime(ago(40 * 24 * 3600 * 1000)), /^\d{4}\.\d{2}\.\d{2}$/);
assert.equal(m.formatRelativeTime(null), '');
assert.equal(m.formatRelativeTime('not-a-date'), '', '파싱 실패가 NaN 문자열로 새어나오면 안 된다');

// ── mapPost ─────────────────────────────────────────────────────────────
const dto = {
  id: 7,
  content: '광안리 일출',
  spotId: 3,
  spotName: '광안리 해수욕장',
  shootingTime: '05:30:00',
  weather: 'CLEAR',
  cameraModel: 'Sony A7IV',
  lensModel: '24mm f/2.8',
  tags: ['일출/일몰'],
  author: { id: 42, nickname: 'sunset_jk', profileImageUrl: null },
  images: [{ id: 1, imageUrl: 'https://cdn/1.jpg', width: 100, height: 80 }],
  likeCount: 248,
  commentCount: 32,
  bookmarkCount: 5,
  liked: true,
  bookmarked: false,
  createdAt: ago(2 * 3600 * 1000),
  updatedAt: ago(2 * 3600 * 1000),
};

const post = m.mapPost(dto, { myUserId: 42, followingIds: new Set(['99']) });
assert.equal(post.id, '7');
assert.equal(post.isMine, true, '작성자 id가 내 id와 같으면 내 글이다');
assert.deepEqual(post.imageUrls, ['https://cdn/1.jpg']);
assert.equal(post.location, '광안리 해수욕장');
assert.equal(post.isLiked, true);
assert.equal(post.isSaved, false);
assert.equal(post.isFollowingAuthor, false, '팔로잉 집합에 없는 작성자는 팔로우 중이 아니다');
assert.equal(post.photogenicScore, undefined, '서버에 없는 점수를 만들어내면 안 된다');
assert.deepEqual(post.shotMeta, {
  time: '05:30',
  weather: '맑음',
  weatherIcon: 'clear-day',
  gear: 'Sony A7IV · 24mm f/2.8',
});

const guestPost = m.mapPost(dto, {});
assert.equal(guestPost.isMine, false, '비로그인이면 어떤 글도 내 글이 아니다');

// 색은 id 기준 결정값이어야 한다 — 렌더마다 바뀌면 카드가 깜빡인다.
assert.deepEqual(m.mapPost(dto, {}).photoGradient, m.mapPost(dto, {}).photoGradient);

// 촬영 정보가 하나도 없으면 블록 자체를 띄우지 않는다.
const bare = m.mapPost({ ...dto, shootingTime: null, weather: null, cameraModel: null, lensModel: null, spotName: null });
assert.equal(bare.shotMeta, undefined);
assert.equal(bare.location, '');

// 렌즈만 있는 경우 gear에 구분점이 남으면 안 된다.
const lensOnly = m.mapPost({ ...dto, shootingTime: null, weather: null, cameraModel: null });
assert.equal(lensOnly.shotMeta.gear, '24mm f/2.8');
assert.equal(lensOnly.shotMeta.time, '');

// ── mapExif ─────────────────────────────────────────────────────────────
const exif = m.mapExif(
  { imageId: 1, cameraModel: 'ILCE-7M4', lensModel: null, iso: 100, fNumber: 'f/2.8', exposureTime: '1/500',
    focalLength: '24', exposureMode: null, meteringMode: null, whiteBalance: null, flash: null,
    focalLength35mm: null, software: null, latitude: 35.15, longitude: 129.11,
    fileSize: 8_808_038, fileFormat: 'JPEG', fileName: 'DSC03421.JPG' },
  '05:30:00',
);
assert.equal(exif.camera, 'ILCE-7M4');
assert.equal(exif.lens, undefined, 'null은 undefined로 접어서 행을 숨긴다');
assert.equal(exif.fileSize, '8.4 MB');
assert.equal(exif.shotAtLabel, '05:30 촬영');
assert.equal(m.mapExif(undefined, '05:30').shotAtLabel, '05:30 촬영', 'EXIF가 없어도 촬영 시각은 보여준다');
assert.deepEqual(m.mapExif(undefined, null), {});

// ── mapComment ──────────────────────────────────────────────────────────
const comment = m.mapComment(
  { id: 5, content: '좋네요', author: { id: 42, nickname: 'me_kim', profileImageUrl: null }, createdAt: ago(60 * 1000), updatedAt: ago(60 * 1000) },
  42,
);
assert.equal(comment.isMine, true);
assert.equal(comment.likeCount, undefined, '댓글 좋아요는 서버에 없으므로 비어 있어야 한다');
assert.equal(comment.author.initials, 'ME');

console.log('communityMappers: 모든 점검 통과');
