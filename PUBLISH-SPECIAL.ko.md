# 스페셜 간편 게시

## 처음 한 번만: 최신 편집기로 바꾸기

이미 ZIP 폴더에서 수정한 내용은 지우지 마세요. GitHub Desktop에서 `Documents/GitHub/dylove` 저장소의 **Fetch origin → Pull origin**으로 최신 기능 코드를 받으세요.

기존 편집기 터미널을 **Control + C**로 끄고, 새 터미널에서:

```sh
cd "$HOME/Documents/GitHub/dylove" && npm ci && npm run editor
```

지금까지 쓰던 **같은 브라우저·같은 주소**로 관리자를 여세요. `http://localhost:5174/__editor`를 사용했다면 그대로 쓰고, Command + Shift + R로 새로고침하세요. 127.0.0.1과 localhost는 브라우저 저장 공간이 다르므로 바꾸지 마세요.

**♡ 11:11 SPECIAL**에서 기존에 저장한 제목·안내 문구가 보이는지 확인하세요. 초안과 업로드 사진은 같은 브라우저 저장 공간에서 이어집니다. 보이지 않으면 이전 ZIP 폴더를 그대로 두고, 이전 편집기의 **사진 포함 ZIP 내보내기**로 백업한 파일을 새 편집기에 가져오면 됩니다.

## 앞으로는 버튼 하나

수정 후 **GitHub·Vercel에 게시 ♡**를 누릅니다. 초안 저장·로컬 파일 반영을 따로 누를 필요가 없습니다.

1. 현재 편집본과 사진을 로컬에 저장합니다.
2. 기존 GitHub 복제 폴더를 자동으로 찾습니다. ZIP에서 실행해도 `~/Documents/GitHub/dylove`를 찾습니다.
3. 임시 Git 작업 공간에서 **스페셜 JSON과 참조 사진만** 반영하고 프로덕션 빌드를 검사합니다.
4. 기존 Git 인증 도우미로 `main`에 커밋·푸시합니다. 별도의 Vercel 프로젝트는 만들지 않습니다.
5. 기존 Vercel Git 연동의 배포를 기다린 뒤, 공개 서버의 버전 지문이 방금 게시한 **대사·사진 전체**와 일치하는지 확인합니다.

**GitHub 반영 완료**와 **실제 Vercel 버전 확인 완료**는 서로 다른 상태입니다. 배포가 늦으면 **배포 반영 확인**만 다시 누르세요. 다시 푸시할 필요가 없습니다. 공개 게임을 열어 새로고침하면 변경 내용을 볼 수 있습니다.

공개 주소: https://dylove-wheat.vercel.app/special/1111

## 지금 수정한 ZIP 폴더를 바로 게시하는 명령어 하나

편집기를 옮기기 어려우면 최신 기능을 받은 GitHub 복제 폴더의 스크립트가 **기존 수정한 ZIP 폴더**를 직접 읽을 수 있습니다. 이미 “로컬 게임 파일에 반영”한 수정본을 사용합니다.

터미널에 다음 명령 뒤 공백을 하나 입력하고, **지금까지 수정했던 ZIP 프로젝트 폴더**를 창으로 끌어다 놓은 뒤 엔터를 누르세요.

```sh
node "$HOME/Documents/GitHub/dylove/scripts/publish-special.mjs" --source
```

예를 들어 폴더가 `Downloads/dylove-edited`라면 완성된 한 명령은:

```sh
node "$HOME/Documents/GitHub/dylove/scripts/publish-special.mjs" --source "$HOME/Downloads/dylove-edited"
```

그 폴더에는 `src/episodes/1111/published.json`, 사진, 기존 편집기를 실행할 때 설치한 `node_modules`가 있어야 합니다. 수정본을 새 폴더로 복사하거나 JSON을 직접 고칠 필요는 없습니다. 같은 수정본으로 명령을 다시 실행해도 중복 커밋하지 않습니다.

현재 프로젝트 폴더에서 게시하려면 `npm run special:publish`도 사용할 수 있습니다.

## 인증과 보존

- 브라우저나 Vercel 공개 게임에는 GitHub 토큰을 넣지 않습니다. 토큰 입력창도 없습니다.
- 맥북의 Git/GitHub Desktop 설치본과 기존 Keychain/SSH/자격 증명 도우미를 사용합니다. GitHub Desktop 로그인만으로 명령줄 Git 인증까지 연결되지 않는 맥도 있습니다.
- 인증이 필요하면 **한 번만** 명령줄 Git 인증을 연결해야 합니다. GitHub CLI가 이미 설치되어 있다면 `gh auth login`의 브라우저 로그인 후 `gh auth setup-git`을 사용하세요. 토큰을 편집기·코드·채팅에 입력하지 마세요.
- 서버는 `jaylee3939/dylove` origin만 허용합니다. GitHub Desktop 복제 폴더의 브랜치·다른 작업 파일·스테이징 내용을 자동으로 Pull/Reset하지 않습니다. 현재 편집기 프로젝트의 스페셜 파일에 수정본을 저장하는 과정은 포함됩니다. 저장소에 보이는 “받을 커밋” 알림은 작업 파일을 보존하기 위한 동작이며 게시 실패가 아닙니다.
- 본편 JSON·사진·편지·3D 코드·게임/관리자 브라우저 저장 데이터는 자동 게시 대상이 아닙니다. 사용 중인 사진을 삭제하거나 덮어쓰지 않습니다.
- 스페셜 수정본과 참조 사진만 커밋합니다. 빌드 실패 시 푸시하지 않으며, 인증/동시 푸시 충돌 시 강제 푸시하지 않습니다. 수정본은 로컬에 남습니다.
- 게시 API는 로컬 편집기 모드와 루프백·Host·Origin·전용 JSON 헤더를 검사합니다. 일반 개발 서버와 공개 프로덕션 빌드에는 게시 기능이 열리지 않습니다.
- 로컬 캐시/복구 정보는 `node_modules/.cache/doyeon-publisher/` 안에만 보관하며 GitHub에 올리지 않습니다.

Vercel 배포가 실패했다면 기존 프로젝트의 Deployments에서 최신 커밋을 확인하세요. 이 도구는 GitHub 푸시만으로 Vercel 성공이라고 표시하지 않습니다. 실제 공개 서버에서 지문을 읽을 수 없으면 **미확인**으로 표시합니다.

## 개발 검증

- 실제 로컬 bare Git 원격과 임시 worktree로 커밋·푸시·반복 게시, Desktop 작업 파일/스테이징/HEAD 보존, 빌드 실패·원격 푸시 거절·복구 참조·진단 정보 비노출을 검사합니다: `node tests/special-publishing.test.mjs`.
- 버튼 검사는 GitHub 전송만 모의 처리하고 실제 로컬 파일과 3D 게임의 제목·안내 반영, 초안/게시 상태 재열기와 API 접근 제한을 확인합니다: `node tests/special-oneclick.mjs` (5173/5174 실행 필요).
- `dist/special-1111-version.json`은 빌드된 스페셜의 콘텐츠와 참조 사진 바이트를 함께 해시한 지문입니다. 비밀 키나 Git 인증 정보는 포함하지 않습니다. 이 파일을 공개 서버에서 읽어 같은 지문일 때만 배포 성공으로 표시합니다.

커밋 단계에서 멈춘다면 GitHub Desktop 설정의 Git 탭에서 이름과 이메일도 확인해 주세요.

### 이번 반영 확인

원격에 올라온 첫 장 제목 “나 빼빼로 안 좋아한다?”와 안내 “빼빼로보다 더 생각나게 해주고 싶어”를 보존했습니다. 파일 앞에 붙은 불필요한 `null` 한 줄만 제거해 유효한 JSON으로 복구했고 실제 모바일 3D 미션 창에서 두 문구를 확인했습니다. 앞으로는 게시 버튼이 JSON을 자동 생성하므로 GitHub 편집 화면에 본문을 붙여넣을 필요가 없습니다.

실제 전체 프로젝트를 임시 작업 공간에서 TypeScript/Vite 빌드하고 로컬 bare Git 원격에 사진·수정본을 커밋·푸시하는 검사도 통과했습니다. 원격 Vercel의 배포 성공은 공개 버전 파일이 일치할 때만 확인할 수 있습니다. 이 실행 환경은 Vercel 도메인 접속이 네트워크 정책으로 제한되어 있어 직접 공개 접속 검증에는 제한이 있습니다.
