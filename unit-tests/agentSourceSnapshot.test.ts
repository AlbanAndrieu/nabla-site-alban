import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execute = promisify(execFile);
const script = fileURLToPath(
	new URL("../scripts/agent-source-snapshot.py", import.meta.url),
);
const head = "1".repeat(40);

async function makeArtifact(cwd: string, fileName: string) {
	const python = `import hashlib,io,sys,tarfile,zipfile
from pathlib import Path
archive=Path(sys.argv[1]); name=sys.argv[2]
buffer=io.BytesIO()
with tarfile.open(fileobj=buffer,mode="w:gz") as inner:
 body=b"hello\\n"; info=tarfile.TarInfo(name); info.size=len(body); inner.addfile(info,io.BytesIO(body))
with zipfile.ZipFile(archive,"w") as outer: outer.writestr("nabla-site-alban-${head}.tar.gz",buffer.getvalue())
print(hashlib.sha256(archive.read_bytes()).hexdigest())`;
	const archive = path.join(cwd, "source.zip");
	const result = await execute("python3", ["-c", python, archive, fileName]);
	return { archive, digest: result.stdout.trim() };
}

test("exact-head archive is extracted with pinned SHA-256 and labeled source-only", async () => {
	const cwd = await mkdtemp(path.join(os.tmpdir(), "nabla-snapshot-test-"));
	try {
		const { archive, digest } = await makeArtifact(cwd, "README.md");
		const output = path.join(cwd, "verified");
		const good = await execute("python3", [
			script,
			archive,
			head,
			digest,
			output,
		]);
		assert.match(good.stdout, /SNAPSHOT_OK/);
		assert.match(good.stdout, /SNAPSHOT_NOT_PUBLISHABLE/);
		await assert.rejects(
			execute("python3", [script, archive, head, digest, output]),
		);
		await assert.rejects(
			execute("python3", [
				script,
				archive,
				head,
				"0".repeat(64),
				path.join(cwd, "bad"),
			]),
			(error: unknown) =>
				String((error as { stderr: string }).stderr).includes(
					"SHA-256 mismatch",
				),
		);
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});

test("archive extraction rejects traversal entries without writing outside destination", async () => {
	const cwd = await mkdtemp(path.join(os.tmpdir(), "nabla-snapshot-unsafe-"));
	try {
		const { archive, digest } = await makeArtifact(cwd, "../escape.txt");
		await assert.rejects(
			execute("python3", [
				script,
				archive,
				head,
				digest,
				path.join(cwd, "out"),
			]),
			(error: unknown) =>
				String((error as { stderr: string }).stderr).includes(
					"unsafe snapshot path",
				),
		);
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});
