const DC = 'http://purl.org/dc/elements/1.1/';
const MEDIA = 'http://search.yahoo.com/mrss/';

const DAY = 24 * 60 * 60 * 1000;

/**
 * NYT re-publishes old stories with a fresh pubDate whenever they are updated.
 * Most article URLs contain the original publish date (/2026/10/04/), so if the
 * pubDate is more than two days after that, we treat the story as an update and
 * use the URL date as its publish date instead.
 */
function originalDate(url, pubDate) {
    const updated = new Date(pubDate);
    const m = url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
    if (!m) return { published: updated, updated: null };
    const fromUrl = new Date(Date.UTC(+m[1], m[2] - 1, +m[3]));
    if (updated - fromUrl > 2 * DAY) return { published: fromUrl, updated };
    return { published: updated, updated: null };
}

function image(item) {
    const media = [...item.getElementsByTagNameNS(MEDIA, 'content')].find(m => m.getAttribute('medium') === 'image');
    return media?.getAttribute('url') || null;
}

const text = (node, tag) => node.querySelector(`:scope > ${tag}`)?.textContent.trim() ?? '';

/**
 * Parses an RSS 2.0 document using the browser's DOMParser.
 * Returns only the fields the app uses.
 */
export function parseRSS(xml) {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const channel = doc.querySelector('rss > channel');
    if (!channel) throw new Error('Not a valid RSS feed');

    return {
        title: text(channel, 'title'),
        items: [...channel.querySelectorAll(':scope > item')].map(item => {
            const url = text(item, 'link');
            return {
                title: text(item, 'title'),
                url,
                description: text(item, 'description'),
                author: item.getElementsByTagNameNS(DC, 'creator')[0]?.textContent.trim() || text(item, 'author'),
                image: image(item),
                ...originalDate(url, text(item, 'pubDate'))
            };
        })
    };
}
