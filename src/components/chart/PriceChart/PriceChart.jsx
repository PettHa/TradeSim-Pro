import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, ComposedChart, // Bruker ComposedChart for pris/bar
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import Panel from '../../common/Panel/Panel';
import './PriceChart.css';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import { TrendingUp, LineChart as LineChartIcon, BarChart2 } from 'lucide-react';

// --- Formatteringshjelpere ---
const formatVolume = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '';
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return value.toString();
};

const formatXAxisTick = (tickItem, data) => {
    try {
        const date = parseISO(tickItem);
        if (!isValid(date)) return tickItem;
        if (!data || data.length < 2) return format(date, 'MMM d');
        const firstDate = parseISO(data[0]?.date);
        const lastDate = parseISO(data[data.length - 1]?.date);
        if (!isValid(firstDate) || !isValid(lastDate)) return format(date, 'MMM d');
        const totalDays = differenceInDays(lastDate, firstDate);
        if (totalDays <= 2) return format(date, 'HH:mm');
        if (totalDays <= 90) return format(date, 'MMM d');
        if (totalDays <= 365 * 2) return format(date, 'MMM yy');
        return format(date, 'yyyy');
    } catch (e) { return tickItem; }
};

const formatTooltipLabel = (label) => {
     try {
         const date = parseISO(label);
         if (!isValid(date)) return label;
         return format(date, 'PPpp');
     } catch (e) { return label; }
};

function hasIndicatorData(indicatorKey, chartData) {
    return Array.isArray(chartData) && chartData.length > 0 && chartData.some(d => d && d[indicatorKey] !== null && d[indicatorKey] !== undefined);
}

// --- Hovedkomponent ---
const PriceChart = ({ data, isLoading = false, symbol = 'DEMO', indicatorsInChart = [] }) => {

    const [chartType, setChartType] = useState('line');
    const [yAxisScale, setYAxisScale] = useState('linear');
    const [activeIndicators, setActiveIndicators] = useState({
        price: true, volume: false, sma: false, rsi: false,
    });

    useEffect(() => {
        setActiveIndicators({
            price: true,
            volume: hasIndicatorData('volume', data),
            sma: indicatorsInChart.includes('sma20') && hasIndicatorData('sma20', data),
            rsi: indicatorsInChart.includes('rsi') && hasIndicatorData('rsi', data),
        });
    }, [data, indicatorsInChart]);

    const toggleIndicator = (indicator) => {
        setActiveIndicators(prev => ({ ...prev, [indicator]: !prev[indicator] }));
    };

    const toggleYAxisScale = () => {
        setYAxisScale(prev => prev === 'linear' ? 'log' : 'linear');
    };

    const indicatorColors = {
        price: '#3b82f6', volume: '#10b981', sma20: '#ff7300',
        rsi: '#ef4444', rsiLines: '#fca5a5',
    };

    // --- Beregn Domene ---
    let priceDomain = ['auto', 'auto'];
    const relevantPriceKeys = chartType === 'bar' ? ['low', 'high'] : ['close']; // Bruk 'close' for line
    const priceDataPoints = (data || [])
        .flatMap(d => relevantPriceKeys.map(key => d?.[key]))
        .concat(activeIndicators.sma && hasIndicatorData('sma20', data) ? data.map(d => d?.sma20) : [])
        .filter(v => typeof v === 'number' && !isNaN(v) && v > 0);

    if (priceDataPoints.length > 0) {
        const min = Math.max(Math.min(...priceDataPoints), 0.01);
        const max = Math.max(...priceDataPoints);
        let padding;
        if (yAxisScale === 'log') {
            padding = Math.pow(10, Math.max((Math.log10(max) - Math.log10(min)) * 0.05, 0.01)); // Min padding
            priceDomain = [min / padding, max * padding];
        } else {
            padding = Math.max((max - min) * 0.05, 0.1);
            priceDomain = [min - padding, max + padding];
        }
        if (priceDomain[0] <= 0 && yAxisScale === 'log') { priceDomain[0] = 0.01; }
         if (priceDomain[0] >= priceDomain[1]) { // Avoid min >= max
             priceDomain = [priceDomain[0] * 0.9, priceDomain[1] * 1.1];
         }
    }
    // --- Slutt Domeneberegning ---

    const syncId = "tradesimSync";

    // --- Renderingsfunksjoner (Korrigert) ---
    const renderLoadingState = () => (
        <div className="chart-loading">
            <div className="loading-spinner"></div>
            <p>Laster markedsdata for {symbol}...</p>
        </div>
    );

    const renderEmptyState = () => (
        <div className="chart-empty">
            <p>Ingen markedsdata tilgjengelig for {symbol}.</p>
            <p className="chart-empty-suggestion">Sjekk API-tilkobling, valgt symbol eller tidsramme.</p>
        </div>
    );
    // --- Slutt Renderingsfunksjoner ---


    const showPriceChart = activeIndicators.price || activeIndicators.sma;
    const showRsiChart = activeIndicators.rsi && hasIndicatorData('rsi', data);
    const showVolumeChart = activeIndicators.volume && hasIndicatorData('volume', data);
    const visibleSubCharts = [showRsiChart, showVolumeChart].filter(Boolean).length;
    // Justerte høyder for bedre visning
    const mainChartHeight = visibleSubCharts === 2 ? "50%" : (visibleSubCharts === 1 ? "65%" : "100%");
    const subChartHeight = visibleSubCharts === 2 ? "25%" : "35%";


    // --- Tooltip Formatter & Custom Content (Korrigert) ---
    const tooltipFormatter = (value, name, props) => {
        if (name === 'priceRangeHL') { // Navn brukt for Bar
             return null; // Håndteres i custom tooltip
        }
        const formattedValue = typeof value === 'number' ? value.toFixed(2) : value;
        let displayName = name;
        if (name === 'close') displayName = 'Pris (Close)';
        if (name === 'sma20') displayName = 'SMA(20)';
        if (name === 'rsi') displayName = 'RSI(14)';
        if (name === 'volume') return [formatVolume(value), 'Volum']; // Volum formateres spesifikt
        return [formattedValue, displayName];
    };

    const renderCustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload;
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{formatTooltipLabel(label)}</p>
                    {/* Vis OHLC uansett chart type hvis data finnes */}
                    {(hasIndicatorData('open', [dataPoint]) || hasIndicatorData('high', [dataPoint]) || hasIndicatorData('low', [dataPoint]) || hasIndicatorData('close', [dataPoint])) && (
                         <p className="tooltip-ohlc">
                             O: {dataPoint.open?.toFixed(2) ?? 'N/A'} |
                             H: {dataPoint.high?.toFixed(2) ?? 'N/A'} |
                             L: {dataPoint.low?.toFixed(2) ?? 'N/A'} |
                             C: {dataPoint.close?.toFixed(2) ?? 'N/A'}
                         </p>
                    )}
                    {payload.map((entry, index) => {
                        // Unngå å vise den tekniske Bar-verdien direkte
                        if (entry.dataKey === 'priceRangeHL') return null;

                        const formatted = tooltipFormatter(entry.value, entry.dataKey, entry);
                        if (!formatted) return null;
                        const [valStr, nameStr] = formatted;

                        // Bruk stroke for Line, fill for Bar
                        const color = entry.stroke || entry.payload?.fill || '#000';

                        return (
                            <p key={`item-${index}`} style={{ color: color }}>
                                {`${nameStr}: ${valStr}`}
                            </p>
                        );
                    })}
                </div>
            );
        }
        return null;
    };
    // --- Slutt Tooltip ---


    return (
        <Panel title={`Prisutvikling - ${symbol}`}>
            <div className="price-chart-container">
                {/* --- Kontroller --- */}
                 <div className="chart-controls-container">
                     <div className="indicator-toggles-container">
                        <span className="control-group-label">Indikatorer:</span>
                        <label className="indicator-toggle">
                            <input type="checkbox" checked={activeIndicators.price} onChange={() => toggleIndicator('price')} disabled={isLoading || !hasIndicatorData('close', data)} />
                            <span>Pris</span>
                        </label>
                        {hasIndicatorData('sma20', data) && (
                            <label className="indicator-toggle">
                                <input type="checkbox" checked={activeIndicators.sma} onChange={() => toggleIndicator('sma')} disabled={isLoading} />
                                <span>SMA(20)</span>
                            </label>
                        )}
                        {hasIndicatorData('rsi', data) && (
                            <label className="indicator-toggle">
                                <input type="checkbox" checked={activeIndicators.rsi} onChange={() => toggleIndicator('rsi')} disabled={isLoading} />
                                <span>RSI(14)</span>
                            </label>
                        )}
                        {hasIndicatorData('volume', data) && (
                            <label className="indicator-toggle">
                                <input type="checkbox" checked={activeIndicators.volume} onChange={() => toggleIndicator('volume')} disabled={isLoading} />
                                <span>Volum</span>
                            </label>
                        )}
                    </div>
                     <div className="chart-options-container">
                         <div className="control-group">
                            <span className="control-group-label">Chart Type:</span>
                            <button onClick={() => setChartType('line')} className={`chart-option-btn ${chartType === 'line' ? 'active' : ''}`} disabled={isLoading || !hasIndicatorData('close', data)}>
                                <LineChartIcon size={16} /> Linje
                            </button>
                            <button onClick={() => setChartType('bar')} className={`chart-option-btn ${chartType === 'bar' ? 'active' : ''}`} disabled={isLoading || !hasIndicatorData('high', data) || !hasIndicatorData('low', data)}>
                                <BarChart2 size={16} /> Stolpe
                            </button>
                        </div>
                         <div className="control-group">
                             <label className="indicator-toggle">
                                <input type="checkbox" checked={yAxisScale === 'log'} onChange={toggleYAxisScale} disabled={isLoading || !showPriceChart} />
                                <TrendingUp size={16} style={{ marginLeft: '5px', marginRight: '5px' }} aria-hidden="true"/>
                            </label>
                        </div>
                    </div>
                </div>
                {/* --- Slutt Kontroller --- */}


                {/* Chart Area */}
                <div className="multi-chart-area">
                    {isLoading ? renderLoadingState() : (!Array.isArray(data) || data.length === 0) ? renderEmptyState() : (
                        <>
                            {/* --- Hoved Pris/SMA Chart (ComposedChart) --- */}
                            {showPriceChart && (
                                <ResponsiveContainer width="100%" height={mainChartHeight}>
                                    <ComposedChart
                                        key={`price-${chartType}-${yAxisScale}-${data.length}`}
                                        data={data}
                                        syncId={syncId}
                                        margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                                        <XAxis dataKey="date" hide={showRsiChart || showVolumeChart} tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(tick) => formatXAxisTick(tick, data)} height={20} axisLine={false} tickLine={false} />
                                        <YAxis
                                            yAxisId="price"
                                            scale={yAxisScale}
                                            domain={priceDomain}
                                            allowDataOverflow={true}
                                            tick={{ fontSize: 10, fill: '#6b7280' }}
                                            tickFormatter={(value) => (typeof value === 'number' ? value.toFixed(2) : '')}
                                            orientation="left"
                                            width={45}
                                        />
                                        <Tooltip
                                            content={renderCustomTooltip}
                                            cursor={{ stroke: '#a0aec0', strokeWidth: 1, strokeDasharray: '3 3' }}
                                        />
                                        {/* Vis Legend kun hvis SMA er på */}
                                        {activeIndicators.sma && <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '0px', lineHeight: '1' }} verticalAlign="top" height={20}/>}

                                        {/* Betinget rendering av Line eller Bar */}
                                        {activeIndicators.price && chartType === 'line' && hasIndicatorData('close', data) && (
                                            <Line yAxisId="price" type="monotone" dataKey="close" stroke={indicatorColors.price} strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} name="Pris (Close)" isAnimationActive={false}/>
                                        )}
                                        {/* Korrigert Bar for High-Low */}
                                        {activeIndicators.price && chartType === 'bar' && hasIndicatorData('high', data) && hasIndicatorData('low', data) && (
                                            <Bar
                                                yAxisId="price"
                                                dataKey="priceRangeHL" // Bruk en definert nøkkel
                                                fill={indicatorColors.price}
                                                stroke={indicatorColors.price} // Legg til stroke
                                                strokeWidth={1} // Tynn stroke
                                                barSize={5} // Juster bredde etter ønske
                                                name="Pris (H-L)"
                                                isAnimationActive={false}
                                                // Map data før det sendes til chart for å lage priceRangeHL
                                                // Dette bør gjøres utenfor JSX, men for enkelhets skyld her:
                                                shape={(props) => { // Bruk en custom shape (enkel rektangel)
                                                    const { x, y, width, height, low, high, fill, stroke, strokeWidth } = props;
                                                    // Sjekk om low/high finnes
                                                    if (low === undefined || high === undefined || low === null || high === null) return null;
                                                     // Recharts' Bar for array-datakey forventer [y_start, y_end]
                                                    // Vi trenger å konvertere H/L til y-koordinater
                                                    const yHigh = props.yAxis.scale(high);
                                                    const yLow = props.yAxis.scale(low);
                                                    const barHeight = Math.abs(yLow - yHigh);
                                                    const barY = Math.min(yLow, yHigh);

                                                    if (isNaN(barY) || isNaN(barHeight) || barHeight < 0) return null; // Hopp over ugyldige

                                                    return <rect x={x} y={barY} width={width} height={barHeight} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
                                                }}
                                            >
                                                {/* Recharts trenger fortsatt at `data` inneholder `priceRangeHL`
                                                   eller så må vi mappe det her, men det er ikke optimalt.
                                                   Den beste løsningen er å forbehandle `data` før det sendes til Chart.
                                                   Alternativt, bruk `shape` prop for å tegne basert på `low`/`high`.
                                                   Vi bruker `shape` her for en enklere løsning uten forbehandling.
                                                */}
                                            </Bar>
                                        )}

                                        {/* SMA vises alltid som Line */}
                                        {activeIndicators.sma && hasIndicatorData('sma20', data) && (
                                            <Line yAxisId="price" type="monotone" dataKey="sma20" stroke={indicatorColors.sma20} dot={false} strokeWidth={1} name="SMA(20)" isAnimationActive={false}/>
                                        )}
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}

                            {/* --- RSI Sub-Chart --- */}
                            {showRsiChart && (
                                <ResponsiveContainer width="100%" height={subChartHeight}>
                                    {/* RSI LineChart - Ingen endringer her, men sikrer at den fortsatt rendres */}
                                    <LineChart key={`rsi-${data.length}`} data={data} syncId={syncId} margin={{ top: 10, right: 5, left: -25, bottom: 5 }}>
                                         <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                                         <XAxis dataKey="date" hide={showVolumeChart} tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(tick) => formatXAxisTick(tick, data)} height={20} axisLine={false} tickLine={false} />
                                         <YAxis yAxisId="rsi" domain={[0, 100]} ticks={[0, 30, 50, 70, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} width={45} />
                                         <Tooltip content={renderCustomTooltip} cursor={{ stroke: '#a0aec0', strokeWidth: 1, strokeDasharray: '3 3' }}/>
                                         <ReferenceLine yAxisId="rsi" y={70} stroke={indicatorColors.rsiLines} strokeDasharray="3 3" />
                                         <ReferenceLine yAxisId="rsi" y={30} stroke={indicatorColors.rsiLines} strokeDasharray="3 3" />
                                         <Line yAxisId="rsi" type="monotone" dataKey="rsi" stroke={indicatorColors.rsi} dot={false} strokeWidth={1} name="RSI(14)" isAnimationActive={false}/>
                                     </LineChart>
                                </ResponsiveContainer>
                            )}

                            {/* --- Volum Sub-Chart --- */}
                            {showVolumeChart && (
                                <ResponsiveContainer width="100%" height={subChartHeight}>
                                    {/* Volum BarChart - Ingen endringer her */}
                                    <BarChart key={`volume-${data.length}`} data={data} syncId={syncId} margin={{ top: 10, right: 5, left: -25, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(tick) => formatXAxisTick(tick, data)} height={20} axisLine={false} tickLine={false} />
                                        <YAxis yAxisId="volume" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={formatVolume} width={45} />
                                        <Tooltip content={renderCustomTooltip} cursor={{ fill: 'rgba(200, 200, 200, 0.2)' }}/>
                                        <Bar yAxisId="volume" dataKey="volume" fill={indicatorColors.volume} name="Volum" maxBarSize={10} isAnimationActive={false}/>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Panel>
    );
};

export default PriceChart;