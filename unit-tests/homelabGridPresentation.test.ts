import assert from "node:assert/strict";
import test from "node:test";
import {
	EFFECTIVE_HEALTH_ICON_CLASS,
	ENDPOINT_HEALTH_CLASS,
	endpointUrlHostIsPrivateS3,
	INTERNAL_HEALTH_CLASS,
	internalPresentationState,
	RUNTIME_ICON_CLASS,
	runtimePresentationState,
} from "../app/components/homelab/homelabGridPresentation";

test("only the exact internal S3 hostname matches the exposure marker", () => {
	assert.equal(
		endpointUrlHostIsPrivateS3("https://s3.int.albandrieu.com/"),
		true,
	);
	assert.equal(
		endpointUrlHostIsPrivateS3("https://s3.int.albandrieu.com.evil.test/"),
		false,
	);
	assert.equal(
		endpointUrlHostIsPrivateS3("https://garage-admin.albandrieu.com/"),
		false,
	);
	assert.equal(endpointUrlHostIsPrivateS3("invalid"), false);
});

test("internal health prefers observed LAN evidence over external state", () => {
	const entry = {
		internal_state: "ok" as const,
		state: "fail" as const,
		runtime_state: "STOPPED",
	};
	assert.equal(internalPresentationState(entry, false), "ok");
	assert.equal(
		internalPresentationState(
			{ runtime_state: "RUNNING", state: "fail" },
			false,
		),
		"ok",
	);
	assert.equal(
		internalPresentationState(
			{ runtime_state: "RUNNING", state: "fail" },
			true,
		),
		"fail",
	);
});

test("unavailable TrueNAS runtime is not presented as healthy", () => {
	const running = { runtime_state: "RUNNING" };
	assert.equal(
		runtimePresentationState(running, true, "garage", false, false),
		"ok",
	);
	// Unavailable or stale evidence is UNKNOWN, never an observed outage.
	assert.equal(
		runtimePresentationState(running, true, "garage", true, false),
		"unknown",
	);
	assert.equal(
		runtimePresentationState(running, true, "garage", false, true),
		"unknown",
	);
	assert.equal(
		runtimePresentationState(
			{ runtime_state: "RUNNING", runtime_missing: true },
			true,
			"garage",
			false,
			false,
		),
		"missing",
	);
	assert.equal(
		runtimePresentationState(running, false, "garage", false, false),
		null,
	);
	assert.equal(
		runtimePresentationState(running, true, "truenas", false, false),
		null,
	);
});

test("endpoint and internal links share health button classes", () => {
	assert.deepEqual(ENDPOINT_HEALTH_CLASS, {
		pending: "btn-outline-primary",
		ok: "btn-outline-success",
		warn: "btn-outline-warning",
		fail: "btn-outline-danger",
		unknown: "btn-outline-secondary",
	});
	for (const state of ["ok", "warn", "fail", "unknown"] as const) {
		assert.equal(ENDPOINT_HEALTH_CLASS[state], INTERNAL_HEALTH_CLASS[state]);
	}
});

test("runtime icons reuse effective health icons and add a missing marker", () => {
	assert.deepEqual(RUNTIME_ICON_CLASS, {
		ok: "fas fa-circle-check",
		warn: "fas fa-triangle-exclamation",
		fail: "fas fa-circle-xmark",
		unknown: "fas fa-circle-question",
		missing: "fas fa-skull-crossbones",
	});
	for (const state of ["ok", "warn", "fail", "unknown"] as const) {
		assert.equal(RUNTIME_ICON_CLASS[state], EFFECTIVE_HEALTH_ICON_CLASS[state]);
	}
});
