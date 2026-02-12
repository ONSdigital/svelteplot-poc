<script>

    import BarChart from "./BarChart.svelte";
    import Legend from "./shared/Legend.svelte";

    import { getCategoricalDomain } from '../js/utils';
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
        margin = {left: 160, right: 10, top: 0, bottom: 0},
        chartEvery = 3,
        chartGap = 5,
        type
    } = $props();

    let itemWidth = $derived(((width-margin.left-margin.right) - (chartGap*(chartEvery-1))) / chartEvery)
    let smMargin = $derived([
        margin,
        {left: chartGap, right: margin.right, top: margin.top, bottom: margin.bottom}
    ])

    $inspect(data)

    let categories = $derived(props.zKey && props.variant != "simple" ? new Set(data[Object.keys(data)[0]].map((d) => d[props.zKey])) : null)

    let colours = $derived(props.colours ? props.colours : defaultColours[props.variant])

    let colourScheme = $derived.by(() => {
        let coloursvar;
        if(categories){
            coloursvar = {}
            let i = 0
            categories.forEach((category) => {
                coloursvar[category] = colours[i]
                i = i+1
            })
        } else if(colours.length > 1){
            coloursvar = colours[0]
        } else{
            coloursvar = colours
        }
        return coloursvar
    })

    $inspect(itemWidth && props.variant != "simple" ? itemWidth : null)

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

<Legend {categories} {colourScheme}/>

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