tui.util.defineNamespace("fedoc.content", {});
fedoc.content["series_lineChartSeries.js.html"] = "      <div id=\"main\" class=\"main\">\n\n\n\n    \n    <section>\n        <article>\n            <pre class=\"prettyprint source linenums\"><code>/**\n * @fileoverview Line chart series component.\n * @author NHN Ent.\n *         FE Development Lab &lt;dl_javascript@nhnent.com>\n */\n\n'use strict';\n\nvar Series = require('./series'),\n    LineTypeSeriesBase = require('./lineTypeSeriesBase');\n\nvar LineChartSeries = tui.util.defineClass(Series, /** @lends LineChartSeries.prototype */ {\n    /**\n     * Line chart series component.\n     * @constructs LineChartSeries\n     * @extends Series\n     * @mixes LineTypeSeriesBase\n     * @param {object} params parameters\n     *      @param {object} params.model series model\n     *      @param {object} params.options series options\n     *      @param {object} params.theme series theme\n     */\n    init: function() {\n        Series.apply(this, arguments);\n\n        /**\n         * object for requestAnimationFrame\n         * @type {null | {id: number}}\n         */\n        this.movingAnimation = null;\n    },\n\n    /**\n     * Make positions.\n     * @param {number} [seriesWidth] - series width\n     * @returns {Array.&lt;Array.&lt;{left: number, top: number}>>} positions\n     * @private\n     */\n    _makePositions: function(seriesWidth) {\n        return this._makeBasicPositions(seriesWidth);\n    },\n\n    /**\n     * Make series data.\n     * @returns {object} series data\n     * @private\n     * @override\n     */\n    _makeSeriesData: function() {\n        return {\n            chartBackground: this.chartBackground,\n            groupPositions: this._makePositions()\n        };\n    },\n\n    /**\n     * Rerender.\n     * @param {object} data - data for rerendering\n     * @override\n     */\n    rerender: function(data) {\n        this._cancelMovingAnimation();\n        Series.prototype.rerender.call(this, data);\n    }\n});\n\nLineTypeSeriesBase.mixin(LineChartSeries);\n\nmodule.exports = LineChartSeries;\n</code></pre>\n        </article>\n    </section>\n\n\n\n</div>\n\n"