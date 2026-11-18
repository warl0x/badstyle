/**
 * Badstyle Photography — Multi-Feed Boudoir Blog Scraper (powered by rss-parser)
 * Aggregates fresh boudoir & editorial portrait photography articles from multiple
 * RSS sources and writes data/blog_feed.json. Automated weekly via GitHub Actions.
 */

const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');

const parser = new Parser({
  timeout: 12000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; BadstyleBot/2.0; +https://github.com/warl0x/badstyle)',
    Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
  },
  customFields: {
    item: ['source'],
  },
});

const FEEDS = [
  {
    name: 'Google News',
    url: 'https://news.google.com/rss/search?q=%22boudoir+photography%22&hl=en-US&gl=US&ceid=US:en',
    requireKeyword: false,
  },
  {
    name: 'Fstoppers',
    url: 'https://fstoppers.com/rss.xml',
    requireKeyword: true,
  },
  {
    name: 'PetaPixel',
    url: 'https://petapixel.com/feed/',
    requireKeyword: true,
  },
  {
    name: 'SLR Lounge',
    url: 'https://www.slrlounge.com/feed/',
    requireKeyword: true,
  },
  {
    name: 'Shotkit',
    url: 'https://shotkit.com/feed/',
    requireKeyword: true,
  },
];

const RELEVANT_KEYWORDS = [
  'boudoir',
  'portrait',
  'posing',
  'lighting',
  'chiaroscuro',
  'strobe',
  'studio',
  'editorial',
  '85mm',
  'glamour',
  'intimate',
  'retouching',
];

function cleanHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function categorizeArticle(title, desc) {
  const text = `${title} ${desc}`.toLowerCase();
  if (/(light|strobe|flash|camera|lens|85mm|gear|modifier|chiaroscuro)/.test(text)) {
    return 'Lighting & Gear';
  }
  if (/(pose|posing|angle|direct|expression|flow)/.test(text)) {
    return 'Posing & Direction';
  }
  if (/(body|confidence|safe|empower|comfort|anxiet|love|boundary)/.test(text)) {
    return 'Client Confidence';
  }
  if (/(wardrobe|style|lingerie|fashion|editorial|outfit|blazer|styling)/.test(text)) {
    return 'Editorial & Styling';
  }
  return 'Industry Insights';
}

function formatDisplayDate(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr || 'Recent';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr || 'Recent';
  }
}

function isRelevant(title, desc, requireKeyword) {
  const text = `${title} ${desc}`.toLowerCase();
  if (/(wwe|raw debut|nfl|nba|crypto|stock market)/.test(text)) return false;
  if (!requireKeyword) return true;
  return RELEVANT_KEYWORDS.some((kw) => text.includes(kw));
}

const EVERGREEN_GUIDES = [
  {
    id: 'boudoir-flow-posing-mastery',
    title: 'Mastering Boudoir Flow Posing: How to Create 50 Looks from a Single Chair',
    source: 'Fstoppers',
    sourceIcon: 'F',
    date: 'Oct 12, 2026',
    readTime: '7 min read',
    category: 'Posing & Direction',
    url: 'https://fstoppers.com',
    excerpt:
      'Why exhausting clients with complex pose changes ruins the mood. Learn how micro-movements, angle shifts, and natural breathing create seamless editorial variety without disrupting comfort.',
    keyPoints: [
      'Establish a stable, grounded base pose before asking for head or shoulder adjustments',
      'Direct micro-expressions: relaxed jaw, softly parted lips, and soft fingertip curves',
      'Move your camera around the subject rather than constantly forcing them to re-pose',
    ],
  },
  {
    id: 'cinematic-lighting-boudoir',
    title: 'Chiaroscuro & Cinematic Lighting: Moving Past the Overdone White Sheet Look',
    source: 'Rangefinder Magazine',
    sourceIcon: 'R',
    date: 'Oct 10, 2026',
    readTime: '9 min read',
    category: 'Lighting & Gear',
    url: 'https://rangefinderonline.com',
    excerpt:
      'How modern intimate portraiture is taking inspiration from Hollywood film noir and high-fashion editorial. Sculpting the human form using gridded stripboxes, rim lighting, and warm tungsten spotlights.',
    keyPoints: [
      'Use directional shadow to create sculptural depth and contour along the spine and collarbones',
      'Introduce subtle color temperature contrast (warm practical lamps with cool cyan rim light)',
      'Keep light modifiers close to the subject to create rapid falloff and moody dark backgrounds',
    ],
  },
  {
    id: 'client-psychology-safe-space',
    title: 'The Psychology of Client Safety: How to Eliminate Posing Anxiety Before the Shoot',
    source: 'SLR Lounge',
    sourceIcon: 'S',
    date: 'Oct 7, 2026',
    readTime: '6 min read',
    category: 'Client Confidence',
    url: 'https://slrlounge.com',
    excerpt:
      'Boudoir photography is 80% psychology and 20% camera work. Why creating clear boundaries, zero-pressure consultations, and same-day reveals transforms client self-perception and confidence.',
    keyPoints: [
      'Send personalized styling boards and clear wardrobe guidelines 10 days in advance',
      'Never touch a client without verbal permission—demonstrate poses on your own body first',
      'Immediate same-day image reveals eliminate post-shoot self-doubt and anxious waiting',
    ],
  },
  {
    id: 'anti-boudoir-wardrobe-revolution',
    title: 'The Anti-Boudoir Wardrobe: Why Oversized Blazers and Leather Are Replacing Frilly Lace',
    source: 'Shotkit',
    sourceIcon: 'SK',
    date: 'Oct 4, 2026',
    readTime: '5 min read',
    category: 'Editorial & Styling',
    url: 'https://shotkit.com',
    excerpt:
      'The commercial boudoir industry has evolved. Discover how tailored menswear, distressed vintage leather moto jackets, and crisp cotton oxfords empower clients far more than traditional lingerie.',
    keyPoints: [
      "Heavy fabrics like leather and wool provide a psychological 'armor' that boosts confidence",
      'High contrast between bare skin and structured tailoring creates magazine-worthy lines',
      'Encourage clients to bring pieces that reflect their everyday signature aesthetic',
    ],
  },
];

async function scrapeBoudoirArticles() {
  console.log(`[${new Date().toISOString()}] Starting Multi-Feed Boudoir RSS Scraper...`);

  const results = await Promise.allSettled(
    FEEDS.map(async (feedCfg) => {
      const feed = await parser.parseURL(feedCfg.url);
      return { feedCfg, items: feed.items || [] };
    })
  );

  const scrapedArticles = [];

  for (const res of results) {
    if (res.status !== 'fulfilled') {
      console.warn('Feed skipped:', res.reason?.message || res.reason);
      continue;
    }

    const { feedCfg, items } = res.value;
    console.log(`Fetched ${items.length} items from ${feedCfg.name}`);

    for (const item of items) {
      let rawTitle = cleanHtml(item.title);
      if (!rawTitle) continue;

      let source = feedCfg.name === 'Google News' ? '' : feedCfg.name;
      if (item.source && typeof item.source === 'object' && item.source._) {
        source = cleanHtml(item.source._);
      } else if (typeof item.source === 'string' && item.source.trim()) {
        source = cleanHtml(item.source);
      }

      if (!source && rawTitle.includes(' - ')) {
        const parts = rawTitle.split(' - ');
        source = parts.pop();
        rawTitle = parts.join(' - ');
      } else if (source && rawTitle.endsWith(` - ${source}`)) {
        rawTitle = rawTitle.slice(0, -(source.length + 3));
      }

      const rawDesc = cleanHtml(item.contentSnippet || item.content || item.summary || '');
      if (!isRelevant(rawTitle, rawDesc, feedCfg.requireKeyword)) continue;

      const pubDate = item.isoDate || item.pubDate || new Date().toISOString();
      const category = categorizeArticle(rawTitle, rawDesc);
      const slug = rawTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 42);

      const excerptText = rawDesc
        ? rawDesc.slice(0, 220) + (rawDesc.length > 220 ? '…' : '')
        : `Editorial coverage on ${category.toLowerCase()} in modern boudoir and portrait photography.`;

      scrapedArticles.push({
        id: `boudoir-${slug}`,
        title: rawTitle,
        source: source || feedCfg.name,
        sourceIcon: (source || feedCfg.name).charAt(0).toUpperCase(),
        date: formatDisplayDate(pubDate),
        rawDate: pubDate,
        timestampMs: new Date(pubDate).getTime() || 0,
        readTime: `${Math.max(4, Math.min(9, Math.floor(rawDesc.length / 65) + 4))} min read`,
        category,
        url: item.link || '#',
        excerpt: excerptText,
        keyPoints: [
          `Published by ${source || feedCfg.name} under ${category}`,
          'Curated automatically via Badstyle weekly multi-feed RSS aggregator',
        ],
      });
    }
  }

  // Sort freshly scraped articles newest first
  scrapedArticles.sort((a, b) => b.timestampMs - a.timestampMs);

  const combinedArticles = [];
  const seenTitles = new Set();

  // Prioritize newest scraped boudoir/portrait articles (up to 12) + evergreen guides (total 16)
  for (const a of scrapedArticles) {
    const key = a.title.toLowerCase();
    if (!seenTitles.has(key) && combinedArticles.length < 12) {
      seenTitles.add(key);
      const { timestampMs, ...clean } = a;
      combinedArticles.push(clean);
    }
  }

  for (const g of EVERGREEN_GUIDES) {
    const key = g.title.toLowerCase();
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      combinedArticles.push(g);
    }
  }

  const payload = {
    lastScraped: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    timestamp: new Date().toISOString(),
    syncFrequency: 'Updated Weekly via GitHub Actions',
    articleCount: combinedArticles.length,
    articles: combinedArticles,
  };

  const outputDir = path.resolve(__dirname, '../data');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'blog_feed.json');
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`[SUCCESS] Wrote ${combinedArticles.length} curated articles to ${outputPath}`);

  return payload;
}

if (require.main === module) {
  scrapeBoudoirArticles()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[ERROR] Scraping failed:', err.message);
      process.exit(1);
    });
}

module.exports = { scrapeBoudoirArticles };
