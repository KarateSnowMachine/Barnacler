/* 
 *  
 * This file is part of Hodor.
 * 
 * Copyright 2012 Paul Rosenfeld
 * 
 * This code is released under a GPLv3 license. See the COPYING and LICENSE
 * files in this directory for more details. 
 * 
 */ 

day_regex =/(\d)\sDay\s[A-z ]+\sfrom\s([A-z, ()]+)/g


window.addEventListener('message', function(e){
		console.log("Got the event from page with id="+e.data.id+"url="+e.data.url); 
		// TODO: First throw this back up to bg.js via a sendMessage
		// 			Then move this code up to bg.js and have it shuttle the response back to this callback function 
		request = {"url": e.data.url, "id": e.data.id, "command":"find_cheapest"};
		chrome.extension.sendMessage(request, function(response) { 
			alert("should not be possible to get here"); 
			}); 
		}, false);


chrome.extension.onMessage.addListener(
		function(request, sender, sendResponse) {
			/* 
			 * For each li.search-results-item:
			 * 	Find the port and number of days
			 * 	For Each child of div.results5:
			 * 		Get start sail date
			 * 		Call sendMessage to popup with {port,#days,start date}
			 * 		Paste response url back into a new link into the child node (i.e., results row)
			 */
			console.log("carnival got message, cmd="+request.command); 
			if (request.command == "go") {
				var item_id=0; 
				main_block = $("li.search-results-item");
				main_block.each(function(x,e) {
					var results = {}
					results["targets"] = {}

					$(e).find("h3", "table.content.left").each(function(i,y) {
						var matches = day_regex.exec($(y).text())
						if (matches != null) {
							results["days"] = parseInt(matches[1]);
							results["port"] = matches[2];
						}
					});
				$(e).find("a.book").each(function(i,y) {

					var row = $(y).parent().parent();
					row.css("border", "2px solid blue");
					row.find("span.date", "li.dates").each(function(j,z) {
						// should only be one 
						results["date"] = $(z).text();
					});
					// tell the background we want the URL for this flight 
					results["command"] = "get_url"; 
					console.log("carnival sending request for :")
					chrome.extension.sendMessage(results, function(response) { 
						var item_id_str = "item"+item_id;
						item_id++; 
						row.append($('<div>').attr('id', item_id_str).text(response["url"]));
						document.getElementById(item_id_str).addEventListener("click", function() {
							console.log("carnival sending request for id="+item_id_str+" date="+results["date"]); 
							window.postMessage({"id": item_id_str, "url": response["url"]}, "*");
						});
					});
				});
				});
			}
			else if (request.command == "cheapest_result") {
				var response = request; 
				e_price = document.getElementById(response["id"]);
				var prices = response["prices"];
				var prices_length = prices.length;

				var html_string = "";
				for (i=0; i<prices_length; i++) {
					var price = prices[i];
					var div_id = "price_div_"+i;
					html_string += "<div id=\""+div_id+"\">"+price+"</div>";
				}
				$(e_price).html(html_string); 
				console.log("updated price for cruise; e="+response["id"]+" prices="+response["prices"]);
				sendResponse("all done"); 
			}
		});
