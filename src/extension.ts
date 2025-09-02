import * as vscode from 'vscode';
import axios, { AxiosError } from 'axios';

// Interface for the API response
interface ChutesQuotaResponse {
	quota: number;
	used: number;
}

// Interface for extension configuration
interface ChutesQuotaConfig {
	refreshInterval: number;
}

// Main quota monitoring class
class ChutesQuotaMonitor {
	private statusBarItem: vscode.StatusBarItem;
	private refreshTimer?: NodeJS.Timeout;
	private isRefreshing = false;

	constructor(private context: vscode.ExtensionContext) {
		// Create status bar item
		this.statusBarItem = vscode.window.createStatusBarItem(
			vscode.StatusBarAlignment.Right,
			100
		);
		this.statusBarItem.command = 'chutes-quota.showDetails';
		this.statusBarItem.show();
		
    // Migrate existing API token from settings to secure storage
    this.migrateApiToken().then(() => {
      // Initial load after migration
      this.updateQuota();
      this.setupAutoRefresh();
    });
		
		// Register commands
		this.registerCommands();
		
		// Listen for configuration changes
		vscode.workspace.onDidChangeConfiguration(event => {
			if (event.affectsConfiguration('chutesQuota')) {
				this.setupAutoRefresh();
				this.updateQuota();
			}
		});
	}

	private registerCommands(): void {
		const showDetailsCommand = vscode.commands.registerCommand('chutes-quota.showDetails', () => {
			this.showQuotaDetails();
		});

		const refreshCommand = vscode.commands.registerCommand('chutes-quota.refresh', () => {
			this.updateQuota();
		});

    const setTokenCommand = vscode.commands.registerCommand('chutes-quota.setApiToken', () => {
      this.promptForApiToken();
    });

    this.context.subscriptions.push(showDetailsCommand, refreshCommand, setTokenCommand);
	}

	private getConfiguration(): ChutesQuotaConfig {
		const config = vscode.workspace.getConfiguration('chutesQuota');
    return {
			refreshInterval: config.get<number>('refreshInterval', 5)
		};
	}

  private async getApiToken(): Promise<string> {
    return await this.context.secrets.get('chutesQuota.apiToken') || '';
  }

  private async setApiToken(token: string): Promise<void> {
    await this.context.secrets.store('chutesQuota.apiToken', token);
  }

  private async promptForApiToken(): Promise<void> {
    const currentToken = await this.getApiToken();
    const placeholder = currentToken ? 'Enter new API token to replace existing' : 'Enter your Chutes.ai API token';

    const token = await vscode.window.showInputBox({
      prompt: 'Enter your Chutes.ai API token',
      placeHolder: placeholder,
      password: true, // Hide the input
      ignoreFocusOut: true,
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'API token cannot be empty';
        }
        if (value.length < 10) {
          return 'API token seems too short';
        }
        return null;
      }
    });

    if (token !== undefined) {
      await this.setApiToken(token.trim());
      vscode.window.showInformationMessage('API token has been saved securely.');

      // Refresh quota after setting new token
      this.updateQuota();
    }
  }

  private async migrateApiToken(): Promise<void> {
    // Check if we already have a token in secure storage
    const existingToken = await this.getApiToken();
    if (existingToken) {
      return; // Already migrated or token already exists
    }

    // Check for old token in settings
    const config = vscode.workspace.getConfiguration('chutesQuota');
    const oldToken = config.get<string>('apiToken', '');

    if (oldToken && oldToken.trim()) {
      // Migrate the token to secure storage
      await this.setApiToken(oldToken.trim());

      // Remove the old token from settings
      await config.update('apiToken', undefined, vscode.ConfigurationTarget.Global);

      console.log('Chutes Quota: API token migrated to secure storage');
    }
  }

	private setupAutoRefresh(): void {
		// Clear existing timer
		if (this.refreshTimer) {
			clearInterval(this.refreshTimer);
		}

		const config = this.getConfiguration();
		const intervalMs = config.refreshInterval * 60 * 1000; // Convert minutes to milliseconds

		this.refreshTimer = setInterval(() => {
			this.updateQuota();
		}, intervalMs);
	}

	private async updateQuota(): Promise<void> {
		if (this.isRefreshing) {
			return; // Prevent concurrent requests
		}

		const config = this.getConfiguration();
    const apiToken = await this.getApiToken();
		
    if (!apiToken.trim()) {
			this.statusBarItem.text = '$(warning) Chutes: Setup Required';
			this.statusBarItem.tooltip = 'Click to configure your Chutes.ai API token';
			this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
			return;
		}

		this.isRefreshing = true;
		this.statusBarItem.text = '$(sync~spin) Chutes: Loading...';
		this.statusBarItem.tooltip = 'Fetching quota information...';
		this.statusBarItem.backgroundColor = undefined;

		try {
			const response = await axios.get<ChutesQuotaResponse>(
				'https://api.chutes.ai/users/me/quota_usage/me',
				{
					headers: {
            'Authorization': `Bearer ${apiToken}`,
						'Content-Type': 'application/json'
					},
					timeout: 10000 // 10 second timeout
				}
			);

			const { quota, used } = response.data;
			const percentage = Math.round((used / quota) * 100);
			const remaining = quota - used;

			// Update status bar
      this.statusBarItem.text = `$(pulse) Chutes: ${Math.round(used)}/${quota} (${percentage}%)`;
			this.statusBarItem.tooltip = this.createTooltip(quota, used, remaining, percentage);
			this.statusBarItem.backgroundColor = undefined;

		} catch (error) {
			this.handleError(error);
		} finally {
			this.isRefreshing = false;
		}
	}

	private createTooltip(quota: number, used: number, remaining: number, percentage: number): string {
    return `Daily Quota Usage

Total: ${quota}
Used: ${Math.round(used)}
Remaining: ${Math.round(remaining)}
Usage: ${percentage}%`;
	}

	private handleError(error: any): void {
		let errorMessage = 'Unknown error occurred';
		let statusText = '$(error) Chutes: Error';

		if (axios.isAxiosError(error)) {
			const axiosError = error as AxiosError;
			
			if (axiosError.response) {
				// API returned an error response
				const status = axiosError.response.status;
				switch (status) {
					case 401:
						errorMessage = 'Invalid API token. Please check your configuration.';
						statusText = '$(error) Chutes: Invalid Token';
						break;
					case 403:
						errorMessage = 'Access forbidden. Please verify your API token permissions.';
						statusText = '$(error) Chutes: Forbidden';
						break;
					case 429:
						errorMessage = 'Rate limit exceeded. Please try again later.';
						statusText = '$(error) Chutes: Rate Limited';
						break;
					case 500:
					case 502:
					case 503:
					case 504:
						errorMessage = 'Chutes.ai API is currently unavailable. Please try again later.';
						statusText = '$(error) Chutes: API Down';
						break;
					default:
						errorMessage = `API error (${status}): ${axiosError.response.statusText}`;
						statusText = `$(error) Chutes: API Error`;
				}
			} else if (axiosError.request) {
				// Network error
				errorMessage = 'Network error. Please check your internet connection.';
				statusText = '$(error) Chutes: Network Error';
			} else {
				errorMessage = `Request error: ${axiosError.message}`;
			}
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		this.statusBarItem.text = statusText;
		this.statusBarItem.tooltip = `Error fetching quota: ${errorMessage}\n\nClick to retry or check configuration`;
		this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');

		console.error('Chutes Quota Error:', error);
	}

	private async showQuotaDetails(): Promise<void> {
    const apiToken = await this.getApiToken();
		
    if (!apiToken.trim()) {
			const result = await vscode.window.showWarningMessage(
				'Chutes.ai API token not configured. Would you like to set it up now?',
        'Set API Token',
				'Cancel'
			);
			
      if (result === 'Set API Token') {
        await this.promptForApiToken();
			}
			return;
		}

		// Show detailed information
		if (this.statusBarItem.text.includes('Error') || this.statusBarItem.text.includes('Setup Required')) {
			vscode.window.showErrorMessage('Cannot show details: ' + (this.statusBarItem.tooltip as string || 'Unknown error'));
			return;
		}

		if (this.statusBarItem.text.includes('Loading')) {
			vscode.window.showInformationMessage('Please wait, quota information is loading...');
			return;
		}

		// Extract data from current status for detailed view
		const tooltipText = this.statusBarItem.tooltip as string;
		if (tooltipText && tooltipText.includes('Used:')) {
			vscode.window.showInformationMessage(tooltipText, { modal: false });
		} else {
			vscode.window.showInformationMessage('Quota details: ' + this.statusBarItem.text);
		}
	}

	public dispose(): void {
		if (this.refreshTimer) {
			clearInterval(this.refreshTimer);
		}
		this.statusBarItem.dispose();
	}
}

let quotaMonitor: ChutesQuotaMonitor;

export function activate(context: vscode.ExtensionContext) {
	console.log('Chutes Quota extension is now active');
	
	// Initialize the quota monitor
	quotaMonitor = new ChutesQuotaMonitor(context);
	
	// Add to subscriptions for proper cleanup
	context.subscriptions.push({
		dispose: () => quotaMonitor.dispose()
	});
}

export function deactivate() {
	if (quotaMonitor) {
		quotaMonitor.dispose();
	}
}
