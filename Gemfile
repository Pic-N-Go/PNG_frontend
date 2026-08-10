source 'https://rubygems.org'

# Gemfile.lock의 BUNDLED WITH(bundler 4.x)가 요구하는 하한.
ruby '>= 3.2.0'

# ponytail: ios/Podfile.lock에 커밋된 버전(1.17.0)에 맞춰 고정.
# 버전이 다르면 pod install마다 Podfile.lock / project.pbxproj가 왕복 수정됨.
gem 'cocoapods', '1.17.0'

# cocoapods가 전이 의존으로 끌어오지만(>= 1.28.1, < 2.0) 직접 고정한다.
# 커밋된 project.pbxproj는 이 버전의 재직렬화 결과(고정점)이므로, 버전이 뜨면 인용부호가 다시 왕복함.
gem 'xcodeproj', '1.28.1'
