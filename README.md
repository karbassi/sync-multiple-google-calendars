# Sync Multiple Google Calendars into One

<img src="docs/logo.svg" width="100%" height="300" alt="Sync Multiple Google Calendars into One" />

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

When you want to sync multiple Google Calendars into one. Currently Google Calendar doesn't have this option and [IFTTT](https://ifttt.com/)/[Zapier](https://zapier.com/) don't allow an easy way to do this.

This is useful for creating a collective Busy/Free Calendar or Google Home integration.

## Features

- ✨ Merge multiple Google Calendars into a single shared calendar
- 🔄 Automatic synchronization via time-based or calendar-based triggers
- 🎯 Customizable event prefixes to identify calendar sources
- ⚙️ Configurable sync date ranges (past and future)
- 🔒 Respects free/busy privacy settings
- 📊 Batch API requests for efficient processing

## Quick Start

1. **Share Calendars**: Ensure every calendar you want to sync is shared with the account that holds the shared calendar
2. **Create Project**: Go to [Google Apps Scripts](https://script.google.com/intro) and click "New Project"
3. **Add Code**: Copy the code from `SyncCalendarsIntoOne.gs` and `BatchRequests.gs`
4. **Configure**: Update the configuration variables with your calendar IDs and preferences
5. **Enable API**: Set up the `appsscript.json` manifest to enable required permissions
6. **Set Trigger**: Add a time-based or calendar-based trigger to run the sync automatically

📚 **[View detailed setup instructions →](docs/README.md)**

## Configuration

```javascript
// Example configuration in SyncCalendarsIntoOne.gs
const CALENDARS_TO_MERGE = {
  "[Personal]": "personal-calendar-id@gmail.com",
  "[Work]": "work-calendar-id@gmail.com",
}

const CALENDAR_TO_MERGE_INTO = "shared-calendar-id@group.calendar.google.com"
const SYNC_DAYS_IN_PAST = 7
const SYNC_DAYS_IN_FUTURE = 30
```

## Important Notes

- Google Apps Script has a daily quota of 5,000 events created per day. See [Quotas for Google Services](https://developers.google.com/apps-script/guides/services/quotas)
- Turn off notifications on the merged calendar to avoid notification spam
- The script uses a zero-width space character (U+200B) to identify synced events

## Documentation

- [Setup Guide](docs/README.md) - Detailed installation and configuration instructions
- [Codebase Review](CODEBASE_REVIEW.md) - Comprehensive code quality analysis and recommendations
- [Contributing Guide](CONTRIBUTING.md) - Guidelines for contributing to the project
- [Code of Conduct](CODE_OF_CONDUCT.md) - Community standards and expectations

## How It Works

1. **Delete Phase**: Removes previously synced events from the shared calendar (identified by a special character)
2. **Create Phase**: Fetches events from all source calendars and creates copies in the shared calendar
3. **Batch Processing**: Uses Google Calendar API batch requests for efficient processing

Events are prefixed with a customizable label (e.g., `[Personal]` or `[Work]`) to identify their source.

## Requirements

- Google Account with access to Google Apps Script
- Write access to the destination calendar
- Read access to all source calendars

## Limitations

- Maximum 100 batch requests per API call
- Daily quota of 5,000 calendar event creations
- Syncs event title, location, description, time, and conference data
- Does not sync attendees, reminders, or other metadata

## Troubleshooting

If you encounter issues:

1. Check the Execution log in Google Apps Script for error messages
2. Verify calendar IDs are correct and accessible
3. Ensure the manifest file (`appsscript.json`) includes all required permissions
4. Check you haven't exceeded Google's API quotas

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting PRs.

## License

MIT © [Ali Karbassi](http://karbassi.com)

## Credits

Icons by:
- [event favorite](https://thenounproject.com/arjuazka/collection/calendar/?i=548613), [event unknown](https://thenounproject.com/arjuazka/collection/calendar/?i=548618), and [event warning](https://thenounproject.com/arjuazka/collection/calendar/?i=548620) by arjuazka from the Noun Project
- [Merge](https://thenounproject.com/travisavery/collection/cursers-pointers-solid/?i=2286624) by Travis Avery from the Noun Project
