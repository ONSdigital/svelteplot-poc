    <script>
    
    import { Plot, AxisY, Line, Dot, Text } from 'svelteplot';
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
        getAxisMargin 
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
        drawLegend,
        tooltip,
        height,
        aspectRatio = [16,9],
        margin = {top: 0, bottom: 0, right: 20}, 
        colours = defaultColours[variant],
        children
    } = $props();

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

    let categories = $derived(zKey ? [...new Set(data.map((d) => d[zKey]))] : null)

    let marginRight = $derived(!drawLegend && zKey ? getAxisMargin({domain: categories}) : margin.right)

</script>

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
        x="x" 
        y="y" 
        strokeWidth={3} 
        stroke={(d) => categories ? colours[categories.indexOf(d[zKey])] : colours[0]} />

    {#if addEndMarkers || !drawLegend}
        <Dot
            data={data.filter((d) => d[xKey] == domainX[domainX.length-1])}
            x={xKey}
            y={yKey}
            r={4}
            fill={(d) => categories ? colours[categories.indexOf(d[zKey])] : colours[0]}
        />
        {#if zKey}
        <Text
            data={data.filter((d) => d[xKey] == domainX[domainX.length-1])}
            x={xKey} 
            y={yKey}
            dx={10}
            text={zKey}
            textClass="dataLabel"
            textAnchor="start"
            fill={(d) => categories ? colours[categories.indexOf(d[zKey])] : colours[0]}
        />
        {/if}
    {/if}
</Plot>