const PARAMS = '?quality=75&auto=avif&disable=upscale';

/**
 * NYT image URLs end in a crop name, e.g. "…-largeHorizontalJumbo-v2.jpg" or
 * "…-mediumSquareAt3X.jpg". Most images also exist as 320px and 640px square
 * crops under the same name. `fallback` is the original URL, for images
 * that have no square crop.
 */
export function squareImage(url) {
    const crop = /-[A-Za-z0-9]+(-v\d+)?\.(jpe?g|png|gif)$/;
    if (!crop.test(url)) return { src: url, srcset: null, fallback: null };
    const square = size => url.replace(crop, `-square${size}$1.$2`) + PARAMS;
    return { src: square(320), srcset: `${square(640)} 2x`, fallback: url };
}

// Feeds without media tags (Graphics, authors) get their image from NYT's
// oEmbed endpoint, which allows cross-origin requests. Requests are cached
// and run a few at a time so the top of the list loads first.
const cache = new Map();
const queue = [];
let running = 0;
const MAX_PARALLEL = 6;

function next() {
    while (running < MAX_PARALLEL && queue.length) {
        const job = queue.shift();
        running++;
        job().finally(() => {
            running--;
            next();
        });
    }
}

export function fetchImage(articleUrl) {
    if (!cache.has(articleUrl)) {
        cache.set(articleUrl, new Promise(resolve => {
            queue.push(() =>
                fetch(`https://www.nytimes.com/svc/oembed/json/?url=${encodeURIComponent(articleUrl)}`)
                    .then(res => (res.ok ? res.json() : {}))
                    // stories without a promo image get a generic NYT logo
                    .then(data => resolve(data.thumbnail_url?.includes('nyt_logo') ? null : data.thumbnail_url || null))
                    .catch(() => resolve(null))
            );
            next();
        }));
    }
    return cache.get(articleUrl);
}
