<script>

    import BarChart from "./BarChart.svelte";
    import LineChart from "./LineChart.svelte";
    import DotChart from "./DotChart.svelte";
    import Legend from "./shared/Legend.svelte";

    import { 
        getCategoricalDomain, 
        getContinuousDomain, 
        getAxisMargin, 
        getLegendItems
    } from '../js/utils';
    import { ONScolours, ONSpalette, oldONSpalette } from '../js/colours'

    let defaultColours = {
        simple: [ONScolours.positive, ONScolours.negative],
        clustered: oldONSpalette,
        stacked: ONSpalette
    }

    let {
        props,
        data,
        size,
        width,
        margin = {right: 10, top: 0, bottom: 0},
        chartEvery = 3,
        chartGap = 5,
        type
    } = $props();

    let itemWidth = $derived(((width-yAxisMargin-margin.right) - (chartGap*(chartEvery-1))) / chartEvery)

    let categories = $derived(props.zKey && props.variant != "simple" ? new Set(data[Object.keys(data)[0]].map((d) => d[props.zKey])) : null)

    let colours = $derived(props.colours ? props.colours : defaultColours[props.variant])

    let legendItems = $derived(getLegendItems({
        chartType: type,
        variant: props.variant,
        categories: categories,
        colours: colours,
        highlighted: typeof props.highlighted !== 'undefined' ? null : props.highlighted,
        referenceCategory: typeof props.referenceCategory !== 'undefined' ? null : props.referenceCategory,
        otherLegendLabel: typeof props.otherLegendLabel !== 'undefined' ? null : props.otherLegendLabel,
    }))

    let domainY = $derived(type == 'bar' && !props.yDomain ? getCategoricalDomain({
        data: data[Object.keys(data)[0]], 
        variant: props.variant, 
        sort: props.ySort, 
        sortKey: props.zSortKey, 
        valueKey: props.xKey ? props.xKey : 'x', 
        categoryKey: props.yKey ? props.yKey : 'y', 
        groupKey: props.zKey
    }) : null)

    let yAxisMargin = $derived(margin.left ? margin.left : getAxisMargin({domain: domainY}))

    let smMargin = $derived([
        {left: yAxisMargin, right: margin.right, top: margin.top, bottom: margin.bottom},
        {left: chartGap, right: margin.right, top: margin.top, bottom: margin.bottom}
    ])

    let allData = $derived.by(() => {
        let dataArr = []
        let keys = Object.keys(data)
        keys.forEach((key) => {
            data[key].forEach((d) => {
                dataArr.push(d)
            })
        })
        return dataArr
    })

    let domainX = $derived(getContinuousDomain({
        data: allData,
        variant: props.variant ? props.variant : 'simple',
        categoryKey: props.yKey ? props.yKey : 'y',
        valueKey: props.xKey ? props.xKey : 'x',
        groupKey: props.smKey ? props.smKey : null,
        xDomain: props.xDomain
    }))

</script>

<Legend items={legendItems}/>

<div class="flex">
    {#each Object.keys(data) as group, i}
        <div 
            class="item"
            width={i % chartEvery == 0 ? itemWidth + yAxisMargin : i % chartEvery == chartEvery ? itemWidth + chartGap + margin.right : itemWidth + chartGap}>
            <div class="title" style:margin-left={i % chartEvery == 0 ? smMargin[0].left+"px": smMargin[1].left+"px"}>{group}</div>
            {#if type.toLowerCase() === "bar"}
                <BarChart 
                    width={i % chartEvery == 0 ? itemWidth + yAxisMargin : i % chartEvery == chartEvery ? itemWidth + chartGap + margin.right : itemWidth + chartGap}
                    {...props} 
                    data={data[group]}
                    margin={i % chartEvery == 0 ? smMargin[0]: smMargin[1]}
                    yDomain={domainY}
                    xDomain={domainX}
                    smGridPosition = {i % chartEvery}
                />
            {:else if type.toLowerCase() === "line"}
                <LineChart 
                    width={i % chartEvery == 0 ? itemWidth + yAxisMargin : i % chartEvery == chartEvery ? itemWidth + chartGap + margin.right : itemWidth + chartGap}
                    {...props} 
                    data={data[group]}
                    margin={i % chartEvery == 0 ? smMargin[0]: smMargin[1]}
                    yDomain={domainY}
                    smGridPosition = {i % chartEvery}
                />
            {:else if type.toLowerCase() === "dot"}
                <DotChart 
                    width={i % chartEvery == 0 ? itemWidth + yAxisMargin : i % chartEvery == chartEvery ? itemWidth + chartGap + margin.right : itemWidth + chartGap}
                    {...props} 
                    data={data[group]}
                    margin={i % chartEvery == 0 ? smMargin[0]: smMargin[1]}
                    yDomain={domainY}
                    xDomain={domainX}
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