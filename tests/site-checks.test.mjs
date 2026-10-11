import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), "utf8");

test("Launchpad has unique IDs and every JavaScript ID lookup exists", () => {
  const html = read("launchpad.html");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, "duplicate HTML id found");
  const idSet = new Set(ids);
  const lookups = [...html.matchAll(/\$\("([^"]+)"\)/g)].map((m) => m[1]);
  const missing = [...new Set(lookups)].filter((id) => !idSet.has(id));
  assert.deepEqual(missing, [], "JavaScript looks up missing DOM elements");
});

test("Launchpad inline JavaScript parses", () => {
  const html = read("launchpad.html");
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((m) => m[1].trim()).filter(Boolean);
  assert.ok(scripts.length > 0, "no inline scripts found");
  for (const script of scripts) new vm.Script(script, { filename: "launchpad-inline.js" });
});

test("Student Hub features and local persistence are present", () => {
  const html = read("launchpad.html");
  for (const marker of [
    'id="revisionForm"', 'id="timetableForm"', 'id="revisionList"',
    'id="timetableFields"', 'state.revisions', 'state.timetable',
    'localStorage.setItem(STORE', 'prefers-reduced-motion:reduce'
  ]) assert.ok(html.includes(marker), "missing expected feature: " + marker);
});

test("Every sitemap page exists in the repository", () => {
  const sitemap = read("sitemap.xml");
  assert.match(sitemap, /<urlset[\s>]/);
  assert.match(sitemap, /<\/urlset>/);
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(urls.length > 0, "sitemap contains no URLs");
  for (const url of urls) {
    const path = new URL(url).pathname.split("/").filter(Boolean).at(-1) || "index.html";
    const file = path === "Indiumvalut-website" ? "index.html" : path;
    assert.ok(existsSync(join(root, file)), "sitemap entry has no matching file: " + url);
  }
});

test("Guides hub links to the original revision guide", () => {
  assert.match(read("guides.html"), /href="revision-planning-guide\.html"/);
  const guide = read("revision-planning-guide.html");
  assert.match(guide, /rel="canonical"/);
  assert.match(guide, /href="launchpad\.html#studyhub"/);
});

test("Internal links to local HTML files point to existing files", () => {
  const htmlFiles = readdirSync(root).filter((file) => file.endsWith(".html"));
  const missing = [];
  for (const file of htmlFiles) {
    const html = read(file);
    for (const match of html.matchAll(/href="([^"]+\.html)(?:#[^"]*)?"/g)) {
      const target = match[1].replace(/^\.\//, "");
      if (!target.startsWith("http") && !existsSync(join(root, target))) missing.push(file + " -> " + target);
    }
  }
  assert.deepEqual(missing, [], "broken local HTML links found");
});

\ntest("Public pages have SEO metadata and About page is connected", () => {
  const publicPages = ["index.html", "about.html", "tools.html", "launchpad.html", "guides.html", "feedback.html", "privacy.html", "terms.html"];
  for (const file of publicPages) {
    const html = read(file);
    assert.match(html, /<title>[^<]+<\\/title>/i, file + " needs a title");
    assert.match(html, /<meta name="description" content="[^"]+"/i, file + " needs a description");
  }
  assert.match(read("index.html"), /href="about.html"/, "homepage should link to About");
  assert.match(read("tools.html"), /href="about.html"/, "Labs should link to About");
  assert.match(read("sitemap.xml"), /about\\.html/, "sitemap should include About");
  assert.match(read("privacy.html"), /weekly timetable/i, "privacy policy should explain planner storage");
});
