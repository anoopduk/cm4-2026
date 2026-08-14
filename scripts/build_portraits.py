#!/usr/bin/env python3
"""Build local, optimized CM4 portrait assets from approved public profile sources.

Output: 480x600 WebP portraits + QA contact sheet/report.
The public site is not edited by this script; QA is deliberately separate.
"""
from __future__ import annotations

import io
import json
import math
import os
import re
import sys
import time
import unicodedata
from pathlib import Path
from urllib.parse import urljoin, urlparse

import cv2
import numpy as np
import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "people"
QA = ROOT / "portrait-qa"
OUT.mkdir(parents=True, exist_ok=True)
QA.mkdir(parents=True, exist_ok=True)

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36 CM4-portrait-builder/1.0"
S = requests.Session()
S.headers.update({"User-Agent": UA, "Accept-Language": "en-US,en;q=0.8"})
TIMEOUT = 28

# Source list follows the CM4_Photo_Links master plus official/current profile pages
# already used by the approved CM4 site. Direct image URLs are preferred only where
# they are known and stable; otherwise the profile page is inspected automatically.
PEOPLE = [
    # Participants
    dict(name="Rajeev Ahuja", slug="rajeev-ahuja", page="https://www.iitrpr.ac.in/physics/p/research.html?cat=9&id=74", image="https://www.iitrpr.ac.in/physics/Faculties/Asset/faculty/R%20ahuja.jpg"),
    dict(name="Deb Ranjan Banerjee", slug="deb-ranjan-banerjee", page="https://nitdgp.ac.in/department/chemistry/faculty-5/deb-ranjan-banerjee", image="https://nitdgp.ac.in/uploads/b77cdfcaacdd50f9104bb9d2f38594e3.jpg"),
    dict(name="Aditi Chandrasekhar", slug="aditi-chandrasekhar", page="https://azimpremjiuniversity.edu.in/people/aditi-chandrasekar", image="https://azimpremjiuniversity.edu.in/imager/people/1602810/AC-photo-2_786b641626ddc7a93ab09ebb0fe5bad7_1757572993.jpg"),
    dict(name="Peter Comba", slug="peter-comba", page="https://www.uni-heidelberg.de/fakultaeten/chemgeo/aci/comba/comba.html", image="https://www.uni-heidelberg.de/md/aci/comba/comba_peter_21.jpg"),
    dict(name="Étienne Derat", slug="etienne-derat", page="https://ipcm.fr/recherche/presentation-equipe-maco/composition-equipe-maco/etienne-derat/", image="https://ipcm.fr/wp-content/uploads/2023/02/photoED-e1697451964931.png"),
    dict(name="Odile Eisenstein", slug="odile-eisenstein", page="https://www.icgm.fr/odile-eisenstein/", alt="https://www.icgm.fr/en/odile-eisenstein-2/"),
    dict(name="Sagar Ghorai", slug="sagar-ghorai", page="https://www.icredd.hokudai.ac.jp/ghorai-sagar", image="https://www.icredd.hokudai.ac.jp/wp/wp-content/uploads/2023/09/GHORAI_profile_square-320x320.jpg"),
    dict(name="Subhas Ghosal", slug="subhas-ghosal", page="https://nitdgp.ac.in/department/chemistry/faculty-5/subhas-ghosal", image="https://nitdgp.ac.in/uploads/70e4c6204e8443d15d6d64767f9aebde.jpg"),
    dict(name="E. D. Jemmis", slug="ed-jemmis", page="https://ipc.iisc.ac.in/edj.php", image="https://ipc.iisc.ac.in/includes/images/faculty/edj/edj_full.jpg"),
    dict(name="Milan Kumar Jena", slug="milan-kumar-jena", page="https://www.iitbhilai.ac.in/index.php/index.php?pid=profile_milanjena"),
    dict(name="B. Kiran", slug="b-kiran", page="https://www.mcneese.edu/engineering-and-sciences/directory/kiran-boggavarapu-ph-d/", alt="https://ipc.iisc.ac.in/~edj/pages/members.html"),
    dict(name="Sandeep Kumar", slug="sandeep-kumar", page="https://ipc.iisc.ac.in/~edj/pages/members.html"),
    dict(name="Arup Mahata", slug="arup-mahata", page="https://iith.ac.in/chy/arup/", image="https://iith.ac.in/assets/images/profiles/Arup-Mahata.jpg"),
    dict(name="Satoshi Maeda", slug="satoshi-maeda", page="https://www.icredd.hokudai.ac.jp/maeda-satoshi", image="https://www.icredd.hokudai.ac.jp/wp/wp-content/uploads/2019/06/Maeda-e1571802614279-320x320.jpeg"),
    dict(name="Sabyasachi Mishra", slug="sabyasachi-mishra", page="https://ccds.iitkgp.ac.in/people.php"),
    dict(name="T. Pradeep", slug="t-pradeep", page="https://chem.iitm.ac.in/faculty/pradeep"),
    dict(name="Sai G. Ramesh", slug="sai-g-ramesh", page="https://ipc.iisc.ac.in/sgr.php"),
    dict(name="N. Satyamurthy", slug="n-satyamurthy", page="https://www.iisermohali.ac.in/faculty/dcs/nsath"),
    dict(name="Henry F. Schaefer III", slug="henry-f-schaefer-iii", page="https://www.chem.uga.edu/directory/people/henry-schaefer"),
    dict(name="Sason Shaik", slug="sason-shaik", page="https://yfaat.ch.huji.ac.il/sason/"),
    dict(name="A. Sirohiwal", slug="a-sirohiwal", page="https://ipc.iisc.ac.in/as.php"),
    dict(name="R. B. Sunoj", slug="rb-sunoj", page="https://www.chem.iitb.ac.in/~sunoj/prof.html"),
    dict(name="R. S. Swathi", slug="rs-swathi", page="https://www.iisertvm.ac.in/faculty/swathi/"),
    dict(name="Soujanya Yarasi", slug="soujanya-yarasi", page="https://pubs.acs.org/doi/10.1021/acs.jpcc.5b08043"),

    # Organising committee
    dict(name="Anoop Ayyappan", slug="anoop-ayyappan", page="https://duk.ac.in/personnel/anoop-ayyappan/", image="https://duk.ac.in/data/2025/01/anoop-1024x1024.png"),
    dict(name="Manoj Kumar T. K.", slug="manoj-kumar-tk", page="https://duk.ac.in/personnel/manoj-kumar-t-k/", image="https://duk.ac.in/data/2024/04/Manoj-Kumar-T-K.jpg"),
    dict(name="Sherin D. R.", slug="sherin-dr", page="https://duk.ac.in/personnel/sherin-d-r/", image="https://duk.ac.in/data/2024/04/Sherin-D-R-1.jpg"),
    dict(name="Susmita De", slug="susmita-de", page="https://chemistry.uoc.ac.in/CCMSwebpage/CCMS.html"),
    dict(name="C. H. Suresh", slug="ch-suresh", page="https://sribs.res.in/dr-suresh-c-h/", alt="https://www.niist.res.in/drsuresh-c-h"),
    dict(name="Mahesh Hariharan", slug="mahesh-hariharan", page="https://www.iisertvm.ac.in/faculty/mahesh/", alt="https://www.iisertvm.ac.in/pages/deputy-director"),

    # Academic committee; P. N. V. Pavankumar intentionally remains initials-only
    dict(name="Bharatam V. Prasad", slug="bharatam-v-prasad", page="https://www.niper.gov.in/faculty/prof-p-v-bharatam"),
    dict(name="G. Narahari Sastry", slug="g-narahari-sastry", page="https://www.neist.res.in/gnsastry/contact.html", alt="https://ipc.iisc.ac.in/~edj/pages/members.html"),
    # Govindan Subramanian is pre-seeded from the photo he supplied by email.
    dict(name="G. Subramanian", slug="govindan-subramanian", local=True),
    dict(name="Ashwini Kr. Phukan", slug="ashwini-kr-phukan", page="https://www.tezu.ernet.in/dcs/faculty/12"),
    dict(name="Jayasree E. G.", slug="jayasree-eg", page="https://chem.cusat.ac.in/facultyhome.html"),
    dict(name="Pancharatna P. D.", slug="pancharatna-pd", page="https://www.amrita.edu/faculty/pd-pancharatna/", alt="https://www.amrita.edu/program/ph-d-in-chemistry/"),
    dict(name="P. Parameswaran", slug="p-parameswaran", page="https://nitc.ac.in/department/chemistry/faculty-and-staff/faculty"),
    dict(name="D. L. V. K. Prasad", slug="dlvk-prasad", page="https://www.iitk.ac.in/d-l-v-k-prasad"),
    dict(name="Biswarup Pathak", slug="biswarup-pathak", page="https://people.iiti.ac.in/~biswarup/"),
    dict(name="Dandamudi Usharani", slug="dandamudi-usharani", page="https://cftri.res.in/Profile/2370.pdf"),
    dict(name="Dibyendu Mallick", slug="dibyendu-mallick", page="https://presiuniv.ac.in/web/staff.php?staffid=420"),
    dict(name="Priyakumari C. P.", slug="priyakumari-cp", page="https://web.iisermohali.ac.in/dept/dcs/index.php/faculty-and-staff/faculty-cpp"),
    dict(name="Naiwrit Karmodak", slug="naiwrit-karmodak", page="https://snu.edu.in/faculty/naiwrit-karmodak/"),
]

BAD_WORDS = ("logo", "icon", "favicon", "banner", "header", "footer", "sprite", "bg", "background", "seal", "crest", "placeholder", "loader", "arrow", "social", "facebook", "twitter", "linkedin", "youtube", "qr", "map")


def asciifold(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c)).lower()


def name_tokens(name: str):
    return [t for t in re.findall(r"[a-z]{3,}", asciifold(name)) if t not in {"prof", "doctor", "iii"}]


def get(url: str, referer: str | None = None):
    headers = {"Referer": referer} if referer else None
    return S.get(url, timeout=TIMEOUT, allow_redirects=True, headers=headers)


def load_image_bytes(url: str, referer: str | None = None):
    try:
        r = get(url, referer)
        r.raise_for_status()
        if len(r.content) < 1200:
            return None
        im = Image.open(io.BytesIO(r.content))
        im = ImageOps.exif_transpose(im).convert("RGB")
        if min(im.size) < 100:
            return None
        return im
    except Exception:
        return None


def pdf_candidates(url: str):
    # Some official profiles are PDFs. Render first two pages if PyMuPDF is available.
    try:
        import fitz
        r = get(url)
        r.raise_for_status()
        doc = fitz.open(stream=r.content, filetype="pdf")
        out = []
        for pageno in range(min(2, len(doc))):
            pix = doc[pageno].get_pixmap(matrix=fitz.Matrix(1.7, 1.7), alpha=False)
            out.append((f"{url}#page={pageno+1}", Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB"), 5))
        return out
    except Exception:
        return []


def page_candidates(page_url: str, name: str):
    if page_url.lower().endswith(".pdf"):
        return pdf_candidates(page_url)
    try:
        r = get(page_url)
        r.raise_for_status()
    except Exception:
        return []
    soup = BeautifulSoup(r.text, "html.parser")
    toks = name_tokens(name)
    cands = []
    seen = set()

    def add(u, score, label=""):
        if not u:
            return
        u = urljoin(r.url, u.strip())
        if not u.startswith(("http://", "https://")) or u in seen:
            return
        lo = asciifold(u + " " + label)
        if any(x in lo for x in BAD_WORDS):
            score -= 80
        score += 22 * sum(t in lo for t in toks)
        ext = urlparse(u).path.lower()
        if ext.endswith((".jpg", ".jpeg", ".png", ".webp")):
            score += 18
        if ext.endswith((".svg", ".gif")):
            score -= 60
        seen.add(u)
        cands.append((score, u))

    for prop, base in [("og:image", 80), ("twitter:image", 70), ("twitter:image:src", 70)]:
        tag = soup.find("meta", attrs={"property": prop}) or soup.find("meta", attrs={"name": prop})
        if tag:
            add(tag.get("content"), base, prop)
    for tag in soup.find_all("img"):
        label = " ".join(str(tag.get(k, "")) for k in ("alt", "title", "class", "id"))
        base = 10
        try:
            w, h = int(tag.get("width", 0)), int(tag.get("height", 0))
            if w >= 180 and h >= 180:
                base += 18
        except Exception:
            pass
        for attr in ("src", "data-src", "data-lazy-src", "data-original"):
            add(tag.get(attr), base, label)
        srcset = tag.get("srcset") or tag.get("data-srcset")
        if srcset:
            for piece in srcset.split(","):
                add(piece.strip().split()[0], base + 5, label)
    cands.sort(reverse=True)
    return cands[:35]


CASCADE = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")


def faces(im: Image.Image):
    arr = np.asarray(im)
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
    gray = cv2.equalizeHist(gray)
    det = CASCADE.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=4, minSize=(45, 45))
    return [tuple(map(int, x)) for x in det]


def candidate_score(im: Image.Image, metadata_score=0):
    W, H = im.size
    fs = faces(im)
    score = metadata_score + min(30, math.log(max(W*H, 1), 2) - 15)
    if fs:
        best = max(fs, key=lambda b: b[2] * b[3])
        area = best[2] * best[3] / (W * H)
        score += 180 + min(90, area * 500)
        if len(fs) == 1:
            score += 25
    else:
        # A portrait-shaped large image can still be useful if Haar misses spectacles/profile view.
        ratio = W / H
        if 0.55 <= ratio <= 1.15 and min(W, H) >= 250:
            score += 35
    return score, fs


def choose_source(person):
    name = person["name"]
    attempts = []
    if person.get("image"):
        im = load_image_bytes(person["image"], person.get("page"))
        if im:
            sc, fs = candidate_score(im, 120)
            attempts.append((sc, person["image"], im, fs))
    for page_key in ("page", "alt"):
        page = person.get(page_key)
        if not page:
            continue
        if page.lower().endswith(".pdf"):
            for u, im, ms in pdf_candidates(page):
                sc, fs = candidate_score(im, ms)
                attempts.append((sc, u, im, fs))
            continue
        for ms, u in page_candidates(page, name):
            im = load_image_bytes(u, page)
            if not im:
                continue
            sc, fs = candidate_score(im, ms)
            attempts.append((sc, u, im, fs))
            # Stop early only for a very clear single-face/name match.
            if sc >= 260 and fs:
                break
    if not attempts:
        return None
    attempts.sort(key=lambda x: x[0], reverse=True)
    return attempts[0]


def crop_face(im: Image.Image, fs):
    W, H = im.size
    if fs:
        x, y, w, h = max(fs, key=lambda b: b[2]*b[3])
        # Aim for head + upper shoulders, with more space below the face than above.
        crop_h = min(H, max(h * 3.05, 0.56 * min(H, W / 0.8)))
        crop_w = crop_h * 0.8
        if crop_w > W:
            crop_w = W
            crop_h = crop_w / 0.8
        cx = x + w / 2
        cy = y + h * 1.05
        left = cx - crop_w / 2
        top = cy - crop_h / 2
        left = max(0, min(W - crop_w, left))
        top = max(0, min(H - crop_h, top))
        box = (int(left), int(top), int(left + crop_w), int(top + crop_h))
        cr = im.crop(box)
    else:
        cr = ImageOps.fit(im, (800, 1000), method=Image.Resampling.LANCZOS, centering=(0.5, 0.38))
    return ImageOps.fit(cr, (480, 600), method=Image.Resampling.LANCZOS, centering=(0.5, 0.42))


def save_webp(im: Image.Image, path: Path):
    for q in (82, 78, 74, 70):
        im.save(path, "WEBP", quality=q, method=6)
        if path.stat().st_size <= 85_000:
            break


def main():
    report = []
    for i, p in enumerate(PEOPLE, 1):
        dest = OUT / f"{p['slug']}.webp"
        print(f"[{i:02d}/{len(PEOPLE)}] {p['name']}", flush=True)
        if p.get("local"):
            ok = dest.exists()
            report.append(dict(name=p["name"], slug=p["slug"], status="preseeded" if ok else "missing-preseed", file=str(dest.relative_to(ROOT)) if ok else None))
            continue
        chosen = choose_source(p)
        if not chosen:
            report.append(dict(name=p["name"], slug=p["slug"], status="failed", reason="no usable image"))
            continue
        score, source, im, fs = chosen
        out = crop_face(im, fs)
        save_webp(out, dest)
        report.append(dict(name=p["name"], slug=p["slug"], status="ok", source=source, source_size=list(im.size), faces=[list(x) for x in fs], score=round(float(score), 2), bytes=dest.stat().st_size, file=str(dest.relative_to(ROOT))))
        time.sleep(0.08)

    (QA / "report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    (QA / "report.txt").write_text("\n".join(f"{r['status']:<15} {r['name']:<26} {r.get('source','')}" for r in report), encoding="utf-8")

    # Contact sheet: local files only, intentionally easy to inspect before publishing.
    thumbs = []
    for p in PEOPLE:
        f = OUT / f"{p['slug']}.webp"
        if f.exists():
            thumbs.append((p["name"], Image.open(f).convert("RGB")))
    cols = 6
    tw, th, label_h = 144, 180, 38
    rows = math.ceil(len(thumbs) / cols)
    sheet = Image.new("RGB", (cols * tw, rows * (th + label_h)), "white")
    d = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    for idx, (name, im) in enumerate(thumbs):
        x = (idx % cols) * tw
        y = (idx // cols) * (th + label_h)
        sheet.paste(im.resize((tw, th), Image.Resampling.LANCZOS), (x, y))
        words = name.split()
        line1, line2 = "", ""
        for word in words:
            if len((line1 + " " + word).strip()) <= 20:
                line1 = (line1 + " " + word).strip()
            else:
                line2 = (line2 + " " + word).strip()
        d.text((x + 4, y + th + 4), line1, fill="black", font=font)
        if line2:
            d.text((x + 4, y + th + 18), line2[:22], fill="black", font=font)
    sheet.save(QA / "contact-sheet.jpg", quality=88, optimize=True)

    ok = sum(r["status"] in ("ok", "preseeded") for r in report)
    failed = [r["name"] for r in report if r["status"] not in ("ok", "preseeded")]
    print(f"Built {ok}/{len(report)} portraits. Failed: {failed}")
    # Don't fail the workflow for a few unavailable portraits: QA decides what goes live.
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
