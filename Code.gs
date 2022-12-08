// Edit the Settings.gs file to change the settings for this script.

// ---------------------------------------------------------------------------
// WARNING: Do not edit this script unless you know what you're doing.
// ---------------------------------------------------------------------------

// Base endpoint for the calendar API
const ENDPOINT_BASE = "https://www.googleapis.com/calendar/v3/calendars"

function SyncCalendarsIntoOne() {
  // Start time is today at midnight - SYNC_DAYS_IN_PAST
  const startTime = new Date()
  startTime.setHours(0, 0, 0, 0)
  startTime.setDate(startTime.getDate() - SYNC_DAYS_IN_PAST)

  // End time is today at midnight + SYNC_DAYS_IN_FUTURE
  const endTime = new Date()
  endTime.setHours(0, 0, 0, 0)
  endTime.setDate(endTime.getDate() + SYNC_DAYS_IN_FUTURE + 1)

  // Delete any old events that have been already cloned over.
  const deleteStartTime = new Date()
  deleteStartTime.setFullYear(2000, 01, 01)
  deleteStartTime.setHours(0, 0, 0, 0)

  deleteEvents(deleteStartTime, endTime)
  createEvents(startTime, endTime)
}

// Delete any old events that have been already cloned over.
// This is basically a sync w/o finding and updating. Just deleted and recreate.
function deleteEvents(startTime, endTime) {
  // If startTime is undefined, set it to epoch.
  if (!startTime) {
    startTime = new Date(0)
  }

  // If endTime is undefined, set it to 1 year from now.
  if (!endTime) {
    endTime = new Date()
    endTime.setFullYear(endTime.getFullYear() + 1)
  }

  // Get the shared calendar
  const sharedCalendar = CalendarApp.getCalendarById(CALENDAR_TO_MERGE_INTO)

  // Find events with the search character in the title.
  // The `.filter` method is used since the getEvents method seems to return all events at the moment. It's a safety check.
  const events = sharedCalendar
    .getEvents(startTime, endTime, { search: SEARCH_CHARACTER })
    .filter((event) => event.getTitle().includes(SEARCH_CHARACTER))

  const requestBody = events.map((e, i) => ({
    method: "DELETE",
    endpoint: `${ENDPOINT_BASE}/${CALENDAR_TO_MERGE_INTO}/events/${e.getId().replace("@google.com", "")}`,
  }))

  if (requestBody && requestBody.length) {
    const result = new BatchRequest({
      useFetchAll: true,
      batchPath: "batch/calendar/v3",
      requests: requestBody,
    })

    if (result.length !== requestBody.length) {
      console.log(result)
    }

    console.log(`${result.length} deleted events between ${startTime} and ${endTime}.`)
  } else {
    console.log("No events to delete.")
  }
}

function createEvents(startTime, endTime) {
  let requestBody = []

  for (let calendarName in CALENDARS_TO_MERGE) {
    const calendarId = CALENDARS_TO_MERGE[calendarName]
    const calendarToCopy = CalendarApp.getCalendarById(calendarId)

    if (!calendarToCopy) {
      console.log("Calendar not found: '%s'.", calendarId)
      continue
    }

    // Find events
    const events = Calendar.Events.list(calendarId, {
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    })

    // If nothing find, move to next calendar
    if (!(events.items && events.items.length > 0)) {
      continue
    }

    events.items.forEach((event) => {
      // Don't copy "free" events.
      if (event.transparency && event.transparency === "transparent") {
        return
      }

      // If event.summary is undefined, empty, or null, set it to default title
      if (!event.summary || event.summary === "") {
        event.summary = DEFAULT_EVENT_TITLE
      }

      requestBody.push({
        method: "POST",
        endpoint: `${ENDPOINT_BASE}/${CALENDAR_TO_MERGE_INTO}/events?conferenceDataVersion=1`,
        requestBody: {
          summary: `${SEARCH_CHARACTER}${calendarName} ${event.summary}`,
          location: event.location,
          description: event.description,
          start: event.start,
          end: event.end,
          conferenceData: event.conferenceData,
        },
      })
    })
  }

  if (requestBody && requestBody.length) {
    const result = new BatchRequest({
      batchPath: "batch/calendar/v3",
      requests: requestBody,
    })

    if (result.length !== requestBody.length) {
      console.log(result)
    }

    console.log(`${result.length} events created between ${startTime} and ${endTime}.`)
  } else {
    console.log("No events to create.")
  }
}
