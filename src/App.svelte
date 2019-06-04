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

    let activeFeed = 'Most Shared';
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

    beforeUpdate(async () => {
        if (activeFeed !== _activeFeed) {
            const res = await fetch(feeds[activeFeed]);
            const rawXML = await res.text();
            feed = await rssParser.parse(rawXML);
            _activeFeed = activeFeed;
            location.hash = '#'+activeFeed.replace(/ /, '-');
        }
    });
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
    {#each items as item,i}
        <li>
            <a title="{item.description}" target="_blank" href="{item.links[0].url}">
                <div class="title">{item.title}</div>
                {#if showDescriptions}
                <span class="description">
                    <br>{item.description}
                </span>
                {/if}
                <span class="category">({dayjs(item.published).fromNow()})</span>
            </a>
        </li>
    {/each}
    </ol>
</div>