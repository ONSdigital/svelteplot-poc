    <script>
    
    import { Plot, AxisY, Line, Dot, Text, Pointer, RuleX } from 'svelteplot';
    import { format } from "d3-format";
    import { timeParse, timeFormat} from "d3-time-format"
    import * as d3 from 'd3';
    import { symbolAsterisk, symbolDiamond2, symbolPlus, symbolSquare2, symbolTriangle2, symbolX as symbolTimes, symbolCircle, symbolCross, symbolDiamond, symbolSquare, symbolStar, symbolTriangle, symbolWye } from 'd3-shape';
    import { onMount, untrack } from 'svelte';
    import { 
        wrap,
        getCategoricalDomain, 
        getContinuousDomain, 
        groupData, 
        stackData, 
        labelPixelWidth, 
        getChartHeight,
        getAxisMargin,
        resolveDataLabelOverlap,
        getLegendItems
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
        xAxisLabel,
        yAxisLabel, 
        xDomain,
        xFormat = ".0f",
        xFormatDate,
        yDomain = "auto",
        yAxisTicks,
        yFormat = ",.0f",
        dataLabels,
        addEndMarkers = true,
        addPointMarkers = true,
        drawLegend = smKey ? true : false,
        otherLegendLabel = "Other categories",
        hover = true,
        tooltip,
        height,
        aspectRatio = [16,9],
        margin = {top: 0, bottom: 0, right: !drawLegend && zKey ? null : 20}, 
        colours = defaultColours[variant],
        symbols = ['circle', 'square', 'diamond2', 'circle', 'square', 'diamond2'],
        children
    } = $props();

    let plotEl = $state()
    let hovered = $state()

    let chartHeight = $derived(height ? height : getChartHeight({data: data, width: width, aspectRatio: aspectRatio, variant: variant}))

    let domainY = $derived(getContinuousDomain({
        chartType: 'line',
        data: data,
        variant: variant,
        categoryKey: xKey,
        valueKey: yKey,
        xDomain: yDomain
    }))

    let domainX = $derived(xDomain ? xDomain : getCategoricalDomain({
        data: data, 
        variant: variant, 
        valueKey: yKey, 
        categoryKey: xKey, 
        groupKey: zKey
    }))

    let yAxisMargin = $derived(margin.left ? margin.left : getAxisMargin({domain: domainY})+10)

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

    let legendItems = $derived(getLegendItems({
        chartType: type,
        variant: variant,
        categories: categories,
        colours: colours,
        highlighted: highlighted,
        referenceCategory: referenceCategory,
        otherLegendLabel: otherLegendLabel
    }))

    let marginRight = $derived(!drawLegend && zKey && !margin.right ? getAxisMargin({domain: highlighted && referenceCategory && categories.length > 6 && !hover ? [highlighted, referenceCategory] : highlighted && categories.length > 6 &&!hover ? [highlighted] : categories}) + 15 : margin.right)

    let markerData = $derived.by(() => {
        let filtered = []
        if(highlighted){
            [...data.filter((d) => d[zKey] == highlighted)].forEach((d) => {filtered.push(d)})
        }
        if(referenceCategory){
            [...data.filter((d) => d[zKey] == referenceCategory)].forEach((d) => filtered.push(d))
        }
        if(hovered){
            [...data.filter((d) => d[zKey] == hovered[zKey])].forEach((d) => {filtered.push(d)})
        }
        if(!referenceCategory && !highlighted){
            filtered = data
        }
        return filtered
    })

    $inspect(markerData.filter((d) => d[xKey] == domainX[domainX.length - 1]))

    $effect(() => {
        if(data && margin && !drawLegend && zKey){
            d3.select(plotEl).selectAll(".dataLabel").call(wrap, marginRight)
        }
        if(data && (highlighted || referenceCategory || hovered)){
            d3.select(plotEl).selectAll(".reference").raise()
            d3.select(plotEl).selectAll(".highlighted").raise()
            d3.select(plotEl).selectAll(".hovered").raise()
        }
    })

    $effect(() => {
        if(data && hovered){
            resolveDataLabelOverlap({container: plotEl, selector: ".dataLabel"});
        }
    })
</script>

{#if categories && !smKey && (drawLegend || categories.length > 6)}
    <Legend items={legendItems}/>
{/if}

<div bind:this={plotEl}>
<Plot
    marginLeft={yAxisMargin}
    marginRight={marginRight}
    marginTop={margin.top ? margin.top : null}
    marginBottom={margin.bottom ? margin.bottom : null}
    height = {chartHeight} 
    x={{ 
        label:xAxisLabel ? xAxisLabel : "",
        tickFormat: (d) => xFormatDate ? timeFormat(xFormat)(timeParse(xFormatDate)(d)) : xFormat ? format(xFormat)(d) : d
    }}
    y={{ 
        domain: domainY, 
        axis: 'left',
        grid: true,
        label: yAxisLabel ? yAxisLabel : "",
        tickFormat: (d) => yFormat ? format(yFormat)(d) : d,
    }}>

    <Line 
        data={data} 
        x={xKey} 
        y={yKey}
        z={zKey ? zKey : null}
        lineClass={(d) => {
            if(hovered){
               return d.datum[zKey] == highlighted ? 'highlighted' : d.datum[zKey] == referenceCategory ? 'reference' : d.datum[zKey] == hovered[zKey] ? 'hovered' : ''
            } else{
                return d.datum[zKey] == highlighted ? 'highlighted' : d.datum[zKey] == referenceCategory ? 'reference' : ''    
            }
        }}
        strokeWidth={3}
        stroke={(d) => {
            if(!hovered){
                if(highlighted){
                    if(d[zKey] == highlighted){
                        return ONScolours.oceanBlue
                    } else if(d[zKey] == referenceCategory){
                        return ONScolours.skyBlue
                    } else{
                        return ONScolours.grey40
                    }
                } else if(categories){
                    return colours[categories.indexOf(d[zKey])]
                } else{
                    return colours[0] 
                }
            } else{
                if(d[zKey] == hovered[zKey]){
                    return ONScolours.highlightOrange
                } else if(d[zKey] == highlighted){
                    return ONScolours.oceanBlue
                } else if(d[zKey] == referenceCategory){
                    return ONScolours.skyBlue
                } else{
                    return ONScolours.grey40
                }
            }
        }}
    />

    {#if addEndMarkers || addPointMarkers || !drawLegend}
        <Dot
            data={categories.length > 6 ? markerData.filter((d) => d[xKey] == domainX[domainX.length - 1]) : data.filter((d) => d[xKey] == domainX[domainX.length - 1])}
            x={xKey}
            y={yKey}
            r={4}          
            fill={(d) => {
                if(hovered){
                    if(d[zKey] == highlighted){
                        return ONScolours.oceanBlue
                    } else if(d[zKey] == referenceCategory){
                        return ONScolours.skyBlue
                    } else if(d[zKey] == hovered[zKey]){
                        return ONScolours.highlightOrange
                    } else{
                        return ONScolours.grey40
                    }
                }
                else if(highlighted){
                    if(d[zKey] == highlighted){
                        return ONScolours.oceanBlue
                    } else if(d[zKey] == referenceCategory){
                        return ONScolours.skyBlue
                    } else{
                        return ONScolours.grey40
                    }
                }
                else if(categories){
                    return colours[categories.indexOf(d[zKey])]
                } else{
                    return colours[0]
                }
            }}
            stroke={(d) => {
                if(hovered){
                    if(d[zKey] == highlighted){
                        return ONScolours.oceanBlue
                    } else if(d[zKey] == referenceCategory){
                        return ONScolours.skyBlue
                    } else if(d[zKey] == hovered[zKey]){
                        return ONScolours.highlightOrange
                    } else{
                        return ONScolours.grey40
                    }
                }
                else if(highlighted){
                    if(d[zKey] == highlighted){
                        return ONScolours.oceanBlue
                    } else if(d[zKey] == referenceCategory){
                        return ONScolours.skyBlue
                    } else{
                        return ONScolours.grey40
                    }
                }
                else if(categories){
                    return colours[categories.indexOf(d[zKey])]
                } else{
                    return colours[0]
                }
            }}
            strokeWidth={3}
            symbol={(d) => {
                if(zKey){
                    if(d[zKey] == highlighted){
                        return symbols[0]
                    } else if(d[zKey] == referenceCategory){
                        return symbols[1]
                    } else if(hovered){
                        if(d[zKey] == hovered[zKey]){
                            return referenceCategory ? symbols[2] : highlighted ? symbols[1] : symbols[0]
                        }
                    } else{
                        return symbols[categories.indexOf(d[zKey])]
                    }
                } else{
                    return symbols[0]
                }
            }}
        />
        {#if zKey}
            <Text
                data={categories.length > 6 ? markerData.filter((d) => d[xKey] == domainX[domainX.length-1]) : data.filter((d) => d[xKey] == domainX[domainX.length-1])}
                x={xKey} 
                y={yKey}
                dx={15}
                text={zKey}
                textClass="dataLabel"
                textAnchor="start"
                fill={(d) => {
                if(hovered){
                    if(d[zKey] == highlighted){
                        return ONScolours.oceanBlue
                    } else if(d[zKey] == referenceCategory){
                        return ONScolours.skyBlue
                    } else if(d[zKey] == hovered[zKey]){
                        return ONScolours.highlightOrange
                    } else{
                        return ONScolours.grey40
                    }
                }
                else if(highlighted){
                    if(d[zKey] == highlighted){
                        return ONScolours.oceanBlue
                    } else if(d[zKey] == referenceCategory){
                        return ONScolours.skyBlue
                    } else{
                        return ONScolours.grey40
                    }
                }
                else if(categories){
                    return colours[categories.indexOf(d[zKey])]
                } else{
                    return colours[0]
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
                if(hovered){
                    if(d[zKey] == highlighted){
                        return ONScolours.oceanBlue
                    } else if(d[zKey] == referenceCategory){
                        return ONScolours.skyBlue
                    } else if(d[zKey] == hovered[zKey]){
                        return ONScolours.highlightOrange
                    } else{
                        return ONScolours.grey40
                    }
                }
                else if(highlighted){
                    if(d[zKey] == highlighted){
                        return ONScolours.oceanBlue
                    } else if(d[zKey] == referenceCategory){
                        return ONScolours.skyBlue
                    } else{
                        return ONScolours.grey40
                    }
                }
                else if(categories){
                    return colours[categories.indexOf(d[zKey])]
                } else{
                    return colours[0]
                }
            }}
        />
    {/if}

    {#if hover && zKey}
        <Pointer
            data={data.filter((d) => d[zKey] != highlighted && d[zKey] != referenceCategory)}
            x={xKey}
            y={yKey}
            maxDistance={10}
            onupdate={(data) => {
                hovered = data[0]
            }}>
        </Pointer>
    {/if}
</Plot>
</div>