#!/usr/bin/env python3
"""Verify and safely unpack a GitHub-connector exact-HEAD source artifact offline.

A snapshot has no Git metadata; this never certifies publication readiness.
"""

import argparse
import hashlib
import os
import posixpath
import re
import shutil
import tarfile
import tempfile
import zipfile
from pathlib import Path, PurePosixPath

MAX_ARCHIVE_BYTES = 64 * 1024 * 1024
MAX_TREE_BYTES = 256 * 1024 * 1024
MAX_ENTRIES = 10000


def unpack(archive: Path, head: str, digest: str, destination: Path) -> int:
    if not re.fullmatch(r"[0-9a-f]{40}", head):
        raise ValueError("expected a full lowercase 40-character Git commit SHA")
    if not re.fullmatch(r"[0-9a-f]{64}", digest):
        raise ValueError("expected the SHA-256 digest provided by GitHub artifacts")
    if destination.exists() or destination.is_symlink():
        raise ValueError("destination already exists; do not overlay a different revision")
    if archive.stat().st_size > MAX_ARCHIVE_BYTES:
        raise ValueError("artifact exceeds size limit")
    with archive.open("rb") as artifact:
        actual = hashlib.file_digest(artifact, "sha256").hexdigest()
    if actual != digest:
        raise ValueError("artifact SHA-256 mismatch: fail closed")

    expected = f"nabla-site-alban-{head}.tar.gz"
    with zipfile.ZipFile(archive) as outer:
        if outer.namelist() != [expected]:
            raise ValueError("expected exactly one HEAD-specific tarball")
        if outer.getinfo(expected).file_size > MAX_ARCHIVE_BYTES:
            raise ValueError("nested archive exceeds size limit")
        with tempfile.TemporaryDirectory(prefix="nabla-snapshot-") as temporary:
            stage = Path(temporary) / "tree"
            stage.mkdir()
            with outer.open(expected) as compressed:
                # zip member size is already bounded; temp file limits memory use.
                tar_path = Path(temporary) / expected
                with tar_path.open("wb") as output:
                    shutil.copyfileobj(compressed, output)
            with tarfile.open(tar_path, mode="r:gz") as inner:
                members = inner.getmembers()
                if len(members) > MAX_ENTRIES:
                    raise ValueError("too many files in snapshot")
                total = 0
                links = []
                seen_paths = set()
                for member in members:
                    name = member.name.rstrip("/")
                    path = PurePosixPath(name)
                    if (
                        not path.parts
                        or path.is_absolute()
                        or ".." in path.parts
                        or "\\" in name
                    ):
                        raise ValueError("unsafe snapshot path")
                    if name in seen_paths:
                        raise ValueError("duplicate snapshot path")
                    seen_paths.add(name)
                    if path.parts[0] in {".git", "node_modules"}:
                        raise ValueError("archive must not contain Git metadata or dependencies")
                    target = stage.joinpath(*path.parts)
                    if member.isdir():
                        target.mkdir(parents=True, exist_ok=True)
                    elif member.isfile():
                        total += member.size
                        if total > MAX_TREE_BYTES:
                            raise ValueError("snapshot exceeds uncompressed size limit")
                        target.parent.mkdir(parents=True, exist_ok=True)
                        stream = inner.extractfile(member)
                        if stream is None:
                            raise ValueError("missing archive file body")
                        with stream, target.open("wb") as output:
                            shutil.copyfileobj(stream, output)
                        target.chmod(0o755 if member.mode & 0o111 else 0o644)
                    elif member.issym():
                        resolved = posixpath.normpath(
                            posixpath.join(posixpath.dirname(name), member.linkname),
                        )
                        if resolved == ".." or resolved.startswith("../") or resolved.startswith("/"):
                            raise ValueError("symlink escapes the snapshot")
                        links.append((target, member.linkname))
                    else:
                        raise ValueError("unsafe snapshot entry type")
                for target, link in links:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    if target.exists() or target.is_symlink():
                        raise ValueError("symlink collides with another entry")
                    target.symlink_to(link)
            destination.parent.mkdir(parents=True, exist_ok=True)
            os.replace(stage, destination)
            print(
                f"SNAPSHOT_OK head={head} digest={digest} "
                f"entries={len(members)} mode=source-only",
            )
            print("SNAPSHOT_NOT_PUBLISHABLE: missing .git; use targeted tests only")
            return len(members)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path, help="GitHub connector-downloaded ZIP")
    parser.add_argument("head", help="verified PR head SHA (not merge SHA)")
    parser.add_argument("digest", help="SHA-256 supplied by the GitHub artifact API")
    parser.add_argument("destination", type=Path, help="fresh extraction directory")
    args = parser.parse_args()
    try:
        unpack(args.archive, args.head, args.digest, args.destination)
    except (ValueError, OSError, tarfile.TarError, zipfile.BadZipFile) as exc:
        parser.exit(1, f"SNAPSHOT_REJECTED: {exc}\n")


if __name__ == "__main__":
    main()
