<script>
  import BarChart from "./BarChart.svelte";
  import BarChartCustom from "./BarChart-custom.svelte"

  import { Grid, GridCell } from "@onsvisual/svelte-components"
  import * as d3 from 'd3';

  let {
    section = null,
    type = section?.chartType,
    data = null,
    options = null
  } = $props();

  let width = $state()

  const directions = ["left", "right", "top", "bottom"];
  const regex = /^\[(?:'[^']*'|"[^"]*"|\d+(?:\.\d+)?)(,?)*]$/;//this regex looks for an array

  function makeProps(type, data, options, section) {
    if (!section) section = {chartType: type, data, ...options};
    let props = {};
    let padding = {left: 50, right: 0, top: 0, bottom: 20};
    let keys = Object.keys(section).filter(key => ![
      "type", "chartType", ...directions.map(dir => `padding-${dir}`)
    ].includes(key));
    keys.forEach(key => {
      if(regex.test(section[key])){//this test if the string looks like an array
        props[key]=JSON.parse(section[key])//if it's an array, parse as an array
      }else{
        props[key]= section[key]
      }
    }
    );
    if (Array.isArray(section.data)) {
      let dims = Object.keys(section.data[0]);
      dims.forEach(dim => {
        if(["x","y","z","r"].includes(dim)){//if the key is either, x,y,z or r, add the string 'key' to it for the props object
          props[`${dim}Key`] = dim
        }else{
          props[dim] = dim
        }
      });
    }
    // directions.forEach(dir => {
    //   if (section[`padding-${dir}`]) padding[dir] = +(section[`padding-${dir}`]);
    // });
    // props.padding = padding;
    
    if (!props.legend && props.legend !== false) props.legend = props.zKey ? true : false;
    return props;
  }

  let props = $derived.by(() => {return makeProps(type, data, options, section) })

  let smData = $derived.by(() => {
    if(props.smKey){
      var smGroups = [...new Set(props.data.map((d) => d[props.smKey]))]
      var fdata = {}
      smGroups.forEach((group) => {
        fdata[group] = props.data.filter((d) => d[props.smKey] == group)
      })
      return fdata
    }
    else{
      return null
    }
  })

  // $inspect(smData)
  // $inspect(props)

</script>

{#if props}
  {#if props.smKey}
    <Grid width="full" colWidth={props.colWidth ? props.colWidth : "wide"}>
      {#each Object.keys(smData) as group, i}
        <GridCell>
            <div>{group}</div>
            {#if type.toLowerCase() === "bar"}
              <BarChart {width} {...props} data={smData[group]}/>
            {/if}
        </GridCell>
      {/each}
    </Grid>
  {:else}
    {#key props.data}
    <div class="chart-container" bind:clientWidth={width}>
      {#if type.toLowerCase() === "bar"}
        <BarChart {width} {...props}/>
      {:else if type.toLowerCase() === "bar-custom"}
        <BarChartCustom {width} {...props}/>

      {/if}
    </div>
    {/key}
  {/if}
{/if}
