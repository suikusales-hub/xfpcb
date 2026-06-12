import os, re

PAGES_DIR = r'C:\Users\Administrator\Documents\XFPCB\src\pages'

fixed = 0
for root, dirs, files in os.walk(PAGES_DIR):
    for f in files:
        if not f.endswith('.astro'):
            continue
        filepath = os.path.join(root, f)
        rel = os.path.relpath(filepath, PAGES_DIR).replace('\\', '/')
        depth = len(rel.split('/'))
        correct = '../' * depth + 'layouts/BaseLayout.astro'
        
        with open(filepath, 'r', encoding='utf-8') as fh:
            content = fh.read()
        
        m = re.search(r"import BaseLayout from '((?:\.\./)+)layouts/BaseLayout\.astro';", content)
        if m and m.group(1) + 'layouts/BaseLayout.astro' != correct:
            content = content.replace(m.group(0), f"import BaseLayout from '{correct}';")
            with open(filepath, 'w', encoding='utf-8') as fh:
                fh.write(content)
            fixed += 1

print(f"Fixed {fixed} files")
