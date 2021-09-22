<img src="logo.svg" width="100%" height="300" alt="Sync Multiple Google Calendars into One" />

# Sync Multiple Google Calendars into One

When you want to sync multiple Google Calendars into one. Currently Google Calendar doesn't have this option and [IFTTT]/[Zapier] don't allow an easy way to do this.

This is useful for a collective Busy/Free Calendar or Google Home integration.

## Getting Starting

1. Make sure every calendar you want sync is shared with the account that holds the shared calendar.

2. Log into the account that holds the shared calendar and go to the [Google Apps Scripts] website.

3. Click on "New Project".

4. Replace everything in `Code.gs` with the contents of [SyncCalendarsIntoOne.gs].

5. Create a new script file called `BatchRequests.gs` with the contents of [BatchRequests.gs]

6. Update `calendarsToMerge`, `calendarToMergeInto`, `SYNC_DAYS_IN_PAST`, and `SYNC_DAYS_IN_FUTURE` variables. Be sure to save.

7. Click the `Project Settings` Gear icon on the left panel. Check the `Show "appsscript.json" manifest file in editor`. Go back to code editor on the left, and update its content with [appsscript.json].

8. Click `Run`. This will load the `Authorization required` window since it's your first time running the script. Click on `Review permissions` and give it permission to your account.

9. Click on `Triggers` clock icon on the left panel to add a trigger. Click on `Add Trigger`.

   - You have two choices, "Time-driven" or "From calendar".
   - Time-driven will run every X minutes/hours/etc. Use this if you have calendars that update frequently (more than 5-10 times in a 15 minute timespan)
   - "From calendar" will run when a given calendar updates. Use this if you want instant merging.

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

10. Enjoy!

## Notes

- Google App Scripts has a daily quote of 5k events created per day. See [Quotas for Google Services]
- Be sure to turn off "notifications".

## Icon Attributions

[event favorite], [event unknown], and [event warning] by arjuazka from the Noun Project
[Merge] by Travis Avery from the Noun Project

## License

MIT © [Ali Karbassi]

[ali karbassi]: http://karbassi.com
[trigger-icon]: trigger.png
[google apps scripts]: https://script.google.com/intro
[synccalendarsintoone.gs]: ../SyncCalendarsIntoOne.gs
[batchrequests.gs]: ../BatchRequests.gs
[appsscript.json]: ../appsscript.json
[quotas for google services]: https://developers.google.com/apps-script/guides/services/quotas
[ifttt]: https://ifttt.com/
[zapier]: https://zapier.com/
[event favorite]: https://thenounproject.com/arjuazka/collection/calendar/?i=548613
[event unknown]: https://thenounproject.com/arjuazka/collection/calendar/?i=548618
[event warning]: https://thenounproject.com/arjuazka/collection/calendar/?i=548620
[merge]: https://thenounproject.com/travisavery/collection/cursers-pointers-solid/?i=2286624
