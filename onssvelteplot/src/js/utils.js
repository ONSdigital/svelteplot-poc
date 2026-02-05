import * as d3 from 'd3';

export function getCategoricalDomain({
    data,
	variant = 'simple',
    sort,
    sortKey,
	valueKey = 'x',
    categoryKey = 'y',
    groupKey
}
){
    if(sort == "ascending" && !sortKey && variant == "stacked"){
        let sortedData = [];
        [...new Set(data.map((d) => d[categoryKey]))].forEach((category) => {
            sortedData.push({
                category: category,
                sum: d3.sum(data.filter((d) => d[categoryKey] == category).map((d) => d[valueKey]))
            })
        })
        sortedData = sortedData.sort((a, b) => d3.ascending(a.sum, b.sum))
        return [...new Set(sortedData.map((d) => d.category))]
    } else if(sort == "descending" && !sortKey && variant == "stacked"){
        let sortedData = [];
        [...new Set(data.map((d) => d[categoryKey]))].forEach((category) => {
            sortedData.push({
                category: category,
                sum: d3.sum(data.filter((d) => d[categoryKey] == category).map((d) => d[valueKey]))
            })
        })
        sortedData = sortedData.sort((a, b) => d3.descending(a.sum, b.sum))
        return [...new Set(sortedData.map((d) => d.category))]
    } else if(sort == "ascending" && !sortKey){
        let sortedData = data.sort((a, b) => d3.ascending(a[valueKey], b[valueKey]))
        return [...new Set(sortedData.map((d) => d[categoryKey]))]
    } else if(sort == "descending" && !sortKey){
        let sortedData = data.sort((a, b) => d3.descending(a[valueKey], b[valueKey]))
        return [...new Set(sortedData.map((d) => d[categoryKey]))]
    }
    else if(sort == "ascending" && sortKey){
        let sortedData = data.filter((d) => d[groupKey] == sortKey).sort((a, b) => d3.ascending(a[valueKey], b[valueKey]))
        return [...new Set(sortedData.map((d) => d[categoryKey]))]
    } else if(sort == "descending" && sortKey){
        let sortedData = data.filter((d) => d[groupKey] == sortKey).sort((a, b) => d3.descending(a[valueKey], b[valueKey]))
        return [...new Set(sortedData.map((d) => d[categoryKey]))]
    } else{
        return [...new Set(data.map((d) => d[categoryKey]))]
    }
}

export function getContinuousDomain({
	data, 
	xDomain = 'auto', 
	categoryKey = 'y', 
	valueKey = 'x', 
	variant = 'simple'
}){
	if(xDomain == "auto" && variant != "stacked"){
		if(d3.min(data, d => d[valueKey]) < 0){
			return d3.extent(data, d => d[valueKey]);
		} else{
			return [0, d3.max(data, d => d[valueKey])];
		}
	} else if(xDomain == "auto" && variant == "stacked"){
		const categorySums = d3.rollup(
			data,
			v => d3.sum(v, d => d[valueKey]),
			d => d[categoryKey]
		);
		return [0, d3.max(categorySums.values())];
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

export function textPixelWidth(text,charPixelWidth = 14){
	text = text.toString()
	return text.length * charPixelWidth
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
	categoryKey = 'y', 
	groupKey, 
	variant = 'simple'
}){
	if(variant == "clustered"){
	    return seriesHeight * ([...new Set(data.map((d) => d[categoryKey]))].length * [...new Set(data.map((d) => d[groupKey]))].length)
	} else{
        seriesHeight * ([...new Set(data.map((d) => d[categoryKey]))].length)
	}
}