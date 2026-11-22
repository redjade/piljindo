import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';

const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
const read = (file) => readFileSync(new URL(file, root), 'utf8').replaceAll('\r\n', '\n');
const md = new MarkdownIt();
const escape = md.utils.escapeHtml;

const pages = {
  'README.md': 'facsimiles.html',
  'RIGHTS.md': 'rights.html',
  'docs/bizhentu.md': 'bizhentu.html',
  'docs/postface.md': 'postface.html',
  'docs/practice.md': 'practice.html',
  'docs/writing-style.md': 'writing-style.html',
  'docs/history.md': 'history.html',
  'docs/sources.md': 'sources.html',
  'docs/chang.md': 'chang.html',
};

function fragment(text) {
  return text.trim().toLowerCase().replace(/[^-\p{L}\p{N}\p{M}_ ]/gu, '').replaceAll(' ', '-');
}

function siteLink(link, source) {
  if (!link || link.startsWith('#') || /^[a-z]+:/i.test(link)) return link;
  const [path, anchor] = link.split('#');
  const resolved = posix.normalize(posix.join(posix.dirname(source), path));
  return (pages[resolved] ?? resolved) + (anchor ? '#' + anchor : '');
}

for (const [type, attribute] of [['link_open', 'href'], ['image', 'src']]) {
  const render = md.renderer.rules[type] ?? ((tokens, i, opts, _env, self) => self.renderToken(tokens, i, opts));
  md.renderer.rules[type] = (tokens, i, opts, env, self) => {
    const target = tokens[i].attrGet(attribute);
    tokens[i].attrSet(attribute, siteLink(target, env.source));
    if (type === 'image') tokens[i].attrSet('loading', 'lazy');
    return render(tokens, i, opts, env, self);
  };
}

md.renderer.rules.heading_open = (tokens, i, opts, _env, self) => {
  tokens[i].attrSet('id', fragment(tokens[i + 1].content));
  return self.renderToken(tokens, i, opts);
};

const render = (body, source) => md.render(body, { source });
const inline = (body, source) => md.renderInline(body, { source });
const strokes = [
  { slug: 'horizontal', name: '가로획', example: '三', glyph: '一', folio: 16, focus: '세 가로획의 길이와 그 사이의 흰 틈을 본다.' },
  { slug: 'dot', name: '점', example: '主', glyph: '丶', folio: 20, focus: '점 하나에서 무게가 모인 곳을 본다. 主에서는 그 점이 기운 방향과 첫 가로획까지의 거리를 본다.' },
  { slug: 'left-falling', name: '왼삐침', example: '人', glyph: '丿', folio: 15, focus: '왼쪽으로 내려오면서 가늘어지는 끝을 본다.' },
  { slug: 'slant-hook', name: '비스듬한 갈고리', example: '弋', glyph: '乚', folio: 9, model: '我', focus: '我에서 오른쪽 아래로 내려갔다 들리는 갈고리를 찾아, 연습 글자 弋에서도 그 움직임을 써 본다.' },
  { slug: 'vertical', name: '세로획', example: '中', glyph: '丨', folio: 6, focus: '가운데 세로가 네모를 어떻게 가르고 아래로 나오는지 본다.' },
  { slug: 'right-falling', name: '오른쪽 파임', example: '近', glyph: '乀', folio: 8, focus: '책받침의 마지막 획이 오른쪽 아래로 넓게 뻗는 자리를 본다.' },
  { slug: 'turning-hook', name: '가로꺾은 갈고리', example: '力', glyph: '𠃌', folio: 2, focus: '가로에서 방향을 꺾는 자리와 맨 끝의 갈고리를 본다.' },
];
const practiceModel = 'https://digitalarchive.npm.gov.tw/Collection/Detail/33063?dep=P';
const dotDetail = '<img class="dot-detail" src="assets/models/dot-detail.jpg" width="102" height="60" alt="〈다보탑비〉 탁본의 主에서 잘라 본 윗점">';
const modelPhoto = (stroke) => `<img src="assets/models/${stroke.slug}.jpg" alt="〈다보탑비〉 탁본의 해서 ${stroke.model ?? stroke.example} 자">`;
const strokeHref = (stroke) => `stroke-${stroke.slug}.html`;
const nav = [
  ['read', 'bizhentu.html', '읽기'],
  ['practice', 'practice.html', '붓을 들기'],
  ['history', 'history.html', '두 사람'],
  ['sources', 'sources.html', '자료실'],
];

function layout(title, description, group, body, readingTools) {
  const navigation = nav.map(([key, href, label]) => `<a href="${href}"${key === group ? ' aria-current="true"' : ''}>${label}</a>`).join('');
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escape(description)}">
  <meta name="theme-color" content="#f8f5ec">
  <title>${escape(title)}</title>
  <link rel="icon" type="image/svg+xml" href="seal.svg">
  <link rel="stylesheet" href="style.css">
  ${readingTools ? '<script src="reading.js" defer></script>' : ''}
</head>
<body>
  <a class="skip-link" href="#main">본문 바로가기</a>
  <header class="site-header"><div class="shell topbar">
    <a class="brand" href="index.html"><img src="seal.svg" width="30" height="30" alt="">필진도</a>
    <nav aria-label="주 메뉴">${navigation}</nav>
  </div></header>
  <main id="main">${body}</main>
  <footer class="shell site-footer">
    <a href="index.html" class="footer-brand">필진도 <span lang="zh-Hant">筆陣圖</span></a>
    <a class="footer-source" href="rights.html">출전과 이용</a>
  </footer>
</body>
</html>
`;
}

function save(file, title, description, group, body, readingTools = false) {
  writeFileSync(new URL(file, output), layout(title, description, group, body, readingTools));
}

function sections(file) {
  const [first, ...parts] = read(file).trim().split(/^## /m);
  const [title, ...lead] = first.split('\n');
  return {
    title: title.replace(/^# /, ''),
    lead: lead.join('\n').trim(),
    parts: parts.map((part) => {
      const lineEnd = part.indexOf('\n');
      return { title: part.slice(0, lineEnd), body: part.slice(lineEnd).trim() };
    }),
  };
}

function pageTitle(title, description, overline) {
  return `<header class="page-title">${overline ? `<p class="eyebrow">${overline}</p>` : ''}<h1>${title}</h1>
    ${description ? `<p class="page-lead">${description}</p>` : ''}</header>`;
}

function disclosure(label, body, className = '') {
  return `<details class="disclosure ${className}"><summary>${label}</summary><div class="disclosure-body">${body}</div></details>`;
}

function breadcrumbs(links, current) {
  return `<nav class="breadcrumbs" aria-label="현재 위치">
    ${links.map(([href, label]) => `<a href="${href}">${escape(label)}</a><span class="breadcrumb-divider" aria-hidden="true">/</span>`).join('')}
    <span aria-current="page">${escape(current)}</span></nav>`;
}

mkdirSync(output, { recursive: true });
cpSync(new URL('assets/', root), new URL('assets/', output), { recursive: true });
for (const file of ['style.css', 'seal.svg', 'reading.js']) {
  cpSync(new URL(file, import.meta.url), new URL(file, output));
}
writeFileSync(new URL('.nojekyll', output), '');

const wei = 'docs/bizhentu.md';
const wang = 'docs/postface.md';
const practice = 'docs/practice.md';
const reflections = 'docs/reflections.md';
const weiSections = sections(wei);
const notes = new Map(sections(reflections).parts.map(({ title, body }) => [title, body]));
const helpSource = 'docs/reading-help.md';
const readingHelp = new Map(sections(helpSource).parts.map(({ title, body }) => {
  const [id, question] = title.split(' · ');
  return [id, { question, body }];
}));

function helpFor(id) {
  const entry = readingHelp.get(id);
  if (!entry) throw new Error('읽기 도움말이 빠졌습니다. ' + id);
  return disclosure(escape(entry.question), render(entry.body, helpSource), 'reading-help');
}

const han = /\p{Script=Han}/u;
const characters = new Map();
for (const line of read('docs/characters.md').split('\n').filter((line) => line.startsWith('- '))) {
  const [, glyph, sound, meaning] = line.match(/^- (\p{Script=Han}) ([가-힣]) · (.+)$/u) ?? [];
  if (!glyph || characters.has(glyph)) throw new Error('한자표 행을 확인하세요. ' + line);
  characters.set(glyph, { sound, meaning });
}
const characterNotes = new Map();
for (const { title, body } of sections('docs/character-notes.md').parts) {
  if (characterNotes.has(title)) throw new Error('중복된 글자 풀이 단락입니다. ' + title);
  const entries = body.split('\n').slice(2).map((row) => {
    const [phrase, meaning, reading] = row.split('|').slice(1, 4).map((cell) => cell.trim());
    const glyphs = [...(phrase ?? '')];
    if (!glyphs.length || !glyphs.every((glyph) => han.test(glyph)) || !meaning ||
      (reading && (!/^[가-힣]+$/.test(reading) || reading.length !== glyphs.length))) {
      throw new Error('어구 풀이를 확인하세요. ' + title + ' ' + row);
    }
    return { phrase, glyphs, meaning, reading };
  });
  characterNotes.set(title, entries);
}
const seven = weiSections.parts.find(({ title }) => title.startsWith('W06'));
const [beforeTable, ...rows] = seven.body.split(/^\|/m);
const meanings = rows.slice(2).map((row) => {
  const [glyph, chinese, korean] = row.split('|').map((cell) => cell.trim());
  return { glyph, chinese, korean };
});
if (meanings.length !== strokes.length || meanings.some((row, i) => row.glyph !== strokes[i].glyph)) {
  throw new Error('일곱 획 목록과 저본 번역의 획표 순서가 다릅니다.');
}

function renderStrokeReading() {
  const table = rows.map((row) => '|' + row).join('');
  const notesStart = table.indexOf('\n- ');
  const noteText = table.slice(notesStart).trim();
  const korean = meanings.map((meaning, i) => {
    const stroke = strokes[i];
    const scene = notes.get('W06-' + stroke.slug);
    if (!scene) throw new Error('오늘의 장면이 빠진 획 ' + stroke.slug);
    return `<li><span class="stroke-mark" lang="zh-Hant">${escape(meaning.glyph)}</span><div>
      <strong class="stroke-reading-name">${stroke.name}</strong><p class="translation">${inline(meaning.korean, wei)}</p>
      <aside class="stroke-scene" aria-label="편집자 주 · 오늘의 장면">
        <p class="scene-label" aria-hidden="true">오늘의 장면</p>
        ${render(scene, reflections)}</aside>
      ${helpFor('W06-' + stroke.slug)}
      </div></li>`;
  }).join('');
  const originals = meanings.map(({ glyph, chinese }) => glyph + '　' + chinese);
  const chinese = `<ul class="chinese-strokes" lang="zh-Hant">${originals.map((original) => `<li>${escape(original)}</li>`).join('')}</ul>`;
  const text = `<aside class="stroke-editor-note" aria-label="편집자 주">
    <p class="scene-label" aria-hidden="true">편집자 주</p>
    <p>각 획 아래의 ‘오늘의 장면’은 이 사이트에서 덧붙인 연습 안내입니다. 한 장면을 골라 눈과 마음에 남는 방향이나 무게를 느껴 봅니다.</p>
    </aside>
    <p class="stroke-reading-label" id="stroke-reading-label">《필진도》 번역</p>
    <ul class="stroke-reading" aria-labelledby="stroke-reading-label">${korean}</ul>
    <p><a href="practice.html">일곱 획 써 보기</a></p>`;
  return { text, chinese, originals, commentary: render(beforeTable + '\n' + noteText, wei) };
}

function renderSplitReading(body, source) {
  const blocks = body.split(/\n\n+/);
  const original = blocks.shift();
  if (!original.startsWith('> ')) throw new Error('한문 원문 인용 블록이 필요합니다.');
  const noteStart = blocks.findIndex((block) => block.startsWith('- '));
  const text = noteStart < 0 ? blocks : blocks.slice(0, noteStart);
  const commentary = noteStart < 0 ? [] : blocks.slice(noteStart);
  return {
    text: render(text.join('\n\n'), source),
    chinese: `<div lang="zh-Hant">${render(original, source)}</div>`,
    originals: [original.replace(/^> ?/gm, '')],
    commentary: render(commentary.join('\n\n'), source),
  };
}

function annotatedOriginal(id, originals, plain) {
  const entries = characterNotes.get(id);
  if (!entries) throw new Error('글자 풀이 단락이 빠졌습니다. ' + id);
  const sourceGlyphs = originals.flatMap((original) => [...original].filter((glyph) => han.test(glyph)));
  const noteGlyphs = entries.flatMap(({ glyphs }) => glyphs);
  if (sourceGlyphs.join('') !== noteGlyphs.join('')) {
    const firstDifference = sourceGlyphs.findIndex((glyph, i) => glyph !== noteGlyphs[i]);
    const index = firstDifference === -1 ? sourceGlyphs.length : firstDifference;
    const excerpt = (glyphs) => glyphs.slice(Math.max(0, index - 4), index + 7).join('');
    throw new Error(`${id} 글자 풀이가 저본과 다릅니다. 원문 ${excerpt(sourceGlyphs)} / 풀이 ${excerpt(noteGlyphs)}`);
  }
  let entryIndex = 0;
  let glyphIndex = 0;
  const passages = originals.map((original) => [...original].map((glyph, column) => {
    if (!han.test(glyph)) return escape(glyph);
    const entry = entries[entryIndex];
    const isStroke = id === 'W06' && column === 0;
    const character = characters.get(glyph);
    if (!character && !isStroke) throw new Error('한자표에 빠진 글자입니다. ' + id + ' ' + glyph);
    const sound = isStroke ? (glyph === '一' ? character.sound : '') : (entry.reading?.[glyphIndex] ?? character.sound);
    const meaning = isStroke ? '' : character.meaning;
    const button = `<button type="button" class="character" data-sound="${escape(sound)}" data-meaning="${escape(meaning)}"
      data-phrase="${escape(entry.phrase)}" data-context="${escape(entry.meaning)}" data-unit="${entryIndex}" aria-pressed="false" aria-controls="gloss-status">${escape(glyph)}</button>`;
    glyphIndex += 1;
    if (glyphIndex === entry.glyphs.length) {
      entryIndex += 1;
      glyphIndex = 0;
    }
    return button;
  }).join(''));
  const annotated = id === 'W06'
    ? `<ul class="chinese-strokes" lang="zh-Hant">${passages.map((passage) => `<li>${passage}</li>`).join('')}</ul>`
    : `<p lang="zh-Hant">${passages[0]}</p>`;
  return `<div class="plain-original">${plain}</div><div class="annotated-original" hidden>${annotated}</div>`;
}

function renderTreatise(source, treatise) {
  const isWei = source === wei;
  const name = isWei ? '필진도' : '제위부인필진도후';
  const chineseName = isWei ? '筆陣圖' : '題衛夫人筆陣圖後';
  const translationHref = pages[source];
  const originalHref = translationHref.replace('.html', '-original.html');
  const overline = isWei ? '위부인의 이름으로 전하는 글' : '왕희지의 이름으로 전하는 글';
  const intro = isWei
    ? '사물을 오래 보고 느낀 힘을 획에 담는다. 글씨를 배우는 눈과 마음을 먼저 가다듬는 글이다.'
    : '글자의 자리를 마음속에 먼저 본다. 뜻을 따라 손이 움직이고, 떨어진 획 사이에도 흐름이 이어진다.';
  const chapters = treatise.parts.map(({ title, body }) => {
    const [id, heading] = title.split(' · ');
    const isStrokeReading = id === 'W06';
    const reflection = notes.get(id);
    if (!reflection) throw new Error('읽기 실습이 빠진 단락 ' + id);
    const { text, chinese, originals, commentary } = isStrokeReading ? renderStrokeReading() : renderSplitReading(body, source);
    const originalBody = annotatedOriginal(id, originals, chinese);
    return {
      id, heading, originalHtml: `<section class="original-chapter" id="${id}"><h2 class="visually-hidden">${escape(heading)}</h2>${originalBody}</section>`,
      html: `<section class="chapter" id="${id}">
        <h2 id="${fragment(title)}">${escape(heading)}</h2>
        ${isStrokeReading ? text : `<div class="translation">${text}</div>`}
        ${isWei && !isStrokeReading ? helpFor(id) : ''}
        <aside class="writing-pause" aria-label="${isStrokeReading ? '써 보기' : '오늘의 장면과 써 보기'}">
          ${isStrokeReading ? '' : '<p class="scene-label" aria-hidden="true">오늘의 장면</p>'}
          ${render(reflection, reflections)}</aside>
        <div class="text-details">${disclosure('이 단락의 원문', chinese + `<a class="original-link" href="${originalHref}#${id}">한문 원문에서 읽기</a>`, 'original')}
        ${commentary ? disclosure('번역 주석과 출전', commentary) : ''}</div>
      </section>`,
    };
  });
  const other = isWei
    ? '<a class="action" href="postface.html">《제위부인필진도후》 읽기</a>'
    : '<a class="action" href="practice.html">일곱 획 써 보기</a>';
  const tabs = `<nav class="reading-tabs" aria-label="읽는 글">
    <a href="bizhentu.html"${isWei ? ' aria-current="page"' : ''}>《필진도》</a>
    <a href="postface.html"${isWei ? '' : ' aria-current="page"'}>《제위부인필진도후》</a></nav>`;
  const contents = `<nav class="toc" id="contents" aria-label="이 글의 차례"><h2>이 글의 차례</h2><ul>
    ${chapters.map(({ id, heading }) => `<li><a href="#${id}">${escape(heading)}</a></li>`).join('')}</ul></nav>`;
  const readingModes = (original) => `<nav class="reading-modes" aria-label="읽기 방식">
    <a href="${translationHref}" data-reading-mode${original ? '' : ' aria-current="page"'}>한국어로 읽기</a>
    <a href="${originalHref}" data-reading-mode${original ? ' aria-current="page"' : ''}>한문 원문</a></nav>`;
  save(translationHref, name + ' | 필진도', intro, 'read', `<div class="shell">
    ${tabs}${pageTitle(name, intro, overline)}<div class="reading-actions">${readingModes(false)}<a class="contents-link" href="#contents">차례</a></div>
    <div class="reading-grid">${contents}<article class="reading-content">
      ${chapters.map(({ html }) => html).join('')}
      <div class="page-end">${other}
      ${disclosure('이 번역에 대하여', render(treatise.lead, source))}</div>
    </article></div></div>`, true);
  save(originalHref, name + ' 한문 원문 | 필진도', name + '의 한문 원문을 저본 순서로 읽는다.', 'read', `<div class="shell original-page">
    ${breadcrumbs([[translationHref, name]], '한문 원문')}
    ${pageTitle(`<span lang="zh-Hant">${chineseName}</span>`)}
    <div class="reading-actions">${readingModes(true)}
      <button type="button" aria-pressed="false" id="gloss-toggle" hidden>글자 풀이</button>
      <a class="contents-link" href="#contents">차례</a>
      <p class="gloss-hint" hidden>글자를 누르면 독음과 문맥 속 뜻이 여기에 나옵니다.</p>
      <div class="character-gloss" id="gloss-status" role="status" hidden>
        <p><span class="gloss-glyph" lang="zh-Hant"></span> <strong class="gloss-sound"></strong> <span class="gloss-meaning"></span></p>
        <p><span class="gloss-phrase" lang="zh-Hant"></span> <span class="gloss-context"></span></p>
      </div>
    </div>
    <div class="reading-grid">${contents}<article class="reading-content original-content" aria-label="한문 원문">
      ${chapters.map(({ originalHtml }) => originalHtml).join('')}
    </article></div></div>`, true);
}

renderTreatise(wei, weiSections);
renderTreatise(wang, sections(wang));

const lessons = sections(practice);
const finish = lessons.parts.at(-1);
if (lessons.parts.length !== strokes.length + 1) throw new Error('획별 실습과 마무리 원고를 확인하세요.');

save('practice.html', '일곱 획을 붓으로 읽기 | 필진도', '《필진도》의 일곱 비유를 실제 종이에 써 본다.', 'practice', `<div class="shell narrow-page">
  ${pageTitle('일곱 획을 붓으로 읽기', '한자 해서로 한 획을 두 번 쓰고 곁에 놓는다. 붓이 닿고 떠나는 순간부터, 그 차이가 글자와 글줄에 남기는 변화까지 살핀다.')}
  <p class="style-link"><a href="writing-style.html">서체와 획 이름</a></p>
  <ol class="lesson-list">${strokes.map((stroke, i) => `<li><a href="${strokeHref(stroke)}">
    <span class="lesson-glyph" lang="zh-Hant">${stroke.glyph}</span>
    <span><small>${stroke.name}</small><strong>${lessons.parts[i].title.split(' · ')[1]}</strong></span>
    <span class="lesson-example" lang="zh-Hant">${stroke.example}</span></a></li>`).join('')}</ol>
  <section id="${fragment(finish.title)}" class="prose closing-practice"><h2>${finish.title}</h2>${render(finish.body, practice)}</section>
  ${disclosure('도해와 실습에 대하여', render(lessons.lead, practice))}
</div>`);

strokes.forEach((stroke, i) => {
  const lesson = lessons.parts[i];
  const heading = lesson.title.split(' · ')[1];
  const blocks = lesson.body.split(/\n\n+/);
  const original = blocks.shift();
  const diagram = blocks.shift();
  const references = blocks.pop();
  if (original.slice(2).trim() !== meanings[i].chinese || !diagram.includes(stroke.slug + '.svg') || !references.startsWith('[')) {
    throw new Error('저본과 실습의 획 대응을 확인하세요. ' + heading);
  }
  const previous = i ? `<a href="${strokeHref(strokes[i - 1])}">이전 · ${strokes[i - 1].name}</a>` : '';
  const next = strokes[i + 1]
    ? `<a class="action" href="${strokeHref(strokes[i + 1])}">다음 · ${strokes[i + 1].name}</a>`
    : `<a class="action" href="practice.html#${fragment(finish.title)}">글자 안에서 다시 만나기</a>`;
  const photo = stroke.slug === 'dot'
    ? `<div class="dot-comparison">
      <div><span>점 하나</span>${dotDetail}</div>
      <div><span lang="zh-Hant">主</span>${modelPhoto(stroke)}</div>
    </div>`
    : modelPhoto(stroke);
  save(strokeHref(stroke), heading + ' | 필진도', meanings[i].korean, 'practice', `<div class="shell stroke-page">
    ${breadcrumbs([['practice.html', '붓을 들기']], stroke.name)}
    ${pageTitle(heading, inline(meanings[i].korean, wei), `<span aria-label="일곱 획 중 ${i + 1}번째">${i + 1} / ${strokes.length}</span>`)}
    <figure class="stroke-model">
      <div class="stroke-model-image">${photo}</div>
      <figcaption><p>${stroke.focus}</p><p class="model-source">안진경 〈다보탑비〉 명대 탁본 ${stroke.folio}면에서 자름.
      <a href="${practiceModel}">타이베이 국립고궁박물원</a> · <a href="https://creativecommons.org/licenses/by/4.0/deed.ko">CC BY 4.0</a></p></figcaption>
    </figure>
    ${disclosure('붓길 도해', `<figure class="stroke-figure">${render(diagram, practice)}<figcaption>붉은 선을 따라 붓이 나아갈 방향을 눈으로 더듬어 본다.</figcaption></figure>`)}
    <div class="prose stroke-practice"><h2>종이에 써 보기</h2>${render(blocks.join('\n\n'), practice)}
    ${disclosure('한문과 함께 읽을 대목', `<div lang="zh-Hant">${render(original, practice)}</div>${render(references, practice)}`, 'original')}</div>
    <nav class="lesson-nav" aria-label="앞뒤 획">${previous}${next}</nav>
  </div>`);
});

function prosePage(source, title, description, group, extra = '') {
  const markdown = read(source).replace(/^# [^\n]+\n/, '');
  const [, href, label] = nav.find(([key]) => key === group);
  const location = pages[source] === href ? '' : breadcrumbs([[href, label]], title);
  save(pages[source], title + ' | 필진도', description, group, `<div class="shell narrow-page">
    ${location}${pageTitle(title, description)}${extra}<article class="prose">${render(markdown, source)}</article></div>`);
}

prosePage('docs/history.md', '위부인과 왕희지', '두 전칭 글에서 만나는 배움의 마음과, 역사에 남은 두 사람의 자취를 읽는다.', 'history', `<p class="history-jump"><a href="#어린-왕희지는-필진도로-배웠을까">어린 왕희지는 《필진도》로 배웠을까</a> · <a href="#이-글들은-어떤-쓰기를-전하려-했나">이 글들은 어떤 쓰기를 전하려 했나</a> · <a href="#붓을-들고-볼-세-작품">붓을 들고 볼 세 작품</a></p>`);
prosePage('docs/sources.md', '판본과 더 읽을 자료', '번역의 근거를 확인하고 여러 언어의 연구를 이어 읽는다.', 'sources', '<div class="library-links"><a href="facsimiles.html">고판본 판면</a><a href="chang.html">장쉰 3장 독서 길잡이</a><a href="rights.html">출전과 이용</a></div>');
prosePage('docs/chang.md', '장쉰의 3장과 함께 읽기', '', 'sources');
prosePage('docs/writing-style.md', '어떤 서체로 쓰나요', '', 'practice');
prosePage('RIGHTS.md', '출전과 이용 범위', '', 'sources');

const plates = [
  '《필진도》 제목과 서문',
  '붓과 벼루, 집필, 첫 여섯 획',
  '일곱째 획과 《제위부인필진도후》의 첫머리',
  '송익 이야기, 초서의 속도와 파획',
  '여러 비석을 배운 이야기와 글의 결말',
];
save('facsimiles.html', '고판본 판면 | 필진도', '일본 국립공문서관 소장 《진체비서》본 《법서요록》 권1.', 'sources', `<div class="shell">
  ${breadcrumbs([['sources.html', '자료실']], '고판본 판면')}
  ${pageTitle('고판본 판면', '《진체비서》본 《법서요록》 권1의 두 글이 이어지는 자리. 사진을 열면 크게 볼 수 있다.')}
  <div id="판면에서-바로-읽기" class="plate-grid">
  ${plates.map((caption, i) => {
    const number = i + 12;
    const src = `assets/plates/najda-${number}.jpg`;
    return `<figure><a href="${src}"><img src="${src}" alt="${number}번 펼침면 확대 · ${escape(caption)}" width="3000" height="2115" loading="lazy"></a>
      <figcaption><strong>${number}번 펼침면 · ${caption}</strong><br>
      <span lang="ja">国立公文書館所蔵「津逮秘書 第49冊目」</span></figcaption></figure>`;
  }).join('')}</div><p class="narrow-page plate-source"><a href="https://www.digital.archives.go.jp/item/3966350">소장 기록</a> · <a href="rights.html">이용 조건</a></p></div>`);

const introductionSource = 'docs/introduction.md';
const introduction = sections(introductionSource);
const [firstStroke] = introduction.parts;

save('index.html', '필진도 · 붓을 들기 전에', '위부인과 왕희지의 이름으로 전하는 글을 한국어로 읽으며, 마음에 담은 장면을 한글과 한자 한 획으로 옮겨 본다.', '', `<div class="shell">
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">위부인과 왕희지, 글씨를 배우는 마음</p>
      <h1>${escape(introduction.title)}</h1>
      ${render(introduction.lead, introductionSource)}
      <div class="hero-actions"><a class="action" href="#first-stroke">한 획 써 보기</a><a class="quiet-link" href="bizhentu.html">《필진도》 읽기</a></div>
    </div>
    <figure class="hero-art">
      <div class="home-model">${dotDetail}</div>
      <figcaption><div><strong>떨어지는 돌</strong><span>〈다보탑비〉의 윗점</span></div><a href="stroke-dot.html">점 써 보기</a></figcaption>
    </figure>
  </section>
  <section class="home-practice" id="first-stroke" aria-labelledby="first-stroke-title" tabindex="-1">
    <div><h2 id="first-stroke-title">${escape(firstStroke.title)}</h2>
    ${render(firstStroke.body, introductionSource)}
    <a class="quiet-link" href="${strokeHref(strokes[0])}">가로획 더 써 보기</a></div>
    <figure class="hero-art">
      <div class="home-model">${modelPhoto(strokes[0])}</div>
      <figcaption><span>〈다보탑비〉의 <span lang="zh-Hant">三</span></span></figcaption>
    </figure>
  </section>
  <section class="home-reading" aria-label="두 글 읽기">
    <a href="bizhentu.html"><span class="eyebrow">위부인의 이름으로 전하는 글</span><strong>필진도</strong><span>구름과 돌, 오래 마른 덩굴에서 획의 움직임을 배운다.</span></a>
    <a href="postface.html"><span class="eyebrow">왕희지의 이름으로 전하는 글</span><strong>제위부인필진도후</strong><span>마음을 가다듬고, 뜻이 붓보다 먼저 가게 한다.</span></a>
  </section></div>`);

console.log('정적 사이트를 생성했습니다. ' + fileURLToPath(output));
