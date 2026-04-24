    <script>
    
    import { Plot, AxisY, Line, Dot, Text, AreaY } from 'svelteplot';
    import { format } from "d3-format";
    import { timeParse, timeFormat} from "d3-time-format"
    import * as d3 from 'd3';
    import { symbolAsterisk, symbolDiamond2, symbolPlus, symbolSquare2, symbolTriangle2, symbolX as symbolTimes, symbolCircle, symbolCross, symbolDiamond, symbolSquare, symbolStar, symbolTriangle, symbolWye } from 'd3-shape';
    import { onMount, untrack } from 'svelte';
    import { 
        wrap,
        getCategoricalDomain, 
        getContinuousDomain, 
        getChartHeight,
        getAxisMargin,
        resolveDataLabelOverlap,
    } from '../js/utils';
    import { ONScolours, ONSpalette, oldONSpalette } from '../js/colours'
    import Legend from "./shared/Legend.svelte"

    const type = 'line'

    let defaultColours = {
        simple: ONSpalette,
    }

	let { 
        data, 
        size,
        width,
        variant = "simple",
        highlighted = null,
        referenceCategory,
        smGridPosition,
        smKey,
        xKey = "x", 
        yKey = "y",
        zKey = Object.keys(data[0]).includes('z') && smKey != 'z' ? 'z' : null,
        ciKeys = Object.keys(data[0]).includes('uci') && Object.keys(data[0]).includes('lci') ? ['lci', 'uci'] : null,
        xAxisLabel,
        yAxisLabel, 
        xDomain,
        xFormat = ".0f",
        xFormatDate,
        yDomain = "auto",
        yAxisTicks,
        yFormat = ",.0f",
        addEndMarkers = true,
        directLabels,
        addPointMarkers,
        otherLegendLabel = "Other categories",
        tooltip,
        height,
        aspectRatio = [16,9],
        margin = {top: 10, bottom: 0, right: directLabels && zKey ? null : 20}, 
        colours = defaultColours[variant],
        symbols = ['circle', 'square', 'diamond2', 'circle', 'square', 'diamond2'],
        children
    } = $props();

    let plotEl = $state()

    let chartHeight = $derived(height ? height : getChartHeight({data: data, width: width, aspectRatio: aspectRatio, variant: variant}))

    let domainY = $derived(Array.isArray(yDomain) ? yDomain : getContinuousDomain({
        chartType: 'line',
        data: data,
        variant: variant,
        categoryKey: xKey,
        valueKey: yKey,
        domain: yDomain,
        ciKeys: ciKeys
    }))

    let domainX = $derived(xDomain ? xDomain : getCategoricalDomain({
        data: data, 
        variant: variant, 
        valueKey: yKey, 
        categoryKey: xKey, 
        groupKey: zKey
    }))

    let yAxisMargin = $derived(margin.left ? margin.left : getAxisMargin({domain: domainY, format: yFormat})+10)

    let categories = $derived.by(() => {
        let categoryArray = []
        if(zKey){
            categoryArray = [...new Set(data.map((d) => d[zKey]))]
            if(highlighted){
                const highlightedIndex = categoryArray.findIndex(obj => obj === highlighted);
                if (highlightedIndex > -1) {
                    const [highlightedItem] = categoryArray.splice(highlightedIndex, 1);
                    categoryArray.unshift(highlightedItem);
                }
            
                if(referenceCategory){
                    const referenceIndex = categoryArray.findIndex(obj => obj === referenceCategory);
                    if (referenceIndex > -1) {
                        const [referenceItem] = categoryArray.splice(referenceIndex, 1);
                        categoryArray.splice(1, 0, referenceItem);
                    }
                }
            }
        } else{
            categoryArray = null
        }
        return categoryArray
    })

    let legend = $derived.by(() => {
        let obj = {}
        if(!categories & !ciKeys){
            return null;
        }
        if(highlighted){
            obj[highlighted] = {fill: ONScolours.oceanBlue, lineFill: ONScolours.oceanBlue, stroke: ONScolours.oceanBlue, symbol: Array.isArray(symbols) ? symbols[0] : symbols}
            obj[otherLegendLabel] = {fill: ONScolours.grey30, lineFill: ONScolours.grey30, stroke: ONScolours.grey30, symbol: Array.isArray(symbols) ? symbols[0] : symbols}
        }
        if(referenceCategory){
            obj[referenceCategory] = {fill: ONScolours.skyBlue, lineFill: ONScolours.skyBlue, stroke: ONScolours.skyBlue, symbol: Array.isArray(symbols) ? symbols[1] : symbols}
            obj[otherLegendLabel] = {fill: ONScolours.grey30, lineFill: ONScolours.grey30, stroke: ONScolours.grey30, symbol: Array.isArray(symbols) ? symbols[0] : symbols}
        }
        if(categories && !highlighted && !referenceCategory){
            if(categories.length > 6){
                obj[otherLegendLabel] = {fill: ONScolours.grey30, lineFill: ONScolours.grey30, stroke: ONScolours.grey30, symbol: Array.isArray(symbols) ? symbols[0] : symbols}
            } else if(!directLabels){
                categories.forEach((category, i) => obj[category] = {fill: i > 3 ? ONScolours.white : Array.isArray(colours) ? colours[i] : colours, lineFill:  Array.isArray(colours) ? colours[i] : colours, symbol: Array.isArray(symbols) ? symbols[i] : symbols, stroke: Array.isArray(colours) ? colours[i] : colours} )
            }
        }
        if(ciKeys){
            obj["95% confidence interval"] = {fill: categories ? ONScolours.grey30 : Array.isArray(colours) ? colours[0] : colours, symbol: 'square'}
        }
        return obj
    })

    let styleScheme = $derived.by(() => {
        let obj = {}
        if(!categories & !ciKeys){
            return null;
        }
        if(highlighted){
            obj[highlighted] = {fill: ONScolours.oceanBlue, lineFill: ONScolours.oceanBlue, stroke: ONScolours.oceanBlue, symbol: Array.isArray(symbols) ? symbols[0] : symbols}
        }
        if(referenceCategory){
            obj[referenceCategory] = {fill: ONScolours.skyBlue, lineFill: ONScolours.skyBlue, stroke: ONScolours.skyBlue, symbol: Array.isArray(symbols) ? symbols[1] : symbols}
        }
        if(categories){
            categories.forEach((category, i) => {
                if(category != highlighted && category != referenceCategory){
                    if(categories.length > 6 || highlighted){
                        obj[category] = {fill: ONScolours.grey30, lineFill: ONScolours.grey30, stroke: ONScolours.grey30, symbol: Array.isArray(symbols) ? symbols[0] : symbols}
                    } else{
                        obj[category] = {fill: i > 3 ? ONScolours.white : Array.isArray(colours) ? colours[i] : colours, lineFill:  Array.isArray(colours) ? colours[i] : colours, symbol: Array.isArray(symbols) ? symbols[i] : symbols, stroke: Array.isArray(colours) ? colours[i] : colours}
                    }
                }
            })
        }
        return obj
    })

    let marginRight = $derived(directLabels && zKey && !margin.right ? getAxisMargin({domain: highlighted && referenceCategory && categories.length > 6 ? [highlighted, referenceCategory] : highlighted && categories.length > 6 ? [highlighted] : categories}) + 15 : margin.right)

    let markerData = $derived.by(() => {
        let filtered = []
        if(highlighted){
            data.filter((d) => d[zKey] == highlighted).forEach((d) => {filtered.push(d)})
        }
        if(referenceCategory){
            data.filter((d) => d[zKey] == referenceCategory).forEach((d) => filtered.push(d))
        }
        if(!referenceCategory && !highlighted){
            filtered = data
        }
        return filtered
    })

    $effect(() => {
        if(data && margin && directLabels && zKey){
            d3.select(plotEl).selectAll(".dataLabel").call(wrap, marginRight)
        }
        if(data && (highlighted || referenceCategory)){
            d3.select(plotEl).selectAll(".reference").raise()
            d3.select(plotEl).selectAll(".highlighted").raise()
        }
    })

    $effect(() => {
        if(data && width){
            resolveDataLabelOverlap({container: plotEl, selector: ".dataLabel"});
        }
    })

</script>

{#if legend && !smKey}
    <Legend items={legend}/>
{/if}

<div bind:this={plotEl}>
<Plot
    marginLeft={yAxisMargin}
    marginRight={marginRight}
    marginTop={margin.top ? margin.top : null}
    marginBottom={margin.bottom ? margin.bottom : null}
    height = {chartHeight} 
    {width}
    x={{ 
        label:xAxisLabel ? xAxisLabel : "",
        tickFormat: (d) => xFormatDate ? timeFormat(xFormat)(timeParse(xFormatDate)(d)) : xFormat ? format(xFormat)(d) : d
    }}
    y={{ 
        domain: domainY, 
        axis: 'left',
        grid: true,
        label: yAxisLabel ? yAxisLabel : "",
        tickFormat: (d) => smGridPosition > 0 ? "" : yFormat ? format(yFormat)(d) : d,
    }}>

    {#if ciKeys}
        <AreaY
            data={markerData}
            x={xKey}
            y1={ciKeys[0]}
            y2={ciKeys[1]}
            z={zKey ? zKey : null}
            opacity={zKey ? 0.3 : 0.65}
            fill={(d) => {
                if(highlighted){
                    if(d[zKey] == highlighted){
                        return styleScheme[highlighted].lineFill
                    } else if(d[zKey] == referenceCategory){
                        return styleScheme[referenceCategory].lineFill
                    } else{
                        return styleScheme[d[zKey]].lineFill
                    }
                } else if(categories){
                    return styleScheme[d[zKey]].lineFill
                } else{
                    return Array.isArray(colours) ? colours[0] : colours
                }
            }}
        />
    {/if}

    <Line 
        data={data} 
        x={xKey} 
        y={yKey}
        z={zKey ? zKey : null}
        lineClass={(d) => d.datum[zKey] == highlighted ? 'highlighted' : d.datum[zKey] == referenceCategory ? 'reference' : ''}
        strokeWidth={3}
        stroke={(d) => {
                if(categories){
                    return styleScheme[d[zKey]].lineFill
                } else{
                    return Array.isArray(colours) ? colours[0] : colours
                }
        }}
    />

    {#if addEndMarkers || addPointMarkers}
        <Dot
            data={!categories ? data.filter((d) => d[xKey] == domainX[domainX.length - 1]) : categories.length > 6 ? markerData.filter((d) => d[xKey] == domainX[domainX.length - 1]) : data.filter((d) => d[xKey] == domainX[domainX.length - 1])}
            x={xKey}
            y={yKey}
            r={4}          
            fill={(d) => {
                if(categories){
                    return styleScheme[d[zKey]].fill
                } else{
                    return Array.isArray(colours) ? colours[0] : colours
                }
            }}
            stroke={(d) => {
                if(categories){
                    return styleScheme[d[zKey]].stroke
                } else{
                    return Array.isArray(colours) ? colours[0] : colours
                }
            }}
            strokeWidth={3}
            symbol={(d) => {
                if(categories){
                    return styleScheme[d[zKey]].symbol
                } else{
                    return Array.isArray(symbols) ? symbols[0] : symbols
                }
        }}
        />
        {#if zKey && directLabels}
            <Text
                data={categories.length > 6 ? markerData.filter((d) => d[xKey] == domainX[domainX.length-1]) : data.filter((d) => d[xKey] == domainX[domainX.length-1])}
                x={xKey} 
                y={yKey}
                dx={15}
                text={zKey}
                textClass="dataLabel"
                textAnchor="start"
                fill={(d) => {
                    if(categories){
                        return styleScheme[d[zKey]].stroke
                    } else{
                        return Array.isArray(colours) ? colours[0] : colours
                    }
                }}
            />
        {/if}
    {/if}

    {#if addPointMarkers}
        <Dot 
            data={markerData.filter((d) => d[xKey] != domainX[domainX.length-1])}
            x={xKey}
            y={yKey}
            r={4}                 
            fill={(d) => {
                if(categories){
                    return styleScheme[d[zKey]].fill
                } else{
                    return Array.isArray(colours) ? colours[0] : colours
                }
            }}
            stroke={(d) => {
                if(categories){
                    return styleScheme[d[zKey]].stroke
                } else{
                    return Array.isArray(colours) ? colours[0] : colours
                }
            }}
            strokeWidth={3}
            symbol={(d) => {
                if(categories){
                    return styleScheme[d[zKey]].symbol
                } else{
                    return Array.isArray(symbols) ? symbols[0] : symbols
                }
        }}
        />
    {/if}
</Plot>
</div>