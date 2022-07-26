// Calendars to merge from.
// Calendar name is a friendly way to identify your calendars.
//
// Id is the google calendar id found in the calendar setting
//
// Prefix "[X]" is what is placed in front of your calendar event in the shared calendar.
// Use "" if you want none.
//
// Color id for the events. Don't specify a color for the default color.
// 0=default, 1=blue, 2=green, 3=purple, 4=red, 5=yellow, 6=orange, 
// 7=turquoise, 8=gray, 9=bold blue, 10=bold green, 11=bold red
const CALENDARS_TO_MERGE = {
  'Personal': {'id': 'calendar-id@gmail.com', 'prefix':'[Personal]', 'color_id': ''},
  'Work': {'id': 'calendar-id@gmail.com', 'prefix':'[Work]', 'color_id': '4'},
};

// The ID of the shared calendar
const CALENDAR_TO_MERGE_INTO = 'shared-calendar-id@gmail.com';

// Number of days in the past and future to sync.
const SYNC_DAYS_IN_PAST = 7;
const SYNC_DAYS_IN_FUTURE = 30;

// Unique character to use in the title of the event to identify it as a clone.
// This is used to delete the old events.
// https://unicode-table.com/en/200B/
const SEARCH_CHARACTER = '\u200B';

// ----------------------------------------------------------------------------
// DO NOT TOUCH FROM HERE ON
// ----------------------------------------------------------------------------

const ENDPOINT_BASE = 'https://www.googleapis.com/calendar/v3/calendars';

function SyncCalendarsIntoOne() {
  // Midnight today
  const startTime = new Date();
  startTime.setHours(0, 0, 0, 0);
  startTime.setDate(startTime.getDate() - SYNC_DAYS_IN_PAST);

  const endTime = new Date();
  endTime.setHours(0, 0, 0, 0);
  endTime.setDate(endTime.getDate() + SYNC_DAYS_IN_FUTURE + 1);

  // Delete old events
  const deleteStartTime = new Date();
  deleteStartTime.setFullYear(2000, 01, 01);
  deleteStartTime.setHours(0, 0, 0, 0);

  deleteEvents(deleteStartTime, endTime);
  createEvents(startTime, endTime);
}

// Delete any old events that have been already cloned over.
// This is basically a sync w/o finding and updating. Just deleted and recreate.
function deleteEvents(startTime, endTime) {
  const sharedCalendar = CalendarApp.getCalendarById(CALENDAR_TO_MERGE_INTO);

  // Find events with the search character in the title.
  // The `.filter` method is used since the getEvents method seems to return all events at the moment. It's a safety check.
  const events = sharedCalendar
    .getEvents(startTime, endTime, { search: SEARCH_CHARACTER })
    .filter((event) => event.getTitle().includes(SEARCH_CHARACTER));

  const requestBody = events.map((e, i) => ({
    method: 'DELETE',
    endpoint: `${ENDPOINT_BASE}/${CALENDAR_TO_MERGE_INTO}/events/${e
      .getId()
      .replace('@google.com', '')}`,
  }));

  if (requestBody && requestBody.length) {
    const result = new BatchRequest({
      useFetchAll: true,
      batchPath: 'batch/calendar/v3',
      requests: requestBody,
    });

    if (result.length !== requestBody.length) {
      console.log(result);
    }

    console.log(`${result.length} deleted events.`);
  } else {
    console.log('No events to delete.');
  }
}

function createEvents(startTime, endTime) {
  let requestBody = [];

  for (const [calendarName, calendarOption] of Object.entries(CALENDARS_TO_MERGE)) {
    const calendarId = calendarOption.id;
    const calendarPrefix = calendarOption.prefix;
    const calendarColorId = calendarOption.color_id || '0';
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

      requestBody.push({
        method: 'POST',
        endpoint: `${ENDPOINT_BASE}/${CALENDAR_TO_MERGE_INTO}/events`,
        requestBody: {
          summary: `${SEARCH_CHARACTER}${calendarPrefix} ${event.summary}`,
          location: event.location,
          description: event.description,
          start: event.start,
          end: event.end,
          colorId: calendarColorId
        },
      });
    });
  }

  if (requestBody && requestBody.length) {
    const result = new BatchRequest({
      batchPath: 'batch/calendar/v3',
      requests: requestBody,
    });

    if (result.length !== requestBody.length) {
      console.log(result);
    }

    console.log(`${result.length} events created.`);
  } else {
    console.log('No events to create.');
  }
}
