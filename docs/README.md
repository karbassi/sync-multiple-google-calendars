<p align="center"><img src="logo.png"/></p>

# Sync Multiple Google Calendars into One

When you want to sync multiple Google Calendars into one. Currently Google Calendar doesn't have this option and IFTT/Zapier don't allow an easy way to do this.

This is useful for a collective Busy/Free Calendar or Google Home integration.

## Getting Starting

1. Make sure every calendar you want sync is shared with the account that holds the shared calendar.
2. Log into the account that holds the shared calendar and go to the [Google Apps Scripts] website.
3. Replace everything in `Code.gs` with the contents of [SyncCalendarsIntoOne.gs].
4. Update `calendarsToMerge`, `calendarToMergeInto`, and `daysToSync`.
5. Click on the ![trigger-icon] clock icon to add a trigger.
 - Add a `Time-driven` event with it running `every hour`.
 - Click on _notifications_ and delete any notifications if you don't want to get notification failure emails.

## Notes
- Google App Scripts has a daily quote of 5k events created per day. See [Quotas for Google Services]
- Be sure to turn off "notifications".

## License

MIT © [Ali Karbassi]

[Ali Karbassi]: http://karbassi.com
[trigger-icon]: trigger.png
[Google Apps Scripts]: https://script.google.com/intro
[SyncCalendarsIntoOne.gs]: ../SyncCalendarsIntoOne.gs
[Quotas for Google Services]: https://developers.google.com/apps-script/guides/services/quotas
