#!/usr/bin/env python3
"""목업 HTML·CSS 정합성 검사. 사용법: python3 scripts/check-mockups.py [디렉터리]

기본값은 src/components/ui/community. 정당한 예외 줄에는 `token-exempt` 주석을 답니다.
확인 항목:
  - 디자인 토큰 위반 (raw font-size px, #E31B59 리터럴, font-weight 700+, width=390 등)
  - 토큰과 값이 정확히 같은 raw 리터럴 (color/border/surface) — 중간톤 값은 허용
  - 이모지
  - 태그 균형 / button 중첩 / 중복 id
  - onclick이 부르는 함수가 같은 파일에 정의돼 있는지
  - 정의만 되고 호출되지 않는 함수 (도달 불가 상태)
  - openSheet/closeSheet/openModal/closeModal/showToast 대상 id 존재
  - location.href 대상 파일 존재
  - img alt 누락
"""
import os, re, sys

TAGS = ('div', 'button', 'span', 'svg', 'textarea')
VIOLATION = re.compile(
    r'font-size:\s*[1-9]|font-weight:\s*(?:7|8|9)[0-9][0-9]|font-weight:\s*bold'
    r'|#[eE]31[bB]59|dv-card|dv-turn|pretendard.*jsdelivr|width=390')
EMOJI = re.compile('[\U0001F000-\U0001FAFF☀-➿️]')
# 정당한 예외에만 붙이는 이스케이프 해치 (예: html rem 기준값)
EXEMPT = re.compile(r'token-exempt')

# 토큰과 값이 정확히 같은 raw 리터럴 → 토큰으로 써야 함 (값이 다른 중간톤은 허용)
TOKEN_DUPES = [
    (re.compile(r'color:\s*rgba\(0,\s*0,\s*0,\s*0\.4\)'), '--color-text-secondary'),
    (re.compile(r'color:\s*rgba\(0,\s*0,\s*0,\s*0\.3\)'), '--color-text-tertiary'),
    (re.compile(r'border[a-z-]*:\s*[0-9.]+px solid rgba\(0,\s*0,\s*0,\s*0\.08\)'), '--color-border'),
    (re.compile(r'border[a-z-]*:\s*[0-9.]+px solid rgba\(0,\s*0,\s*0,\s*0\.06\)'), '--color-border-light'),
    (re.compile(r'background:\s*#f5f5f7\b', re.I), '--color-surface'),
]

def check(path):
    s = open(path, encoding='utf-8').read()
    d = os.path.dirname(path)
    errs = []
    for i, line in enumerate(s.splitlines(), 1):
        if EXEMPT.search(line):
            continue
        if VIOLATION.search(line):
            errs.append(f'{i}: 토큰/규약 위반 → {line.strip()[:80]}')
        if EMOJI.search(line):
            errs.append(f'{i}: 이모지 → {line.strip()[:80]}')
        for pat, token in TOKEN_DUPES:
            if pat.search(line):
                errs.append(f'{i}: 토큰과 같은 raw 값 → var({token}) 사용: {line.strip()[:70]}')
    for t in TAGS:
        o, c = len(re.findall(r'<%s\b' % t, s)), len(re.findall(r'</%s>' % t, s))
        if o != c:
            errs.append(f'<{t}> 태그 불균형: 열림 {o} / 닫힘 {c}')
    if re.search(r'<button\b[^>]*>(?:(?!</button>).)*<button\b', s, re.S):
        errs.append('button 안에 button 중첩 (클릭 처리 깨짐)')
    ids = re.findall(r'id="([\w-]+)"', s)
    for i in sorted({x for x in ids if ids.count(x) > 1}):
        errs.append(f'중복 id: {i}')
    defined = set(re.findall(r'function (\w+)', s))
    for fn in sorted(set(re.findall(r'onclick="(\w+)\(', s)) - defined - {'history'}):
        errs.append(f'정의 없는 핸들러: {fn}()')
    for fn in sorted(f for f in defined if s.count(f + '(') <= 1):
        errs.append(f'호출되지 않는 함수 (도달 불가 상태): {fn}()')
    for tid in sorted(set(re.findall(
            r"(?:openSheet|closeSheet|openModal|closeModal|showToast)\('([\w-]+)'", s)) - set(ids)):
        errs.append(f'존재하지 않는 대상 id: {tid}')
    for href in sorted(set(re.findall(r"location\.href\s*=\s*'([^']+)'", s))):
        if not os.path.isfile(os.path.join(d, href.split('?')[0])):
            errs.append(f'없는 링크 대상: {href}')
    for tag in re.findall(r'<img\b[^>]*>', s):
        if 'alt=' not in tag:
            errs.append(f'alt 누락: {tag[:70]}')
    return errs

def main():
    target = sys.argv[1] if len(sys.argv) > 1 else 'src/components/ui/community'
    files = sorted(os.path.join(r, f) for r, _, fs in os.walk(target)
                   for f in fs if f.endswith(('.html', '.css')))
    # 대상이 0개면 통과가 아니라 실패 — 경로 오타가 초록불로 보이면 게이트가 무의미하다
    if not files:
        print(f'검사 대상 없음: {target}')
        return 1
    total = 0
    for path in files:
        errs = check(path)
        total += len(errs)
        print(f'{os.path.relpath(path, target):32} {"OK" if not errs else str(len(errs)) + "건"}')
        for e in errs:
            print(f'  - {e}')
    print(f'\n{"통과" if total == 0 else f"실패 {total}건"} ({len(files)}개 파일)')
    return 1 if total else 0

if __name__ == '__main__':
    sys.exit(main())
