<script>

    import BarChart from "./BarChart.svelte";

    let {
        props,
        data,
        width,
        margin = {left: 160, right: 10, top: 10, bottom: 10},
        chartEvery = 2,
        chartGap = 10,
        type
    } = $props();

    let itemWidth = $derived(((width-margin.left-margin.right) - (chartGap*(chartEvery-1))) / chartEvery)
    let smMargin = $derived([
        margin,
        {left: chartGap, right: margin.right, top: margin.top, bottom: margin.bottom}
    ])

    $inspect(itemWidth)

</script>

<div class="flex">
    {#each Object.keys(data) as group, i}
        <div 
            class="item"
            width={i % chartEvery == 0 ? itemWidth + margin.left : i % chartEvery == chartEvery ? itemWidth + chartGap + margin.right : itemWidth + chartGap}>
            <h4>{group}</h4>
            {#if type.toLowerCase() === "bar"}
                <BarChart 
                    width={i % chartEvery == 0 ? itemWidth + margin.left : i % chartEvery == chartEvery ? itemWidth + chartGap + margin.right : itemWidth + chartGap}
                    {...props} 
                    data={data[group]}
                    margin={i % chartEvery == 0 ? smMargin[0]: smMargin[1]}
                    smGridPosition = {i % chartEvery}
                    />
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