#!/usr/bin/env python3
"""Thread-safe wrapper for the parallel CM4 portrait builder."""
import threading
import cv2
import numpy as np
import build_portraits as base

_FACE_LOCK = threading.Lock()

def safe_faces(im):
    arr = np.asarray(im)
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
    gray = cv2.equalizeHist(gray)
    with _FACE_LOCK:
        det = base.CASCADE.detectMultiScale(
            gray,
            scaleFactor=1.08,
            minNeighbors=4,
            minSize=(45, 45),
        )
    return [tuple(map(int, x)) for x in det]

base.faces = safe_faces

import build_portraits_v2 as parallel

if __name__ == "__main__":
    raise SystemExit(parallel.main())
