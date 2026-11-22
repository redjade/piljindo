# 필진도 筆陣圖

[필진도 웹사이트](https://redjade.github.io/piljindo/)

붓을 대기 전에 한 획을 마음속으로 그려 본다. 내려앉는 돌, 멀리 늘어선 구름, 오래 말라 단단해진 덩굴은 붓이 종이와 만나는 서로 다른 방식을 느끼게 한다.

이 자료는 위부인에게 전하는 《필진도》와 왕희지에게 전하는 《제위부인필진도후》를 한문 원문과 현대 한국어로 나란히 읽고, 그 감각을 붓으로 시험하기 위한 것이다.

1. [위부인 전칭 《필진도》 전문](docs/bizhentu.md) · [읽다가 궁금한 말](docs/reading-help.md)
2. [왕희지 전칭 《제위부인필진도후》 전문](docs/postface.md)
3. [일곱 획을 쓰는 연습](docs/practice.md) · [서체와 획 이름](docs/writing-style.md) · [장쉰 3장 독서 길잡이](docs/chang.md)
4. [위부인과 왕희지의 생애, 평가, 남은 글씨](docs/history.md)
5. [판본, 전사 원칙, 다국어 자료](docs/sources.md)
6. [웹사이트 편집·제작 기획](docs/site-plan.md)
7. [두 글의 글자 풀이](docs/character-notes.md) · [글자별 독음과 뜻](docs/characters.md)

## 판면에서 바로 읽기

당나라 장언원(張彥遠)이 엮은 《법서요록》(法書要錄) 권1의 명 모진(毛晉) 《진체비서》(津逮祕書) 계통을 저본으로 삼았다. 아래 다섯 면은 일본 국립공문서관 소장본이다. 두 글은 14번 펼침면에서 이어진다.

| 펼침면 | 살필 곳 |
| --- | --- |
| [12번](assets/plates/najda-12.jpg) | 《필진도》 제목과 서문 |
| [13번](assets/plates/najda-13.jpg) | 벼루·먹·종이, 집필, 첫 여섯 획 |
| [14번](assets/plates/najda-14.jpg) | 마지막 획, 《필진도》 결말, 《제후》의 첫머리 |
| [15번](assets/plates/najda-15.jpg) | 송익 일화, 초서의 속도와 파획 |
| [16번](assets/plates/najda-16.jpg) | 옛 글씨와 비석을 찾아가는 이야기, 《제후》 결말 |

*출전* 国立公文書館所蔵「津逮秘書 第49冊目」. [소장 기록](https://www.digital.archives.go.jp/item/3966350) · [이미지 뷰어](https://www.digital.archives.go.jp/img/3966350) · [2차 이용 조건](https://www.digital.archives.go.jp/secondary-use)

## 이 판의 범위

두 글의 전문을 옮긴 첫 번역이다. 판본 차이나 풀이가 남는 곳은 해당 단락의 주에 표시했다. 글 말미의 날짜와 왕희지의 일인칭 서술은 전승의 일부로 읽는다. [전승과 저자 문제](docs/history.md#전승의-시간표)

## 웹사이트

한국어 번역을 먼저 읽으면서 단락마다 마음에 남은 것을 붓에 옮긴다. 한문과 판본 주석은 자리에서 펼칠 수 있다. [웹 편집 기획](docs/site-plan.md) · [읽고 쓰는 연습 원고](docs/reflections.md) · [권리 안내](RIGHTS.md)

```powershell
npm ci
npm run build
uv run python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

미리보기 주소는 `http://127.0.0.1:4173/`이다. 정적 산출물은 `dist/`에 생성되며 상대 경로로 연결된다.

`main`에 변경이 올라가면 GitHub Actions에서 `dist/`를 다시 만들고 GitHub Pages에 게시한다. [게시 기록](https://github.com/redjade/piljindo/actions/workflows/pages.yml)
