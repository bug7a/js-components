#!/usr/bin/env python3
"""
Pack and minify all external JavaScript files referenced by <script src="..."> in an HTML file
into a single output .js file.

Need:
    pip install jsmin
    
Usage:
  python pack_minify_js_from_html.py index.html bundle.min.js
"""

import argparse
import os
import sys
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse
from urllib.request import urlopen
from urllib.error import URLError, HTTPError
from jsmin import jsmin   # pip install jsmin

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

class ScriptCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts = []
        self.base_href = None

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        attrs = dict(attrs)
        if tag == "base":
            href = attrs.get("href")
            if href:
                self.base_href = href
        if tag == "script" and "src" in attrs:
            self.scripts.append(attrs["src"])

def is_http_url(url: str) -> bool:
    return urlparse(url).scheme in ("http", "https")

def read_text_from_url(url: str, timeout: int = 20) -> str:
    with urlopen(url, timeout=timeout) as resp:
        charset = resp.headers.get_content_charset() or "utf-8"
        return resp.read().decode(charset, errors="replace")

def main():
    ap = argparse.ArgumentParser(description="Pack and minify JS from HTML")
    ap.add_argument("html", help="Input HTML file path")
    ap.add_argument("output", help="Output .js file path")
    args = ap.parse_args()

    # HTML oku
    with open(args.html, "r", encoding="utf-8") as f:
        html_text = f.read()

    parser = ScriptCollector()
    parser.feed(html_text)
    base = os.path.dirname(os.path.abspath(args.html))

    seen = set()
    bundles = []
    for src in parser.scripts:
        abs_path = urljoin("file://" + base + "/", src) if not is_http_url(src) else src
        if abs_path in seen:
            continue
        seen.add(abs_path)
        try:
            if is_http_url(abs_path):
                content = read_text_from_url(abs_path)
            else:
                local_path = os.path.normpath(os.path.join(base, src))
                with open(local_path, "r", encoding="utf-8") as f:
                    content = f.read()
        except (FileNotFoundError, URLError, HTTPError) as e:
            eprint(f"[WARN] Could not load {src}: {e}")
            continue

        minified = jsmin(content)
        bundles.append(minified)

    # yaz
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as out:
        out.write(";\n".join(bundles))

    print(f"[INFO] Wrote minified bundle: {args.output}")

if __name__ == "__main__":
    main()
