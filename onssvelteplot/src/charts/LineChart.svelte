    <script>
    
    import { Plot, AxisY, Line } from 'svelteplot';
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
        xAxisTicks,
        yDomain = "auto",
        yFormat = ",.0f",
        zFormat,
        zFormatDate,
		ySort,
        zSortKey, 
        dataLabels,
        tooltip,
        height,
        aspectRatio = [16,9],
        hover = false,
        margin = {top: 0, bottom: 0, right: 20}, 
        colours = defaultColours[variant],
        children
    } = $props();
    let categories = $derived(zKey ? [...new Set(data.map((d) => d[zKey]))] : null)
$inspect(categories)
</script>

<Plot
    x={{ 
        tickFormat: (d) => xFormatDate ? timeFormat(xFormat)(timeParse(xFormatDate)(d)) : xFormat ? format(xFormat)(d) : d,
    }}
    y={{ 
        axis: 'left',
        grid: true,
        tickFormat: (d) => yFormat ? format(yFormat)(d) : d,
        }}>
    <Line 
        data={data} 
        x="x" 
        y="y" 
        strokeWidth={3} 
        stroke={(d) => categories ? colours[categories.indexOf(d[zKey])] : colours[0]} />
</Plot>