#!/bin/bash
##
# Copyright (c) 2014 Branden Clark
# MIT License, see LICENSE for details.
##
# Parses RPI Red Hawk shuttle schedule pdf
# Then calls another script to convert to json
#
# Usage ./parse.sh pdf_schedule [out_dir]
#
# Output format (for each stop)
# """
# loc: $SHUTTLE_STOP
# time1
# time2
# ...
# """
##

# Shuttle stop names
## Not taken from pdf because spaces are a pain
EAST_STOPS=('Union' 'Colonie' 'Brinsmade' 'Sunset 1 & 2' 'E-lot' 'B-lot' '9th/Sage' 'West lot' 'Sage')
WEST_STOPS=('Union' 'Sage Ave' 'Blitman' 'City Station' 'Poly Tech' '15th & College')
WEEKEND_WEST_STOPS=('Union' 'Sage Ave' 'Troy Hub' 'Blitman' 'City Station' 'Poly Tech' '15th & College')
# Remove empty lines, prepend 0 to times, change AM/PM format
# e.g. 7:49p becomes 07:49 PM
# unknown/invalid uses XM
TIME_REG='[0-9][0-9]:[0-9][0-9]'
FIXUP_REG="/^$/d;s/^\([0-9]\):/0\1:/g;s/\($TIME_REG\)p/\1 PM/g;s/\($TIME_REG\)a/\1 AM/g;s/\($TIME_REG\)$/\1 XM/g"

#Output info
OUT_DIR="${2-./out}"
TXT_NAME="$OUT_DIR/ShuttleSchedule.txt"
mkdir -p "$OUT_DIR"

# Convert from pdf to txt and remove leading spaces from lines
pdftotext -layout -raw "${1:-ShuttleSchedule.pdf}" "$TXT_NAME"
sed -i 's/^ //g' "$TXT_NAME"

# Creates a list of times
# $1 = Output file name
# $2 = First column offset
# $3 = Array of stop names
# $4 = Array of # of lines to chop off of top
# $5 = Arrat of # of lines to keep from top after chop
function create_list {
  # Create output file
  local OUTFILE="$OUT_DIR/$1"
  echo '' > "$OUTFILE"
  # Get array arguments by name
  local tmp=$2[@]
  local names=("${!tmp}")
  tmp=$3[@]
  local slice=("${!tmp}")
  tmp=$4[@]
  local chop=("${!tmp}")
  tmp=$5[@]
  local keep=("${!tmp}")
  local num_itr=$(( ${#chop[@]}-1 ))
  local num_names=${#names[@]}
  # For each location, get the times
  for col in $(eval echo {1..$num_names}); do
    # Print shuttle stop names to file
    echo 'loc: ' ${names[ $(($col-1)) ]} >> "$OUTFILE"
    # Times might be in several places
    for i in $(eval echo {0..$num_itr}); do
      #               | cut into colums         |get $col |  chop extra info
      cat "$TXT_NAME" | tr -s ' ' | cut -s -d' ' -f$(( ${slice[i]}+$col )) |
      #                                        | keep only numbers
        tail -n+${chop[i]} | head -n${keep[i]} | grep -e '^[0-9]*:' >> "$OUTFILE"
    done
  done
  sed -i "$FIXUP_REG" "$OUTFILE"
}

# Create a list of weekday east times
OUTFILE="weekday_east.out"
SLICE=(0 10 20)
CHOP_TOP=(2 2 2)
KEEP_TOP=(57 57 16)
create_list $OUTFILE EAST_STOPS SLICE CHOP_TOP KEEP_TOP
# Create a list of weekend east times
OUTFILE="weekend_east.out"
SLICE=(20)
CHOP_TOP=(36)
KEEP_TOP=(23)
create_list $OUTFILE EAST_STOPS SLICE CHOP_TOP KEEP_TOP
# Create a list of weekday west times
OUTFILE="weekday_west.out"
SLICE=(0 7)
CHOP_TOP=(73 73)
KEEP_TOP=(56 56)
create_list $OUTFILE WEST_STOPS SLICE CHOP_TOP KEEP_TOP
# Create a list of Saturday west times
OUTFILE="saturday_west.out"
SLICE=(14)
CHOP_TOP=(73)
KEEP_TOP=(24)
create_list $OUTFILE WEEKEND_WEST_STOPS SLICE CHOP_TOP KEEP_TOP
# Create a list of Sunday west times
OUTFILE="sunday_west.out"
SLICE=(14)
CHOP_TOP=(102)
KEEP_TOP=(27)
create_list $OUTFILE WEEKEND_WEST_STOPS SLICE CHOP_TOP KEEP_TOP

# Convert the output files to json
python3 txt_to_json.py "$OUT_DIR"
