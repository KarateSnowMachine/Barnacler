#!/usr/bin/Rscript

library(RSQLite)
library(plyr)
library(ggplot2)
library(reshape2)

draw_pngs <- function() {
	con <- dbConnect(drv=dbDriver("SQLite"), "cruises.sqlite")
	df <- dbGetQuery(con, "SELECT * from cruiseData")

	plot_df <- melt(df, id.vars=c("ship", "departureDate", "scrapeDate", "cruiseLength"), measure.vars="price")
	plot_df <- ddply(plot_df, "departureDate", transform, departureMonth=format(as.Date(departureDate), "%b %Y"), departureDay=format(as.Date(departureDate), "%d")) 
	ddply(plot_df, c("ship"), function(df) {
		output_filename = sprintf("%s.png",df[["ship"]][[1]]);
		p<-ggplot(df, aes(x=scrapeDate, y=value, group=departureDay)) + 
				geom_line(aes(color=factor(departureDay))) + 
				facet_grid(departureMonth~cruiseLength) +
				labs(x="Date", y="Price", title=df[["ship"]][[1]])
		png(filename=output_filename);
		print(p);
		dev.off()
		print(sprintf("Wrote file: %s", output_filename))
	});
}
