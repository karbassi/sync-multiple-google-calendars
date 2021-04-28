<p align="center"><img src="logo.png"/></p>

# Sync Multiple Google Calendars into One

When you want to sync multiple Google Calendars into one. Currently Google Calendar doesn't have this option and IFTT/Zapier don't allow an easy way to do this.

This is useful for a collective Busy/Free Calendar or Google Home integration.

## Getting Starting

1. Make sure every calendar you want sync is shared with the account that holds the shared calendar.
2. Log into the account that holds the shared calendar and go to the [Google Apps Scripts] website.
3. Click on "New Project".
4. Replace everything in `Code.gs` with the contents of [SyncCalendarsIntoOne.gs].
5. Update `calendarsToMerge`, `calendarToMergeInto`, and `daysToSync` variables. Be sure to save.
6. Click the `Project Settings` Gear icon on the left panel. Check the `Show "appsscript.json" manifest file in editor`. Go back to code editor on the left, and update its content with [appsscript.json](https://github.com/karbassi/sync-multiple-google-calendars/blob/master/appsscript.json).
7. Click `Run`. This will load the `Authorization required` window since it's your first time running the script. Click on `Review permissions` and give it permission to your account.
8. Click on `Triggers` clock icon on the left panel to add a trigger. Click on `Add Trigger`. \
   You have two choices, "Time-driven" or "From calendar". \
   Time-driven will run every X minutes/hours/etc. Use this if you have calendars that update frequently (more than 5-10 times in a 15 minute timespan)\
   "From calendar" will run when a given calendar updates. Use this if you want instant merging. \
   a. **Time-driven**
   - "Choose which function to run": `SyncCalendarsIntoOne`
   - "Choose which deployment should run": `Head`
   - "Select event source": `Time-driven`
   - "Select type of time based trigger": choose what works for you.
   - Click "Save"

   b. **From calendar**
   - "Choose which function to run": `SyncCalendarsIntoOne`
   - "Choose which deployment should run": `Head`
   - "Select event source": `From calendar`
   - "Enter calendar details": enter one of the calendars you are merging _from_. 
   - Click "Save"
   - Repeat these steps for every calendar you're merging _from_.

9. Enjoy!



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
