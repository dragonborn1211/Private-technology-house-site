# Подмножества шрифтов сайта (TASK-qa-decisions.md, 2): из исходных woff2 (@fontsource 5.3.0, tools/fonts-src/, OFL-1.1 —
# лицензии в assets/fonts/OFL-*.txt) —
# в assets/fonts/ только нужные диапазоны. Подмножество по диапазонам, а не по символам текущих текстов: новая строка с
# буквой из диапазона не откатится в системный шрифт.
#   python -m pip install --user fonttools brotli     (инструмент разработчика, на сайт не попадает)
#   python tools/subset-fonts.py
# Диапазоны поменял — поменяй и unicode-range в @font-face (site.css) и проверь: node tools/qa.mjs fonts.
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
