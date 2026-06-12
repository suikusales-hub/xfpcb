"""
XFPCB Astro Migration Script
Reads each HTML file from site/ and generates an Astro page under src/pages/
Preserves all URLs exactly as they were.
"""
import os
import re
import html as html_mod

SITE_DIR = r'C:\Users\Administrator\Documents\XFPCB\site'
PAGES_DIR = r'C:\Users\Administrator\Documents\XFPCB\src\pages'

def extract_head_info(html_content):
    """Extract title, description, keywords, canonical, og tags from HTML head."""
    info = {
        'title': 'XFPCB',
        'description': '',
        'keywords': '',
        'canonical': '',
        'og_title': '',
        'og_description': '',
        'og_image': '',
        'og_url': '',
        'css_files': [],
    }
    
    # Title
    m = re.search(r'<title>(.*?)</title>', html_content, re.DOTALL | re.IGNORECASE)
    if m:
        info['title'] = m.group(1).strip()
    
    # Description
    m = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', html_content, re.IGNORECASE)
    if not m:
        m = re.search(r'<meta\s+content=["\'](.*?)["\']\s+name=["\']description["\']', html_content, re.IGNORECASE)
    if m:
        info['description'] = m.group(1).strip()
    
    # Keywords
    m = re.search(r'<meta\s+name=["\']keywords["\']\s+content=["\'](.*?)["\']', html_content, re.IGNORECASE)
    if m:
        info['keywords'] = m.group(1).strip()
    
    # Canonical
    m = re.search(r'<link\s+rel=["\']canonical["\']\s+href=["\'](.*?)["\']', html_content, re.IGNORECASE)
    if m:
        info['canonical'] = m.group(1).strip()
    
    # OG tags
    og_map = {
        'og:title': 'og_title',
        'og:description': 'og_description',
        'og:image': 'og_image',
        'og:url': 'og_url',
    }
    for prop, key in og_map.items():
        m = re.search(r'<meta\s+property=["\']' + re.escape(prop) + r'["\']\s+content=["\'](.*?)["\']', html_content, re.IGNORECASE)
        if m:
            info[key] = m.group(1).strip()
    
    # CSS files
    for m in re.finditer(r'<link\s+[^>]*href=["\'](/css/[^"\']+)["\']', html_content, re.IGNORECASE):
        css = m.group(1).split('?')[0]  # remove query strings
        if css not in info['css_files']:
            info['css_files'].append(css)
    
    return info


def extract_main_content(html_content):
    """Extract the content between <main> and </main>."""
    m = re.search(r'<main[^>]*>(.*?)</main>', html_content, re.DOTALL | re.IGNORECASE)
    if m:
        return m.group(1).strip()
    return ''


def css_to_import_string(css_files):
    """Generate the cssExtra array string from CSS file list."""
    default_css = {'/css/style.css'}
    extra = [c for c in css_files if c not in default_css]
    if not extra:
        return '[]'
    return '[' + ', '.join(f"'{c}'" for c in extra) + ']'


def generate_astro_page(filepath, relative_dir):
    """Generate an Astro page from an HTML file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    info = extract_head_info(content)
    main_content = extract_main_content(content)
    
    # Determine the route path for the canonical URL
    # site/index.html → /
    # site/about/index.html → /about/
    # site/products/4-layer-pcb/index.html → /products/4-layer-pcb/
    
    # Build props
    props = []
    props.append(f"  title: '{escape_quote(info['title'])}'")
    if info['description']:
        props.append(f"  description: '{escape_quote(info['description'])}'")
    if info['keywords']:
        props.append(f"  keywords: '{escape_quote(info['keywords'])}'")
    if info['canonical']:
        props.append(f"  canonical: '{escape_quote(info['canonical'])}'")
    if info['og_title']:
        props.append(f"  ogTitle: '{escape_quote(info['og_title'])}'")
    if info['og_description']:
        props.append(f"  ogDescription: '{escape_quote(info['og_description'])}'")
    if info['og_image']:
        props.append(f"  ogImage: '{escape_quote(info['og_image'])}'")
    if info['og_url']:
        props.append(f"  ogUrl: '{escape_quote(info['og_url'])}'")
    
    css_extra = css_to_import_string(info['css_files'])
    props.append(f"  cssExtra: {css_extra}")
    
    props_str = '\n'.join(props)
    
    # Generate the Astro file content
    astro = f"""---
import BaseLayout from '../../layouts/BaseLayout.astro';
---

<BaseLayout
{props_str}
>
  <main>
{main_content}
  </main>
</BaseLayout>
"""
    return astro


def escape_quote(s):
    """Escape single quotes for Astro template literals."""
    return s.replace("'", "\\'")


def get_relative_path(full_path):
    """Get the path relative to site/ directory."""
    return os.path.relpath(full_path, SITE_DIR).replace('\\', '/')


def get_astro_output_path(html_rel_path):
    """Convert a relative HTML path to an Astro pages path."""
    # index.html → index.astro
    # about/index.html → about/index.astro
    return html_rel_path.replace('.html', '.astro')


def escape_backticks(s):
    """Escape backticks inside template literals."""
    return s.replace('`', '\\`')


def main():
    # Walk through all HTML files in site/
    html_files = []
    for root, dirs, files in os.walk(SITE_DIR):
        # Skip non-HTML directories
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('cdn-cgi',)]
        for f in files:
            if f.endswith('.html'):
                html_files.append(os.path.join(root, f))
    
    print(f"Found {len(html_files)} HTML files")
    
    # Skip these paths (handled differently or not needed)
    # The 404 page is special in Astro
    # CDN-cgi scripts are handled by Cloudflare
    
    migrated = 0
    skipped = 0
    errors = []
    
    for filepath in sorted(html_files):
        rel_path = get_relative_path(filepath)
        
        # Determine output path
        out_rel_path = get_astro_output_path(rel_path)
        out_path = os.path.join(PAGES_DIR, out_rel_path)
        
        # Skip cdn-cgi scripts
        if 'cdn-cgi' in rel_path:
            skipped += 1
            continue
        
        try:
            astro_content = generate_astro_page(filepath, rel_path)
            
            # Create output directory
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write(astro_content)
            
            migrated += 1
            if migrated % 20 == 0:
                print(f"  Migrated {migrated} pages...")
                
        except Exception as e:
            errors.append((rel_path, str(e)))
            print(f"  ERROR: {rel_path}: {e}")
    
    print(f"\nMigration complete: {migrated} migrated, {skipped} skipped, {len(errors)} errors")
    if errors:
        print("Errors:")
        for path, err in errors:
            print(f"  - {path}: {err}")


if __name__ == '__main__':
    main()
