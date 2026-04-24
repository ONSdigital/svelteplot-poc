<script>

    import BarChart from "./BarChart.svelte";
    import LineChart from "./LineChart.svelte";
    import DotChart from "./DotChart.svelte";
    import Legend from "./shared/Legend.svelte";

    import { 
        getCategoricalDomain, 
        getContinuousDomain, 
        getAxisMargin,
        getChartHeight
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
        chartEvery = 2,
        chartGap = 5,
        type
    } = $props();

    let smKeys = $derived(props.smKey || Object.keys(props.data[0]).includes('sm') ? {
      smKey: props.smKey ? props.smKey : Object.keys(props.data[0]).includes('sm') ? 'sm': null,
      zKey: props.zKey ? props.zKey : (Object.keys(props.data[0]).includes('z') && props.smKey != 'z' ) ? 'z': null,
      xKey: props.xKey ? props.xKey : Object.keys(props.data[0]).includes('x') ? 'x': null,
      yKey: props.yKey ? props.yKey : Object.keys(props.data[0]).includes('y') ? 'y': null,
      ciKeys: props.ciKeys ? props.ciKeys : Object.keys(props.data[0]).includes('uci') && Object.keys(props.data[0]).includes('lci') ? ['lci', 'uci'] : null,
    } : null)

    let smOptions = $derived({
        bar: {
            scaleX: 'continuous',
            scaleY: 'categorical',
            variant: props.variant ? props.variant : 'simple',
            xDomain: props.xDomain ? props.xDomain : 'auto',
            xFormat: props.xFormat ? props.xFormat : ',.0f',
            ySort: props.ySort ? props.ySort : null,
            ySortKey: props.ySortKey ? props.ySortKey : null
        },
        dot: {
            scaleX: 'continuous',
            scaleY: 'categorical',
            variant: props.variant ? props.variant : 'simple',
            xDomain: props.xDomain ? props.xDomain : 'auto',
            xFormat: props.xFormat ? props.xFormat : ',.0f',
            ySort: props.ySort ? props.ySort : null,
            ySortKey: props.ySortKey ? props.ySortKey : null
        },
        line: {
            scaleX: 'categorical',
            scaleY: 'continuous',
            variant: props.variant ? props.variant : 'simple',
            xDomain: props.xDomain ? props.xDomain : 'auto',
            xFormat: props.xFormat ? props.xFormat : '.0f',
            yDomain: props.yDomain ? props.yDomain : 'auto',
            yFormat: props.yFormat ? props.yFormat : ",.0f",
            aspectRatio: props.aspectRatio ? props.aspectRatio : [1,1],
            height: props.height ? props.height : null
        },
        scatter: {
            scaleX: 'continuous',
            scaleY: (!props.variant || props.variant == "simple") ? 'continuous' : 'categorical',
            variant: props.variant ? props.variant : 'simple',
            xDomain: props.xDomain ? props.xDomain : 'auto',
            xFormat: props.xFormat ? props.xFormat : ',.0f',
            yDomain: () => {
                if(!props.variant || props.variant == "simple"){
                    return props.yDomain ? props.yDomain : null
                }else{
                    return props.yDomain ? props.yDomain : 'auto'
                }
            },
            yFormat: props.yFormat ? props.yFormat : ',.0f',
            ySort: props.ySort ? props.ySort : null,
            ySortKey: props.ySortKey ? props.ySortKey : null,
            aspectRatio: props.aspectRatio ? props.aspectRatio : [1,1],
            height: props.height ? props.height : null
        }
    })

    let smData = $derived.by(() => {
        if(smKeys.smKey){
            return groupData(props.data, smKeys.smKey)
        }
        else{
            return null;
        }
    })

    let categories = $derived(props.zKey && props.variant != "simple" ? new Set(data[Object.keys(data)[0]].map((d) => d[props.zKey])) : null)

    // let legendItems = $derived(getLegendItems({
    //     chartType: type,
    //     variant: props.variant,
    //     categories: categories,
    //     colours: colours,
    //     highlighted: typeof props.highlighted !== 'undefined' ? null : props.highlighted,
    //     referenceCategory: typeof props.referenceCategory !== 'undefined' ? null : props.referenceCategory,
    //     otherLegendLabel: typeof props.otherLegendLabel !== 'undefined' ? null : props.otherLegendLabel,
    // }))

    let legendItems = null

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

    let domainX = $derived.by(() => {
        if(smKeys.smKey){
            if(smOptions[type].scaleX == 'continuous'){
                if(Array.isArray(smOptions[type].xDomain)){
                    return smOptions[type].xDomain
                } else{
                    return getContinuousDomain({
                        chartType: type,
                        data: allData,
                        variant: smOptions[type].variant,
                        categoryKey: smKeys.yKey,
                        valueKey: smKeys.xKey,
                        domain: smOptions[type].xDomain,
                        ciKeys: smKeys.ciKeys
                    })
                }
            } else if(smOptions[type].scaleX == 'categorical'){
                if(Array.isArray(smOptions[type].yDomain)){
                    return smOptions[type].yDomain
                } else{
                    return getCategoricalDomain({
                        data: data[Object.keys(data)[0]], 
                        variant: smOptions[type].variant, 
                        sort: smOptions[type].ySort ? smOptions[type].ySort : null, 
                        sortKey: smOptions[type].ySortKey ? smOptions[type].ySortKey : null, 
                        valueKey: smKeys.xKey, 
                        categoryKey: smKeys.yKey, 
                        groupKey: smKeys.zKey
                    })
                }
            }
        } else{
            return null
        }
    })

    let domainY = $derived.by(() => {
        if(smKeys.smKey){
            if(smOptions[type].scaleY == 'continuous'){
                if(Array.isArray(smOptions[type].yDomain)){
                    return smOptions[type].yDomain
                } else{
                    return getContinuousDomain({
                        chartType: type,
                        data: allData,
                        variant: smOptions[type].variant,
                        categoryKey: smKeys.xKey,
                        valueKey: smKeys.yKey,
                        domain: smOptions[type].yDomain,
                        ciKeys: smKeys.ciKeys
                    })
                }
            } else if(smOptions[type].scaleY == 'categorical'){
                if(Array.isArray(smOptions[type].yDomain)){
                    return smOptions[type].yDomain
                } else{
                    return getCategoricalDomain({
                        data: allData, 
                        variant: smOptions[type].variant, 
                        sort: smOptions[type].ySort, 
                        sortKey: smOptions[type].ySortKey, 
                        valueKey: smKeys.xKey, 
                        categoryKey: smKeys.yKey, 
                        groupKey: smKeys.zKey
                    })
                }
            }
        } else{
            return null
        }
    })
    let yAxisMargin = $derived(margin.left ? margin.left : getAxisMargin({domain: domainY}))

    let smMargin = $derived([
        {left: yAxisMargin, right: margin.right, top: margin.top, bottom: margin.bottom},
        {left: chartGap, right: margin.right, top: margin.top, bottom: margin.bottom}
    ])

    let itemWidth = $derived(((width-yAxisMargin-margin.right) - (chartGap*(chartEvery-1))) / chartEvery)
    let chartHeight = $derived(smOptions[type].height ? smOptions[type].height : smOptions[type].aspectRatio ? getChartHeight({width: itemWidth, aspectRatio: smOptions[type].aspectRatio}) : null)

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
                    xDomain={domainX}
                    smGridPosition = {i % chartEvery}
                    height={chartHeight}
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