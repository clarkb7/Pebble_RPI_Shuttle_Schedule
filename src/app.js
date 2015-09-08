/*
 * Copyright (c) 2014 Branden Clark
 * MIT License, see LICENSE for details.
 *
 * RPI Shuttle Schedule
 * View the RPI Shuttle Schedule on your Pebble
 */

//imports
var UI = require('ui');
var Vector2 = require('vector2');
//Schedule object
var shuttle_schedule;

function get_shuttle_schedule() {
  // Get the Shuttle schedule
  var req = new XMLHttpRequest();
  req.open('GET', 'https://raw.githubusercontent.com/clarkb7/'+
                  'Pebble_RPI_Shuttle_Schedule/master/src/'+
                  'schedule_parser/out/rpi_shuttle_schedule.json',
           true);
  req.onreadystatechange = function(e) {
    // Check for a new version to download
    if (req.readyState == 2) {
      var this_tag = req.getResponseHeader("ETag");
      if (this_tag == localStorage.last_tag) {
        console.log("Schedule found in local storage");
        req.abort();
      } else {
        localStorage.last_tag = this_tag;
      }
    } else
    // Store the shuttle schedule locally
    if (req.readyState == 4 && req.status == 200) {
      if(req.status == 200) {
        console.log("Saving shuttle schedule to local storage");
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
  var hours = time.match(/^(\d+)/);
  if (hours === null) return [0, 0];
  hours = Number(hours[1]);
  var minutes = time.match(/:(\d+)/);
  if (minutes === null) return [0, 0];
  minutes = Number(minutes[1]);
  var AMPM = time.match(/\s(.*)$/);
  if (AMPM === null) return [0, 0];
  AMPM = AMPM[1];
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
    if (time < test_time || index == times.length-1) {
      var res = [times[index%times.length], times[(index+1)%times.length],
                 times[(index+2)%times.length]];
      return res.join(' ').replace(/ AM| PM| XM/g, "");
    }
  }
  return "X X X";
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

//Returns a page of times for a schedule stop
var times_per_page = 6;
var last_times_page = 0;
var get_times_page = function(sched_index, stop_index, direction) {
  var data = shuttle_schedule.schedules[sched_index].stops[stop_index];
  if (direction == "first") {
    //nop
  } else if (direction == "up") {
    last_times_page -= 1;
  } else if (direction == "down") {
    last_times_page += 1;
  }
  // Bounds checking
  if (last_times_page < 0)
    last_times_page = 0;
  else if (last_times_page*times_per_page >= data.times.length)
    last_times_page = (data.times.length-1)/times_per_page;
  //Return the page
  var index = last_times_page*times_per_page;
  return data.times.slice(index, index+times_per_page).join('\n');
};

// Splash screen while waiting for data
var splash_window = new UI.Window();
var text = new UI.Text({
  text:'Loading shuttle data...',
  font:'GOTHIC_28_BOLD',
  color:'black',
  textOverflow:'wrap',
  textAlign:'center',
  backgroundColor:'white'
});

// Show splash / loading window
splash_window.add(text);
splash_window.show();
//Download schedule if needed
get_shuttle_schedule();

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
  //Select to show all times for that stop
  res_menu.on('select', function(a) {
    var times_win = new UI.Window();
    //Schedule and location header
    var time_head = new UI.Text({
      position: new Vector2(0, 0), size: new Vector2(144, 18*2),
      text: sched_info[0]+'\n'+
            shuttle_schedule.schedules[e.itemIndex].stops[a.itemIndex].location,
      font: 'gothic-18-bold',
      color: 'white'
    });
    times_win.add(time_head);
    //Text object to show the times
    var time_text = new UI.Text({
      position: new Vector2(0, 18*2), size: new Vector2(144, 168),
      font: 'gothic-18-bold',
      textAlign: 'center',
      color: 'white',
    });
    time_text.text(get_times_page(e.itemIndex, a.itemIndex, 'first'));
    times_win.add(time_text);
    //Allow for pages to change
    times_win.on('click', 'up', function(b) {
      time_text.text(get_times_page(e.itemIndex, a.itemIndex, 'up'));
    });
    times_win.on('click', 'down', function(b) {
      time_text.text(get_times_page(e.itemIndex, a.itemIndex, 'down'));
    });
    times_win.show();
  });
  res_menu.show();
});
