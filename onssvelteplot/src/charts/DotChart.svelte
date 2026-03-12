<script>
    import { Plot, GridX, GridY, BarX, AxisX, AxisY, Text, RuleX, Pointer, stackX, RectX, Dot } from 'svelteplot';
    import { format } from "d3-format";
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
    import { ONScolours, ONSpalette } from '../js/colours';

    let defaultColours = {
        simple: ONSpalette,
        comparison: [ONScolours.previous, ONScolours.current]
    }

    let { 
    data, 
    size,
    width,
    variant = "simple",
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
    hover = false,
    margin = {top: 15, bottom: 50, right: 20}, 
    colours = defaultColours[variant],
    children
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
    }))

    let yAxisMargin = $derived(margin.left ? margin.left : getAxisMargin({domain: domainY}))

    let xScale = $derived(
        d3.scaleLinear().range([0, width-yAxisMargin-margin.right]).domain(domainX)
    )

    let chartHeight = $derived(height ? height : getChartHeight({data: data, cateogryKey: yKey, groupKey: zKey, variant: variant}));

    let categories = $derived(new Set(data.map((d) => d[zKey])))

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

    $inspect("colourScheme", colourScheme);

    let labels = $derived.by(() => {
        let labelData = [...data]
        labelData.forEach((d) => {
            d.labelWidth = labelPixelWidth(d[xKey])
            d.show = true
            d.anchor = xScale(d[xKey]) - d.labelWidth - 14 > 0 ? "end" : "start"
            d.fill = d.anchor == "end" ? "#FFFFFF" : "#414042"
        })
        return labelData
    });

    onMount(() => {
        d3.selectAll(".is-left").attr("text-anchor","end")
    })


    $inspect("dot plot data", data);
    $inspect("labels", labels);
</script>

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
        tickFormat: (d) => yFormat ? format(yFormat)(d) : d
    }}
    x={{ 
        domain: domainX, 
        label:xAxisLabel ? xAxisLabel : "",
        tickFormat: (d) => xFormat ? format(xFormat)(d) : d,
        grid: true
    }}
    color={{ 
        scheme: colours
    }}>

    <Dot
        data={data}
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

            // if(variant != 'simple' && highlighted && d[yKey] != highlighted){
            //     colour = colour + "C7"
            // }
            return colour
        }}
        y={yKey}
        r={6}/>
</Plot>