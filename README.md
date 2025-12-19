# vscode-chutes-quota

A VSCode extension that monitors your Chutes.ai subscription quota usage and displays it directly in the status bar with with periodic updates.

> [!IMPORTANT]  
> This extension is an independent third-party tool and is not officially affiliated with or endorsed by chutes.ai or its developers. It is designed to help users monitor their subscription quotas.

## ✨ Features

- **Status Bar Integration**: Shows current subscription quota usage in format "Chutes: 380/2000 (19%)"
- **Detailed Tooltips**: Hover over the status bar item to see detailed breakdown of your subscription quota
- **Auto-refresh**: Automatically updates quota information every 5 minutes (configurable)
- **Manual Refresh**: Use the command palette to manually refresh quota data
- **Secure Token Storage**: API tokens are stored securely using VSCode's built-in secret storage

## 🚀 Setup

1. Install the extension
2. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
3. Run the command `Chutes Quota: Set API Token`
4. Enter your Chutes.ai API token when prompted (input will be hidden for security)
5. Optionally adjust the refresh interval in VSCode Settings

## ⚙️ Configuration

This extension contributes the following settings:

- `chutesQuota.refreshInterval`: Auto-refresh interval in minutes (1-60, default: 5)

## 🔧 Commands

The extension provides the following commands accessible via Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

- `Chutes Quota: Show Details` - Display detailed subscription quota information
- `Chutes Quota: Refresh Quota` - Manually refresh subscription quota data
- `Chutes Quota: Set API Token` - Securely set or update your API token
- `Chutes Quota: Remove API Token` - Securely remove your API token and reset the extension

## 🔌 API Integration

The extension uses the Chutes.ai API endpoint:

- **URL**: `https://api.chutes.ai/users/me/quota_usage/me`
- **Authentication**: Bearer token
- **Response**: JSON with subscription quota and used fields

## 🔒 Privacy & Security

- API tokens are stored securely using VSCode's built-in secret storage (encrypted)
- Tokens are never stored in plain text in settings or configuration files
- The extension only communicates with the Chutes.ai API using your provided token
- No data is collected or transmitted to third parties

## 📋 Requirements

- VSCode version 1.103.0 or higher
- Valid Chutes.ai API token
- Internet connection for API requests

## 📸 Screenshots

<img width="181" height="162" alt="image" src="https://github.com/user-attachments/assets/4b13cd32-3b3d-482a-a7b0-3594f29a7a81" />

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.