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
    const file = (!path || path === "Indiumvault-website" || path === "Indiumvalut-website") ? "index.html" : path;
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


test("Public pages have SEO metadata and About page is connected", () => {
  const publicPages = ["index.html", "about.html", "tools.html", "launchpad.html", "guides.html", "feedback.html", "privacy.html", "terms.html"];
  for (const file of publicPages) {
    const html = read(file);
    assert.ok(html.includes("<title>") && html.includes("</title>"), file + " needs a title");
    assert.match(html, /<meta name="description" content="/i, file + " needs a description");
  }
  assert.ok(read("index.html").includes('href="about.html"'), "homepage should link to About");
  assert.ok(read("tools.html").includes('href="about.html"'), "Labs should link to About");
  assert.ok(read("sitemap.xml").includes("about.html"), "sitemap should include About");
  assert.match(read("privacy.html"), /weekly timetable/i, "privacy policy should explain planner storage");
});

test("Creator Studio and IndiumVault OS inline JavaScript parses", () => {
  for (const file of ["creator-studio.html", "vault-os.html"]) {
    const html = read(file);
    const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((m) => m[1].trim()).filter(Boolean);
    assert.ok(scripts.length > 0, file + " needs inline JavaScript");
    for (const script of scripts) new vm.Script(script, { filename: file + "-inline.js" });
  }
});

test("New product pages have unique IDs and local data controls", () => {
  for (const file of ["creator-studio.html", "vault-os.html"]) {
    const html = read(file);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(new Set(ids).size, ids.length, file + " contains duplicate IDs");
  }
  const os = read("vault-os.html");
  for (const marker of ['id="taskForm"', 'id="projectForm"', 'id="noteForm"', 'id="goalForm"', 'id="exportData"', 'id="importData"', 'localStorage.setItem(KEY']) {
    assert.ok(os.includes(marker), "IndiumVault OS missing expected feature: " + marker);
  }
  const studio = read("creator-studio.html");
  for (const marker of ['id="generate"', 'id="export"', 'id="save"', 'id="load"']) assert.ok(studio.includes(marker), "Creator Studio missing expected feature: " + marker);
});
