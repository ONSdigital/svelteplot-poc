# @onsvisual/onsvelteplot

[![npm version](https://badge.fury.io/js/@onsvisual%2Fonsvelteplot.svg)](https://www.npmjs.com/package/@onsvisual/onsvelteplot)

Reusable chart templates for Svelte projects based off of the [SveltePlot](https://svelteplot.dev/) library. 

This library will aim to replicate all charts available in the [ONSdigital Charts](https://github.com/ONSdigital/Charts) library. It currently contains the following chart types and variants:

Bar Chart: Simple, Clustered and Stacked
Line Chart: Simple and Confidence Interval
Dot chart: Dot, Range, Comparison and Arrow
Scatter Chart: Simple, Besswarm (with binned or force variants)

We will aim to develop the following features for these charts:
- All charts should be responsive to changes in incoming data and props but smooth transitions still need to be added.
- Elements on charts can be highlighted using the highlighted prop, some charts (e.g. Scatter) have options for hover and tooltip functionality. We will aim to extend this functionality across other charts as we develop the library.
- Charts should be able to produce small multiple variants. This is currently possible for bar charts but we will look to improve this functionality and extend it over all chart types in the future.

Further documentation to come.
