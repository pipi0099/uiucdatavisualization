const margin = {top: 20, right: 120, bottom: 50, left: 50},
    svgWidth = 1200,
    svgHeight = 600,
    width = svgWidth - margin.left - margin.right,
    height = svgHeight - margin.top - margin.bottom;

const colors = ["blue","red","yellow","green","black","blue","gray", "lightgray", "orange"];

const chart = d3.select('#chart')
    .attr("width", svgWidth)
    .attr("height", svgHeight)

const innerChart = chart.append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// x,y values
var xScale = d3.scaleTime().range([0,width]);
var yScale = d3.scaleLinear().range([height, 0]);    

// x,y axis
var xAxis = d3.axisBottom().scale(xScale);
var yAxis = d3.axisLeft().scale(yScale);

// line chart related
var valueline = d3.line()
    .x(function(d){ return xScale(d.date);})
    .y(function(d){ return yScale(d.cases);})
    .curve(d3.curveLinear);


// Adds the svg canvas
var g = innerChart
    // .call(zoom)
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);    

$('.close').click(function() {
    $('.alert').hide();
})

$('.alert').hide();

$("#to_step2").click(function() {
    //d3.selectAll("path").remove();
    innerChart.selectAll("g").remove();
    hide('#step1');
    show('#step2');    
    draw("Texas", "red");
    draw("New Mexico", "cornflowerblue");
})

$("#to_step3").click(function() {
    //d3.selectAll("path").remove();
    innerChart.selectAll("g").remove();
    hide('#step2');
    loadCountries(addCountriesList);
    show('#step3');
    draw("California", "red");
    draw("Oregon", "cornflowerblue");
   
})

$("#startover").click(function() {
    innerChart.selectAll("g").remove();
    hide("#step3");
    hide("#country");
    //d3.selectAll("path").remove();
    show("#step1");
    draw("California", "red");
    draw("Oregon", "cornflowerblue");
})

function load(){
    d3.csv("covid19us.csv").then(function(d){
        console.log(d);
    });
}

// get all countries ( total 304 countries so far so setting it to 400 items per page to get all the countries information. #TODO fix it so get page meta first to get "total" and send 2nd query to dynamically change the per_pages number to have "total" values)
// provide a callback function to execute with loaded data.
function loadStates(callback){
    if (typeof callback !== "function") throw new Error("Wrong callback in loadStates");

    d3.csv("states.csv").then(callback);
}

// get a given country's data
// provide a callback function to execute with loaded data.
function loadCasesByState(state, callback){
    d3.csv("covid19us.csv",   
        function(d){
    return { date : d3.timeParse("%Y-%m-%d")(d.date), state : d.state, cases : d.cases }
  })
        .then(callback);
}


// Only for debugging purpose, provide this function as callback for those API calls to see the loaded data
function debug(d){
    console.log("DEBUG) data loaded:", d);
}


function draw(state, color) {
    console.log("state in draw():", state);

    loadCasesByState(state, drawChart(state, color));
}


function drawChart(state, color){

    console.log("Color parameter received in drawChart", color);

    // done this way to take extra parameter and pass it to the callback.
    return function(data){

        //  clean up everything before drawing a new chart
        // d3.select("body").selectAll("svg > *").remove();
        data = data.filter(function(row) {
        return row['state'] == state;
    }) 

        xScale.domain(d3.extent(data, function(d) { return d.date; }));
        yScale.domain([0, 5000000]);

        // Add the X Axis
        console.log("add x axis");
        innerChart
            .append('g')
            .attr('transform', "translate(0," + height + ")")
            .call(xAxis);

        innerChart
            .append("text")            
            .attr("transform",
                "translate(" + (width/2) + " ," +
                                (height + margin.top + 20) + ")")
            .style("text-anchor", "middle")
            .text("date");

        console.log("add y axis");
        // Add the Y Axis
        innerChart
            .append('g')
            .call(yAxis)
            .attr("y", 6);

        innerChart
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("total cases");


        console.log("draw data");

        /* Initialize tooltip for datapoint */
        tip = d3.tip().attr('class', 'd3-tip').offset([-5, 5]).html(function(d) {
            return "<i style='color:" + color + "'>" + state + " " + d.date + " " + d.cases  + "</i>";
        });  

        var path = innerChart.append("g").append("path")
        .attr("width", width).attr("height",height)
        .datum(data.map( (d, i) => {
            console.log("path : date", d.date, "value", d.cases);
            return {
                date : d.date,
                cases : d.cases
            };
        }
        ))
        .attr("class", "line")
        .attr("d", valueline)
        .style("stroke", color);        

        // datapoint tooltip
        innerChart.append("g").selectAll(".dot")
            .attr("width", width).attr("height",height)
            .data(data)
            .enter()
            .append("circle") // Uses the enter().append() method
            .attr("class", "dot") // Assign a class for styling
            .attr("cx", function(d) { return xScale(d.date) })
            .attr("cy", function(d) { return yScale(d.cases) })
            .attr("r", 0.5)
            .call(tip)
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);

        if (state == true){
            innerChart.selectAll().data(data).enter().append("g").append("text")
            .attr("transform", "translate(" + (width - 20) + "," + yScale(data[data.length - 1].value) + ")")
            .attr("dy", ".15em")
            .attr("text-anchor", "start")
            .style("fill", color)
            .text(state);
        }
    }
}

// callback function
function addCountriesList(data, i){

    d3.select("body")
        .select("#country_select_container")
        .append("select")
        .attr("id", "country")
        .selectAll("options")
        .data(data)
        .enter()
        .append("option")
        .attr("value", function(d){ return d.state; })
        .text(function (d, i){return d.state;});

    d3.select("body").select("#country_select_container").select("select").on("change", function(){
        console.log(d3.select(this).property('value'));
        draw(
            d3.select(this).property('value'),
            "green"
        );
    });
}

// utility functions
function show(step){
    $(step).show();
}

function hide(step){
    $(step).hide();
}
