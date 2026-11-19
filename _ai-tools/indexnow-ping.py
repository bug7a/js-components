# Bismillah
"""
indexnow-ping.py 1.0: tells the search engines (Bing, Yandex, Seznam, Naver through IndexNow) which pages
of bug7a.github.io changed, and lists the GitHub Pages sites that no search engine can find yet.

    python3 _ai-tools/indexnow-ping.py --check              the sites with Pages and no sitemap in robots.txt
    python3 _ai-tools/indexnow-ping.py --since 2026-11-05   sends the addresses whose <lastmod> is that day or later
    python3 _ai-tools/indexnow-ping.py --all                sends every address of every sitemap
    --dry-run                                                prints the addresses, sends nothing

The addresses come from the live sitemaps listed in the live https://bug7a.github.io/robots.txt; an address with
/claude/ is never sent (a private page). --check needs `gh` (logged in). Exit code 1 when --check found a site
without a sitemap or IndexNow did not accept the list.

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0
"""
import argparse
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

HOST = "bug7a.github.io"
KEY = "9aa055cd7d6a1b4388604ffd4598ecc3"
ROBOTS_URL = "https://" + HOST + "/robots.txt"
INDEXNOW_URL = "https://api.indexnow.org/indexnow"
PRIVATE_PARTS = ["/claude/"]
GITHUB_USER = "bug7a"
# WHY: old Pages sites of before 2026-11-19 left without a sitemap on purpose, so --check names only a new site.
OLD_SITES_WITHOUT_SITEMAP = [
    "arduino-mantar-otomasyonu", "basic.js-ui-components", "basicjs-turkce", "butterfly-javascript-game",
    "hittest.js", "iconselect.js", "izmir-city-walking-tour", "javascript-single-page-application-example",
    "js-smart-data-table", "kodlama-egitimi", "progressbar.js", "ui-select-text.js", "web2app",
]


def fetch(url):
    # WHY: a query string skips the cache of GitHub Pages, so a page pushed a minute ago is read as it is now.
    fresh_url = url + ("&" if "?" in url else "?") + "t=" + str(int(time.time()))
    with urllib.request.urlopen(fresh_url, timeout=30) as response:
        return response.read().decode("utf-8")


def sitemap_urls():
    robots = fetch(ROBOTS_URL)
    return re.findall(r"^Sitemap:\s*(\S+)", robots, re.MULTILINE)


def pages_of(sitemap_url):
    xml = fetch(sitemap_url)
    pages = []
    for block in re.findall(r"<url>(.*?)</url>", xml, re.DOTALL):
        loc = re.search(r"<loc>\s*([^<\s]+)", block)
        if not loc:
            continue
        lastmod = re.search(r"<lastmod>\s*([0-9-]{10})", block)
        pages.append((loc.group(1), lastmod.group(1) if lastmod else ""))
    return pages


def is_private(url):
    return any(part in url for part in PRIVATE_PARTS)


def check_sites(sitemaps):
    listed = {re.sub(r"^https://[^/]+/([^/]*)/?.*$", r"\1", url) for url in sitemaps}
    output = subprocess.run(
        ["gh", "api", "--paginate", "users/" + GITHUB_USER + "/repos?per_page=100",
         "--jq", ".[] | select(.has_pages and (.private | not) and (.fork | not)) | .name"],
        capture_output=True, text=True, check=True).stdout
    missing = []
    for name in output.split():
        if name == HOST:
            continue
        if name not in listed and name not in OLD_SITES_WITHOUT_SITEMAP:
            missing.append(name)
    for name in missing:
        print("NO SITEMAP IN robots.txt: https://" + HOST + "/" + name + "/")
    if not missing:
        print("Every public Pages site is in robots.txt.")
    return missing


def send(urls):
    body = json.dumps({
        "host": HOST,
        "key": KEY,
        "keyLocation": "https://" + HOST + "/" + KEY + ".txt",
        "urlList": urls,
    }).encode("utf-8")
    request = urllib.request.Request(INDEXNOW_URL, data=body, method="POST",
                                     headers={"Content-Type": "application/json; charset=utf-8"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.status
    except urllib.error.HTTPError as error:
        return error.code


def main():
    parser = argparse.ArgumentParser(description="IndexNow ping and sitemap check of " + HOST)
    parser.add_argument("--since", help="send the addresses whose lastmod is this day (YYYY-MM-DD) or later")
    parser.add_argument("--all", action="store_true", help="send every address")
    parser.add_argument("--check", action="store_true", help="list the Pages sites missing in robots.txt")
    parser.add_argument("--dry-run", action="store_true", help="print, do not send")
    args = parser.parse_args()

    sitemaps = sitemap_urls()
    failed = False
    if args.check:
        failed = bool(check_sites(sitemaps))
    if not (args.since or args.all):
        return 1 if failed else 0

    urls = []
    for sitemap in sitemaps:
        for url, lastmod in pages_of(sitemap):
            if is_private(url):
                continue
            if args.since and lastmod and lastmod < args.since:
                continue
            urls.append(url)
    urls = sorted(set(urls))
    for url in urls:
        print(url)
    print(str(len(urls)) + " addresses")
    if not urls or args.dry_run:
        return 1 if failed else 0

    status = send(urls)
    # WHY: 200 = accepted, 202 = accepted while the key is still being checked; anything else is a refusal.
    accepted = status in (200, 202)
    print("IndexNow: " + str(status) + (" accepted" if accepted else " NOT accepted"))
    return 0 if (accepted and not failed) else 1


if __name__ == "__main__":
    sys.exit(main())
