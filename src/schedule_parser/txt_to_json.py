#!/usr/bin/python
"""
Copyright (c) 2014 Branden Clark
MIT License, see LICENSE for details.
""""""
Converts list output of shuttle stops to json format

Usage: python txt_to_json.py data_dir
"""

import sys

INTERNAL_INDENT = '      '
def txt_to_json(schedule_name, schedule_file):
  """ Writes out a shuttle schedule in json format """
  with open(schedule_file, "r") as inf:
    print('  {')
    print('    "name":"'+schedule_name+'",')
    print('    "stops":[')
    myline = inf.readline().strip('\n')
    firstloc = True
    while myline != "":
      # Read the location name
      if 'loc: ' in myline:
        # Handle comma separation
        if not firstloc:
          print(',')
        else:
          firstloc = False
        print('    {')
        print(INTERNAL_INDENT+'"location":"'+myline[6:]+'",')
        print(INTERNAL_INDENT+'"times":[', end=" ")
        myline = inf.readline().strip('\n')
        firstline = True
        # Read the stop times
        while not 'loc: ' in myline and myline != "":
          # Handle comma separation
          if not firstline:
            print(',', end=" ")
          else:
            firstline = False
          print('"'+myline+'"', end="")
          myline = inf.readline().strip('\n')
        # Close up this object
        print('\n'+INTERNAL_INDENT+']')
        print('    }', end="")
    print('\n    '+']')

def main(argv):
  """ Main for json output """
  out_dir = argv[0];
  # Start the json
  print('{')
  # Add meta data
  print('  "author":"Branden Clark",')
  print('  "URL":"https://github.com/clarkb7/Pebble_RPI_Shuttle_Schedule",')
  # Start the schedules
  print('  "schedules":[')
  # Print the schedules
  txt_to_json("Weekday East", argv[0] + "/weekday_east.out")
  print('  },')
  txt_to_json("Weekend East", argv[0] + "/weekend_east.out")
  # End the json
  print('  }')
  print('  ]')
  print('}')

if __name__ == "__main__":
  main(sys.argv[1:])
