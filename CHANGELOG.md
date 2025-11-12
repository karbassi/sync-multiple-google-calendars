# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Root README.md with quick start guide and project badges
- Comprehensive CODEBASE_REVIEW.md with detailed code quality analysis
- CHANGELOG.md to track project changes
- JSDoc comments for all functions with parameter and return value documentation
- Configuration validation function (`validateConfiguration()`) that runs before sync
- Detailed inline documentation for configuration options
- Error handling with try-catch blocks throughout codebase
- Better logging with context and timestamps
- Input validation for calendar IDs and sync day ranges
- Helpful error messages with actionable guidance
- Documentation for finding calendar IDs
- Comments explaining complex logic and design decisions
- Warnings for large sync ranges that may consume significant API quota

### Changed
- Improved error messages to be more user-friendly
- Enhanced configuration documentation with examples and recommendations
- Consistent use of `const` and `let` instead of `var` throughout codebase
- Better code organization with clearer function responsibilities
- More detailed console logging during sync operations
- Improved BatchRequests.gs documentation and code clarity

### Fixed
- Month index bug: Changed `setFullYear(2000, 01, 01)` to `setFullYear(2000, 0, 1)` 
  - JavaScript months are 0-indexed, so `0` is January (was incorrectly using February)
- Added null check for calendar accessibility before processing

### Deprecated
- None

### Removed
- None

### Security
- Documented OAuth scope requirements
- Added warnings about not committing real calendar IDs to version control
- Improved error handling to prevent credential exposure in logs

## [1.0.0] - Previous Release

### Added
- Initial release with calendar sync functionality
- Support for multiple source calendars
- Batch request processing
- Time-based and calendar-based triggers
- Configurable sync date ranges
- Free/busy event filtering

[Unreleased]: https://github.com/karbassi/sync-multiple-google-calendars/compare/HEAD...copilot/review-codebase-improvements
