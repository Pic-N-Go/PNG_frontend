/**
 * 입력 형식 규칙. 서버 검증과 짝을 이루므로 한쪽만 고치면 안 된다 —
 * 닉네임은 `SignUpRequest` · `UserProfileUpdateRequest`의 `@Pattern`과 같은 값이어야 한다.
 */

/** 한글/영문/숫자 2~10자. 특수문자·공백 불가. */
export const NICK_RE = /^[가-힣a-zA-Z0-9]{2,10}$/;
export const NICK_MIN = 2;
export const NICK_MAX = 10;
export const NICK_HELP = `한글/영문/숫자 ${NICK_MIN}~${NICK_MAX}자, 특수문자 불가`;

/**
 * 닉네임이 왜 안 되는지 알려준다. 통과하면 null.
 *
 * "사용할 수 없는 닉네임이에요" 한 문장으로 뭉치면 사용자가 뭘 고쳐야 할지 알 수 없다 —
 * 한 글자를 더 써야 하는지, 밑줄을 빼야 하는지가 전혀 다른 행동이다.
 * 중복은 서버에 물어봐야 알 수 있으므로 여기서 판단하지 않는다.
 */
export function nicknameError(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return '닉네임을 입력해 주세요';
  if (trimmed.length < NICK_MIN) return `${NICK_MIN}자 이상 입력해 주세요`;
  // 입력창의 maxLength가 먼저 막지만, 붙여넣기나 호출부가 빠뜨린 경우를 대비해 남긴다.
  if (trimmed.length > NICK_MAX) return `${NICK_MAX}자까지 쓸 수 있어요`;
  if (/\s/.test(trimmed)) return '공백은 쓸 수 없어요';
  if (!NICK_RE.test(trimmed)) return '한글·영문·숫자만 쓸 수 있어요';
  return null;
}

/** 비밀번호. 서버 SignUpRequest·PasswordChangeRequest의 @Size(min = 8, max = 64)와 같다. */
export const PW_MIN = 8;
export const PW_MAX = 64;

/**
 * 비밀번호가 왜 안 되는지 알려준다. 통과하면 null.
 * 회원가입의 강도 바(4단계)와 같은 기준선을 쓴다 — 강도 2단계 = 여기서 null.
 */
export function passwordError(value: string): string | null {
  if (value.length === 0) return '비밀번호를 입력해 주세요';
  if (value.length < PW_MIN) return `${PW_MIN}자 이상 입력해 주세요`;
  if (value.length > PW_MAX) return `${PW_MAX}자까지 쓸 수 있어요`;
  if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) return '영문과 숫자를 함께 써주세요';
  return null;
}

// ponytail: dev 전용 self-check — 서버 @Pattern과 어긋나면 여기서 먼저 걸린다 (프로덕션 no-op)
if (__DEV__) {
  console.assert(NICK_RE.test('사진가2'), '한글+숫자 조합이 통과해야 한다');
  console.assert(!NICK_RE.test('a'), '2자 미만은 막아야 한다');
  console.assert(!NICK_RE.test('a'.repeat(NICK_MAX + 1)), `${NICK_MAX}자 초과는 막아야 한다`);
  console.assert(!NICK_RE.test('sun set'), '공백은 막아야 한다');
  console.assert(!NICK_RE.test('sun_set'), '특수문자는 막아야 한다');
  // 사유 문구가 실제로 갈라지는지 — 전부 같은 문장이면 이 기능이 없는 것과 같다.
  console.assert(nicknameError('사진가2') === null, '정상 닉네임은 사유가 없어야 한다');
  console.assert(nicknameError('김') !== nicknameError('sun_set'), '길이와 문자 사유가 달라야 한다');
  console.assert(nicknameError('sun set') !== nicknameError('sun_set'), '공백과 특수문자 사유가 달라야 한다');
  console.assert(passwordError('abcd1234') === null, '영문+숫자 8자는 통과해야 한다');
  console.assert(passwordError('abcd123') !== null, '8자 미만은 막아야 한다');
  console.assert(passwordError('abcdefgh') !== null, '숫자가 없으면 막아야 한다');
  console.assert(passwordError('12345678') !== null, '영문이 없으면 막아야 한다');
}
