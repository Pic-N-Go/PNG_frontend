import { Platform, Share } from 'react-native';

interface ShareContent {
  /** Android 공유 인텐트의 제목. iOS는 무시한다. */
  title: string;
  /** 본문. Android는 이 값만 전달되므로 링크가 있으면 여기에도 넣는다. */
  message: string;
  /** iOS 전용. Android는 content.url을 무시하므로 message에 함께 넣어야 한다. */
  url?: string;
}

/**
 * OS 공유 시트를 띄운다. 카카오톡·인스타그램 같은 앱별 SDK를 붙이지 않는 이유는
 * OS 시트가 이미 설치된 앱 목록을 보여주기 때문이다 — 앱마다 SDK를 붙이면 같은 일을 다시 만든다.
 *
 * 플랫폼 차이를 여기서만 처리한다:
 *  - `content.url`은 iOS 전용이다. Android는 무시하므로 링크를 message에 합쳐 넣는다.
 *  - `options.dialogTitle`은 Android 전용(공유 대상 선택창 제목), `subject`는 iOS 전용이다.
 *  - 결과값을 성공으로 읽지 않는다. Android는 `dismissedAction`이 없고 사용자가 뒤로
 *    나가도 `sharedAction`이 오기 때문에, "공유했어요" 토스트를 띄우면 거짓이 된다.
 *    실패했을 때만 호출부가 알 수 있게 boolean으로 돌려준다.
 *
 * @returns 시트를 띄우는 데 실패하면 false. 사용자가 취소한 경우는 구분할 수 없어 true다.
 */
export async function shareContent({ title, message, url }: ShareContent): Promise<boolean> {
  const body = url && Platform.OS !== 'ios' ? `${message}\n${url}` : message;

  try {
    await Share.share(
      { title, message: body, ...(url ? { url } : {}) },
      { dialogTitle: title, subject: title },
    );
    return true;
  } catch {
    return false;
  }
}
