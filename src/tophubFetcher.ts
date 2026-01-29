import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

/**
 * TopHub Hot Item Interface
 */
export interface HotItem {
  rank: string;
  title: string;
  link: string;
  hot: string;
  source: string;
}

const TOPHUB_URL = 'https://tophub.today/hot';

/**
 * Fetch hot list from TopHub
 * Shared by tophub-trends and master-orchestrator
 */
export async function fetchHotList(): Promise<HotItem[]> {
  console.log(`Fetching ${TOPHUB_URL}...`);
  const response = await fetch(TOPHUB_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tophub: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const items: HotItem[] = [];

  $('.child-item').each((_, element) => {
    const el = $(element);
    const rank = el.find('.left-item span').text().trim();
    const titleLink = el.find('.medium-txt a');
    const title = titleLink.text().trim();
    const link = titleLink.attr('href') || '';

    // Some links might be relative
    const fullLink = link.startsWith('http') ? link : `https://tophub.today${link}`;

    const smallTxt = el.find('.small-txt').text().trim();
    // smallTxt format: "知乎 ‧ 958万热度"
    const parts = smallTxt.split('‧').map(s => s.trim());
    const source = parts[0] || '';
    const hot = parts[1] || '';

    if (title) {
      items.push({
        rank,
        title,
        link: fullLink,
        source,
        hot
      });
    }
  });

  return items;
}
