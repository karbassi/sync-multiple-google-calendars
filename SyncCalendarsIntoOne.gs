// Calendars to merge from.
// "[X]" is what is placed in front of your calendar event in the shared calendar.
// Use "" if you want none.
var calendarsToMerge = {
    "[Personal]": "calendar-id@gmail.com",
    "[Work]": "calendar-id@gmail.com",
};

// The ID of the shared calendar
var calendarToMergeInto = "shared-calendar-id@gmail.com";

// Number of days in the future to run.
var daysToSync = 14;

function SyncCalendarsIntoOne() {

    Logger.clear();

    var sharedCalendar = CalendarApp.getCalendarById(calendarToMergeInto);

    // Delete any old events that have been already cloned over.
    // This is basically a sync w/o finding and updating. Just deleted and recreate.
    for (var j = 0; j < daysToSync; j++) {
        var currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + j);

        sharedCalendar.getEventsForDay(currentDate).forEach(function (event) {
            if (event.getTag("isCloned")) {
                Logger.log("Deleting event '%s' in '%s'.", event.getTitle(), sharedCalendar.getName());
                event.deleteEvent();
            }
        });
    }

    for (var i in calendarsToMerge) {
        var name = i;
        var calendarToCopy = CalendarApp.getCalendarById(calendarsToMerge[name]);

        for (var j = 0; j < daysToSync; j++) {
            var currentDate = new Date();
            currentDate.setDate(currentDate.getDate() + j);

            calendarToCopy.getEventsForDay(currentDate).forEach(function (event) {
                if (event.isAllDayEvent()) {
                    var createdEvent = sharedCalendar.createAllDayEvent(
                        name + " " + event.getTitle(),
                        event.getStartTime(), {
                            location: event.getLocation(),
                            description: event.getDescription()
                        }
                    );
                } else {
                    var createdEvent = sharedCalendar.createEvent(
                        name + " " + event.getTitle(),
                        event.getStartTime(),
                        event.getEndTime(), {
                            location: event.getLocation(),
                            description: event.getDescription()
                        }
                    );
                }
                Logger.log("Created event '%s' from '%s'.", createdEvent.getTitle(), calendarToCopy.getName());
                createdEvent.setTag("isCloned", true);
            });
        }
    }
}
