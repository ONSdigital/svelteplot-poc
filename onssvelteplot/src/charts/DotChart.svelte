<script>
    import { Plot, Dot, RectX, AxisY, GridY } from 'svelteplot';
    import { format } from "d3-format";
    import * as d3 from 'd3';
    import { onMount } from 'svelte';
    import { 
            getCategoricalDomain, 
            getContinuousDomain, 
            getChartHeight, 
            getAxisMargin,
            flagCloseXInGroups
        } from '../js/utils';
    import { oldONSpalette, ONScolours, ONSpalette } from '../js/colours';
    import Legend from "./shared/Legend.svelte";

    let defaultColours = {
        simple: oldONSpalette,
        comparison: [ONScolours.previous, ONScolours.current]
    }//uses the standard colour palette or time comparison colours

    let { 
    data, 
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
    xFormat,
    xAxisTicks,
    yDomain,
    yFormat,
    ySort,
    zSortKey, 
    tooltip,
    height,
    hover = false,
    margin = {top: 15, bottom: 50, right: 20}, 
    colours = defaultColours[variant],
    radius = 6,
    stroke = "#fff",
    strokeWidth = 1.5
    } = $props();

    let hovered = $state();

    let domainX = $derived(getContinuousDomain({
        data: data,
        variant: variant,
        categoryKey: yKey,
        valueKey: xKey,
        xDomain: xDomain
    }));

    let domainY = $derived(yDomain ? yDomain : getCategoricalDomain({
        data: data, 
        variant: variant, 
        sort: ySort, 
        sortKey: zSortKey, 
        valueKey: xKey, 
        categoryKey: yKey, 
        groupKey: zKey
    }));

    let yAxisMargin = $derived(margin.left ? margin.left : getAxisMargin({domain: domainY}));

    let chartHeight = $derived(height ? height : getChartHeight({data: data, cateogryKey: yKey, groupKey: zKey, variant: variant}));

    let dataWithDy = $derived.by(() => {
        const scale = d3.scaleLinear()
            .range([0, width - yAxisMargin - margin.right])
            .domain(domainX);

        const rows = flagCloseXInGroups({
            data,
            xScale: scale,
            xKey,
            yKey,
            zKey,
            thresholdPx: 5,
            dyAdjust: 5
        });
        console.log('rows', rows)
        return rows;
    });

    $inspect(dataWithDy, 'dataWithDy')

    let categories = $derived(new Set(data.map((d) => d[zKey])));

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
    });

    let symbols = ['circle', 'diamond2', 'square'];

    let symbolScheme = $derived.by(() => {
        let symbolsvar = {};
        if(categories){
            let i = 0;
            categories.forEach((category) => {
                symbolsvar[category] = symbols[i % symbols.length];
                i = i + 1;
            });
        } else {
            symbolsvar = symbols[0];
        }
        return symbolsvar;
    });

    onMount(() => {
        d3.selectAll(".is-left").attr("text-anchor","end")
    });

</script>

{#if categories && !smKey}
    <Legend {categories} {colourScheme}/>
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
        domain: domainY, 
        tickSpacing: 20,
        label: yAxisLabel ? yAxisLabel : "",
        grid: true,
         tickFormat: (d) => variant == "clustered" || smGridPosition > 0 ? "" : yFormat ? format(yFormat)(d) : d
    }}
    x={{ 
        domain: domainX, 
        label:xAxisLabel ? xAxisLabel : "",
        tickFormat: (d) => xFormat ? format(xFormat)(d) : d,
        grid: true
    }}
    color={{ 
        scheme: colours
    }}
     fy={{
        axis: 'left',
        labelAnchor: 'bottom',
        domain: variant == "clustered" ? domainY : null,
        axisOptions: {
            dx: -5
        },
        tickFormat: (d) => smGridPosition > 0 ? "" : yFormat ? format(yFormat)(d) : d
    }}
    >

    {#if highlighted}
        <RectX data={data.filter((d) => d[yKey] == highlighted)}
            y1={yKey}
            y2={yKey}
            fy={yKey}
            insetTop={-8}
            insetBottom={-10}
            insetLeft={-yAxisMargin}
            fill={ONScolours.grey20}
            class={"opaque"}
        />
    {/if}
    
    <AxisY tickClass={(d) => d == highlighted ? "bold" : null}/>
    
    <GridY 
    strokeDasharray={(d) => d != 0 ? "2,2" : null}
    ></GridY>

    <Dot
        data={dataWithDy}
        x={xKey} 
        fill={(d) => {
            let colour;
            if(variant == "simple" || variant == "comparison"){
                colour = colourScheme[d[zKey]]
            } else if(d[yKey] == highlighted){
                colour = colours[0]
            } else if(highlighted){
                colour = ONScolours.grey50
            } else{ 
                colour = colours[0]
            }
            return colour
        }}
        y={yKey}
        dy={(d) => {
            // Use computed close-distance flag from dataWithDy;if true, nudge to avoid overlap.
            return d.dy;
        }}
        r={+radius}
        symbol={(d) => symbolScheme[d[zKey]]}
        {stroke}
        {strokeWidth}
        />
</Plot>

<style>

</style>