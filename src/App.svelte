<script>
    import { parseRSS } from './rss.js';
    import Card from './Card.svelte';
    import dayjs from 'dayjs';
    import relativeTime from 'dayjs/plugin/relativeTime';
    import feeds from './feeds.json';

    dayjs.extend(relativeTime);

    const feedIds = Object.keys(feeds);

    const highlight = new Set(['Jonathan Corum', 'Anjali Singhvi', 'Josh Katz', 'Nate Cohn', 'Mika Gröndahl', 'Troy Griggs', 'Alicia Parlapiano', 'Karen Yourish', 'Matthew Bloch', 'Joe Ward', 'Charlie Smart', 'Jeremy White', 'Josh Holder', 'K.K. Rebecca Lai', 'Larry Buchanan', 'Mira Rojanasakul', 'Malika Khurana', 'Marco Hernandez']);

    const hashId = location.hash.slice(1).replace(/-/, ' ');
    const initialFeed = feeds[hashId] ? hashId : 'Graphics';
    let activeFeed = $state(initialFeed);
    let feed = $state.raw({ title: 'Hacker NYT', items: [] });
    let showDescriptions = $state(false);
    const hours = new Date().getHours();
    let nightMode = $state(hours < 5 || hours > 20);

    // remembered per browser; storage can be unavailable (private mode etc.)
    let hideElections = $state(readSetting('hideElections'));
    let showImages = $state(readSetting('showImages'));

    function readSetting(key) {
        try {
            return localStorage.getItem(key) === 'true';
        } catch {
            return false;
        }
    }

    function saveSetting(key, value) {
        try {
            localStorage.setItem(key, String(value));
        } catch {}
    }

    // matches e.g. /interactive/2026/elections/… and /2026/11/03/us/elections/…
    const isElectionStory = item => /\/elections\//.test(new URL(item.url).pathname);

    // filter out non-english items, newest first
    let items = $derived(
        feed.items
            .filter(item => item.title.charCodeAt(0) < 1000)
            .filter(item => !hideElections || !isElectionStory(item))
            .toSorted((a, b) => b.published - a.published)
    );

    async function parseFeed(url) {
        const res = await fetch(url);
        return parseRSS(await res.text());
    }

    let latestRequest = 0;

    async function loadFeed(id) {
        const request = ++latestRequest;
        const feedURLs = typeof feeds[id] === 'string' ? [feeds[id]] : feeds[id];
        // download all feed urls and merge items into one stream
        const parsedFeeds = await Promise.all(feedURLs.map(parseFeed));
        // ignore responses for feeds the user has already switched away from
        if (request !== latestRequest) return;

        const merged = [];
        const urls = new Set();
        for (const parsed of parsedFeeds) {
            for (const item of parsed.items) {
                if (!urls.has(item.url)) {
                    urls.add(item.url);
                    merged.push(item);
                }
            }
        }

        // create a meta-feed
        feed = { ...parsedFeeds[0], items: merged };
        location.hash = '#' + id.replace(/ /, '-');
    }

    loadFeed(initialFeed);

    const escape = str => str.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

    function getAuthors(item) {
        if (item.author && item.author !== 'By') {
            return item.author
                .split(/(, | and )/)
                .map(author => (highlight.has(author) ? `<b>${escape(author)}</b>` : escape(author)))
                .join('');
        }
        return '';
    }
</script>

<div class={{ 'night-mode': nightMode }}>
    <h1>{feed.title}
        <div class="links">
            <button onclick={() => (showDescriptions = !showDescriptions)}>
                {showDescriptions ? 'hide' : 'show'} descriptions
            </button>
            <button onclick={() => (nightMode = !nightMode)}>
                {nightMode ? 'day' : 'night'}
            </button>
            <label>
                <input
                    type="checkbox"
                    bind:checked={hideElections}
                    onchange={() => saveSetting('hideElections', hideElections)}
                >
                hide elections
            </label>
            <label>
                <input
                    type="checkbox"
                    bind:checked={showImages}
                    onchange={() => saveSetting('showImages', showImages)}
                >
                images
            </label>
        </div>
        <select bind:value={activeFeed} onchange={() => loadFeed(activeFeed)}>
            {#each feedIds as id (id)}
                <option>{id}</option>
            {/each}
        </select>
    </h1>

    {#if showImages}
        <ul class="cards">
            {#each items as item (item.url)}
                <li>
                    <Card {item} authors={getAuthors(item)} showDescription={showDescriptions} />
                </li>
            {/each}
        </ul>
    {:else}
        <ol>
            {#each items as item (item.url)}
                {@const authors = getAuthors(item)}
                <li>
                    <a title={item.description} href={item.url}>
                        <div class="title">{item.title}</div>
                        {#if showDescriptions}
                            <span class="description">
                                <br>{item.description} {#if authors}- by {@html authors}{/if}
                            </span>
                        {/if}
                        <span class="category">({dayjs(item.published).fromNow()}{#if item.updated}, updated {dayjs(item.updated).fromNow()}{/if})</span>
                    </a>
                </li>
            {/each}
        </ol>
    {/if}
</div>
