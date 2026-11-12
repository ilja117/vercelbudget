#!/bin/sh
# Локальна копія застосунку без CDN і без живої бази: tools/preview/out, сервер на :8766.
# Перший запуск: (cd tools/preview && npm i)
set -e
D=$(cd "$(dirname "$0")" && pwd); O=$D/out; R=$D/../..
rm -rf "$O"; mkdir -p "$O"; cp -r "$R"/public/* "$O"/
cd "$D" && npx tailwindcss -c tw.config.js -i in.css -o "$O/tw.css" --minify >/dev/null 2>&1
cp node_modules/chart.js/dist/chart.umd.js fakefb.js fonts.css "$O"/
for f in oswald inter; do for s in cyrillic latin; do for w in 400 500 600 700; do
  src=node_modules/@fontsource/$f/files/$f-$s-$w-normal.woff2; [ -f "$src" ] && mkdir -p "$O/__font/$f" && cp "$src" "$O/__font/$f/$s-$w.woff2"; done; done; done
python3 - "$O" <<'PY'
import json,re,sys
O=sys.argv[1]
css=open(O+'/tw.css').read()
open(O+'/tw.js','w').write('window.tailwind={};(function(){var s=document.createElement("style");s.textContent='+json.dumps(css)+';document.head.prepend(s);})();')
s=open(O+'/index.html',encoding='utf-8').read()
s=s.replace('<script src="https://cdn.tailwindcss.com"></script>','<script src="tw.js"></script>')
s=re.sub(r'<script src="https://cdn.jsdelivr.net/npm/chart.js@[^"]+"></script>','<script src="chart.umd.js"></script>',s)
s=s.replace('<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>','<script src="fakefb.js"></script>')
s=re.sub(r'<script src="https://www.gstatic.com/firebasejs/[^"]+"></script>','',s)
s=re.sub(r'https://fonts.googleapis.com/css2\?[^"\']+','fonts.css',s)
open(O+'/index.html','w',encoding='utf-8').write(s)
PY
echo "built $O — serve: (cd $O && python3 -m http.server 8766); open http://localhost:8766/?tab=dashboard"
