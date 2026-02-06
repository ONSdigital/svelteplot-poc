<script>
    import { Plot, GridX, BarX, AxisX, AxisY, Text, RuleX, Pointer, stackX } from 'svelteplot';
    import { format } from "d3-format";
    import { timeParse, timeFormat} from "d3-time-format"
    import { extent, min, max, sum, sort, ascending, descending } from "d3-array"
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
        seriesHeight = 34,
        hover = false,
        margin = {top: 0, bottom: 0, right: 20}, 
        colours = defaultColours[variant],
        children
    } = $props();

    let hovered = $state();

    let categories = $derived(zKey && variant != "simple" ? new Set(data.map((d) => d[zKey])) : null)

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

    let domainX = $derived(getContinuousDomain({
        data: data,
        variant: variant,
        categoryKey: yKey,
        valueKey: xKey,
        xDomain: xDomain
    }))

    let chartHeight = $derived(height ? height : getChartHeight({data: data, seriesHeight: seriesHeight, cateogryKey: yKey, groupKey: zKey, variant: variant}))

    let barHeight = $derived(seriesHeight ? seriesHeight : getSeriesHeight({data: data, height: height, cateogryKey: yKey, groupKey: zKey, variant: variant}))

    let domainY = $derived(getCategoricalDomain({
        data: data, 
        variant: variant, 
        sort: ySort, 
        sortKey: zSortKey, 
        valueKey: xKey, 
        categoryKey: yKey, 
        groupKey: zKey
    }))

    let xScale = $derived(
        d3.scaleLinear().range([0, width-yAxisMargin-margin.right]).domain(domainX)
    )

    let yAxisMargin = $derived(margin.left ? margin.left : getAxisMargin({domain: domainY}))

    let labels = $derived.by(() => {
        if(variant == "stacked"){
            let stackedData = stackData({data: data, categoryKey: yKey, valueKey: xKey, categories: domainY})
            stackedData.forEach((d) => {
                d.labelWidth = labelPixelWidth(d[xKey])
                d.barWidth = xScale(d[xKey])
                d.show = d.barWidth > d.labelWidth ? true : false
                d.anchor = d[xKey] > 0 ? 'end' : 'start'
                d.fill = '#FFFFFF'
            })
            return stackedData
        } else{
            let labelData = [...data]
            labelData.forEach((d) => {
                d.labelWidth = labelPixelWidth(d[xKey])
                d.show = true
                d.anchor = xScale(d[xKey]) - d.labelWidth - 14 > 0 ? "end" : "start"
                d.fill = d.anchor == "end" ? "#FFFFFF" : "#414042"
            })
            return labelData
        }
    })

    onMount(() => {
        d3.selectAll(".is-left").attr("text-anchor","end")
    })

</script>

{#if categories}
    <div id="legend">
        {#each categories as legendItem, i}
            <div class="legend--item">
                <div
                    class="legend--icon--circle"
                    style:background-color={colourScheme[legendItem]}
                />
                <p class="legend--text">{legendItem}</p>
            </div>
        {/each}
    </div>
{/if}

<Plot 
    marginLeft={yAxisMargin}
    marginRight={margin.right ? margin.right : null}
    marginTop={margin.top ? margin.top : null}
    marginBottom={margin.bottom ? margin.bottom : null}
    height = {chartHeight} 
    {width}
    y={{ 
        axis: 'left',
        domain: variant == "clustered" ? null : domainY, 
        tickSpacing: 10, 
        label: yAxisLabel ? yAxisLabel : "",
        tickFormat: (d) => variant == "clustered" || smGridPosition > 0 ? "" : yFormatDate ? timeFormat(yFormat)(timeParse(yFormatDate)(d)) : yFormat ? format(yFormat)(d) : d
    }} 
    x={{ 
        domain: domainX, 
        label:xAxisLabel ? xAxisLabel : "",
        tickFormat: (d) => xFormatDate ? timeFormat(xFormat)(timeParse(xFormatDate)(d)) : xFormat ? format(xFormat)(d) : d,
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
    <GridX/>
    <BarX 
        data={data}
        x={xKey} 
        y={variant == "clustered" ? zKey : yKey}
        fy={variant == "clustered" ? yKey : null}
        fx={variant == "small-multiple" ? zKey : null}
        fill={variant == "stacked" || variant == "clustered" ? (d) => colourScheme[d[zKey]] : true}
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

<style>

</style>