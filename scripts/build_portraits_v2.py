#!/usr/bin/env python3
"""Parallel QA runner for the CM4 portrait builder."""
from concurrent.futures import ThreadPoolExecutor, as_completed
import json, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

import build_portraits as base

base.TIMEOUT = 9
_orig_candidates = base.page_candidates
base.page_candidates = lambda page, name: _orig_candidates(page, name)[:8]

ROOT, OUT, QA, PEOPLE = base.ROOT, base.OUT, base.QA, base.PEOPLE


def one(p):
    dest = OUT / f"{p['slug']}.webp"
    if p.get('local'):
        ok = dest.exists()
        return dict(name=p['name'], slug=p['slug'], status='preseeded' if ok else 'missing-preseed', file=str(dest.relative_to(ROOT)) if ok else None)
    try:
        chosen = base.choose_source(p)
        if not chosen:
            return dict(name=p['name'], slug=p['slug'], status='failed', reason='no usable image')
        score, source, im, fs = chosen
        out = base.crop_face(im, fs)
        base.save_webp(out, dest)
        return dict(name=p['name'], slug=p['slug'], status='ok', source=source, source_size=list(im.size), faces=[list(x) for x in fs], score=round(float(score), 2), bytes=dest.stat().st_size, file=str(dest.relative_to(ROOT)))
    except Exception as e:
        return dict(name=p['name'], slug=p['slug'], status='failed', reason=f'{type(e).__name__}: {e}')


def contact_sheet():
    thumbs=[]
    for p in PEOPLE:
        f=OUT/f"{p['slug']}.webp"
        if f.exists():
            thumbs.append((p['name'], Image.open(f).convert('RGB')))
    cols=6; tw,th,label_h=144,180,38
    rows=math.ceil(len(thumbs)/cols) if thumbs else 1
    sheet=Image.new('RGB',(cols*tw,rows*(th+label_h)),'white')
    d=ImageDraw.Draw(sheet); font=ImageFont.load_default()
    for idx,(name,im) in enumerate(thumbs):
        x=(idx%cols)*tw; y=(idx//cols)*(th+label_h)
        sheet.paste(im.resize((tw,th),Image.Resampling.LANCZOS),(x,y))
        words=name.split(); l1=''; l2=''
        for w in words:
            if len((l1+' '+w).strip())<=20: l1=(l1+' '+w).strip()
            else: l2=(l2+' '+w).strip()
        d.text((x+4,y+th+4),l1,fill='black',font=font)
        if l2: d.text((x+4,y+th+18),l2[:22],fill='black',font=font)
    sheet.save(QA/'contact-sheet.jpg',quality=88,optimize=True)


def main():
    report=[]
    with ThreadPoolExecutor(max_workers=10) as ex:
        futures={ex.submit(one,p): p for p in PEOPLE}
        for i,fut in enumerate(as_completed(futures),1):
            r=fut.result(); report.append(r)
            print(f"[{i:02d}/{len(PEOPLE)}] {r['status']:<15} {r['name']}",flush=True)
    order={p['name']:i for i,p in enumerate(PEOPLE)}
    report.sort(key=lambda r:order[r['name']])
    QA.mkdir(parents=True,exist_ok=True)
    (QA/'report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf-8')
    (QA/'report.txt').write_text('\n'.join(f"{r['status']:<15} {r['name']:<26} {r.get('source','')}" for r in report),encoding='utf-8')
    contact_sheet()
    ok=sum(r['status'] in ('ok','preseeded') for r in report)
    failed=[r['name'] for r in report if r['status'] not in ('ok','preseeded')]
    print(f"Built {ok}/{len(report)} portraits. Failed: {failed}")
    return 0

if __name__=='__main__':
    raise SystemExit(main())
