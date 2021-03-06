//Add-on for uPlot.lazy made by FQ - MIT License
(function(){
	var Heatmap = function(targetElement, options){
		if (!options) options = {};
		
		var defaultBorderWidth = 1;		//TODO: depends on parent CSS
		
		var boxWidth = options.dataPixelWidth || options.dataPixelSize || 4;
		var boxHeight = options.dataPixelHeight || options.dataPixelSize || 4;
		var colorIndex = options.colorIndex || 0;
		
		var maxDataPoints = (options.maxDataPoints != undefined)? options.maxDataPoints : 150;
		
		targetElement.innerHTML = "";
		var containerSize = targetElement.getBoundingClientRect();
		var drawBoard = document.createElement('canvas');
		drawBoard.style.display = "block";
		drawBoard.width = containerSize.width - 2*defaultBorderWidth;
		drawBoard.height = containerSize.height - 2*defaultBorderWidth;
		targetElement.appendChild(drawBoard);
		
		var drawBoardCtx = drawBoard.getContext("2d");
		
		var data;
		var minZ, maxZ, zRange;
		
		this.resetMax = function(){
			minZ = undefined;
			maxZ = undefined;
		}
		this.setData = function(fullData){
			data = fullData;
		};
		this.getData = function(){
			return data;
		};
		this.addDataArray = function(newDataArray){
			if (!data){
				data = [];
				var scaleX = (!maxDataPoints)? 1 : (drawBoard.width/(maxDataPoints * boxWidth));
				var scaleY = drawBoard.height/(newDataArray.length * boxHeight);
				//console.log(scaleX, scaleY);		//DEBUG
				drawBoardCtx.scale(scaleX, scaleY);
			}
			data.push(newDataArray);
			
			newDataArray.forEach(function(v, i){
				minZ = (minZ == undefined)? v : Math.min(minZ, v);
				maxZ = (maxZ == undefined)? v : Math.max(maxZ, v);
			});
			zRange = maxZ - minZ;
			
			if (maxDataPoints && data.length > maxDataPoints){
				data.shift();
			}
		};
		
		this.draw = function(){
			if (!data) return;
			var yOffset = 0;
			var colorRange = colorData[colorIndex].max/zRange;
			data.forEach(function(dataArray, i){
				for (let j=0; j<dataArray.length; j++){
					let y = dataArray[j];
					//rescale to fit color-palette
					y = Math.round((y - minZ) * colorRange);
					drawBoardCtx.fillStyle = getColor(y);
					drawBoardCtx.fillRect(i*boxWidth, yOffset + (j * boxHeight), boxWidth, boxHeight);
				}
			});
		};
		this.setColorIndex = function(newIndex){
			colorIndex = newIndex;
		}
		function getColor(val){
			return colorData[colorIndex].fun(val);
		}
		var colorData = {
			//grayscale
			0: { max: 255, fun: function(val){ return 'rgb(' + val + ',' + val + ',' + val + ')'; }},
			//blue to red
			1: { max: 255, fun: function(val){ return 'rgb(' + val + ', 0,' + (255 - val) + ')'; }},
			//240 - HSL
			2: { max: 299, fun: function(val){ return 'hsl(' + (240 - val) + ', 100%, 50%)'; }},
			//HSL + 60
			3: { max: 359, fun: function(val){ return 'hsl(' + (60 + val) + ', 100%, 50%)'; }},
			//Extended HSL
			4: { max: 399, fun: function(val){ 
				if (val < 50){ return 'hsl(240, 75%, ' + (val) + '%)'; }
				else if (val < 349){ return 'hsl(' + (240 - val + 50) + ', 75%, 50%)'; }
				else{ return 'hsl(-59, 75%, ' + (val - 299) + '%)'; }
			}}
		}
				
		this.cloneCanvas = function(newTargetElement){
			var newCanvas = document.createElement("canvas");
			newCanvas.width = drawBoard.width;
			newCanvas.height = drawBoard.height;
			newTargetElement.appendChild(newCanvas);
			newCanvas.getContext("2d").drawImage(drawBoard, 0, 0);
		}
	};
	
	uPlot.lazy.Heatmap = Heatmap;
})();
