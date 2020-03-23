#!/bin/bash
mongoexport --host Cluster0-shard-0/cluster0-shard-00-00-6huqc.mongodb.net:27017,cluster0-shard-00-01-6huqc.mongodb.net:27017,cluster0-shard-00-02-6huqc.mongodb.net:27017 --ssl --username dbUser --password 0o8ZmmVfgONBT2YB --authenticationDatabase admin --db covid --collection timeseries --type json --jsonArray --out timeseries.json
