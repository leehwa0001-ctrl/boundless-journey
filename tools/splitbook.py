# 把作者給的圖切成一格一頁，存成 assets/books/<id>/pNN.webp（2026-10-18）
# 用法：python3 tools/splitbook.py 書的id 圖1 圖2:4 ...
#   每張圖自動找格子之間的分隔線（整條幾乎同一個顏色的橫線、直線）；沒有分隔線的一排人物，在檔名後面加「:人數」平均切直條。
#   印出要貼進 bookreader.js 的 pages。
import sys, os
from PIL import Image

def lines(px, w, h, axis):
    # 回傳「整條都是同一個顏色」的行／列（分隔線）
    out = []
    n, m = (h, w) if axis == 'y' else (w, h)
    for i in range(n):
        vals = [px[j, i] if axis == 'y' else px[i, j] for j in range(0, m, 4)]
        r = [v[0] for v in vals]; g = [v[1] for v in vals]; b = [v[2] for v in vals]
        if max(r) - min(r) < 24 and max(g) - min(g) < 24 and max(b) - min(b) < 24: out.append(i)
    return out

def spans(cuts, n, minsize):
    # 分隔線之間的區段
    edges, prev = [], -1
    for c in cuts + [n]:
        if c - prev - 1 >= minsize: edges.append((prev + 1, c))
        prev = c
    return edges

def panels(im, cols=None):
    w, h = im.size
    if cols:
        return [(int(w * i / cols), 0, int(w * (i + 1) / cols), h) for i in range(cols)]
    px = im.convert('RGB').load()
    out = []
    for (y0, y1) in spans(lines(px, w, h, 'y'), h, h // 5):
        sub = im.crop((0, y0, w, y1)); sp = sub.convert('RGB').load(); sw, sh = sub.size
        for (x0, x1) in spans(lines(sp, sw, sh, 'x'), sw, sw // 5):
            # 這一塊裡面再找橫的分隔線（像左邊一大格、右邊上下兩格）
            blk = im.crop((x0, y0, x1, y1)); bp = blk.convert('RGB').load(); bw, bh = blk.size
            for (yy0, yy1) in spans(lines(bp, bw, bh, 'y'), bh, bh // 5):
                out.append((x0, y0 + yy0, x1, y0 + yy1))
    return out

def main():
    bid, files = sys.argv[1], sys.argv[2:]
    d = os.path.join('assets', 'books', bid); os.makedirs(d, exist_ok=True)
    n, pages = 0, []
    for arg in files:
        f, _, c = arg.rpartition(':') if ':' in arg and arg.rsplit(':', 1)[1].isdigit() else (arg, '', '')
        im = Image.open(f).convert('RGB')
        for box in panels(im, int(c) if c else None) or [(0, 0) + im.size]:
            n += 1; name = 'p%02d.webp' % n
            im.crop(box).save(os.path.join(d, name), 'WEBP', quality=86, method=6)
            pages.append("{ img: 'assets/books/%s/%s' }" % (bid, name))
            print(f, box, '->', name)
    print('pages: [' + ', '.join(pages) + ']')

main()
