import re

path = r'C:\Users\Administrator\Documents\XFPCB\src\pages\products\32-layer-pcb\index.astro'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace unescaped "< " (less-than followed by space+digit) with HTML entity
content = re.sub(r'(?<!&lt;)< (\d)', r'&lt; \1', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed')
