<script>
    import { Plot, Dot, Text, RectX, HTMLTooltip } from 'svelteplot';
    import { format } from "d3-format";
    import { timeParse, timeFormat} from "d3-time-format"
    import * as d3 from 'd3';
    import { onMount } from 'svelte';
    import { 
        getCategoricalDomain, 
        getContinuousDomain, 
        groupData, 
        stackData, 
        labelPixelWidth, 
        getChartHeight, 
        getSeriesHeight,
        getAxisMargin 
    } from '../js/utils';
    import { ONScolours, ONSpalette, oldONSpalette } from '../js/colours'
    import Legend from "./shared/Legend.svelte"

    let defaultColours = [ONScolours.oceanBlue]

	let { 
        data, 
        size,
        width,
        variant = "force",
        highlighted = null,
        smGridPosition,
        smKey,
        xKey = "x", 
        yKey = "y",
        zKey = "z",
        xAxisLabel,
        yAxisLabel, 
        xDomain = "auto",
        xFormat,
        xFormatDate,
        xAxisTicks,
        yDomain,
        yFormat,
        yFormatDate,
        zFormat,
        zFormatDate,
		ySort,
        zSortKey, 
        dataLabels,
        tooltip,
        height,
        seriesHeight = 200,
        radius = 4,
        padding = -3.5,
        numberBins = 75,
        hover = false,
        margin = {top: 0, bottom: 0, right: 20, left: 20}, 
        colours = defaultColours,
        children
    } = $props();

    let hovered = $state();

    let plotEl = $state();

    let categories = $derived(yKey ? new Set(data.map((d) => d[yKey])) : null)

    let colourLookup = $derived.by(() => {
        let coloursvar;
        if(colours.length > 1){
            coloursvar = {}
            let i = 0
            categories.forEach((category) => {
                coloursvar[category] = colours[i]
                i = i+1
            })
        } else{
            coloursvar = null
        }
        return coloursvar
    })

    let domainX = $derived(getContinuousDomain({
        data: data,
        variant: variant,
        categoryKey: yKey,
        valueKey: xKey,
        xDomain: xDomain
    }))

    let chartHeight = $derived(height ? height : getChartHeight({data: data, seriesHeight: seriesHeight, categoryKey: yKey, groupKey: zKey, variant: variant}))

    let barHeight = $derived(seriesHeight ? seriesHeight : getSeriesHeight({data: data, height: height, categoryKey: yKey, groupKey: zKey, variant: variant}))

    let domainY = $derived(!yKey ? null : yDomain ? yDomain : getCategoricalDomain({
        data: data, 
        variant: variant, 
        sort: ySort, 
        sortKey: zSortKey, 
        valueKey: xKey, 
        categoryKey: yKey, 
        groupKey: zKey
    }))

    let yAxisMargin = $derived(margin.left ? margin.left : getAxisMargin({domain: domainY}))

    let bins = $derived.by(() => {
        if(variant == 'force'){
            return null
        } else{
            let binSize = Math.abs(domainX[1] - domainX[0])/numberBins
            console.log(binSize)
            let binsArr = []
            for(let i = 0; i < numberBins; i++){
                binsArr.push(domainX[0] + (i * binSize))
            }
            return binsArr;
        }
    })

    let dodgeY = $derived.by(() => {
        if(variant == 'binned' || variant == 'binned-diverging'){
            return 'bottom'
        } else{
            return 'middle'
        }
    })

    let dots = $derived.by(() => {
        const binSize = bins ? Math.abs(domainX[1] - domainX[0]) / numberBins : null
        let derivedData = []
        data.forEach((d) => {
            let binX = null
            if (bins && binSize) {
                const binIndex = Math.min(
                    Math.floor((d[xKey] - domainX[0]) / binSize),
                    numberBins - 1
                )
                binX = bins[binIndex] + binSize / 2
            }
            derivedData.push({...d, r: d[zKey] == highlighted ? 1 : 0, binX})
        })
        return derivedData
    })

    $effect(() => {
        if (dots && plotEl){
            d3.select(plotEl).selectAll('.axis-y').attr('display','none')
        }
    })

    $effect(() => {
        if(highlighted){
            setTimeout(() => {
                d3.select(plotEl).selectAll(".highlighted").raise()
            }, 100);
        }
    })

</script>

<!-- {#if categories && !smKey && colourLookup}
    <Legend {categories} {colourLookup}/>
{/if} -->


<div bind:this={plotEl}>

<Plot 
    marginLeft={yAxisMargin}
    marginRight={margin.right ? margin.right : null}
    marginTop={margin.top ? margin.top : null}
    marginBottom={margin.bottom ? margin.bottom : null}
    height = {chartHeight} 
    {width}
    y={{
        domain: null,
    }}
    fy={{ 
        axis: null,
        domain: domainY ? domainY : null, 
        tickSpacing: 10, 
        ticks: []
        // tickFormat: () => ""
    }} 
    x={{ 
        domain: domainX, 
        label:xAxisLabel ? xAxisLabel : "",
        tickFormat: (d) => xFormatDate ? timeFormat(xFormat)(timeParse(xFormatDate)(d)) : xFormat ? format(xFormat)(d) : d,
        grid: true
    }}
    r={{
        range: highlighted ? [radius, radius+2] : [radius, radius],
        domain: [0,1]
    }}
    color={{ 
        // legend: variant == "clustered" || variant == "stacked" ? true : false,
        scheme: colours
    }}
>
    {#each categories as category}
        <RectX
            y1={0}
            y2={seriesHeight}
            fy={category}
            insetTop={-2}
            insetBottom={-2}
            insetLeft={-margin.left}
            insetRight={-margin.right}
            fill={ONScolours.grey20}
            opacity={0.25}
        />
        <Text
            x={domainX[0]}
            dy={-(seriesHeight/2) + 25}
            fy={category}
            textAnchor='start'
            text={category}
        />
    {/each}
    <Dot
        data={dots}
        x={variant == 'force' ? xKey : 'binX'}
        y={0}
        fy={yKey}
        dotClass={(d) => d[zKey] == highlighted ? 'highlighted' : ''}
        r={radius}
        dodgeY={{ anchor: dodgeY, padding: padding}}
        fill={(d) => {
            let colour;
            if(colourLookup){
                colour = colourLookup[d[yKey]]
            } else{
                colour = colours[0]
            }
            return colour
        }} 
        stroke={(d) => d[zKey] == highlighted ? ONScolours.highlightOrange : ONScolours.white}
        strokeWidth={(d) => {
            if(highlighted && d[zKey] == highlighted){
                return 8
            } else{
                return 1
            }
        }}
    />

    {#if children}
        {@render children()}
    {/if}
</Plot>
</div>

<style>
    :global(.dot path){
        paint-order: stroke fill;
    }
</style>