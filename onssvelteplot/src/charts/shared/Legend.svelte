    
    <script>

        let {
            categories,
            colourScheme
        } = $props()

    </script>
    
    <div id="legend">
        {#each categories as legendItem, i}
            <div class="legend--item">
                <div
                    class="legend--icon--circle"
                    style:background-color={colourScheme[legendItem]}
                />
                <p class="legend--text">{legendItem}</p>
            </div>
        {/each}
    </div>