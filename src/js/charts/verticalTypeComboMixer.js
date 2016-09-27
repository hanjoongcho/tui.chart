/**
 * @fileoverview Column and Line Combo chart.
 * @author NHN Ent.
 *         FE Development Lab <dl_javascript@nhnent.com>
 */

'use strict';

var predicate = require('../helpers/predicate');
var calculator = require('../helpers/calculator');
var renderUtil = require('../helpers/renderUtil');
var ChartBase = require('./chartBase');
var ColumnChartSeries = require('../series/columnChartSeries');
var LineChartSeries = require('../series/lineChartSeries');
var AreaChartSeries = require('../series/areaChartSeries');

var verticalTypeComboMixer = {
    /**
     * Column and Line Combo chart.
     * @constructs verticalTypeComboMixer
     * @extends ChartBase
     * @param {Array.<Array>} rawData raw data
     * @param {object} theme chart theme
     * @param {object} options chart options
     */
    _initForVerticalTypeCombo: function(rawData, theme, options) {
        var chartTypesMap = this._makeChartTypesMap(rawData.series, options.yAxis, options.chartType);

        /**
         * chart types map
         * @type {Object}
         */
        this.chartTypes = chartTypesMap.chartTypes;

        /**
         * series names
         * @type {Object|Array.<T>}
         */
        this.seriesNames = chartTypesMap.seriesNames;

        /**
         * chart types for options
         */
        this.optionChartTypes = chartTypesMap.optionChartTypes;

        /**
         * whether has right y axis or not
         * @type {boolean}
         */
        this.hasRightYAxis = tui.util.isArray(options.yAxis) && options.yAxis.length > 1;

        options.tooltip = options.tooltip || {};
        options.tooltip.grouped = true;

        /**
         * yAxis options map
         * @type {object}
         */
        this.yAxisOptionsMap = this._makeYAxisOptionsMap(chartTypesMap.chartTypes, options.yAxis);

        ChartBase.call(this, {
            rawData: rawData,
            theme: theme,
            options: options,
            hasAxes: true,
            isVertical: true
        });
    },

    /**
     * Make chart types map.
     * @param {object} rawSeriesData raw series data
     * @param {object} yAxisOption option for y axis
     * @returns {object} chart types map
     * @private
     */
    _makeChartTypesMap: function(rawSeriesData, yAxisOption) {
        var seriesNames = tui.util.keys(rawSeriesData).sort();
        var optionChartTypes = this._getYAxisOptionChartTypes(seriesNames, yAxisOption);
        var chartTypes = optionChartTypes.length ? optionChartTypes : seriesNames;
        var validChartTypes = tui.util.filter(optionChartTypes, function(_chartType) {
            return rawSeriesData[_chartType].length;
        });
        var chartTypesMap;

        if (validChartTypes.length === 1) {
            chartTypesMap = {
                chartTypes: validChartTypes,
                seriesNames: validChartTypes,
                optionChartTypes: !optionChartTypes.length ? optionChartTypes : validChartTypes
            };
        } else {
            chartTypesMap = {
                chartTypes: chartTypes,
                seriesNames: seriesNames,
                optionChartTypes: optionChartTypes
            };
        }

        return chartTypesMap;
    },

    /**
     * Make yAxis options map.
     * @param {Array.<string>} chartTypes chart types
     * @param {?object} yAxisOptions yAxis options
     * @returns {{column: ?object, line: ?object}} options map
     * @private
     */
    _makeYAxisOptionsMap: function(chartTypes, yAxisOptions) {
        var optionsMap = {};
        yAxisOptions = yAxisOptions || {};
        tui.util.forEachArray(chartTypes, function(chartType, index) {
            optionsMap[chartType] = yAxisOptions[index] || yAxisOptions;
        });

        return optionsMap;
    },

    /**
     * Set additional parameter for making y axis scale option.
     * @param {{isSingleYAxis: boolean}} additionalOptions - additional options
     * @private
     */
    setAdditionalOptions: function(additionalOptions) {
        var dataProcessor = this.dataProcessor;

        tui.util.forEach(this.options.series, function(seriesOption, seriesName) {
            var chartType;

            if (!seriesOption.stackType) {
                return;
            }

            chartType = dataProcessor.findChartType(seriesName);

            if (!predicate.isAllowedStackOption(chartType)) {
                return;
            }

            additionalOptions.chartType = chartType;
            additionalOptions.stackType = seriesOption.stackType;
        });
    },

    /**
     * Make y axis scale option.
     * @param {string} name - component name
     * @param {string} chartType - chart type
     * @param {boolean} isSingleYAxis - whether single y axis or not
     * @returns {{options: object, areaType: string, chartType: string, additionalParams: object}}
     * @private
     */
    _makeYAxisScaleOption: function(name, chartType, isSingleYAxis) {
        var yAxisOption = this.yAxisOptionsMap[chartType];
        var additionalOptions = {
            isSingleYAxis: !!isSingleYAxis
        };

        if (isSingleYAxis && this.options.series) {
            this.setAdditionalOptions(additionalOptions);
        }

        return {
            options: yAxisOption,
            areaType: 'yAxis',
            chartType: chartType,
            additionalOptions: additionalOptions
        };
    },

    /**
     * Get scale option.
     * @returns {{
     *      yAxis: {options: object, areaType: string, chartType: string, additionalParams: object},
     *      rightYAxis: {options: object, areaType: string, chartType: string, additionalParams: object}
     * }}
     * @private
     * @override
     */
    _getScaleOption: function() {
        var isSingleYAxis = this.optionChartTypes.length < 2;
        var scaleOption = {
            yAxis: this._makeYAxisScaleOption('yAxis', this.chartTypes[0], isSingleYAxis)
        };

        if (!isSingleYAxis) {
            scaleOption.rightYAxis = this._makeYAxisScaleOption('rightYAxis', this.chartTypes[1]);
        }

        return scaleOption;
    },

    /**
     * Make data for adding series component.
     * @param {Array.<string>} seriesNames - series names
     * @returns {Array.<object>}
     * @private
     */
    _makeDataForAddingSeriesComponent: function(seriesNames) {
        var seriesClasses = {
            column: ColumnChartSeries,
            line: LineChartSeries,
            area: AreaChartSeries
        };
        var optionsMap = this._makeOptionsMap(seriesNames);
        var themeMap = this._makeThemeMap(seriesNames);
        var dataProcessor = this.dataProcessor;
        var serieses = tui.util.map(seriesNames, function(seriesName) {
            var chartType = dataProcessor.findChartType(seriesName);
            var data = {
                allowNegativeTooltip: true,
                chartType: chartType,
                seriesName: seriesName,
                options: optionsMap[seriesName],
                theme: themeMap[seriesName]
            };

            return {
                name: seriesName + 'Series',
                SeriesClass: seriesClasses[chartType],
                data: data
            };
        });

        return serieses;
    },

    /**
     * Add components.
     * @private
     */
    _addComponents: function() {
        var axes = [
            {
                name: 'yAxis',
                chartType: this.chartTypes[0],
                isVertical: true
            },
            {
                name: 'xAxis'
            }
        ];
        var serieses = this._makeDataForAddingSeriesComponent(this.seriesNames);

        if (this.optionChartTypes.length) {
            axes.push({
                name: 'rightYAxis',
                chartType: this.chartTypes[1],
                isVertical: true
            });
        }

        this._addComponentsForAxisType({
            seriesNames: this.seriesNames,
            axis: axes,
            series: serieses,
            plot: true
        });
    },

    /**
     * Get y axis option chart types.
     * @param {Array.<string>} chartTypes chart types
     * @param {object} yAxisOption - options for y axis
     * @returns {Array.<string>}
     * @private
     */
    _getYAxisOptionChartTypes: function(chartTypes, yAxisOption) {
        var resultChartTypes = chartTypes.slice();
        var yAxisOptions = [].concat(yAxisOption || []);
        var isReverse = false;
        var optionChartTypes;

        if (!yAxisOptions.length || (yAxisOptions.length === 1 && !yAxisOptions[0].chartType)) {
            resultChartTypes = [];
        } else if (yAxisOptions.length) {
            optionChartTypes = tui.util.map(yAxisOptions, function(option) {
                return option.chartType;
            });

            tui.util.forEachArray(optionChartTypes, function(chartType, index) {
                isReverse = isReverse || (chartType && resultChartTypes[index] !== chartType || false);
            });

            if (isReverse) {
                resultChartTypes.reverse();
            }
        }

        return resultChartTypes;
    },

    /**
     * Increase yAxis tick count.
     * @param {number} increaseTickCount increase tick count
     * @param {object} yAxisData yAxis data
     * @private
     */
    _increaseYAxisTickCount: function(increaseTickCount, yAxisData) {
        var formatFunctions = this.dataProcessor.getFormatFunctions();
        var labels;

        yAxisData.limit.max += yAxisData.step * increaseTickCount;
        labels = calculator.makeLabelsFromLimit(yAxisData.limit, yAxisData.step);
        yAxisData.labels = renderUtil.formatValues(labels, formatFunctions, this.chartType, 'yAxis');
        yAxisData.tickCount += increaseTickCount;
        yAxisData.validTickCount += increaseTickCount;
    },

    /**
     * Update tick count to make the same tick count of y Axes(yAxis, rightYAxis).
     * @param {{yAxis: object, rightYAxis: object}} axesData - axesData
     * @private
     */
    _updateYAxisTickCount: function(axesData) {
        var yAxisData = axesData.yAxis;
        var rightYAxisData = axesData.rightYAxis;
        var tickCountDiff = rightYAxisData.tickCount - yAxisData.tickCount;

        if (tickCountDiff > 0) {
            this._increaseYAxisTickCount(tickCountDiff, yAxisData);
        } else if (tickCountDiff < 0) {
            this._increaseYAxisTickCount(-tickCountDiff, rightYAxisData);
        }
    },

    /**
     * Mix in.
     * @param {function} func target function
     * @ignore
     */
    mixin: function(func) {
        tui.util.extend(func.prototype, this);
    }
};


module.exports = verticalTypeComboMixer;
