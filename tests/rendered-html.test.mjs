import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta = /<meta(?=[^>]*\bname=["']codex-preview["'])[^>]*>/i;
const canonicalLink = /<link(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']https:\/\/wellfit-bewegt\.master-bernd\.chatgpt\.site\/?["'])[^>]*>/i;

test("renders production metadata without preview markers", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.doesNotMatch(html, developmentPreviewMeta);
  assert.match(html, canonicalLink);
  assert.match(html, /WellFit – Bewegung, die verbindet/i);
  assert.match(html, /25 ausgewählte Erwachsene/i);
  assert.match(html, /mindestens 10\.000 Nutzern/i);
  assert.match(html, /WFXP/i);
  assert.match(html, /Android-Version/i);
  assert.match(html, /Erwachsenen-Partnerpilot/i);
  assert.match(html, /digitales Schwert/i);
  assert.match(html, /Bürgermeister/i);
  assert.match(html, /Partnereditor/i);
  assert.doesNotMatch(html, /25 ausgewählte Erwachsene und Familien/i);
  assert.doesNotMatch(html, /NFT-Verkauf|NFT-Marktplatz|Solana-basiert|Staking-Rendite/i);
});

test("publishes the phase order without mixing family missions into the first Alpha", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("phase-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(new Request("http://localhost/"), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  const html = await response.text();
  assert.match(html, /ERSTE ALPHA[\s\S]*Erwachsene[\s\S]*Android[\s\S]*Outdoor/i);
  assert.match(html, /DANACH[\s\S]*Museum[\s\S]*Burg[\s\S]*Erwachsene/i);
  assert.match(html, /SPÄTER[\s\S]*Familien[\s\S]*Kinder/i);
  assert.doesNotMatch(html, /SPÄTERE FAMILIENPHASE[\s\S]{0,1800}WFXP in der Alpha/i);
});

test("keeps prelaunch pages out of search indexes", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("robots-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(new Request("http://localhost/robots.txt"), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Disallow: \//i);
});

test("does not expose an Alpha application", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("alpha-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(new Request("http://localhost/alpha"), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 404);
});

test("does not expose product APIs", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("alpha-auth-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(new Request("http://localhost/api/interest", { method: "POST" }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 404);
});

test("renders all visual account routes with private route metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("auth-pages-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const context = { waitUntil() {}, passThroughOnException() {} };
  const routes = [
    ["/login", "Anmelden", "Zurück in eine Welt"],
    ["/registrieren", "Registrieren", "Konto erstellen"],
    ["/passwort-vergessen", "Passwort vergessen", "Link anfordern"],
  ];

  for (const [path, title, marker] of routes) {
    const response = await worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), env, context);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i, path);
    const html = await response.text();
    assert.match(html, new RegExp(`<title>${title} · WellFit<\\/title>`, "i"), path);
    assert.match(html, new RegExp(`<link[^>]+rel="canonical"[^>]+href="https:\\/\\/wellfit-bewegt\\.master-bernd\\.chatgpt\\.site${path}"`, "i"), path);
    assert.match(html, /<meta[^>]+name="robots"[^>]+content="noindex, nofollow"/i, path);
    assert.match(html, new RegExp(marker, "i"), path);
    assert.match(html, /Eingaben werden nicht gespeichert oder versendet/i, path);
    assert.doesNotMatch(html, developmentPreviewMeta, path);
  }
});

test("does not expose account APIs behind the visual preview", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("auth-api-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const context = { waitUntil() {}, passThroughOnException() {} };
  for (const path of ["/api/auth/login", "/api/auth/register", "/api/auth/password-reset"]) {
    const response = await worker.fetch(new Request(`http://localhost${path}`, { method: "POST" }), env, context);
    assert.equal(response.status, 404, path);
  }
});
