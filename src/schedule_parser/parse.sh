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

# Remove empty lines, prepend 0 to times, change AM/PM format
# e.g. 7:49p becomes 07:49 PM
FIXUP_REG='/^$/d;s/^\([0-9]\):/0\1:/g;s/\([0-9]\)p/\1 PM/g;s/\([0-9]\)a/\1 AM/g'

#Output info
OUT_DIR="${2-./out}"
TXT_NAME="$OUT_DIR/ShuttleSchedule.txt"
mkdir -p "$OUT_DIR"

# Convert from pdf to txt and remove leading spaces from lines
pdftotext -layout "${1:-ShuttleSchedule.pdf}" "$TXT_NAME"
sed -i 's/^ //g' "$TXT_NAME"

# Create a list of weekday east times
OUTFILE="$OUT_DIR/weekday_east.out"
echo '' > "$OUTFILE"
for col in {1..9}; do
  # Print shuttle stop name to file
  echo 'loc: ' ${EAST_STOPS[ $(($col-1)) ]} >> "$OUTFILE"
  #               | cut into colums        |get $col |  chop extra info      | keep only numbers
  cat "$TXT_NAME" | tr -s ' ' | cut -s -d' ' -f0$col | tail -n+4 | head -n57 | grep -e '^[0-9]*:' >> "$OUTFILE"
  cat "$TXT_NAME" | tr -s ' ' | cut -s -d' ' -f1$col | tail -n+4 | head -n57 | grep -e '^[0-9]*:' >> "$OUTFILE"
  cat "$TXT_NAME" | tr -s ' ' | cut -s -d' ' -f2$col | tail -n+4 | head -n16 | grep -e '^[0-9]*:' >> "$OUTFILE"
done
sed -i "$FIXUP_REG" "$OUTFILE"

# Create a list of weekend east times
OUTFILE="$OUT_DIR/weekend_east.out"
echo '' > "$OUTFILE"
for col in {1..9}; do
  # Print shuttle stop name to file
  echo 'loc: ' ${EAST_STOPS[ $((col-1)) ]} >> "$OUTFILE"
  #               | cut into colums        |get $col |  chop extra info       | keep only numbers
  cat "$TXT_NAME" | tr -s ' ' | cut -s -d' ' -f2$col | tail -n+38 | head -n23 | grep -e '^[0-9]*:' >> "$OUTFILE"
done
sed -i "$FIXUP_REG" "$OUTFILE"

# Convert the output files to json
python txt_to_json.py "$OUT_DIR"
