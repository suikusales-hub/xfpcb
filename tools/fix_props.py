"""Fix Astro prop syntax: change 'name: value' to 'name="value"'"""
import os, re

PAGES_DIR = r'C:\Users\Administrator\Documents\XFPCB\src\pages'
LAYOUT_PATH = r'C:\Users\Administrator\Documents\XFPCB\src\layouts\BaseLayout.astro'

fixed = 0
for root, dirs, files in os.walk(PAGES_DIR):
    for f in files:
        if not f.endswith('.astro'):
            continue
        filepath = os.path.join(root, f)
        with open(filepath, 'r', encoding='utf-8') as fh:
            content = fh.read()
        
        # Fix prop syntax: change "title: 'value'" to 'title="value"'
        # We need to handle props that span multiple lines
        # Find the BaseLayout opening tag and its props block
        
        # Match props like: title: 'something'
        # Replace with: title="something"
        # But some values have single quotes inside them - those were already escaped
        def fix_prop(m):
            name = m.group(1)
            value = m.group(2)
            # Unescape single quotes for HTML attribute (but keep &lt; etc)
            value = value.replace("\\'", "'")
            return f'{name}="{value}"'
        
        new_content = re.sub(
            r'  ([a-zA-Z]+): \'((?:[^\\\']|\\.)*?)\'',  # match "  name: 'value'"
            fix_prop,
            content
        )
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as fh:
                fh.write(new_content)
            fixed += 1

print(f"Fixed {fixed} files")
