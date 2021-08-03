const margin = {top: 20, right: 120, bottom: 50, left: 120},
    svgWidth = 900,
    svgHeight = 600,
    width = svgWidth - margin.left - margin.right,
    height = svgHeight - margin.top - margin.bottom;

const chart = d3.select('#chart')
    .attr("width", svgWidth)
    .attr("height", svgHeight)

const innerChart = chart.append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var xScale = d3.scaleTime().range([0,width]);
var yScale = d3.scaleLinear().range([height, 0]);    

var xAxis = d3.axisBottom().scale(xScale);
var yAxis = d3.axisLeft().scale(yScale);

var valueline = d3.line()
    .x(function(d){ return xScale(d.date);})
    .y(function(d){ return yScale(d.cases);})
    .curve(d3.curveLinear);


var g = innerChart
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);    


$("#to_step2").click(function() {
    innerChart.selectAll("g").remove();
    hide('#step1');
    show('#step2');    
    draw("Texas", "red");
    draw("New Mexico", "green");
})

$("#to_step3").click(function() {
    innerChart.selectAll("g").remove();
    hide('#step2');
    loadStates(StatesList);
    show('#step3');
})

$("#startover").click(function() {
    innerChart.selectAll("g").remove();
    hide("#step3");
    hide("#country");
    show("#step1");
    draw("California", "red");
    draw("Oregon", "green");
})

function load(){
    d3.csv("covid19us.csv").then(function(d){
        console.log(d);
    });
}

function loadStates(callback){
    if (typeof callback !== "function") throw new Error("Wrong callback in loadStates");

    d3.csv("states.csv").then(callback);
}

function loadCasesByState(state, callback){
    d3.csv("covid19us.csv",   
        function(d){
    return { date : d3.timeParse("%Y-%m-%d")(d.date), state : d.state, cases : d.cases }
  })
        .then(callback);
}

function debug(d){
    console.log("DEBUG) data loaded:", d);
}


function draw(state, color) {
    console.log("state in draw():", state);

    loadCasesByState(state, drawChart(state, color));
}


function drawChart(state, color){

    console.log("Color parameter received in drawChart", color);

    return function(data){

        data = data.filter(function(row) {
        return row['state'] == state;
    }) 

        xScale.domain(d3.extent(data, function(d) { return d.date; }));
        yScale.domain([0, 5000000]);

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
            .text("month");

        console.log("add y axis");
      
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

        tip = d3.tip().attr('class', 'd3-tip').offset([-5, 5]).html(function(d) {
            return "<i style='color:" + color + "'>" + state + " " + d3.timeFormat("%Y %B")(d.date) + " " + d.cases  + "</i>";
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
        .style("stroke", color)
        .attr("stroke-width", 1.5);        


        innerChart.append("g").selectAll(".dot")
            .attr("width", width).attr("height",height)
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "dot") // Assign a class for styling
            .attr("cx", function(d) { return xScale(d.date) })
            .attr("cy", function(d) { return yScale(d.cases) })
            .attr("r", 3)
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

function StatesList(data, i){

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

function show(step){
    $(step).show();
}

function hide(step){
    $(step).hide();
}
