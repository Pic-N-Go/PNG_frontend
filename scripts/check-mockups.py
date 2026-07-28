#!/usr/bin/env python3
"""목업 HTML 정합성 검사. 사용법: python3 scripts/check-mockups.py [디렉터리]

기본값은 src/components/ui/community. 확인 항목:
  - 디자인 토큰 위반 (raw font-size px, #E31B59 리터럴, font-weight 700+, width=390 등)
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
    r'font-size:\s*[0-9]|font-weight:\s*(?:7|8|9)[0-9][0-9]|font-weight:\s*bold'
    r'|#[eE]31[bB]59|dv-card|dv-turn|pretendard.*jsdelivr|width=390|icons\.js')
EMOJI = re.compile('[\U0001F000-\U0001FAFF☀-➿️]')

def check(path):
    s = open(path, encoding='utf-8').read()
    d = os.path.dirname(path)
    errs = []
    for i, line in enumerate(s.splitlines(), 1):
        if VIOLATION.search(line):
            errs.append(f'{i}: 토큰/규약 위반 → {line.strip()[:80]}')
        if EMOJI.search(line):
            errs.append(f'{i}: 이모지 → {line.strip()[:80]}')
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
    files = sorted(f for f in os.listdir(target) if f.endswith('.html'))
    total = 0
    for f in files:
        errs = check(os.path.join(target, f))
        total += len(errs)
        print(f'{f:24} {"OK" if not errs else str(len(errs)) + "건"}')
        for e in errs:
            print(f'  - {e}')
    print(f'\n{"통과" if total == 0 else f"실패 {total}건"} ({len(files)}개 파일)')
    return 1 if total else 0

if __name__ == '__main__':
    sys.exit(main())
