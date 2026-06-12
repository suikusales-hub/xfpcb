"""Fix cssExtra prop syntax: cssExtra: [...] → cssExtra={[...]}"""
import os, re

PAGES_DIR = r'C:\Users\Administrator\Documents\XFPCB\src\pages'

fixed = 0
for root, dirs, files in os.walk(PAGES_DIR):
    for f in files:
        if not f.endswith('.astro'):
            continue
        filepath = os.path.join(root, f)
        with open(filepath, 'r', encoding='utf-8') as fh:
            content = fh.read()
        
        # Fix: "cssExtra: ['/css/a.css', '/css/b.css']" → "cssExtra={['/css/a.css', '/css/b.css']}"
        new_content = re.sub(
            r'cssExtra: \[((?:[^\]]|\\\])*?)\]',
            r'cssExtra={[\1]}',
            content
        )
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as fh:
                fh.write(new_content)
            fixed += 1

print(f"Fixed {fixed} files")
