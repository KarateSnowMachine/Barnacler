var casper = require("casper").create();

casper.start("http://www.carnival.com/BookingEngine/SailingSearch/Search2/?dat=062013,052013,042013,032013,022013,012013,122012&datTo=062013&numGuests=2&dur=D2&dest=C&StateCode=MD&PastGuest=Y&PGEnable=Y", 
function() {
	this.echo("Started"); 
}); 

casper.waitWhileVisible("#SearchResultsLoader");

casper.then(function() { 
		this.echo("OK, page is loaded"); 
		this.echo(this.fetchText("table.content.left"));
		//this.echo(this.fetchText("a.ship"));
		//this.echo(this.fetchText("span.price")); 

		//li.search-results-item"))
/*
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
		
