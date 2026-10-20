import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const M = require("../public/lib/audit-model.js");

const it = (o) => Object.assign({ product_name: "x", review_status: "ok", has_sds: 1, has_assessment: 1 }, o);

test("sortItems: overdue, due soon, no SDS, no assessment first, then by name", () => {
  const list = [
    it({ product_name: "Zinc ok" }),
    it({ product_name: "Acetone ok" }),
    it({ product_name: "No assess", has_assessment: 0 }),
    it({ product_name: "No sds", review_status: "no_sds", has_sds: 0, has_assessment: 0 }),
    it({ product_name: "Soon", review_status: "due_soon" }),
    it({ product_name: "Late B", review_status: "overdue" }),
    it({ product_name: "Late A", review_status: "overdue" }),
  ];
  assert.deepEqual(M.sortItems(list).map((i) => i.product_name), ["Late A", "Late B", "Soon", "No sds", "No assess", "Acetone ok", "Zinc ok"]);
  assert.equal(list[0].product_name, "Zinc ok", "input is not mutated");
});

test("needsAttention", () => {
  assert.equal(M.needsAttention(it({})), false);
  assert.equal(M.needsAttention(it({ review_status: "overdue" })), true);
  assert.equal(M.needsAttention(it({ has_assessment: 0 })), true);
  assert.equal(M.needsAttention(it({ review_status: "unknown" })), false);
});

test("progress and its wording", () => {
  const items = [{ result: "present" }, { result: "changed" }, { result: null }, {}];
  const p = M.progress(items);
  assert.deepEqual(p, { marked: 2, total: 4, unmarked: 2, pct: 50 });
  assert.equal(M.progressText(p), "2 of 4 marked");
  assert.equal(M.progress([]).pct, 100);
  assert.match(M.progressText(M.progress([])), /No chemicals/);
});

test("placeReadiness counts out of date, no SDS, no assessment", () => {
  const r = M.placeReadiness([
    { review_status: "overdue", sds_id: 1, has_assessment: 1 },
    { review_status: "due_soon", sds_id: 2, has_assessment: 0 },
    { review_status: "no_sds", sds_id: null, has_assessment: 0 },
    { review_status: "ok", sds_id: 3, has_assessment: 1 },
  ]);
  assert.deepEqual(r, { total: 4, outOfDate: 2, noSds: 1, noAssessment: 2, attention: 3 });
});

test("changedProblem needs a quantity with a unit, a container note or a note", () => {
  assert.ok(M.changedProblem({}));
  assert.ok(M.changedProblem({ newQuantity: "5" }), "quantity without unit");
  assert.ok(M.changedProblem({ newQuantity: "-1", newUnit: "L" }));
  assert.equal(M.changedProblem({ newQuantity: "5", newUnit: "L" }), "");
  assert.equal(M.changedProblem({ newContainerNote: "2 drums" }), "");
  assert.equal(M.changedProblem({ note: "split into two" }), "");
  assert.equal(M.changedProblem({ newQuantity: "0", newUnit: "kg" }), "");
});

test("scaleSize: longest side 1600, never upscale", () => {
  assert.deepEqual(M.scaleSize(4000, 3000), { width: 1600, height: 1200, scale: 0.4 });
  assert.deepEqual(M.scaleSize(3000, 4000), { width: 1200, height: 1600, scale: 0.4 });
  assert.deepEqual(M.scaleSize(800, 600), { width: 800, height: 600, scale: 1 });
  assert.deepEqual(M.scaleSize(1600, 900), { width: 1600, height: 900, scale: 1 });
  const odd = M.scaleSize(4001, 1999);
  assert.equal(odd.width, 1600);
  assert.equal(odd.height, Math.round(1999 * 1600 / 4001));
  assert.equal(M.scaleSize(0, 0).width, 0);
  assert.equal(M.MAX_SIDE, 1600);
  assert.equal(M.JPEG_QUALITY, 0.7);
});

test("pickTakenAt trusts a recent lastModified, otherwise now", () => {
  const now = Date.parse("2026-10-21T10:00:00Z");
  const hour = 3600e3;
  assert.equal(M.pickTakenAt(now - hour, now), new Date(now - hour).toISOString());
  assert.equal(M.pickTakenAt(now - 47 * hour, now), new Date(now - 47 * hour).toISOString());
  assert.equal(M.pickTakenAt(now - 49 * hour, now), new Date(now).toISOString(), "older than 2 days");
  assert.equal(M.pickTakenAt(now + hour, now), new Date(now).toISOString(), "in the future");
  assert.equal(M.pickTakenAt(0, now), new Date(now).toISOString());
  assert.equal(M.pickTakenAt(undefined, now), new Date(now).toISOString());
  assert.equal(M.pickTakenAt(NaN, now), new Date(now).toISOString());
});

test("summary wording", () => {
  const s = { listed: 17, present: 10, not_found: 2, changed: 1, not_marked: 4, found: 1, disposals: 1, photos: 3, photo_bytes: 3 * 1048576 };
  const rows = M.summaryRows(s);
  assert.deepEqual(rows[0], ["Chemicals listed", 17]);
  assert.equal(rows.at(-1)[1], "3 (3.0 MB)");
  const steps = M.nextSteps(s).join(" ");
  assert.match(steps, /Not found and Changed items go to an admin to review\. Nothing on the register has changed yet\./);
  assert.match(steps, /4 chemicals were not marked/);
  assert.match(M.nextSteps({ not_found: 0, changed: 0, not_marked: 1, found: 0, disposals: 0 }).join(" "), /1 chemical was not marked/);
  assert.match(M.nextSteps({ not_found: 0, changed: 0, not_marked: 0, found: 0, disposals: 0 })[0], /Nothing on the register needs to change/);
});

test("summaryFromAudit uses the server summary (string or object), else counts the rows", () => {
  const sum = { listed: 2, present: 1, not_found: 1, changed: 0, not_marked: 0, found: 0, disposals: 0, photos: 0, photo_bytes: 0 };
  assert.equal(M.summaryFromAudit({ audit: { summary: JSON.stringify(sum) } }).not_found, 1);
  assert.equal(M.summaryFromAudit({ audit: { summary: sum } }).present, 1);
  const built = M.summaryFromAudit({ audit: {}, items: [{ result: "present" }, { result: null }], found: [{}], disposals: [], photos: [{ bytes: 100 }, { bytes: 50 }] });
  assert.deepEqual([built.listed, built.present, built.not_marked, built.found, built.photos, built.photo_bytes], [2, 1, 1, 1, 2, 150]);
});

test("unmarked warning, found outcome text, pending text, mb", () => {
  assert.equal(M.unmarkedWarning(5), "5 chemicals are not marked. They won't be recorded as missing.");
  assert.equal(M.unmarkedWarning(1), "1 chemical is not marked. It won't be recorded as missing.");
  assert.equal(M.foundOutcomeText("link_suggested", false), "Sent to the admin to link");
  assert.equal(M.foundOutcomeText("linked", true), "Linked to this place");
  assert.equal(M.foundOutcomeText("link_suggested", true), "Linked to this place");
  assert.match(M.foundOutcomeText("created"), /needs an SDS/);
  assert.equal(M.pendingText({ answers: 9, photos: 3, other: 0 }), "Not yet sent: 9 answers, 3 photos");
  assert.equal(M.pendingText({ answers: 1, photos: 1, other: 2 }), "Not yet sent: 1 answer, 1 photo, 2 other items");
  assert.equal(M.pendingText({ answers: 0, photos: 0, other: 0 }), "");
  assert.equal(M.mbText(0), "0 MB");
  assert.equal(M.mbText(2.5 * 1048576), "2.5 MB");
  assert.equal(M.mbText(1000), "less than 0.1 MB");
});

test("expectedText", () => {
  assert.equal(M.expectedText({ expected_quantity: 20, expected_unit: "L", expected_container_note: "4 x 5 L" }), "20 L · 4 x 5 L");
  assert.equal(M.expectedText({ expected_container_note: "drum" }), "drum");
  assert.equal(M.expectedText({}), "");
});
