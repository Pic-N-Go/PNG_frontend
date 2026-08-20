/**
 * 지도 WebView용 Pretendard 숫자 서브셋 (SemiBold 600, U+0030-0039).
 *
 * WebView는 expo-font로 로드한 번들 폰트 스코프 밖이라 시스템 폰트로 렌더된다.
 * 클러스터 개수와 코스 순번은 숫자만 쓰므로 10글자만 서브셋해 1.4KB로 인라인한다.
 *
 * 재생성 (fonttools 필요, 개발 시에만):
 *   python3 -m fontTools.subset assets/fonts/Pretendard-SemiBold.otf \\
 *     --unicodes=U+0030-0039 --flavor=woff2 --layout-features='' --no-hinting \\
 *     --desubroutinize --output-file=/tmp/out.woff2
 *   그 파일을 base64로 인코딩해 아래 문자열을 교체할 것.
 */
const WOFF2_BASE64 =
  'd09GMk9UVE8AAAWwAAwAAAAACQgAAAVmAAFPGgAAAAAAAAAAAAAAAAAAAAAAAAAADYoZGiIbIBwqBmAANAE2AiQDLAQGBYJqByAbLghRlE1SF+JHYmys7DEbkV0dkcybin5y7+qd+nvSGapoFFfjUUh1FCCHFUKScZwrErkA/JC+AFBu/YAH+9vb/ladR9R5lCcJhhmHkkLwUGu+pdtEnbtf2Ex2qqJKpDrRldUVqqyiSnDiSqjLElioekB+ubzk//2p/CwX+1juFi1pxbJf1+JoWi2V1jCc53udf+DSXKBc0A7j5r99NEVwAgpkbJxkEScJQ5OU+BbLqCO4Ffdou4o9QR5xNWvyjEMeE+UJpj0S9r7B0mohi8XnH/+LRSFV1O/QmAKT9rPBYnY9G6p+7at+z0aI+E82XP19LOgCaTn3vZff/jIcnBTQKYkAgYcnDetf1DhcUuXMqcQW73QQiUzF0i8z8mzABW9IBV0uJymEeKmtShoiynUmaOqkyaOTC0E4ZALBO9Ilp+qfTACJRZLuSlVGZtsdQNvLY2hAAMCHTwKCNZrgThSjCeitrKMslErPeRFzOjlldWiv4FdV4VCf9F1aOeLP/upVPDJ0DQmKh/g1GDLFajHl/Kr+jJZqKqlEO3PA/9zYcqtTbkvd2crOF64LvvDOyVzU4Gtc2eGW7ewK+W+VHRssgoz8jwa2sSXjPAee4E/mDFbYS6m3veqw5R6r2qwJRJZfPmGOhP5LM1Bu+SIjjUzDLcNFWU5GHdgreIMZlLOiTBXV6hEcPNc83kC+BMCUpDeZVNlMpTej551gtit2JdYFuP0wDxAjoR+WyZVJvhIWmRAV7EUINIJnKWhUu8BUzeofoN+R3BVccZAJ5vJKzGn5xKGibvYQazhEM06bB51+FEba8f6MfQeLo41+bh2ZnR4lhZyAmusVvAZhmKucspt+D8nMXLViZdoUrveNWS1ARj+GBaOXMpaFm6+eXQaXTbJhZcw2Vb2M6ZqkXsDsSG4KLjmM3UKuxpys2twreK/EiZPLMzhmL53uUFbqaui2NwUew1CPFf83XakzbbYF5q22lVLd0b+907w8XJLK4SnOm8vZsol1ipkyCMSVibgKA0bSI6kwGkxQlpU3PeUXKR7jUKj1rSl3MyaNz5LUrm2NnDSu+iHvMYtCFlCrCbPF59LhBuZL/1R/5BlM0Uqm572o1UynKP/x+hO3ur2jYfF6Rc3WznABMyzkgzbDUywUfyCwSogl7A8yI+mwHUUDxXPMT3X4FEM7b+AxfHtBOKHfFsnJdxYoJZZammtldwo/qLTr9PwMj1X02sk2qp2o6R78vXQ6+EopY73WqP+Ce2g3JrcFl1yi1WLcEY86jcv9FansH9NNruerZqW1IB1GweikuZJXMDWarh6OpERCCQdPeswFAxQo0BPCRpoqF61Zv3r12XqsbpOo4XlR+/06+L+AALA2jUJDJ4hbQkOEgQG6i0zQUV7bCnr4TaosEIHoI0WjKuPuoSkE/AECjMfTcaoTNECz4TcA7C6sqI8718ToBgAROISTt74lV1sL3IckWfPe/3iAkwj6GZgO75oTTokiQHHIOI1UIABGkNyYKs4sIvmS/s39NibcybroDDxT7lsz4Jv7l57WAwDAZ6Pku3bqxM7nH/+7QUjV7wAAHQpiQPcSxic8ABjvS8KcvNHzWQB2tAjDww1KvWNSc0DaDP31K8xpAwzXKqhuFgYvN1dAI/ABoNONhmoMAOSCzIhEyjVSOMNGWq4JxRiYUSOfG7WP6HwPJcabYKZJHGzsppCcJJElkaWQ1LTomrASIJmK0Izn5EA0msRiCgtCMWQShaSFxSiHYuO5Smye0AbZ6ZqiyRKkcNnD5SjRqk2LHMRsx0P7rZNM5jAeIbVYUWozTWBvVEmKhygXGF00hkyWJgabIG2z97/IDQ==';

/** WebView <style> 안에 넣을 @font-face 선언. font-family: 'Pretendard' 로 사용한다. */
export const MAP_FONT_FACE = `
    @font-face {
      font-family: 'Pretendard';
      font-weight: 600;
      font-display: block;
      src: url(data:font/woff2;base64,${WOFF2_BASE64}) format('woff2');
    }
`;
