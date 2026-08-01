# -*- coding: utf-8 -*-
"""Mark every editable element in the site HTML so the CMS can find it.

Only ADDS attributes (data-cms / data-cms-img / data-cms-icon) inside existing
start tags. It never moves, wraps or removes markup, so the rendered design is
byte-for-byte identical apart from the new attributes. Safe to re-run: elements
that already carry an id keep it, and the numbering stays stable as long as the
document structure does not change.

Run from the repository root:  python scripts/cms_annotate.py
"""
import io
import json
import os
import re
from html.parser import HTMLParser

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr", "path", "circle", "rect",
        "line", "polygon", "polyline", "ellipse", "stop", "use"}

# Elements whose text the owner may want to edit.
TEXT_TAGS = {"h1", "h2", "h3", "h4", "h5", "p", "li", "blockquote", "figcaption",
             "td", "th", "button", "a", "strong", "span", "small", "label", "summary"}

# Children allowed inside an element that is edited as raw inner HTML.
INLINE_OK = {"em", "strong", "b", "i", "u", "small", "sup", "sub", "br", "span"}

SKIP_CLASS = re.compile(r"\b(cursor-dot|cursor-ring|scroll-progress|wa-float|skip-link)\b")
HIGHLIGHT = re.compile(r"<(em|span)(\s+class=\"section-title-accent\")?\s*>(.*?)</\1>", re.S)


class Node:
    __slots__ = ("tag", "attrs", "raw", "start", "tag_end", "inner_end",
                 "children", "first_text", "first_text_end", "has_text")

    def __init__(self, tag, attrs, raw, start, tag_end):
        self.tag = tag
        self.attrs = dict(attrs)
        self.raw = raw
        self.start = start
        self.tag_end = tag_end
        self.inner_end = None
        self.children = []
        self.first_text = None       # leading text run, before any child element
        self.first_text_end = None
        self.has_text = False


class Walker(HTMLParser):
    def __init__(self, src):
        super().__init__(convert_charrefs=False)
        self.src = src
        starts = [0]
        for i, ch in enumerate(src):
            if ch == "\n":
                starts.append(i + 1)
        self.line_starts = starts
        self.stack = []
        self.done = []          # closed nodes, in closing order
        self.raw_depth = 0      # inside <script>/<style>
        self.svg_root = None    # outermost <svg> node while inside one

    def pos(self):
        line, col = self.getpos()
        return self.line_starts[line - 1] + col

    # -- tags ---------------------------------------------------------------
    def handle_starttag(self, tag, attrs):
        start = self.pos()
        raw = self.get_starttag_text() or ""
        node = Node(tag, attrs, raw, start, start + len(raw))
        if self.stack:
            self.stack[-1].children.append(node)
        if tag in ("script", "style"):
            self.raw_depth += 1
        if tag == "svg" and self.svg_root is None:
            self.svg_root = node
        if tag in VOID:
            node.inner_end = node.tag_end
            self.done.append(node)
            return
        self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        start = self.pos()
        raw = self.get_starttag_text() or ""
        node = Node(tag, attrs, raw, start, start + len(raw))
        node.inner_end = node.tag_end
        if self.stack:
            self.stack[-1].children.append(node)
        self.done.append(node)

    def handle_endtag(self, tag):
        end = self.pos()
        if tag in ("script", "style"):
            self.raw_depth = max(0, self.raw_depth - 1)
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i].tag == tag:
                for node in self.stack[i:]:
                    if node.inner_end is None:
                        node.inner_end = end
                    self.done.append(node)
                if self.svg_root is not None and self.svg_root in self.stack[i:]:
                    self.svg_root = None
                del self.stack[i:]
                return

    def handle_data(self, data):
        if self.raw_depth or not self.stack:
            return
        parent = self.stack[-1]
        if data.strip():
            parent.has_text = True
            if not parent.children and parent.first_text is None:
                parent.first_text = data
                parent.first_text_end = self.pos() + len(data)

    def handle_entityref(self, name):
        self.handle_data("&%s;" % name)

    def handle_charref(self, name):
        self.handle_data("&#%s;" % name)


def label_of(html):
    """Plain-text preview of an inner-HTML value."""
    text = re.sub(r"<[^>]+>", "", html)
    text = re.sub(r"\s+", " ", text).strip()
    return text


STRIP = re.compile(r' data-cms(?:-img|-icon)?="\d+"')


def annotate(path, page_key):
    # Start from a clean slate so re-runs are deterministic and always refresh
    # the stored values.
    src = STRIP.sub("", io.open(path, encoding="utf-8", newline="").read())
    walker = Walker(src)
    walker.feed(src)
    walker.close()

    nodes = sorted(walker.done, key=lambda n: n.start)
    inserts = []          # (offset, text)
    fields, images, icons = {}, {}, {}
    n_text = n_img = n_icon = 0
    group = ""
    taken = []            # inner spans of elements already claimed as text fields

    # Nodes that live inside an <svg> must not be treated as text.
    svg_spans = [(n.start, n.inner_end) for n in nodes if n.tag == "svg"]
    header_spans = [(n.start, n.inner_end) for n in nodes if n.tag == "header"]
    footer_spans = [(n.start, n.inner_end) for n in nodes if n.tag == "footer"]

    def inside(node, spans):
        return any(s < node.start < e for s, e in spans if e)

    def in_svg(node):
        return inside(node, svg_spans)

    def group_for(node):
        if inside(node, header_spans):
            return "الهيدر والقائمة العلوية"
        if inside(node, footer_spans):
            return "التذييل"
        return group or "المقدمة"

    for node in nodes:
        attrs = node.attrs
        cls = attrs.get("class", "") or ""

        if node.tag == "img":
            src_val = attrs.get("src", "")
            if "data-cms-img" in attrs or src_val.startswith("data:") or not src_val:
                continue
            n_img += 1
            key = str(n_img)
            inserts.append((node.tag_end - 1, ' data-cms-img="%s"' % key))
            images[key] = {"src": src_val, "alt": attrs.get("alt", ""), "group": group_for(node)}
            continue

        if node.tag == "svg":
            parent_is_icon = False
            for other in nodes:
                if other.start < node.start and (other.inner_end or 0) > node.inner_end:
                    ocls = other.attrs.get("class", "") or ""
                    if re.search(r"\bicon\b|feature-icon|stat-bg", ocls):
                        parent_is_icon = True
            if not parent_is_icon and "stat-bg" not in cls:
                continue
            if "data-cms-icon" in attrs:
                continue
            inner = src[node.tag_end:node.inner_end]
            if len(inner) > 4000:
                continue
            n_icon += 1
            key = str(n_icon)
            inserts.append((node.tag_end - 1, ' data-cms-icon="%s"' % key))
            icons[key] = {"svg": inner.strip(), "group": group_for(node)}
            continue

        if node.tag not in TEXT_TAGS or "data-cms" in attrs or in_svg(node):
            continue
        if SKIP_CLASS.search(cls) or attrs.get("aria-hidden") == "true":
            continue
        if node.inner_end is None or node.inner_end <= node.tag_end:
            continue
        # Never annotate an element that already sits inside an annotated one:
        # editing the outer element would wipe the inner marker.
        if any(s < node.start < e for s, e in taken):
            continue

        child_tags = {c.tag for c in node.children}
        inner = src[node.tag_end:node.inner_end]

        # A <span> that merely wraps other elements is a layout wrapper, not a
        # text field - prefer annotating the elements inside it.
        if node.tag == "span" and child_tags:
            continue

        if child_tags <= INLINE_OK and node.has_text:
            # Whole inner HTML is safe to replace, as long as the element does
            # not nest another element with the same tag name.
            if node.tag in child_tags:
                continue
            mode, value = "html", inner
        elif node.first_text and node.first_text.strip():
            # Mixed content (text followed by an icon, etc.) - edit the leading run only.
            mode, value = "text", node.first_text
        else:
            continue

        preview = label_of(value)
        if not preview or len(preview) > 1200:
            continue
        if node.tag == "span" and not cls:
            continue

        # A heading opens the section it titles, so it belongs to its own group.
        if node.tag in ("h1", "h2") and not inside(node, header_spans) \
                and not inside(node, footer_spans):
            group = preview[:60]

        taken.append((node.start, node.inner_end))
        n_text += 1
        key = str(n_text)
        inserts.append((node.tag_end - 1, ' data-cms="%s"' % key))
        field = {"tag": node.tag, "mode": mode, "value": value, "group": group_for(node)}
        m = HIGHLIGHT.search(value)
        if m and mode == "html":
            field["hl"] = "<%s%s>" % (m.group(1), m.group(2) or "")
        fields[key] = field

    for offset, text in sorted(inserts, key=lambda x: -x[0]):
        src = src[:offset] + text + src[offset:]

    io.open(path, "w", encoding="utf-8", newline="").write(src)
    return {"fields": fields, "images": images, "icons": icons}


def page_title(rel):
    parts = rel.replace("\\", "/").split("/")
    lang = "en" if parts[0] == "en" else "ar"
    slug = "/".join(p for p in parts if p != "index.html") or "الرئيسية"
    names = {
        "": "الرئيسية", "en": "الرئيسية (EN)", "about": "من نحن", "contact": "تواصل معنا",
        "work": "الأعمال", "blog": "المدونة", "services": "الخدمات",
        "privacy-policy": "سياسة الخصوصية", "terms-of-use": "شروط الاستخدام",
        "download": "تحميل",
    }
    key = parts[1] if lang == "en" and len(parts) > 2 else parts[0]
    base = names.get(key if key != "index.html" else "", slug)
    return ("%s — %s" % (base, "EN" if lang == "en" else "AR")), lang


def main():
    root = os.getcwd()
    skip_dirs = {"%TEMP%", ".git", "node_modules", "web-Portfolio", "admin",
                 "scripts", "static", "images", "assets", "data"}
    skip_files = {"app.html", "portal.html", "login.html", "attachments.html"}
    pages = {}
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in skip_dirs]
        for name in sorted(filenames):
            if not name.endswith(".html") or name in skip_files:
                continue
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, root).replace("\\", "/")
            data = annotate(full, rel)
            title, lang = page_title(rel)
            data["title"] = title
            data["lang"] = lang
            pages[rel] = data
            print("%-46s texts:%-4d images:%-3d icons:%d"
                  % (rel, len(data["fields"]), len(data["images"]), len(data["icons"])))

    os.makedirs("data", exist_ok=True)
    with io.open("data/cms-content.json", "w", encoding="utf-8") as fh:
        json.dump({"version": 1, "pages": pages}, fh, ensure_ascii=False, indent=1)
    total = sum(len(p["fields"]) for p in pages.values())
    print("\n%d pages, %d editable texts written to data/cms-content.json" % (len(pages), total))


if __name__ == "__main__":
    main()
