#!/usr/bin/python 

import json 
verbose=True

def pretty_print(json_str):
	print json.dumps(json_str, sort_keys=True, indent=2, separators=(',', ': '))

text_data = open("json_data/test.json").read()
if verbose:
	print "Read json: %s"%(text_data)
json_data = json.loads(text_data); 
if verbose: 
	pretty_print(json_data); 

for x in json_data: 
	print "Cruise: %s"%x["day_location"]
	sailings = zip(x["date"], x["price"])
	for s in sailings: 
		date,price=s; 
		print "\t%s\t%s"%(date,price)


