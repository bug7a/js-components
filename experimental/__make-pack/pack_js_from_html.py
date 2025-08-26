#!/usr/bin/env python3
"""
Pack all external JavaScript files referenced by <script src="..."> in an HTML file
into a single output .js file, preserving order and avoiding duplicates.

Usage:
  python pack_js_from_html.py path/to/index.html out/bundle.js

Options:
  --include-inline           Also include inline <script> blocks (in order).
  --allow-duplicates         Do not deduplicate by absolute URL/path (default: dedupe).
  --timeout SECONDS          Network timeout for HTTP(S) fetches (default: 20).
  --quiet                    Suppress non-error logs.
Examples:
  python pack_js_from_html.py index.html public/app.bundle.js
"""

import argparse
import io
import os
import sys
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse
from urllib.request import urlopen, Request, url2pathname
from urllib.error import URLError, HTTPError

DEFAULT_TIMEOUT = 20

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

class ScriptCollector(HTMLParser):
    def __init__(self, include_inline=False):
        super().__init__()
        self.include_inline = include_inline
        self.scripts = []   # list of dicts: {"src": str|None, "inline": str|None}
        self._in_script = False
        self._inline_buf = None
        self.base_href = None

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        attrs = dict(attrs)
        if tag == "base":
            href = attrs.get("href")
            if href:
                self.base_href = href
        if tag == "script":
            src = attrs.get("src")
            type_attr = (attrs.get("type") or "").lower()
            # We include classic scripts and modules; skip non-JS like application/ld+json
            if src:
                self.scripts.append({"src": src, "inline": None, "type": type_attr})
            elif self.include_inline:
                self._in_script = True
                self._inline_buf = io.StringIO()

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag == "script" and self._in_script and self.include_inline:
            self.scripts.append({"src": None, "inline": self._inline_buf.getvalue(), "type": ""})
            self._in_script = False
            self._inline_buf = None

    def handle_data(self, data):
        if self._in_script and self._inline_buf is not None:
            self._inline_buf.write(data)

def is_http_url(url: str) -> bool:
    return urlparse(url).scheme in ("http", "https")

def is_file_url(url: str) -> bool:
    return urlparse(url).scheme == "file"

def read_text_from_url(url: str, timeout: int = DEFAULT_TIMEOUT) -> str:
    req = Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible)"})
    with urlopen(req, timeout=timeout) as resp:
        charset = resp.headers.get_content_charset() or "utf-8"
        data = resp.read()
        return data.decode(charset, errors="replace")

def read_text_from_file_url(file_url: str) -> str:
    # Convert file:/// path to local path and read
    parsed = urlparse(file_url)
    local_path = url2pathname(parsed.path)
    with open(local_path, "r", encoding="utf-8") as f:
        return f.read()

def read_text_from_local_path(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def resolve_base_for_input(input_html_path: str, html_text: str, parser: ScriptCollector) -> str:
    # Prefer <base href>, else derive from input path/URL
    if parser.base_href:
        # If base is relative, join with input base
        if is_http_url(input_html_path) or is_file_url(input_html_path):
            return urljoin(input_html_path, parser.base_href)
        else:
            # Convert local path to a file:// URL to use urljoin consistently
            abs_path = os.path.abspath(input_html_path)
            return urljoin(f"file://{abs_path}", parser.base_href)
    else:
        if is_http_url(input_html_path) or is_file_url(input_html_path):
            return input_html_path
        else:
            abs_path = os.path.abspath(input_html_path)
            return f"file://{abs_path}"

def main():
    ap = argparse.ArgumentParser(description="Pack JS files referenced by <script src> into one bundle.")
    ap.add_argument("html", help="Path or URL to input HTML (e.g., index.html)")
    ap.add_argument("output", help="Path to output .js file (will be created/overwritten)")
    ap.add_argument("--include-inline", action="store_true", help="Also include inline <script> blocks in order")
    ap.add_argument("--allow-duplicates", action="store_true", help="Do not deduplicate by absolute URL/path")
    ap.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT, help="Network timeout for HTTP(S) fetches")
    ap.add_argument("--quiet", action="store_true", help="Suppress info logs")
    args = ap.parse_args()

    # Load the HTML
    input_is_url = is_http_url(args.html) or is_file_url(args.html)
    if input_is_url:
        try:
            html_text = read_text_from_url(args.html, timeout=args.timeout) if is_http_url(args.html) else read_text_from_file_url(args.html)
        except (URLError, HTTPError) as e:
            eprint(f"[ERROR] Failed to fetch HTML from URL: {args.html}\n  {e}")
            sys.exit(2)
    else:
        try:
            html_text = read_text_from_local_path(args.html)
        except FileNotFoundError:
            eprint(f"[ERROR] HTML file not found: {args.html}")
            sys.exit(2)

    # Parse scripts
    parser = ScriptCollector(include_inline=args.include_inline)
    parser.feed(html_text)
    base_url = resolve_base_for_input(args.html, html_text, parser)

    if not args.quiet:
        print(f"[INFO] Found {len(parser.scripts)} <script> entries")
        if parser.base_href:
            print(f"[INFO] Using <base href> = {parser.base_href}")
        print(f"[INFO] Base URL for resolution: {base_url}")

    # Resolve and collect in order
    seen = set()
    bundles = []
    for i, item in enumerate(parser.scripts, start=1):
        if item["src"]:
            abs_url = urljoin(base_url, item["src"])
            key = abs_url
            if (not args.allow_duplicates) and key in seen:
                if not args.quiet:
                    print(f"[INFO] Skipping duplicate: {abs_url}")
                continue
            seen.add(key)

            try:
                if is_http_url(abs_url):
                    content = read_text_from_url(abs_url, timeout=args.timeout)
                elif is_file_url(abs_url):
                    content = read_text_from_file_url(abs_url)
                else:
                    # Relative local path after join may still be a plain path; resolve vs the HTML's directory
                    if input_is_url and is_http_url(base_url):
                        # This case shouldn't happen because urljoin should have produced http(s) URL
                        raise ValueError(f"Unrecognized URL after join: {abs_url}")
                    # Resolve against directory of the local HTML file
                    html_dir = os.path.dirname(os.path.abspath(args.html))
                    local_path = os.path.normpath(os.path.join(html_dir, item["src"]))
                    content = read_text_from_local_path(local_path)
                    abs_url = f"file://{os.path.abspath(local_path)}"
            except Exception as e:
                eprint(f"[WARN] Could not load {item['src']} (resolved: {abs_url}): {e}")
                continue

            header = f"// ==== Begin: {abs_url} ====\n"
            footer = f"\n// ==== End: {abs_url} ====\n\n"
            bundles.append(header + content + footer)
            if not args.quiet:
                print(f"[INFO] Added: {abs_url}")
        else:
            # Inline script
            if args.include_inline and item["inline"] is not None:
                header = f"// ==== Begin: inline-script@{i} ====\n"
                footer = f"\n// ==== End: inline-script@{i} ====\n\n"
                bundles.append(header + item["inline"] + footer)

    # Write output
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as out:
        out.write("// Bundled by pack_js_from_html.py\n\n")
        for chunk in bundles:
            out.write(chunk)

    if not args.quiet:
        print(f"[INFO] Wrote bundle: {args.output} ({sum(len(b) for b in bundles)} bytes of JS)")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        eprint("Interrupted.")
        sys.exit(130)
