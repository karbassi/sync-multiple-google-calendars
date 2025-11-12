# Troubleshooting Guide

This guide helps you diagnose and fix common issues with sync-multiple-google-calendars.

## Table of Contents

- [Common Errors](#common-errors)
- [Setup Issues](#setup-issues)
- [Sync Issues](#sync-issues)
- [Performance Issues](#performance-issues)
- [API Quota Issues](#api-quota-issues)
- [Debugging Tips](#debugging-tips)

---

## Common Errors

### "Calendar not found" or "Calendar not accessible"

**Symptoms:** Error message saying a calendar cannot be found or accessed.

**Causes:**
1. Incorrect calendar ID
2. Calendar not shared with the account running the script
3. Insufficient permissions

**Solutions:**
1. Verify the calendar ID:
   - Open Google Calendar
   - Click the three dots next to the calendar
   - Select "Settings and sharing"
   - Scroll to "Integrate calendar"
   - Copy the "Calendar ID"

2. Check sharing permissions:
   - Source calendars must be shared with at least "See all event details" permission
   - Destination calendar must have "Make changes to events" permission

3. Verify you're logged into the correct Google account in Apps Script

### "CALENDAR_TO_MERGE_INTO is not configured"

**Symptoms:** Error on first run saying target calendar is not configured.

**Cause:** You haven't updated the placeholder calendar ID in the configuration.

**Solution:**
1. Open `SyncCalendarsIntoOne.gs`
2. Replace `"shared-calendar-id@gmail.com"` with your actual calendar ID
3. Replace placeholder IDs in `CALENDARS_TO_MERGE` as well
4. Save and run again

### "Authorization required"

**Symptoms:** Script stops with authorization popup on first run.

**Cause:** This is normal for the first run - the script needs permission to access your calendars.

**Solution:**
1. Click "Review permissions"
2. Select your Google account
3. Click "Advanced" if you see a warning
4. Click "Go to [Project Name] (unsafe)" - this is your own script
5. Click "Allow"

### Events not syncing

**Symptoms:** Script runs without errors but events don't appear in target calendar.

**Possible Causes and Solutions:**

1. **Events are outside sync range**
   - Check `SYNC_DAYS_IN_PAST` and `SYNC_DAYS_IN_FUTURE` settings
   - Events outside this range won't be synced
   - Increase the range if needed

2. **Events marked as "Free/Available"**
   - The script intentionally skips transparent/free events
   - Check event transparency in the source calendar
   - These events don't show as busy time

3. **Calendar ID incorrect**
   - Verify the calendar IDs are exactly correct
   - Check for extra spaces or characters

4. **Trigger not set up**
   - Ensure you've created a trigger (time-based or calendar-based)
   - Check the trigger is active in Apps Script Triggers page

---

## Setup Issues

### Can't find `appsscript.json` file

**Cause:** Manifest file visibility is disabled by default.

**Solution:**
1. In Apps Script editor, click Project Settings (gear icon)
2. Check "Show 'appsscript.json' manifest file in editor"
3. Return to Editor view
4. You should now see `appsscript.json` in the files list

### Script doesn't run automatically

**Cause:** No trigger configured or trigger not working.

**Solution:**
1. Go to Triggers (clock icon) in Apps Script
2. Verify trigger exists and is enabled
3. Check the trigger settings:
   - Function to run: `SyncCalendarsIntoOne`
   - Deployment: `Head`
   - Event source: Time-driven or From calendar
4. If using calendar-based trigger, create one for EACH source calendar

### Getting duplicate events

**Cause:** Multiple triggers firing for the same calendar updates.

**Solution:**
1. Review your triggers - you may have too many
2. For calendar-based triggers, you only need one per source calendar
3. Don't mix time-based and calendar-based triggers unless needed
4. Delete duplicate triggers

---

## Sync Issues

### Events appear with wrong information

**Symptoms:** Events sync but titles, times, or details are incorrect.

**Possible Causes:**
1. Source calendar has incorrect information
2. Timezone mismatch
3. All-day event handling

**Solutions:**
1. Check the source calendar event directly
2. Verify `timeZone` in `appsscript.json` matches your locale
3. Check the event in both calendars to identify what's different

### Old deleted events still showing

**Symptoms:** Events deleted from source calendar still appear in target.

**Cause:** Sync needs to run to update the target calendar.

**Solutions:**
1. Manually run `SyncCalendarsIntoOne` function
2. Wait for the next automatic trigger
3. Events are deleted on the next sync cycle

### Events duplicating

**Symptoms:** Same event appears multiple times in target calendar.

**Possible Causes:**
1. Multiple triggers running at the same time
2. SEARCH_CHARACTER changed between runs
3. Script run multiple times manually

**Solutions:**
1. Check and clean up triggers - should only have necessary ones
2. Don't change `SEARCH_CHARACTER` after initial setup
3. Delete all events from target calendar and run sync once
4. Consider reducing trigger frequency

---

## Performance Issues

### Script timeout / execution time limit

**Symptoms:** Script stops with "execution time limit exceeded" error.

**Cause:** Processing too many events (Google Apps Script has 6-minute limit per execution).

**Solutions:**
1. Reduce `SYNC_DAYS_IN_PAST` and `SYNC_DAYS_IN_FUTURE`
2. Reduce number of calendars being synced
3. Use time-based trigger instead of calendar-based (less frequent)
4. Consider splitting into multiple scripts for different calendar groups

### Slow sync performance

**Symptoms:** Sync takes a long time to complete.

**Causes:**
1. Large number of events
2. Network latency
3. Many source calendars

**Solutions:**
1. Optimize date range to only necessary days
2. Reduce number of source calendars if possible
3. Use time-based triggers with longer intervals
4. Check execution logs for which operations take longest

---

## API Quota Issues

### "Quota exceeded" errors

**Symptoms:** Error messages about exceeding quotas.

**Cause:** Google Apps Script has daily limits:
- Calendar events created per day: 5,000
- URL Fetch calls per day: varies by account type

**Solutions:**
1. **Immediate:** Wait until quota resets (midnight Pacific Time)
2. **Long-term:**
   - Reduce `SYNC_DAYS_IN_PAST` and `SYNC_DAYS_IN_FUTURE`
   - Reduce trigger frequency
   - Limit number of source calendars
   - Use calendar-based triggers instead of frequent time-based triggers

**Calculate your quota usage:**
```
Events per sync = (SYNC_DAYS_IN_PAST + SYNC_DAYS_IN_FUTURE) × average events per day × number of calendars
```

Example: 
- 7 days past + 30 days future = 37 days
- 5 events per day average
- 3 calendars
- Total: 37 × 5 × 3 = 555 events per sync

If syncing every hour: 555 × 24 = 13,320 events per day (exceeds quota!)

**Recommendations:**
- For 3-5 calendars with moderate activity: sync every 15-60 minutes
- For 5-10 calendars: sync every 1-4 hours
- For many calendars: use calendar-based triggers only

### Rate limiting

**Symptoms:** Intermittent failures or "rate limit exceeded" errors.

**Cause:** Too many API calls in short time period.

**Solution:**
1. Reduce trigger frequency
2. Spread out syncs if using multiple instances
3. Script automatically uses batch requests to minimize API calls

---

## Debugging Tips

### Enable detailed logging

The script already includes console logging. To view logs:

1. In Apps Script, go to "Executions"
2. Click on a recent execution
3. View the log output

Look for:
- "Starting calendar sync..."
- "Configuration validated successfully"
- "Found X events in 'Calendar Name'"
- "Successfully created X events..."
- Any error messages

### Test with one calendar first

To isolate issues:

1. Comment out all but one calendar in `CALENDARS_TO_MERGE`
2. Set small date ranges (e.g., 1 day past, 1 day future)
3. Run manually and check logs
4. Gradually add more calendars

### Verify configuration

Run this manually to test configuration:

```javascript
function testConfiguration() {
  try {
    validateConfiguration();
    console.log("Configuration is valid!");
  } catch (error) {
    console.error("Configuration error:", error.message);
  }
}
```

### Check event details

Add temporary logging to see what events are being processed:

```javascript
// In createEvents function, after line filtering transparent events
console.log("Processing event:", event.summary, "from", event.start.dateTime || event.start.date);
```

### Reset and start fresh

If all else fails:

1. Delete all synced events from target calendar (manually or by date range)
2. Remove all triggers
3. Set up configuration again
4. Test with `SYNC_DAYS_IN_PAST = 1` and `SYNC_DAYS_IN_FUTURE = 1`
5. Run manually once
6. Verify events appear correctly
7. Gradually increase ranges and add triggers

---

## Getting Help

If you're still experiencing issues:

1. **Check the logs:** Most issues show error messages in the execution logs
2. **Review documentation:** See [README.md](README.md) for setup instructions
3. **Search existing issues:** Check the [GitHub Issues](https://github.com/karbassi/sync-multiple-google-calendars/issues) page
4. **Create an issue:** If you've found a bug or need help, [create a new issue](https://github.com/karbassi/sync-multiple-google-calendars/issues/new)

When reporting issues, please include:
- Error messages from execution logs
- Your configuration (with calendar IDs redacted)
- Steps to reproduce the problem
- What you've already tried

---

## Quick Checklist

Use this checklist when setting up or troubleshooting:

- [ ] All calendar IDs are correct (no placeholder values)
- [ ] Source calendars are shared with correct permissions
- [ ] Target calendar has write permissions
- [ ] `appsscript.json` is configured correctly
- [ ] Script has been authorized (first run)
- [ ] At least one trigger is configured
- [ ] Date ranges are reasonable (< 365 days recommended)
- [ ] Checked execution logs for errors
- [ ] Verified events exist in source calendars within sync range
- [ ] Confirmed events aren't marked as "free/available"
