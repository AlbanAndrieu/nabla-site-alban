import assert from "node:assert/strict";
import test from "node:test";
import {
	ACCESS_RECHECK_MS,
	ACCESS_FOCUS_RECHECK_MS,
	createHomelabAccessProbe,
	parseHomelabAccessDecision,
} from "../lib/homelabBrowserAccess.ts";

test("parse denies malformed or untrusted access responses", () => {
	for (const body of [null, true, [], {}, { trusted: "true" },
		{ trusted: true, mode: "owner" }, { trusted: true, mode: null },
		{ trusted: false, mode: "public-readonly" }]) {
		assert.equal(parseHomelabAccessDecision(body), "denied");
	}
	assert.equal(parseHomelabAccessDecision({ trusted: true }), "trusted");
	assert.equal(parseHomelabAccessDecision({ trusted: true, mode: "public-readonly" }), "readonly");
});

test("concurrent trusted/readonly gates share a single request", async () => {
	let calls = 0;
	let resolve;
	const probe = createHomelabAccessProbe(() => {
		calls += 1;
		return new Promise((r) => { resolve = r; });
	}, () => 1000);
	const first = probe.check();
	const second = probe.check();
	assert.equal(first, second);
	assert.equal(calls, 1);
	assert.equal(probe.shouldRecheck(true), true);
	resolve("readonly");
	assert.deepEqual(await Promise.all([first, second]), ["readonly", "readonly"]);
	assert.equal(probe.shouldRecheck(), false);
});

test("long lived tabs recheck periodically but not on every render", async () => {
	let clock = 1000;
	let calls = 0;
	const probe = createHomelabAccessProbe(async () => { calls++; return "trusted"; }, () => clock);
	assert.equal(await probe.check(), "trusted");
	clock += ACCESS_RECHECK_MS - 1;
	assert.equal(probe.shouldRecheck(), false);
	assert.equal(await probe.check(), "trusted");
	assert.equal(calls, 1);
	clock += 1;
	assert.equal(probe.shouldRecheck(), true);
	assert.equal(await probe.check(), "trusted");
	assert.equal(calls, 2);
});

test("focus rechecks access after a short throttle", async () => {
	let clock = 1000;
	const decisions = ["trusted", "readonly"];
	const probe = createHomelabAccessProbe(async () => decisions.shift(), () => clock);
	assert.equal(await probe.check(), "trusted");
	clock += ACCESS_FOCUS_RECHECK_MS - 1;
	assert.equal(probe.shouldRecheck(true), false);
	clock++;
	assert.equal(probe.shouldRecheck(true), true);
	assert.equal(await probe.check(true), "readonly");
});

test("network and parser failures revoke previous owner access", async () => {
	let clock = 1000;
	let calls = 0;
	const probe = createHomelabAccessProbe(async () => {
		calls++;
		if (calls === 1) return "trusted";
		throw new Error("network failure");
	}, () => clock);
	assert.equal(await probe.check(), "trusted");
	clock += ACCESS_RECHECK_MS;
	assert.equal(await probe.check(), "denied");
	assert.equal(await probe.check(), "denied");
	assert.equal(calls, 2);
});

test("clock moving backwards forces new authorization", async () => {
	let clock = 1000;
	let calls = 0;
	const probe = createHomelabAccessProbe(async () => { calls++; return "trusted"; }, () => clock);
	await probe.check();
	clock = 900;
	assert.equal(probe.shouldRecheck(), true);
	await probe.check();
	assert.equal(calls, 2);
});
