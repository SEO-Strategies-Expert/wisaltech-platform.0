import re, pathlib, sys
path = pathlib.Path(r'en/services/index.html')
content = path.read_text(encoding='utf-8')
pattern = r'(?:href|src|action)\s*=\s*["\'][^"\']+["\']'
matches = re.findall(pattern, content, re.I)
for m in matches:
    print(m)
