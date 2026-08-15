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
