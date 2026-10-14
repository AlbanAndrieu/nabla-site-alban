import assert from "node:assert/strict";
import test from "node:test";
import {
	endpointUrlHostIsPrivateS3,
	internalPresentationState,
	runtimePresentationState,
} from "../app/components/homelab/homelabGridPresentation";

test("only the exact internal S3 hostname matches the exposure marker", () => {
	assert.equal(endpointUrlHostIsPrivateS3("https://s3.int.albandrieu.com/"), true);
	assert.equal(endpointUrlHostIsPrivateS3("https://s3.int.albandrieu.com.evil.test/"), false);
	assert.equal(endpointUrlHostIsPrivateS3("https://garage-admin.albandrieu.com/"), false);
	assert.equal(endpointUrlHostIsPrivateS3("invalid"), false);
});

test("internal health prefers observed LAN evidence over external state", () => {
	const entry = {
		internal_state: "ok" as const,
		state: "fail" as const,
		runtime_state: "STOPPED",
	};
	assert.equal(internalPresentationState(entry, false), "ok");
	assert.equal(internalPresentationState({ runtime_state: "RUNNING", state: "fail" }, false), "ok");
	assert.equal(internalPresentationState({ runtime_state: "RUNNING", state: "fail" }, true), "fail");
});

test("unavailable TrueNAS runtime is not presented as healthy", () => {
	const running = { runtime_state: "RUNNING" };
	assert.equal(runtimePresentationState(running, true, "garage", false, false), "ok");
	assert.equal(runtimePresentationState(running, true, "garage", true, false), "missing");
	assert.equal(runtimePresentationState(running, true, "garage", false, true), "missing");
	assert.equal(runtimePresentationState(running, false, "garage", false, false), null);
	assert.equal(runtimePresentationState(running, true, "truenas", false, false), null);
});
