<script>
    import { Plot, GridX, BarX, AxisX, AxisY, Text, RuleX, Pointer, stackX } from 'svelteplot';
    import { format } from "d3-format";
    import { timeParse, timeFormat} from "d3-time-format"
    import { extent, min, max, sum, sort, ascending, descending } from "d3-array"

	let { 
        data, 
        variant = "simple",
        xKey = "x", 
        yKey = "y",
        zKey,
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
        margin = {top: 0, bottom: 0, right: 20, left: 150}, 
        colours = 
            variant == "clustered" ?
                ['#206095', '#27A0CC', '#871A5B', '#A8BD3A', '#F66068', '#05341A'] :
                ['#206095','#A8BD3A','#871A5B','#F66068','#05341A','#27A0CC','#003C57','#22D0B6','#746CB1','#A09FA0'],
        children
    } = $props();

    let hovered = $state();

    let categories = $derived(zKey ? new Set(data.map((d) => d[zKey])) : null)

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
        console.log(coloursvar)
        return coloursvar
    })


    let domainX = $derived.by(() => {
        if(xDomain == "auto" && variant != "stacked"){
            if(min(data.map((d) => d[xKey])) < 0){
                return extent(data.map((d) => d[xKey]))
            } else{
                return [0, max(data.map((d) => d[xKey]))]
            }
        } else if(xDomain == "auto" && variant == "stacked"){
            let maxes = []
            let filteredData;
            let yKeys = [...new Set(data.map((d) => d[yKey]))]
            yKeys.forEach((category) => {
                filteredData = data.filter((d) => d[yKey] == category)
                maxes.push(sum(filteredData.map((d) => d[xKey])))
            })
            return [0, max(maxes)]
        }
    })

    let derivedHeight = $derived.by(() => {
        if(height){
            return height
        } else{
            if(variant == "clustered"){
                return seriesHeight * ([...new Set(data.map((d) => d[yKey]))].length * [...new Set(data.map((d) => d[zKey]))].length)
            } else{
                return seriesHeight * ([...new Set(data.map((d) => d[yKey]))].length)
            }
        }
    })

    $effect(() => {
        if(height){
            if(variant == "clustered"){
                seriesHeight = height / ([...new Set(data.map((d) => d[yKey]))].length * [...new Set(data.map((d) => d[zKey]))].length)
            } else{
                seriesHeight = height / ([...new Set(data.map((d) => d[yKey]))].length)
            }
        }
    })


    let domainY = $derived.by(() => {
        if(ySort == "ascending" && !zSortKey && variant == "stacked"){
            let sortedData = [];
            [...new Set(data.map((d) => d[yKey]))].forEach((category) => {
                sortedData.push({
                    yKey: category,
                    sum: sum(data.filter((d) => d[yKey] == category).map((d) => d[xKey]))
                })
            })
            sortedData = sortedData.sort((a, b) => ascending(a.sum, b.sum))
            return [...new Set(sortedData.map((d) => d.yKey))]
        } else if(ySort == "descending" && !zSortKey && variant == "stacked"){
            let sortedData = [];
            [...new Set(data.map((d) => d[yKey]))].forEach((category) => {
                sortedData.push({
                    yKey: category,
                    sum: sum(data.filter((d) => d[yKey] == category).map((d) => d[xKey]))
                })
            })
            sortedData = sortedData.sort((a, b) => descending(a.sum, b.sum))
            return [...new Set(sortedData.map((d) => d.yKey))]
        } else if(ySort == "ascending" && !zSortKey){
            let sortedData = data.sort((a, b) => ascending(a[xKey], b[xKey]))
            return [...new Set(sortedData.map((d) => d[yKey]))]
        } else if(ySort == "descending" && !zSortKey){
            let sortedData = data.sort((a, b) => descending(a[xKey], b[xKey]))
            return [...new Set(sortedData.map((d) => d[yKey]))]
        }
        else if(ySort == "ascending" && zSortKey){
            let sortedData = data.filter((d) => d[zKey] == zSortKey).sort((a, b) => ascending(a[xKey], b[xKey]))
            return [...new Set(sortedData.map((d) => d[yKey]))]
        } else if(ySort == "descending" && zSortKey){
            let sortedData = data.filter((d) => d[zKey] == zSortKey).sort((a, b) => descending(a[xKey], b[xKey]))
            return [...new Set(sortedData.map((d) => d[yKey]))]
        } else{
            return [...new Set(data.map((d) => d[yKey]))]
        }
    })

    let stackedLabels = $derived.by(() => {
        const charPixelWidth = 7;
        let stackedData = [];
        domainY.forEach((category) => {
            var filteredData = data.filter((d) => d[yKey] == category)
            filteredData.forEach((d, i) => {
                d.xLabelPos = i == 0 ? d[xKey] : filteredData[i-1].xLabelPos + d[xKey]
                d.labelWidth = d[xKey].toString().length * charPixelWidth
            })
            stackedData.push(...filteredData)
        })
        console.log(stackedData)
        return stackedData
    })
    
    // let chartData = $derived.by(() => {
    //     if(ySort == "ascending"){
    //         return sort(data, (a, b) => ascending(a[xKey], b[xKey]))
    //     } else if(ySort == "descending"){
    //         return sort(data, (a, b) => descending(a[xKey], b[xKey]))
    //     } else{
    //         return data
    //     }
    // })

    // let chartYDomain = $derived(!yDomain ? [...new Set(chartData.map((d) => d[yKey]))] : yDomain)

</script>

{#if categories}
    <div class="legend">
        {#each categories as legendItem, i}
            <div class="legend-item">
                <svg height=24 width=24>
                    <circle
                        cx=12
                        cy=12
                        r=7
                        fill={colourScheme[legendItem]}
                    />
                </svg>
                <p>{legendItem}</p>
            </div>
        {/each}
    </div>
{/if}

<Plot 
    marginLeft={margin.left ? margin.left : null}
    marginRight={margin.right ? margin.right : null}
    marginTop={margin.top ? margin.top : null}
    marginBottom={margin.bottom ? margin.bottom : null}
    height = {derivedHeight ? derivedHeight : height} 
    y={{ 
        axis: 'left',
        domain: variant == "clustered" ? null : domainY, 
        tickSpacing: 10, 
        label: yAxisLabel ? yAxisLabel : "",
        tickFormat: (d) => variant == "clustered" ? "" : yFormatDate ? timeFormat(yFormat)(timeParse(yFormatDate)(d)) : yFormat ? format(yFormat)(d) : d
    }} 
    x={{ 
        domain: domainX, 
        label:xAxisLabel ? xAxisLabel : "",
        tickFormat: (d) => xFormatDate ? timeFormat(xFormat)(timeParse(xFormatDate)(d)) : xFormat ? format(xFormat)(d) : d
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
            dx: -margin.left + 8
        }
    }}
>
    <AxisX
       tickCount={xAxisTicks}
       tickSize={derivedHeight ? -derivedHeight : -height}
    />
    <BarX 
        data={data}
        x={xKey} 
        y={variant == "clustered" ? zKey : yKey}
        fy={variant == "clustered" ? yKey : null}
        fx={variant == "small-multiple" ? zKey : null}
        order={variant == "clustered" ? 'z' : null}
        sort={!ySort ? false : ySort == "ascending" ? { channel: 'x' } : { channel: '-x' }}
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
            data={variant == "stacked" ? stackedLabels : data}
            x={variant == "stacked" ? "xLabelPos" : xKey} 
            y={variant == "clustered" ? zKey : yKey}
            fy={variant == "clustered" ? yKey : null}
            fx={variant == "small-multiple" ? zKey : null}
            textAnchor={(d) => {
                    if(variant == "stacked"){
                        return d[xKey] > 0 ? "end" : "start"
                    } else{
                        return d[xKey] < domainX[1]*0.2 ? "start" : "end"
                    }
                }
            }
            dx={(d) => {
                if(variant == "stacked"){
                    return -4
                } else{
                    return d[xKey] < domainX[1]*0.2 ? 4 : -4}
                }
            }
            text={(d) => dataLabels.format ? format(dataLabels.format)(d[xKey]) : xFormat ? format(xFormat)(d[xKey]) : d[xKey]}
            textClass="dataLabel"
            fill={"#FFFFFF"}
        />
    {/if}
    {#if children}
        {@render children()}
    {/if}
</Plot>

<style>
	:global(.tick line, .grid-x line, .grid-y line){
		stroke: #D9D9D9 !important;
		stroke-width: 1px !important;
		stroke-opacity: 1 !important;
	}
	:global(text){
		font-family: 'OpenSans', 'Helvetica Neue', arial, sans-serif !important;
        font-size: 14px !important;
	}
    :global(.dataLabel){
        font-weight: 600 !important;
    }
    :global(.item){
        font-size: 14px !important;
    }
    :global(.item rect){
        ry: 12;
    }
    .legend{
        display: flex;
        flex-direction: row;
    }
    .legend-item{
        display: flex;
        flex-direction: row;
    }
</style>