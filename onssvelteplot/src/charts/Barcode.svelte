<script>
    import { Plot, RuleX, TickX, AxisX, Text } from 'svelteplot';
    import { format } from "d3-format";
    import { timeParse, timeFormat} from "d3-time-format"
    import * as d3 from 'd3';
    import { onMount, tick } from 'svelte';
    import { 
        getCategoricalDomain, 
        getContinuousDomain, 
        groupData, 
        stackData, 
        labelPixelWidth, 
        getChartHeight, 
        getSeriesHeight,
        getAxisMargin,
        getTooltipData
    } from '../js/utils';
    import { ONScolours, ONSpalette, oldONSpalette } from '../js/colours'
    import Legend from "./shared/Legend.svelte"
    import Tooltip from "./shared/Tooltip.svelte"

    let defaultColours = [ONScolours.oceanBlue]

	let { 
        data, 
        size,
        width,
        variant = "simple",
        highlighted = null,
        legendItemLabel = "Local authorities",
        smGridPosition,
        smKey,
        xKey = "x", 
        yKey = "y",
        zKey = Object.keys(data[0]).includes('z') && smKey != 'z' ? 'z' : null,
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
        seriesHeight = 75,
        hover = false,
        margin = {top: 0, bottom: 0, right: 20}, 
        colours = defaultColours,
        children
    } = $props();

    let plotEl = $state();
    let tooltipData = $state();

    let categories = $derived(new Set(data.map((d) => d[yKey])))

    let colourLookup = $derived.by(() => {
        let coloursvar;
        coloursvar = {}
        let i = 0
        if(colours.length == 1){
            coloursvar[legendItemLabel] = colours
        }
        else{
            categories.forEach((category) => {
                coloursvar[category] = colours[i]
                i = i+1
            })
        }
        if(highlighted){
            coloursvar[highlighted] = ONScolours.highlightOrange
        }
        return coloursvar
    })

    let legendCategories = $derived.by(() => {
        const coloursLength = Object.keys(colourLookup).length
        if(coloursLength == 1){
            return null
        } else if(colours.length == 1 && highlighted){
            return [legendItemLabel, highlighted]
        } else{
            return [...categories, highlighted]
        }
    })

    let domainX = $derived(getContinuousDomain({
        data: data,
        variant: variant,
        categoryKey: yKey,
        valueKey: xKey,
        xDomain: xDomain
    }))

    let chartHeight = $derived(height ? height : getChartHeight({data: data, seriesHeight: seriesHeight, categoryKey: yKey, groupKey: null, variant: variant}))

    let domainY = $derived(yDomain ? yDomain : getCategoricalDomain({
        data: data, 
        variant: variant, 
        sort: ySort, 
        sortKey: zSortKey, 
        valueKey: xKey, 
        categoryKey: yKey, 
        groupKey: zKey
    }))

    let yAxisMargin = $derived(margin.left ? margin.left : getAxisMargin({domain: domainY}))
    
    let bars = $derived.by(() => {
        let derivedData = []
        data.forEach((d) => {
            derivedData.push({...d, code: d[zKey].replace(/[^A-Z0-9\s]+|\s+/ig, "") + d[yKey].replace(/[^A-Z0-9\s]+|\s+/ig, "")})
        })
        return derivedData
    })

    $effect(() => {
        if(highlighted){
            setTimeout(() => {
                tickHighlightHover()
                d3.select(plotEl).selectAll(".highlighted").raise()
            }, 100);
        }
    })

    function tickHighlightHover(){
        let lines = d3.select(plotEl).select(".tick-x").selectAll("*")
        lines.each(function (d, i){
            let mouseoutTimer;
            const barClass = "barcode" + bars[i][yKey].replace(/[^A-Z0-9\s]+|\s+/ig, "")
            
            d3.select(this).attr("class", bars[i][zKey] == highlighted ? bars[i].code + " highlighted" : bars[i].code + " " + barClass)
            
            d3.select(this).on("mouseover", function(evt) {
                clearTimeout(mouseoutTimer)
                tooltipData = getTooltipData(evt,bars[i])
                if(bars[i][zKey] != highlighted){
                    d3.selectAll("." + barClass).classed("unfocus", true)
                    d3.select(this).classed("unfocus", false).classed("hovered", true).raise()
                }
            })
            
            d3.select(this).on("mouseout", function() {
                mouseoutTimer = setTimeout(() => {
                    d3.selectAll("." + barClass).classed("unfocus", false).classed("hovered", false)
                    tooltipData = null;
                }, 300)
            })
        })
    }

    onMount(() => {
        tickHighlightHover()
    })


</script>

{#if categories && !smKey}
    <Legend categories={legendCategories} colourScheme={colourLookup}/>
{/if}

<div bind:this={plotEl}>

<Plot 
    marginLeft={yAxisMargin}
    marginRight={margin.right ? margin.right : null}
    marginTop={margin.top ? margin.top : null}
    marginBottom={margin.bottom ? margin.bottom : null}
    height = {chartHeight + 27} 
    {width}
    y={{ 
        axis: 'left',
        domain: domainY, 
        tickSpacing: 10,
        padding: 0.3, 
        label: yAxisLabel ? yAxisLabel : "",
        tickFormat: (d) => smGridPosition > 0 ? "" : yFormatDate ? timeFormat(yFormat)(timeParse(yFormatDate)(d)) : yFormat ? format(yFormat)(d) : d
    }} 
    x={{ 
        domain: domainX, 
        label:xAxisLabel ? xAxisLabel : "",
        tickFormat: (d) => xFormatDate ? timeFormat(xFormat)(timeParse(xFormatDate)(d)) : xFormat ? format(xFormat)(d) : d,
        grid: true
    }}
    color={{ 
        // legend: variant == "clustered" || variant == "stacked" ? true : false,
        scheme: colours
    }}
>
    <AxisX tickCount={xAxisTicks}/>
    <!-- <RuleX data={[0]} /> -->
    <TickX 
        data={bars} 
        y={yKey} 
        x={xKey}
        inset={(d) => d[zKey] == highlighted ? 0 : 6}
        dy={(d) => d[zKey] == highlighted ? -6 : 0}
        class='barcode'
        stroke={(d) => {
            let colour;
            if(d[zKey] == highlighted){
                colour = ONScolours.highlightOrange
            } else if(colours.length > 1){
                colour = colourLookup[d[yKey]]
            } else{
                colour = colours[0]
            }
            return colour
        }} 
        strokeWidth={(d) => (d[zKey] == highlighted ? 3 : 1)}
    />
    {#if highlighted}
        <Text
            data={bars.filter((d) => d[zKey] == highlighted)}
            x={xKey}
            y={yKey}
            dx={(d) => d[xKey] > (domainX[0] + domainX[1]) / 2 ? -5 : 5}
            dy={-seriesHeight*0.3 - 6}
            textClass="dataLabel"
            fill={ONScolours.highlightOrangeDark}
            textAnchor={(d) => d[xKey] > (domainX[0] + domainX[1]) / 2 ? 'end' : 'start'}
            text={(d) => xFormat ? format(xFormat)(d[xKey]) : d[xKey]}
        />
    {/if}

    {#snippet overlay()}
        {#if tooltipData}
            <Tooltip
                isPastMidpoint = {tooltipData.data[xKey] > (domainX[0] + domainX[1]) / 2}
                x={tooltipData.x}
                y={tooltipData.y}
            >
                <div class="tooltip-identifier">{tooltipData.data[zKey]}</div>
                <div class="tooltip-values">
                    {#if smKey}
                        <div>{tooltipData.data[smKey]}</div>
                    {/if}
                    <div>{tooltipData.data[yKey]}</div>
                    <div>{xAxisLabel ? xAxisLabel+": "+d3.format(xFormat)(tooltipData.data[xKey]) : d3.format(xFormat)(tooltipData.data[xKey])}</div>
                </div>
            </Tooltip>
        {/if}
    {/snippet}

    {#if children}
        {@render children()}
    {/if}
</Plot>

</div>

<style>

:global(.hovered){
    stroke: #003c57 !important;
    stroke-width: 3px !important;
}
:global(.unfocus){
    stroke: #C6C6C6 !important;
    stroke-width: 1px !important;
}

</style>