Barnacler
=========

 A casperJS script to scrape prices off the Carnival website.

## Usage ##

harvest.py -I -s will scrap the page, create the table in sqlite and insert the data. After the initial run you don't have to use the -I flag anymore.

The data flow is as such: 

``harvest.py -> casperjs carnival.js -> json file -> sqlite3``

From there the data can be visualized through a tool of your choice. If you have R installed you can use the prices.R script
I have provided. 

