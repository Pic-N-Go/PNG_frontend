/**
 * 사진 EXIF 표시용 뷰모델. 커뮤니티 게시글 상세와 스팟 사진 상세(`photo-detail.html`)가
 * 공유한다. 값이 없는 필드는 행 자체를 렌더링하지 않으므로(원본 목업 주석 참고) 전부 옵셔널.
 */
export interface PhotoExifData {
  /** 촬영 일시 표시용 라벨(EXIF 시트 안에는 없고, 라이트박스 헤더 등 시트 밖에서 사용) */
  shotAtLabel?: string;
  camera?: string;
  lens?: string;
  iso?: number;
  aperture?: string;
  shutter?: string;
  focalLength?: string;
  exposureMode?: string;
  metering?: string;
  whiteBalance?: string;
  flash?: string;
  focalLength35mm?: string;
  software?: string;
  address?: string;
  gpsLat?: number;
  gpsLng?: number;
  filename?: string;
  fileSize?: string;
  format?: string;
  modifiedAtLabel?: string;
}
