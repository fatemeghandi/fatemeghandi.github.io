import * as THREE from "three";
import "./styles.css";

const app = document.querySelector("#app");
const loaderStartedAt = performance.now();
const desktopLayoutWidth = 1180;
const forceDesktopFromQuery = new URLSearchParams(window.location.search).has("desktop");
const hasTouchInput =
  navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches;
const hasMobileUserAgent = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
  navigator.userAgent
);
const forceDesktopView =
  forceDesktopFromQuery ||
  (hasTouchInput && !hasMobileUserAgent && Math.min(window.screen.width, window.screen.height) <= 920);
const viewportMeta = document.querySelector('meta[name="viewport"]');

if (forceDesktopView) {
  viewportMeta?.setAttribute("content", `width=${desktopLayoutWidth}, initial-scale=1.0`);
  document.documentElement.classList.add("force-desktop-view");
  document.body.classList.add("force-desktop-view");
}

function syncForcedDesktopScale() {
  if (!forceDesktopView || window.innerWidth >= 720) {
    document.body.classList.remove("scale-forced-desktop");
    document.documentElement.style.removeProperty("--desktop-zoom");
    document.documentElement.style.removeProperty("--desktop-height");
    return;
  }

  const zoom = window.innerWidth / desktopLayoutWidth;
  document.documentElement.style.setProperty("--desktop-zoom", zoom.toFixed(4));
  document.documentElement.style.setProperty("--desktop-height", `${Math.ceil(window.innerHeight / zoom)}px`);
  document.body.classList.add("scale-forced-desktop");
}

document.body.classList.add("is-loading");
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}
syncForcedDesktopScale();
window.scrollTo(0, 0);

let smallViewportCache = {
  width: 0,
  height: 0
};

function readSmallViewportHeight() {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;left:0;top:-10000px;width:1px;height:100svh;pointer-events:none;visibility:hidden;";
  document.body.appendChild(probe);
  const height = probe.getBoundingClientRect().height || window.innerHeight;
  probe.remove();
  return Math.round(height);
}

function stableMobileHeight() {
  if (
    smallViewportCache.height === 0 ||
    Math.abs(smallViewportCache.width - window.innerWidth) > 2
  ) {
    smallViewportCache = {
      width: window.innerWidth,
      height: readSmallViewportHeight()
    };
  }

  return smallViewportCache.height;
}

function visibleViewportHeight() {
  if (forceDesktopView && window.innerWidth < 720) {
    return Math.ceil(window.innerHeight / (window.innerWidth / desktopLayoutWidth));
  }

  if (window.innerWidth < 720) {
    return Math.round(window.visualViewport?.height || stableMobileHeight());
  }

  return window.innerHeight;
}

function syncCaseViewportHeight() {
  if (window.innerWidth < 720 && !forceDesktopView) {
    document.documentElement.style.setProperty("--case-vh", `${visibleViewportHeight()}px`);
    return;
  }

  document.documentElement.style.removeProperty("--case-vh");
}

function renderWidth() {
  return forceDesktopView && window.innerWidth < 720 ? desktopLayoutWidth : window.innerWidth;
}

function renderHeight() {
  if (forceDesktopView && window.innerWidth < 720) {
    return Math.ceil(window.innerHeight / (window.innerWidth / desktopLayoutWidth));
  }

  if (window.innerWidth < 720) {
    return stableMobileHeight();
  }

  return window.innerHeight;
}

function cameraAspect() {
  return renderWidth() / renderHeight();
}

function cameraFov() {
  const baseFov = THREE.MathUtils.degToRad(34);
  const baseAspect = 16 / 9;
  const aspect = cameraAspect();

  if (!forceDesktopView || aspect >= 1.2) {
    return 34;
  }

  return THREE.MathUtils.radToDeg(2 * Math.atan((Math.tan(baseFov / 2) * baseAspect) / aspect));
}

function rendererPixelRatioCap() {
  return window.innerWidth < 720 && !forceDesktopView ? 1.25 : 2;
}

syncCaseViewportHeight();

const galleryProjects = [
  { title: "Project 01" },
  { title: "Project 02" },
  { title: "Project 03" },
  { title: "Project 04" }
];
const caseStudyModules = import.meta.glob("./content/case-studies/*.md", {
  query: "?raw",
  import: "default",
  eager: true
});
const services = [
  {
    title: "Product Design",
    description: "From early flows to polished interfaces, shaping products that feel simple, useful, and easy to navigate.",
    icon: "design"
  },
  {
    title: "Product Discovery",
    description: "Research, insights, and product thinking to figure out what matters before jumping into solutions.",
    icon: "discovery"
  },
  {
    title: "Design Systems",
    description: "Scalable systems with clear tokens, reusable components, and the consistency that keeps everything together.",
    icon: "systems"
  },
  {
    title: "Interaction Design",
    description: "Prototypes, motion, and small interactions that make digital products feel natural, responsive, and alive.",
    icon: "interaction"
  }
];
const projectHorizontalStart = 0.66;
const projectHorizontalSpan = 0.18;
const projectExitStart = 0.86;
const projectExitSpan = 0.14;

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function displayTextHTML(value = "") {
  return escapeHTML(String(value).replace(/([A-Za-z])-([A-Za-z])/g, "$1\u2011$2"));
}

function renderInlineMarkdown(value = "") {
  const source = String(value);
  const inlinePattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+?)\*\*/g;
  let html = "";
  let lastIndex = 0;
  let match;

  while ((match = inlinePattern.exec(source)) !== null) {
    html += escapeHTML(source.slice(lastIndex, match.index));
    if (match[1] && match[2]) {
      html += `<a href="${escapeHTML(match[2])}" target="_blank" rel="noopener noreferrer">${escapeHTML(match[1])}</a>`;
    } else {
      html += `<strong>${escapeHTML(match[3])}</strong>`;
    }
    lastIndex = match.index + match[0].length;
  }

  html += escapeHTML(source.slice(lastIndex));
  return html;
}

function slugFromPath(path) {
  return path.split("/").pop()?.replace(/\.md$/i, "") || "case-study";
}

function parseFrontmatter(markdown) {
  if (!markdown.startsWith("---")) {
    return {
      data: {},
      body: markdown
    };
  }

  const end = markdown.indexOf("\n---", 3);
  if (end === -1) {
    return {
      data: {},
      body: markdown
    };
  }

  const raw = markdown.slice(3, end).trim();
  const body = markdown.slice(end + 4).trim();
  const data = {};

  raw.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      return;
    }

    const key = match[1].trim();
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  });

  return { data, body };
}

function parseFrontmatterList(value = "") {
  return String(value)
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .map((item) => item.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

function parseImageLine(line) {
  const match = line.match(/^!\[([^\]]*)\]\((\S+)(?:\s+"([^"]+)")?\)$/);
  if (!match) {
    return null;
  }

  const variant = ["text", "wide", "full", "bleed", "half"].includes(match[3]) ? match[3] : "wide";
  return {
    caption: match[1].trim(),
    src: match[2].trim(),
    variant
  };
}

function imageFigureMarkup(image) {
  const variant = image.variant === "half" ? "wide" : image.variant;
  return `
    <figure class="case-detail-media case-detail-media--${variant}">
      <img src="${escapeHTML(image.src)}" alt="${escapeHTML(image.caption)}" loading="lazy" />
      ${image.caption ? `<figcaption>${escapeHTML(image.caption)}</figcaption>` : ""}
    </figure>
  `;
}

function twoImageMarkup(images) {
  return `
    <div class="case-detail-two-images">
      ${images.map((image) => imageFigureMarkup({ ...image, variant: "wide" })).join("")}
    </div>
  `;
}

function markdownToDetailHTML(markdown) {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let paragraph = [];

  function flushParagraph() {
    if (!paragraph.length) {
      return;
    }

    blocks.push(`<p>${renderInlineMarkdown(paragraph.join(" ").trim())}</p>`);
    paragraph = [];
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    const image = parseImageLine(line);
    if (image) {
      flushParagraph();
      const nextImage = parseImageLine((lines[index + 1] || "").trim());
      if (image.variant === "half" && nextImage?.variant === "half") {
        blocks.push(twoImageMarkup([image, nextImage]));
        index += 1;
      } else {
        blocks.push(imageFigureMarkup(image));
      }
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      blocks.push(`<h1>${escapeHTML(line.slice(2).trim())}</h1>`);
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      blocks.push(`<h2>${escapeHTML(line.slice(3).trim())}</h2>`);
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      blocks.push(`<blockquote>${escapeHTML(line.slice(2).trim())}</blockquote>`);
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return blocks.join("\n");
}

function normalizeCaseStudy(path, markdown) {
  const { data, body } = parseFrontmatter(markdown);
  const slug = data.slug || slugFromPath(path);
  const tools = data.tools
    ? parseFrontmatterList(data.tools)
    : [];

  return {
    slug,
    order: Number(data.order || 999),
    title: data.title || slug.replaceAll("-", " "),
    description: data.description || "",
    cover: data.cover || "",
    role: data.role || "",
    timeline: data.timeline || "",
    platform: data.platform || "",
    year: data.year || "",
    tools,
    body,
    detailHTML: markdownToDetailHTML(body)
  };
}

const caseStudies = Object.entries(caseStudyModules)
  .map(([path, markdown]) => normalizeCaseStudy(path, markdown))
  .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
const casePageCount = Math.max(2, Math.ceil(caseStudies.length / 2));
const caseListViewportSpan = 1.34 + (casePageCount - 1) * 0.86;

function serviceIconMarkup(type) {
  const icons = {
    design: `
      <path class="service-icon-muted" d="M36 134 L62 82 L132 72 L166 118 L128 166 L58 158 Z" />
      <path d="M58 82 H154 V150 H58 Z" />
      <path d="M78 104 H132 M78 124 H116" />
      <path d="M146 66 L170 42 L184 58 L158 82 Z" />
      <path class="service-icon-muted" d="M170 42 L184 32 L184 58" />
    `,
    discovery: `
      <path class="service-icon-muted" d="M42 142 C72 92 124 66 174 80" />
      <path d="M76 88 C96 66 133 66 154 88 C176 112 168 150 140 164 C112 178 76 160 70 128 C67 112 68 100 76 88 Z" />
      <path d="M144 154 L184 194" />
      <path d="M93 118 H144 M118 94 V144" />
      <path class="service-icon-muted" d="M166 62 L178 42 L188 64 M42 84 L54 64 L64 86" />
    `,
    systems: `
      <path class="service-icon-muted" d="M32 150 L76 78 L156 82 L194 140" />
      <path d="M46 62 H98 V112 H46 Z" />
      <path d="M124 58 H178 V112 H124 Z" />
      <path d="M82 140 H136 V190 H82 Z" />
      <path d="M98 86 H124 M112 112 V140" />
      <path class="service-icon-muted" d="M56 166 H70 M148 82 H162 M104 164 H116" />
    `,
    interaction: `
      <path class="service-icon-muted" d="M36 154 C70 92 116 70 172 82" />
      <path d="M72 78 H156 V134 H72 Z" />
      <path d="M98 154 H188 L160 180 H64 Z" />
      <path d="M120 58 L188 148" />
      <path d="M186 148 L204 136 L198 166 Z" />
      <path class="service-icon-muted" d="M48 116 C60 100 78 96 96 106 M150 104 C164 92 180 94 194 106" />
    `
  };

  return `
    <svg class="service-icon-svg" viewBox="0 0 240 220" aria-hidden="true">
      ${icons[type] || icons.design}
    </svg>
  `;
}

app.innerHTML = `
  <div class="loader" aria-hidden="true">
    <svg class="loader-line" viewBox="0 0 240 34" role="img">
      <path class="loader-track" pathLength="100" d="M8 20 L31 12 L52 22 L75 11 L98 21 L120 13 L143 23 L166 10 L190 20 L213 14 L232 18" />
      <path class="loader-progress" pathLength="100" d="M8 20 L31 12 L52 22 L75 11 L98 21 L120 13 L143 23 L166 10 L190 20 L213 14 L232 18" />
    </svg>
  </div>
  <button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="site-menu">
    <span class="menu-toggle-line menu-toggle-line-top" aria-hidden="true"></span>
    <span class="menu-toggle-line menu-toggle-line-bottom" aria-hidden="true"></span>
  </button>
  <aside class="site-menu" id="site-menu" aria-hidden="true">
    <nav class="site-menu-nav" aria-label="Main navigation">
      <button class="site-menu-link" type="button" data-menu-target="about">About</button>
      <button class="site-menu-link" type="button" data-menu-target="services">Services</button>
      <button class="site-menu-link" type="button" data-menu-target="projects">Projects</button>
      <button class="site-menu-link" type="button" data-menu-target="case-studies">Case Studies</button>
      <button class="site-menu-link" type="button" data-menu-target="contact">Contact</button>
      <div class="site-menu-socials" aria-label="Contact links">
        <a class="footer-icon-link" href="https://www.linkedin.com/in/fatemeghandi/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
          <span class="contact-icon contact-icon-linkedin" aria-hidden="true">
            <svg class="contact-icon-svg" viewBox="0 0 24 24">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
              <path d="M2 9h4v12H2z" />
              <circle cx="4" cy="4.5" r="2" />
            </svg>
          </span>
        </a>
        <a class="footer-icon-link" href="mailto:fatemeeghandi@gmail.com" aria-label="Email Fateme">
          <span class="contact-icon contact-icon-mail" aria-hidden="true">
            <svg class="contact-icon-svg" viewBox="0 0 24 24">
              <path d="M4 6h16v12H4z" />
              <path d="M4 7l8 6 8-6" />
            </svg>
          </span>
        </a>
        <a class="footer-icon-link" href="tel:+989303564392" aria-label="Call Fateme">
          <span class="contact-icon contact-icon-phone" aria-hidden="true">
            <svg class="contact-icon-svg" viewBox="0 0 24 24">
              <path d="M22 16.92v2.35a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 3.5 2 2 0 0 1 4.11 1.4h2.35a2 2 0 0 1 2 1.72c0.12 0.9 0.32 1.78 0.58 2.63a2 2 0 0 1-0.45 2.11L7.6 8.85a16 16 0 0 0 7.56 7.56l0.99-0.99a2 2 0 0 1 2.11-0.45c0.85 0.26 1.73 0.46 2.63 0.58A2 2 0 0 1 22 16.92z" />
            </svg>
          </span>
        </a>
      </div>
    </nav>
  </aside>
  <canvas class="webgl" aria-label="Interactive white 3D line portrait object"></canvas>
  <main class="page-flow">
    <div class="scene-spacer" aria-hidden="true"></div>
    <section class="about-section" aria-label="About Fateme">
      <div class="about-panel">
        <div class="about-copy">
          <div class="speech-bubble">
            <h2 class="typed-title"></h2>
            <p class="typed-text"></p>
          </div>
        </div>
      </div>
    </section>
    <section class="services-section" aria-label="Services introduction"></section>
    <section class="service-list-section" aria-label="Services"></section>
    <section class="projects-intro-section" aria-label="Projects introduction"></section>
    <section class="project-list-section" aria-label="Selected projects"></section>
    <section class="case-studies-section" aria-label="Case studies introduction"></section>
    <section class="case-study-list-section" aria-label="Case study list" style="--case-pages: ${casePageCount}; --case-list-vh: ${caseListViewportSpan.toFixed(2)}"></section>
    <section class="contact-section" aria-label="Contact Fateme"></section>
    <section class="footer-section" aria-label="Footer"></section>
  </main>
  <div class="stage-copy" aria-hidden="true">
    <section class="stage-text is-active">
      <p>01 / SELF PORTRAIT</p>
      <h1>A few lines did their best.</h1>
    </section>
    <section class="stage-text">
      <p>02 / DESIGN BRAIN</p>
      <h2>Ideas rarely sit still.</h2>
    </section>
    <section class="stage-text">
      <p>03 / THE PROCESS</p>
      <h2>Messy first. Clear later.</h2>
    </section>
    <section class="stage-text">
      <p>04 / THE WORK</p>
      <h2>Somehow, it all makes sense.</h2>
    </section>
  </div>
  <div class="service-list" aria-label="Services">
    <div class="service-stack">
      ${services
        .map(
          (service, index) => `
            <article class="service-card ${index === 0 ? "is-selected" : ""}" style="--service-index: ${index}">
              <div class="service-card-line service-card-line-a"></div>
              <div class="service-card-line service-card-line-b"></div>
              <div class="service-icon">${serviceIconMarkup(service.icon)}</div>
              <div class="service-copy">
                <h3>${service.title}</h3>
                <p>${service.description}</p>
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  </div>
  <div class="project-gallery" aria-label="Project cards">
    <div class="project-track">
      ${galleryProjects
        .map(
          (project, index) => `
            <article class="project-card ${index === 0 ? "is-selected" : ""}" style="--card-index: ${index}">
              <div class="project-visual" aria-hidden="true"></div>
              <div class="project-card-line project-card-line-a"></div>
              <div class="project-card-line project-card-line-b"></div>
              <button class="project-button" type="button" aria-label="View ${project.title}">
                <span>view project</span>
                <span aria-hidden="true">→</span>
              </button>
            </article>
          `
        )
        .join("")}
    </div>
  </div>
  <div class="case-study-list ${caseStudies.length > 4 ? "has-extra-cases" : ""}" aria-label="Case studies">
    <div class="case-study-stack">
      ${caseStudies
        .map(
          (study, index) => `
            <article class="case-study-card ${index === 0 ? "is-selected" : ""}" style="--case-index: ${index}; --case-card-order: ${index}">
              <div class="case-card-line case-card-line-a"></div>
              <div class="case-card-line case-card-line-b"></div>
              <div class="case-picture" aria-hidden="true">
                ${
                  study.cover
                    ? `<img src="${escapeHTML(study.cover)}" alt="" loading="lazy" />`
                    : "<span>picture</span>"
                }
              </div>
              <div class="case-copy">
                <h3>${displayTextHTML(study.title)}</h3>
                <p>${escapeHTML(study.description)}</p>
              </div>
              <a class="case-button" href="#/case-studies/${encodeURIComponent(study.slug)}" aria-label="Read more about ${escapeHTML(study.title)}">
                <span>Read more</span>
              </a>
            </article>
          `
        )
        .join("")}
    </div>
  </div>
  <section class="contact-panel" aria-label="Contact">
    <div class="contact-inner">
      <div class="contact-left">
        <div class="contact-title-space" aria-hidden="true"></div>
        <p class="contact-description">
          Have a product idea, a messy problem, or just something worth talking through?
          Send me a note and I’ll get back to you soon.
        </p>
        <nav class="contact-links" aria-label="Contact links">
          <a class="contact-link" href="https://www.linkedin.com/in/fatemeghandi/" target="_blank" rel="noreferrer">
            <span class="contact-icon contact-icon-linkedin" aria-hidden="true">
              <svg class="contact-icon-svg" viewBox="0 0 24 24">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
                <path d="M2 9h4v12H2z" />
                <circle cx="4" cy="4.5" r="2" />
              </svg>
            </span>
            <span>LinkedIn</span>
          </a>
          <a class="contact-link" href="mailto:fatemeeghandi@gmail.com">
            <span class="contact-icon contact-icon-mail" aria-hidden="true">
              <svg class="contact-icon-svg" viewBox="0 0 24 24">
                <path d="M4 6h16v12H4z" />
                <path d="M4 7l8 6 8-6" />
              </svg>
            </span>
            <span>Email</span>
          </a>
          <a class="contact-link" href="tel:+989303564392">
            <span class="contact-icon contact-icon-phone" aria-hidden="true">
              <svg class="contact-icon-svg" viewBox="0 0 24 24">
                <path d="M22 16.92v2.35a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 3.5 2 2 0 0 1 4.11 1.4h2.35a2 2 0 0 1 2 1.72c0.12 0.9 0.32 1.78 0.58 2.63a2 2 0 0 1-0.45 2.11L7.6 8.85a16 16 0 0 0 7.56 7.56l0.99-0.99a2 2 0 0 1 2.11-0.45c0.85 0.26 1.73 0.46 2.63 0.58A2 2 0 0 1 22 16.92z" />
              </svg>
            </span>
            <span>Phone</span>
          </a>
        </nav>
      </div>
      <form class="contact-form" action="#" aria-label="Send a message">
        <label class="contact-field">
          <span>Name</span>
          <input type="text" name="name" autocomplete="name" placeholder="Your name" required>
        </label>
        <label class="contact-field">
          <span>Email</span>
          <input type="email" name="email" autocomplete="email" placeholder="you@email.com" required>
        </label>
        <label class="contact-field">
          <span>Subject</span>
          <input type="text" name="subject" placeholder="Project, role, collaboration...">
        </label>
        <label class="contact-field contact-field-message">
          <span>Message</span>
          <textarea name="message" placeholder="Tell me what you have in mind" required></textarea>
        </label>
        <input type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true" style="display:none">
        <input type="hidden" name="_captcha" value="false">
        <input type="hidden" name="_subject" value="New portfolio contact message">
        <input type="hidden" name="_template" value="table">
        <button class="contact-submit" type="submit">
          <span>Send message</span>
          <span aria-hidden="true">→</span>
        </button>
      </form>
    </div>
  </section>
  <footer class="site-footer" aria-label="Footer">
    <div class="footer-inner">
      <div class="footer-side footer-side-left" aria-hidden="true">
        <svg viewBox="0 0 280 240">
          <path class="footer-line footer-line-muted" d="M42 142 L118 78 L202 98 L232 50" />
          <path class="footer-line footer-line-muted" d="M63 167 H156 V111 H83 Z" />
          <path class="footer-line footer-line-muted" d="M166 146 H229 V92 H181 Z" />
          <path class="footer-line footer-line-thin" d="M104 44 H176 V92 H104 Z" />
          <path class="footer-line footer-line-thin" d="M222 50 L242 32 L235 60 Z" />
        </svg>
      </div>
      <div class="footer-main">
        <svg class="footer-word" viewBox="0 0 430 92" role="img" aria-labelledby="footer-word-title">
          <title id="footer-word-title">let’s talk</title>
          <path class="footer-word-shadow" d="M18 8 L18 72 M91 46 L43 46 L52 22 L79 20 L91 44 L79 69 L46 65 M114 16 L114 70 L130 76 M98 34 L137 34 M151 13 L146 28 M184 32 L160 24 L142 36 L151 50 L181 56 L188 70 L160 80 L139 70 M229 16 L229 70 L246 76 M213 34 L255 34 M285 32 C306 18 333 30 331 52 C330 67 316 78 299 75 C282 72 273 59 279 44 C281 39 283 35 285 32 M331 35 L331 75 M363 8 L363 72 M397 14 L397 72 M397 47 L425 27 M397 48 L426 74" />
          <path class="footer-word-line" d="M16 6 L16 70 M89 44 L41 44 L50 20 L77 18 L89 42 L77 67 L44 63 M112 14 L112 68 L128 74 M96 32 L135 32 M149 11 L144 26 M182 30 L158 22 L140 34 L149 48 L179 54 L186 68 L158 78 L137 68 M227 14 L227 68 L244 74 M211 32 L253 32 M283 30 C304 16 331 28 329 50 C328 65 314 76 297 73 C280 70 271 57 277 42 C279 37 281 33 283 30 M329 33 L329 73 M361 6 L361 70 M395 12 L395 70 M395 45 L423 25 M395 46 L424 72" />
        </svg>
        <div class="footer-portrait" aria-hidden="true">
          <svg viewBox="0 0 320 300" role="img">
            <path class="footer-line footer-line-muted" d="M96 118 C82 88 102 54 137 44 C178 31 221 49 232 84 C242 118 224 154 194 171" />
            <path class="footer-line footer-line-muted" d="M126 56 C140 25 191 18 214 50 C188 38 152 39 118 60" />
            <path class="footer-line" d="M103 92 C126 55 190 48 226 82 C218 113 201 148 172 165 C146 180 111 168 100 134 C95 117 96 103 103 92 Z" />
            <path class="footer-line" d="M118 100 C132 88 154 91 167 104" />
            <path class="footer-line" d="M175 104 C191 91 214 94 226 109" />
            <path class="footer-line" d="M124 122 C140 134 158 132 170 119" />
            <path class="footer-line" d="M177 121 C194 134 213 132 225 119" />
            <path class="footer-line footer-line-thin" d="M169 120 C172 118 175 118 178 121" />
            <path class="footer-line footer-line-muted" d="M121 91 C139 81 153 82 167 93" />
            <path class="footer-line footer-line-muted" d="M178 94 C196 84 212 87 226 100" />
            <path class="footer-line" d="M157 146 C170 154 185 154 198 145" />
            <path class="footer-line footer-line-muted" d="M91 124 C71 128 63 149 74 166 C84 182 108 180 119 162" />
            <path class="footer-line" d="M96 168 L77 256 L157 237 L235 258 L201 169" />
            <path class="footer-line footer-line-muted" d="M80 252 C122 218 188 218 240 252" />
            <path class="footer-line footer-line-thin" d="M73 171 C59 178 54 195 61 209" />
            <path class="footer-line footer-line-thin" d="M231 105 C247 110 256 125 256 143" />
          </svg>
        </div>
        <nav class="footer-links" aria-label="Footer contact links">
          <a class="footer-icon-link" href="https://www.linkedin.com/in/fatemeghandi/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
            <span class="contact-icon contact-icon-linkedin" aria-hidden="true">
              <svg class="contact-icon-svg" viewBox="0 0 24 24">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
                <path d="M2 9h4v12H2z" />
                <circle cx="4" cy="4.5" r="2" />
              </svg>
            </span>
          </a>
          <a class="footer-icon-link" href="mailto:fatemeeghandi@gmail.com" aria-label="Email Fateme">
            <span class="contact-icon contact-icon-mail" aria-hidden="true">
              <svg class="contact-icon-svg" viewBox="0 0 24 24">
                <path d="M4 6h16v12H4z" />
                <path d="M4 7l8 6 8-6" />
              </svg>
            </span>
          </a>
          <a class="footer-icon-link" href="tel:+989303564392" aria-label="Call Fateme">
            <span class="contact-icon contact-icon-phone" aria-hidden="true">
              <svg class="contact-icon-svg" viewBox="0 0 24 24">
                <path d="M22 16.92v2.35a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 3.5 2 2 0 0 1 4.11 1.4h2.35a2 2 0 0 1 2 1.72c0.12 0.9 0.32 1.78 0.58 2.63a2 2 0 0 1-0.45 2.11L7.6 8.85a16 16 0 0 0 7.56 7.56l0.99-0.99a2 2 0 0 1 2.11-0.45c0.85 0.26 1.73 0.46 2.63 0.58A2 2 0 0 1 22 16.92z" />
              </svg>
            </span>
          </a>
        </nav>
      </div>
      <div class="footer-side footer-side-right" aria-hidden="true">
        <svg viewBox="0 0 280 240">
          <path class="footer-line footer-line-muted" d="M38 165 H188 L233 190 H62 Z" />
          <path class="footer-line footer-line-muted" d="M77 88 H201 V165 H77 Z" />
          <path class="footer-line footer-line-thin" d="M97 121 H181" />
          <path class="footer-line footer-line-thin" d="M116 139 H164" />
          <path class="footer-line footer-line-muted" d="M198 53 L84 180" />
          <path class="footer-line footer-line-thin" d="M197 53 L224 46 L211 73 Z" />
        </svg>
      </div>
    </div>
  </footer>
  <main class="case-detail-page" aria-live="polite" hidden></main>
`;

const canvas = document.querySelector(".webgl");
const scene = new THREE.Scene();
scene.background = new THREE.Color("#111112");
scene.fog = new THREE.Fog("#111112", 7.5, 14);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, rendererPixelRatioCap()));
renderer.setSize(renderWidth(), renderHeight());
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(cameraFov(), cameraAspect(), 0.1, 100);
camera.position.set(0, 0.1, 8.2);
scene.add(camera);

const root = new THREE.Group();
scene.add(root);

const ambient = new THREE.AmbientLight("#ffffff", 0.6);
scene.add(ambient);

const keyLight = new THREE.PointLight("#ffffff", 42, 18, 1.7);
keyLight.position.set(-2.4, 2.2, 5.5);
scene.add(keyLight);

const rimLight = new THREE.PointLight("#cfd8ff", 26, 13, 2);
rimLight.position.set(3.2, -1.5, 4.2);
scene.add(rimLight);

const portraitMaterial = new THREE.MeshPhysicalMaterial({
  color: "#f7f6ef",
  emissive: "#ffffff",
  emissiveIntensity: 0.12,
  roughness: 0.42,
  metalness: 0.08,
  clearcoat: 0.55
});

const ghostMaterial = new THREE.MeshBasicMaterial({
  color: "#ffffff",
  transparent: true,
  opacity: 0.08
});

const stateCount = 4;
const darkSceneColor = new THREE.Color("#111112");
const lightSceneColor = new THREE.Color("#f7f6ef");
const stageItems = [...document.querySelectorAll(".stage-text")];
const sceneSpacer = document.querySelector(".scene-spacer");
const aboutSection = document.querySelector(".about-section");
const servicesSection = document.querySelector(".services-section");
const serviceListSection = document.querySelector(".service-list-section");
const projectsIntroSection = document.querySelector(".projects-intro-section");
const projectListSection = document.querySelector(".project-list-section");
const caseStudiesSection = document.querySelector(".case-studies-section");
const caseStudyListSection = document.querySelector(".case-study-list-section");
const contactSection = document.querySelector(".contact-section");
const footerSection = document.querySelector(".footer-section");
const aboutCopy = document.querySelector(".about-copy");
const typedTitle = document.querySelector(".typed-title");
const typedText = document.querySelector(".typed-text");
const serviceList = document.querySelector(".service-list");
const serviceStack = document.querySelector(".service-stack");
const serviceCards = [...document.querySelectorAll(".service-card")];
const projectGallery = document.querySelector(".project-gallery");
const projectTrack = document.querySelector(".project-track");
const projectCards = [...document.querySelectorAll(".project-card")];
const projectButtons = [...document.querySelectorAll(".project-button")];
const caseStudyList = document.querySelector(".case-study-list");
const caseStudyStack = document.querySelector(".case-study-stack");
const caseStudyCards = [...document.querySelectorAll(".case-study-card")];
const caseButtons = [...document.querySelectorAll(".case-button")];
const contactPanel = document.querySelector(".contact-panel");
const contactForm = document.querySelector(".contact-form");
const siteFooter = document.querySelector(".site-footer");
const menuToggle = document.querySelector(".menu-toggle");
const siteMenu = document.querySelector(".site-menu");
const siteMenuLinks = [...document.querySelectorAll(".site-menu-link")];
const caseDetailPage = document.querySelector(".case-detail-page");
const titleText = "Hi, I’m Fateme.";
const bioText =
  "I’m a product designer who likes taking messy ideas apart, finding what matters, and shaping them into simple, useful experiences. I care about clear flows, thoughtful details, and products that feel intuitive, with just enough personality to keep things interesting.";
const pointer = new THREE.Vector2();
let scrollTarget = 0;
let scrollSmooth = 0;
let sceneTransitionTarget = 0;
let sceneTransitionSmooth = 0;
let aboutTarget = 0;
let aboutWordsTarget = 0;
let aboutSmooth = 0;
let servicesTarget = 0;
let servicesSmooth = 0;
let serviceListTarget = 0;
let serviceListSmooth = 0;
let projectsIntroTarget = 0;
let projectsIntroSmooth = 0;
let projectListTarget = 0;
let projectListSmooth = 0;
let caseStudiesTarget = 0;
let caseStudiesSmooth = 0;
let caseListTarget = 0;
let caseListSmooth = 0;
let caseListPageTarget = 0;
let caseListPageSmooth = 0;
let contactTarget = 0;
let contactSmooth = 0;
let footerTarget = 0;
let footerSmooth = 0;
let aboutTyping = 0;
let hoverEnergy = 0;
let time = 0;
let siteIntroTime = 0;
let siteRevealed = false;
let lastFrameAt = performance.now();
let lastTypedLength = -1;
let aboutTextMode = "";
let aboutWordSpans = [];
let snapTimer = 0;
let snapLockTimer = 0;
let isSnapLocked = false;
let galleryDrag = null;
let touchSnap = null;
let caseDetailCloseTimer = 0;
let activeCaseDetailSlug = "";

function isMobileLayoutActive() {
  return window.innerWidth < 720 && !forceDesktopView;
}

function isInteractiveTouchTarget(target) {
  return Boolean(target?.closest?.("a, button, input, textarea, select, [contenteditable='true']"));
}

const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);

function ellipse(cx, cy, rx, ry, start = 0, end = Math.PI * 2, count = 42, z = 0) {
  const points = [];
  for (let i = 0; i < count; i += 1) {
    const t = start + (end - start) * (i / (count - 1));
    points.push(v(cx + Math.cos(t) * rx, cy + Math.sin(t) * ry, z + Math.sin(t * 2) * 0.05));
  }
  return points;
}

function polyline(points) {
  return points.map((point) => v(point[0], point[1], point[2] || 0));
}

function rectangle(cx, cy, w, h, z = 0) {
  return polyline([
    [cx - w / 2, cy - h / 2, z],
    [cx + w / 2, cy - h / 2, z],
    [cx + w / 2, cy + h / 2, z],
    [cx - w / 2, cy + h / 2, z],
    [cx - w / 2, cy - h / 2, z]
  ]);
}

function arc(cx, cy, rx, ry, start, end, count = 30, z = 0) {
  return ellipse(cx, cy, rx, ry, start, end, count, z);
}

function dot(x, y, z = 0, spread = 0.04) {
  return ellipse(x, y, spread, spread, 0, Math.PI * 2, 12, z);
}

function resample(points, count) {
  if (points.length === 1) {
    return Array.from({ length: count }, () => points[0].clone());
  }

  const distances = [0];
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += points[i - 1].distanceTo(points[i]);
    distances.push(total);
  }

  if (total === 0) {
    return Array.from({ length: count }, () => points[0].clone());
  }

  const sampled = [];
  for (let i = 0; i < count; i += 1) {
    const target = (total * i) / (count - 1);
    let segment = 1;
    while (segment < distances.length - 1 && distances[segment] < target) {
      segment += 1;
    }
    const prevDistance = distances[segment - 1];
    const nextDistance = distances[segment];
    const local = (target - prevDistance) / Math.max(nextDistance - prevDistance, 0.0001);
    sampled.push(points[segment - 1].clone().lerp(points[segment], local));
  }

  return sampled;
}

function mixPoints(a, b, t, wave, index) {
  return a.map((point, i) => {
    const p = point.clone().lerp(b[i], t);
    const ripple = Math.sin(time * 1.3 + i * 0.27 + index) * wave;
    p.z += ripple;
    p.x += pointer.x * 0.035 * Math.sin(i * 0.19 + index);
    p.y += pointer.y * 0.02 * Math.cos(i * 0.17 + index);
    return p;
  });
}

function smooth(value) {
  return value * value * (3 - 2 * value);
}

function interpolate(values, progress) {
  const scaled = progress * (stateCount - 1);
  const left = Math.min(stateCount - 2, Math.floor(scaled));
  const right = left + 1;
  const t = smooth(scaled - left);
  return THREE.MathUtils.lerp(values[left], values[right], t);
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function appendAboutWords(container, text, startIndex) {
  const fragment = document.createDocumentFragment();
  let index = startIndex;

  text.split(/(\s+)/).forEach((token) => {
    if (!token) {
      return;
    }

    if (/^\s+$/.test(token)) {
      fragment.appendChild(document.createTextNode(token));
      return;
    }

    const span = document.createElement("span");
    span.className = "about-word";
    span.textContent = token;
    span.dataset.wordIndex = String(index);
    fragment.appendChild(span);
    aboutWordSpans.push(span);
    index += 1;
  });

  container.replaceChildren(fragment);
  return index;
}

function renderMobileAboutText() {
  if (aboutTextMode === "mobile") {
    return;
  }

  aboutTextMode = "mobile";
  aboutWordSpans = [];
  const nextIndex = appendAboutWords(typedTitle, titleText, 0);
  appendAboutWords(typedText, bioText, nextIndex);
  lastTypedLength = -1;
}

function prepareDesktopAboutText() {
  if (aboutTextMode === "desktop") {
    return;
  }

  aboutTextMode = "desktop";
  aboutWordSpans = [];
  typedTitle.textContent = "";
  typedText.textContent = "";
  lastTypedLength = -1;
}

function updateMobileAboutWords(progress) {
  if (!aboutWordSpans.length) {
    return;
  }

  const reveal = smooth(clamp01((progress - 0.03) / 0.94));
  const activeCount = Math.max(1, Math.ceil(reveal * aboutWordSpans.length));
  aboutWordSpans.forEach((span, index) => {
    span.classList.toggle("is-active", index < activeCount);
  });
}

function frameDamp(rate, delta) {
  return 1 - Math.pow(1 - rate, delta * 60);
}

function laptopPointToScreen(point) {
  const projected = point.clone();
  projectsLaptopGroup.localToWorld(projected);
  projected.project(camera);

  return {
    x: (projected.x * 0.5 + 0.5) * window.innerWidth,
    y: (-projected.y * 0.5 + 0.5) * window.innerHeight
  };
}

const figureHead = ellipse(-0.55, 0.9, 0.24, 0.32, Math.PI * 0.18, Math.PI * 2.15, 36, 0.1);
const laptopScreen = rectangle(0.15, -0.18, 1.9, 1.1, 0.12);
const laptopBase = polyline([[-1.1, -0.78, 0.2], [1.25, -0.78, 0.2], [1.45, -0.95, 0.08], [-1.35, -0.95, 0.08], [-1.1, -0.78, 0.2]]);
const frameA = rectangle(-0.95, 0.68, 0.72, 0.58, 0.05);
const frameB = rectangle(0.02, 0.82, 0.8, 0.66, 0.24);
const frameC = rectangle(0.98, 0.55, 0.72, 0.52, -0.06);
const craftLaptopScreen = rectangle(0.02, -0.14, 2.06, 1.16, 0.06);
const craftLaptopBase = polyline([[-1.02, -0.82, 0.14], [1.1, -0.82, 0.14], [1.26, -0.96, 0.06], [-1.2, -0.96, 0.06], [-1.02, -0.82, 0.14]]);
const craftPencil = polyline([[-0.96, 0.44, 0.16], [-0.42, 0.24, 0.26], [0.16, 0.02, 0.3], [0.74, -0.18, 0.16]]);
const craftFrameA = rectangle(-0.54, 0.2, 0.58, 0.4, 0.06);
const craftFrameB = rectangle(0.38, 0.2, 0.58, 0.4, 0.08);
const craftFrameC = rectangle(0.02, 0.74, 0.72, 0.46, 0.14);
const craftWire = polyline([[-1.12, 0.96, -0.14], [-0.52, 1.2, 0.04], [0.0, 1.03, 0.18], [0.58, 1.22, 0.02], [1.12, 0.96, -0.14]]);

const strokeDefs = [
  {
    name: "face-outline",
    radius: 0.018,
    alpha: [1, 0, 0.18, 0],
    points: [
      ellipse(0, 0.42, 0.74, 1.02, Math.PI * 0.13, Math.PI * 2.12, 52, 0),
      figureHead,
      rectangle(0.15, -0.18, 1.9, 1.1, 0.12),
      frameB
    ]
  },
  {
    name: "hair-bun",
    radius: 0.024,
    alpha: [1, 0, 0.08, 0],
    points: [
      ellipse(0.02, 1.48, 0.44, 0.34, 0, Math.PI * 2, 46, -0.12),
      ellipse(-0.56, 1.29, 0.18, 0.16, 0, Math.PI * 2, 30, -0.08),
      polyline([[-0.72, 0.16, 0], [-0.42, 0.06, 0.15], [-0.1, 0.04, 0.24], [0.32, 0.12, 0.2], [0.68, 0.28, 0.1]]),
      polyline([[-1.1, 0.08, 0], [-0.72, 0.22, 0.16], [-0.25, 0.17, 0.28], [0.2, 0.32, 0.17], [0.74, 0.14, 0.04]])
    ]
  },
  {
    name: "hair-crown",
    radius: 0.017,
    alpha: [0.88, 0, 0.12, 0],
    points: [
      arc(-0.02, 1.01, 0.66, 0.5, Math.PI * 0.03, Math.PI * 1.04, 42, -0.05),
      polyline([[-0.78, 1.06, -0.04], [-0.57, 1.22, -0.02], [-0.35, 1.13, 0.06], [-0.16, 1.2, 0.02], [0.08, 1.12, -0.02]]),
      polyline([[-0.92, 0.26, 0.06], [-0.55, 0.3, 0.2], [-0.18, 0.23, 0.28], [0.22, 0.28, 0.16], [0.58, 0.22, 0.06]]),
      polyline([[-1.18, -0.14, 0], [-0.68, 0.1, 0.12], [-0.2, -0.03, 0.2], [0.44, 0.06, 0.08], [1.05, -0.12, 0]])
    ]
  },
  {
    name: "left-glasses",
    radius: 0.016,
    alpha: [1, 0, 0.15, 0],
    points: [
      ellipse(-0.36, 0.46, 0.27, 0.21, 0, Math.PI * 2, 42, 0.08),
      ellipse(-0.65, 0.93, 0.09, 0.07, 0, Math.PI * 2, 24, 0.08),
      rectangle(-0.45, -0.08, 0.42, 0.28, 0.16),
      rectangle(-0.74, 0.48, 0.5, 0.42, 0.08)
    ]
  },
  {
    name: "right-glasses",
    radius: 0.016,
    alpha: [1, 0, 0.15, 0],
    points: [
      ellipse(0.36, 0.46, 0.27, 0.21, 0, Math.PI * 2, 42, 0.08),
      ellipse(-0.43, 0.93, 0.09, 0.07, 0, Math.PI * 2, 24, 0.08),
      rectangle(0.64, -0.08, 0.42, 0.28, 0.16),
      rectangle(0.16, 0.76, 0.54, 0.46, 0.2)
    ]
  },
  {
    name: "glasses-bridge",
    radius: 0.013,
    alpha: [1, 0, 0.1, 0],
    points: [
      polyline([[-0.1, 0.48, 0.1], [0, 0.53, 0.14], [0.1, 0.48, 0.1]]),
      polyline([[-0.56, 0.93, 0.1], [-0.51, 0.97, 0.16], [-0.46, 0.93, 0.1]]),
      polyline([[-0.16, -0.12, 0.2], [0.04, -0.02, 0.24], [0.28, -0.13, 0.2]]),
      polyline([[-0.18, 1.0, 0.18], [0.02, 0.88, 0.2], [0.22, 1.02, 0.18]])
    ]
  },
  {
    name: "eyes",
    radius: 0.012,
    alpha: [1, 0, 0.03, 0],
    points: [
      polyline([[-0.43, 0.48, 0.16], [-0.33, 0.52, 0.18], [-0.24, 0.48, 0.16], [0.24, 0.48, 0.16], [0.34, 0.52, 0.18], [0.44, 0.48, 0.16]]),
      polyline([[-0.66, 0.9, 0.14], [-0.58, 0.93, 0.18], [-0.5, 0.9, 0.14], [-0.4, 0.9, 0.14], [-0.34, 0.92, 0.18], [-0.28, 0.89, 0.14]]),
      polyline([[-0.7, 0.2, 0.18], [-0.4, 0.18, 0.26], [-0.1, 0.2, 0.2], [0.22, 0.18, 0.25], [0.54, 0.2, 0.14]]),
      polyline([[-0.9, 0.72, 0.16], [-0.54, 0.72, 0.2], [-0.18, 0.72, 0.18], [0.22, 0.72, 0.22], [0.62, 0.72, 0.14]])
    ]
  },
  {
    name: "brows",
    radius: 0.014,
    alpha: [0.92, 0, 0.02, 0],
    points: [
      polyline([[-0.51, 0.72, 0.08], [-0.36, 0.79, 0.1], [-0.18, 0.74, 0.08], [0.18, 0.74, 0.08], [0.36, 0.79, 0.1], [0.51, 0.72, 0.08]]),
      polyline([[-0.69, 1.05, 0.08], [-0.58, 1.1, 0.12], [-0.46, 1.06, 0.08], [-0.38, 1.05, 0.08], [-0.29, 1.08, 0.12], [-0.2, 1.04, 0.08]]),
      polyline([[-0.66, 0.08, 0.15], [-0.34, 0.06, 0.22], [-0.02, 0.1, 0.18], [0.32, 0.05, 0.22], [0.64, 0.08, 0.14]]),
      polyline([[-0.72, 0.34, 0.1], [-0.36, 0.4, 0.2], [0.1, 0.36, 0.18], [0.55, 0.43, 0.12]])
    ]
  },
  {
    name: "nose-mouth",
    radius: 0.014,
    alpha: [1, 0, 0.04, 0],
    points: [
      polyline([[-0.04, 0.35, 0.2], [0.04, 0.09, 0.26], [-0.08, -0.02, 0.22], [0.08, -0.05, 0.22], [-0.24, -0.33, 0.16], [0, -0.39, 0.2], [0.25, -0.33, 0.16]]),
      polyline([[-0.55, 0.78, 0.2], [-0.5, 0.66, 0.25], [-0.58, 0.58, 0.2], [-0.47, 0.54, 0.2], [-0.62, 0.42, 0.16], [-0.5, 0.38, 0.18], [-0.36, 0.42, 0.16]]),
      polyline([[-0.34, -0.35, 0.32], [-0.12, -0.24, 0.36], [0.1, -0.35, 0.32], [0.34, -0.28, 0.34], [0.48, -0.42, 0.28], [0.2, -0.48, 0.28], [-0.16, -0.48, 0.3]]),
      polyline([[-0.88, -0.04, 0.16], [-0.5, 0.03, 0.26], [-0.12, -0.06, 0.28], [0.3, -0.02, 0.18], [0.86, -0.1, 0.08]])
    ]
  },
  {
    name: "left-hoop",
    radius: 0.013,
    alpha: [0.88, 0, 0.04, 0],
    points: [
      ellipse(-0.7, 0.08, 0.09, 0.15, 0, Math.PI * 2, 30, 0.02),
      ellipse(-0.79, 0.78, 0.04, 0.06, 0, Math.PI * 2, 18, 0.02),
      polyline([[-0.98, -0.58, 0.08], [-0.7, -0.5, 0.16], [-0.52, -0.46, 0.18], [-0.34, -0.5, 0.14], [-0.12, -0.58, 0.08]]),
      polyline([[-1.08, 0.18, 0.1], [-0.86, 0.15, 0.16], [-0.52, 0.1, 0.2], [-0.22, 0.14, 0.16], [0.05, 0.18, 0.14]])
    ]
  },
  {
    name: "right-hoop",
    radius: 0.013,
    alpha: [0.88, 0, 0.04, 0],
    points: [
      ellipse(0.7, 0.08, 0.09, 0.15, 0, Math.PI * 2, 30, 0.02),
      ellipse(-0.3, 0.78, 0.04, 0.06, 0, Math.PI * 2, 18, 0.02),
      polyline([[0.12, -0.58, 0.08], [0.35, -0.5, 0.14], [0.55, -0.48, 0.18], [0.76, -0.51, 0.14], [0.98, -0.58, 0.08]]),
      polyline([[0.08, 0.18, 0.14], [0.34, 0.11, 0.18], [0.54, 0.02, 0.22], [0.84, 0.08, 0.16], [1.12, 0.14, 0.1]])
    ]
  },
  {
    name: "jacket",
    radius: 0.02,
    alpha: [0.95, 0.48, 0.12, 0],
    points: [
      polyline([[-0.7, -0.62, 0], [-1.15, -1.42, -0.08], [-0.5, -1.08, 0.04], [0, -1.58, -0.04], [0.5, -1.08, 0.04], [1.15, -1.42, -0.08], [0.7, -0.62, 0]]),
      craftLaptopBase,
      laptopBase,
      polyline([[-1.12, -0.4, 0], [-0.56, -0.25, 0.12], [0.08, -0.38, 0.18], [0.62, -0.2, 0.05], [1.18, -0.38, 0]])
    ]
  },
  {
    name: "hands-pencil",
    radius: 0.018,
    alpha: [0, 0.62, 0.55, 0.08],
    points: [
      polyline([[-0.48, -0.78, 0], [-0.2, -0.98, 0.1], [0.2, -0.98, 0.1], [0.48, -0.78, 0]]),
      craftPencil,
      polyline([[-0.72, -0.36, 0.3], [-0.36, -0.24, 0.34], [-0.06, -0.36, 0.34], [0.28, -0.25, 0.36], [0.68, -0.38, 0.25]]),
      polyline([[-0.82, -0.72, 0.12], [-0.38, -0.58, 0.2], [0.04, -0.72, 0.22], [0.48, -0.56, 0.16], [0.88, -0.72, 0.08]])
    ]
  },
  {
    name: "laptop",
    radius: 0.019,
    alpha: [0.05, 1, 1, 0.12],
    points: [
      rectangle(0, -1.06, 0.7, 0.34, 0.04),
      craftLaptopScreen,
      rectangle(0, -0.02, 2.38, 1.42, 0.05),
      rectangle(-0.15, -0.22, 1.1, 0.6, 0.12)
    ]
  },
  {
    name: "design-frame-a",
    radius: 0.016,
    alpha: [0.02, 0.88, 1, 1],
    points: [
      dot(-0.4, -0.92, 0),
      craftFrameA,
      frameA,
      rectangle(-1.08, 0.5, 0.78, 1.0, 0.15)
    ]
  },
  {
    name: "design-frame-b",
    radius: 0.016,
    alpha: [0.02, 0.86, 1, 1],
    points: [
      dot(0.1, -1.0, 0),
      craftFrameB,
      frameB,
      rectangle(0, 0.78, 0.95, 1.2, 0.32)
    ]
  },
  {
    name: "design-frame-c",
    radius: 0.016,
    alpha: [0.02, 0.76, 0.95, 1],
    points: [
      dot(0.62, -0.9, 0),
      craftFrameC,
      frameC,
      rectangle(1.07, 0.36, 0.78, 0.92, -0.04)
    ]
  },
  {
    name: "wire-path",
    radius: 0.01,
    alpha: [0.4, 0.58, 0.9, 0.72],
    points: [
      polyline([[-1.22, 1.28, -0.2], [-0.62, 1.0, 0.05], [-0.15, 1.16, 0.18], [0.52, 1.02, 0.04], [1.12, 1.28, -0.2]]),
      craftWire,
      polyline([[-1.15, 1.12, -0.2], [-0.62, 1.54, 0.08], [0.05, 1.28, 0.24], [0.62, 1.56, 0.08], [1.18, 1.08, -0.2]]),
      polyline([[-1.28, 1.2, -0.12], [-0.56, 1.46, 0.1], [0.02, 1.18, 0.28], [0.62, 1.48, 0.08], [1.24, 1.16, -0.12]])
    ]
  },
  {
    name: "orbit-dot-a",
    radius: 0.026,
    alpha: [0.62, 0.36, 0.66, 0.84],
    points: [
      dot(-1.42, -0.84, -0.18, 0.035),
      dot(-1.34, 0.52, -0.2, 0.03),
      dot(-1.34, 1.08, -0.18, 0.03),
      dot(-1.32, -0.18, -0.18, 0.034)
    ]
  },
  {
    name: "orbit-dot-b",
    radius: 0.032,
    alpha: [0.66, 0.34, 0.7, 0.86],
    points: [
      dot(1.32, 1.28, -0.16, 0.045),
      dot(1.18, -0.64, -0.12, 0.035),
      dot(1.22, 1.02, -0.1, 0.04),
      dot(1.32, 1.08, -0.08, 0.046)
    ]
  },
  {
    name: "orbit-dot-c",
    radius: 0.021,
    alpha: [0.42, 0.3, 0.56, 0.64],
    points: [
      dot(-1.18, 0.98, -0.12, 0.025),
      dot(0.72, 1.24, -0.12, 0.025),
      dot(1.28, -0.76, -0.1, 0.028),
      dot(0.0, -1.0, 0.08, 0.03)
    ]
  }
];

const strokes = strokeDefs.map((def, index) => {
  const sampleCount = Math.max(34, ...def.points.map((points) => points.length));
  const states = def.points.map((points) => resample(points, sampleCount));
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), portraitMaterial.clone());
  mesh.material.transparent = true;
  mesh.material.opacity = def.alpha[0];
  mesh.material.depthWrite = false;
  root.add(mesh);
  return { ...def, index, states, mesh };
});

const ghostGroup = new THREE.Group();
root.add(ghostGroup);

for (let i = 0; i < 4; i += 1) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.25 + i * 0.38, 0.0035, 8, 96),
    ghostMaterial.clone()
  );
  ring.rotation.set(THREE.MathUtils.degToRad(74 + i * 5), 0, THREE.MathUtils.degToRad(i * 24));
  ring.position.z = -0.5 - i * 0.18;
  ghostGroup.add(ring);
}

const nameGroup = new THREE.Group();
nameGroup.position.set(0, 0.58, -0.58);
scene.add(nameGroup);

const mobileNameGroup = new THREE.Group();
mobileNameGroup.position.set(0, -1.42, -0.58);
scene.add(mobileNameGroup);

const nameMeshes = [];
const mobileNameMeshes = [];
const nameMaterial = new THREE.MeshBasicMaterial({
  color: "#f2eee5",
  transparent: true,
  opacity: 0,
  depthWrite: false
});

function namePath(points) {
  return points.map((point) => v(point[0], point[1], point[2] || 0));
}

function nameArc(cx, cy, rx, ry, start, end, count = 18) {
  const points = [];
  for (let i = 0; i < count; i += 1) {
    const t = start + (end - start) * (i / (count - 1));
    points.push(v(cx + Math.cos(t) * rx, cy + Math.sin(t) * ry, 0));
  }
  return points;
}

function glyphFor(letter) {
  const glyphs = {
    a: {
      width: 0.72,
      strokes: [
        nameArc(0.34, 0.38, 0.28, 0.31, Math.PI * 0.1, Math.PI * 2.05, 26),
        namePath([[0.61, 0.58], [0.61, 0.04], [0.69, 0]])
      ]
    },
    c: {
      width: 0.68,
      strokes: [
        nameArc(0.4, 0.4, 0.3, 0.32, Math.PI * 0.22, Math.PI * 1.82, 24)
      ]
    },
    d: {
      width: 0.76,
      strokes: [
        namePath([[0.61, 1.02], [0.61, 0.02]]),
        nameArc(0.34, 0.36, 0.28, 0.31, Math.PI * 1.55, Math.PI * 3.55, 28)
      ]
    },
    e: {
      width: 0.68,
      strokes: [
        namePath([[0.62, 0.52], [0.1, 0.52], [0.18, 0.78], [0.48, 0.78], [0.62, 0.55], [0.48, 0.22], [0.14, 0.18], [0.08, 0.4]])
      ]
    },
    f: {
      width: 0.58,
      strokes: [
        namePath([[0.42, 1.04], [0.2, 0.98], [0.18, 0.02]]),
        namePath([[0.02, 0.68], [0.52, 0.68]]),
        namePath([[0.18, 0.98], [0.56, 0.98]])
      ]
    },
    g: {
      width: 0.78,
      strokes: [
        nameArc(0.36, 0.46, 0.3, 0.32, Math.PI * 0.1, Math.PI * 2.05, 26),
        namePath([[0.62, 0.56], [0.62, -0.24], [0.48, -0.42], [0.14, -0.32]])
      ]
    },
    h: {
      width: 0.72,
      strokes: [
        namePath([[0.12, 1.02], [0.12, 0.02]]),
        namePath([[0.12, 0.47], [0.34, 0.72], [0.58, 0.57], [0.58, 0.02]])
      ]
    },
    i: {
      width: 0.32,
      strokes: [
        namePath([[0.16, 0.64], [0.16, 0.02]]),
        nameArc(0.16, 0.88, 0.035, 0.035, 0, Math.PI * 2, 12)
      ]
    },
    j: {
      width: 0.42,
      strokes: [
        namePath([[0.25, 0.64], [0.25, -0.18], [0.12, -0.34], [-0.04, -0.27]]),
        nameArc(0.25, 0.88, 0.035, 0.035, 0, Math.PI * 2, 12)
      ]
    },
    m: {
      width: 0.9,
      strokes: [
        namePath([[0.08, 0.02], [0.08, 0.7], [0.32, 0.44], [0.48, 0.7], [0.68, 0.44], [0.78, 0.02]])
      ]
    },
    n: {
      width: 0.72,
      strokes: [
        namePath([[0.08, 0.02], [0.08, 0.7], [0.32, 0.66], [0.58, 0.5], [0.58, 0.02]])
      ]
    },
    o: {
      width: 0.72,
      strokes: [
        nameArc(0.36, 0.4, 0.29, 0.32, Math.PI * 0.03, Math.PI * 2.03, 28)
      ]
    },
    p: {
      width: 0.72,
      strokes: [
        namePath([[0.11, -0.34], [0.11, 0.7]]),
        nameArc(0.35, 0.48, 0.26, 0.24, Math.PI * 1.55, Math.PI * 3.52, 24)
      ]
    },
    r: {
      width: 0.58,
      strokes: [
        namePath([[0.1, 0.02], [0.1, 0.7], [0.27, 0.62], [0.47, 0.68]])
      ]
    },
    s: {
      width: 0.64,
      strokes: [
        namePath([[0.58, 0.68], [0.34, 0.78], [0.12, 0.65], [0.2, 0.47], [0.48, 0.39], [0.58, 0.21], [0.32, 0.08], [0.08, 0.18]])
      ]
    },
    t: {
      width: 0.52,
      strokes: [
        namePath([[0.28, 0.98], [0.28, 0.12], [0.42, 0.02]]),
        namePath([[0.04, 0.7], [0.5, 0.7]])
      ]
    },
    u: {
      width: 0.72,
      strokes: [
        namePath([[0.09, 0.68], [0.09, 0.22], [0.27, 0.04], [0.5, 0.14], [0.6, 0.68]]),
        namePath([[0.6, 0.68], [0.6, 0.04], [0.68, 0]])
      ]
    },
    v: {
      width: 0.7,
      strokes: [
        namePath([[0.08, 0.68], [0.26, 0.05], [0.6, 0.68]])
      ]
    }
  };

  return glyphs[letter] || glyphs.e;
}

function buildNameWord(word, centerX, scale, startIndex, options = {}) {
  const group = options.group || nameGroup;
  const meshes = options.meshes || nameMeshes;
  const material = options.material || nameMaterial;
  const radius = options.radius || 0.009;
  const spacing = 0.12;
  const letters = [...word.toLowerCase()].map(glyphFor);
  const totalWidth = letters.reduce((sum, glyph) => sum + glyph.width + spacing, -spacing);
  let cursor = -totalWidth / 2;
  let meshIndex = startIndex;

  letters.forEach((glyph) => {
    glyph.strokes.forEach((stroke) => {
      const points = stroke.map((point) =>
        v(centerX + (cursor + point.x) * scale, (point.y - 0.5) * scale, point.z)
      );
      const curve = new THREE.CatmullRomCurve3(resample(points, 28), false, "centripetal", 0.55);
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 46, radius, 7, false), material.clone());
      mesh.userData.delay = meshIndex * (options.delayStep || 0.045);
      mesh.userData.homeZ = 0;
      group.add(mesh);
      meshes.push(mesh);
      meshIndex += 1;
    });
    cursor += glyph.width + spacing;
  });

  return meshIndex;
}

let nameStrokeIndex = 0;
nameStrokeIndex = buildNameWord("fateme", -2.12, 0.47, nameStrokeIndex);
buildNameWord("ghandi", 2.12, 0.47, nameStrokeIndex);

let mobileNameStrokeIndex = 0;
mobileNameStrokeIndex = buildNameWord("fateme", -0.55, 0.22, mobileNameStrokeIndex, {
  group: mobileNameGroup,
  meshes: mobileNameMeshes,
  material: nameMaterial,
  radius: 0.0065,
  delayStep: 0.035
});
buildNameWord("ghandi", 0.56, 0.22, mobileNameStrokeIndex, {
  group: mobileNameGroup,
  meshes: mobileNameMeshes,
  material: nameMaterial,
  radius: 0.0065,
  delayStep: 0.035
});

const aboutMaterial = new THREE.MeshPhysicalMaterial({
  color: "#171716",
  emissive: "#171716",
  emissiveIntensity: 0.02,
  roughness: 0.58,
  metalness: 0.03,
  clearcoat: 0.25,
  transparent: true,
  opacity: 0,
  depthWrite: false
});

const aboutSoftMaterial = new THREE.MeshBasicMaterial({
  color: "#aaa69c",
  transparent: true,
  opacity: 0,
  depthWrite: false
});

const aboutGroup = new THREE.Group();
aboutGroup.position.set(-2.55, -0.05, 0.45);
aboutGroup.scale.setScalar(1.05);
scene.add(aboutGroup);

const aboutMeshes = [];
const frameGroup = new THREE.Group();
scene.add(frameGroup);
const frameMeshes = [];

function addStaticTube(group, points, radius = 0.018, material = aboutMaterial, baseOpacity = 0.78) {
  const curve = new THREE.CatmullRomCurve3(resample(points, 54), false, "centripetal", 0.62);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 92, radius, 8, false), aboutMaterial.clone());
  mesh.material = material.clone();
  mesh.userData.baseOpacity = baseOpacity;
  group.add(mesh);
  aboutMeshes.push(mesh);
  return mesh;
}

function addFrameTube(points, radius = 0.018, material = aboutMaterial, baseOpacity = 0.8) {
  const curve = new THREE.CatmullRomCurve3(resample(points, 64), false, "centripetal", 0.6);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 104, radius, 8, false), material.clone());
  mesh.userData.baseOpacity = baseOpacity;
  frameGroup.add(mesh);
  frameMeshes.push(mesh);
  return mesh;
}

addStaticTube(aboutGroup, ellipse(-0.02, 0.48, 0.73, 0.9, Math.PI * 0.08, Math.PI * 1.86, 58, -0.28), 0.007, aboutSoftMaterial, 0.34);
addStaticTube(aboutGroup, ellipse(0.02, 0.46, 0.56, 0.72, Math.PI * 0.16, Math.PI * 1.78, 48, -0.22), 0.005, aboutSoftMaterial, 0.25);
addStaticTube(aboutGroup, arc(-0.08, 0.48, 0.48, 0.66, Math.PI * 0.45, Math.PI * 1.78, 48, 0.04), 0.018);
addStaticTube(
  aboutGroup,
  polyline([
    [-0.3, 0.98, 0.02],
    [0.04, 1.08, 0.08],
    [0.28, 0.9, 0.12],
    [0.18, 0.74, 0.18],
    [0.34, 0.63, 0.2],
    [0.22, 0.5, 0.22],
    [0.36, 0.42, 0.18],
    [0.15, 0.3, 0.13],
    [0.25, 0.19, 0.09],
    [0.0, 0.08, 0.04]
  ]),
  0.017
);
addStaticTube(aboutGroup, ellipse(-0.16, 1.22, 0.35, 0.25, 0, Math.PI * 2, 42, -0.06), 0.021);
addStaticTube(aboutGroup, arc(-0.15, 0.9, 0.46, 0.35, Math.PI * 0.05, Math.PI * 1.05, 36, 0), 0.014);
addStaticTube(aboutGroup, arc(-0.06, 1.04, 0.38, 0.22, Math.PI * 0.96, Math.PI * 1.88, 24, 0.04), 0.009);
addStaticTube(aboutGroup, polyline([[-0.42, 0.72, 0.1], [-0.22, 0.78, 0.14], [-0.06, 0.72, 0.12]]), 0.011);
addStaticTube(aboutGroup, ellipse(0.08, 0.62, 0.13, 0.1, 0, Math.PI * 2, 28, 0.18), 0.012);
const aboutMouthConnector = addStaticTube(
  aboutGroup,
  polyline([[0.2, 0.62, 0.17], [0.42, 0.59, 0.11], [0.62, 0.54, 0.04], [0.78, 0.49, 0]]),
  0.01
);
addStaticTube(aboutGroup, polyline([[-0.42, -0.08, 0], [-0.82, -0.76, -0.04], [-0.24, -0.56, 0.06], [0.3, -0.78, -0.04], [0.16, -0.06, 0]]), 0.019);
addStaticTube(aboutGroup, polyline([[-0.6, -0.16, 0.02], [-0.28, -0.3, 0.08], [0.05, -0.18, 0.08], [0.32, -0.34, 0.02]]), 0.009);
const aboutLowerConnector = addStaticTube(
  aboutGroup,
  polyline([[0.32, 0.3, 0.08], [0.72, 0.32, 0.05], [1.08, 0.27, 0.02], [1.55, 0.33, 0]]),
  0.012
);
addStaticTube(aboutGroup, ellipse(-0.62, 0.22, 0.08, 0.13, 0, Math.PI * 2, 24, 0.03), 0.009);
addStaticTube(aboutGroup, polyline([[-0.68, 0.2, 0.02], [-0.86, 0.1, -0.02], [-0.9, -0.08, -0.05]]), 0.006, aboutSoftMaterial, 0.42);

addFrameTube(polyline([[-0.44, 1.38, 0], [0.38, 1.43, 0.02], [1.24, 1.36, -0.01], [2.08, 1.42, 0.01], [3.22, 1.37, 0]]), 0.022, aboutMaterial, 0.88);
addFrameTube(polyline([[-0.44, 1.38, 0], [-0.5, 0.83, 0.02], [-0.43, 0.22, -0.01], [-0.49, -0.46, 0.02], [-0.42, -1.22, 0.02]]), 0.022, aboutMaterial, 0.9);
addFrameTube(polyline([[-0.42, -1.22, 0.02], [0.56, -1.29, -0.01], [1.66, -1.2, 0.02], [2.84, -1.27, -0.01], [4.08, -1.22, 0]]), 0.022, aboutMaterial, 0.88);
addFrameTube(polyline([[-0.54, 1.25, -0.08], [0.32, 1.33, -0.08], [1.18, 1.25, -0.08], [2.02, 1.31, -0.08], [3.0, 1.26, -0.08]]), 0.009, aboutSoftMaterial, 0.34);
addFrameTube(polyline([[-0.54, -1.07, -0.08], [0.52, -1.16, -0.08], [1.62, -1.08, -0.08], [2.76, -1.15, -0.08], [3.92, -1.1, -0.08]]), 0.009, aboutSoftMaterial, 0.36);
addFrameTube(polyline([[-0.32, 1.24, -0.12], [-0.38, 0.58, -0.12], [-0.32, -0.1, -0.12], [-0.38, -0.68, -0.12], [-0.32, -1.08, -0.12]]), 0.008, aboutSoftMaterial, 0.3);

const projectsMaterial = new THREE.MeshPhysicalMaterial({
  color: "#f7f6ef",
  emissive: "#ffffff",
  emissiveIntensity: 0.09,
  roughness: 0.46,
  metalness: 0.06,
  clearcoat: 0.5,
  transparent: true,
  opacity: 0,
  depthWrite: false
});

const projectsSoftMaterial = new THREE.MeshBasicMaterial({
  color: "#f7f6ef",
  transparent: true,
  opacity: 0,
  depthWrite: false
});

const projectsGroup = new THREE.Group();
scene.add(projectsGroup);

const projectsLaptopGroup = new THREE.Group();
scene.add(projectsLaptopGroup);

const projectsWordGroup = new THREE.Group();
scene.add(projectsWordGroup);

const projectMeshes = [];
const projectLaptopMeshes = [];
const projectWordMeshes = [];
const projectsWordMaterial = new THREE.MeshBasicMaterial({
  color: "#f2eee5",
  transparent: true,
  opacity: 0,
  depthWrite: false
});

function addProjectTube(group, points, radius = 0.015, material = projectsMaterial, baseOpacity = 0.82) {
  const curve = new THREE.CatmullRomCurve3(resample(points, 58), false, "centripetal", 0.62);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, radius, 8, false), material.clone());
  mesh.userData.baseOpacity = baseOpacity;
  group.add(mesh);
  projectMeshes.push(mesh);
  return mesh;
}

function addProjectLaptopTube(points, radius = 0.015, material = projectsMaterial, baseOpacity = 0.82) {
  const curve = new THREE.CatmullRomCurve3(resample(points, 58), false, "centripetal", 0.62);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, radius, 8, false), material.clone());
  mesh.userData.baseOpacity = baseOpacity;
  projectsLaptopGroup.add(mesh);
  projectLaptopMeshes.push(mesh);
  return mesh;
}

function tiltedRectangle(cx, cy, w, h, z = 0, tilt = 0.08) {
  return polyline([
    [cx - w / 2, cy - h / 2 + tilt, z],
    [cx + w / 2, cy - h / 2 - tilt, z + 0.04],
    [cx + w / 2, cy + h / 2 + tilt * 0.4, z],
    [cx - w / 2, cy + h / 2 - tilt * 0.4, z - 0.04],
    [cx - w / 2, cy - h / 2 + tilt, z]
  ]);
}

const servicesWordGroup = new THREE.Group();
scene.add(servicesWordGroup);

const servicesObjectGroup = new THREE.Group();
scene.add(servicesObjectGroup);

const servicesWordMeshes = [];
const servicesMeshes = [];
const servicesWordMaterial = new THREE.MeshBasicMaterial({
  color: "#171716",
  transparent: true,
  opacity: 0,
  depthWrite: false
});
const servicesMaterial = new THREE.MeshPhysicalMaterial({
  color: "#171716",
  emissive: "#171716",
  emissiveIntensity: 0.025,
  roughness: 0.6,
  metalness: 0.03,
  clearcoat: 0.24,
  transparent: true,
  opacity: 0,
  depthWrite: false
});
const servicesSoftMaterial = new THREE.MeshBasicMaterial({
  color: "#9c978e",
  transparent: true,
  opacity: 0,
  depthWrite: false
});

function addServicesTube(points, radius = 0.016, material = servicesMaterial, baseOpacity = 0.84) {
  const curve = new THREE.CatmullRomCurve3(resample(points, 62), false, "centripetal", 0.6);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 98, radius, 8, false), material.clone());
  mesh.userData.baseOpacity = baseOpacity;
  servicesObjectGroup.add(mesh);
  servicesMeshes.push(mesh);
  return mesh;
}

buildNameWord("services", 0, 0.52, 0, {
  group: servicesWordGroup,
  meshes: servicesWordMeshes,
  material: servicesWordMaterial,
  radius: 0.0105,
  delayStep: 0.033
});

addServicesTube(tiltedRectangle(-0.58, 0.48, 1.08, 0.72, 0.1, 0.06), 0.019, servicesMaterial, 0.88);
addServicesTube(tiltedRectangle(0.58, 0.08, 1.08, 0.72, 0.22, -0.04), 0.018, servicesMaterial, 0.82);
addServicesTube(tiltedRectangle(-0.2, -0.68, 1.28, 0.68, -0.05, 0.05), 0.018, servicesMaterial, 0.8);
addServicesTube(tiltedRectangle(-0.58, 0.48, 0.9, 0.54, -0.08, -0.025), 0.007, servicesSoftMaterial, 0.28);
addServicesTube(tiltedRectangle(0.58, 0.08, 0.9, 0.54, -0.05, 0.025), 0.007, servicesSoftMaterial, 0.26);
addServicesTube(tiltedRectangle(-0.2, -0.68, 1.08, 0.5, -0.14, -0.02), 0.007, servicesSoftMaterial, 0.25);
addServicesTube(polyline([[-1.02, 0.5, 0.22], [-0.84, 0.34, 0.26], [-0.56, 0.64, 0.24]]), 0.011, servicesMaterial, 0.72);
addServicesTube(polyline([[0.12, 0.1, 0.3], [0.28, -0.06, 0.34], [0.62, 0.26, 0.32]]), 0.011, servicesMaterial, 0.66);
addServicesTube(polyline([[-0.72, -0.68, 0.16], [-0.5, -0.84, 0.22], [-0.06, -0.46, 0.2]]), 0.011, servicesMaterial, 0.68);
addServicesTube(polyline([[-0.08, 0.25, -0.16], [0.16, 0.2, -0.04], [0.42, 0.02, 0.08]]), 0.008, servicesSoftMaterial, 0.38);
addServicesTube(polyline([[-0.4, 0.12, -0.18], [-0.3, -0.26, -0.08], [-0.2, -0.48, 0.02]]), 0.008, servicesSoftMaterial, 0.34);
addServicesTube(polyline([[0.74, -0.66, 0.2], [1.26, 0.34, 0.32]]), 0.017, servicesMaterial, 0.78);
addServicesTube(polyline([[1.24, 0.36, 0.32], [1.42, 0.42, 0.28], [1.34, 0.24, 0.26], [1.24, 0.36, 0.32]]), 0.011, servicesMaterial, 0.66);
addServicesTube(ellipse(-1.16, 0.94, 0.055, 0.055, 0, Math.PI * 2, 16, -0.1), 0.012, servicesSoftMaterial, 0.34);
addServicesTube(ellipse(1.12, -0.32, 0.05, 0.05, 0, Math.PI * 2, 16, -0.08), 0.011, servicesSoftMaterial, 0.3);
addServicesTube(polyline([[-1.22, 0.92, -0.14], [-0.7, 1.12, 0.02], [-0.06, 0.92, 0.12], [0.62, 1.06, 0.02], [1.12, 0.82, -0.14]]), 0.007, servicesSoftMaterial, 0.28);

buildNameWord("projects", 0, 0.54, 0, {
  group: projectsWordGroup,
  meshes: projectWordMeshes,
  material: projectsWordMaterial,
  radius: 0.01,
  delayStep: 0.035
});

addProjectTube(projectsGroup, tiltedRectangle(-0.45, 0.54, 0.9, 1.08, 0.12, 0.08), 0.018, projectsMaterial, 0.88);
addProjectTube(projectsGroup, tiltedRectangle(0.62, 0.7, 0.8, 0.95, 0.32, -0.06), 0.015, projectsMaterial, 0.74);
addProjectTube(projectsGroup, tiltedRectangle(1.26, 0.2, 0.68, 0.78, -0.1, 0.05), 0.014, projectsMaterial, 0.66);
addProjectTube(projectsGroup, tiltedRectangle(-1.18, 0.03, 0.72, 0.82, -0.16, -0.05), 0.012, projectsSoftMaterial, 0.28);
addProjectLaptopTube(polyline([[-0.78, -0.82, 0.08], [0.96, -0.82, 0.18], [1.24, -0.99, 0.06], [-1.06, -0.99, -0.02], [-0.78, -0.82, 0.08]]), 0.02, projectsMaterial, 0.82);
addProjectLaptopTube(tiltedRectangle(0.06, -0.22, 1.62, 0.92, 0.16, 0.04), 0.018, projectsMaterial, 0.9);
addProjectLaptopTube(polyline([[-0.56, -0.88, 0.24], [0.74, -0.88, 0.3]]), 0.008, projectsSoftMaterial, 0.42);
addProjectTube(projectsGroup, polyline([[-1.48, -0.52, 0.38], [0.72, 1.06, 0.44]]), 0.016, projectsMaterial, 0.84);
addProjectTube(projectsGroup, polyline([[0.72, 1.06, 0.44], [0.93, 1.02, 0.4], [0.79, 0.86, 0.38], [0.72, 1.06, 0.44]]), 0.012, projectsMaterial, 0.78);
addProjectTube(projectsGroup, polyline([[-1.48, -0.52, 0.38], [-1.65, -0.65, 0.34], [-1.56, -0.79, 0.3]]), 0.01, projectsSoftMaterial, 0.4);
addProjectTube(projectsGroup, polyline([[-1.0, 1.16, -0.18], [-0.42, 1.36, 0.06], [0.16, 1.18, 0.24], [0.84, 1.36, 0.04], [1.5, 1.06, -0.18]]), 0.009, projectsSoftMaterial, 0.36);
addProjectTube(projectsGroup, polyline([[-1.25, 0.88, -0.12], [-0.66, 0.98, 0.08], [-0.06, 0.84, 0.18], [0.58, 0.98, 0.1], [1.38, 0.82, -0.08]]), 0.008, projectsSoftMaterial, 0.28);
addProjectTube(projectsGroup, ellipse(-0.96, 1.18, 0.055, 0.055, 0, Math.PI * 2, 16, 0.08), 0.014, projectsMaterial, 0.7);
addProjectTube(projectsGroup, ellipse(1.46, 0.96, 0.065, 0.065, 0, Math.PI * 2, 16, 0.03), 0.016, projectsMaterial, 0.72);
addProjectTube(projectsGroup, ellipse(0.1, 0.18, 0.08, 0.08, 0, Math.PI * 2, 20, 0.28), 0.012, projectsSoftMaterial, 0.36);
const laptopScreenFrameA = addProjectLaptopTube(
  polyline([[-0.43, 0.15, 0.24], [-0.08, 0.12, 0.27], [-0.08, 0.42, 0.27], [-0.43, 0.45, 0.24], [-0.43, 0.15, 0.24]]),
  0.008,
  projectsSoftMaterial,
  0.48
);
const laptopScreenFrameB = addProjectLaptopTube(
  polyline([[0.16, 0.12, 0.27], [0.5, 0.1, 0.3], [0.5, 0.4, 0.3], [0.16, 0.42, 0.27], [0.16, 0.12, 0.27]]),
  0.008,
  projectsSoftMaterial,
  0.48
);

const caseTitleGroup = new THREE.Group();
scene.add(caseTitleGroup);
const caseMobileTitleGroup = new THREE.Group();
scene.add(caseMobileTitleGroup);
const caseMobileTopGroup = new THREE.Group();
const caseMobileBottomGroup = new THREE.Group();
caseMobileTitleGroup.add(caseMobileTopGroup, caseMobileBottomGroup);

const caseObjectGroup = new THREE.Group();
scene.add(caseObjectGroup);

const caseTitleMeshes = [];
const caseMobileTitleMeshes = [];
const caseMeshes = [];
const caseTitleMaterial = new THREE.MeshBasicMaterial({
  color: "#171716",
  transparent: true,
  opacity: 0,
  depthWrite: false
});
const caseMaterial = new THREE.MeshPhysicalMaterial({
  color: "#171716",
  emissive: "#171716",
  emissiveIntensity: 0.025,
  roughness: 0.58,
  metalness: 0.03,
  clearcoat: 0.25,
  transparent: true,
  opacity: 0,
  depthWrite: false
});
const caseSoftMaterial = new THREE.MeshBasicMaterial({
  color: "#9c978e",
  transparent: true,
  opacity: 0,
  depthWrite: false
});

buildNameWord("case", -1.18, 0.5, 0, {
  group: caseTitleGroup,
  meshes: caseTitleMeshes,
  material: caseTitleMaterial,
  radius: 0.0105,
  delayStep: 0.032
});
buildNameWord("studies", 1.02, 0.5, caseTitleMeshes.length, {
  group: caseTitleGroup,
  meshes: caseTitleMeshes,
  material: caseTitleMaterial,
  radius: 0.0105,
  delayStep: 0.032
});
buildNameWord("case", 0, 0.43, 0, {
  group: caseMobileTopGroup,
  meshes: caseMobileTitleMeshes,
  material: caseTitleMaterial,
  radius: 0.009,
  delayStep: 0.032
});
buildNameWord("studies", 0, 0.43, caseMobileTitleMeshes.length, {
  group: caseMobileBottomGroup,
  meshes: caseMobileTitleMeshes,
  material: caseTitleMaterial,
  radius: 0.009,
  delayStep: 0.032
});

function addCaseTube(points, radius = 0.017, material = caseMaterial, baseOpacity = 0.84) {
  const curve = new THREE.CatmullRomCurve3(resample(points, 62), false, "centripetal", 0.6);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 102, radius, 8, false), material.clone());
  mesh.userData.baseOpacity = baseOpacity;
  caseObjectGroup.add(mesh);
  caseMeshes.push(mesh);
  return mesh;
}

addCaseTube(tiltedRectangle(0, -0.08, 2.42, 1.55, 0.12, 0.08), 0.021, caseMaterial, 0.9);
addCaseTube(tiltedRectangle(0.06, -0.12, 2.2, 1.34, -0.1, -0.035), 0.008, caseSoftMaterial, 0.34);
addCaseTube(polyline([[0.82, 0.75, 0.16], [1.08, 0.54, 0.22], [0.82, 0.48, 0.18], [0.82, 0.75, 0.16]]), 0.011, caseMaterial, 0.72);
[
  [[-0.82, 0.36, 0.22], [-0.35, 0.42, 0.28], [0.18, 0.36, 0.24], [0.68, 0.4, 0.2]],
  [[-0.9, 0.12, 0.18], [-0.48, 0.08, 0.24], [0.02, 0.14, 0.22], [0.74, 0.08, 0.16]],
  [[-0.76, -0.12, 0.2], [-0.2, -0.08, 0.25], [0.42, -0.16, 0.2]],
  [[-0.86, -0.36, 0.18], [-0.42, -0.3, 0.22], [0.08, -0.36, 0.2], [0.56, -0.32, 0.16]],
  [[-0.7, -0.58, 0.14], [-0.18, -0.53, 0.2], [0.38, -0.58, 0.16]]
].forEach((line, index) => {
  addCaseTube(polyline(line), index === 0 ? 0.008 : 0.007, index % 2 ? caseSoftMaterial : caseMaterial, index % 2 ? 0.38 : 0.58);
});
addCaseTube(polyline([[1.22, -0.72, 0.26], [1.78, 0.24, 0.34]]), 0.018, caseMaterial, 0.84);
addCaseTube(polyline([[1.75, 0.27, 0.34], [1.9, 0.38, 0.3], [1.86, 0.18, 0.28], [1.75, 0.27, 0.34]]), 0.011, caseMaterial, 0.72);
addCaseTube(polyline([[1.08, -0.9, 0.18], [1.34, -0.78, 0.26], [1.48, -0.58, 0.28]]), 0.008, caseSoftMaterial, 0.4);
addCaseTube(ellipse(-1.12, 0.72, 0.055, 0.055, 0, Math.PI * 2, 16, -0.12), 0.012, caseSoftMaterial, 0.34);
addCaseTube(ellipse(1.12, -0.72, 0.045, 0.045, 0, Math.PI * 2, 16, -0.1), 0.01, caseSoftMaterial, 0.3);

const contactTitleGroup = new THREE.Group();
scene.add(contactTitleGroup);

const contactTitleMeshes = [];
const contactTitleMaterial = new THREE.MeshBasicMaterial({
  color: "#f2eee5",
  transparent: true,
  opacity: 0,
  depthWrite: false
});

buildNameWord("contact", 0, 0.5, 0, {
  group: contactTitleGroup,
  meshes: contactTitleMeshes,
  material: contactTitleMaterial,
  radius: 0.0105,
  delayStep: 0.035
});
const contactTitleBounds = new THREE.Box3().setFromObject(contactTitleGroup);

function rebuildStroke(stroke, progress) {
  const scaled = progress * (stateCount - 1);
  const left = Math.min(stateCount - 2, Math.floor(scaled));
  const right = left + 1;
  const local = smooth(scaled - left);
  const points = mixPoints(
    stroke.states[left],
    stroke.states[right],
    local,
    0.018 + hoverEnergy * 0.035,
    stroke.index
  );

  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.6);
  const radius = stroke.radius * (1 + hoverEnergy * 0.35);
  const geometry = new THREE.TubeGeometry(curve, Math.max(48, points.length * 2), radius, 8, false);

  stroke.mesh.geometry.dispose();
  stroke.mesh.geometry = geometry;
  stroke.mesh.material.opacity = interpolate(stroke.alpha, progress);
  stroke.mesh.visible = stroke.mesh.material.opacity > 0.015;
}

function updateScroll() {
  const heroRange = Math.max(1, sceneSpacer.offsetHeight - window.innerHeight);
  const isMobile = isMobileLayoutActive();
  const viewportH = isMobile ? visibleViewportHeight() : window.innerHeight;
  const servicesTop = servicesSection.offsetTop;
  const serviceListTop = serviceListSection.offsetTop;
  const projectsTop = projectsIntroSection.offsetTop;
  const projectListTop = projectListSection.offsetTop;
  const caseStudiesTop = caseStudiesSection.offsetTop;
  const caseListTop = caseStudyListSection.offsetTop;
  const contactTop = contactSection.offsetTop;
  const footerTop = footerSection.offsetTop;
  const projectListRange = Math.max(1, projectListSection.offsetHeight - window.innerHeight);
  const caseListPageRange = Math.max(viewportH * 0.86 * (casePageCount - 1), 1);
  scrollTarget = clamp01(window.scrollY / heroRange);
  sceneTransitionTarget = isMobile
    ? clamp01((window.scrollY - heroRange - viewportH * 0.08) / (viewportH * 0.86))
    : clamp01((window.scrollY - heroRange - window.innerHeight * 0.08) / (window.innerHeight * 0.82));
  aboutTarget = isMobile
    ? clamp01((window.scrollY - sceneSpacer.offsetHeight + window.innerHeight * 0.02) / (window.innerHeight * 0.72))
    : clamp01((window.scrollY - sceneSpacer.offsetHeight + window.innerHeight * 0.14) / (window.innerHeight * 0.46));
  aboutWordsTarget = isMobile
    ? clamp01((window.scrollY - sceneSpacer.offsetHeight + window.innerHeight * 0.02) / (window.innerHeight * 2.65))
    : aboutTarget;
  servicesTarget = isMobile
    ? clamp01((window.scrollY - servicesTop + window.innerHeight * 0.62) / (window.innerHeight * 0.7))
    : clamp01((window.scrollY - servicesTop + window.innerHeight * 0.18) / (window.innerHeight * 0.72));
  serviceListTarget = isMobile
    ? clamp01((window.scrollY - serviceListTop + window.innerHeight * 0.22) / (window.innerHeight * 0.95))
    : clamp01((window.scrollY - serviceListTop + window.innerHeight * 0.2) / (window.innerHeight * 0.52));
  projectsIntroTarget = clamp01((window.scrollY - projectsTop + window.innerHeight * 0.16) / (window.innerHeight * 0.72));
  projectListTarget = clamp01((window.scrollY - projectListTop + window.innerHeight * 0.08) / projectListRange);
  caseStudiesTarget = isMobile
    ? clamp01((window.scrollY - caseStudiesTop + window.innerHeight * 0.68) / (window.innerHeight * 0.72))
    : clamp01((window.scrollY - caseStudiesTop + window.innerHeight * 0.18) / (window.innerHeight * 0.72));
  caseListTarget = isMobile
    ? clamp01((window.scrollY - caseListTop + viewportH * 0.24) / (viewportH * 0.74))
    : clamp01((window.scrollY - caseListTop + window.innerHeight * 0.22) / (window.innerHeight * 0.4));
  caseListPageTarget = isMobile
    ? clamp01((window.scrollY - caseListTop - viewportH * 0.62) / caseListPageRange)
    : clamp01((window.scrollY - desktopCaseListScrollStart()) / desktopCaseListScrollRange());
  contactTarget = clamp01((window.scrollY - contactTop + window.innerHeight * 0.22) / (window.innerHeight * 0.38));
  footerTarget = clamp01((window.scrollY - footerTop + window.innerHeight * 0.08) / (window.innerHeight * 0.24));
  updateMenuCurrent();
}

function scrollLimit() {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

function setMenuOpen(isOpen) {
  document.body.classList.toggle("menu-open", isOpen);
  menuToggle?.setAttribute("aria-expanded", String(isOpen));
  menuToggle?.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  siteMenu?.setAttribute("aria-hidden", String(!isOpen));
}

function menuTargetTop(target) {
  const targets = {
    about: sceneSpacer.offsetHeight + window.innerHeight * 0.18,
    services: servicesSection.offsetTop + window.innerHeight * (isMobileLayoutActive() ? -0.08 : 0.34),
    projects: projectsIntroSection.offsetTop + window.innerHeight * 0.56,
    "case-studies": caseStudiesSection.offsetTop + window.innerHeight * (isMobileLayoutActive() ? -0.08 : 0.34),
    contact: contactSection.offsetTop
  };

  return Math.max(0, Math.min(scrollLimit(), targets[target] ?? 0));
}

function caseStudyCardTargetTop() {
  return caseStudyListSection.offsetTop + window.innerHeight * (isMobileLayoutActive() ? 0.22 : 0.18);
}

function isMobileCaseListNativeScrollZone(y = window.scrollY) {
  if (!isMobileLayoutActive()) {
    return false;
  }

  const viewportH = visibleViewportHeight();
  const start = caseStudyListSection.offsetTop + viewportH * 0.1;
  const end = contactSection.offsetTop - viewportH * 0.08;
  return y >= start && y <= end;
}

function closeMenuAndScroll(target) {
  setMenuOpen(false);
  if (document.body.classList.contains("case-detail-open")) {
    history.replaceState("", document.title, window.location.pathname + window.location.search);
    closeCaseDetail({
      afterClose: () => {
        snapToY(menuTargetTop(target), "smooth");
        lockSnap(isMobileLayoutActive() ? 980 : 1180);
      }
    });
    return;
  }
  snapToY(menuTargetTop(target), "smooth");
  lockSnap(isMobileLayoutActive() ? 980 : 1180);
}

function updateMenuCurrent() {
  if (!siteMenuLinks.length) {
    return;
  }

  const y = window.scrollY;
  const targets = [
    ["about", menuTargetTop("about")],
    ["services", menuTargetTop("services")],
    ["projects", menuTargetTop("projects")],
    ["case-studies", menuTargetTop("case-studies")],
    ["contact", menuTargetTop("contact")]
  ].sort((a, b) => a[1] - b[1]);
  const threshold = window.innerHeight * 0.26;
  let current = "";

  targets.forEach(([name, top]) => {
    if (y >= top - threshold) {
      current = name;
    }
  });

  siteMenuLinks.forEach((link) => {
    const isCurrent = link.dataset.menuTarget === current;
    if (isCurrent) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function caseStudyFromHash() {
  const match = window.location.hash.match(/^#\/case-studies\/([^/?#]+)/);
  if (!match) {
    return null;
  }

  const slug = decodeURIComponent(match[1]);
  return caseStudies.find((study) => study.slug === slug) || null;
}

function caseMetaMarkup(study) {
  const rows = [
    ["Role", study.role],
    ["Timeline", study.timeline],
    ["Platform", study.platform],
    ["Year", study.year],
    ["Tools", study.tools.join(", ")]
  ].filter(([, value]) => value);

  if (!rows.length) {
    return "";
  }

  return `
    <dl class="case-detail-meta">
      ${rows
        .map(
          ([label, value]) => `
            <div>
              <dt>${escapeHTML(label)}</dt>
              <dd>${displayTextHTML(value)}</dd>
            </div>
          `
        )
        .join("")}
    </dl>
  `;
}

function renderCaseDetail(study) {
  if (!caseDetailPage) {
    return;
  }

  caseDetailPage.innerHTML = `
    <article class="case-detail-shell">
      <a class="case-detail-back" href="#" data-case-back>Back to case studies</a>
      <header class="case-detail-hero">
        <p class="case-detail-kicker">Case study</p>
        <h1>${displayTextHTML(study.title)}</h1>
        <p>${escapeHTML(study.description)}</p>
        ${
          study.cover
            ? `
              <figure class="case-detail-media case-detail-media--wide case-detail-cover">
                <img src="${escapeHTML(study.cover)}" alt="" loading="lazy" />
              </figure>
            `
            : ""
        }
      </header>
      ${caseMetaMarkup(study)}
      <div class="case-detail-content">
        ${study.detailHTML}
      </div>
      <footer class="case-detail-footer">
        <a class="case-detail-back" href="#" data-case-back>Back to case studies</a>
      </footer>
    </article>
  `;
}

function closeCaseDetail(options = {}) {
  const { immediate = false, afterClose } = options;

  window.clearTimeout(caseDetailCloseTimer);
  activeCaseDetailSlug = "";

  if (!document.body.classList.contains("case-detail-open")) {
    afterClose?.();
    return;
  }

  function finishClose() {
    document.body.classList.remove("case-detail-open", "case-detail-visible", "case-detail-leaving");
    caseDetailPage?.setAttribute("hidden", "");
    caseDetailPage?.replaceChildren();
    updateScroll();
    afterClose?.();
  }

  document.body.classList.remove("case-detail-visible");

  if (immediate) {
    finishClose();
    return;
  }

  document.body.classList.add("case-detail-leaving");
  caseDetailCloseTimer = window.setTimeout(finishClose, 640);
}

function handleCaseDetailRoute() {
  const study = caseStudyFromHash();

  if (!study) {
    if (document.body.classList.contains("case-detail-open")) {
      closeCaseDetail({
        afterClose: () => {
          snapToY(caseStudyCardTargetTop(), "smooth");
          lockSnap(isMobileLayoutActive() ? 980 : 1180);
        }
      });
    } else {
      closeCaseDetail();
    }
    return;
  }

  window.clearTimeout(caseDetailCloseTimer);
  if (activeCaseDetailSlug !== study.slug) {
    renderCaseDetail(study);
    activeCaseDetailSlug = study.slug;
  }
  document.body.classList.remove("case-detail-leaving");
  document.body.classList.add("case-detail-open");
  caseDetailPage?.removeAttribute("hidden");
  setMenuOpen(false);
  window.clearTimeout(snapTimer);
  window.scrollTo({ top: 0, behavior: "auto" });
  requestAnimationFrame(() => {
    document.body.classList.add("case-detail-visible");
  });
}

function projectListProgressToScroll(progress) {
  const projectListRange = Math.max(1, projectListSection.offsetHeight - window.innerHeight);
  return projectListSection.offsetTop - window.innerHeight * 0.08 + projectListRange * progress;
}

function desktopCaseListScrollRange() {
  const extraCaseCount = Math.max(1, caseStudies.length - 4);
  return window.innerHeight * 0.7 * extraCaseCount;
}

function desktopCaseListScrollStart() {
  return caseStudyListSection.offsetTop + window.innerHeight * 0.18;
}

function desktopCaseListFrameHeight() {
  if (!caseStudyList) return window.innerHeight;
  const styles = window.getComputedStyle(caseStudyList);
  const paddingY = parseFloat(styles.paddingTop || "0") + parseFloat(styles.paddingBottom || "0");
  return Math.max(1, caseStudyList.clientHeight - paddingY);
}

function desktopCaseListMaxOffset() {
  if (!caseStudyStack || !caseStudyList) return 0;
  return Math.max(0, caseStudyStack.scrollHeight - desktopCaseListFrameHeight());
}

function getMagneticPoints() {
  const heroRange = Math.max(1, sceneSpacer.offsetHeight - window.innerHeight);
  const limit = scrollLimit();
  const isMobile = isMobileLayoutActive();
  const viewportH = isMobile ? visibleViewportHeight() : window.innerHeight;
  const points = [0];

  for (let index = 1; index < stateCount; index += 1) {
    points.push((heroRange / (stateCount - 1)) * index);
  }

  points.push(sceneSpacer.offsetHeight + window.innerHeight * (isMobile ? 0.18 : 0.25));
  if (isMobile) {
    points.push(sceneSpacer.offsetHeight + window.innerHeight * 0.92);
    points.push(sceneSpacer.offsetHeight + window.innerHeight * 1.66);
  }
  points.push(servicesSection.offsetTop + window.innerHeight * (isMobile ? -0.08 : 0.34));
  if (isMobile) {
    points.push(serviceListSection.offsetTop + window.innerHeight * 0.22);
    points.push(serviceListSection.offsetTop + window.innerHeight * 1.08);
  } else {
    points.push(serviceListSection.offsetTop + window.innerHeight * 0.18);
  }
  points.push(projectsIntroSection.offsetTop + window.innerHeight * 0.56);

  const projectSnapProgress = isMobile
    ? [0.08, 0.24, 0.4, 0.533333, 0.666667, 0.8, 0.92]
    : [0.06, 0.24, 0.48, projectHorizontalStart, projectHorizontalStart + projectHorizontalSpan];

  projectSnapProgress.forEach((progress) => {
    points.push(projectListProgressToScroll(progress));
  });
  points.push(caseStudiesSection.offsetTop + window.innerHeight * (isMobile ? -0.08 : 0.34));
  if (isMobile) {
    points.push(caseStudyListSection.offsetTop + viewportH * 0.12);
  } else {
    points.push(desktopCaseListScrollStart());
    if (caseStudies.length > 4) {
      const caseListScrollStart = desktopCaseListScrollStart();
      const extraCaseCount = Math.max(1, caseStudies.length - 4);
      for (let index = 1; index <= extraCaseCount; index += 1) {
        points.push(caseListScrollStart + desktopCaseListScrollRange() * (index / extraCaseCount));
      }
    }
  }
  points.push(contactSection.offsetTop + window.innerHeight * 0.22);
  points.push(footerSection.offsetTop + window.innerHeight * 0.16);

  return [...new Set(points.map((point) => Math.round(Math.min(limit, Math.max(0, point)))))]
    .sort((a, b) => a - b);
}

function closestMagneticPoint(y) {
  return getMagneticPoints().reduce((closest, point) => {
    return Math.abs(point - y) < Math.abs(closest - y) ? point : closest;
  }, 0);
}

function lockSnap(duration = 640) {
  isSnapLocked = true;
  window.clearTimeout(snapLockTimer);
  snapLockTimer = window.setTimeout(() => {
    isSnapLocked = false;
  }, duration);
}

function snapToY(y, behavior = "smooth") {
  window.clearTimeout(snapTimer);
  lockSnap(behavior === "smooth" ? (isMobileLayoutActive() ? 430 : 660) : 120);
  window.scrollTo({ top: Math.min(scrollLimit(), Math.max(0, y)), behavior });
}

function snapToDirection(direction) {
  const points = getMagneticPoints();
  const currentY = window.scrollY;
  const threshold = Math.max(24, window.innerHeight * 0.045);
  const target =
    direction > 0
      ? points.find((point) => point > currentY + threshold) ?? points[points.length - 1]
      : [...points].reverse().find((point) => point < currentY - threshold) ?? points[0];

  snapToY(target);
}

function scheduleNearestSnap(delay = 120) {
  if (
    document.body.classList.contains("case-detail-open") ||
    !siteRevealed ||
    isSnapLocked ||
    galleryDrag ||
    touchSnap?.active ||
    isMobileCaseListNativeScrollZone()
  ) {
    return;
  }

  window.clearTimeout(snapTimer);
  snapTimer = window.setTimeout(() => {
    snapToY(closestMagneticPoint(window.scrollY));
  }, delay);
}

function handleScroll() {
  if (document.body.classList.contains("case-detail-open")) {
    window.clearTimeout(snapTimer);
    return;
  }

  updateScroll();
  if (touchSnap?.active) {
    return;
  }
  scheduleNearestSnap();
}

function positionResponsiveObjects() {
  const isMobile = isMobileLayoutActive();
  nameGroup.scale.setScalar(isMobile ? 0.72 : 1);
  nameGroup.position.set(0, isMobile ? 0.82 : 0.58, -0.58);
  mobileNameGroup.position.set(0, isMobile ? -1.42 : -1.42, -0.58);
  mobileNameGroup.scale.setScalar(isMobile ? 1 : 1);
  aboutGroup.position.set(isMobile ? 0 : -2.62, isMobile ? 1.43 : -0.08, 0.45);
  aboutGroup.userData.baseX = aboutGroup.position.x;
  aboutGroup.userData.baseY = aboutGroup.position.y;
  aboutGroup.scale.setScalar(isMobile ? 0.62 : 1.08);
  frameGroup.position.set(isMobile ? -0.86 : -0.48, isMobile ? -0.25 : -0.04, 0.36);
  frameGroup.userData.baseX = frameGroup.position.x;
  frameGroup.userData.baseY = frameGroup.position.y;
  frameGroup.scale.setScalar(isMobile ? 0.5 : 1.02);
  servicesWordGroup.position.set(isMobile ? 0 : -2.24, isMobile ? 1.24 : 0.08, 0.08);
  servicesWordGroup.userData.baseX = servicesWordGroup.position.x;
  servicesWordGroup.userData.baseY = servicesWordGroup.position.y;
  servicesWordGroup.scale.setScalar(isMobile ? 0.56 : 1);
  servicesObjectGroup.position.set(isMobile ? 0 : 1.42, isMobile ? -0.18 : 0.02, 0.3);
  servicesObjectGroup.userData.baseX = servicesObjectGroup.position.x;
  servicesObjectGroup.userData.baseY = servicesObjectGroup.position.y;
  servicesObjectGroup.scale.setScalar(isMobile ? 0.58 : 1.1);
  projectsWordGroup.position.set(isMobile ? 0 : -2.34, isMobile ? 1.24 : 0.02, -0.32);
  projectsWordGroup.userData.baseX = projectsWordGroup.position.x;
  projectsWordGroup.userData.baseY = projectsWordGroup.position.y;
  projectsWordGroup.scale.setScalar(isMobile ? 0.58 : 1);
  projectsGroup.position.set(isMobile ? 0 : 1.38, isMobile ? -0.34 : 0.02, 0.32);
  projectsGroup.userData.baseX = projectsGroup.position.x;
  projectsGroup.userData.baseY = projectsGroup.position.y;
  projectsGroup.scale.setScalar(isMobile ? 0.58 : 1.12);
  projectsLaptopGroup.position.copy(projectsGroup.position);
  projectsLaptopGroup.userData.introX = projectsGroup.position.x;
  projectsLaptopGroup.userData.introY = projectsGroup.position.y;
  projectsLaptopGroup.userData.introZ = projectsGroup.position.z;
  projectsLaptopGroup.userData.dockX = 0;
  projectsLaptopGroup.userData.dockY = isMobile ? 2.18 : -1.48;
  projectsLaptopGroup.userData.dockZ = isMobile ? 0.42 : 0.5;
  projectsLaptopGroup.userData.introScale = isMobile ? 0.58 : 1.12;
  projectsLaptopGroup.userData.dockScale = isMobile ? 0.285 : 0.56;
  projectsLaptopGroup.scale.setScalar(projectsLaptopGroup.userData.introScale);
  caseTitleGroup.position.set(0, isMobile ? 1.28 : 1.32, 0.08);
  caseTitleGroup.userData.baseX = caseTitleGroup.position.x;
  caseTitleGroup.userData.baseY = caseTitleGroup.position.y;
  caseTitleGroup.scale.setScalar(isMobile ? 0.62 : 1);
  caseMobileTitleGroup.position.set(0, isMobile ? 1.04 : 1.32, 0.08);
  caseMobileTitleGroup.userData.baseX = caseMobileTitleGroup.position.x;
  caseMobileTitleGroup.userData.baseY = caseMobileTitleGroup.position.y;
  caseMobileTitleGroup.scale.setScalar(isMobile ? 0.72 : 1);
  caseMobileTopGroup.position.y = isMobile ? 0.28 : 0;
  caseMobileBottomGroup.position.y = isMobile ? -0.3 : 0;
  caseObjectGroup.position.set(isMobile ? -0.08 : 0, isMobile ? -0.12 : -0.5, 0.26);
  caseObjectGroup.userData.baseX = caseObjectGroup.position.x;
  caseObjectGroup.userData.baseY = caseObjectGroup.position.y;
  caseObjectGroup.scale.setScalar(isMobile ? 0.56 : 1.12);
  const contactTitleScale = isMobile ? 0.54 : 1;
  contactTitleGroup.scale.setScalar(contactTitleScale);
  if (isMobile) {
    const contactZ = -0.18;
    const visibleHeight =
      2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * Math.abs(camera.position.z - contactZ);
    const visibleWidth = visibleHeight * camera.aspect;
    const titleLeft = -visibleWidth / 2 + (24 / renderWidth()) * visibleWidth;
    const titleTop = visibleHeight / 2 - (24 / renderHeight()) * visibleHeight;
    contactTitleGroup.position.set(
      titleLeft - contactTitleBounds.min.x * contactTitleScale,
      titleTop - contactTitleBounds.max.y * contactTitleScale,
      contactZ
    );
  } else {
    contactTitleGroup.position.set(-2.22, 1.76, -0.18);
  }
  contactTitleGroup.userData.baseX = contactTitleGroup.position.x;
  contactTitleGroup.userData.baseY = contactTitleGroup.position.y;
}

function handleResize() {
  syncForcedDesktopScale();
  syncCaseViewportHeight();
  camera.fov = cameraFov();
  camera.aspect = cameraAspect();
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, rendererPixelRatioCap()));
  renderer.setSize(renderWidth(), renderHeight());
  positionResponsiveObjects();
  updateScroll();
}

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("resize", handleResize);
window.visualViewport?.addEventListener("resize", handleResize);
window.addEventListener(
  "wheel",
  (event) => {
    if (
      document.body.classList.contains("case-detail-open") ||
      !siteRevealed ||
      event.ctrlKey ||
      Math.abs(event.deltaY) < 5
    ) {
      return;
    }

    if (isMobileCaseListNativeScrollZone()) {
      window.clearTimeout(snapTimer);
      return;
    }

    event.preventDefault();
    if (!isSnapLocked) {
      snapToDirection(Math.sign(event.deltaY));
    }
  },
  { passive: false }
);
window.addEventListener(
  "touchstart",
  (event) => {
    if (
      document.body.classList.contains("case-detail-open") ||
      !isMobileLayoutActive() ||
      !siteRevealed ||
      isInteractiveTouchTarget(event.target)
    ) {
      return;
    }

    if (isMobileCaseListNativeScrollZone()) {
      touchSnap = null;
      window.clearTimeout(snapTimer);
      return;
    }

    isSnapLocked = false;
    window.clearTimeout(snapLockTimer);
    window.clearTimeout(snapTimer);
    const touch = event.touches[0];
    touchSnap = {
      active: true,
      snapped: false,
      startY: touch?.clientY ?? 0,
      lastY: touch?.clientY ?? 0,
      startScrollY: window.scrollY
    };
  },
  { passive: true }
);
window.addEventListener(
  "touchmove",
  (event) => {
    if (!touchSnap?.active) {
      return;
    }

    touchSnap.lastY = event.touches[0]?.clientY ?? touchSnap.lastY;
    const fingerDelta = touchSnap.startY - touchSnap.lastY;

    if (Math.abs(fingerDelta) > 4 && event.cancelable) {
      event.preventDefault();
    }

    if (!touchSnap.snapped && Math.abs(fingerDelta) > 22) {
      touchSnap.snapped = true;
      snapToDirection(Math.sign(fingerDelta));
    }
  },
  { passive: false }
);
window.addEventListener(
  "touchend",
  () => {
    if (!touchSnap?.active) {
      scheduleNearestSnap(80);
      return;
    }

    const scrollDelta = window.scrollY - touchSnap.startScrollY;
    const fingerDelta = touchSnap.startY - touchSnap.lastY;
    const didSnap = touchSnap.snapped;
    const direction = Math.abs(scrollDelta) > 14 ? Math.sign(scrollDelta) : Math.sign(fingerDelta);
    const shouldSnapByDirection = Math.abs(scrollDelta) > 18 || Math.abs(fingerDelta) > 18;
    touchSnap.active = false;

    if (didSnap) {
      return;
    }

    if (shouldSnapByDirection && direction !== 0) {
      window.clearTimeout(snapTimer);
      snapToDirection(direction);
      return;
    }

    scheduleNearestSnap(90);
  },
  { passive: true }
);
window.addEventListener(
  "touchcancel",
  () => {
    if (touchSnap) {
      touchSnap.active = false;
    }
    scheduleNearestSnap(90);
  },
  { passive: true }
);
window.addEventListener("keydown", (event) => {
  if (document.body.classList.contains("case-detail-open")) {
    return;
  }

  const forwardKeys = ["ArrowDown", "PageDown", " "];
  const backwardKeys = ["ArrowUp", "PageUp"];
  const activeTag = document.activeElement?.tagName?.toLowerCase();

  if (!forwardKeys.includes(event.key) && !backwardKeys.includes(event.key)) {
    return;
  }

  if (["button", "a", "input", "textarea", "select"].includes(activeTag)) {
    return;
  }

  event.preventDefault();
  if (!isSnapLocked) {
    snapToDirection(forwardKeys.includes(event.key) ? 1 : -1);
  }
});
window.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch") {
    return;
  }

  pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
  pointer.y = -(event.clientY / window.innerHeight - 0.5) * 2;
  hoverEnergy = 1;
});
window.addEventListener("pointerleave", (event) => {
  if (event.pointerType === "touch") {
    return;
  }

  pointer.set(0, 0);
});
window.addEventListener("pointercancel", (event) => {
  if (event.pointerType !== "touch") {
    return;
  }

  pointer.set(0, 0);
});

if (projectGallery && projectTrack) {
  projectGallery.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    if (isMobileLayoutActive()) {
      return;
    }

    if (event.target.closest(".project-button") || projectListTarget < 0.62) {
      return;
    }

    const maxShift = Math.max(1, projectTrack.scrollWidth - window.innerWidth);
    const startProgress = clamp01((projectListTarget - projectHorizontalStart) / projectHorizontalSpan);
    galleryDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startProgress,
      maxShift,
      moved: false
    };
    projectGallery.classList.add("is-dragging");
    projectGallery.setPointerCapture?.(event.pointerId);
    window.clearTimeout(snapTimer);
  });

  projectGallery.addEventListener("pointermove", (event) => {
    if (!galleryDrag || event.pointerId !== galleryDrag.pointerId) {
      return;
    }

    const dx = event.clientX - galleryDrag.startX;
    const dragProgress = clamp01(galleryDrag.startProgress - dx / galleryDrag.maxShift);
    galleryDrag.moved = galleryDrag.moved || Math.abs(dx) > 4;
    if (galleryDrag.moved) {
      event.preventDefault();
    }

    const scrollY = projectListProgressToScroll(projectHorizontalStart + dragProgress * projectHorizontalSpan);
    window.scrollTo({ top: scrollY, behavior: "auto" });
    updateScroll();
    projectListSmooth = projectListTarget;
  });

  function finishGalleryDrag(event) {
    if (!galleryDrag || event.pointerId !== galleryDrag.pointerId) {
      return;
    }

    projectGallery.releasePointerCapture?.(event.pointerId);
    projectGallery.classList.remove("is-dragging");
    galleryDrag = null;
    scheduleNearestSnap(40);
  }

  projectGallery.addEventListener("pointerup", finishGalleryDrag);
  projectGallery.addEventListener("pointercancel", finishGalleryDrag);
}

projectButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    const card = button.closest(".project-card");
    projectCards.forEach((item) => item.classList.toggle("is-selected", item === card));

    if (index === 0) {
      window.open(
        "https://www.figma.com/design/QIBHQGs0uQdzgwbLhaU48U/TOJET?node-id=7271-36356&t=EA0Rvp3jD2XGNDU6-1",
        "_blank",
        "noopener,noreferrer"
      );
    } else if (index === 1) {
      window.open(
        "https://floramor.ae/",
        "_blank",
        "noopener,noreferrer"
      );
    } else if (index === 2) {
      window.open(
        "https://abetagrouplimited.co.uk/",
        "_blank",
        "noopener,noreferrer"
      );
    } else if (index === 3) {
      window.open(
        "https://octavhomes.com/",
        "_blank",
        "noopener,noreferrer"
      );
    }
  });
});

caseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".case-study-card");
    caseStudyCards.forEach((item) => item.classList.toggle("is-selected", item === card));
  });
});

document.addEventListener("click", (event) => {
  const backLink = event.target.closest("[data-case-back]");
  if (!backLink) {
    return;
  }

  event.preventDefault();
  history.replaceState("", document.title, window.location.pathname + window.location.search);
  closeCaseDetail({
    afterClose: () => {
      requestAnimationFrame(() => {
        snapToY(caseStudyCardTargetTop(), "smooth");
      });
    }
  });
});

menuToggle?.addEventListener("click", () => {
  setMenuOpen(!document.body.classList.contains("menu-open"));
});

siteMenuLinks.forEach((link) => {
  link.addEventListener("click", () => {
    closeMenuAndScroll(link.dataset.menuTarget);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("menu-open")) {
    setMenuOpen(false);
    menuToggle?.focus();
  }
});

document.addEventListener("pointerdown", (event) => {
  if (
    !document.body.classList.contains("menu-open") ||
    siteMenu?.contains(event.target) ||
    menuToggle?.contains(event.target)
  ) {
    return;
  }

  setMenuOpen(false);
});

window.addEventListener("hashchange", handleCaseDetailRoute);

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = contactForm.querySelector(".contact-submit");
  const submitLabel = submitButton?.querySelector("span:first-child");
  const defaultSubmitText = submitButton?.dataset.defaultText || submitLabel?.textContent || "Send message";

  if (!submitButton || submitButton.disabled || !contactForm.reportValidity()) {
    return;
  }

  submitButton.dataset.defaultText = defaultSubmitText;

  const setSubmitText = (text) => {
    if (submitLabel) {
      submitLabel.textContent = text;
    }
  };

  window.clearTimeout(Number(contactForm.dataset.statusTimer || 0));
  submitButton.disabled = true;
  submitButton.setAttribute("aria-busy", "true");
  setSubmitText("Sending...");

  const formData = new FormData(contactForm);
  formData.set("_captcha", "false");
  formData.set("_subject", "New portfolio contact message");
  formData.set("_template", "table");
  formData.set("_replyto", String(formData.get("email") || ""));

  try {
    const response = await fetch("https://formsubmit.co/ajax/fatemeeghandi@gmail.com", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`FormSubmit request failed with ${response.status}`);
    }

    contactForm.reset();
    setSubmitText("✓ Message sent!");

    const timer = window.setTimeout(() => {
      setSubmitText(defaultSubmitText);
      submitButton.disabled = false;
      submitButton.removeAttribute("aria-busy");
    }, 3000);
    contactForm.dataset.statusTimer = String(timer);
  } catch (error) {
    console.error(error);
    setSubmitText("Something went wrong. Try again.");
    submitButton.disabled = false;
    submitButton.removeAttribute("aria-busy");

    const timer = window.setTimeout(() => {
      setSubmitText(defaultSubmitText);
    }, 3600);
    contactForm.dataset.statusTimer = String(timer);
  }
});

updateScroll();
handleResize();

function revealLoadedSite() {
  const minLoaderTime = 1350;
  const remaining = Math.max(0, minLoaderTime - (performance.now() - loaderStartedAt));

  window.setTimeout(() => {
    if (!document.body.classList.contains("case-detail-open")) {
      window.scrollTo(0, 0);
      updateScroll();
    }
    siteRevealed = true;
    siteIntroTime = -0.62;
    document.body.classList.add("is-loaded");
    document.body.classList.remove("is-loading");
  }, remaining);
}

if (document.readyState === "complete") {
  revealLoadedSite();
} else {
  window.addEventListener("load", revealLoadedSite, { once: true });
}

function tick(now = performance.now()) {
  const delta = Math.min(0.05, Math.max(0.008, (now - lastFrameAt) / 1000 || 0.016));
  lastFrameAt = now;
  time += delta;
  if (siteRevealed) {
    siteIntroTime += delta;
  }
  scrollSmooth += (scrollTarget - scrollSmooth) * frameDamp(0.14, delta);
  sceneTransitionSmooth += (sceneTransitionTarget - sceneTransitionSmooth) * frameDamp(0.08, delta);
  aboutSmooth += (aboutTarget - aboutSmooth) * frameDamp(0.12, delta);
  servicesSmooth += (servicesTarget - servicesSmooth) * frameDamp(0.1, delta);
  serviceListSmooth += (serviceListTarget - serviceListSmooth) * frameDamp(0.12, delta);
  projectsIntroSmooth += (projectsIntroTarget - projectsIntroSmooth) * frameDamp(0.1, delta);
  projectListSmooth += (projectListTarget - projectListSmooth) * frameDamp(0.11, delta);
  caseStudiesSmooth += (caseStudiesTarget - caseStudiesSmooth) * frameDamp(0.1, delta);
  caseListSmooth += (caseListTarget - caseListSmooth) * frameDamp(0.14, delta);
  caseListPageSmooth += (caseListPageTarget - caseListPageSmooth) * frameDamp(0.14, delta);
  contactSmooth += (contactTarget - contactSmooth) * frameDamp(0.11, delta);
  footerSmooth += (footerTarget - footerSmooth) * frameDamp(0.12, delta);
  hoverEnergy += (0 - hoverEnergy) * frameDamp(0.025, delta);

  const isMobileLayout = isMobileLayoutActive();
  const sceneFade = 1 - smooth(sceneTransitionSmooth);
  const servicesReveal = smooth(clamp01(servicesSmooth * 1.12));
  const serviceListReveal = isMobileLayout ? smooth(serviceListSmooth) : smooth(clamp01(serviceListSmooth / 0.28));
  const serviceListExit = isMobileLayout
    ? smooth(clamp01(projectsIntroSmooth / 0.24))
    : smooth(clamp01((projectsIntroSmooth - 0.18) / 0.2));
  const serviceCardsVisible = serviceListReveal * (1 - serviceListExit);
  const servicesExit = smooth(clamp01(serviceListSmooth / 0.24));
  const servicesVisible = servicesReveal * (1 - servicesExit);
  const projectsFade = smooth(clamp01(projectsIntroSmooth * 1.12));
  const introExit = smooth(clamp01(projectListSmooth / 0.24));
  const laptopFade = smooth(clamp01((projectListSmooth - 0.02) / 0.1));
  const laptopDock = smooth(clamp01((projectListSmooth - 0.16) / 0.2));
  const cardOpen = smooth(clamp01((projectListSmooth - 0.38) / 0.2));
  const exitCollapse = smooth(clamp01((projectListSmooth - projectExitStart) / projectExitSpan));
  const laptopExit = smooth(clamp01((projectListSmooth - 0.92) / 0.08));
  const galleryFade = cardOpen * (1 - smooth(clamp01((exitCollapse - 0.9) / 0.1)));
  const projectIntroVisible = projectsFade * (1 - introExit);
  const laptopVisible = Math.min(1, projectsFade * (1 - introExit) + laptopFade) * (1 - laptopExit);
  const darkReturn = smooth(clamp01(projectsIntroSmooth * 1.35));
  const aboutLight = smooth(sceneTransitionSmooth) * (1 - darkReturn);
  const aboutFade = aboutLight * (1 - smooth(clamp01(servicesSmooth / 0.28)));
  if (!isMobileLayout && (aboutFade > 0.32 || projectsIntroSmooth > 0.02)) {
    aboutTyping = Math.min(1, aboutTyping + delta * 0.14);
  } else {
    aboutTyping = 0;
    lastTypedLength = -1;
  }
  const stagePulse = Math.sin(scrollSmooth * Math.PI * 2);
  root.position.y = isMobileLayout
    ? THREE.MathUtils.lerp(0.46, 0.06, scrollSmooth)
    : THREE.MathUtils.lerp(0.2, -0.12, scrollSmooth);
  root.position.x = Math.sin(scrollSmooth * Math.PI * 1.25) * (isMobileLayout ? 0.045 : 0.2);
  root.rotation.y = pointer.x * 0.18 + THREE.MathUtils.lerp(-0.12, 0.22, scrollSmooth);
  root.rotation.x = pointer.y * 0.1 + stagePulse * 0.025;
  root.rotation.z = THREE.MathUtils.lerp(-0.04, 0.06, scrollSmooth);
  const rootScale = isMobileLayout
    ? THREE.MathUtils.lerp(1.2, 0.88, scrollSmooth) * 0.72
    : THREE.MathUtils.lerp(1.24, 1.06, scrollSmooth);
  root.scale.setScalar(rootScale);

  keyLight.position.x = -2.4 + pointer.x * 1.4;
  keyLight.position.y = 2.2 + pointer.y * 0.9;
  rimLight.intensity = 24 + scrollSmooth * 16 + hoverEnergy * 6;

  for (const stroke of strokes) {
    rebuildStroke(stroke, scrollSmooth);
    stroke.mesh.material.opacity *= sceneFade;
  }

  const nameFade = (1 - smooth(clamp01(scrollSmooth / 0.26))) * sceneFade;
  nameGroup.position.z = THREE.MathUtils.lerp(-0.58, -2.8, smooth(clamp01(scrollSmooth / 0.36)));
  mobileNameGroup.position.z = nameGroup.position.z;
  nameMeshes.forEach((mesh) => {
    const intro = smooth(clamp01((siteIntroTime - mesh.userData.delay) / 0.9));
    const lift = 1 - intro;
    mesh.material.opacity = (isMobileLayout ? 0 : 0.9) * nameFade * intro;
    mesh.position.z = mesh.userData.homeZ - lift * 0.42 + Math.sin(time * 1.4 + mesh.userData.delay * 8) * 0.012;
    mesh.scale.setScalar(0.94 + intro * 0.06);
  });
  mobileNameMeshes.forEach((mesh) => {
    const intro = smooth(clamp01((siteIntroTime - mesh.userData.delay) / 0.8));
    const lift = 1 - intro;
    mesh.material.opacity = (isMobileLayout ? 0.9 : 0) * nameFade * intro;
    mesh.position.z = mesh.userData.homeZ - lift * 0.32 + Math.sin(time * 1.25 + mesh.userData.delay * 8) * 0.009;
    mesh.scale.setScalar(0.96 + intro * 0.04);
  });

  ghostGroup.rotation.z = time * 0.035 + pointer.x * 0.05;
  ghostGroup.rotation.y = scrollSmooth * 0.7;
  ghostGroup.children.forEach((ring, index) => {
    ring.material.opacity = (0.035 + Math.sin(time * 0.7 + index) * 0.01 + scrollSmooth * 0.025) * sceneFade;
  });

  aboutGroup.rotation.y = THREE.MathUtils.lerp(-0.2, 0.1, aboutSmooth) + pointer.x * 0.1;
  aboutGroup.rotation.x = pointer.y * 0.055 + Math.sin(time * 0.8) * 0.015;
  aboutGroup.position.x = aboutGroup.userData.baseX + pointer.x * (isMobileLayout ? 0.015 : 0.035);
  aboutGroup.position.y = aboutGroup.userData.baseY + pointer.y * (isMobileLayout ? 0.01 : 0.02);
  aboutMouthConnector.visible = !isMobileLayout;
  aboutLowerConnector.visible = !isMobileLayout;
  frameGroup.rotation.y = pointer.x * 0.08 + Math.sin(time * 0.6) * 0.006;
  frameGroup.rotation.x = pointer.y * 0.045;
  frameGroup.position.x = frameGroup.userData.baseX + pointer.x * (isMobileLayout ? 0.012 : 0.028);
  frameGroup.position.y = frameGroup.userData.baseY + pointer.y * (isMobileLayout ? 0.008 : 0.018);
  aboutMeshes.forEach((mesh, index) => {
    const mobileConnectorFade =
      isMobileLayout && (mesh === aboutMouthConnector || mesh === aboutLowerConnector) ? 0 : 1;
    mesh.material.opacity =
      aboutFade * mesh.userData.baseOpacity * mobileConnectorFade * (0.95 + Math.sin(time + index) * 0.05);
  });
  frameMeshes.forEach((mesh, index) => {
    mesh.material.opacity =
      aboutFade * mesh.userData.baseOpacity * (isMobileLayout ? 0 : 1) * (0.96 + Math.sin(time * 0.9 + index) * 0.04);
  });

  servicesObjectGroup.rotation.y =
    THREE.MathUtils.lerp(-0.28, 0.08, servicesReveal) + pointer.x * 0.1 + Math.sin(time * 0.48) * 0.012;
  servicesObjectGroup.rotation.x = THREE.MathUtils.lerp(0.08, -0.02, servicesReveal) + pointer.y * 0.055;
  servicesObjectGroup.rotation.z = THREE.MathUtils.lerp(-0.04, 0.015, servicesReveal);
  servicesObjectGroup.position.x =
    servicesObjectGroup.userData.baseX + pointer.x * (isMobileLayout ? 0.014 : 0.034);
  servicesObjectGroup.position.y =
    servicesObjectGroup.userData.baseY +
    THREE.MathUtils.lerp(-0.2, 0, servicesReveal) +
    pointer.y * (isMobileLayout ? 0.01 : 0.022);
  servicesMeshes.forEach((mesh, index) => {
    const flicker = 0.94 + Math.sin(time * 0.82 + index * 0.58) * 0.06;
    mesh.material.opacity = servicesVisible * mesh.userData.baseOpacity * flicker;
  });

  servicesWordGroup.rotation.y = pointer.x * 0.045;
  servicesWordGroup.rotation.x = pointer.y * 0.025;
  servicesWordGroup.position.x = servicesWordGroup.userData.baseX + pointer.x * (isMobileLayout ? 0.006 : 0.014);
  servicesWordGroup.position.y = servicesWordGroup.userData.baseY + pointer.y * (isMobileLayout ? 0.005 : 0.012);
  servicesWordMeshes.forEach((mesh) => {
    const draw = smooth(clamp01((servicesSmooth * 1.35 - mesh.userData.delay) / 0.42));
    mesh.material.opacity = 0.9 * servicesVisible * draw;
  });

  if (serviceList && serviceStack) {
    if (isMobileLayout) {
      const mobileServiceVisible = smooth(clamp01(serviceListSmooth / 0.32)) * (1 - serviceListExit);
      const pageOffset = serviceCards[2]?.offsetTop ?? 0;
      const pageProgress = smooth(clamp01((serviceListSmooth - 0.52) / 0.42));
      serviceList.style.opacity = mobileServiceVisible.toFixed(3);
      serviceList.style.pointerEvents = mobileServiceVisible > 0.08 ? "auto" : "none";
      serviceStack.style.setProperty("--service-stack-y", `${(-pageOffset * pageProgress).toFixed(2)}px`);
      serviceCards.forEach((card, index) => {
        const isCurrentPage = pageProgress < 0.5 ? index < 2 : index >= 2;
        card.classList.toggle("is-selected", isCurrentPage);
        card.style.setProperty("--service-card-open", mobileServiceVisible.toFixed(3));
        card.style.setProperty("--service-card-x", "0px");
        card.style.setProperty("--service-card-y", "0px");
        card.style.setProperty("--service-card-rotate", index % 2 ? "0.35deg" : "-0.35deg");
      });
    } else {
      serviceList.style.opacity = serviceCardsVisible.toFixed(3);
      serviceList.style.pointerEvents = serviceCardsVisible > 0.08 ? "auto" : "none";
      serviceStack.style.removeProperty("--service-stack-y");
      serviceCards.forEach((card, index) => {
        const cardOpenAmount =
          smooth(clamp01((serviceListSmooth * 1.45 - index * 0.14) / 0.48)) * serviceListReveal;
        card.classList.toggle("is-selected", cardOpenAmount > 0.82);
        card.style.setProperty("--service-card-open", cardOpenAmount.toFixed(3));
        card.style.setProperty("--service-card-x", `${((1 - cardOpenAmount) * -1.4).toFixed(3)}rem`);
        card.style.setProperty("--service-card-y", `${((1 - cardOpenAmount) * 0.7).toFixed(3)}rem`);
        card.style.setProperty(
          "--service-card-rotate",
          `${THREE.MathUtils.lerp(-1.2, index % 2 ? 0.35 : -0.25, cardOpenAmount).toFixed(3)}deg`
        );
      });
    }
  }

  projectsGroup.rotation.y =
    THREE.MathUtils.lerp(-0.38, 0.12, projectsFade) + pointer.x * 0.14 + Math.sin(time * 0.6) * 0.018;
  projectsGroup.rotation.x = THREE.MathUtils.lerp(0.12, -0.02, projectsFade) + pointer.y * 0.07;
  projectsGroup.rotation.z = THREE.MathUtils.lerp(-0.08, 0.025, projectsFade);
  projectsGroup.position.x =
    projectsGroup.userData.baseX + pointer.x * (isMobileLayout ? 0.018 : 0.04);
  projectsGroup.position.y =
    projectsGroup.userData.baseY +
    THREE.MathUtils.lerp(-0.18, 0, projectsFade) -
    introExit * 0.3 +
    pointer.y * (isMobileLayout ? 0.012 : 0.026);
  projectsGroup.position.z = 0.32 - introExit * 1.35;
  projectsGroup.scale.setScalar(
    (isMobileLayout ? 0.58 : 1.12) *
      THREE.MathUtils.lerp(0.92, 1, projectsFade) *
      THREE.MathUtils.lerp(1, 0.88, introExit)
  );
  projectMeshes.forEach((mesh, index) => {
    const flicker = 0.94 + Math.sin(time * 0.95 + index * 0.7) * 0.06;
    mesh.material.opacity = projectIntroVisible * mesh.userData.baseOpacity * flicker;
  });

  projectsWordGroup.rotation.y = pointer.x * 0.045;
  projectsWordGroup.rotation.x = pointer.y * 0.025;
  projectsWordGroup.position.x = projectsWordGroup.userData.baseX + pointer.x * (isMobileLayout ? 0.006 : 0.014);
  projectsWordGroup.position.y = projectsWordGroup.userData.baseY + pointer.y * (isMobileLayout ? 0.005 : 0.012);
  projectWordMeshes.forEach((mesh) => {
    const draw = smooth(clamp01((projectsIntroSmooth * 1.35 - mesh.userData.delay) / 0.42));
    mesh.material.opacity = 0.88 * projectIntroVisible * draw;
    mesh.position.z = mesh.userData.homeZ - (1 - draw) * 0.36 + Math.sin(time * 1.15 + mesh.userData.delay * 12) * 0.012;
    mesh.scale.setScalar(0.94 + draw * 0.06);
  });

  const laptopDriftX = pointer.x * (isMobileLayout ? 0.012 : 0.03);
  const laptopDriftY = pointer.y * (isMobileLayout ? 0.008 : 0.018);
  projectsLaptopGroup.rotation.y =
    THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(-0.38, 0.12, projectsFade),
      0.02,
      laptopDock
    ) + pointer.x * 0.1 + Math.sin(time * 0.7) * 0.012;
  projectsLaptopGroup.rotation.x =
    THREE.MathUtils.lerp(THREE.MathUtils.lerp(0.12, -0.02, projectsFade), 0.015, laptopDock) +
    pointer.y * 0.045;
  projectsLaptopGroup.rotation.z = THREE.MathUtils.lerp(THREE.MathUtils.lerp(-0.08, 0.025, projectsFade), 0, laptopDock);
  const laptopDockedX = THREE.MathUtils.lerp(projectsLaptopGroup.userData.introX, projectsLaptopGroup.userData.dockX, laptopDock);
  const laptopDockedY = THREE.MathUtils.lerp(
    projectsLaptopGroup.userData.introY + THREE.MathUtils.lerp(-0.18, 0, projectsFade) - introExit * 0.08,
    projectsLaptopGroup.userData.dockY,
    laptopDock
  );
  const laptopDockedZ = THREE.MathUtils.lerp(projectsLaptopGroup.userData.introZ, projectsLaptopGroup.userData.dockZ, laptopDock);
  const mobileLaptopExitMove = isMobileLayout ? laptopExit : 0;
  projectsLaptopGroup.position.x =
    THREE.MathUtils.lerp(laptopDockedX, 0, mobileLaptopExitMove) + laptopDriftX * (1 - mobileLaptopExitMove);
  projectsLaptopGroup.position.y =
    THREE.MathUtils.lerp(laptopDockedY, 0.04, mobileLaptopExitMove) + laptopDriftY * (1 - mobileLaptopExitMove);
  projectsLaptopGroup.position.z = THREE.MathUtils.lerp(laptopDockedZ, -0.82, mobileLaptopExitMove);
  projectsLaptopGroup.scale.setScalar(
    THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(projectsLaptopGroup.userData.introScale, projectsLaptopGroup.userData.dockScale, laptopDock),
      projectsLaptopGroup.userData.dockScale * 0.76,
      mobileLaptopExitMove
    )
  );
  projectLaptopMeshes.forEach((mesh, index) => {
    const frameReappear =
      !isMobileLayout && (mesh === laptopScreenFrameA || mesh === laptopScreenFrameB)
        ? smooth(clamp01((projectListSmooth - 0.84) / 0.08)) * (1 - laptopExit)
        : 0;
    const screenFrameBoost =
      mesh === laptopScreenFrameA || mesh === laptopScreenFrameB
        ? isMobileLayout
          ? 0
          : Math.max(
              THREE.MathUtils.lerp(0.55, 1.25, smooth(clamp01((projectListSmooth - 0.12) / 0.18))) *
                (1 - smooth(clamp01((cardOpen - 0.22) / 0.58))),
              frameReappear * 1.18
            )
        : 1;
    mesh.material.opacity =
      laptopVisible * mesh.userData.baseOpacity * screenFrameBoost * (0.95 + Math.sin(time * 0.9 + index) * 0.05);
  });

  const horizontalProgress = smooth(clamp01((projectListSmooth - projectHorizontalStart) / projectHorizontalSpan));
  if (projectGallery && projectTrack) {
    if (isMobileLayout) {
      const mobileListOpen = smooth(clamp01((projectListSmooth - 0.24) / 0.1));
      const mobileExitFade = 1 - smooth(clamp01((projectListSmooth - 0.9) / 0.1));
      const mobileCardWindow = clamp01((projectListSmooth - 0.4) / 0.4);
      const mobileCardProgress = mobileCardWindow * Math.max(1, projectCards.length - 1);
      const activeIndex = Math.round(mobileCardProgress);

      projectGallery.style.opacity = (mobileListOpen * mobileExitFade).toFixed(3);
      projectGallery.style.pointerEvents = mobileListOpen > 0.76 && mobileExitFade > 0.25 ? "auto" : "none";
      projectGallery.style.setProperty("--card-open", "1");
      projectGallery.style.setProperty("--image-open", mobileListOpen.toFixed(3));
      projectGallery.style.setProperty("--image-y", `${(1 - mobileListOpen) * 0.7}rem`);
      projectGallery.style.setProperty("--gallery-shift", "0px");
      projectGallery.style.setProperty("--button-open", mobileListOpen.toFixed(3));
      projectGallery.style.setProperty("--button-y", `${(1 - mobileListOpen) * 0.75}rem`);

      projectCards.forEach((card, index) => {
        const local = mobileCardProgress - index;
        const distance = Math.min(1, Math.abs(local) / 0.62);
        const localFade = mobileListOpen * mobileExitFade * (1 - smooth(distance));
        const y = THREE.MathUtils.clamp(-local * 72, -72, 72);
        const scale = THREE.MathUtils.lerp(1, 0.96, smooth(distance));
        card.classList.toggle("is-selected", index === activeIndex);
        card.style.zIndex = String(20 - Math.round(distance * 10));
        card.style.setProperty("--card-local-open", localFade.toFixed(3));
        card.style.setProperty("--card-start-x", "0px");
        card.style.setProperty("--card-start-y", `${y}svh`);
        card.style.setProperty("--card-scale", scale.toFixed(3));
      });
    } else {
      const maxShift = Math.max(0, projectTrack.scrollWidth - window.innerWidth);
      const imageOpen = smooth(clamp01((cardOpen - 0.28) / 0.72)) * (1 - exitCollapse);
      const buttonOpen = smooth(clamp01((cardOpen - 0.62) / 0.38)) * (1 - exitCollapse);
      const trackShift = maxShift * horizontalProgress * -1;
      projectGallery.style.opacity = galleryFade.toFixed(3);
      projectGallery.style.pointerEvents = galleryFade > 0.82 && exitCollapse < 0.08 ? "auto" : "none";
      projectGallery.style.setProperty("--card-open", cardOpen.toFixed(3));
      projectGallery.style.setProperty("--image-open", imageOpen.toFixed(3));
      projectGallery.style.setProperty("--image-y", `${(1 - imageOpen) * 0.8}rem`);
      projectGallery.style.setProperty("--gallery-shift", `${trackShift}px`);
      projectGallery.style.setProperty("--button-open", buttonOpen.toFixed(3));
      projectGallery.style.setProperty("--button-y", `${(1 - buttonOpen) * 0.85}rem`);
      projectsLaptopGroup.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      const frameOrigins = [
        {
          center: laptopPointToScreen(v(-0.255, 0.3, 0.255)),
          left: laptopPointToScreen(v(-0.43, 0.3, 0.24)),
          right: laptopPointToScreen(v(-0.08, 0.3, 0.27))
        },
        {
          center: laptopPointToScreen(v(0.33, 0.26, 0.285)),
          left: laptopPointToScreen(v(0.16, 0.26, 0.27)),
          right: laptopPointToScreen(v(0.5, 0.26, 0.3))
        }
      ];
      projectCards.forEach((card, index) => {
        const isInitialPair = index < 2;
        const isExitPair = index >= Math.max(0, projectCards.length - 2);
        const exitPairIndex = index - Math.max(0, projectCards.length - 2);
        const finalCenterX = projectTrack.offsetLeft + card.offsetLeft + card.offsetWidth / 2 + trackShift;
        const finalCenterY = projectTrack.offsetTop + card.offsetHeight / 2;
        const origin = frameOrigins[index];
        const exitOrigin = frameOrigins[exitPairIndex];
        const frameWidth = origin ? Math.abs(origin.right.x - origin.left.x) : 0;
        const frameScale = clamp01(frameWidth / Math.max(card.offsetWidth, 1));
        const startScale = THREE.MathUtils.clamp(frameScale, 0.045, 0.13);
        const exitFrameWidth = exitOrigin ? Math.abs(exitOrigin.right.x - exitOrigin.left.x) : 0;
        const exitScale = THREE.MathUtils.clamp(exitFrameWidth / Math.max(card.offsetWidth, 1), 0.045, 0.13);
        const openX = isInitialPair ? (origin.center.x - finalCenterX) * (1 - cardOpen) : 0;
        const openY = isInitialPair ? (origin.center.y - finalCenterY) * (1 - cardOpen) : 0;
        const collapseX = isExitPair && exitOrigin ? exitOrigin.center.x - finalCenterX : 0;
        const collapseY = isExitPair && exitOrigin ? exitOrigin.center.y - finalCenterY : 0;
        const startX = THREE.MathUtils.lerp(openX, collapseX, exitCollapse);
        const startY = THREE.MathUtils.lerp(openY, collapseY, exitCollapse);
        const openScale = isInitialPair ? THREE.MathUtils.lerp(startScale, 1, cardOpen) : 1;
        const scale = THREE.MathUtils.lerp(openScale, isExitPair ? exitScale : openScale, exitCollapse);
        const exitFade = isExitPair
          ? 1 - smooth(clamp01((exitCollapse - 0.82) / 0.18))
          : 1 - exitCollapse;
        const localOpen = (isInitialPair ? cardOpen : horizontalProgress) * exitFade;
        card.style.setProperty("--card-local-open", localOpen.toFixed(3));
        card.style.setProperty("--card-start-x", `${startX}px`);
        card.style.setProperty("--card-start-y", `${startY}px`);
        card.style.setProperty("--card-scale", scale.toFixed(3));
      });
    }
  }

  const caseReveal = smooth(caseStudiesSmooth);
  const caseListReveal = smooth(caseListSmooth);
  const contactReveal = smooth(contactSmooth);
  const footerReveal = smooth(footerSmooth);
  const caseSceneFade = 1 - smooth(clamp01((caseListReveal - 0.04) / 0.22));
  const caseIntroVisible = caseReveal * caseSceneFade;
  caseTitleGroup.rotation.y = pointer.x * 0.045 + Math.sin(time * 0.42) * 0.006;
  caseTitleGroup.rotation.x = pointer.y * 0.025;
  caseTitleGroup.position.x = caseTitleGroup.userData.baseX + pointer.x * (isMobileLayout ? 0.006 : 0.014);
  caseTitleGroup.position.y =
    caseTitleGroup.userData.baseY +
    THREE.MathUtils.lerp(0.2, -0.18, caseListReveal) +
    pointer.y * (isMobileLayout ? 0.005 : 0.012);
  caseTitleMeshes.forEach((mesh) => {
    const draw = smooth(clamp01((caseStudiesSmooth * 1.35 - mesh.userData.delay) / 0.42));
    mesh.material.opacity = (isMobileLayout ? 0 : 0.9) * caseIntroVisible * draw;
    mesh.position.z = mesh.userData.homeZ - (1 - draw) * 0.34 + Math.sin(time * 1.05 + mesh.userData.delay * 12) * 0.01;
    mesh.scale.setScalar(0.94 + draw * 0.06);
  });
  caseMobileTitleGroup.rotation.y = pointer.x * 0.045 + Math.sin(time * 0.42) * 0.006;
  caseMobileTitleGroup.rotation.x = pointer.y * 0.025;
  caseMobileTitleGroup.position.x =
    caseMobileTitleGroup.userData.baseX + pointer.x * (isMobileLayout ? 0.006 : 0.014);
  caseMobileTitleGroup.position.y =
    caseMobileTitleGroup.userData.baseY +
    THREE.MathUtils.lerp(0.2, -0.18, caseListReveal) +
    pointer.y * (isMobileLayout ? 0.005 : 0.012);
  caseMobileTitleMeshes.forEach((mesh) => {
    const draw = smooth(clamp01((caseStudiesSmooth * 1.35 - mesh.userData.delay) / 0.42));
    mesh.material.opacity = (isMobileLayout ? 0.9 : 0) * caseIntroVisible * draw;
    mesh.position.z = mesh.userData.homeZ - (1 - draw) * 0.34 + Math.sin(time * 1.05 + mesh.userData.delay * 12) * 0.01;
    mesh.scale.setScalar(0.94 + draw * 0.06);
  });
  caseObjectGroup.rotation.y = THREE.MathUtils.lerp(-0.2, 0.08, caseReveal) + pointer.x * 0.09 + Math.sin(time * 0.52) * 0.012;
  caseObjectGroup.rotation.x = THREE.MathUtils.lerp(0.08, -0.02, caseReveal) + pointer.y * 0.05;
  caseObjectGroup.rotation.z = THREE.MathUtils.lerp(-0.035, 0.012, caseReveal);
  caseObjectGroup.position.x = caseObjectGroup.userData.baseX + pointer.x * (isMobileLayout ? 0.014 : 0.035);
  caseObjectGroup.position.y =
    caseObjectGroup.userData.baseY +
    THREE.MathUtils.lerp(-0.24, 0.2, caseListReveal) +
    pointer.y * (isMobileLayout ? 0.01 : 0.022);
  caseMeshes.forEach((mesh, index) => {
    mesh.material.opacity = caseIntroVisible * mesh.userData.baseOpacity * (0.95 + Math.sin(time * 0.8 + index * 0.45) * 0.05);
  });
  if (caseStudyList) {
    const mobileCaseListOpacity = smooth(clamp01((caseListSmooth - 0.08) / 0.14));
    const caseListOpacity =
      (isMobileLayout ? mobileCaseListOpacity : caseListReveal) *
      (1 - smooth(clamp01((contactReveal - 0.04) / 0.46)));
    caseStudyList.classList.toggle("is-visible", caseListOpacity > 0.08);
    caseStudyList.style.opacity = caseListOpacity.toFixed(3);
  }
  if (caseStudyStack) {
    if (isMobileLayout) {
      const lastPairFirstCard = Math.max(0, caseStudyCards.length - 2);
      const pageOffset = caseStudyCards[lastPairFirstCard]?.offsetTop ?? caseStudyCards[2]?.offsetTop ?? 0;
      const pageProgress = smooth(caseListPageSmooth);
      caseStudyStack.style.setProperty("--case-stack-y", `${(-pageOffset * pageProgress).toFixed(2)}px`);
    } else if (caseStudies.length > 4) {
      const extraOffset = desktopCaseListMaxOffset();
      const pageProgress = smooth(caseListPageSmooth);
      caseStudyStack.style.setProperty("--case-stack-y", `${(-extraOffset * pageProgress).toFixed(2)}px`);
    } else {
      caseStudyStack.style.removeProperty("--case-stack-y");
    }
  }
  contactTitleGroup.rotation.y = pointer.x * 0.045 + Math.sin(time * 0.45) * 0.006;
  contactTitleGroup.rotation.x = pointer.y * 0.025;
  contactTitleGroup.position.x = contactTitleGroup.userData.baseX + pointer.x * (isMobileLayout ? 0.006 : 0.014);
  contactTitleGroup.position.y =
    contactTitleGroup.userData.baseY + THREE.MathUtils.lerp(0.18, 0, contactReveal) + pointer.y * (isMobileLayout ? 0.005 : 0.012);
  contactTitleMeshes.forEach((mesh) => {
    const draw = smooth(clamp01((contactSmooth * 1.35 - mesh.userData.delay) / 0.44));
    mesh.material.opacity = 0.9 * contactReveal * draw;
    mesh.position.z = mesh.userData.homeZ - (1 - draw) * 0.34 + Math.sin(time * 1.05 + mesh.userData.delay * 12) * 0.01;
    mesh.scale.setScalar(0.94 + draw * 0.06);
  });
  if (contactPanel) {
    contactPanel.classList.toggle("is-visible", contactReveal > 0.12);
    contactPanel.style.opacity = contactReveal.toFixed(3);
  }
  if (siteFooter) {
    siteFooter.classList.toggle("is-visible", footerReveal > 0.08);
    siteFooter.style.opacity = Math.min(1, footerReveal * 1.28).toFixed(3);
    siteFooter.style.transform = `translate3d(0, ${THREE.MathUtils.lerp(12, 0, footerReveal).toFixed(3)}%, 0)`;
    siteFooter.style.setProperty("--footer-x", pointer.x.toFixed(3));
    siteFooter.style.setProperty("--footer-y", pointer.y.toFixed(3));
  }

  const lightAmount =
    Math.max(aboutLight, servicesReveal * (1 - darkReturn), serviceCardsVisible, caseReveal) * (1 - contactReveal);
  scene.background.lerpColors(darkSceneColor, lightSceneColor, lightAmount);
  scene.fog.color.copy(scene.background);
  ambient.intensity = THREE.MathUtils.lerp(0.6, 0.95, lightAmount);
  keyLight.intensity = THREE.MathUtils.lerp(42, 18, lightAmount);
  rimLight.intensity = THREE.MathUtils.lerp(26 + projectsFade * 16 + galleryFade * 10, 12, lightAmount);

  const stageProgress = scrollSmooth * (stateCount - 1);
  stageItems.forEach((item, index) => {
    const local = stageProgress - index;
    const distance = Math.min(1, Math.abs(local) / 0.62);
    const opacity = (1 - smooth(distance)) * sceneFade;
    const y = THREE.MathUtils.lerp(18, -42, clamp01((local + 0.62) / 1.24));
    item.style.opacity = opacity.toFixed(3);
    item.style.transform = `translate3d(0, ${y}px, 0)`;
  });

  if (isMobileLayout) {
    renderMobileAboutText();
    updateMobileAboutWords(aboutWordsTarget);
  } else {
    prepareDesktopAboutText();
    const typedLength = Math.floor((titleText.length + bioText.length) * smooth(aboutTyping));
    if (typedLength !== lastTypedLength) {
      typedTitle.textContent = titleText.slice(0, Math.min(titleText.length, typedLength));
      typedText.textContent = bioText.slice(0, Math.max(0, typedLength - titleText.length));
      lastTypedLength = typedLength;
    }
  }
  aboutCopy.style.opacity = aboutFade.toFixed(3);
  aboutCopy.style.transform = "translate3d(0, 0, 0)";

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

handleCaseDetailRoute();
tick();
