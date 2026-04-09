import * as d3 from 'd3';
import { tick } from 'svelte';
import { ONScolours, ONSpalette, oldONSpalette } from './colours.js'

export function wrap(text, width) {
  text.each(function () {
    let text = d3.select(this),
      words = text.text().split(/\s+/).reverse(),
      word,
      line = [],
      lineNumber = 0,
      lineHeight = 1.1, // ems
      y = text.attr("y") ? text.attr("y") : 0,
      x = text.attr("x") ? text.attr("x") : 0,
      dy = parseFloat(text.attr("dy")),
      tspan = text.text(null).append("tspan").attr("x", x);
    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text
          .append("tspan")
          .attr("x", x)
          .attr("dy", lineHeight + "em")
          .text(word);
      }
    }
    let breaks = text.selectAll("tspan").size();
    text.attr("y", function () {
      return y - 6 * (breaks - 1);
    });
  });
}

export function getCategoricalDomain({
    data,
	variant = 'simple',
    sort,
    sortKey,
	valueKey = 'x',
    categoryKey = 'y',
    groupKey = 'z'
}
){
    const comparator = { ascending: d3.ascending, descending: d3.descending }[sort];

    if(sortKey == "difference" && sort && valueKey.length > 1){
        let sortedData = data.sort((a, b) => comparator(a[valueKey[1]] - a[valueKey[0]], b[valueKey[1]] - b[valueKey[0]]))
        return [...new Set(sortedData.map((d) => d[categoryKey]))]
    } else if(!sortKey && sort && variant == "stacked"){
        let sortedData = [];
        [...new Set(data.map((d) => d[categoryKey]))].forEach((category) => {
            sortedData.push({
                category: category,
                sum: d3.sum(data.filter((d) => d[categoryKey] == category).map((d) => d[valueKey]))
            })
        })
        sortedData = sortedData.sort((a, b) => comparator(a.sum, b.sum))
        return [...new Set(sortedData.map((d) => d.category))]
    } else if(!sortKey && sort){
        let sortedData = data.sort((a, b) => comparator(a[valueKey], b[valueKey]))
        return [...new Set(sortedData.map((d) => d[categoryKey]))]
    } else if(sortKey && sort){
        let sortedData = data.filter((d) => d[groupKey] == sortKey).sort((a, b) => comparator(a[valueKey], b[valueKey]))
        return [...new Set(sortedData.map((d) => d[categoryKey]))]
    } else{
        return [...new Set(data.map((d) => d[categoryKey]))]
    }
}

export function getContinuousDomain({
    chartType,
	data, 
	xDomain = 'auto', 
	categoryKey = 'y', 
	valueKey = 'x', 
    groupKey,
    ciKeys,
	variant = 'simple'
}){
    const max = ciKeys ? d3.max([d3.max(data, d => d[valueKey]), d3.max(data, d => d[ciKeys[0]]), d3.max(data, d => d[ciKeys[1]])]) : d3.max(data, d => d[valueKey])
    const min = ciKeys ? d3.min([d3.min(data, d => d[valueKey]), d3.min(data, d => d[ciKeys[0]]), d3.min(data, d => d[ciKeys[1]])]) : d3.min(data, d => d[valueKey])
    if(chartType == "line"){
        if(xDomain == "auto"){
            let buffer = (max - min) * 0.25
            if(min < 0){
                return [min,max]
            } else if(min - buffer < 0){
                return [0,max + min]
            } else{
                return  [min - buffer, max + buffer]
            }
        } else if(xDomain == "data"){
            return [min, max]
        } else{
            return xDomain
        }
    } else{
        if(xDomain == "auto" && variant != "stacked"){
            if(min < 0){
                return d3.extent(data, d => d[valueKey]);
            } else{
                return [0, max];
            }
        } else if(xDomain == "data" && variant != "stacked"){
            return d3.extent(data, d => d[valueKey]);
        } else if(xDomain == "auto" && variant == "stacked"){
            if(groupKey){
                const groupedSums = d3.rollup(
                    data,
                    v => d3.sum(v, d => d[valueKey]),
                    d => d[groupKey],
                    d => d[categoryKey]
                );
                const allValues = [...groupedSums.values()].flatMap(group => [...group.values()]);
                // Sum across categories within each group, then find the max group total
                return [0, d3.max(allValues)];
            }

            const categorySums = d3.rollup(
                data,
                v => d3.sum(v, d => d[valueKey]),
                d => d[categoryKey]
            );
            return [0, d3.max(categorySums.values())];
        } else{
            return xDomain;
        }
    }
}

export function groupData(data, key){
    const grouped = d3.group(data, d => d[key]);
    // Convert Map to object if you need object format
    return Object.fromEntries(grouped);
}

export function stackData({
	data, 
	categoryKey = 'y', 
	valueKey = 'x', 
	categories
}) {
    // Group data by category
    const grouped = groupData(data, categoryKey);
    
    // Transform grouped data for D3 stack
    const dataByCategory = categories.map(category => {
        const categoryData = { category };
        const categoryItems = grouped[category] || [];
        
        categoryItems.forEach((d, i) => {
            categoryData[`segment_${i}`] = d[valueKey];
            categoryData[`data_${i}`] = d;
        });
        
        return categoryData;
    });
    
    // Get max number of segments across all categories
    const maxSegments = Math.max(
        ...Object.values(grouped).map(items => items.length),
        0
    );
    const segmentKeys = Array.from(
        { length: maxSegments }, 
        (_, i) => `segment_${i}`
    );
    
    // Create stack generator and generate stacked data
    const stackGenerator = d3.stack().keys(segmentKeys);
    const series = stackGenerator(dataByCategory);
    
    // Flatten and return stacked positions
    const stackedData = [];
    series.forEach((serie, serieIndex) => {
        serie.forEach((d, categoryIndex) => {
            const originalData = dataByCategory[categoryIndex][`data_${serieIndex}`];
            
            if (originalData) {
                stackedData.push({
                    ...originalData,
                    stackStart: d[0],  // Start position of the stack segment
                    stackEnd: d[1],    // End position of the stack segment
                    stackValue: d[1] - d[0]  // Height/width of the segment
                });
            }
        });
    });
    
    return stackedData;
}

// export function labelPixelWidth(text, charPixelWidth = 6){
// 	text = text.toString()
// 	return text.length * charPixelWidth
// }

export function labelPixelWidth(text, { fontFamily = 'OpenSans', fontSize = '14px', fontWeight = 'normal' } = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;
  return ctx.measureText(text).width;
}

export function getSeriesHeight({
	data, 
	height, 
	categoryKey = 'y', 
	groupKey, 
	variant = 'simple'
}){
	if(variant == "clustered"){
		return height / ([...new Set(data.map((d) => d[categoryKey]))].length * [...new Set(data.map((d) => d[groupKey]))].length)
	} else{
		return height / ([...new Set(data.map((d) => d[categoryKey]))].length)
	}
}

export function getChartHeight({
	data, 
	seriesHeight,
    aspectRatio,
    width,
	categoryKey = 'y', 
	groupKey, 
	variant = 'simple'
}){
    if(aspectRatio && width){
        return width / (aspectRatio[0] / aspectRatio[1])
    } else{
        if(variant == "clustered"){
            return seriesHeight * ([...new Set(data.map((d) => d[categoryKey]))].length * [...new Set(data.map((d) => d[groupKey]))].length)
        } else{
            return seriesHeight * ([...new Set(data.map((d) => d[categoryKey]))].length)
        }
    }
}

export function getAxisMargin({
	domain,
}){
	let lengths = []
    if(Array.isArray(domain)){
        domain.forEach((d) => lengths.push(labelPixelWidth(d) + 10))
        return d3.max(lengths)
    } else{
        return labelPixelWidth(domain) + 10
    }
}

export function getScreenSize(width){
	const mobileBreakpoint = 510;
	const mediumBreakpoint = 600;
	if(width < mobileBreakpoint){
		return 'sm'
	} else if(width < mediumBreakpoint){
		return 'md'
	} else{
		return 'lg'
	}
}

export function flagCloseXInGroups({
    data,
    xScale,
    xKey = 'x',
    yKey = 'y',
    zKey = 'z',
    thresholdPx,
    dyAdjust,
}) {
    if (!Array.isArray(data) || !xScale || typeof xScale !== 'function') {
        if (Array.isArray(data)) {
            data.forEach((d) => { d.dy = 0; });
            return data;
        }
        return [];
    }

    const rows = data.map((d) => ({ ...d, dy: 0 }));
    const groups = d3.group(rows, (d) => d[yKey]);

    for (const group of groups.values()) {
        const zValues = [...new Set(group.map((d) => d[zKey]))];
        if(zValues.length > 1){console.warn("More than 2 series on the chart, turn off chart labels")}
        const firstZ = zValues.length > 0 ? zValues[0] : null;
        const secondZ = zValues.length > 0 ? zValues[1] : null;
        const thirdZ = zValues.length > 0 ? zValues[2] : null;

        group.forEach((d) => {
            const xRaw = d[xKey];
            const xValue = typeof xRaw === 'number' ? xRaw : Number(xRaw);
            const scaledX = xScale(xValue);
            d.__xScaled = Number.isFinite(scaledX) ? scaledX : NaN;
        });

        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                const a = group[i];
                const b = group[j];
                if (!Number.isFinite(a.__xScaled) || !Number.isFinite(b.__xScaled)) continue;
                if (Math.abs(a.__xScaled - b.__xScaled) <= thresholdPx) {
                    if (a[zKey] !== thirdZ) a.dy = a[zKey] === secondZ ? -dyAdjust : -dyAdjust;
                    if (b[zKey] !== thirdZ) b.dy = b[zKey] === secondZ ? -dyAdjust : -dyAdjust;
                    if (a[zKey] !== thirdZ) a.dy = a[zKey] === firstZ ? +dyAdjust : -dyAdjust;
                    if (b[zKey] !== thirdZ) b.dy = b[zKey] === firstZ ? +dyAdjust : -dyAdjust;
                    }
                else 
                {a.dy = 0;
                 b.dy = 0;   
                }
            }
        }

        group.forEach((d) => { delete d.__xScaled; });
    
    }
    return rows;
}

export function getLabelPosition({
    data,
    dataLink,
    xKey = 'x',
    yKey = 'y',
    zKey = 'z',
}) {

// Create a lookup map from dataLink using y as the key
const colourLookup = new Map(
    dataLink.map(d => [d[yKey], d.colour])
);

// Add colour to each row
const rows = data.map((d) => ({
    ...d,
    xMax: false,
    colour: colourLookup.get(d[yKey]) // assign colour from dataLink
}));

const groups = d3.group(rows, (d) => d[yKey]);

for (const group of groups.values()) {
    const series = [...new Set(group.map((d) => d[zKey]))];
    if (series.length > 2) {
    console.warn('More than 2 series on the chart, turn off chart labels');
}

    for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
            const a = group[i];
            const b = group[j];

            if (a[xKey] > b[xKey]) {
                a.xMax = true;
                b.xMax = false;
            } else {
                a.xMax = false;
                b.xMax = true;
            }
        }
    }
}
return rows;
}

function getTranslateY(element) {
    const ctm = element.getCTM()
    const yPosition = ctm.f ? ctm.f : 0
    return yPosition
}

function getTranslateX(element){
    const ctm = element.getCTM()
    const xPosition = ctm.e ? ctm.e : 0
    return xPosition
}

function setTranslateY(label, newY) {
  const transform = label.element.getAttribute('transform');
  const newTransform = transform
    ? transform.replace(/translate\(\s*([^,]+?)\s*,\s*[^)]+?\s*\)/, `translate($1, ${newY})`)
    : `translate(0, ${newY})`;
  label.element.setAttribute('transform', newTransform);
  label.newY = newY
}

function drawElbow(label, xOffset, pointRadius){
    const points = [
        `${label.originalX - xOffset + pointRadius},${label.originalY}`,
        `${label.originalX - xOffset + Math.round(xOffset/2)},${label.originalY}`,
        `${label.originalX - xOffset + Math.round(xOffset/2)},${label.newY}`,
        `${label.originalX},${label.newY}`
    ].join(' ')
    return points
}

export async function resolveDataLabelOverlap({
    container,
    selector, 
    padding = 6
}){
    let labels = []
    const labelElements = Array.from(d3.select(container).selectAll(selector));
    await tick();
  labelElements.forEach((label,i) => {
    labels[i] = {originalY: getTranslateY(label), newY: null, originalX: getTranslateX(label), element: label}
  })
  if (labels.length < 2) return;

   labels.sort((a, b) => a.originalY - b.originalY);
  const MAX_ITERATIONS = 100;
  const MOVE_THRESHOLD = 1;
  const STEP = 2;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let moved = false;

    for (let i = 0; i < labels.length - 1; i++) {
      const a = labels[i];
      const b = labels[i + 1];

      const aY = getTranslateY(a.element);
      const bY = getTranslateY(b.element);
      const labelHeight = 14; // approximate from your bbox ascender (~9.5) plus descender

      const overlap = (aY + labelHeight + padding) - bY;

      if (overlap > MOVE_THRESHOLD) {
        if (aY < bY) {
          setTranslateY(a, aY - STEP);
          setTranslateY(b, bY + STEP);
        } else {
          setTranslateY(a, aY + STEP);
          setTranslateY(b, bY - STEP);
        }
        moved = true;
      }
    }

    d3.select(container).select(".leaderlines").remove()

    const leaderlines = d3.select(container).select(".facet")
            .append("g")
            .attr("class","leaderlines")
    
    labels.forEach((label) => {
        if(label.newY){
            leaderlines.append("polyline")
                .attr("points", drawElbow(label, 15, 4))
                .attr("stroke", ONScolours.grey40)
                .attr("fill","none")
        }
    })

    if (!moved) break;
  }
}

export function zip(keys, values){
    return keys.reduce((obj, key, index) => {
        obj[key] = values[index]
        return obj
    }, {})
}

export function getLegendItems({
    chartType,
    variant = 'simple',
    categories,
    colours,
    highlighted,
    referenceCategory,
    otherLegendLabel,
    confidenceInterval,
    legend = true,
    directLabels
}){
    if(legend == true){
        let obj = {};
        if(chartType == 'line'){
            if(categories){
                if(!directLabels){
                    if(!highlighted){
                        obj = zip(categories,colours)
                    } else{
                        if(referenceCategory){
                            const legendCategories = [highlighted,referenceCategory,otherLegendLabel]
                            const legendColours = [ONScolours.oceanBlue,ONScolours.skyBlue,ONScolours.grey40]
                            obj = zip(legendCategories,legendColours)
                        } else{
                            const legendCategories = [highlighted,otherLegendLabel]
                            const legendColours = [ONScolours.oceanBlue,ONScolours.grey40]
                            obj = zip(legendCategories,legendColours)
                        }
                    }
                    if(confidenceInterval){
                        obj["95% confidence interval"] = ONScolours.grey30
                    }
                } else{
                    if(confidenceInterval){
                        obj["95% confidence interval"] = ONScolours.grey30
                    } 
                    if(categories.length > 6){
                        obj[otherLegendLabel] = ONScolours.grey30
                    }
                }
            } else{
                if(confidenceInterval){
                    obj["95% confidence interval"] = Array.isArray(colours) ? colours[0] : colours
                } else{
                    obj = null
                }
            }
        } else if(chartType == 'bar' || chartType == 'dot'){
            if(categories){
                obj = zip(categories,colours)
            } else{
                obj = null
            }
        } else if(chartType == 'beeswarm'){
            if(!highlighted){
                obj = zip(categories,colours)
            } else{
                const legendCategories = [highlighted,otherLegendLabel]
                const legendColours = [ONScolours.highlightOrange, ...(Array.isArray(colours) ? colours : [colours])]
                obj = zip(legendCategories,legendColours)
            }
        }

        return obj
    }
    else{ return null }
}
