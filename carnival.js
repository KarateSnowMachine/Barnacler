hack_pagination = function() {
/*
	// this is an alternate (and more direct method of doing the same thing)
	sailingResultsMgr.GetResults({pageNumber:1, pageSize:"100"})
	return;
*/ 

	var changeIdx = 3; 
	var pagination_elem = $("select#sel-sortcount"); 
	pagination_elem.change(function() {
		console.log("change triggered", $("select#sel-sortcount").val()); 
	});
 
	console.log("set 100 per page"); 
	pagination_elem[0][changeIdx].value="100";
	console.log("change selection") 
	pagination_elem.attr('selectedIndex',changeIdx); 
	console.log("executing .change()"); 
	pagination_elem.change(); 
}

extract_meaty_bits = function() {
	var day_regex =/(\d+)\s+Day\s+[A-z ]+\s+from\s+([A-z, ()]+)/g
	var all_results = []
	var main_block = $("li.search-results-item");
	main_block.each(function(x,e) {
		var results = {}
		results["ports"] = []; 
		results["price"] = [];
		results["date"] = [];
		$(e).css("border", "3px solid red");

		$(e).find("table.content.left").each(function(i,y2) {
 			$(y2).find("a.departurePort").each(function(j,y) {
				results["departurePort"] = $(y).text(); 		
				$(y).css("background-color", "#ccffcc");
			});
			$(y2).find("a.ship").each(function(j,y) {
				results["ship"] = $(y).text(); 		
				$(y).css("background-color", "#ccffcc");
			});
			$(y2).find("a.ports").each(function(j,y) {
				results["ports"].push($(y).text());
				$(y).css("background-color", "#ccffcc");
			});


			$(y2).find("h3").each(function(j, y) {
				$(y).css("border", "3px solid green")
				var day_location = $(y).text();
				day_location = day_location.replace("<br>","")

				console.log("'"+day_location+"'"); 
				results["day_location"] = day_location;
			}); 


			$(e).find("a.book").each(function(i,y) {

				var row = $(y).parent().parent();
				row.css("border", "3px solid blue");
				row.find("span.date", "li.dates").each(function(j,z) {
					$(z).css("background-color", "#ccccff");
					results["date"].push($(z).text());
				});

				row.find("li.interior").each(function(j,z) {

					$(z).css("background-color", "#ccffcc");
					results["price"].push($(z).text());
				});

			});

		});
		all_results.push(results)
	});
	return all_results;
};



var casper = require("casper").create(); 

print_error = function(msg, backtrace) {
	this.echo("=========================");
	this.echo("PAGE.ERROR:");
	this.echo(msg);
	this.echo(backtrace);
	this.echo("=========================");
}

casper.on('remote.message', function(msg) {
		    this.echo('remote message caught: ' + "'"+msg+"'");
			 })

casper.on("page.error", print_error); 
casper.on("error", print_error); 
var fs = require("fs");
var util = require("utils"); 
var output_filename = "json_data/data.json";

var URL = "http://www.carnival.com/BookingEngine/SailingSearch/Search2/?dat=062013,052013,042013,032013,022013,012013,122012&datTo=062013&numGuests=2&dur=D2&dest=C&StateCode=MD&PastGuest=Y&PGEnable=Y";
//#URL="http://www.google.com";
casper.start(URL, function() {
	this.echo("Started"); 
	var x = this.evaluate(function() {
		return jQuery; 
	});
	if (x) {
		this.echo("jQuery is loaded"); 
	}
	if(casper.cli.has(0)) {
		output_filename = this.cli.get(0); 
	}
	this.echo("Writing data to file: '"+output_filename+"'"); 
}); 

casper.waitWhileVisible("#SearchResultsLoader");
casper.wait(1000, function() {
		this.capture("carnival_pre.png");
		this.echo("Changing pagination to 100 per page"); 
		this.evaluate(hack_pagination); 
		this.capture("carnival_page.png");
		}); 
//casper.waitUntilVisible("div.results5"); 
casper.waitUntilVisible("ul.pagination"); 

casper.then(function() {
		this.echo("OK, all results loaded"); 
		});


casper.wait(500, function() { 
		var all_results_from_page = this.evaluate(extract_meaty_bits); 
		fs.write(output_filename, JSON.stringify(all_results_from_page), 'w')
		this.echo("wrote output file '"+output_filename+"'"); 
		this.capture("carnival.png"); 
/*
		this.echo(this.fetchText("table.content.left"));
		//this.echo(this.fetchText("a.ship"));
		//this.echo(this.fetchText("span.price")); 

		//li.search-results-item"))
		results = this.evaluate(function() { 
			var elements = __utils__.findAll("li.search-results-item");
			return Array.prototype.map.call(elements, function(e) {
				return e.innerText;
				}); 
			});

		this.echo("Found "+results.length)
		this.echo(JSON.stringify(results));
		*/
		}); 
casper.run()
		
