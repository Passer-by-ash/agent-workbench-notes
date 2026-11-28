#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""整库快照：打包 + 逐条读回校验（公开版，路径走参数）。"""
import argparse, os, tarfile, time

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src', help='要打包的目录')
    ap.add_argument('out', help='输出 .tar.gz 路径')
    a = ap.parse_args()
    tmp = a.out + '.part'
    t0 = time.time()
    n = 0
    base = os.path.dirname(os.path.abspath(a.src))
    with tarfile.open(tmp, 'w:gz', format=tarfile.PAX_FORMAT, compresslevel=6) as tf:
        for dp, dn, fn in os.walk(a.src):
            dn.sort()
            for f in sorted(fn):
                p = os.path.join(dp, f)
                tf.add(p, arcname=os.path.relpath(p, base))
                n += 1
    m = 0
    with tarfile.open(tmp, 'r:gz') as tf:
        for _ in tf:
            m += 1
    print('打包', n, '件；读回', m, '件；耗时', round(time.time() - t0), 's')
    if m >= n:
        os.replace(tmp, a.out)
        print('OK ->', a.out, os.path.getsize(a.out))
    else:
        print('校验失败：', tmp)

if __name__ == '__main__':
    main()
