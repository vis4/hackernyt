<script>
    import dayjs from 'dayjs';
    import { squareImage, fetchImage } from './images.js';

    let { item, authors, showDescription } = $props();

    let imageUrl = $derived(item.image ? Promise.resolve(item.image) : fetchImage(item.url));

    // try the square crop first, then the original image, then give up
    function onerror(event) {
        const img = event.currentTarget;
        const fallback = img.dataset.fallback;
        if (fallback && img.src !== fallback) {
            img.removeAttribute('srcset');
            img.src = fallback;
        } else {
            img.remove();
        }
    }
</script>

<a class="card" title={item.description} href={item.url}>
    <span class="thumb">
        {#await imageUrl then url}
            {#if url}
                {@const image = squareImage(url)}
                <img
                    src={image.src}
                    srcset={image.srcset}
                    data-fallback={image.fallback}
                    alt=""
                    loading="lazy"
                    {onerror}
                >
            {/if}
        {/await}
    </span>
    <span class="title">{item.title}</span>
    {#if showDescription}
        <span class="description">{item.description}</span>
    {/if}
    <span class="meta">
        {#if authors}by {@html authors},{' '}{/if}{dayjs(item.published).fromNow()}{#if item.updated}, updated {dayjs(item.updated).fromNow()}{/if}
    </span>
</a>
