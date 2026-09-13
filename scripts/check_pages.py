from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
from collections import Counter

class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=[]; self.refs=[]; self.errors=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if 'id' in attrs:self.ids.append(attrs['id'])
        if tag=='img' and 'alt' not in attrs:self.errors.append('Missing alt')
        if tag=='a' and attrs.get('target')=='_blank' and 'noopener' not in attrs.get('rel',''):self.errors.append('Missing noopener')
        for name in ['href','src']:
            if name in attrs:self.refs.append(attrs[name])

for file in ['index.html','projects/index.html','about/index.html']:
    parser=Page();parser.feed(Path(file).read_text(encoding='utf-8'))
    assert not parser.errors,(file,parser.errors)
    assert len(parser.ids)==len(set(parser.ids)),file
    for ref in parser.refs:
        url=urlsplit(ref)
        if url.scheme or url.netloc:continue
        if not url.path:
            assert url.fragment in parser.ids,(file,ref)
        else:
            target=Path(url.path.lstrip('/')) if url.path.startswith('/') else Path(file).parent/url.path
            if target.is_dir():target/='index.html'
            assert target.is_file(),(file,ref)
print('PASS: all three pages have valid local links, assets, anchors, unique IDs and image labels.')
