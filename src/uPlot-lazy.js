(function(){
	uPlot.lazy = {};
	
	//render types
	uPlot.lazy.drawTypes = {
		"points": 		function(){ return null; },
		"line_linear": 	uPlot.paths.linear(),
		"line_smooth": 	uPlot.paths.spline(),
		"bars":   		uPlot.paths.bars({size: [0.8, 30]}),
		"bars_thin":	uPlot.paths.bars({size: [0.6, 16]})	//generate bar builder with 60% bar (40% gap) & 16px max bar width
	};
	uPlot.lazy.defaultPathRenderer = uPlot.paths.linear();
	
	//colors and sizes
	uPlot.lazy.chartBackground = "#141619";
	uPlot.lazy.chartTextColor = "#c7d0d9";
	uPlot.lazy.axisStroke = "#c7d0d9";
	uPlot.lazy.axisGridStroke = "#2c3235";
	uPlot.lazy.axisFont = "12px sans-serif";
	uPlot.lazy.axisGridSize = 1;
	uPlot.lazy.axisTickSize = 1;
	uPlot.lazy.pointSize = 6;
	uPlot.lazy.pointWidth = 1;
	uPlot.lazy.strokeWidth = 2;
	uPlot.lazy.colorPalette = ["#e24d42", "#3caea3", "#f6d55c", "#20639b"];
	uPlot.lazy.fillPalette =  ["#e24d42aa", "#3caea3aa", "#f6d55caa", "#20639baa"];
	
	//more
	uPlot.lazy.defaultLegendHeight = 31;	//TODO: can depend on legend content
	uPlot.lazy.defaultTitleHeight = 27;		//TODO: can depend on title content
	uPlot.lazy.defaultBorderWidth = 1;		//TODO: depends on parent CSS

	function pathRenderer(u, seriesIdx, idx0, idx1, extendGap, buildClip) {
		let s = u.series[seriesIdx];
		let renderer = uPlot.lazy.drawTypes[s.drawType] || uPlot.lazy.defaultPathRenderer;
		return renderer(u, seriesIdx, idx0, idx1, extendGap, buildClip);
	}
	
	function cursorSettings(cfg){
		return {
			show: cfg.showLegend,		//show cursor only when there is a legend to display data
			points: {
				size:   (u, seriesIdx)       => u.series[seriesIdx].points.size * 2.5,
				width:  (u, seriesIdx, size) => size / 4,
				stroke: (u, seriesIdx)       => u.series[seriesIdx].points.stroke(u, seriesIdx) + '90',
				fill:   (u, seriesIdx)       => "#fff",
			}
		}
	}
	
	function scalesSettings(cfg){
		return {
			x: {
				time: !!cfg.isTime,
				auto: !cfg.xRange,
				range: cfg.xRange
			},
			y: {
				auto: !cfg.yRange,
				range: cfg.yRange
			}
		}
	}
	
	function axisSettings(cfg){
		var axisStroke = cfg.axisStroke || uPlot.lazy.axisStroke;
		var axisGridStroke = cfg.axisGridStroke || uPlot.lazy.axisGridStroke;
		var axisFont = cfg.axisFont || uPlot.lazy.axisFont;
		var axisTickSize = cfg.axisTickSize || uPlot.lazy.axisTickSize;
		var axisGridSize = cfg.axisGridSize || uPlot.lazy.axisGridSize;
		return [
			{
				stroke: axisStroke,
				font: axisFont,
				labelFont: axisFont,
				grid: {
					width: axisGridSize / devicePixelRatio,
					stroke: axisGridStroke,
				},
				ticks: {
					width: axisTickSize / devicePixelRatio,
					stroke: axisGridStroke,
				}
			},{
				stroke: axisStroke,
				font: axisFont,
				labelFont: axisFont,
				grid: {
					width: axisGridSize / devicePixelRatio,
					stroke: axisGridStroke,
				},
				ticks: {
					width: axisTickSize / devicePixelRatio,
					stroke: axisGridStroke,
				}
			}
		];
	}
	
	function seriesSettings(cfg){
		var s = [];
		s.push({
			label: cfg.xLabel || "x",
		});
		var N = cfg.data.length - 1;
		var strokes = fillArray(cfg.stroke, uPlot.lazy.colorPalette, N);
		var fills = cfg.fill? fillArray(cfg.fill, uPlot.lazy.fillPalette, N) : new Array(N);
		var yLabels = cfg.yLabel? fillArray(cfg.yLabel, uPlot.lazy.createSequence(1, N, "y"), N) : new Array(N);
		var pointsArray = cfg.points? fillArray(cfg.points, new Array(N), N) : new Array(N);
		for (let i=0; i<N; i++){
			let color = strokes[i];
			let fill = fills[i];
			let points = Object.assign({
				show: ((cfg.showPoints != undefined)? cfg.showPoints : true),
				size: cfg.pointSize || uPlot.lazy.pointSize,
				width: cfg.pointWidth || uPlot.lazy.pointWidth,
				stroke: color,
				fill: fill || color		//TODO: decouple from area fill
			}, pointsArray[i] || cfg.points || {});
			s.push({
				label: yLabels[i] || ("y" + (i + 1)),
				width: ((cfg.strokeWidth || uPlot.lazy.strokeWidth)/devicePixelRatio),
				drawType: cfg.drawType,
				paths: cfg.customPathRenderer || pathRenderer,
				stroke: color,
				fill: fill,
				points: points 
			});
		}
		return s;
	}
	function fillArray(items, rest, requiredN){
		var newArray = [];
		if (Array.isArray(items)){
			if (items.length >= requiredN){
				newArray = items;
			}else{
				newArray.push(...items);
				newArray.push(...rest);
			}
		}else if (items){
			newArray.push(items);
			newArray.push(...rest);
		}else{
			newArray.push(...rest);
		}
		return newArray;
	}
	
	//return plot (e.g. for custom editing)
	uPlot.lazy.getPlotOptions = function(cfg){
		if (!cfg.targetElement) cfg.targetElement = document.body;
		
		cfg.targetElement.style.background = cfg.chartBackground || uPlot.lazy.chartBackground;
		cfg.targetElement.style.color = cfg.chartTextColor || uPlot.lazy.chartTextColor;
		
		//auto-size and adjust height for title and legend
		if (!cfg.width || !cfg.height){
			var canvasSize = canvasSize = calculateInitialSize(cfg);
			if (!cfg.width) cfg.width = canvasSize.width;
			if (!cfg.height) cfg.height = canvasSize.height;
		}
		
		var opts = {
			width: cfg.width,
			height: cfg.height,
			title: cfg.title,
			cursor: cursorSettings(cfg),
			select: {
				show: false,	//TODO: what does this do exactly?
			},
			scales: scalesSettings(cfg),
			axes: axisSettings(cfg),
			legend: {
				show: cfg.showLegend,
			},
			series: seriesSettings(cfg)
		};
		opts.targetElement = cfg.targetElement;		//remember that
		
		return opts;
	}
	//direct plot
	uPlot.lazy.plot = function(cfg){
		var opts = uPlot.lazy.getPlotOptions(cfg);
		return new uPlot(opts, cfg.data, cfg.targetElement);
	}
	//plot with options
	uPlot.lazy.plotWithOptions = function(options, data, appendChart){
		if (!appendChart) options.targetElement.innerHTML = "";
		return new uPlot(options, data, options.targetElement);
	}
	
	//number generators
	uPlot.lazy.createRandomNumbers = function(min, max, N, fun){
		var a = [], f = fun || Math.round;
		var range = max-min;
		for (let i=0; i<N; i++){
			a.push(f(Math.random() * range) + min);
		}
		return a;
	}
	uPlot.lazy.createSequence = function(start, N, prefix){
		prefix = prefix || 0;
		return Array.from({length: N}, (v, i) => prefix + (start + i));
	}
	
	//resize
	uPlot.lazy.resizePlot = function(plot){
		var containerSize = plot.root.parentNode.getBoundingClientRect();
		var title = plot.root.parentNode.querySelector(".u-title");
		var legend = plot.root.parentNode.querySelector(".u-legend");
		var width = containerSize.width - (2* uPlot.lazy.defaultBorderWidth);
		var height = containerSize.height - (legend? legend.getBoundingClientRect().height : 0) 
			- (title? title.getBoundingClientRect().height : 0) - (2* uPlot.lazy.defaultBorderWidth);
		plot.setSize({width: width, height: height});
	}
	function calculateInitialSize(cfg){
		var containerSize = cfg.targetElement.getBoundingClientRect();
		if (cfg.showLegend){
			containerSize.height -= uPlot.lazy.defaultLegendHeight;	
		}
		if (cfg.title){
			containerSize.height -= uPlot.lazy.defaultTitleHeight;	
		}
		containerSize.height -= (2* uPlot.lazy.defaultBorderWidth);
		containerSize.width -= (2* uPlot.lazy.defaultBorderWidth);
		return {height: containerSize.height, width: containerSize.width}
	}
})();
