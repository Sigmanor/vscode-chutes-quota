# Chutes.ai Quota Monitor for VSCode

A VSCode extension that monitors your Chutes.ai API quota usage and displays it directly in the status bar with real-time updates.

## Features

- **Status Bar Integration**: Shows current quota usage in format "Chutes: 380/2000 (19%)"
- **Detailed Tooltips**: Hover over the status bar item to see detailed breakdown
- **Auto-refresh**: Automatically updates quota information every 5 minutes (configurable)
- **Manual Refresh**: Use the command palette to manually refresh quota data
- **Comprehensive Error Handling**: Clear error messages for API issues and missing configuration
- **Easy Configuration**: Set your API token directly in VSCode settings

![Status Bar Preview](https://via.placeholder.com/400x50/1e1e1e/ffffff?text=Chutes:%20380/2000%20(19%25))

## Setup

1. Install the extension
2. Open VSCode Settings (`Ctrl+,` or `Cmd+,`)
3. Search for "Chutes Quota"
4. Enter your Chutes.ai API token in the `chutesQuota.apiToken` setting
5. Optionally adjust the refresh interval (default: 5 minutes)

## Configuration

This extension contributes the following settings:

* `chutesQuota.apiToken`: Your Chutes.ai API token (required)
* `chutesQuota.refreshInterval`: Auto-refresh interval in minutes (1-60, default: 5)

## Commands

The extension provides the following commands accessible via Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

* `Chutes Quota: Show Details` - Display detailed quota information
* `Chutes Quota: Refresh Quota` - Manually refresh quota data

## API Integration

The extension uses the Chutes.ai API endpoint:
- **URL**: `https://api.chutes.ai/users/me/quota_usage/me`
- **Authentication**: Bearer token
- **Response**: JSON with quota and used fields

## Error Handling

The extension handles various error scenarios gracefully:

- **Missing API Token**: Shows warning with setup instructions
- **Invalid Token**: Clear error message with guidance
- **Network Issues**: Displays network error with retry options
- **API Errors**: Shows specific error messages based on API response
- **Rate Limiting**: Notifies when rate limits are exceeded

## Status Bar States

The status bar item shows different states:

- **Normal**: `Chutes: 380/2000 (19%)` - Current usage with percentage
- **Loading**: `Chutes: Loading...` - During API requests
- **Setup Required**: `Chutes: Setup Required` - When API token is missing
- **Error**: `Chutes: Error` - When API requests fail

## Privacy

This extension only communicates with the Chutes.ai API using your provided token. No data is collected or transmitted to third parties.

## Requirements

- VSCode version 1.103.0 or higher
- Valid Chutes.ai API token
- Internet connection for API requests

## Release Notes

### 0.0.1

Initial release with core quota monitoring functionality:
- Status bar integration
- Auto-refresh with configurable intervals
- Comprehensive error handling
- Command palette integration
- VSCode settings configuration
