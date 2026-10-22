# Подмножества шрифтов сайта (TASK-qa-decisions.md, 2): из исходных woff2 (@fontsource 5.3.0, tools/fonts-src/, OFL-1.1 —
# лицензии в assets/fonts/OFL-*.txt) —
# в assets/fonts/ только нужные диапазоны. Подмножество по диапазонам, а не по символам текущих текстов: новая строка с
# буквой из диапазона не откатится в системный шрифт.
#   python -m pip install --user fonttools brotli     (инструмент разработчика, на сайт не попадает)
#   python tools/subset-fonts.py
# Диапазоны поменял — поменяй и unicode-range в @font-face (site.css) и проверь: node tools/qa.mjs fonts. unicode-range — только то,
# что реально есть в файле (check.mjs, «ревью, 2–3»): ← → ↗ † ‡ ‖ и ещё десяток знаков из 2010–2026 нет в исходниках, у JetBrains
# Mono нет Ѐ Ѝ ѐ ѝ — их набирает запасная гарнитура, в unicode-range их нет.
import os
from fontTools import subset
from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'fonts-src')
DST = os.environ.get('PT_FONTS_OUT') or os.path.join(HERE, '..', 'assets', 'fonts')

# cyrillic: кириллица, Ґ ґ, №
CYR = '0400-045F,0490-0491,2116'
# latin: ASCII, неразрывный пробел … «» ·, тире, кавычки и многоточие, стрелки, ₽; × — размеры в подписях и на схемах
LAT = '0020-007E,00A0-00BB,00D7,2010-2026,2190-2193,2197,20BD'
# фичи, которые браузер включает сам: без них набор текста сайта менялся бы. Только kern, liga — ломало «+7 909 024-39-95»
# (calt Manrope — дефис между цифрами) и «#f-<cat>» в аннотации каталога (calt JetBrains Mono — лигатура «-<»). Свои фичи
# (tnum, frac…) сайт не включает нигде
FEATURES = (os.environ.get('PT_FONTS_FEATURES') or 'kern,liga,calt,ccmp,locl,mark,mkmk,clig,rlig').split(',')


# ₽ (TASK-redesign-prices.md, 1): у Manrope и JetBrains Mono знак лежит в latin-ext, в latin-подмножестве fontsource его нет —
# unicode-range обещал U+20BD, а браузер брал его из системного шрифта («непонятный значок» у владельца, особенно в моно).
# Глиф берём из latin-ext того же начертания (tools/fonts-src/ext/, @fontsource 5.3.0) и вставляем в latin до подмножества:
# остальные глифы, хинтинг и таблицы latin-файла не меняются. У ₽ в этих шрифтах простой контур без своих инструкций, prep у
# latin и latin-ext одинаковый (проверено), hdmx / LTSH / VDMX нет
EXT = os.path.join(SRC, 'ext')
FROM_EXT = [0x20BD]


def add_from_ext(font, name):
    ext = os.path.join(EXT, name.replace('-latin-', '-latin-ext-'))
    if '-latin-' not in name or not os.path.exists(ext):
        return
    src = TTFont(ext)
    scm = src.getBestCmap()
    order = font.getGlyphOrder()
    for cp in FROM_EXT:
        g = scm[cp]
        gl = src['glyf'][g]
        assert not gl.isComposite() and not (hasattr(gl, 'program') and gl.program and gl.program.getBytecode()), g
        if g not in order:
            font.setGlyphOrder(order + [g])
            order = font.getGlyphOrder()
        font['glyf'][g] = gl
        font['hmtx'][g] = src['hmtx'][g]
        for t in font['cmap'].tables:
            if t.isUnicode():
                t.cmap[cp] = g
        # границы и пределы — не меньше, чем у вставленного глифа (сохраняем без пересчёта, см. ниже)
        gl.recalcBounds(font['glyf'])
        h, m = font['head'], font['maxp']
        h.xMin, h.yMin, h.xMax, h.yMax = min(h.xMin, gl.xMin), min(h.yMin, gl.yMin), max(h.xMax, gl.xMax), max(h.yMax, gl.yMax)
        m.maxPoints = max(m.maxPoints, len(gl.coordinates))
        m.maxContours = max(m.maxContours, gl.numberOfContours)


def unicodes(spec):
    out = []
    for part in spec.split(','):
        a, _, b = part.partition('-')
        out.extend(range(int(a, 16), int(b or a, 16) + 1))
    return out


def run():
    for name in sorted(os.listdir(SRC)):
        if not name.endswith('.woff2'):
            continue
        opts = subset.Options()
        opts.flavor = 'woff2'
        opts.layout_features = FEATURES
        # хинтинг (prep, gasp — ~100 байт на все файлы) остаётся: без него Chrome в Windows растрирует буквы чуть иначе
        # (сравнение по пикселям — сотни строк с отличиями в 1–14 точек); с ним 3 937 строк сайта совпадают с исходными
        # шрифтами до пикселя в Chromium, WebKit и Firefox
        opts.hinting = True
        opts.desubroutinize = True
        opts.notdef_outline = True
        opts.name_IDs = ['*']
        opts.name_languages = ['*']
        font = TTFont(os.path.join(SRC, name))
        add_from_ext(font, name)
        flags = font['head'].flags
        sub = subset.Subsetter(opts)
        sub.populate(unicodes=unicodes(CYR if '-cyrillic-' in name else LAT))
        sub.subset(font)
        # флаги head — как в исходном, границы при сохранении не пересчитывать (глифы те же): пересчёт снимал бит 1 («левый
        # отступ = xMin»), и DirectWrite сдвигал составной глиф (кириллическая «с» JetBrains Mono 500) на долю пикселя
        font['head'].flags = flags
        font.recalcBBoxes = False
        out = os.path.join(DST, name)
        font.flavor = 'woff2'
        font.save(out)
        print('%-46s %6d -> %6d' % (name, os.path.getsize(os.path.join(SRC, name)), os.path.getsize(out)))


if __name__ == '__main__':
    run()
