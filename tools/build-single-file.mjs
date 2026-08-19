import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const handoffRoot = path.resolve(projectRoot, "..");
const distDir = path.join(projectRoot, "dist");
const assetsDir = path.join(distDir, "assets");
const shareDir = path.join(handoffRoot, "share");
const outputFile = path.join(shareDir, "portfolio-3d-preview.html");
const imageMimeTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml"
};

if (!fs.existsSync(assetsDir)) {
  throw new Error("Missing dist/assets. Run `npm run build` before exporting the single-file preview.");
}

fs.mkdirSync(shareDir, { recursive: true });

const assetFiles = fs.readdirSync(assetsDir);
let css = assetFiles
  .filter((file) => file.endsWith(".css"))
  .map((file) => fs.readFileSync(path.join(assetsDir, file), "utf8"))
  .join("\n");

const regularFont = fs.readFileSync(path.join(distDir, "fonts", "ComicSansMS.ttf")).toString("base64");
const boldFont = fs.readFileSync(path.join(distDir, "fonts", "ComicSansMS-Bold.ttf")).toString("base64");

css = css.replace(
  /url\(\/fonts\/ComicSansMS\.ttf\)/g,
  `url(data:font/truetype;base64,${regularFont})`
);
css = css.replace(
  /url\(\/fonts\/ComicSansMS-Bold\.ttf\)/g,
  `url(data:font/truetype;base64,${boldFont})`
);

function dataURLForPublicAsset(publicPath) {
  const filePath = path.join(distDir, publicPath.replace(/^\//, ""));
  if (!fs.existsSync(filePath)) {
    return publicPath;
  }

  const extension = path.extname(filePath).toLowerCase();
  const mimeType = imageMimeTypes[extension];
  if (!mimeType) {
    return publicPath;
  }

  const encoded = fs.readFileSync(filePath).toString("base64");
  return `data:${mimeType};base64,${encoded}`;
}

function embedPublicImageReferences(source) {
  return source.replace(
    /\/case-studies\/[^"'`)\\\s]+\.(?:png|jpe?g|webp|gif|svg)/gi,
    (publicPath) => dataURLForPublicAsset(publicPath)
  );
}

const js = embedPublicImageReferences(assetFiles
  .filter((file) => file.endsWith(".js"))
  .map((file) => fs.readFileSync(path.join(assetsDir, file), "utf8"))
  .join("\n"));

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Portfolio 3D Preview</title>
    <style>${css}</style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module">${js}</script>
  </body>
</html>`;

fs.writeFileSync(outputFile, html);
console.log(`Wrote ${outputFile}`);
