# Pebble RPI Shuttle Schedule

Author: Branden Clark

# Components

* Pebble app that lets you view the Red Hawk schedule on your phone
* Scripts to parse shuttle schedule pdf into json

# How to
* Convert pdf to json format
```
cd ./src/schedule_parser
./parse.sh > output.json
```