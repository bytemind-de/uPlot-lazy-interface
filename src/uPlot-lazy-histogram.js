//Modified version of: https://github.com/eoinmurray/histogram/ - MIT License
(function(){
    'use strict';
	
    var histogram = function(opts) {
        var data = opts.data;
		var bins_temp;
		if (Array.isArray(opts.bins)){
			bins_temp = opts.bins;
		}else{
			var steps = (opts.bins.end - opts.bins.start)/(opts.bins.n);
			bins_temp = Array.from({length: (opts.bins.n + 1)}, (v, i) => opts.bins.start + i*steps);
		}
        var i = bins_temp.length;

        var bisector = function(f) {
            return {
                left: function(a, x, lo, hi) {
                    if (arguments.length < 3) lo = 0;
                    if (arguments.length < 4) hi = a.length;
                    while (lo < hi) {
                        var mid = lo + hi >>> 1;
                        if (f.call(a, a[mid], mid) < x) lo = mid + 1;
                        else hi = mid;
                    }
                    return lo;
                },
                right: function(a, x, lo, hi) {
                    if (arguments.length < 3) lo = 0;
                    if (arguments.length < 4) hi = a.length;
                    while (lo < hi) {
                        var mid = lo + hi >>> 1;
                        if (x < f.call(a, a[mid], mid)) hi = mid;
                        else lo = mid + 1;
                    }
                    return lo;
                }
            };
        };

        var hist_bisector = bisector(function(d) {
            return d;
        });
        var bisectLeft = hist_bisector.left;
        var bisectRight = hist_bisector.right;
        var bisect = bisectRight;

        var minimum = function(array, f) {
            var i = -1,
                n = array.length,
                a,
                b;
            if (arguments.length === 1) {
                while (++i < n && !((a = array[i]) != null && a <= a)) a = undefined;
                while (++i < n)
                    if ((b = array[i]) != null && a > b) a = b;
            } else {
                while (++i < n && !((a = f.call(array, array[i], i)) != null && a <= a)) a = undefined;
                while (++i < n)
                    if ((b = f.call(array, array[i], i)) != null && a > b) a = b;
            }
            return a;
        };

        var maximum = function(array, f) {
            var i = -1,
                n = array.length,
                a,
                b;
            if (arguments.length === 1) {
                while (++i < n && !((a = array[i]) != null && a <= a)) a = undefined;
                while (++i < n)
                    if ((b = array[i]) != null && b > a) a = b;
            } else {
                while (++i < n && !((a = f.call(array, array[i], i)) != null && a <= a)) a = undefined;
                while (++i < n)
                    if ((b = f.call(array, array[i], i)) != null && b > a) a = b;
            }
            return a;
        };

        function value(x) {
            if (!arguments.length) return valuer;
            valuer = x;
            return histogram;
        };

        function range(x) {
            if (!arguments.length) return ranger;
            ranger = hist_functor(x);
            return histogram;
        };

        function hist_functor(v) {
            return typeof v === "function" ? v : function() {
                return v;
            };
        };

        function bins(x) {
            if (!arguments.length) return binner;
            binner = typeof x === "number" ?
                function(range) {
                    return hist_layout_histogramBinFixed(range, x);
                } :
                hist_functor(x);
            return histogram;
        };

        function frequency(x) {
            if (!arguments.length) return frequency;
            frequency = !!x;
            return histogram;
        };

        function hist_layout_histogramBinSturges(range, values) {
            return hist_layout_histogramBinFixed(range, Math.ceil(Math.log(values.length) / Math.LN2 + 1));
        }

        function hist_layout_histogramBinFixed(range, n) {
            var x = -1,
                b = +range[0],
                m = (range[1] - b) / n,
                f = [];
            while (++x <= n) f[x] = m * x + b;
            return f;
        }

        function hist_layout_histogramRange(values) {
            return [minimum(values), maximum(values)];
        }

        var frequency = true,
            valuer = Number,
            ranger = hist_layout_histogramRange,
            binner = hist_layout_histogramBinSturges;

        bins(bins_temp)

        //var bins = [],
        var values = data.map(valuer, this),
            range = ranger.call(this, values, i),
            thresholds = binner.call(this, range, values, i),
            bin,
            i = -1,
            n = values.length,
            m = thresholds.length - 1,
            k = frequency ? 1 : 1 / n,
            x;
		var outX = [];
		var outY = [];

        while (++i < m) {
            //bin = bins[i] = [];
			//bin.x = thresholds[i];
            //bin.dx = thresholds[i + 1] - bin.x;
            //bin.y = 0;
			outX[i] = (thresholds[i] + thresholds[i + 1])/2;
			outY[i] = 0;
        }

        if (m > 0) {
            i = -1;
            while (++i < n) {
                x = values[i];
                if (x >= range[0] && x <= range[1]) {
					let ii = bisect(thresholds, x, 1, m) - 1;
                    //bin = bins[ii];
                    //bin.y += k;
                    //bin.push(data[i]);
					outY[ii] += k;
                }
            }
        }
        return {x: outX, y: outY};
    }

    uPlot.lazy.histogram = histogram;
})();
