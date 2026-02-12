<script>
  import BarChart from "./BarChart.svelte";
  import SmallMultiple from "./SmallMultiple.svelte";
  import '././shared/style.css';
  import { groupData, getScreenSize } from '../js/utils';


  import * as d3 from 'd3';

  let {
    section = null,
    type = section?.chartType,
    data = null,
    options = null
  } = $props();

  let width = $state()

  let size = $derived(getScreenSize(width))

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
      if(Array.isArray(section[key])){
        let sizes = ['sm:','md:','lg:']
        const sizeMatch = sizes.some(substring => 
          section[key].some(item => item.toString().includes(substring))
        )
        if(sizeMatch){
          let propObject = {};
          section[key].forEach((str) => {
            const matchedSize = sizes.find(substring => str.includes(substring)).replace(":","")
            const value = str.replace(matchedSize,"").replace(":","")
            propObject[matchedSize] = !isNaN(value) ? Number(value): value
          })
          props[key] = propObject
        } else {
          props[key] = section[key]
        }
      }
      else if(regex.test(section[key])){//this test if the string looks like an array
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

  let config = $derived.by(() => {return makeProps(type, data, options, section) })

  // Derived state that creates props based on globalProps and size
  let props = $derived(
    Object.entries(config).reduce((acc, [key, value]) => {
      // Check if value is an object with size-specific settings
      if (value && typeof value === 'object' && !Array.isArray(value) && 
          (value.sm !== undefined || value.md !== undefined || value.lg !== undefined)) {
        // It's a size-specific object, get the value for current size
        acc[key] = value[size];
      } else {
        // It's a regular value, pass it through
        acc[key] = value;
      }
      return acc;
    }, {})
  );

  let smData = $derived.by(() => {
      if(props.smKey){
        return groupData(props.data, props.smKey)
      }
      else{
        return null;
      }
  })

</script>

{#if props}
  {#if props.smKey}
    <div class="chart-container" bind:clientWidth={width}>
      <SmallMultiple {props} data={smData} {width} {type} chartEvery={props.chartEvery}/>
    </div>
  {:else}
    {#key props.data}
    <div class="chart-container" bind:clientWidth={width}>
      {#if type.toLowerCase() === "bar"}
        <BarChart {width} {size} {...props}/>
      {/if}
    </div>
    {/key}
  {/if}
{/if}
