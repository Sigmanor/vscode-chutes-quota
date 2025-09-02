# Change Log

All notable changes to the "vscode-chutes-quota" extension will be documented in this file.

## [0.0.4] - 2025-09-02

### Added
- feat(status-bar): enhance status bar item functionality
- feat(status-bar): improve status bar display with caching

### Changed
- style(tooltip): update tooltip text for clarity Improve tooltip formatting to enhance user understanding of daily quota usage
- style(status-bar): update status bar text format

### Fixed
- fix(api): increase timeout for API requests to 30 seconds

## [0.0.3] - 2025-09-02

### Added
- **Extension Icon**: Added official Chutes.ai favicon as extension icon for better branding

## [0.0.2] - 2025-09-02

### Added
- **Secure Token Storage**: API tokens now stored using VSCode's encrypted secret storage
- New command `chutes-quota.setApiToken` for secure token management
- Automatic migration of existing tokens from settings to secure storage
- Input validation for API token entry
- Enhanced privacy protection for sensitive credentials

### Changed
- Removed API token from VSCode settings for security
- Updated setup process to use secure token input dialog
- Improved user experience for token configuration
- Enhanced error messages for token-related issues

### Security
- API tokens no longer stored in plain text in settings files
- Encrypted storage using VSCode's built-in secret management
- Automatic cleanup of old insecure token storage
- Hidden input field for token entry to prevent shoulder surfing

### Commands
- `chutes-quota.showDetails` - Show detailed quota information
- `chutes-quota.refresh` - Manually refresh quota data  
- `chutes-quota.setApiToken` - Securely set or update API token

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
- `chutesQuota.apiToken` - User's Chutes.ai API token (required) [DEPRECATED in 0.0.2]
- `chutesQuota.refreshInterval` - Auto-refresh interval in minutes (default: 5)

### Commands
- `chutes-quota.showDetails` - Show detailed quota information
- `chutes-quota.refresh` - Manually refresh quota data