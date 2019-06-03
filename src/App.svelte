<script>
    import { beforeUpdate, onMount } from 'svelte';
    import  * as rssParser from 'react-native-rss-parser';
    import dayjs from 'dayjs';
    import relativeTime from 'dayjs/plugin/relativeTime'

    dayjs.extend(relativeTime);

    const feeds = {
        'Home Page': 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
        Popular: 'https://rss.nytimes.com/services/xml/rss/nyt/MostViewed.xml',
        'Most Shared': 'https://rss.nytimes.com/services/xml/rss/nyt/MostShared.xml',
        World: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
        Europe: 'https://rss.nytimes.com/services/xml/rss/nyt/Europe.xml',
        'U.S.': 'https://rss.nytimes.com/services/xml/rss/nyt/US.xml',
        Technology: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
        Sports: 'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml',
        Upshot: 'https://rss.nytimes.com/services/xml/rss/nyt/Upshot.xml',
        kpq: 'https://www.nytimes.com/svc/collections/v1/publish/www.nytimes.com/by/kevin-quealy/rss.xml'
    };

    const feedIds = Object.keys(feeds);

    let feed = { items: [] };

    let activeFeed = 'Home Page';
    let _activeFeed = '';


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
    a {
        color: black;
    }
    a:visited {
        color: gray;
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
    }
</style>

<h1>Hacker NYT
<select bind:value="{activeFeed}">
    {#each feedIds as id}
    <option>{id}</option>
    {/each}
</select>
</h1>

<ol>
{#each feed.items as item}
<li><a target="_blank" href="{item.links[0].url}">{item.title}</a> <span class="category">({dayjs(item.published).fromNow()})</span>
</li>
{/each}

</ol>