# Chutes.ai Quota Monitor for VSCode

A VSCode extension that monitors your Chutes.ai API subscription quota usage and displays it directly in the status bar with real-time updates.

**Note**: This extension is an independent third-party tool and is not officially affiliated with or endorsed by chutes.ai or its developers. It is designed to help users monitor their subscription quotas.

## Features

- **Status Bar Integration**: Shows current subscription quota usage in format "Chutes: 380/2000 (19%)"
- **Detailed Tooltips**: Hover over the status bar item to see detailed breakdown of your subscription quota
- **Auto-refresh**: Automatically updates quota information every 5 minutes (configurable)
- **Manual Refresh**: Use the command palette to manually refresh quota data
- **Secure Token Storage**: API tokens are stored securely using VSCode's built-in secret storage
- **Comprehensive Error Handling**: Clear error messages for API issues and missing configuration
- **Easy Setup**: Simple command to securely set your API token

![Status Bar Preview](https://via.placeholder.com/400x50/1e1e1e/ffffff?text=Chutes:%20380/2000%20(19%25))

## Setup

1. Install the extension
2. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
3. Run the command `Chutes Quota: Set API Token`
4. Enter your Chutes.ai API token when prompted (input will be hidden for security)
5. Optionally adjust the refresh interval in VSCode Settings

### Alternative Setup (for existing users)

If you previously had the token in settings, it will be automatically migrated to secure storage on first run.

## Configuration

This extension contributes the following settings:

* `chutesQuota.refreshInterval`: Auto-refresh interval in minutes (1-60, default: 5)

**Note**: The API token is now stored securely and is no longer visible in settings.

## Commands

The extension provides the following commands accessible via Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

* `Chutes Quota: Show Details` - Display detailed subscription quota information
* `Chutes Quota: Refresh Quota` - Manually refresh subscription quota data
* `Chutes Quota: Set API Token` - Securely set or update your API token

## API Integration

The extension uses the Chutes.ai API endpoint:
- **URL**: `https://api.chutes.ai/users/me/quota_usage/me`
- **Authentication**: Bearer token
- **Response**: JSON with subscription quota and used fields

## Error Handling

The extension handles various error scenarios gracefully:

- **Missing API Token**: Shows warning with setup instructions
- **Invalid Token**: Clear error message with guidance
- **Network Issues**: Displays network error with retry options
- **API Errors**: Shows specific error messages based on API response
- **Rate Limiting**: Notifies when rate limits are exceeded

## Status Bar States

The status bar item shows different states:

- **Normal**: `Chutes: 380/2000 (19%)` - Current subscription usage with percentage
- **Loading**: `Chutes: Loading...` - During API requests
- **Setup Required**: `Chutes: Setup Required` - When API token is missing
- **Error**: `Chutes: Error` - When API requests fail

## Privacy & Security

- API tokens are stored securely using VSCode's built-in secret storage (encrypted)
- Tokens are never stored in plain text in settings or configuration files
- The extension only communicates with the Chutes.ai API using your provided token
- No data is collected or transmitted to third parties
- Automatic migration from old insecure storage to secure storage

## Requirements

- VSCode version 1.103.0 or higher
- Valid Chutes.ai API token
- Internet connection for API requests