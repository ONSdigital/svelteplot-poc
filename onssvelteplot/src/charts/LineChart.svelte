    <script>
    
    import { Plot, AxisY, Line, Dot, Text } from 'svelteplot';
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
        resolveDataLabelOverlap 
    } from '../js/utils';
    import { ONScolours, ONSpalette, oldONSpalette } from '../js/colours'
    import Legend from "./shared/Legend.svelte"


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
        tooltip,
        height,
        aspectRatio = [16,9],
        margin = {top: 0, bottom: 0, right: !drawLegend && zKey ? null : 20}, 
        colours = defaultColours[variant],
        symbols = ['circle', 'square', 'diamond2', 'circle', 'square', 'diamond2'],
        children
    } = $props();

    let plotEl = $state()

    let chartHeight = $derived(height ? height : getChartHeight({data: data, width: width, aspectRatio: aspectRatio, variant: variant}))

    let domainY = $derived(getContinuousDomain({
        chartType: 'line',
        data: data,
        variant: variant,
        categoryKey: xKey,
        valueKey: yKey,
        xDomain: yDomain
    }))

    $inspect(domainY)

    let domainX = $derived(xDomain ? xDomain : getCategoricalDomain({
        data: data, 
        variant: variant, 
        valueKey: yKey, 
        categoryKey: xKey, 
        groupKey: zKey
    }))

    let yAxisMargin = $derived(margin.left ? margin.left : getAxisMargin({domain: domainY}))

    let categories = $derived.by(() => {
        let categoryArray = []
        if(zKey){
            categoryArray = [...new Set(data.map((d) => d[zKey]))]
            if(highlighted){
                const highlightedIndex = categoryArray.findIndex(obj => obj[zKey] === highlighted);
                if (highlightedIndex > -1) {
                    const [highlightedItem] = categoryArray.splice(highlightedIndex, 1);
                    categoryArray.unshift(highlightedItem);
                }
            
                if(referenceCategory){
                    const referenceIndex = categoryArray.findIndex(obj => obj[zKey] === referenceCategory);
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

    let marginRight = $derived(!drawLegend && zKey && !margin.right ? getAxisMargin({domain: categories}) : margin.right)

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
        if(data && margin && !drawLegend && zKey){
            d3.selectAll(".dataLabel").call(wrap, marginRight)
        }
    })

    $effect(() => {
        if(data){
            resolveDataLabelOverlap({container: plotEl, selector: ".dataLabel"});
        }
    })

    $inspect(data)
</script>

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
        strokeWidth={3} 
        stroke={(d) => {
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
        }}
    />

    {#if addEndMarkers || addPointMarkers || !drawLegend}
        <Dot
            data={categories.length > 6 ? markerData.filter((d) => d[xKey] == domainX[domainX.length - 1]) : data.filter((d) => d[xKey] == domainX[domainX.length - 1])}
            x={xKey}
            y={yKey}
            r={4}          
            fill={(d) => {
                if(highlighted){
                    if(d[zKey] == highlighted){
                        return ONScolours.oceanBlue
                    } else if(d[zKey] == referenceCategory){
                        return ONScolours.skyBlue
                    } else{
                        return ONScolours.grey40
                    }
                }
                else if(categories){
                    if(categories.indexOf(d[zKey]) > 2){
                        return "white"
                    } else{
                        return colours[categories.indexOf(d[zKey])]
                    }
                } else{
                    return colours[0]
                }
            }}
            stroke={(d) => {
                if(highlighted){
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
            symbol={(d) => categories ? symbols[categories.indexOf(d[zKey])] : symbols[0]}
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
                if(highlighted){
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
</Plot>
</div>