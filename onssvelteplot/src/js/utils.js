import * as d3 from 'd3';

export function calculateCategoricalDomain(
    data,
	variant,
    sort,
    sortKey,
	xKey,
    yKey,
    zKey
){
    if(sort == "ascending" && !sortKey && variant == "stacked"){
        let sortedData = [];
        [...new Set(data.map((d) => d[yKey]))].forEach((category) => {
            sortedData.push({
                category: category,
                sum: d3.sum(data.filter((d) => d[yKey] == category).map((d) => d[xKey]))
            })
        })
        sortedData = sortedData.sort((a, b) => d3.ascending(a.sum, b.sum))
        return [...new Set(sortedData.map((d) => d.category))]
    } else if(sort == "descending" && !sortKey && variant == "stacked"){
        let sortedData = [];
        [...new Set(data.map((d) => d[yKey]))].forEach((category) => {
            sortedData.push({
                category: category,
                sum: d3.sum(data.filter((d) => d[yKey] == category).map((d) => d[xKey]))
            })
        })
        sortedData = sortedData.sort((a, b) => d3.descending(a.sum, b.sum))
        return [...new Set(sortedData.map((d) => d.category))]
    } else if(sort == "ascending" && !sortKey){
        let sortedData = data.sort((a, b) => d3.ascending(a[xKey], b[xKey]))
        return [...new Set(sortedData.map((d) => d[yKey]))]
    } else if(sort == "descending" && !sortKey){
        let sortedData = data.sort((a, b) => d3.descending(a[xKey], b[xKey]))
        return [...new Set(sortedData.map((d) => d[yKey]))]
    }
    else if(sort == "ascending" && sortKey){
        let sortedData = data.filter((d) => d[zKey] == sortKey).sort((a, b) => d3.ascending(a[xKey], b[xKey]))
        return [...new Set(sortedData.map((d) => d[yKey]))]
    } else if(sort == "descending" && sortKey){
        let sortedData = data.filter((d) => d[zKey] == sortKey).sort((a, b) => d3.descending(a[xKey], b[xKey]))
        return [...new Set(sortedData.map((d) => d[yKey]))]
    } else{
        return [...new Set(data.map((d) => d[yKey]))]
    }
}