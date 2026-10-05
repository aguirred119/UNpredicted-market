"""Retrieve the explicitly selected historical archive; never scrape live MLB APIs."""
import hashlib, io, json, urllib.request, zipfile

url = 'https://www.retrosheet.org/gamelogs/gl2025.zip'
with urllib.request.urlopen(url, timeout=45) as response:
    payload = response.read(5_000_001)
if len(payload) > 5_000_000:
    raise ValueError('Unexpected archive size')
with zipfile.ZipFile(io.BytesIO(payload)) as archive:
    item = archive.getinfo('gl2025.txt')
    if item.file_size > 10_000_000:
        raise ValueError('Unexpected game log size')
    text = archive.read(item).decode('utf-8')
print(json.dumps({'url': url, 'sha256': hashlib.sha256(payload).hexdigest(), 'text': text}))
