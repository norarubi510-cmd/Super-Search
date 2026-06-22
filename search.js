// search.js — plain JavaScript: tab config + Google Custom Search API + demo data.
// These are declared as globals so app.jsx (loaded after) can use them.

var TABS = [
  { id: 'all',    label: '✦ All' },
  { id: 'news',   label: '📰 News' },
  { id: 'images', label: '🖼 Images' },
  { id: 'videos', label: '🎬 Videos' },
];

// ---------- Demo data (used when no API key is configured) ----------
function demoResults(tab, q) {
  const term = q || 'y2k';
  const pic = (seed, w, h) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
  if (tab === 'images') {
    return Array.from({ length: 12 }, (_, i) => ({
      kind: 'image',
      title: `${term} • shot ${i + 1}`,
      link: pic(term + i, 600, 600),
      thumb: pic(term + i, 400, 400),
    }));
  }
  if (tab === 'videos') {
    return Array.from({ length: 9 }, (_, i) => ({
      kind: 'video',
      title: `${term} — clip #${i + 1}`,
      link: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(term),
      src: 'youtube.com',
      thumb: pic('vid' + term + i, 480, 270),
    }));
  }
  const base = tab === 'news'
    ? [
        ['Inside the ' + term + ' revival sweeping the internet', 'trendwire.example'],
        [term + ': everything you need to know this week', 'dailybyte.example'],
        ['Why ' + term + ' is back and bigger than ever', 'pulsenews.example'],
        ['The ' + term + ' report — analysts weigh in', 'marketloop.example'],
        ['5 things the ' + term + ' headlines got right', 'cleartake.example'],
      ]
    : [
        [term + ' — overview & history', 'wikipedia.example'],
        ['Official ' + term + ' site', term.replace(/\s+/g,'') + '.example'],
        ['Best ' + term + ' resources for beginners', 'guidehub.example'],
        ['r/' + term.replace(/\s+/g,'') + ' community', 'reddit.example'],
        ['Learn ' + term + ' the fun way', 'academy.example'],
      ];
  return base.map(([title, src], i) => ({
    kind: 'web',
    title,
    link: 'https://' + src,
    src,
    snippet: `A great ${tab === 'news' ? 'news story' : 'result'} about “${term}”. Add your Google Custom Search key in Settings to see live results instead of this demo content.`,
  }));
}

// ---------- Google Custom Search JSON API ----------
async function googleSearch(tab, q, key, cx) {
  const base = 'https://www.googleapis.com/customsearch/v1';
  const p = new URLSearchParams({ key, cx, q });
  if (tab === 'images') p.set('searchType', 'image');
  if (tab === 'news') { p.set('q', q + ' news'); p.set('sort', 'date'); }
  if (tab === 'videos') p.set('q', q + ' video');
  const res = await fetch(`${base}?${p.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Request failed (${res.status})`);
  }
  const data = await res.json();
  const items = data.items || [];
  return items.map((it) => {
    if (tab === 'images') {
      return { kind: 'image', title: it.title, link: it.link, thumb: it.image?.thumbnailLink || it.link };
    }
    const thumb = it.pagemap?.cse_thumbnail?.[0]?.src || it.pagemap?.cse_image?.[0]?.src;
    if (tab === 'videos') {
      return { kind: 'video', title: it.title, link: it.link, src: it.displayLink, thumb };
    }
    return { kind: 'web', title: it.title, link: it.link, src: it.displayLink, snippet: it.snippet };
  });
}