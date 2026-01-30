<script>

import * as d3 from 'd3';
import '././shared/globalStyle.css';
import { ONSpalette } from '././shared/colours';
import { onMount } from 'svelte';

export let data;
export let width = 700;
export let variant = "simple";
export let xKey = "x"; 
export let yKey = "y";
export let zKey;
export let xAxisLabel;
export let yAxisLabel;
export let xDomain = "auto";
export let xFormat;
export let xFormatDate;
export let xAxisTicks = 8;
export let yDomain;
export let yFormat;
export let yFormatDate;
export let zFormat;
export let zFormatDate;
export let ySort;
export let zSortKey; 
export let dataLabels;
export let tooltip;
export let height;
export let seriesHeight = height ? null : 28;
export let hover = false;
export let margin = {top: 20, bottom: 40, right: 20, left: 200}; 
export let colours = ONSpalette;

let chartHeight, yCategories, zCategories, stackedData, chartData;
let yScale, zScale, xScale;

$: if(data && yKey) yCategories = [...new Set(data.map((d) => d[yKey]))]

$: if(data && zKey) zCategories = [...new Set(data.map((d) => d[zKey]))]

$: if(!height){
    if(variant == "clustered"){
        chartHeight = +seriesHeight * (yCategories.length * zCategories.length)
    } else{
        chartHeight = +seriesHeight * yCategories.length 
    }
}

$: if(!seriesHeight){
    if(variant == "clustered"){
        seriesHeight = height / (yCategories.length * zCategories.length)
    } else{
        seriesHeight = height / yCategories.length
    }
    chartHeight = +height
}

$: if(variant == "stacked"){
    stackedData = []
    yCategories.forEach((category) => {
        var filteredData = data.filter((d) => d[yKey] == category)
        filteredData.forEach((d, i) => {
            console.log(i)
            d.x1 = i == 0 ? 0 : filteredData[i-1].x1
            d.x2 = d.x1 + d[xKey]
        })
        stackedData.concat(filteredData)
    })
}

$: yScale = 
        d3.scaleBand()
        .domain(yCategories)
        .range([0,chartHeight])
        .paddingOuter(0.1)
        .paddingInner(((yCategories.length - 1) * 14) / (data.length * 28))

$: if(data && variant == "clustered"){
    zScale =
        d3.scaleBand()
        .domain(zCategories)
        .range([0,yScale.bandwidth()])
        .padding(0)
}

$: xScale = d3.scaleLinear().domain(xDomain == 'auto' && d3.min(data.map((d) => Number(d[xKey]))) >= 0 ? 
        [0,d3.max(data.map((d) => Number(d[xKey])))] :
        xDomain == 'auto' ? d3.extent(data.map((d) => Number(d[xKey]))) :
        xDomain
    )
    .range([0,width - margin.left - margin.right])

let colourScale = {};    
onMount(setColours)

function setColours(){
    if(zKey){
        zCategories.forEach((category,i) => {
            colourScale[category] = colours[i]
        })
    }
}

$: if(stackedData){
    chartData = stackedData
    console.log(chartData)
} else{
    chartData = data
}

$: console.log(colourScale)


</script>

<svelte:options runes={false} />

    <div class="chart-container">
        <svg
            class="chart"
            height={chartHeight + margin.top + margin.bottom}
            width={width}
        >
            <g class="y axis" transform="translate({margin.left} {margin.top})">
                {#each yCategories as tick}
                    <text
                        x={-10}
                        y={yScale(tick)}
                        dy={yScale.bandwidth()/2 + 3}
                    >{tick}</text>
                {/each}
            </g>
            <g class="x axis" transform="translate({margin.left} {margin.top + chartHeight})">
                {#each xScale.ticks(xAxisTicks) as tick}
                    <text
                        x={xScale(tick)}
                        y={10}
                    >{xFormat ? d3.format(xFormat)(tick) : tick}</text>
                    <line
                        class={tick == 0 ? "axisLine" : "tick"}
                        x1={xScale(tick)}
                        x2={xScale(tick)}
                        y1={-10}
                        y2={-chartHeight}
                    />
                {/each}
            </g>
            <g class="bars" transform="translate({margin.left} {margin.top})">
                {#each chartData as datum}
                    <rect
                        x={variant == "stacked" ? xScale(datum.x0) : datum[xKey] < 0 ? xScale(datum[xKey]) : xScale(0)}
                        y={variant == "clustered" ? yScale(datum[yKey]) + (zScale(datum[zKey]) - zScale.bandwidth()/4) : yScale(datum[yKey])}
                        height={seriesHeight*0.9}
                        width={Math.abs(xScale(datum[xKey]) - xScale(0))}
                        fill={zKey ? colourScale[datum[zKey]] : colours[0]}
                    />
                    {#if dataLabels}
                        <text
                            class="datalabel"
                            x={xScale(datum[xKey])}
                            dx={datum[xKey] > 0 ? -5 : 5}
                            y={variant == "clustered" ? yScale(datum[yKey]) + (zScale(datum[zKey]) + zScale.bandwidth()/2) : yScale(datum[yKey])}
                            text-anchor={datum[xKey] > 0 ? "end" : "start"}
                            fill="white"
                        >{xFormat ? d3.format(xFormat)(datum[xKey]) : datum[xKey]}</text>
                    {/if}
                {/each}
            </g>
        </svg>
    </div>

<style>
    .y text{
        text-anchor: end
    }
    .x text{
        text-anchor: middle;
    }
    .axisLine{
        stroke-width: 1.5;
        stroke: #b3b3b3;
    }
    /* .tick{
        stroke-width: 1;
        stroke: #D9D9D9;
    } */
    /* .datalabel{
        font-size: 14px;
    } */
    /* text{
        font-family: "Open Sans", sans-serif;
    } */
</style>