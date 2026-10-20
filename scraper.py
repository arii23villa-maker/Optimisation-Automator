#!/usr/bin/env python3
"""
Extended scraper: adds meta title/description, JSON-LD schema, tags/categories,
and sitemap discovery on top of the original content-scraping script.

CLI capabilities:
    --sitemap           Discover URLs from the site's sitemap.xml (or robots.txt)
                         instead of / in addition to explicit URLs, then scrape each.
    --meta-only         Skip content extraction; just dump title/description/schema/tags
                         to JSON instead of writing markdown files.
"""

import argparse
import json
import os
import re
import sys
import time
from urllib.parse import urljoin, urlparse

import requests

try:
    from bs4 import BeautifulSoup, NavigableString, Tag
except ImportError:
    print("ERROR: beautifulsoup4 is required. Install it with:")
    print("  pip install beautifulsoup4 lxml")
    sys.exit(1)

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options as ChromeOptions
    from selenium.webdriver.support.ui import WebDriverWait

    HAS_SELENIUM = True
except ImportError:
    HAS_SELENIUM = False

try:
    from markdownify import markdownify as _markdownify

    HAS_MARKDOWNIFY = True
except ImportError:
    HAS_MARKDOWNIFY = False

REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}

NOISE_TAGS = {
    "script", "style", "noscript", "svg", "canvas",
    "iframe", "form", "button", "input", "select",
    "textarea", "nav", "header", "footer",
}

ARTICLE_SELECTORS = [
    "article", "main", "[role='main']",
    ".article-content", ".post-content", ".entry-content", ".blog-content",
    ".page-content", ".content-body", ".article-body", ".story-body",
    "#article-body", "#main-content", "#content", ".main-content",
    ".rich-text", ".prose",
]

JS_DETECTION_THRESHOLD = 80


# ---------------------------------------------------------------------------
# Fetching
# ---------------------------------------------------------------------------

def fetch_with_requests(url: str, timeout: int = 20) -> str | None:
    try:
        session = requests.Session()
        resp = session.get(url, headers=REQUEST_HEADERS, timeout=timeout, allow_redirects=True)
        resp.raise_for_status()
        return resp.text
    except requests.RequestException as exc:
        print(f"  [requests] Failed: {exc}")
        return None


def fetch_with_selenium(url: str, wait_seconds: int = 6) -> str | None:
    if not HAS_SELENIUM:
        print("  [selenium] Not installed. Run: pip install selenium")
        return None
    print("  [selenium] Launching headless Chrome...")
    opts = ChromeOptions()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1280,900")
    opts.add_argument(f"user-agent={REQUEST_HEADERS['User-Agent']}")
    driver = None
    try:
        driver = webdriver.Chrome(options=opts)
        driver.get(url)
        WebDriverWait(driver, wait_seconds).until(
            lambda d: len(d.find_element("tag name", "body").text.strip()) > 200
        )
        time.sleep(1)
        return driver.page_source
    except Exception as exc:
        print(f"  [selenium] Failed: {exc}")
        return None
    finally:
        if driver:
            driver.quit()


def looks_js_rendered(html: str) -> bool:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(NOISE_TAGS):
        tag.decompose()
    text = soup.get_text(" ", strip=True)
    return len(text.split()) < JS_DETECTION_THRESHOLD


def get_page_html(url: str) -> str | None:
    print(f"  Fetching: {url}")
    html = fetch_with_requests(url)
    if html is None:
        print("  requests fetch failed -> trying Selenium...")
        return fetch_with_selenium(url)
    if looks_js_rendered(html):
        print("  Content looks JS-rendered (too sparse) -> trying Selenium...")
        selenium_html = fetch_with_selenium(url)
        if selenium_html:
            return selenium_html
        print("  Selenium also failed; proceeding with requests output.")
    return html


# ---------------------------------------------------------------------------
# Sitemap Discovery
# ---------------------------------------------------------------------------

def find_sitemap_urls(base_url: str) -> list[str]:
    """
    Locate sitemap(s) for a domain by checking robots.txt first, then the
    conventional /sitemap.xml path. Returns a list of sitemap URLs.
    """
    parsed = urlparse(base_url)
    root = f"{parsed.scheme or 'https'}://{parsed.netloc or parsed.path}"
    candidates: list[str] = []

    robots_url = urljoin(root, "/robots.txt")
    try:
        resp = requests.get(robots_url, headers=REQUEST_HEADERS, timeout=10)
        if resp.ok:
            for line in resp.text.splitlines():
                if line.lower().startswith("sitemap:"):
                    candidates.append(line.split(":", 1)[1].strip())
    except requests.RequestException:
        pass

    if not candidates:
        candidates.append(urljoin(root, "/sitemap.xml"))

    return candidates


def parse_sitemap(sitemap_url: str, seen: set[str] | None = None) -> list[str]:
    """
    Fetch and parse a sitemap.xml, recursing into sitemap indexes.
    Returns a flat list of page URLs.
    """
    if seen is None:
        seen = set()
    if sitemap_url in seen:
        return []
    seen.add(sitemap_url)

    urls: list[str] = []
    try:
        resp = requests.get(sitemap_url, headers=REQUEST_HEADERS, timeout=15)
        resp.raise_for_status()
    except requests.RequestException as exc:
        print(f"  [sitemap] Failed to fetch {sitemap_url}: {exc}")
        return urls

    soup = BeautifulSoup(resp.text, "xml")

    # Sitemap index: contains <sitemap><loc>...</loc></sitemap>
    sub_sitemaps = soup.find_all("sitemap")
    if sub_sitemaps:
        for sm in sub_sitemaps:
            loc = sm.find("loc")
            if loc and loc.text.strip():
                urls.extend(parse_sitemap(loc.text.strip(), seen))
        return urls

    # Regular sitemap: contains <url><loc>...</loc></url>
    for loc in soup.find_all("loc"):
        text = loc.get_text(strip=True)
        if text:
            urls.append(text)

    return urls


def discover_urls_from_sitemap(start_url: str) -> list[str]:
    """Given any URL on a site, find and expand its sitemap(s) into page URLs."""
    all_urls: list[str] = []
    for sitemap_url in find_sitemap_urls(start_url):
        print(f"  [sitemap] Parsing {sitemap_url}")
        found = parse_sitemap(sitemap_url)
        print(f"  [sitemap] {len(found)} URL(s) found")
        all_urls.extend(found)
    seen = set()
    deduped = []
    for u in all_urls:
        if u not in seen:
            seen.add(u)
            deduped.append(u)
    return deduped


# ---------------------------------------------------------------------------
# Content Extraction
# ---------------------------------------------------------------------------

def remove_noise(soup: BeautifulSoup) -> None:
    for tag in soup(NOISE_TAGS):
        tag.decompose()
    noise_patterns = re.compile(
        r"(nav|navbar|header|footer|sidebar|breadcrumb|cookie|banner|"
        r"popup|modal|menu|ad[-_]|advertisement|social|share|related|"
        r"recommend|comment|signup|subscribe|newsletter|promo|cta)",
        re.I,
    )
    for tag in soup.find_all(True):
        if not isinstance(tag, Tag) or tag.attrs is None:
            continue
        classes = " ".join(tag.attrs.get("class") or [])
        tag_id = tag.attrs.get("id") or ""
        if noise_patterns.search(classes) or noise_patterns.search(tag_id):
            tag.decompose()


def find_main_content(soup: BeautifulSoup) -> Tag | None:
    for selector in ARTICLE_SELECTORS:
        candidates = soup.select(selector)
        if not candidates:
            continue
        best = max(candidates, key=lambda t: len(t.get_text()))
        if len(best.get_text(strip=True)) > 100:
            return best
    return None


# ---------------------------------------------------------------------------
# Schema (JSON-LD) Extraction
# ---------------------------------------------------------------------------

def extract_schema(soup: BeautifulSoup) -> list[dict]:
    """
    Extract all JSON-LD structured data blocks (schema.org markup).
    Must be called before remove_noise(), since that deletes <script> tags.
    """
    schemas = []
    for script in soup.find_all("script", type="application/ld+json"):
        raw = script.string or script.get_text()
        if not raw or not raw.strip():
            continue
        try:
            data = json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            continue
        if isinstance(data, list):
            schemas.extend(d for d in data if isinstance(d, dict))
        elif isinstance(data, dict):
            schemas.append(data)
    return schemas


# ---------------------------------------------------------------------------
# Tags / Categories Extraction
# ---------------------------------------------------------------------------

def extract_tags(soup: BeautifulSoup) -> list[str]:
    tags: list[str] = []

    for meta in soup.find_all("meta", property="article:tag"):
        content = meta.get("content", "").strip()
        if content:
            tags.append(content)

    keywords_meta = soup.find("meta", attrs={"name": "keywords"})
    if keywords_meta and keywords_meta.get("content"):
        tags.extend(k.strip() for k in keywords_meta["content"].split(",") if k.strip())

    for a in soup.find_all("a", rel="tag"):
        text = a.get_text(strip=True)
        if text:
            tags.append(text)

    tag_class_pattern = re.compile(r"(?:^|[\s_-])(tag|category|categories)(?:[\s_-]|$)", re.I)
    for el in soup.select("[class]"):
        classes = " ".join(el.attrs.get("class") or [])
        if tag_class_pattern.search(classes):
            text = el.get_text(strip=True)
            if text and len(text) < 40:
                tags.append(text)

    seen = set()
    deduped = []
    for t in tags:
        key = t.lower()
        if key not in seen:
            seen.add(key)
            deduped.append(t)
    return deduped


# ---------------------------------------------------------------------------
# Metadata Extraction
# ---------------------------------------------------------------------------

def extract_metadata(soup: BeautifulSoup, url: str) -> dict:
    meta = {"url": url}

    og_title = soup.find("meta", property="og:title")
    if og_title and og_title.get("content"):
        meta["title"] = og_title["content"].strip()
    elif soup.title:
        meta["title"] = soup.title.get_text(strip=True)
    else:
        meta["title"] = urlparse(url).path.strip("/").split("/")[-1].replace("-", " ").title() or "Home"

    og_desc = soup.find("meta", property="og:description")
    meta_desc = soup.find("meta", attrs={"name": "description"})
    if og_desc and og_desc.get("content"):
        meta["description"] = og_desc["content"].strip()
    elif meta_desc and meta_desc.get("content"):
        meta["description"] = meta_desc["content"].strip()

    canonical = soup.find("link", rel="canonical")
    if canonical and canonical.get("href"):
        meta["canonical"] = canonical["href"].strip()

    og_type = soup.find("meta", property="og:type")
    if og_type and og_type.get("content"):
        meta["og_type"] = og_type["content"].strip()

    robots = soup.find("meta", attrs={"name": "robots"})
    if robots and robots.get("content"):
        meta["robots"] = robots["content"].strip()

    for prop in ("article:published_time", "datePublished", "article:modified_time"):
        tag = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
        if tag and tag.get("content"):
            meta["date"] = tag["content"][:10]
            break

    meta["schema"] = extract_schema(soup)
    meta["tags"] = extract_tags(soup)

    return meta


# ---------------------------------------------------------------------------
# Built-in HTML to Markdown fallback
# ---------------------------------------------------------------------------

def _inline_text(element: Tag | NavigableString) -> str:
    if isinstance(element, NavigableString):
        return str(element)
    if element.name in ("strong", "b"):
        return f"**{_inline_text_children(element)}**"
    if element.name in ("em", "i"):
        return f"*{_inline_text_children(element)}*"
    if element.name == "code":
        return f"`{element.get_text()}`"
    if element.name == "a":
        href = element.get("href", "")
        return f"[{_inline_text_children(element)}]({href})"
    return _inline_text_children(element)


def _inline_text_children(tag: Tag) -> str:
    return "".join(_inline_text(child) for child in tag.children)


def _convert_tag(tag: Tag) -> str:
    name = tag.name
    if name in ("h1", "h2", "h3", "h4", "h5", "h6"):
        level = int(name[1])
        return f"\n\n{'#' * level} {_inline_text_children(tag).strip()}\n\n"
    if name == "p":
        return f"\n\n{_inline_text_children(tag).strip()}\n\n"
    if name in ("ul", "ol"):
        items = []
        for i, li in enumerate(tag.find_all("li", recursive=False), start=1):
            bullet = f"{i}." if name == "ol" else "-"
            items.append(f"{bullet} {_inline_text_children(li).strip()}")
        return "\n\n" + "\n".join(items) + "\n\n"
    if name == "blockquote":
        lines = _inline_text_children(tag).strip().splitlines()
        return "\n\n" + "\n".join(f"> {l}" for l in lines) + "\n\n"
    if name == "pre":
        code = tag.get_text()
        return f"\n\n```\n{code}\n```\n\n"
    if name == "hr":
        return "\n\n---\n\n"
    if name == "table":
        rows = []
        for tr in tag.find_all("tr"):
            cells = [c.get_text().strip() for c in tr.find_all(["th", "td"])]
            if cells:
                rows.append("| " + " | ".join(cells) + " |")
        if rows:
            header_sep = "| " + " | ".join(["---"] * len(tag.find_all("tr")[0].find_all(["th", "td"]))) + " |"
            if len(rows) > 1:
                return "\n\n" + rows[0] + "\n" + header_sep + "\n" + "\n".join(rows[1:]) + "\n\n"
            return "\n\n" + rows[0] + "\n\n"
        return ""
    return _inline_text_children(tag)


def convert_element(tag: Tag) -> str:
    chunks = []
    for child in tag.children:
        if isinstance(child, Tag):
            chunks.append(_convert_tag(child))
        elif isinstance(child, NavigableString):
            txt = str(child).strip()
            if txt:
                chunks.append(f"\n\n{txt}\n\n")
    return "".join(chunks)


def html_to_markdown(html: str, url: str) -> tuple[dict, str]:
    soup = BeautifulSoup(html, "html.parser")
    meta = extract_metadata(soup, url)

    if HAS_MARKDOWNIFY:
        remove_noise(soup)
        content_tag = find_main_content(soup) or soup.body or soup
        body = _markdownify(
            str(content_tag),
            heading_style="ATX",
            strip=["script", "style", "nav", "header", "footer",
                   "noscript", "svg", "canvas", "iframe"],
        )
    else:
        remove_noise(soup)
        content_tag = find_main_content(soup) or soup.body or soup
        body = convert_element(content_tag)

    body = re.sub(r"\n{3,}", "\n\n", body).strip()
    return meta, body


# ---------------------------------------------------------------------------
# Output & File Helpers
# ---------------------------------------------------------------------------

def build_frontmatter(meta: dict) -> str:
    lines = ["---"]
    for key in ("title", "url", "canonical", "date", "og_type", "robots", "description"):
        if meta.get(key):
            value = str(meta[key]).replace('"', '\\"')
            lines.append(f'{key}: "{value}"')
    if meta.get("tags"):
        lines.append("tags:")
        for t in meta["tags"]:
            lines.append(f'  - "{t}"')
    lines.append("---")
    return "\n".join(lines)


def url_to_filename(url: str, ext: str = ".md") -> str:
    parsed = urlparse(url)
    path = parsed.path.strip("/") or parsed.netloc
    safe = re.sub(r"[^\w\-]", "-", path)
    safe = re.sub(r"-{2,}", "-", safe).strip("-")
    return (safe[:120] or "index") + ext


def save_markdown(meta: dict, body: str, output_dir: str) -> str:
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, url_to_filename(meta["url"]))
    frontmatter = build_frontmatter(meta)
    content = f"{frontmatter}\n\n# {meta.get('title', '')}\n\n{body}\n"
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    if meta.get("schema"):
        schema_path = os.path.join(output_dir, url_to_filename(meta["url"], ".schema.json"))
        with open(schema_path, "w", encoding="utf-8") as f:
            json.dump(meta["schema"], f, indent=2)

    return filepath


def save_meta_json(meta: dict, output_dir: str) -> str:
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, url_to_filename(meta["url"], ".meta.json"))
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    return filepath


def scrape(url: str, output_dir: str, meta_only: bool = False) -> bool:
    print(f"\n[scraping] {url}")
    html = get_page_html(url)
    if not html:
        print(f"  ERROR: Could not retrieve HTML for {url}")
        return False

    meta, body = html_to_markdown(html, url)

    if meta_only:
        filepath = save_meta_json(meta, output_dir)
        print(f"  Saved metadata -> {filepath}")
        return True

    if not body.strip():
        print("  WARNING: Extracted body is empty -> page may require JS rendering.")

    filepath = save_markdown(meta, body, output_dir)
    print(f"  Saved -> {filepath}  ({len(body.split())} words, "
          f"{len(meta.get('tags', []))} tags, {len(meta.get('schema', []))} schema block(s))")
    return True


def main():
    parser = argparse.ArgumentParser(description="Scrape pages: content, meta, schema, tags, sitemap.")
    parser.add_argument("urls", nargs="*", help="One or more URLs to scrape.")
    parser.add_argument("--file", "-f", metavar="FILE", help="Text file, one URL per line.")
    parser.add_argument("--output", "-o", default="./scraped_output", help="Output directory.")
    parser.add_argument("--sitemap", action="store_true",
                         help="Treat given URL(s) as site roots and discover pages via sitemap.xml.")
    parser.add_argument("--meta-only", action="store_true",
                         help="Only extract title/description/schema/tags - skip content, write JSON.")
    args = parser.parse_args()

    urls: list[str] = list(args.urls)
    if args.file:
        with open(args.file, encoding="utf-8") as f:
            urls.extend(line.strip() for line in f if line.strip() and not line.startswith("#"))

    if not urls:
        parser.print_help()
        sys.exit(1)

    if args.sitemap:
        expanded = []
        for u in urls:
            expanded.extend(discover_urls_from_sitemap(u))
        urls = expanded
        print(f"\n[sitemap] Total URLs discovered: {len(urls)}")

    print(f"\nScraper starting - {len(urls)} URL(s) -> output dir: {args.output}")
    success = sum(scrape(u, args.output, meta_only=args.meta_only) for u in urls)
    print(f"\nDone: {success}/{len(urls)} pages scraped successfully.")


if __name__ == "__main__":
    main()
