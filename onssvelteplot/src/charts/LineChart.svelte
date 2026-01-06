<script>
    import { Plot, Line, GridY, Text, HTMLTooltip, Dot, Pointer} from 'svelteplot';
    import { format } from "d3-format";
    import { timeParse, timeFormat} from "d3-time-format";
    import { min, max, sort } from "d3-array";
    import { getXAxisTicks } from '../js/utils'

	let { 
        data, 
        variant,
        xKey, 
        yKey,
        zKey,
        xAxisLabel,
        yAxisLabel, 
        xFormat,
        xFormatDate,
        xAxisTickCount,
        xAxisTickInterval,
        yDomainMin = "auto",
        yDomainMax = "auto",
        yFormat,
        addEndMarkers,
        addMarkers,
        directLabels,
        focusGroup,
        referenceGroup,
        focusLabels = ["Selected group", "Reference group", "All other groups"],
        tooltip,
        hover,
        height = 350,
        margin = {top: 20, bottom: 40, right: 120}, 
        colours = variant == "focus" ? ['#206095', '#27A0CC', '#C6C6C6'] : ['#206095','#A8BD3A','#871A5B','#F66068'],
        children
    } = $props();

    let hovered = $state();

    $effect.pre(() => {
        if(xFormatDate){
            data.forEach((d) => {
                d[xKey] = timeParse(xFormatDate)(d[xKey])
            })
        }

        if(variant == "focus"){
            data.forEach((d) =>{
                if(referenceGroup && d[zKey] == referenceGroup){
                    d.focusGroup = focusLabels[1]
                } else if(d[zKey] == focusGroup){
                    d.focusGroup = focusLabels[0]
                } else{
                    d.focusGroup = focusLabels[2]
                }
            })
        }
    })

    let domainZ = $derived.by(() => {
        if(zKey){
            return [...new Set(data.map((d) => d[zKey]))]
        } else{
            return null
        }
    })

    function getYDomain() {
        let min, max;
        if(yDomainMin == "auto"){
            min = min(data.map((d) => d[yKey]))
        } else{
            min = yDomainMin
        }

        if(yDomainMax == "auto"){
            max = max(data.map((d) => d[yKey]))
        } else{
            max = yDomainMax
        }
        let domain = [min, max]
        return domain
    }

    let labels = $derived.by(() => {
        let filteredData;
        let labelData = [];
        domainZ.forEach((group) => {
            filteredData = data.filter((d) => d[zKey] == group && d[yKey] != null)
            labelData.push(filteredData[filteredData.length-1])
        })
        return labelData;
    })

    function closest(data,goal){
        let closest = data.reduce(function(prev, curr) {
                return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
        });
        return closest;
    }
  
</script>

<Plot 
    marginRight={margin.right} 
    marginTop={margin.top} 
    marginBottom={margin.bottom} 
    symbol= {{range: ['circle', 'square', 'diamond2', 'triangle', 'star']}}
    {height}
    y={{  
        label: yAxisLabel ? yAxisLabel : "",
        tickFormat: (d) => yFormat ? format(yFormat)(d) : d
    }} 
    x={{
        label:xAxisLabel ? xAxisLabel : "",
        tickFormat: (d) => xFormatDate ? timeFormat(xFormat)(d) : xFormat ? format(xFormat)(d) : d,
        interval: xAxisTickInterval ? xAxisTickInterval.step + ' ' + xAxisTickInterval.unit : null,
        tickCount: xAxisTickCount,
    }}
    color={{ 
        legend: variant == "small-multiple" || directLabels ? false : true,
        scheme: colours
    }}
>
<GridY stroke="#D9D9D9"/>
    <Line
        data={data}
        x={xKey}
        y={yKey}
        z={variant == "focus" ? "focusGroup" : zKey}
        fx={variant == "small-multiple" ? zKey : null}
        lineClass={(d) => !hover ? "" : hovered == null ? "" : d.datum[zKey] == hovered[0][zKey] ? "hovered" : "greyed"}
        stroke={variant != "small-multiple" ? zKey : null}
        strokeWidth={(d) => variant == "focus" && (d.focusGroup == focusLabels[0] || d.focusGroup == focusLabels[1]) ? 3 : variant == "focus" ? 2 : 3}
    />
    {#if addEndMarkers && !addMarkers}
        <Dot
            data={variant == "focus" ? labels.filter((d) => d.focusGroup == focusLabels[0] || d.focusGroup == focusLabels[1]) : labels}
            x={xKey}
            y={yKey}
            fill={variant != "small-multiple" ? zKey : null}
            symbol={domainZ.length <= 6 ? zKey : null}
            stroke="white"
            strokeWidth={1}
            r={5}
            dotClass={(d) => !hover ? "" : hovered == null ? "" : d[zKey] == hovered[0][zKey] ? "hovered" : "greyed"}
        />
    {/if}
    {#if addMarkers}
        <Dot
            data={variant == "focus" ? data.filter((d) => d.focusGroup == focusLabels[0] || d.focusGroup == focusLabels[1]) : data}
            x={xKey}
            y={yKey}
            fill={variant != "small-multiple" ? zKey : null}
            symbol={domainZ.length <= 6 ? zKey : null}
            stroke="white"
            strokeWidth={1}
            r={5}
            dotClass={(d) => !hover ? "" : hovered == null ? "" : d[zKey] == hovered[0][zKey] ? "hovered" : "hidden"}
        />
    {/if}
    <Pointer
        data={data}
        x={xKey}
        z={zKey}
        y={yKey}
        onupdate={(e) => {
            if(e.length > 0){
                hovered = e
                console.log(hovered[0][zKey])
            } else{
                hovered = null;
            }
        }}
        maxDistance={10}>
    </Pointer>
    
    {#snippet overlay()}
        {#if tooltip}
            <HTMLTooltip
                data={data}
                class="tooltip"
                x={xKey}
                y={yKey}
                z={zKey}>
                {#snippet children({ datum })}
                    <div class="tooltip">
                        <div style="font-weight:600">{datum[zKey]}</div>
                        <div><span style="font-weight:600">{xFormatDate ? timeFormat(xFormat)(datum[xKey]) : xFormat ? format(xFormat)(datum[xKey]) : datum[xKey]} :</span> {yFormat ? format(yFormat)(datum[yKey]) : datum[yKey]}</div>
                    </div>
                {/snippet}
            </HTMLTooltip>
        {/if}
    {/snippet}
    {#if directLabels}
        <Text
            data={labels}
            x={xKey}
            y={yKey}
            z={zKey}
            text={(d) => !hover ? d[zKey] : hovered == null ? d[zKey] : d[zKey] == hovered[0][zKey] ? d[zKey] : ""}
            textClass={(d) => !hover ? "" : hovered == null ? "" : d[zKey] == hovered[0][zKey] ? "hovered" : ""}
            textAnchor="start"
            dx="5"
            fill={variant != "small-multiple" ? zKey : null} />
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
    :global(.tooltip){
        background: white !important;
        padding: 4 !important;
    }
    :global(.hovered path){
        stroke: orange !important;
    }
    :global(.greyed path){
        stroke: #C6C6C6 !important;
    }
    :global(.hovered){
        fill: orange !important;
    }
    :global(.greyed){
        fill: #C6C6C6 !important;
    }
    :global(.hidden){
        display: none;
    }
</style>