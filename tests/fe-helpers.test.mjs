import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ML = require("../public/lib/manifest-layout.js");
const ZB = require("../public/lib/zip-build.js");
const QR = require("../public/lib/qr.js");
const H = require("../public/lib/sds-hash.js");
const fflate = require("fflate");
const qrcode = require("qrcode-generator");

test("manifest totals group by class and unit", () => {
  const rows = [
    { dg_class: "3", quantity: 20, unit: "L" }, { dg_class: "3", quantity: 5, unit: "L" },
    { dg_class: "8", quantity: 2.5, unit: "kg" }, { dg_class: "", quantity: 1, unit: "L" }, { dg_class: "2.1", quantity: 9, unit: "kg" },
  ];
  const t = ML.computeTotals(rows);
  assert.deepEqual(t.map((x) => x.dg_class), ["2.1", "3", "8", "Unclassified"]);
  assert.equal(t[1].litres, 25);
  assert.equal(t[2].kg, 2.5);
});

test("manifest from export data only takes hazardous chemicals with locations", () => {
  const rows = ML.rowsFromExport({
    chemicals: [{ id: 1, product_name: "B", decision: "hazardous", dg_class: "3", un_number: "1263" }, { id: 2, product_name: "A", decision: "not_hazardous" }, { id: 3, product_name: "C", decision: "hazardous" }],
    locations: [{ chemical_id: 1, location: "Shed", quantity: 4, unit: "L" }, { chemical_id: 2, location: "X", quantity: 1, unit: "L" }],
  });
  assert.equal(rows.length, 1);
  const L = ML.LAYOUT;
  assert.equal(L.columns.find((c) => c.key === "un").get(rows[0]), "UN 1263");
  const csv = ML.csvRows({ rows, generated_at: "2026-10-19" }, { company_name: "Acme" });
  assert.equal(csv[0][0], L.title);
  assert.ok(csv.some((r) => r[0] === "Business" && r[1] === "Acme"));
});

test("zip names are safe, unique and truncated", () => {
  assert.equal(ZB.sanitiseFileName('A/B:C*"D"?'), "A B C D");
  assert.equal(ZB.sanitiseFileName("..."), "SDS");
  const long = ZB.sdsBaseName({ sds_id: 1, product_names: ["Alpha cleaner", "Beta cleaner", "Gamma cleaner", "Delta cleaner", "Epsilon cleaner"] });
  assert.ok(long.length <= 90 && /more\)$/.test(long), long);
  const used = new Set();
  assert.equal(ZB.uniqueName("Thinner", ".pdf", used), "Thinner.pdf");
  assert.equal(ZB.uniqueName("thinner", ".pdf", used), "thinner (2).pdf");
  assert.equal(ZB.sdsBaseName({ sds_id: 7, product_names: [], file_name: "x.pdf" }), "x");
});

test("zip builder round trip", async () => {
  const z = new ZB.ZipBuilder(fflate);
  z.addPdf("One", new Uint8Array([37, 80, 68, 70]));
  z.addPdf("One", new Uint8Array([1, 2, 3]));
  z.addText("README.txt", ZB.readme("Be careful.", "Acme", "19 Oct 2026", 2, ["Missing thing"]));
  const blob = z.finish();
  const files = fflate.unzipSync(new Uint8Array(await blob.arrayBuffer()));
  assert.deepEqual(Object.keys(files).sort(), ["One (2).pdf", "One.pdf", "README.txt"]);
  assert.match(new TextDecoder().decode(files["README.txt"]), /Be careful\./);
  assert.deepEqual([...files["One (2).pdf"]], [1, 2, 3]);
});

test("qr svg", () => {
  const svg = QR.qrSvg(qrcode, "https://example.test/#/chemical/12", { label: "QR" });
  assert.match(svg, /^<svg[^>]+viewBox="0 0 \d+ \d+"/);
  assert.ok(svg.includes("<path"));
  assert.ok(svg.length > 500);
});

test("sha256", async () => {
  assert.equal(await H.sha256Hex(new TextEncoder().encode("abc")), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.equal(H.precheckBody("h", "f.pdf", 5, "x".repeat(9000)).text_head.length, 4000);
});
