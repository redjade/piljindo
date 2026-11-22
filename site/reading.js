const chapterLinks = [...document.querySelectorAll(".toc a")];
const modeLinks = [...document.querySelectorAll("[data-reading-mode]")];
const sections = chapterLinks.map((link) => document.getElementById(link.hash.slice(1)));
const readingActions = document.querySelector(".reading-actions");

function setChapter(chapter) {
  for (const link of chapterLinks) {
    if (link === chapter) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  }
  for (const link of modeLinks) link.hash = chapter?.hash ?? "";
}

function followHash() {
  const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
  const index = sections.indexOf(target?.closest(".chapter, .original-chapter"));
  setChapter(chapterLinks[index]);
}

function followScroll() {
  const anchorMargin = parseFloat(getComputedStyle(sections[0]).scrollMarginTop);
  const boundary = Math.max(readingActions.offsetHeight, anchorMargin) + 12;
  const index = sections.findLastIndex((section) => section.getBoundingClientRect().top <= boundary);
  const chapter = chapterLinks[index];
  if ((chapter?.hash ?? "") !== modeLinks[0].hash) setChapter(chapter);
}

followHash();
window.addEventListener("hashchange", followHash);
let scrollFrame;
window.addEventListener("scroll", () => {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = undefined;
    followScroll();
  });
}, { passive: true });

const toggle = document.querySelector("#gloss-toggle");
const notes = [...document.querySelectorAll(".annotated-original")];

if (toggle && notes.length) {
  const hint = readingActions.querySelector(".gloss-hint");
  const status = document.querySelector("#gloss-status");
  const glyph = status.querySelector(".gloss-glyph");
  const sound = status.querySelector(".gloss-sound");
  const meaning = status.querySelector(".gloss-meaning");
  const phrase = status.querySelector(".gloss-phrase");
  const context = status.querySelector(".gloss-context");
  let selected;
  let highlighted = [];
  new ResizeObserver(() => {
    document.documentElement.style.setProperty("--reading-toolbar", readingActions.offsetHeight + "px");
  }).observe(readingActions);

  toggle.hidden = false;
  toggle.addEventListener("click", () => {
    const show = toggle.getAttribute("aria-pressed") === "false";
    toggle.setAttribute("aria-pressed", String(show));
    hint.hidden = !show || Boolean(selected);
    status.hidden = !show || !selected;
    for (const note of notes) {
      note.hidden = !show;
      note.previousElementSibling.hidden = show;
    }
  });

  for (const note of notes) {
    const characters = [...note.querySelectorAll(".character")];
    let active = characters[0];
    for (const character of characters.slice(1)) character.tabIndex = -1;

    note.addEventListener("click", (event) => {
      const character = event.target.closest(".character");
      if (!character) return;
      active.tabIndex = -1;
      active = character;
      active.tabIndex = 0;
      selected?.setAttribute("aria-pressed", "false");
      for (const member of highlighted) member.classList.remove("in-phrase");
      highlighted = characters.filter((member) => member.dataset.unit === character.dataset.unit);
      for (const member of highlighted) member.classList.add("in-phrase");
      selected = character;
      selected.setAttribute("aria-pressed", "true");
      glyph.textContent = selected.textContent;
      sound.textContent = selected.dataset.sound || "획표";
      meaning.textContent = selected.dataset.meaning;
      phrase.textContent = selected.dataset.phrase === glyph.textContent ? "" : selected.dataset.phrase;
      context.textContent = selected.dataset.context;
      hint.hidden = true;
      status.hidden = false;
    });

    note.addEventListener("keydown", (event) => {
      const index = characters.indexOf(event.target);
      if (index < 0) return;
      const destination = {
        ArrowLeft: Math.max(0, index - 1),
        ArrowRight: Math.min(characters.length - 1, index + 1),
        Home: 0,
        End: characters.length - 1,
      }[event.key];
      if (destination === undefined) return;
      event.preventDefault();
      characters[destination].click();
      characters[destination].focus();
    });
  }
}
