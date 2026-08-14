#!/usr/bin/env python3
"""Fetch the final full Rajeev Ahuja portrait for local CM4 publication."""
import io, json
import requests
from PIL import Image, ImageOps
import build_portraits as base

ROOT=base.ROOT
OUT=ROOT/"portrait-fixes"/"people"
QA=ROOT/"portrait-fixes"/"qa"
OUT.mkdir(parents=True,exist_ok=True)
QA.mkdir(parents=True,exist_ok=True)
name="Rajeev Ahuja"
slug="rajeev-ahuja"
url="https://media.licdn.com/dms/image/sync/v2/D5627AQHg5OgLbhIBcA/articleshare-shrink_800/B56ZhQclVTHQAI-/0/1753696328557?e=2147483647&t=hf0TbhTkJ3BiXcsDyrrNqyjm0LASd1SCpZpjaVT7YgU&v=beta"

def main():
    report=[]
    try:
        r=requests.get(url,timeout=30,headers={"User-Agent":"Mozilla/5.0 CM4/2026 portrait-localizer"})
        r.raise_for_status()
        im=ImageOps.exif_transpose(Image.open(io.BytesIO(r.content))).convert("RGB")
        fs=base.faces(im)
        out=base.crop_face(im,fs)
        dest=OUT/f"{slug}.webp"
        base.save_webp(out,dest)
        report.append({"name":name,"slug":slug,"source":url,"source_size":list(im.size),"faces":[list(x) for x in fs],"bytes":dest.stat().st_size,"status":"ok"})
        out.resize((240,300),Image.Resampling.LANCZOS).save(QA/"contact-sheet.jpg",quality=90,optimize=True)
        print("OK",name,im.size,flush=True)
    except Exception as e:
        report.append({"name":name,"slug":slug,"source":url,"status":"failed","reason":f"{type(e).__name__}: {e}"})
        print("FAIL",name,e,flush=True)
    (QA/"report.json").write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding="utf-8")
    return 0

if __name__=="__main__": raise SystemExit(main())
