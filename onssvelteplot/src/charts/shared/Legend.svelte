    
    <script>

    import * as d3 from 'd3';
    import { symbolAsterisk, symbolDiamond2, symbolPlus, symbolSquare2, symbolTriangle2, symbolX as symbolTimes, symbolCircle, symbolCross, symbolDiamond, symbolSquare, symbolStar, symbolTriangle, symbolWye } from 'd3-shape';


    const symbols = {
    'asterisk': symbolAsterisk,
    'circle': symbolCircle,
    'cross': symbolCross,
    'diamond': symbolDiamond,
    'diamond2': symbolDiamond2,
    'plus': symbolPlus,
    'square': symbolSquare,
    'square2': symbolSquare2,
    'star': symbolStar,
    'times': symbolTimes,
    'triangle': symbolTriangle,
    'triangle2': symbolTriangle2,
    'wye': symbolWye
    }

        let {
            items
        } = $props()

        
    $inspect(items)

    const symbolGenerator = d3.symbol().size(120);
    const getPath = (type) => symbolGenerator.type(type)();

    </script>
    
{#if items}
    <div id="legend">
        {#each Object.keys(items) as item}
            <div class="legend--item">
                <svg height="24" width="24" >
                    <path transform="translate(12,12)" d={getPath(symbols[items[item].symbol])} fill={items[item].colour} />
                </svg>
                <p class="legend--text">{item}</p>
            </div>
        {/each}
    </div>
{/if}