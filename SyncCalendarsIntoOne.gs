// Calendars to merge from.
// "[X]" is what is placed in front of your calendar event in the shared calendar.
// Use "" if you want none.
const CALENDARS_TO_MERGE = {
  '[Personal]': 'calendar-id@gmail.com',
  '[Work]': 'calendar-id@gmail.com',
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

  syncEvents(startTime, endTime);
}

function submitRequest(requestBody, action){
  if (requestBody && requestBody.length) {
    const result = new BatchRequest({
      batchPath: 'batch/calendar/v3',
      requests: requestBody,
    });

    if (result.length !== requestBody.length) {
      console.log(result);
    }

    console.log(`${result.length} events ${action}d.`);
  } else {
    console.log(`No events to ${action}.`);
  }
}

function syncEvents(startTime, endTime) {

  let requestBody_delete = [];

  // get target calendar events
  const target_events = Calendar.Events.list(CALENDAR_TO_MERGE_INTO, {
    timeMin: startTime.toISOString(),
    timeMax: endTime.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    }).items.filter((event) => event.summary.includes(SEARCH_CHARACTER));

  for (let calendarName in CALENDARS_TO_MERGE) {
    
    // get source calendar events
    const calendarId = CALENDARS_TO_MERGE[calendarName];
    if (!CalendarApp.getCalendarById(calendarId)) {
      console.log("Calendar not found: '%s'.", calendarId);
      continue;
    }
    const source_events = Calendar.Events.list(calendarId, {
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });
    // If nothing is found, move to next calendar
    if (!(source_events.items && source_events.items.length > 0)) {
      continue;
    }

    // delete target event if its not in the source calendar anymore
    target_events.forEach((target_event) => {
      const source_event = source_events.items.filter((candidate_event) => (candidate_event.iCalUID == target_event.iCalUID))[0];  
      if (!source_event){
        requestBody_delete.push({
          method: 'DELETE',
          endpoint: `${ENDPOINT_BASE}/${CALENDAR_TO_MERGE_INTO}/events/${target_event.id}`,
        });
      }
    });
    submitRequest(requestBody_delete, "delete")


    // check if target event exists and update it if it does. if not, then create it.
    requestBody_update = []
    requestBody_create = []
    let new_description = ""

    source_events.items.forEach((source_event) => {
      // Only consider events that are not "free".
      if (source_event.transparency !== 'transparent') {

        const target_event = target_events.filter((candidate_event) => (candidate_event.iCalUID == source_event.iCalUID))[0];
        
        // if target event is found, update it. else create it.
        if (target_event) {
          requestBody_update.push({
            method: 'PUT',
            endpoint: `${ENDPOINT_BASE}/${CALENDAR_TO_MERGE_INTO}/events/${target_event.id}`,
            requestBody: {
              summary: `${SEARCH_CHARACTER}${source_event.summary} ${calendarName}`,
              location: source_event.location,
              description: source_event.description,
              start: source_event.start,
              end: source_event.end,
            },
          });        
        } else { 
          requestBody_create.push({
            method: 'POST',
            endpoint: `${ENDPOINT_BASE}/${CALENDAR_TO_MERGE_INTO}/events`,
            requestBody: {
              summary: `${SEARCH_CHARACTER}${source_event.summary} ${calendarName}`,
              location: source_event.location,
              description: source_event.description,
              start: source_event.start,
              end: source_event.end,
              iCalUID: source_event.iCalUID,
            },
          });                  
        }
      }
    });
    submitRequest(requestBody_update, "update")
    submitRequest(requestBody_create, "create")
  }
}
