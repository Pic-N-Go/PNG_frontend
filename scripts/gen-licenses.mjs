// 오픈소스 라이선스 고지 데이터 생성기
// 사용: pnpm licenses:gen  →  src/constants/licenses.json 갱신
// prod 의존성만 대상 (앱에 실제 배포되는 코드)
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const raw = execFileSync('pnpm', ['licenses', 'list', '--json', '--prod'], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});

const byLicense = JSON.parse(raw);
const seen = new Map();

for (const [license, pkgs] of Object.entries(byLicense)) {
  for (const p of pkgs) {
    if (seen.has(p.name)) continue;
    seen.set(p.name, {
      name: p.name,
      owner: typeof p.author === 'string' && p.author.trim() ? p.author.trim() : '작성자 미표기',
      version: (p.versions ?? []).join(', '),
      license,
    });
  }
}

const libs = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
writeFileSync('src/constants/licenses.json', JSON.stringify(libs, null, 2) + '\n');
console.log(`${libs.length} packages → src/constants/licenses.json`);
