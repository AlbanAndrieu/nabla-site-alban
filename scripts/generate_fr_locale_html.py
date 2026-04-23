#!/usr/bin/env python3
"""
One-off / repeatable generator: copy English marketing HTML from public/ to
public/locales/fr/, translating visible text (googletrans) and root-prefixing
relative /assets paths so pages work under /fr/*.
"""

from __future__ import annotations

import re
import time
from pathlib import Path

from bs4 import BeautifulSoup, Comment, NavigableString
from googletrans import Translator

REPO = Path(__file__).resolve().parents[1]
PUBLIC = REPO / "public"
OUT = PUBLIC / "locales" / "fr"

# Keep in sync with lib/marketingPages.ts + app routes using loadPublicHtmlFragment.
FILES = sorted(
	{
		"index.html",
		"checkout.html",
		"contact.html",
		"ai.html",
		"security.html",
		"expertise.html",
		"workstation.html",
		"startup.html",
		"startup-thanks.html",
		"pricing.html",
		"success.html",
		"cancel.html",
		"payment.html",
		"ciso.html",
		"nabla.html",
		"login.html",
		"link.html",
		"ctid.html",
		"freenas.html",
		"truenas.html",
		"test.html",
		"example-js.html",
		"email-contact-addresses.html",
	},
)

SKIP_PARENT_NAMES = frozenset({"script", "style", "noscript", "template"})
META_TRANSLATE_ATTRS = frozenset(
	{
		"description",
		"og:description",
		"og:title",
		"twitter:title",
		"twitter:description",
	},
)


def should_skip_text_parent(tag) -> bool:
	p = tag
	while p is not None:
		if p.name in SKIP_PARENT_NAMES:
			return True
		p = p.parent
	return False


def collect_text_chunks(soup: BeautifulSoup, root=None) -> list[NavigableString]:
	chunks: list[NavigableString] = []
	walk_root = root if root is not None else soup
	for node in walk_root.descendants:
		if isinstance(node, NavigableString) and not isinstance(node, Comment):
			if not isinstance(node, NavigableString):
				continue
			text = str(node)
			if not text or not text.strip():
				continue
			parent = node.parent
			if parent is None or should_skip_text_parent(parent):
				continue
			chunks.append(node)
	return chunks


def meta_content_should_translate(tag) -> bool:
	if tag.name != "meta":
		return False
	prop = (tag.get("property") or "").lower()
	name = (tag.get("name") or "").lower()
	itemprop = (tag.get("itemprop") or "").lower()
	if name == "description" or itemprop == "description":
		return True
	if prop in {"og:title", "og:description", "twitter:title", "twitter:description"}:
		return True
	return False


def collect_attr_jobs(soup: BeautifulSoup, root=None) -> list[tuple[object, str, str]]:
	"""List of (tag, attr_name, original_value) for attributes to translate."""
	jobs: list[tuple[object, str, str]] = []
	scope_tags = root.find_all(True) if root is not None else soup.find_all(True)
	for tag in scope_tags:
		if tag.name in SKIP_PARENT_NAMES:
			continue
		attrs = getattr(tag, "attrs", None) or {}
		for attr in ("title", "alt", "aria-label", "placeholder"):
			val = attrs.get(attr)
			if isinstance(val, list):
				val = val[0] if val else None
			if val and isinstance(val, str) and val.strip():
				jobs.append((tag, attr, val))
		if tag.name == "meta" and meta_content_should_translate(tag):
			val = attrs.get("content")
			if isinstance(val, list):
				val = val[0] if val else None
			if val and isinstance(val, str) and val.strip():
				jobs.append((tag, "content", val))
	return jobs


def collect_head_meta_jobs(soup: BeautifulSoup) -> list[tuple[object, str, str]]:
	jobs: list[tuple[object, str, str]] = []
	head = soup.find("head")
	if not head:
		return jobs
	for tag in head.descendants:
		if not getattr(tag, "name", None):
			continue
		if tag.name != "meta":
			continue
		if not meta_content_should_translate(tag):
			continue
		attrs = getattr(tag, "attrs", None) or {}
		val = attrs.get("content")
		if isinstance(val, list):
			val = val[0] if val else None
		if val and isinstance(val, str) and val.strip():
			jobs.append((tag, "content", val))
	return jobs


def batched_translate(translator: Translator, texts: list[str], dest: str = "fr") -> list[str]:
	"""Translate with chunking and retries."""
	out: list[str] = []
	batch_size = 48
	for i in range(0, len(texts), batch_size):
		batch = texts[i : i + batch_size]
		for attempt in range(5):
			try:
				res = translator.translate(batch, dest=dest)
				out.extend([t.text for t in res])
				break
			except Exception:
				time.sleep(1.2 * (attempt + 1))
		else:
			# last resort: per-string
			for s in batch:
				for attempt in range(5):
					try:
						out.append(translator.translate(s, dest=dest).text)
						break
					except Exception:
						time.sleep(1.0 * (attempt + 1))
				else:
					out.append(s)
		time.sleep(0.12)
	return out


def prefix_root_assets(html: str) -> str:
	"""Under /fr, relative assets/... breaks; use absolute /assets/..."""

	def repl_attr(m: re.Match[str]) -> str:
		attr = m.group(1)
		rest = m.group(2)
		if rest.startswith(("http://", "https://", "//", "data:", "mailto:", "tel:", "#")):
			return m.group(0)
		if rest.startswith("assets/"):
			return f'{attr}="/' + rest
		return m.group(0)

	# href="assets/... or src="assets/...
	return re.sub(r'\b(href|src)=(["\'])(assets/[^"\']+)\2', repl_attr, html, flags=re.IGNORECASE)


def translate_file(path: Path, translator: Translator) -> None:
	raw = path.read_text(encoding="utf-8")
	soup = BeautifulSoup(raw, "html.parser")

	main_root = soup.find("main")

	text_nodes = collect_text_chunks(soup, root=main_root)
	text_values = [str(n) for n in text_nodes]
	if text_values:
		translated = batched_translate(translator, text_values)
		for node, new_text in zip(text_nodes, translated, strict=True):
			node.replace_with(new_text)

	attr_jobs = collect_attr_jobs(soup, root=main_root)
	if attr_jobs:
		values = [v for _, _, v in attr_jobs]
		translated_attrs = batched_translate(translator, values)
		for (tag, attr, _), new_val in zip(attr_jobs, translated_attrs, strict=True):
			tag[attr] = new_val

	meta_jobs = collect_head_meta_jobs(soup)
	if meta_jobs:
		values = [v for _, _, v in meta_jobs]
		translated_meta = batched_translate(translator, values)
		for (tag, attr, _), new_val in zip(meta_jobs, translated_meta, strict=True):
			tag[attr] = new_val

	# <title>
	title_tag = soup.find("title")
	if title_tag:
		title_text = title_tag.get_text(strip=True)
		if title_text:
			try:
				fr_title = translator.translate(title_text, dest="fr").text
				title_tag.clear()
				title_tag.append(NavigableString(fr_title))
			except Exception:
				pass

	out_html = str(soup)
	out_html = prefix_root_assets(out_html)
	if "lang=" in out_html[:500].lower():
		out_html = re.sub(
			r"<html\s+lang=(['\"])en\1",
			r'<html lang=\1fr\1',
			out_html,
			count=1,
			flags=re.IGNORECASE,
		)
	else:
		out_html = re.sub(r"<html", '<html lang="fr"', out_html, count=1, flags=re.IGNORECASE)

	OUT.mkdir(parents=True, exist_ok=True)
	(OUT / path.name).write_text(out_html, encoding="utf-8")


def main() -> None:
	import os

	OUT.mkdir(parents=True, exist_ok=True)
	translator = Translator()
	force = os.environ.get("FR_HTML_FORCE", "").strip() in ("1", "true", "yes")
	for name in FILES:
		src = PUBLIC / name
		if not src.is_file():
			raise SystemExit(f"missing source: {src}")
		dest = OUT / name
		if dest.is_file() and not force:
			print(f"skip (exists): {name}")
			continue
		print(f"translate: {name}")
		translate_file(src, translator)


if __name__ == "__main__":
	main()
