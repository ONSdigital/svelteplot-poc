<script>
    import { Plot, Dot, RectX, AxisY, GridY, Text, Link } from 'svelteplot';
    import { format } from "d3-format";
    import * as d3 from 'd3';
    import { onMount } from 'svelte';
    import { 
            getCategoricalDomain, 
            getContinuousDomain, 
            getChartHeight, 
            getAxisMargin,
            flagCloseXInGroups,
            labelPixelWidth,
            getLabelPosition
        } from '../js/utils';
    import { ONScolours, ONSpalette } from '../js/colours';
    import Legend from "./shared/Legend.svelte";

    let defaultColours = {
        simple: ONSpalette,
        comparison: [ONScolours.previous, ONScolours.current],
        range: ONSpalette,
        arrow: [ONScolours.oceanBlue, ONScolours.coralPink, ONScolours.grey50]
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
    xFormat = ".0f",
    yDomain,
    yFormat,
    ySort,
    ySortKey, 
    height,
    seriesHeight = 34,
    margin = {top: 15, bottom: 50, right: 20}, 
    colours = defaultColours[variant],
    radius = 6,
    stroke = "#fff",
    strokeWidth = 1.5,
    dataLabels
    } = $props();

    let seriesCount = $derived(new Set(data.map((d) => d[zKey])).size);
    let seriesNames = $derived([...new Set(data.map((d) => d[zKey]))]);

    let domainX = $derived(getContinuousDomain({
        data: data,
        variant: variant,
        categoryKey: yKey,
        valueKey: xKey,
        xDomain: xDomain
    }));

    let domainY = $derived(yDomain ? yDomain : getCategoricalDomain({
        data: ySortKey === "difference" ? dataLink : data, 
        variant: variant, 
        sort: ySort, 
        sortKey: ySortKey, 
        valueKey: ySortKey === "difference" ? seriesNames : xKey, 
        categoryKey: yKey, 
        groupKey: zKey
    }));

    let yAxisBuffer =  $derived(dataLabels ? getAxisMargin({domain: d3.format(xFormat)(d3.min(data, d => d[xKey]))}) : 0)
    let yAxisMargin = $derived(margin.left ? margin.left : getAxisMargin({domain: domainY}));

    let marginRight = $derived(dataLabels && (xDomain == "auto" || xDomain == "data") ? getAxisMargin({domain: d3.format(xFormat)(d3.max(data, d => d[xKey]))}) : margin.right)

    let chartHeight = $derived(height ? height : getChartHeight({data: data, seriesHeight: seriesHeight, categoryKey: yKey, groupKey: zKey, variant: variant}))
    $inspect(chartHeight)

    let Z1 = $derived(seriesNames[0]); // first zKey value
    let Z2 = $derived(seriesNames[1]); // second zKey value

    let dataLink = $derived(
        Object.values(
            data.reduce((d, item) => {
                const y = item[yKey];
                const x = item[xKey];
                const z = item[zKey];

            if (!d[y]) {
            d[y] = { [yKey]: y };
            }

            d[y][z] = x;

            return d;
            }, {})
            ).map(obj => {
            const a = obj[Z1];
            const b = obj[Z2];

            let colour = defaultColours.arrow[2];

            if (a != null && b != null) {
                if (format(xFormat)(a) === format(xFormat)(b)) {
                colour = defaultColours.arrow[2];
                } else if (a > b) {
                colour = defaultColours.arrow[1];
                } else if (a < b) {
                colour = defaultColours.arrow[0];
                }
                }
            
            let marker = "arrow";

            if (a != null && b != null) {
            if (format(xFormat)(a) === format(xFormat)(b)) {
            marker = "tick-y";
            } else if (a > b) {
            marker = "arrow";
            } else if (a < b) {
            marker = "arrow";
            }
            }


            return {
            ...obj,
            colour,
            marker
            };
            })
    );

    let dataDot = $derived.by(() => {
        const scale = d3.scaleLinear()
            .range([0, width - yAxisMargin - margin.right])
            .domain(domainX);

        const rows = flagCloseXInGroups({
            data,
            xScale: scale,
            xKey,
            yKey,
            zKey,
            thresholdPx: 8,
            dyAdjust: 4
        }); 
    
        if (seriesCount > 3) {
            console.warn(`Warning: ${seriesCount} series detected. This template should only have 3 or fewer series for optimal readability. Consider using a different chart type.`);
        }
        else {  return rows;}
    });
    
    let dataTextLabels = $derived.by(() => {
        if(dataLabels){
            return getLabelPosition({
                data: dataDot,
                dataLink: dataLink,
                xKey: xKey,
                yKey: yKey,
                zKey: zKey,
            });
            
        } else{
            return dataDot
        }
    });

    let categories = $derived(new Set(data.map((d) => d[zKey])));

       let labels = $derived.by(() => {
        if(dataTextLabels){
            let labelData = [...dataTextLabels]
            labelData.forEach((d) => {
                d.labelWidth = labelPixelWidth(d[xKey])
                d.show = true
                d.anchor = d.xMax === true ? "start" : "end"
                d.dy = d.dy ? d.dy : 0
            })
            return labelData            
        } else{
            return null
        }
    });

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

{#if categories && !smKey && variant != "arrow"}
    <Legend {categories} {colourScheme}/>
{/if}

<Plot
    marginLeft={yAxisMargin + yAxisBuffer}
    marginRight={marginRight}
    marginTop={margin.top ? variant == "arrow" ? margin.top + 20 : 20 : null}
    marginBottom={margin.bottom ? margin.bottom : null}
    height = {chartHeight} 
    {width}
     y={{ 
        axis: 'left',
        domain: domainY, 
        tickSpacing: 20,
        label: yAxisLabel ? yAxisLabel : "",
        grid: true,
        tickFormat: (d) => variant == "clustered" || smGridPosition > 0 ? "" : yFormat ? format(yFormat)(d) : d,
        axisOptions: {
            dx: -yAxisBuffer
        },
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
    
    <AxisY 
        tickClass={(d) => d == highlighted ? "bold" : null}
        dx={-yAxisBuffer}
    />
    
    <GridY 
        strokeDasharray={(d) => d != 0 ? "2,2" : null}
        x1={domainX[0] - domainX[0] * 0.05}
    ></GridY>

    {#if variant === "range"}

    <Link
        data={dataLink}
        x1={seriesNames[0]}
        x2={seriesNames[1]}
        y={yKey}
        stroke={ONScolours.grey30}
        strokeWidth={1.5}
    />

    {/if}

   
    {#if (variant === "simple") || (variant === "comparison") || (variant === "range")}
    <Dot
        data={dataDot}
        x={xKey} 
        fill={(d) => {
            let colour;
            if((variant == "simple") || (variant == "comparison") || (variant == "range")){
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
            return d.dy;
        }}
        r={+radius}
        symbol={(d) => symbolScheme[d[zKey]]}
        {stroke}
        {strokeWidth}
        />
    {/if}

    {#if variant == "arrow"}
    <!-- draw series labels and connectors -->
         <Text
            data={[...data].filter((d) => d[yKey] == domainY[domainY.length-1] && seriesNames.includes(d[zKey]))}
            x={xKey}
            y={yKey}
            dy={-20}
            textAnchor={(d) => {
                let filteredData = [...dataLink].filter((datum) => datum[yKey] == d[yKey])[0] 
                if(d[zKey] == seriesNames[0]){
                    if((filteredData[seriesNames[0]] > filteredData[seriesNames[1]])){
                        return "start"
                    } else{
                        return "end"
                    }
                } else{
                    if((filteredData[seriesNames[0]] > filteredData[seriesNames[1]])){
                        return "end"
                    } else{
                        return "start"
                    }
                }
            }}
            text={zKey}
        />


        <!-- draw the arrows for non equal values -->
        <Link
            data={dataLink.filter(d => d.marker === 'arrow')}
            x1={seriesNames[0]}
            x2={seriesNames[1]}
            y={yKey}
            stroke={(d) => d.colour}
            strokeWidth={3}
            markerEnd={"arrow"}
        />

            <!-- draw the arrows for equal values -->
        <Link
            data={dataLink.filter(d => d.marker === 'tick-y')}
            x1={seriesNames[0]}
            x2={seriesNames[1]}
            y={yKey}
            stroke={(d) => d.colour}
            strokeWidth={3}
            markerEnd={"tick-y"}
        />

    {/if}

    
    
    {#if dataLabels}
        <Text
            data={labels.filter((d) => d.show == true)}
            x={xKey}
            y={yKey}
            textAnchor={(d) => d.anchor}
            text={(d) => dataLabels.format ? format(dataLabels.format)(d[xKey]) : xFormat ? format(xFormat)(d[xKey]) : d[xKey]}
            textClass="dataLabel"
            dx={(d) => d.anchor == "end" ? -9 : 9}
            dy={-1}
            fill={(d) => {
                let colour;
                if(variant == "simple" || variant == "comparison" || variant == "range"){
                    colour = colourScheme[d[zKey]]
                } 
                else if (variant === "arrow") {
                    colour = d.colour
                }
                else if(d[yKey] == highlighted){
                    colour = colours[0]
                } else if(highlighted){
                    colour = ONScolours.grey50
                } 
                else{ 
                    colour = colours[0]
                }
                return colour
            }}
        />
    {/if}

  

   
</Plot>

<style>

</style>