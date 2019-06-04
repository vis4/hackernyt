<script>
    import { beforeUpdate, onMount } from 'svelte';
    import  * as rssParser from 'react-native-rss-parser';
    import dayjs from 'dayjs';
    import relativeTime from 'dayjs/plugin/relativeTime';

    dayjs.extend(relativeTime);

    const feeds = {
        'Home Page': 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
        'Most Viewed': 'https://rss.nytimes.com/services/xml/rss/nyt/MostViewed.xml',
        'Most Shared': 'https://rss.nytimes.com/services/xml/rss/nyt/MostShared.xml',
        World: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
        Europe: 'https://rss.nytimes.com/services/xml/rss/nyt/Europe.xml',
        'U.S.': 'https://rss.nytimes.com/services/xml/rss/nyt/US.xml',
        Business: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
        Climate: 'https://rss.nytimes.com/services/xml/rss/nyt/Climate.xml',
        Technology: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
        Sports: 'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml',
        Upshot: 'https://rss.nytimes.com/services/xml/rss/nyt/Upshot.xml',
    };

    const feedIds = Object.keys(feeds);

    let feed = { title: 'Hacker NYT', items: [] };

    // filter out non-english items
    $: items = feed.items.filter(item => item.title.charCodeAt(0) < 1000)

    let activeFeed = 'Most Shared';
    let _activeFeed = '';
    let showDescriptions = false;

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

<style>
    h1 {
        background: #ff6600;
        color: #000;
        font-size: 24px;
        padding: 10px 5px 10px 20px;
        margin: 0;
        position: relative;
    }
    ol {
        margin: 0;
        padding: 1ex 2em;
        background: #f6f6ef;
    }
    li {
        padding: 1ex 0;
        color: #aaa;
    }
    a .title {
        display: inline;
        color: black;
    }
    a:visited .title {
        color: gray;
    }
    a:hover {
        text-decoration: none;
    }
    a:hover .title {
        text-decoration: underline;
    }
    .category {
        font-size: 85%;
        color: #828282;
    }

    h1 select {
        position: absolute;
        top: 5px;
        right: 5px;
        font-size: 18px;
        background: white;
        border: 0;
        padding: 7px 8px;
    }
    .description {
        font-size: 18px;
        color: #999;
    }
    a:visited .category,
    a:visited .description {
        color: #bbb;
    }
    h1 a {
        font-size: 16px;
        font-weight: 400;
        display: inline-block;
        padding-left: 1em;
        padding-top: 1px;
        color: #fff;
        opacity: 0.8;
    }
    h1 a:hover {
        text-decoration: underline;
    }
    @media (max-width: 600px) {
        h1 a {
            display: block;
            padding-left: 0;
            margin-top: 5px;
            max-width: 200px;
        }
    }
</style>

<h1>{feed.title}
    <a on:click="{() => showDescriptions = !showDescriptions}">
        {showDescriptions ?'hide':'show'} descriptions
    </a>
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