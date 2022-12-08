// Calendars to merge from.
// "[X]" is what is placed in front of your calendar event in the shared calendar.
// Use "" if you want none.
const CALENDARS_TO_MERGE = {
  "[Personal]": "calendar-id@gmail.com",
  "[Work]": "calendar-id@gmail.com",
}

// The ID of the shared calendar
const CALENDAR_TO_MERGE_INTO = "shared-calendar-id@gmail.com"

// Number of days in the past and future to sync.
const SYNC_DAYS_IN_PAST = 7
const SYNC_DAYS_IN_FUTURE = 30

// Default title for events that don't have a title.
const DEFAULT_EVENT_TITLE = "Busy"

// Unique character to use in the title of the event to identify it as a clone.
// This is used to delete the old events.
// https://unicode-table.com/en/200B/
const SEARCH_CHARACTER = "\u200B"
