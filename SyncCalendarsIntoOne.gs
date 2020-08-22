// Calendars to merge from.
// "[X]" is what is placed in front of your calendar event in the shared calendar.
// Use "" if you want none.
const CALENDARS_TO_MERGE = {
  '[Personal]': 'calendar-id@gmail.com',
  '[Work]': 'calendar-id@gmail.com',
};

// The ID of the shared calendar
const CALENDAR_TO_MERGE_INTO = 'shared-calendar-id@gmail.com';

// Number of days in the future to run.
const DAYS_TO_SYNC = 30;

// ----------------------------------------------------------------------------
// DO NOT TOUCH FROM HERE ON
// ----------------------------------------------------------------------------

// Delete any old events that have been already cloned over.
// This is basically a sync w/o finding and updating. Just deleted and recreate.
function deleteEvents(startTime, endTime) {
  const sharedCalendar = CalendarApp.getCalendarById(CALENDAR_TO_MERGE_INTO);
  const events = sharedCalendar.getEvents(startTime, endTime);

  const requests = events.map((e, i) => ({
    method: 'DELETE',
    endpoint: `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_TO_MERGE_INTO}/events/${e
      .getId()
      .replace('@google.com', '')}`,
  }));

  if (requests && requests.length) {
    const result = BatchRequest.EDo({
      useFetchAll: true,
      batchPath: 'batch/calendar/v3',
      requests: requests,
    });
    console.log(`${requests.length} deleted events.`);
    //console.log(result);
  } else {
    console.log('No events to delete.');
  }
}

function createEvents(startTime, endTime) {
  let requests = [];

  for (let calenderName in CALENDARS_TO_MERGE) {
    const calendarId = CALENDARS_TO_MERGE[calenderName];
    const calendarToCopy = CalendarApp.getCalendarById(calendarId);

    if (!calendarToCopy) {
      console.log("Calendar not found: '%s'.", calendarId);
      continue;
    }

    // Find events
    const events = Calendar.Events.list(calendarId, {
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    // If nothing find, move to next calendar
    if (!(events.items && events.items.length > 0)) {
      continue;
    }

    events.items.forEach((event) => {
      // Don't copy "free" events.
      if (event.transparency && event.transparency === 'transparent') {
        return;
      }

      requests.push({
        method: 'POST',
        endpoint: `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_TO_MERGE_INTO}/events`,
        requestBody: {
          summary: `${calenderName} ${event.summary}`,
          location: event.location,
          description: event.description,
          start: event.start,
          end: event.end,
        },
      });
    });
  }

  if (requests && requests.length) {
    const result = BatchRequest.EDo({
      batchPath: 'batch/calendar/v3',
      requests: requests,
    });
    console.log(`${requests.length} events created via BatchRequest`);
    // console.log(result);
  } else {
    console.log('No events to create.');
  }
}

function SyncCalendarsIntoOne() {
  // Midnight today
  const startTime = new Date();
  startTime.setHours(0, 0, 0, 0);

  const endTime = new Date(startTime.valueOf());
  endTime.setDate(endTime.getDate() + DAYS_TO_SYNC);

  deleteEvents(startTime, endTime);
  createEvents(startTime, endTime);
}
