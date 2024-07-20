
(function(){
var attrArray = ["McDonalds", "Subway", "Burger King", "Taco Bell", "Dominos"]; //list of attributes
var expressed = attrArray[0]; //initial attribute
//chart frame dimensions
var chartWidth = window.innerWidth * 0.8,
    chartHeight = 463,
    leftPadding = 50,
    rightPadding = 0,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//create a scale to size bars proportionally to frame and for axis
var yScale = d3.scaleLinear()
    .range([463, 0])
    .domain([0, 115]);

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    
    //map frame dimensions
    var width = window.innerWidth * .8,
        height = 570;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

        // Append a rectangle for Alaska

    //create Albers equal area conic projection centered on France

var projection = d3.geoAlbersUsa()
    .scale(1200) // Adjust the scale as needed to fit all regions
    .translate([width / 2, height / 2]); // Center the map

// Create separate projections for Alaska and Hawaii
var alaskaProjection = d3.geoAlbers()
    .rotate([154, 0])
    .center([-2, 58.5])
    .parallels([55, 65])
    .scale(500) // Adjust scale for Alaska
    .translate([width - 400, height - 200]) // Adjust position for Alaska
    

var hawaiiProjection = d3.geoAlbers()
    .center([-157, 20])
    .scale(2000) // Adjust scale for Hawaii
    .translate([width - 300, height - 200]);

    var path = d3.geoPath()
    .projection(projection);

    

    //use Promise.all to parallelize asynchronous data loading
    var promises = [d3.csv("data/RandomData.csv"),                    
                    d3.json("data/NewData.topojson"),                                      
                    ];    
    Promise.all(promises).then(callback);
    
    function callback(data){    
        csvData = data[0];    
        us = data[1];   

         //translate US TopoJSON
         var usStates = topojson.feature(us, us.objects.us_states).features;
         usStates = joinData(usStates, csvData)

     //add States to map
     var colorScale = makeColorScale(csvData);
     setEnumerationUnits(usStates, map, path, colorScale);
     //add coordinated visualization to the map
     setChart(csvData, colorScale);
     createDropdown(csvData);
    };

    
    };
     function joinData(usStates, csvData){
        //...DATA JOIN LOOPS FROM EXAMPLE 1.1
//loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<csvData.length; i++){
    var csvRegion = csvData[i]; //the current region
    var csvKey = csvRegion.name; //the CSV primary key
//loop through geojson regions to find correct region
    for (var a=0; a<usStates.length; a++){
    var geojsonProps = usStates[a].properties; //the current region geojson properties
    var geojsonKey = geojsonProps.name; //the geojson primary key
//where primary keys match, transfer csv data to geojson properties object
    if (geojsonKey == csvKey){

//assign all attributes and values
    attrArray.forEach(function(attr){
        var val = parseFloat(csvRegion[attr]); //get csv attribute value
        geojsonProps[attr] = val; //assign attribute and value to geojson properties
        });
    
        };
    };
};return usStates


};
function setEnumerationUnits(usStates, map, path, colorScale){
    var regions = map.selectAll(".regions")
    .data(usStates)
    .enter()
    .append("path")
    .attr("class", function(d){
        return "regions " + d.properties.name;
    })
    .attr("d", path)
    .style("fill", function(d){            
        var value = d.properties[expressed];            
        if(value) {                
            return colorScale(value);            
        } else {                
            return "#ccc";            
        } 
        
    })  //below Example 2.2 line 16...add style descriptor to each path
    
    .on("mouseover", function(event, d){
        highlight(d.properties);
    })

    .on("mouseout", function(event, d){
        dehighlight(d.properties);
    })
    .on("mousemove", moveLabel);
    var desc = regions.append("desc")
    .text('{"stroke": "#000", "stroke-width": "0.5px"}');

};




function makeColorScale(data){
    var colorClasses = [
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
};
//function to create coordinated bar chart
//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //create a scale to size bars proportionally to frame and for axis
    

    var bars = chart.selectAll(".bar")
    .data(csvData)
    .enter()
    .append("rect")
    .sort(function(a, b){
        return b[expressed]-a[expressed]
    })
    
    .attr("class", function(d){
        return "bar " + d.name;
    })
    .attr("width", chartInnerWidth / csvData.length - 1)
    
    .on("mouseover", function(event, d){
        highlight(d);
    })
    .on("mouseout", function(event, d){
        dehighlight(d);
    })
    .on("mousemove", moveLabel)
    var desc = bars.append("desc")
    .text('{"stroke": "none", "stroke-width": "0px"}');
        

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 60)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Number of " + expressed + " per capita in each state");

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

        var yAxisLabel = chart.append("text")
        .attr("class", "yAxisLabel")
        .attr("transform", "rotate(-90)") // Rotate the label
        .attr("x", -chartInnerHeight / 2) // Position it to the left of the chart
        .attr("y", 20) // Adjust position based on your preference
        .style("text-anchor", "middle") // Center-align the text
        .text("Restaurants per capita");

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
        
    updateChart(bars, csvData.length, colorScale);
};
//function to create a dropdown menu for attribute selection
//Example 1.1 line 1...function to create a dropdown menu for attribute selection
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};

//dropdown change event handler
function changeAttribute(attribute, csvData){
    //change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    //recolor enumeration units
    var regions = d3.selectAll(".regions")
        .transition()
        .duration(1000)
        .style("fill", function(d){            
            var value = d.properties[expressed];            
            if(value) {                
                return colorScale(value);           
            } else {                
                return "#ccc";            
            }    
    });
    //Sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
    //Sort bars
    .sort(function(a, b){
        return b[expressed] - a[expressed];
    })
    .transition() //add animation
    .delay(function(d, i){
        return i * 20
    })
    .duration(500);

updateChart(bars, csvData.length, colorScale);
};
//function to position, size, and color bars in chart
function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d, i){
        return i * (chartInnerWidth / n) + leftPadding;
    })
    //size/resize bars
    .attr("height", function(d, i){
        return 463 - yScale(parseFloat(d[expressed]));
    })
    .attr("y", function(d, i){
        return yScale(parseFloat(d[expressed])) + topBottomPadding;
    })
    //color/recolor bars
    .style("fill", function(d){            
        var value = d[expressed];            
        if(value) {                
            return colorScale(value);            
        } else {                
            return "#ccc";            
        }    
});
    //at the bottom of updateChart()...add text to chart title
   
    var chartTitle = d3.select(".chartTitle")
        .text("Number of " + expressed + " per capita in each state");

}; 
//function to highlight enumeration units and bars
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.name)
        .style("stroke", "blue")
        .style("stroke-width", "2");
        setLabel(props)
};
//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.name)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
    d3.select(".infolabel")
    .remove();
};
//function to create dynamic label
function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("name", props.name + "_label")
        .html(labelAttribute);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
};
//function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = event.clientX + 10,
        y1 = event.clientY - 75,
        x2 = event.clientX - labelWidth - 10,
        y2 = event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};

}());




