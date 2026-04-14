    <script>
    
    import { Plot, Dot, Text, RectX, AxisX } from 'svelteplot';
    import { format } from "d3-format";
    import { timeParse, timeFormat} from "d3-time-format"
    import * as d3 from 'd3';
    import { symbolAsterisk, symbolDiamond2, symbolPlus, symbolSquare2, symbolTriangle2, symbolX as symbolTimes, symbolCircle, symbolCross, symbolDiamond, symbolSquare, symbolStar, symbolTriangle, symbolWye } from 'd3-shape';
    import { onMount, untrack } from 'svelte';
    import { 
        wrap,
        getContinuousDomain,
        getCategoricalDomain, 
        getChartHeight,
        getAxisMargin,
    } from '../js/utils';
    import { ONScolours, ONSpalette, oldONSpalette } from '../js/colours'
    import Legend from "./shared/Legend.svelte"

    const type = 'scatter'

    let defaultColours = {
        simple: ONSpalette,
        binned: ONSpalette,
        force: ONSpalette
    }

	let { 
        data, 
        size,
        width,
        highlighted = null,
        smGridPosition,
        smKey,
        xKey = "x", 
        yKey = Object.keys(data[0]).includes('y') && smKey != 'y' ? 'y' : null,
        rKey = Object.keys(data[0]).includes('r') && variant != 'binned' ? 'r' : null,
        zKey = Object.keys(data[0]).includes('z') && smKey != 'z' ? 'z' : null,
        idKey = Object.keys(data[0]).includes('id') ? 'id' : null,
        variant = yKey ? "simple" : "force",
        xAxisLabel,
        yAxisLabel, 
        xDomain = "auto",
        xFormat = ".0f",
        yDomain = "auto",
        yAxisTicks,
        yFormat = ",.0f",
        rDomain,
        rRange,
        ySort,
        ySortKey,
        otherLegendLabel = "Other categories",
        tooltip = true,
        height,
        aspectRatio = [4,3],
        seriesHeight = 200,
        radius = variant == 'simple' ? 4.5 : 4,
        padding = -3,
        numberBins = 75,
        addBackground = true,
        margin = {left: variant == 'simple' ? null : 20, top: yAxisLabel ? 40 : 10, bottom: 0, right: 20}, 
        colours = defaultColours[variant],
        symbols = !rKey && yKey ? ['circle', 'square', 'triangle', 'diamond2', 'circle', 'square', 'triangle', 'diamond2'] : ['circle','circle','circle','circle','circle','circle','circle','circle'],
        children
    } = $props();

    let plotEl = $state();
    let tooltipData = $state();
    let leaveTimeout;

    let domainY = $derived(variant == 'simple' ? getContinuousDomain({
        chartType: type,
        data: data, 
        variant: variant, 
        valueKey: yKey, 
        xDomain: xDomain
    }) : getCategoricalDomain({
        data: data, 
        variant: variant, 
        sort: ySort, 
        sortKey: ySortKey, 
        valueKey: xKey, 
        categoryKey: yKey, 
        groupKey: zKey
    }))

    let domainX = $derived(getContinuousDomain({
        chartType: type,
        data: data, 
        variant: variant, 
        valueKey: xKey, 
        xDomain: yDomain
    }))

    let yAxisMargin = $derived(margin.left ? margin.left : getAxisMargin({domain: domainY, format: yFormat})+10)
    let categories = $derived(zKey ? [...new Set(data.map((d) => d[zKey]))] : null)

    let chartHeight = $derived(height ? height : variant == "simple" ? getChartHeight({data: data, width: width, aspectRatio: aspectRatio, variant: variant}) : getChartHeight({data: data, seriesHeight: seriesHeight, categoryKey: yKey, variant: variant}))

    let styleScheme = $derived.by(() => {
        let obj = {}
        if(highlighted){
            obj[highlighted] = {fill: Array.isArray(colours) ? colours[0] : colours, symbol: Array.isArray(symbols) ? symbols[0] : symbols, stroke: ONScolours.highlightOrange, strokeWidth: 8}
            if(!categories){
                obj[otherLegendLabel] = {fill: Array.isArray(colours) ? colours[0] : colours, symbol: Array.isArray(symbols) ? symbols[0] : symbols}
            }
        }
        if(categories){
            categories.forEach((category, i) => obj[category] = {fill: Array.isArray(colours) ? i > 3 ? ONScolours.white : colours[i] : colours, stroke: Array.isArray(colours) ? i > 3 ? colours[i] : null : colours, symbol: Array.isArray(symbols) ? symbols[i] : symbols })
        }
        if(highlighted && zKey){
                let matchedItem = data.filter((d) => d[idKey] == highlighted)[0][zKey]
                obj[highlighted].fill = obj[matchedItem].fill
                obj[highlighted].symbol = obj[matchedItem].symbol
        }
        return Object.keys(obj).length === 0 ? null : obj
    })

    let dodgeY = $derived.by(() => {
        if(variant != 'simple'){
            if(variant == 'binned' || variant == 'binned-diverging'){
                return 'bottom'
            } else{
                return 'middle'
            }
        } else{
            return null
        }
    })

    let bins = $derived.by(() => {
        if(variant == "binned"){
            let binSize = Math.abs(domainX[1] - domainX[0])/numberBins
            let binsArr = []
            for(let i = 0; i < numberBins; i++){
                binsArr.push(domainX[0] + (i * binSize))
            }
            return binsArr;
        } else{
            return null
        }
    })

    let dots = $derived.by(() => {
        if(variant == 'binned' && numberBins){
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
                derivedData.push({...d, code: d[idKey].replace(/[^A-Z0-9\s]+|\s+/ig, ""), binX})
            })
            return derivedData
        } else{
            return data
        }
    })

    $effect(() => {
        if (dots && plotEl && variant != 'simple'){
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

{#if styleScheme}
    <Legend items={styleScheme}/>
{/if}

<div bind:this={plotEl}>
<Plot
    marginLeft={yAxisMargin}
    marginRight={margin.right ? margin.right : null}
    marginTop={margin.top ? margin.top : null}
    marginBottom={margin.bottom ? margin.bottom : null}
    height = {chartHeight} 
    x={{ 
        domain: domainX, 
        label:xAxisLabel ? xAxisLabel : "",
        grid: true,
        tickFormat: (d) => xFormat ? format(xFormat)(d) : d
    }}
    y={{ 
        domain: variant == 'simple' ? domainY : null, 
        axis: variant == 'simple' ? 'left' : null,
        grid: variant == 'simple' ? true : false,
        label: yAxisLabel ? yAxisLabel : "",
        tickFormat: (d) => yFormat ? format(yFormat)(d) : d,
    }}
    fy={{ 
        axis: null,
        domain: variant == 'simple' ?  null : domainY, 
        tickSpacing: 10, 
        ticks: []
        // tickFormat: () => ""
    }} 
    r={{ 
        range: rRange ? rRange : null,
        domain: rDomain ? rDomain : null,
    }}
    >

    {#if addBackground && variant != 'simple'}
        {#each domainY as tick}
            <RectX
                y1={0}
                y2={seriesHeight}
                fy={tick}
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
                fy={tick}
                textAnchor='start'
                text={tick}
            />
        {/each}
    {/if}

    <Dot
        data={dots}
        x={variant == 'binned' ? 'binX' : xKey}
        y={variant == 'simple' ? yKey : 0}
        fy={variant == 'simple' ? null : yKey}
        r={rKey && variant != 'binned' ? rKey : radius} 
        dotClass={(d) => idKey ? d[idKey] == highlighted ? d[idKey].replace(/[^A-Z0-9\s]+|\s+/ig, "") + ' highlighted' : d[idKey].replace(/[^A-Z0-9\s]+|\s+/ig, "") : ''}
        dodgeY={variant != 'simple' ? { anchor: dodgeY, padding: padding} : null}         
        fill={(d) => {
            if(categories){
                return styleScheme[d[zKey]].fill
            } else{
                return Array.isArray(colours) ? colours[0] : colours
            }
        }}
        stroke={(d) => {
            if(idKey){
                if(d[idKey] == highlighted){
                    return styleScheme[highlighted].stroke
                } else if(categories){
                    if(styleScheme[d[zKey]].stroke){
                        return styleScheme[d[zKey]].stroke
                    } else{
                        return ONScolours.white
                    }
                } else{
                    return ONScolours.white
                }
            } else{
                return ONScolours.white
            }
        }}
        strokeWidth={(d) => {
            if(idKey){
                if(d[idKey] == highlighted){
                    return styleScheme[highlighted].strokeWidth
                } else if(categories){
                    if(styleScheme[d[zKey]].stroke){
                        return 3
                    } else{
                        return 1
                    }
                } else{
                    return 1
                }
            } else{
                return 1
            }
        }}
        symbol={(d) => categories ? styleScheme[d[zKey]].symbol : Array.isArray(symbols) ? symbols[0] : symbols}
        onpointerenter={(evt, d) => {
            if(tooltip) {
                clearTimeout(leaveTimeout);
                tooltipData = {x: evt.layerX, y: evt.layerY, data: d}

                d3.select(plotEl).selectAll(".point-highlight").remove();
                  // Select all matching elements and clone them as highlights
                d3.select(plotEl).selectAll('.'+d[idKey].replace(/[^A-Z0-9\s]+|\s+/ig, ""))
                    .clone(true)
                    .attr("class", "point-highlight")
                    .attr("fill", "none")
                    .style("pointer-events", "none")
                    .style("stroke", ONScolours.grey100)
                    .style("stroke-width", 4)
                    .raise();
            }
        }}
        onpointerleave={() => {
            if(tooltip){
                leaveTimeout = setTimeout(() => {
                    d3.select(plotEl).selectAll(".point-highlight").remove();
                    tooltipData = null
                }, 300)
            }
        }}
    />

    {#snippet overlay()}
        {#if tooltipData}
            {@const isPastMidpoint = tooltipData.data[xKey] > (domainX[0] + domainX[1]) / 2}
            <div 
                class="tooltip"
                style:left="{tooltipData.x}px"
                style:top="{tooltipData.y}px"
                style:transform={isPastMidpoint ? 'translate(-100%, -50%)' : 'translate(10px, -50%)'}
                style:width="max-content"
            >
                {#if idKey}
                    <div class="identifier">{tooltipData.data[idKey]}</div>
                {/if}
                <div class="group">{tooltipData.data[zKey]}</div>
                {#if variant == 'simple'}
                    <div class="value">{yAxisLabel ? yAxisLabel+": "+d3.format(yFormat)(tooltipData.data[yKey]) : d3.format(yFormat)(tooltipData.data[yKey])}</div>
                {:else}
                    <div class="group">{tooltipData.data[yKey]}</div>
                {/if}
                <div class="value">{xAxisLabel ? xAxisLabel+": "+d3.format(xFormat)(tooltipData.data[xKey]) : d3.format(xFormat)(tooltipData.data[xKey])}</div>
            </div>
        {/if}
    {/snippet}
</Plot>
</div>