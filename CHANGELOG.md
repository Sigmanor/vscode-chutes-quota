# Change Log

All notable changes to the "vscode-chutes-quota" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.1] - 2025-01-01

### Added
- Initial release of Chutes.ai quota monitoring extension
- Status bar integration showing quota usage in format "Chutes: 380/2000 (19%)"
- Auto-refresh functionality with configurable intervals (1-60 minutes, default: 5)
- VSCode settings integration for API token and refresh interval configuration
- Command palette commands for manual refresh and detailed quota information
- Comprehensive error handling for various API failure scenarios
- Tooltip with detailed quota breakdown on hover
- Support for bearer token authentication with Chutes.ai API
- Network error handling and retry logic
- Professional status bar states for different application states

### Configuration
- `chutesQuota.apiToken` - User's Chutes.ai API token (required)
- `chutesQuota.refreshInterval` - Auto-refresh interval in minutes (default: 5)

### Commands
- `chutes-quota.showDetails` - Show detailed quota information
- `chutes-quota.refresh` - Manually refresh quota data