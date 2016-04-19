///////////////////////////////////////////////////////////////////////////

//////    VARIABLES

///////////////////////////////////////////////////////////////////////////

var rawData = [],
  currentRawData = [],
  data = [],
  overallFemales = 0,
  overallMales = 0,
  chart = {},
  filters = {
    brownHair: ["HAIR", "Brown Hair"],
    blondHair: ["HAIR", "Blond Hair"],
    brownEyes: ["EYE", "Brown Eyes"],
    blueEyes: ["EYE", "Blue Eyes"],
  };

///////////////////////////////////////////////////////////////////////////

//////    DATA FUNCTIONS

///////////////////////////////////////////////////////////////////////////

// Initiate data and create initial graphs
d3.csv("https://raw.githubusercontent.com/fivethirtyeight/data/master/comic-characters/marvel-wikia-data.csv",function(csv) {

  //Remove rows with missing year or sex information
  rawData = csv.filter(function(d) {
    if(d.Year == "" || d.SEX == "") {
      return false
    } else {
      return true;
    }
  });

  generateGenderData(rawData, createBarGraph);
  drawPie("#pie-of", overallFemales, "#7FC4C5", "#b6ddde");
  drawPie("#pie-om", overallMales, "#533644", "#9e6983");
});

function filterData(dataset, key, value) {
  dataset = dataset.filter(function(d) {

    if(d[key]==value) {
      return true;
    } else {
      return false;
    }
  });

  currentRawData = dataset;

  return dataset;
}

function percentageGenderByDecade(dataset, decade) {

  //Filter the dataset to only the specified decade
  dataset = dataset.filter(function(d) {
    if(d.Year>decade && d.Year<(decade + 10)) {
      return true;
    } else {
      return false;
    }
  });

  // Calculate gender percentages
  total = dataset.length;

  males = d3.sum(dataset, function(d) { if(d["SEX"] == "Male Characters")return true; });
  females = d3.sum(dataset, function(d) { if(d["SEX"] == "Female Characters")return true; });

  result = {
    males: (males/total) * 100,
    females: (females/total) * 100
  }

  return result;
}


function generateGenderData(dataset, callback) {

  //reset data
  data = [];
  overallFemales = 0;
  overallMales = 0;

  // Calculate overall data
  total = dataset.length;
  overallMales = d3.sum(dataset, function(d) { if(d["SEX"] == "Male Characters")return true; });
  overallFemales = d3.sum(dataset, function(d) { if(d["SEX"] == "Female Characters")return true; });

  overallMales = Math.round((overallMales/total) * 100);
  overallFemales = 100 - overallMales;

  // Calculate gender by decade data

  // Get first and last decade
  min = d3.min(dataset, function(d) {
    return d.Year;
  });
  min = parseInt(min/10, 10)*10;

  max = d3.max(dataset, function(d) {
    return d.Year;
  });
  max = parseInt(max/10, 10)*10;

  // Loop through each decade
  for (var i = min; i <= max; i+=10) {
    genders = percentageGenderByDecade(dataset, i);

    decade = {
      group: i + "'s",
      male: genders.males,
      female: genders.females
    }
    
    data.push(decade);

    // console.log(i + "'s");
    // console.log(decade);
  };

  // Draw graph
  if(callback && typeof callback == "function") {
    callback();
  }
}

///////////////////////////////////////////////////////////////////////////

//////    GRAPH/CHART FUNCTIONS

///////////////////////////////////////////////////////////////////////////

// Set up gender gap by decade graph
function createBarGraph() {
  // SET UP DIMENSIONS
  var w = 500,
      h = 230;
      
  // margin.middle is distance from center line to each y-axis
  var margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    middle: 28
  };

  // CREATE SVG
  var chartSVG = d3.select('#chart-gd').append('svg')
    .attr('width', margin.left + w + margin.right)
    .attr('height', margin.top + h + margin.bottom)
    // ADD A GROUP FOR THE SPACE WITHIN THE MARGINS
    .append('g')
      .attr('transform', translation(margin.left, margin.top));

  // the width of each side of the chart
  var regionWidth = w/2 - margin.middle;

  // these are the x-coordinates of the y-axes
  var pointA = regionWidth,
      pointB = w - regionWidth;

  var maxValue = d3.max(data, function(d) {return d.male;});

  // SET UP SCALES
  
  // the xScale goes from 0 to the width of a region
  //  it will be reversed for the left x-axis
  chart.xScale = d3.scale.linear()
    .domain([0, maxValue])
    .range([0, regionWidth])
    .nice();

  chart.xScaleLeft = d3.scale.linear()
    .domain([0, maxValue])
    .range([regionWidth, 0]);

  chart.xScaleRight = d3.scale.linear()
    .domain([0, maxValue])
    .range([0, regionWidth]);

  chart.yScale = d3.scale.ordinal()
    .domain(data.map(function(d) { return d.group; }))
    .rangeRoundBands([h,0], 0.4);

  // SET UP AXES
  var yAxisLeft = d3.svg.axis()
    .scale(chart.yScale)
    .orient('right')
    .tickSize(0,0)
    .tickPadding(margin.middle);

  var yAxisRight = d3.svg.axis()
    .scale(chart.yScale)
    .orient('left')
    .tickSize(0,0)
    .tickFormat('');

  var xAxisRight = d3.svg.axis()
    .scale(chart.xScale)
    .orient('bottom')
    .ticks(0);

  var xAxisLeft = d3.svg.axis()
    // REVERSE THE X-AXIS SCALE ON THE LEFT SIDE BY REVERSING THE RANGE
    .scale(chart.xScale.copy().range([pointA, 0]))
    .orient('bottom')
    .ticks(0);

  // MAKE GROUPS FOR EACH SIDE OF CHART
  // scale(-1,1) is used to reverse the left side so the bars grow left instead of right
  chart.leftBarGroup = chartSVG.append('g')
    .attr("class", "leftBarGroup")
    .attr('transform', translation(pointA, 0) + 'scale(-1,1)');
  chart.rightBarGroup = chartSVG.append('g')
    .attr("class", "rightBarGroup")
    .attr('transform', translation(pointB, 0));

  // DRAW AXES
  chartSVG.append('g')
    .attr('class', 'axis y left')
    .attr('transform', translation(pointA, 0))
    .call(yAxisLeft)
    .selectAll('text')
    .style('text-anchor', 'middle');

  chartSVG.append('g')
    .attr('class', 'axis y right')
    .attr('transform', translation(pointB, 0))
    .call(yAxisRight);

  chartSVG.append('g')
    .attr('class', 'axis x left')
    .attr('transform', translation(0, h))
    .call(xAxisLeft);

  chartSVG.append('g')
    .attr('class', 'axis x right')
    .attr('transform', translation(pointB, h))
    .call(xAxisRight);


  drawBarGraph(data);   
}

// Draw bars on gender gap by decade graph
function drawBarGraph(data) {

  var leftBarGroup = d3.select('.leftBarGroup'); 
  var rightBarGroup = d3.select('.rightBarGroup');

  // DRAW BARS
  var leftbars = leftBarGroup.selectAll('.bar.left')
    .data(data);

  leftbars
    .enter()
    .append('rect')
    .attr('class', 'bar left')
    .attr('x', 5)
    .attr('height', chart.yScale.rangeBand());

  leftbars.exit().remove();

  leftbars
      .attr('y', function(d) { return chart.yScale(d.group); })
      .attr('width', 0)
      .transition()
      .duration(1000)
      .attr('width', function(d) { return chart.xScale(d.female); })

  var rightbars = rightBarGroup.selectAll('.bar.right')
    .data(data);

  rightbars
    .enter()
      .append('rect')
      .attr('class', 'bar right')
      .attr('x', 5)
      .attr('height', chart.yScale.rangeBand());

  rightbars.exit().remove();

  rightbars
    .attr('y', function(d) { return chart.yScale(d.group); })
    .attr('width', 0)
    .transition()
    .duration(1000)
    .attr('width', function(d) { return chart.xScale(d.male); })
}

// Draw pie chart 
function drawPie(target, value, color1, color2) {
  width = 200,
  height = 200,
  radius = Math.min(width, height) / 2;

  svg = d3.select(target)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", translation( width / 2, height / 2));

  // Background arc
  arc = d3.svg.arc()
      .outerRadius(radius)
      .innerRadius(radius - 15)
      .startAngle(0)
      .endAngle(2 * Math.PI);

  // Foreground arc start at 0 and animate to value
  arc0 = d3.svg.arc()
      .outerRadius(radius)
      .innerRadius(radius - 15);

  path = svg.append("path")
      .attr("class", "arcBase")
      .attr("fill", color1)
      .attr("d", arc);

  path1 = svg.append("path")
      .datum({startAngle: 0, endAngle: 0})
      .attr("class", "arcValue")
      .attr("fill", color2)
      .attr("d", arc0);

  path1.transition()
    .duration(1000)
    .call(arcTween, 0, (2 * Math.PI) * (value/100) );


  // Set text in center of chart
  svg.append("text")
    .attr('class', 'textValue')
    .attr('text-anchor', 'middle')
    .attr("font-size", "40px")
    .attr("fill", "white")
    .attr('y', '20px')
    .text(value + "%");
}

// Update pie chart
function updatePie(target, value) {
  path = d3.select(target + " .arcValue");

  // Reset to 0
  arc0 = d3.svg.arc()
      .outerRadius(radius)
      .innerRadius(radius - 15);

  path
    .datum({startAngle: 0, endAngle: 0})
      .attr("d", arc0);

  // Set to new value
  path.transition()
    .duration(1000)
    .call(arcTween, 0, (2 * Math.PI) * (value/100) );

  // Update text
  text = d3.select(target + " .textValue");

  text
    .text(value + "%");
}

///////////////////////////////////////////////////////////////////////////

//////    FILTER FUNCTIONS

///////////////////////////////////////////////////////////////////////////

$(".filterBtn").click(function() {
  filter = $(this).attr("filter");
  filterKey = filters[filter][0];
  filterValue = filters[filter][1];

  

  if ($(this).hasClass("active")) {

    $(this).removeClass("active")
    applyFilter();
  } else {

    // Only allow one filter at a time
    if ($(".filterBtn").hasClass("active")) {
      $(".filterBtn").removeClass("active")
    };

    $(this).addClass("active");
    applyFilter(filterKey, filterValue);
  };
});

function applyFilter(filterKey, filterValue) {
  // If filter was supplied
  if(filterKey) {
    // Generate filtered data
    filteredData = filterData(rawData, filterKey, filterValue);
    generateGenderData(filteredData);
  } else {
    //Generate raw data
    generateGenderData(rawData);
  }

  // Update charts
  drawBarGraph(data);
  updatePie("#pie-of", overallFemales);
  updatePie("#pie-om", overallMales);
}

///////////////////////////////////////////////////////////////////////////

//////    HELPER FUNCTIONS

///////////////////////////////////////////////////////////////////////////

// Animate Arc
function arcTween(transition, newStartAngle, newFinishAngle) {
  transition.attrTween("d", function (d) {
      var interpolateStart = d3.interpolate(d.startAngle, newStartAngle);
      var interpolateEnd = d3.interpolate(d.endAngle, newFinishAngle);
      return function (t) {
          d.startAngle = interpolateStart(t);
          d.endAngle = interpolateEnd(t);
          return arc0(d);
      };
  });
}

// Translate string
function translation(x,y) {
  return 'translate(' + x + ',' + y + ')';
}