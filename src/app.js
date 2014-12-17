/*
 * Copyright (c) 2014 Branden Clark
 * MIT License, see LICENSE for details.
 *
 * RPI Shuttle Schedule
 * View the RPI Shuttle Schedule on your Pebble
 */

//imports
var UI = require('ui');

//Schedule object
var shuttle_schedule;

function get_shuttle_schedule() {
    // Get the Shuttle schedule
    var req = new XMLHttpRequest();
  req.open('GET', 'https://raw.githubusercontent.com/clarkb7/'+
                  'Pebble_RPI_Shuttle_Schedule/master/src/'+
                  'schedule_parser/out/rpi_shuttle_schedule.json',
           true);
    req.onload = function(e) {
        if (req.readyState == 4 && req.status == 200) {
            if(req.status == 200) {
                localStorage.shuttle_schedule = req.responseText;
            } else {
                console.log("Error");
                localStorage.shuttle_schedule = "Error";
            }
        }
    };
  req.send(null);
}

function conv_12hr_to_24hr(time) {
    var hours = Number(time.match(/^(\d+)/)[1]);
    var minutes = Number(time.match(/:(\d+)/)[1]);
    var AMPM = time.match(/\s(.*)$/)[1];
    if(AMPM == "PM" && hours<12) hours = hours+12;
    if(AMPM == "AM" && hours==12) hours = hours-12;
    var sHours = hours.toString();
    var sMinutes = minutes.toString();
    if(hours<10) sHours = "0" + sHours;
    if(minutes<10) sMinutes = "0" + sMinutes;
    return [hours,minutes];
}

function get_next_times(times) {
  var time = new Date();
  var test_time = new Date();
  var index;
  var in_time;
  for (index = 0; index < times.length; index++) {
    in_time = conv_12hr_to_24hr(times[index]);
    test_time.setHours(in_time[0]);
    test_time.setMinutes(in_time[1]);
    if (time < test_time) {
      return times.slice(index,(index+3)%times.length)
                  .join(' ').replace(/ AM| PM/g, "");
    }
  }
  return "Error";
}

// Returns names of shuttle schedules
var get_scheds = function() {
  var data = shuttle_schedule.schedules;
  var items = [];
  for(var i = 0; i < data.length; i++) {
    items.push({
      title: data[i].name
    });
  }
  return items;
};

//Returns stops and next 3 times for a given shuttle schedule
var get_sched_info = function(sched_index) {
  var data = shuttle_schedule.schedules[sched_index].stops;
  var items = [];
  for(var i = 0; i < data.length; i++) {
    // Add to menu items array
    items.push({
      title:data[i].location,
      subtitle:get_next_times(data[i].times)
    });
  }
  // Returns times without AM/PM (takes too much room)
  return [shuttle_schedule.schedules[sched_index].name, items];
};

// Splash screen while waiting for data
var splash_window = new UI.Window();
var text = new UI.Text({
  text:'Downloading shuttle data...',
  font:'GOTHIC_28_BOLD',
  color:'black',
  textOverflow:'wrap',
  textAlign:'center',
	backgroundColor:'white'
});

//Download schedule if needed
if (!localStorage.shuttle_schedule) {
  // Show splash / loading window
  splash_window.add(text);
  splash_window.show();
  get_shuttle_schedule();
}

//Parse the schedule
shuttle_schedule = JSON.parse(localStorage.shuttle_schedule);

//Create an array of Menu items
var sched_menu_items = get_scheds();
var sched_menu = new UI.Menu({
  sections: [{
    title: 'RPI Shuttle Schedules',
    items: sched_menu_items
  }]
});

//Shows shuttle schedules
sched_menu.show();
splash_window.hide();

//Select schedule to get times
sched_menu.on('select', function(e) {
  var sched_info = get_sched_info(e.itemIndex);
  var res_menu = new UI.Menu({
    sections: [{
      title: sched_info[0],
      items: sched_info[1]
    }]
  });

  res_menu.show();
});