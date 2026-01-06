
export function groupData(data, domain, key) {
  let groups = [];
  if (key) {
    domain.forEach(group => {
      groups.push(data.filter(d => d[key] == group));
    });
  } else {
    groups = [data];
  }
  return groups;
}

export function stackData(data, domain, valKey, grpKey) {
  let groups = [];
  let base = JSON.parse(JSON.stringify(data.filter(d => d[grpKey] == domain[0])));
  base.forEach(d => d[valKey] = 0);
  domain.forEach(group => {
    let clone = JSON.parse(JSON.stringify(data.filter(d => d[grpKey] == group)));
    clone.forEach((d, i) => {
      d[valKey] += base[i][valKey];
      base[i][valKey] = d[valKey];
    });
    groups.push(clone);
  });
  return groups;
}

export function getCSV(data, keys = [], filename) {
  let str = '';
  let newkeys = [];
  keys.forEach(key => {
    if (key && !newkeys.includes(key)) {
      newkeys.push(key);
    }
  });
  str += newkeys.join(',') + '\n';
  data.forEach(d => {
    str += newkeys.map(key => d[key]).join(',') + '\n';
  });
  let content = 'data:text/csv;charset=utf-8,' + encodeURI(str);
  download(content, filename + '.csv');
}

export function getPNG(target, filename, html2canvas) {
  try {
    html2canvas(target)
      .then(canvas => {
        let content = canvas.toDataURL();
        download(content, filename + '.png');
      });
  }
  catch(err) {
    console.log(err);
  }
}

function download(content, filename) {
  var a = document.createElement('a');
  a.href = content;
  a.download = filename;
  a.click();
}

export function commas(num) {
  const parts = String(num).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export function getXAxisTicks({
	data,
	xDataType,
	size,
	config
}) {
	let ticks = [];
	const method = config.xAxisTickMethod || "interval";
	if (xDataType === 'date') {
		const start = data[0].date;
		const end = data[data.length - 1].date;
		if (method === "total") {
			const count = config.xAxisTickCount ? config.xAxisTickCount[size] : 5;
			ticks = d3.scaleTime().domain([start, end]).ticks(count);
		} else if (method === "interval") {
			const interval = config.xAxisTickInterval || { unit: "year", step: { sm: 1, md: 1, lg: 1 } };
			const step = typeof interval.step === 'object' ? interval.step[size] : interval.step;
			let d3Interval;
			switch (interval.unit) {
				case "year":
					d3Interval = d3.timeYear.every(step);
					break;
				case "month":
					d3Interval = d3.timeMonth.every(step);
					break;
				case "quarter":
					d3Interval = d3.timeMonth.every(step * 3);
					break;
				case "day":
					d3Interval = d3.timeDay.every(step);
					break;
				default:
					d3Interval = d3.timeYear.every(1);
			}
			ticks = d3Interval.range(start, d3.timeDay.offset(end, 1));
		}
		if (!Array.isArray(ticks)) ticks = [];
		if (config.addFirstDate && !ticks.some(t => +t === +start)) {
			ticks.unshift(start);
		}
		if (config.addFinalDate && !ticks.some(t => +t === +end)) {
			ticks.push(end);
		}
	} else {
		// Numeric axis
		if (method === "total") {
			const count = config.xAxisTickCount[size] || 5;
			const extent = d3.extent(data, d => d.date);
			ticks = d3.ticks(extent[0], extent[1], count);
		} else if (method === "interval") {
			const interval = config.xAxisTickInterval || { unit: "number", step: { sm: 1, md: 1, lg: 1 } };
			const step = typeof interval.step === 'object' ? interval.step[size] : interval.step;
			const extent = d3.extent(data, d => d.date);
			let current = extent[0];
			while (current <= extent[1]) {
				ticks.push(current);
				current += step;
			}
		}
		if (!Array.isArray(ticks)) ticks = [];
		if (config.addFirstDate && !ticks.some(t => t === data[0].date)) {
			ticks.unshift(data[0].date);
		}
		if (config.addFinalDate && !ticks.some(t => t === data[data.length - 1].date)) {
			ticks.push(data[data.length - 1].date);
		}
	}
	// Remove duplicates and sort
	ticks = Array.from(new Set(ticks.map(t => +t))).sort((a, b) => a - b).map(t => xDataType === 'date' ? new Date(t) : t);
	return ticks;
}