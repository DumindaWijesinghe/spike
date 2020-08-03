import React, { useState } from 'react';
import './App.scss';
import { Input, Slider, InputNumber } from 'antd';
import Chart from 'react-apexcharts';
import spikeLogo from './assets/img/spike.svg'

const { Search } = Input;

function App() {
  const initialSeries = [2, 4, 3, 4, 5, 7, 6, 7, 8, 9, 7, 6, 7, 6, 4, 4, 3, 2, 5, 9, 8, 4, 2, 1, 8, 7, 6, 6, 5, 3, 7];

  const generateAnnotations = (data) => {
    const annotation = {
      strokeDashArray: 1,
      borderColor: '#fff',
      fillColor: '#fff',
      opacity: 0.3,
      // label: {
      //   text: 'spike',
      //   borderColor: '#fff',
      //   style: {
      //     background: '#fff',
      //     color: '#2F80ED',
      //     fontSize: '8px',
      //   }
      // }
    }

    return data.map(d => ({ ...annotation, x: d.start, x2: d.end }))
  }

  const chartConfig = {
    colors: ['#fff', '#000'],
    chart: {
      id: "basic-bar",
      toolbar: {
        show: false
      },
      foreColor: '#fff',
    },
    grid: {
      show: true,
      strokeDashArray: 2,
    },
    stroke: {
      show: true,
      curve: ['smooth', 'stepline'],
      colors: undefined,
      width: [2, 1.5],
      dashArray: 0,
    },
    xaxis: {
      type: 'numeric',
      tickAmount: 1
    },
    yaxis: {
      type: 'numeric',
      tickAmount: 1,
      labels: {
        formatter: function (val, index) {
          return val.toFixed(2);
        }
      }
    },
  }

  const [options, setOptions] = useState({
    ...chartConfig,
    annotations: {
      position: 'back',
      xaxis: generateAnnotations(detectSpikes(initialSeries)[0])
    }
  });

  const [series, setSeries] = useState([
    {
      name: "data-series",
      data: initialSeries,
      type: 'line',
    },
    {
      name: "z-score",
      data: detectSpikes(initialSeries)[1],
      type: "line",
    }
  ]);

  const onSeries = (e) => {
    const data = e.target.value;
    setSeriesText(data);

    try {
      const newData = data.trim().split(',')
        .filter(n => n.trim() !== '')
        .map(n => Number.parseFloat(n.trim()));


      console.log(spikeOptions);

      setSeries([
        {
          name: "data-series",
          data: newData,
          type: "line",
        },
        {
          name: "z-score",
          data: detectSpikes(newData, spikeOptions)[1],
          type: "line",
        }
      ]);

      setOptions({
        ...chartConfig,
        annotations: {
          position: 'back',
          xaxis: generateAnnotations(detectSpikes(newData, spikeOptions)[0])
        }
      })
    } catch (err) {
      alert(err);
    }
  }

  const [seriesText, setSeriesText] = useState(initialSeries.join(','));

  const [spikeOptions, setSpikeOptions] = useState({
    bufferSize: 2,
    offset: 1,
    factor: 1.1,
  });

  const onBufferSizeChange = (value) => {
    updateSpikeOptions({ bufferSize: value })
  }

  const onFactorChanged = (value) => {
    updateSpikeOptions({ factor: value })
  }

  const onOffsetChanged = (value) => {
    updateSpikeOptions({ offset: value })
  }

  const updateSpikeOptions = (options) => {
    setSpikeOptions({ ...spikeOptions, ...options });
    setOptions({
      ...chartConfig,
      annotations: {
        position: 'back',
        xaxis: generateAnnotations(detectSpikes(series[0].data, { ...spikeOptions, ...options })[0])
      }
    })
    setSeries([
      series[0],
      {
        name: "z-score",
        data: detectSpikes(series[0].data, { ...spikeOptions, ...options })[1],
        type: "line",
      }
    ]);
  }

  const [readMore, setReadMore] = useState(false);

  const handleReadMore = (e) => {
    e.preventDefault()
    setReadMore(true);
  }

  return (
    <div className="app-container">
      <nav className="navigation">
        <div className="nav-logo">
          <img src={spikeLogo} alt="Spike" />
          <span>Tweak a peak signal detection algorithm to your taste</span>
        </div>
      </nav>
      <div className="text-input">
        <Input
          placeholder="input search text"
          style={{ borderRadius: 10 }}
          size="large"
          value={seriesText}
          onChange={value => onSeries(value)}
          allowClear
        />
        <p>Here goes a comma separated list of numbers</p>
      </div>
      <div className="demo">
        <div className="demo__chart">
          <Chart
            options={options}
            series={series}
            height="100%"
          />
        </div>
        <div className="demo__controls">

          <div className="demo__sliders">
            <div className="demo__slider">
              <span className="demo__title">Buffer size </span>
              <InputNumber min={1} max={20} defaultValue={2} onChange={v => onBufferSizeChange(v)} />
              <a href="#" onClick={handleReadMore}>Learn more</a>
              {readMore && <p>
                Values in the buffer with this specified size are subject to the z-score calculation.
                Higher buffer sizes yield more continues z-score changes while lower buffer sizes tend to yield more discrete changes. 
              </p>}
            </div> 
            <div className="demo__slider">
              <span className="demo__title">Ratio </span>
              <InputNumber min={0} max={20} step={0.1} defaultValue={2} onChange={v => onFactorChanged(v)} />
              <a href="#" onClick={handleReadMore}>Learn more</a>
              {readMore && <p>
                This is the slope of the detection function.<br/>
                If the detection function follow <strong style={{display: 'inline-block'}}>y = mx + c</strong>, the ratio will be the value of <strong>m</strong>.
              </p>}
            </div>
            <div className="demo__slider">
              <span className="demo__title">Offset </span>
              <InputNumber min={-1000} max={1000} step={0.1} defaultValue={2} onChange={v => onOffsetChanged(v)} />
              <a href="#" onClick={handleReadMore}>Learn more</a>
              {readMore && <p>
                This is the intersection of the detection function.<br/>
                If the detection function follow <strong style={{display: 'inline-block'}}>y = mx + c</strong>, the offset will be the value of <strong>c</strong>.
              </p>}
            </div>
          </div>
        </div>
      </div>
      <br />
    </div>
  );
}

function detectSpikes(data, options = {
  bufferSize: 2,
  offset: 1,
  factor: 1.1,
}) {
  let start = 0;
  let indexes = []
  const { bufferSize } = options
  const buffer = [];
  const z_scores = [];

  data.forEach((p, i) => {
    buffer.push(p)
    if (buffer.length > bufferSize) {
      buffer.shift()
    }
    const m = mean(buffer);
    const score = ((p - m) / standardDeviation(buffer)) || 0;
    z_scores.push(score)

    if (z_scores[i - 1] && score > z_scores[i - 1]) {
      start = i;
    }

    if (z_scores[i - 1] &&
      score < 0 &&
      score < z_scores[i - 1] &&
      buffer[buffer.length - 2] > options.offset + (options.factor * p)
    ) {
      indexes.push({ start, end: i+1 })
    }
  })

  return [indexes, z_scores];
}


function standardDeviation(values) {
  var avg = mean(values);

  var squareDiffs = values.map(function (value) {
    var diff = value - avg;
    var sqrDiff = diff * diff;
    return sqrDiff;
  });

  var avgSquareDiff = mean(squareDiffs);

  var stdDev = Math.sqrt(avgSquareDiff);
  return stdDev;
}

function mean(data) {
  var sum = data.reduce(function (sum, value) {
    return sum + value;
  }, 0);

  var avg = sum / data.length;
  return avg;
}

export default App;
