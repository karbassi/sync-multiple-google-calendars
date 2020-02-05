// Calendars to merge from.
// "[X]" is what is placed in front of your calendar event in the shared calendar.
// Use "" if you want none.
var CALENDARS_TO_MERGE = {
    "[Personal]": "calendar-id@gmail.com",
    "[Work]": "calendar-id@gmail.com",
};

// The ID of the shared calendar
var CALENDAR_TO_MERGE_INTO = "shared-calendar-id@gmail.com";

// Number of days in the future to run.
var DAYS_TO_SYNC = 14;

// Updating too many events in a short time period triggers an error.
// These values were tested for updating 40 events.
// Modify these values if you're still seeing errors.
// Sleep Time is in milliseconds.
var THROTTLE_THRESHOLD = 10;
var THROTTLE_SLEEP_TIME = 500;

// Do not touch from here on...
var changes = 0;

function changesMade() {
    changes++;
    if (changes > THROTTLE_THRESHOLD) {
        // Logger.log("Sleeping for %s milliseconds", THROTTLE_SLEEP_TIME);
        Utilities.sleep(THROTTLE_SLEEP_TIME);
        changes = 0;
    }
}

// Delete any old events that have been already cloned over.
// This is basically a sync w/o finding and updating. Just deleted and recreate.
function deleteEvents(sharedCalendar, startTime, endTime) {
    var events = sharedCalendar.getEvents(startTime, endTime);

    for (var i = 0; i < events.length; i++) {
        var event = events[i];

        if (event.getTag("isCloned")) {
            // Logger.log("Deleting event '%s' in '%s'.", event.getTitle(), sharedCalendar.getName());
            event.deleteEvent();
            changesMade();
        }
    }
}

function createEvents(sharedCalendar, startTime, endTime) {
    for (var calenderName in CALENDARS_TO_MERGE) {
        var calendarToCopy = CalendarApp.getCalendarById(CALENDARS_TO_MERGE[calenderName]);
        var events = calendarToCopy.getEvents(startTime, endTime);

        for (var i = 0; i < events.length; i++) {
            var event = events[i];

            var createdEvent;

            if (event.isAllDayEvent()) {
                createdEvent = sharedCalendar.createAllDayEvent(
                    calenderName + " " + event.getTitle(),
                    event.getStartTime(), {
                        location: event.getLocation(),
                        description: event.getDescription()
                    }
                );
                changesMade();
            } else {
                createdEvent = sharedCalendar.createEvent(
                    calenderName + " " + event.getTitle(),
                    event.getStartTime(),
                    event.getEndTime(), {
                        location: event.getLocation(),
                        description: event.getDescription()
                    }
                );
                changesMade();
            }

            createdEvent.setTag("isCloned", true);
            changesMade();

            // Logger.log("Created event '%s' from '%s'.", createdEvent.getTitle(), calendarToCopy.getName());
        }
    }
}

function SyncCalendarsIntoOne() {

    Logger.clear();

    var sharedCalendar = CalendarApp.getCalendarById(CALENDAR_TO_MERGE_INTO);

    // Midnight today
    var startTime = new Date();
    startTime.setHours(0, 0, 0, 0);

    var endTime = new Date(startTime.valueOf());
    endTime.setDate(endTime.getDate() + DAYS_TO_SYNC);

    deleteEvents(sharedCalendar, startTime, endTime);
    createEvents(sharedCalendar, startTime, endTime);

}
