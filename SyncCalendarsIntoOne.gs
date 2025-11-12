// Calendars to merge from.
// "[X]" is what is placed in front of your calendar event in the shared calendar.
// Use "" if you want none.
// To find your calendar ID: Calendar Settings > Integrate calendar > Calendar ID
const CALENDARS_TO_MERGE = {
  "[Personal]": "calendar-id@gmail.com",
  "[Work]": "calendar-id@gmail.com",
}

// The ID of the shared calendar where events will be merged into.
// To find the calendar ID: Calendar Settings > Integrate calendar > Calendar ID
const CALENDAR_TO_MERGE_INTO = "shared-calendar-id@gmail.com"

// Number of days in the past and future to sync.
// Larger values will process more events and consume more API quota.
// Recommended: 7 days past, 30 days future for typical use cases.
const SYNC_DAYS_IN_PAST = 7
const SYNC_DAYS_IN_FUTURE = 30

// Default title for events that don't have a title.
// Used when event.summary is empty or undefined.
const DEFAULT_EVENT_TITLE = "Busy"

// Unique character to use in the title of the event to identify it as a clone.
// This is used to identify and delete old synced events before creating new ones.
// Uses zero-width space (U+200B) - invisible character that won't affect display.
// https://unicode-table.com/en/200B/
const SEARCH_CHARACTER = "\u200B"

// ----------------------------------------------------------------------------
// DO NOT TOUCH FROM HERE ON
// ----------------------------------------------------------------------------

// Base endpoint for the calendar API
const ENDPOINT_BASE = "https://www.googleapis.com/calendar/v3/calendars"

/**
 * Main synchronization function that merges multiple calendars into one.
 * Deletes old cloned events and creates new ones for the specified date range.
 * 
 * This function should be set up as a trigger (time-based or calendar-based).
 * 
 * @throws {Error} If calendar configuration is invalid or calendars are inaccessible
 */
function SyncCalendarsIntoOne() {
  try {
    console.log("Starting calendar sync...")
    
    // Validate configuration before proceeding
    validateConfiguration()
    
    // Start time is today at midnight - SYNC_DAYS_IN_PAST
    const startTime = new Date()
    startTime.setHours(0, 0, 0, 0)
    startTime.setDate(startTime.getDate() - SYNC_DAYS_IN_PAST)

    // End time is today at midnight + SYNC_DAYS_IN_FUTURE
    const endTime = new Date()
    endTime.setHours(0, 0, 0, 0)
    endTime.setDate(endTime.getDate() + SYNC_DAYS_IN_FUTURE + 1)

    // Delete any old events that have been already cloned over.
    // Start from year 2000 to ensure we catch all previously synced events.
    // Note: JavaScript months are 0-indexed (0 = January)
    const deleteStartTime = new Date()
    deleteStartTime.setFullYear(2000, 0, 1) // January 1, 2000
    deleteStartTime.setHours(0, 0, 0, 0)

    deleteEvents(deleteStartTime, endTime)
    createEvents(startTime, endTime)
    
    console.log("Calendar sync completed successfully.")
  } catch (error) {
    console.error("Failed to sync calendars:", error.message)
    console.error("Stack trace:", error.stack)
    throw new Error(`Calendar sync failed: ${error.message}`)
  }
}

/**
 * Validates the configuration settings before attempting to sync calendars.
 * Checks that all required settings are present and calendars are accessible.
 * 
 * @throws {Error} If configuration is invalid or calendars are inaccessible
 */
function validateConfiguration() {
  // Check target calendar is configured
  if (!CALENDAR_TO_MERGE_INTO || CALENDAR_TO_MERGE_INTO === "shared-calendar-id@gmail.com") {
    throw new Error(
      "CALENDAR_TO_MERGE_INTO is not configured. " +
      "Please set it to your target calendar ID."
    )
  }
  
  // Check source calendars are configured
  if (!CALENDARS_TO_MERGE || Object.keys(CALENDARS_TO_MERGE).length === 0) {
    throw new Error(
      "No calendars configured in CALENDARS_TO_MERGE. " +
      "Please add at least one source calendar."
    )
  }
  
  // Check for placeholder calendar IDs
  for (const label in CALENDARS_TO_MERGE) {
    if (CALENDARS_TO_MERGE[label] === "calendar-id@gmail.com") {
      throw new Error(
        `Source calendar "${label}" still has placeholder ID. ` +
        "Please update with your actual calendar ID."
      )
    }
  }
  
  // Validate sync days are reasonable
  if (SYNC_DAYS_IN_PAST < 0 || SYNC_DAYS_IN_FUTURE < 0) {
    throw new Error("SYNC_DAYS_IN_PAST and SYNC_DAYS_IN_FUTURE must be non-negative.")
  }
  
  if (SYNC_DAYS_IN_PAST > 365 || SYNC_DAYS_IN_FUTURE > 365) {
    console.warn(
      "Warning: Syncing more than 365 days may consume significant API quota. " +
      "Current settings: " + SYNC_DAYS_IN_PAST + " days past, " + 
      SYNC_DAYS_IN_FUTURE + " days future."
    )
  }
  
  // Test access to target calendar
  try {
    const targetCalendar = CalendarApp.getCalendarById(CALENDAR_TO_MERGE_INTO)
    if (!targetCalendar) {
      throw new Error("Calendar not found or not accessible")
    }
  } catch (error) {
    throw new Error(
      `Cannot access target calendar '${CALENDAR_TO_MERGE_INTO}'. ` +
      "Please check the calendar ID and ensure you have write access. " +
      `Error: ${error.message}`
    )
  }
  
  console.log("Configuration validated successfully.")
}

/**
 * Deletes previously synced events from the shared calendar.
 * Uses the unique SEARCH_CHARACTER to identify events created by this script.
 * 
 * This is a "delete and recreate" sync strategy rather than updating existing events,
 * which simplifies the logic and ensures events are always current.
 * 
 * @param {Date} startTime - Start of deletion range
 * @param {Date} endTime - End of deletion range
 * @returns {number} Number of events deleted
 */
function deleteEvents(startTime, endTime) {
  try {
    const sharedCalendar = CalendarApp.getCalendarById(CALENDAR_TO_MERGE_INTO)
    
    if (!sharedCalendar) {
      throw new Error(`Target calendar not found: ${CALENDAR_TO_MERGE_INTO}`)
    }

    // Find events with the search character in the title.
    // The `.filter` method is used as a safety check since getEvents with search
    // parameter may return broader results than expected.
    const events = sharedCalendar
      .getEvents(startTime, endTime, { search: SEARCH_CHARACTER })
      .filter((event) => event.getTitle().includes(SEARCH_CHARACTER))

    if (events.length === 0) {
      console.log("No events to delete.")
      return 0
    }

    console.log(`Found ${events.length} events to delete.`)

    const requestBody = events.map((e) => ({
      method: "DELETE",
      endpoint: `${ENDPOINT_BASE}/${CALENDAR_TO_MERGE_INTO}/events/${e.getId().replace("@google.com", "")}`,
    }))

    const result = new BatchRequest({
      useFetchAll: true,
      batchPath: "batch/calendar/v3",
      requests: requestBody,
    })

    // Check if all deletes were successful
    if (result.length !== requestBody.length) {
      console.warn(`Warning: Attempted to delete ${requestBody.length} events but only ${result.length} were processed.`)
      console.log("Batch request results:", result)
    }

    console.log(`Successfully deleted ${result.length} events between ${startTime.toLocaleDateString()} and ${endTime.toLocaleDateString()}.`)
    return result.length
  } catch (error) {
    console.error("Error deleting events:", error.message)
    throw new Error(`Failed to delete events: ${error.message}`)
  }
}

/**
 * Creates new events in the shared calendar by copying from source calendars.
 * Filters out "free" (transparent) events and adds calendar name prefix to titles.
 * 
 * @param {Date} startTime - Start of sync range
 * @param {Date} endTime - End of sync range
 * @returns {number} Number of events created
 */
function createEvents(startTime, endTime) {
  let requestBody = []
  let totalEventsFound = 0

  for (let calendarName in CALENDARS_TO_MERGE) {
    const calendarId = CALENDARS_TO_MERGE[calendarName]
    
    try {
      // Verify calendar is accessible
      const calendarToCopy = CalendarApp.getCalendarById(calendarId)

      if (!calendarToCopy) {
        console.warn(`Calendar not accessible: '${calendarId}' (${calendarName}). Skipping.`)
        continue
      }

      // Fetch events using Calendar API for more detailed information
      const events = Calendar.Events.list(calendarId, {
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      })

      // If no events found, move to next calendar
      if (!(events.items && events.items.length > 0)) {
        console.log(`No events found in '${calendarName}' for the sync period.`)
        continue
      }

      console.log(`Found ${events.items.length} events in '${calendarName}'.`)
      totalEventsFound += events.items.length

      events.items.forEach((event) => {
        // Don't copy "free" events (transparent = free/available time)
        // These events don't show busy time and shouldn't be merged
        if (event.transparency && event.transparency === "transparent") {
          return
        }

        // If event.summary is undefined, empty, or null, set it to default title
        if (!event.summary || event.summary === "") {
          event.summary = DEFAULT_EVENT_TITLE
        }

        // Build the event to create in the shared calendar
        // Note: conferenceDataVersion=1 enables video conference data sync
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
    } catch (error) {
      console.error(`Error processing calendar '${calendarName}' (${calendarId}):`, error.message)
      // Continue with other calendars rather than failing completely
      continue
    }
  }

  if (requestBody.length === 0) {
    console.log("No events to create.")
    return 0
  }

  console.log(`Creating ${requestBody.length} events (filtered from ${totalEventsFound} total events).`)

  try {
    const result = new BatchRequest({
      batchPath: "batch/calendar/v3",
      requests: requestBody,
    })

    // Check if all creates were successful
    if (result.length !== requestBody.length) {
      console.warn(`Warning: Attempted to create ${requestBody.length} events but only ${result.length} were processed.`)
      console.log("Batch request results:", result)
    }

    console.log(`Successfully created ${result.length} events between ${startTime.toLocaleDateString()} and ${endTime.toLocaleDateString()}.`)
    return result.length
  } catch (error) {
    console.error("Error creating events:", error.message)
    throw new Error(`Failed to create events: ${error.message}`)
  }
}
