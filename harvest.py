#!/usr/bin/python 

""" 
This file is part of Barnacler.

Copyright 2012 Paul Rosenfeld

This code is released under a GPLv3 license. See the COPYING and LICENSE
files in this directory for more details. 

"""



import json
import re
import datetime
import pdb
import sqlite3
import tempfile
import subprocess
 

verbose=True


class Cruise:
	def __init__(self, departurePort, ship, price, portsOfCall, lengthLocationString, departureDateString, comment=""):
		self.departurePort = departurePort
		self.ship=ship
		try:
			self.price=float(price[1:].replace(",",""))
		except ValueError:
			self.price=-1.0;

		self.portsOfCall= portsOfCall
		self.cruiseLength = None
		self.returnDate = None
		self.departureDate = None
		self.departureDateFromString(departureDateString)
		self.arrivalDateFromString(lengthLocationString)
		self.scrapeDate = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
		self.comment = comment;

	def departureDateFromString(self, dateStr): 
		regex =  re.compile(r'^\w+,\s+(\w+)\s+(\d+),\s+(\d{4})')
		self.departureDate = datetime.datetime.strptime(" ".join(regex.match(dateStr).groups()), "%b %d %Y")

	def arrivalDateFromString(self, lengthLocationString):
		regex = re.compile(r'^(\d+)\s+Day')
		self.cruiseLength = int(regex.match(lengthLocationString).group(1))
		self.returnDate = self.departureDate + datetime.timedelta(days=self.cruiseLength)

	def getTableCreateString(self, table): 
		typeMap = {str: "varchar(255)", unicode: "varchar(255)", int: "integer", datetime.datetime: "date", float: "double"}
		tableDef = map(lambda x: typeMap[x], map(type, self.__dict__.values()))
		columns = []
		for key, db_type in zip(self.__dict__.keys(), tableDef): 
			columns.append("%s %s"%(key, db_type))
		createStr = "CREATE TABLE IF NOT EXISTS %s (id integer primary key, %s) "%(table, ",".join(columns))
		return createStr; 

	def getInsertString(self, table):
		fields = ",".join(self.__dict__.keys())
		values = ",".join(map(lambda x: "\"%s\""%(x), self.__dict__.values()))
		return "INSERT INTO %s (%s) VALUES (%s);"%(table,fields,values)

	def __str__(self):
		return "%s %s (%s-%s) %d day ports: %s"%(self.ship,self.departurePort, str(self.departureDate),str(self.returnDate), self.cruiseLength, self.portsOfCall)
	
def pretty_print(json_str):
	print json.dumps(json_str, sort_keys=True, indent=2, separators=(',', ': '))

def jsonToCruiseObj(x, date, price, comment=""): 
	return Cruise(x["departurePort"], x["ship"], price, "|".join(x["ports"]), x["day_location"], date)

def execWrapper(cursor, sqlStr):
	if verbose: 
		print "\tEXEC: '%s'"%(sqlStr)
	cursor.execute(sqlStr); 

if __name__ == "__main__":

	from optparse import OptionParser

	opt_parser = OptionParser("Usage: %prog [options]")
	opt_parser.add_option("-i", "--json-file", dest="json_filename", type="string", help="Force insert this json file instead of getting new data")
	opt_parser.add_option("-o", "--sqlite_filename", dest="sqlite_filename", type="string", help="sqlite file to write data to", default="cruises.sqlite")
	opt_parser.add_option("-c", "--comment", dest="comment", type="string", help="a comment to be stored with the data (ex: 'start of sale')", default="")
	opt_parser.add_option("-I", "--init", dest="init_database",action="store_true", help="run CREATE queries to setup tables before inserting data")
	opt_parser.add_option("-s", "--scrape", dest="scrape",action="store_true", help="scrape carnival website for new data")



	(options, args) = opt_parser.parse_args()
	if verbose:
		print "comment: ",options.comment
	tmpFile = tempfile.NamedTemporaryFile(mode="r+b", dir="json_data/", delete=False); 
	if options.scrape:
		cmdStr = "casperjs carnival.js %s"%tmpFile.name
		if verbose: 
			print "Launching scraper: '%s'"%cmdStr
		# launch the harvester 
		stdoutStr = subprocess.Popen(cmdStr.split(" "), stdout=subprocess.PIPE).communicate()[0]; 
		if verbose: 
			print stdoutStr
		textData = tmpFile.read(); 
	elif options.json_filename:
		textData = open(options.json_filename).read()

	if verbose:
		print "Read json: %s"%(textData)
	json_data = json.loads(textData); 
	if verbose: 
		pretty_print(json_data); 
	dbCon = sqlite3.connect(options.sqlite_filename); 
	cursor = dbCon.cursor();
	if options.init_database: 
		execWrapper(cursor, jsonToCruiseObj(json_data[0], json_data[0]["date"][0], json_data[0]["price"][0]).getTableCreateString("cruiseData")) 
	
	for x in json_data: 
		if verbose: 
			print "Cruise: %s on %s from %s to: "%(x["day_location"],x["ship"], x["departurePort"])
			print "	To: "
			for p in x["ports"]:
				print "          %s"%p
		for date,price in zip(x["date"], x["price"]): 
			if verbose: 
				print "\t\t%s\t%s"%(date,price)
			c = jsonToCruiseObj(x, date, price, options.comment)
			if verbose: 
				print "INSERT: %s"%(str(c))
			execWrapper(cursor, c.getInsertString("cruiseData"))
	dbCon.commit(); 
	dbCon.close(); 
