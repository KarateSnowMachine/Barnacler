#!/usr/bin/python 

import json
import re
import datetime
import pdb
import sqlite3
 

verbose=True


class Cruise:
	def __init__(self, departurePort, ship, price, portsOfCall, lengthLocationString, departureDateString, comment=""):
		self.departurePort = departurePort
		self.ship=ship
		self.price=float(price[1:].replace(",",""))
		self.portsOfCall= portsOfCall
		self.cruiseLength = None
		self.returnDate = None
		self.departureDate = None
		self.departureDateFromString(departureDateString)
		self.arrivalDateFromString(lengthLocationString)
		self.scrapeDate = datetime.datetime.now().strftime("%b %d %Y")
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
	#TODO: optparse
	options = {}; 
	options["json_filename"] = "json_data/test.json";
	options["sqlite_filename"] = "test.sqlite"; 
	options["init_database"] = True; 
	options["comment"] = "a comment here"; 
	
	text_data = open(options["json_filename"]).read()
	if verbose:
		print "Read json: %s"%(text_data)
	json_data = json.loads(text_data); 
	if verbose: 
		pretty_print(json_data); 
	dbCon = sqlite3.connect(options["sqlite_filename"]); 
	cursor = dbCon.cursor();
	if options["init_database"]: 
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
			c = jsonToCruiseObj(x, date, price, options["comment"])
			if verbose: 
				print "INSERT: %s"%(str(c))
			execWrapper(cursor, c.getInsertString("cruiseData"))
	dbCon.commit(); 
	dbCon.close(); 
