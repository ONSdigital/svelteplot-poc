<script>

let {
    y,
    x,
    isPastMidpoint,
    children
 } = $props()

</script>

<div 
    class="tooltip"
    style:left="{x}px"
    style:top="{y}px"
    style:transform={isPastMidpoint ? 'translate(-105%, -50%)' : 'translate(5%, -50%)'}
    style:width="max-content"
>
    {#if children}
        {@render children()}
    {/if}
</div>

<style>

</style>