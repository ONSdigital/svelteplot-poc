    
    <script>

        let {
            items
        } = $props()

    </script>
    
{#if items}
    <div id="legend">
        {#each Object.keys(items) as item}
            <div class="legend--item">
                <div
                    class="legend--icon--circle"
                    style:background-color={items[item]}
                />
                <p class="legend--text">{item}</p>
            </div>
        {/each}
    </div>
{/if}