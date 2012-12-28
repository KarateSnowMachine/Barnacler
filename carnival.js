

extract_meaty_bits = function() {
	var day_regex =/(\d+)\s+Day\s+[A-z ]+\s+from\s+([A-z, ()]+)/g
	var all_results = []
	var main_block = $("li.search-results-item");
	main_block.each(function(x,e) {
		var results = {}
		$(e).css("border", "3px solid red");

		$(e).find("table.content.left").each(function(i,y2) {
			$(y2).find("h3").each(function(j, y) {
				$(y).css("border", "3px solid green")
				var day_location = $(y).text();
				day_location = day_location.replace("<br>","")

				console.log("'"+day_location+"'"); 
				results["day_location"] = day_location;
			}); 
			results["price"] = [];
			results["date"] = [];

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



var casper = require("casper").create({ 
	clientScripts:	["jquery-1.8.2.min.js"]	,
	verbose: true
		});
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

var URL = "http://www.carnival.com/BookingEngine/SailingSearch/Search2/?dat=062013,052013,042013,032013,022013,012013,122012&datTo=062013&numGuests=2&dur=D2&dest=C&StateCode=MD&PastGuest=Y&PGEnable=Y";
//#URL="http://www.google.com";
casper.start(URL, 
function() {
	this.echo("Started"); 
	var x = this.evaluate(function() {
		return jQuery; 
	});
	if (x) {
		this.echo("jQuery is loaded"); 
	}
}); 

casper.waitWhileVisible("#SearchResultsLoader");

casper.then(function() { 
		this.capture("carnival_pre.png");
		this.echo("OK, page is loaded"); 
		var all_results_from_page = this.evaluate(extract_meaty_bits); 
		this.echo(JSON.stringify(all_results_from_page)); 
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
		
