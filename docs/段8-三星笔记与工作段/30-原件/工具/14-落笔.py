#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""14-落笔：按本机时刻与系统星期重写件的「落笔」行，保留「首写」。"""
import os, re, sys, time
WD = '一二三四五六日'
def main():
    now = time.localtime()
    stamp = time.strftime('%Y-%m-%d %H:%M:%S', now) + ' 星期' + WD[now.tm_wday]
    for p in sys.argv[1:]:
        if not os.path.exists(p):
            print('缺文件', p); continue
        t = open(p, encoding='utf-8', errors='replace').read()
        m = re.search(r'^落笔:.*$', t, re.M)
        if not m:
            print('无落笔行', p); continue
        first = re.search(r'首写 (\d{4}-\d{2}-\d{2} \d{2}:\d{2}(?::\d{2})?)', m.group(0))
        note = '（末改实测；首写 ' + first.group(1) + '）' if first else '（按本机时刻重写）'
        t2 = re.sub(r'^落笔:.*$', '落笔: ' + stamp + ' ' + note, t, count=1, flags=re.M)
        if t2 != t:
            open(p, 'w', encoding='utf-8').write(t2)
            print('改写', os.path.basename(p), '->', stamp)
if __name__ == '__main__':
    main()
