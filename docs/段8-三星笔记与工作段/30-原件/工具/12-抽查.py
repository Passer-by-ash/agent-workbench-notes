#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""随机抽查：件 ↔ 原件（公开版，路径全部走参数）。"""
import argparse, os, random, re, sys, zipfile

def norm(s):
    return re.sub(r'\s+', '', s or '')

def fm(t):
    m = re.split(r'^---$', t, maxsplit=2, flags=re.M)
    return m[1] if len(m) > 2 else ''

def get(front, key):
    m = re.search(r'^' + key + r':\s*(.*)$', front, re.M)
    return m.group(1).strip().strip('"') if m else ''

def body(t):
    parts = re.split(r'^---$', t, maxsplit=2, flags=re.M)
    b = parts[2] if len(parts) > 2 else t
    b = re.sub(r'^#.*$', '', b, count=1, flags=re.M)
    b = re.sub(r'^>.*$', '', b, flags=re.M)
    b = re.sub(r'!\[\[[^\]]+\]\]', '', b)
    return b.strip()

def docx_text(p):
    try:
        z = zipfile.ZipFile(p)
        xml = z.read('word/document.xml').decode('utf-8', 'replace')
        return norm(' '.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', xml)))
    except Exception:
        return ''

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('root', help='库根（含 工作/ 等段目录）')
    ap.add_argument('--originals', required=True, help='原件根目录')
    ap.add_argument('--converted', default='', help='转好的 txt 目录（可空）')
    ap.add_argument('--per-dir', type=int, default=6)
    ap.add_argument('--seed', type=int, default=20260101)
    a = ap.parse_args()
    random.seed(a.seed)
    dirs = [d for d in os.listdir(a.root) if os.path.isdir(os.path.join(a.root, d))]
    bad = []
    for d in dirs:
        files = []
        for dp, _, fn in os.walk(os.path.join(a.root, d)):
            if '.assets' in dp or '_原始档' in dp:
                continue
            files += [os.path.join(dp, f) for f in fn if f.endswith('.md') and not f.startswith('00-')]
        for p in random.sample(files, min(a.per_dir, len(files))):
            t = open(p, encoding='utf-8', errors='replace').read()
            front = fm(t)
            src = get(front, '原件') or get(front, '源档')
            if src:
                sp = os.path.join(a.originals, src.replace('\\', os.sep))
                if not os.path.exists(sp):
                    bad.append((p, '原件不存在'))
                    continue
                if src.lower().endswith('.docx'):
                    txt = docx_text(sp)
                    probes = [norm(x)[:16] for x in re.split(r'\n\s*\n', body(t)) if len(norm(x)) >= 12][:6]
                    if txt and probes and not any(pr and pr in txt for pr in probes):
                        bad.append((p, '正文片段未在 docx 找到'))
                elif a.converted:
                    stem = os.path.splitext(os.path.basename(src))[0]
                    tp = os.path.join(a.converted, stem + '.txt')
                    if os.path.exists(tp):
                        txt = norm(open(tp, encoding='utf-8', errors='replace').read())
                        probes = [norm(x)[:16] for x in re.split(r'\n\s*\n', body(t)) if len(norm(x)) >= 12][:6]
                        if probes and not any(pr and pr in txt for pr in probes):
                            bad.append((p, '正文片段未在 txt 找到'))
    print('抽了', len(dirs), '个目录；不一致', len(bad))
    for b in bad:
        print(' ', b)

if __name__ == '__main__':
    main()
