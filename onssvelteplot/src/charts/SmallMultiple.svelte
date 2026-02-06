<script>

    import BarChart from "./BarChart.svelte";

    import { getCategoricalDomain } from '../js/utils';

    let {
        props,
        data,
        width,
        margin = {left: 160, right: 10, top: 0, bottom: 0},
        chartEvery = 3,
        chartGap = 10,
        type
    } = $props();

    let itemWidth = $derived(((width-margin.left-margin.right) - (chartGap*(chartEvery-1))) / chartEvery)
    let smMargin = $derived([
        margin,
        {left: chartGap, right: margin.right, top: margin.top, bottom: margin.bottom}
    ])

    let domainY = $derived(type == 'bar' && !yDomain ? getCategoricalDomain({
        data: data[Object.keys(data)[0]], 
        variant: props.variant, 
        sort: props.ySort, 
        sortKey: props.zSortKey, 
        valueKey: props.xKey, 
        categoryKey: props.yKey, 
        groupKey: props.zKey
    }) : null)

</script>

<div class="flex">
    {#each Object.keys(data) as group, i}
        <div 
            class="item"
            width={i % chartEvery == 0 ? itemWidth + margin.left : i % chartEvery == chartEvery ? itemWidth + chartGap + margin.right : itemWidth + chartGap}>
            <div class="title" style:margin-left={i % chartEvery == 0 ? smMargin[0].left+"px": smMargin[1].left+"px"}>{group}</div>
            {#if type.toLowerCase() === "bar"}
                <BarChart 
                    width={i % chartEvery == 0 ? itemWidth + margin.left : i % chartEvery == chartEvery ? itemWidth + chartGap + margin.right : itemWidth + chartGap}
                    {...props} 
                    data={data[group]}
                    margin={i % chartEvery == 0 ? smMargin[0]: smMargin[1]}
                    yDomain={domainY}
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

</style>