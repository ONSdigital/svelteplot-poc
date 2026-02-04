<script>

    import BarChart from "./BarChart.svelte";

    let {
        props,
        data,
        width,
        margin = {left: 80, right: 10, top: 10, bottom: 10},
        chartEvery = 3,
        chartGap = 10,
        type
    } = $props();

    let itemWidth = $derived(((width-margin.left-margin.right) - (chartGap*(chartEvery-1))) / chartEvery)

    $inspect(itemWidth)

</script>

<div class="flex">
    {#each Object.keys(data) as group, i}
        <div 
            class="item"
            width={i % chartEvery == 0 ? itemWidth + margin.left : i % chartEvery == chartEvery ? itemWidth + chartGap + margin.right : itemWidth + chartGap}>
            {#if type.toLowerCase() === "bar"}
                <BarChart 
                    {...props} 
                    data={data[group]}/>
            {/if}
        </div>
    {/each}
</div>

<style>
    .flex{
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
    }
    .item{

    }

</style>