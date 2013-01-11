#!/usr/bin/Rscript

library(RSQLite)
library(plyr)
library(ggplot2)
library(reshape2)

get_per_ship_plots <- function() {
	con <- dbConnect(drv=dbDriver("SQLite"), "cruises.sqlite")
	df <- dbGetQuery(con, "SELECT * from cruiseData")

	plot_df <- melt(df, id.vars=c("ship", "departureDate", "scrapeDate", "cruiseLength"), measure.vars="price")
	plot_df <- ddply(plot_df, "departureDate", function(df, firstScrapeDate) {
		df <- within(df, departureMonth<-format(as.Date(departureDate), "%b %Y"))
		df <- within(df, departureDay<-as.integer(format(as.Date(departureDate), "%d")))
		df <- within(df, pricePerDay<-value/cruiseLength)
		df <- within(df, scrapeDay<-as.numeric(difftime(strptime(scrapeDate, "%Y-%m-%d %H:%M:%S"),firstScrapeDate,units=c("days"))))
		return(df)
		}, strptime("2013-01-02 00:00:00", format="%Y-%m-%d %H:%M:%S"));

	plots <- dlply(plot_df, c("ship"), function(df) {
		output_filename = sprintf("%s.png",df[["ship"]][[1]]);
		p<-ggplot(df, aes(x=scrapeDay, y=value, group=departureDay,color=factor(departureDay) )) + 
				geom_line() + 
				geom_point() +
				facet_grid(departureMonth~cruiseLength, labeller=label_both) +
				labs(x="Day", y="Price", title=df[["ship"]][[1]])
		return(list(ship=df$ship[[1]], plot=p))
	});
	plots;
}

draw_single_pdf <- function() {
	pdf(file="carnival_all.pdf", width=6)
	l_ply(get_per_ship_plots(), function(l) {
		stopifnot(length(l) == 2)
		print(l$plot)
	});
	dev.off()
	print("Saved pdf"); 
}
draw_png_each <- function() {
	d_ply(get_per_ship_plots, c("ship"), function(df) {
		stopifnot(length(df$plot) == 1)
		filename=df$ship[[1]]
		png(file=filename, width=6);
		print(df$plot[[1]]);
		dev.off();
		print("Saved png %s",filename)
	});	
}

if (!interactive()) {
	draw_single_pdf()
}
