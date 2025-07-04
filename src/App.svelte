<script>
    import { beforeUpdate, onMount } from 'svelte';
    import  * as rssParser from 'react-native-rss-parser';
    import dayjs from 'dayjs';
    import relativeTime from 'dayjs/plugin/relativeTime';
    import feeds from './feeds.json';

    dayjs.extend(relativeTime);

    const feedIds = Object.keys(feeds);
    let feed = { title: 'Hacker NYT', items: [] };

    // filter out non-english items
    $: items = feed.items.filter(item => item.title.charCodeAt(0) < 1000)

    let activeFeed = 'Graphics';
    let _activeFeed = '';
    let showDescriptions = false;
    const hours = (new Date()).getHours();
    let nightMode = hours < 5 || hours > 20;

    onMount(() => {
        if (window.location.hash) {
            const id = location.hash.substr(1).replace(/-/, ' ');
            if (feeds[id]) activeFeed = id;
        }
    })

    async function parseFeed(url) {
        const res = await fetch(url);
        const rawXML = await res.text();
        return await rssParser.parse(rawXML)
    }

    beforeUpdate(async () => {
        if (activeFeed !== _activeFeed) {
            const feedURLs = typeof feeds[activeFeed] === 'string' ? [feeds[activeFeed]] : feeds[activeFeed];
            // download all feed urls and merge items into one stream
            const parsedFeeds = await Promise.all(feedURLs.map(parseFeed))

            const items = [];
            const urls = new Set();

            parsedFeeds.forEach(feed => feed.items.forEach(item => {
                if (!urls.has(item.links[0].url)) {
                    urls.add(item.links[0].url);
                    items.push(item);
                }
            }));

            // create a meta-feed
            feed = {
                ...parsedFeeds[0],
                items
            };
            _activeFeed = activeFeed;
            location.hash = '#'+activeFeed.replace(/ /, '-');
        }
    });

    const highlight = new Set(['Jonathan Corum', 'Anjali Singhvi', 'Josh Katz', 'Nate Cohn', 'Mika Gröndahl', 'Troy Griggs', 'Alicia Parlapiano', 'Karen Yourish', 'Matthew Bloch', 'Joe Ward', 'Charlie Smart', 'Jeremy White', 'Josh Holder', 'K.K. Rebecca Lai', 'Larry Buchanan'])

    function byDate(a, b) {
        return dayjs(b.published).diff(a.published);
    }

    function getAuthors(item) {
        if (typeof item.authors[0] === 'object' && item.authors[0].name !== 'By') {
            return item.authors[0].name.split(/(, | and )/).map(author => highlight.has(author) ? `<b>${author}</b>` : author).join('');
        }
        return '';
    }
</script>

<div class:night-mode={nightMode}>
    <h1>{feed.title}
        <div class="links">
            <a on:click="{() => showDescriptions = !showDescriptions}">
                {showDescriptions ?'hide':'show'} descriptions
            </a>
            <a on:click="{() => nightMode = !nightMode}">
                {nightMode ?'day':'night'}
            </a>
        </div>
        <select bind:value="{activeFeed}">
            {#each feedIds as id}
            <option>{id}</option>
            {/each}
        </select>
    </h1>

    <ol>
    {#each items.toSorted(byDate) as item,i}
        <li>
            <a title="{item.description}" href="{item.links[0].url}">
                <div class="title">{item.title}</div>
                {#if showDescriptions}
                <span class="description">
                    <br>{item.description} {#if getAuthors(item)}- by {@html getAuthors(item)}{/if}
                </span>
                {/if}
                <span class="category">({dayjs(item.published).fromNow()})</span>
            </a>
        </li>
    {/each}
    </ol>
</div>