import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ML = require("../public/lib/manifest-layout.js");
const EM = require("../public/lib/export-model.js");
const ref = await import("../public/lib/ghs-ref.mjs");

const E = (id, name, cl, q, unit, loc, extra = {}) => ({ id, chemical_id: id, name, classification: cl, quantity: q, unit, location: loc, ...extra });
const FL = (k) => ({ c: "flam_liq", k });

test("over-placard banner text for a known over-quantity case", () => {
  const totals = ref.computeSiteTotals([E(1, "Thinner", [FL("2")], 320, "L", "Shed")]);
  const model = ML.itemsModel(totals);
  const b = ML.overBanners(model);
  assert.equal(b.length, 1);
  assert.equal(b[0].text, "Over the placard quantity: Item 7 flammable liquids category 2: 320 L, placard quantity 250 L");
  assert.equal(b[0].kind, "placard");
});

test("manifest-quantity banner and a clean site has no banner", () => {
  const over = ML.overBanners(ML.itemsModel(ref.computeSiteTotals([E(1, "Thinner", [FL("2")], 2600, "L", "Shed")])));
  assert.deepEqual(over.map((b) => b.kind), ["placard", "manifest"]);
  assert.match(over[1].text, /^Over the manifest quantity: Item 7 flammable liquids category 2: 2600 L, manifest quantity 2500 L$/);
  assert.equal(ML.overBanners(ML.itemsModel(ref.computeSiteTotals([E(1, "Thinner", [FL("2")], 20, "L", "Shed")]))).length, 0);
});

test("items model: always 43 items, stock flag, mixing items and 'not applied'", () => {
  const totals = ref.computeSiteTotals([
    E(1, "A", [FL("1")], 60, "L", "Shed"),   // item 6 over its placard (50)
    E(2, "B", [FL("3")], 500, "L", "Shed"),  // item 8 fine
  ]);
  const m = ML.itemsModel(totals);
  assert.equal(m.length, 43);
  assert.deepEqual(m.filter((x) => x.hasStock).map((x) => x.item), [6, 8, 9]);
  const mix = m.find((x) => x.item === 9);
  assert.equal(mix.pstatus, "NOT APPLIED");
  assert.match(mix.pnote, /not applied: item 6 already over/);
  assert.equal(m.find((x) => x.item === 6).pstatus, "OVER");
  assert.equal(m.find((x) => x.item === 6).mstatus, "OK");
  assert.match(mix.productsText, /item 6: 60/);
  const cells = ML.itemCells(mix);
  assert.match(cells.pstatus, /^NOT APPLIED \(not applied: item 6/);
});

test("issues are grouped, none hidden, plain titles", () => {
  const totals = ref.computeSiteTotals([
    E(1, "Unclassified thing", null, 5, "L", "Shed"),
    E(2, "Solid thing", [{ c: "flam_solid", k: "1" }], 10, "L", "Shed"),           // item 14 is kg: unit mismatch
    E(3, "Aerosol flam", [FL("2"), { c: "aerosol", k: "1" }], 4, "L", "Shed"),      // two items
    E(4, "Check me", [{ c: "flam_liq", k: "3", check: true }], 4, "L", "Shed"),     // unconfirmed category
  ]);
  const g = ML.groupIssues(totals);
  const codes = g.map((x) => x.code);
  for (const c of ["unit_mismatch", "multiple_items", "category_unconfirmed", "no_classification"]) assert.ok(codes.includes(c), c);
  assert.equal(g.reduce((n, x) => n + x.entries.length, 0) >= 4, true);
  assert.ok(g.every((x) => x.title && x.entries.every((e) => e.message)));
  // every issue from the totals is present
  for (const i of totals.issues) assert.ok(g.find((x) => x.code === i.code).entries.some((e) => e.message === i.message));
});

test("export inputs: entries and rows from the take-away data", () => {
  const data = {
    chemicals: [
      { id: 1, product_name: "Thinner", decision: "hazardous", ghs_classification: JSON.stringify([FL("2")]), dg_class: "3", un_number: "1263" },
      { id: 2, product_name: "Soap", decision: "not_hazardous", ghs_classification: "[]" },
      { id: 3, product_name: "New thing", decision: null, ghs_classification: null },
    ],
    locations: [{ id: 10, chemical_id: 1, location: "Shed", quantity: 20, unit: "L" }, { id: 11, chemical_id: 2, location: "Bay", quantity: 3, unit: "L" }, { id: 12, chemical_id: 3, location: "Bay", quantity: 3, unit: "L" }],
  };
  const entries = ML.entriesFromExport(data);
  assert.equal(entries.length, 3);
  assert.equal(entries[2].classification, null);
  const rows = ML.rowsFromExport(data, ref);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].items, [7]);
  assert.equal(ML.LAYOUT.rows.find((c) => c.key === "items").get(rows[0]), "Item 7");
  assert.equal(ML.LAYOUT.rows.find((c) => c.key === "class").label, "ADG class (illustration only)");
  const t = ref.computeSiteTotals(entries);
  assert.ok(ML.groupIssues(t).some((g) => g.code === "no_classification"));
});

test("csv has banner, all items, issues, rows and the notes", () => {
  const totals = ref.computeSiteTotals([E(1, "Thinner", [FL("2")], 320, "L", "Shed")]);
  const csv = ML.csvRows({ rows: [{ product_name: "Thinner", location: "Shed", quantity: 320, unit: "L", items: [7] }], totals, generated_at: "x" }, { company_name: "Acme" }, ref);
  const flat = csv.map((r) => r.join("|"));
  assert.ok(flat.some((l) => l.startsWith("OVER THE PLACARD QUANTITY: ITEM 7")));
  assert.equal(csv.filter((r) => /^\d+$/.test(r[0])).length, 43);
  assert.ok(flat.some((l) => l.includes("Safe Work Australia")));
  assert.ok(flat.some((l) => l === ref.ADG_COLUMN_NOTE));
});

test("export model parses classification, pictogram codes and overrides", () => {
  const m = EM.normalise({ generated_at: "2026-10-19T00:00:00Z", chemicals: [{ id: 1, product_name: "X", pictograms: "GHS02,GHS07", ghs_classification: '[{"c":"flam_liq","k":"2"}]', decision_overridden: 1 }], locations: [], assessments: [], sds_files: [] });
  const c = m.chemicals[0];
  assert.deepEqual(c.pictogramList, ["GHS02", "GHS07"]);
  assert.equal(c.classification[0].c, "flam_liq");
  assert.equal(c.decision_overridden, true);
  assert.equal(EM.pictogramText(c.pictogramList, ref), "GHS02 Flame; GHS07 Exclamation mark");
  assert.equal(EM.classificationText(null, ref), "Not classified yet");
  assert.match(EM.classificationText(c.classification, ref), /Flammable liquid/i);
});
