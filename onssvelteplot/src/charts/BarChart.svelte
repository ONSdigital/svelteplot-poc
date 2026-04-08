<script>
    import { Plot, GridX, BarX, AxisX, AxisY, Text, RuleX, Pointer, stackX, RectX } from 'svelteplot';
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
        getAxisMargin,
        createLegendItemsObject
    } from '../js/utils';
    import { ONScolours, ONSpalette, oldONSpalette } from '../js/colours'
    import Legend from "./shared/Legend.svelte"

    let defaultColours = {
        simple: [ONScolours.positive, ONScolours.negative],
        clustered: oldONSpalette,
        stacked: ONSpalette
    }

	let { 
        data, 
        size,
        width,
        variant = "simple",
        highlighted = null,
        smGridPosition,
        smKey,
        xKey = "x", 
        yKey = "y",
        zKey = Object.keys(data[0]).includes('z') && smKey != 'z' ? 'z' : null,
        xAxisLabel,
        yAxisLabel, 
        xDomain = "auto",
        xFormat = ",.0f",
        xFormatDate,
        xAxisTicks,
        yDomain,
        yFormat,
        yFormatDate,
        zDomain,
        zFormat,
        zFormatDate,
		ySort,
        zSort,
        zSortKey,
        ySortKey,
        dataLabels,
        tooltip,
        height,
        seriesHeight = 34,
        hover = false,
        margin = {top: 0, bottom: 0, right: 20}, 
        colours = defaultColours[variant],
        children
    } = $props();

    function getLabelAnchor(value,xPosition,labelWidth,xZeroPosition){
        if(value < 0){
            if(xPosition + labelWidth > xZeroPosition){
                return "end"
            } else{
                return "start"
            }
        } else{
            if(xPosition - labelWidth > xZeroPosition){
                return "end"
            } else{
                return "start"
            }
        }
    }

    function getLabelFill(value,xPosition,labelWidth, xZeroPosition){
        if(value < 0){
            if(xPosition + labelWidth > xZeroPosition){
                return "#414042"
            } else{
                return "#FFFFFF"
            }
        } else{
            if(xPosition - labelWidth > xZeroPosition){
                return "#FFFFFF"
            } else{
                return "#414042"
            }
        }
    }

    let plotEl = $state();

    let categories = $derived(zKey && variant != "simple" ? [...new Set(data.map((d) => d[zKey]))] : null)

    let colourScheme = $derived.by(() => {
        if(categories){
            return createLegendItemsObject(categories,colours)
        } else{
            return null
        }
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

    let domainY = $derived(yDomain ? yDomain : getCategoricalDomain({
        data: data, 
        variant: variant, 
        sort: ySort, 
        sortKey: ySortKey, 
        valueKey: xKey, 
        categoryKey: yKey, 
        groupKey: zKey
    }))

    let domainZ = $derived(!zKey ? null : zDomain ? zDomain : getCategoricalDomain({
        data: data,
        variant: variant,
        sort: zSort,
        sortKey: zSortKey,
        valueKey: xKey,
        categoryKey: zKey,
        groupKey: yKey
    }))

    let xScale = $derived(
        d3.scaleLinear().range([0, width-yAxisMargin-margin.right]).domain(domainX)
    )

    let yAxisMargin = $derived(margin.left ? margin.left : getAxisMargin({domain: domainY}))

    let labels = $derived.by(() => {
        if(xScale){
            if(variant == "stacked"){
                let stackedData = stackData({data: data, categoryKey: yKey, valueKey: xKey, categories: domainY})
                stackedData.forEach((d) => {
                    d.labelWidth = labelPixelWidth(d3.format(xFormat)(d[xKey]), { fontFamily: 'OpenSans', fontSize: '14px', fontWeight: 'bold' })
                    d.barWidth = xScale(d[xKey])
                    d.show = d.barWidth > d.labelWidth ? true : false
                    d.anchor = d[xKey] > 0 ? 'end' : 'start'
                    d.fill = '#FFFFFF'
                })
                return stackedData
            } else{
                let labelData = [...data]
                labelData.forEach((d) => {
                    d.labelWidth = labelPixelWidth(d3.format(xFormat)(d[xKey]), { fontFamily: 'OpenSans', fontSize: '14px', fontWeight: 'bold' })
                    d.show = true
                    d.anchor = getLabelAnchor(d[xKey],xScale(d[xKey]),d.labelWidth, domainX[0] < 0 ? xScale(0) : 0)
                    d.fill = getLabelFill(d[xKey],xScale(d[xKey]),d.labelWidth, domainX[0] < 0 ? xScale(0) : 0)
                })
                return labelData
            }
        } else{
            return null
        }
    })

    $effect(() => {
        if(data){
            d3.select(plotEl).selectAll(".is-left").attr("text-anchor","end")
            if(variant == "clustered"){
                d3.select(plotEl).selectAll(".facet").selectAll(".axis-y").selectAll(".tick").remove()
            }          
        }
    })

</script>

{#if categories && !smKey}
    <Legend items={colourScheme}/>
{/if}

<div bind:this={plotEl}>
<Plot 
    marginLeft={yAxisMargin}
    marginRight={margin.right ? margin.right : null}
    marginTop={margin.top ? margin.top : null}
    marginBottom={margin.bottom ? margin.bottom : null}
    height = {chartHeight} 
    {width}
    y={{ 
        axis: 'left',
        domain: variant == "clustered" ? domainZ : domainY, 
        tickSpacing: 10, 
        reverse: true,
        label: yAxisLabel ? yAxisLabel : "",
        tickFormat: (d) => variant == "clustered" || smGridPosition > 0 ? "" : yFormatDate ? timeFormat(yFormat)(timeParse(yFormatDate)(d)) : yFormat ? format(yFormat)(d) : d
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
    fy={{
        axis: 'left',
        labelAnchor: 'bottom',
        domain: variant == "clustered" ? domainY : null,
        axisOptions: {
            dx: -5
        },
        tickFormat: (d) => smGridPosition > 0 ? "" : yFormatDate ? timeFormat(yFormat)(timeParse(yFormatDate)(d)) : yFormat ? format(yFormat)(d) : d
    }}
>
    {#if highlighted && variant != 'simple'}
        <RectX data={data.filter((d) => d[yKey] == highlighted)}
            y1={variant == "clustered" ? null : yKey}
            y2={variant == "clustered" ? null : yKey}
            fy={variant == "clustered" ? yKey : null}
            insetTop={-2}
            insetBottom={-2}
            insetLeft={-yAxisMargin}
            fill={ONScolours.grey20}
            class={"opaque"}
        />
    {/if}
    <AxisY tickClass={(d) => d == highlighted ? "bold" : null}/>
    <AxisX tickCount={xAxisTicks}/>
    <BarX 
        data={data}
        x={xKey} 
        y={variant == "clustered" ? zKey : yKey}
        fy={variant == "clustered" ? yKey : null}
        fx={variant == "small-multiple" ? zKey : null}
        fill={(d) => {
            let colour;
            if(variant == "stacked" || variant == "clustered"){
                colour = colourScheme[d[zKey]]
            } else if(d[yKey] == highlighted){
                colour = colours[0]
            } else if(highlighted){
                colour = ONScolours.grey50
            } else{
                if(d[xKey] < 0 && colours.length > 1){ 
                    colour = colours[1]
                } else{
                    colour = colours[0]
                }
            }
            return colour
        }}
        stroke={(d) => {
            if(highlighted && variant != 'simple' && d[yKey] == highlighted){
                return ONScolours.grey100
            }
        }}
        strokeWidth={(d) => {
            if(highlighted && variant != 'simple' && d[yKey] == highlighted){
                return 2
            }
        }}
    />
    {#if hover}
        <Pointer
            data={data}
            y={variant == "clustered" ? zKey : yKey}
            onupdate={(e) => {
                hovered = e
                console.log(hovered)
            }}/>
    {/if}

    {#if dataLabels}
        <Text
            data={labels.filter((d) => d.show == true)}
            x={variant == "stacked" ? "stackEnd" : xKey} 
            y={variant == "clustered" ? zKey : yKey}
            fy={variant == "clustered" ? yKey : null}
            fx={variant == "small-multiple" ? zKey : null}
            textAnchor={(d) => d.anchor}
            dx={(d) => {
                if(variant == "stacked"){
                    return -4
                } else{
                    return d.anchor == 'end' ? -4 : 4}
                }
            }
            text={(d) => dataLabels.format ? format(dataLabels.format)(d[xKey]) : xFormat ? format(xFormat)(d[xKey]) : d[xKey]}
            textClass="dataLabel"
            fill={(d) => d.fill}
        />
    {/if}
    {#if children}
        {@render children()}
    {/if}
</Plot>
</div>

<style>

</style>