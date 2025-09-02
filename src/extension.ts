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
	private cachedQuota: number | null = null;
	private cachedUsed: number | null = null;
	private cachedPercentage: number | null = null;
	private lastSuccessfulUpdate: Date | null = null;

	constructor(private context: vscode.ExtensionContext) {
		// Create status bar items
		this.statusBarItem = vscode.window.createStatusBarItem(
			vscode.StatusBarAlignment.Right,
			100
		);
		this.statusBarItem.command = 'chutes-quota.openSettings';
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

		const openSettingsCommand = vscode.commands.registerCommand('chutes-quota.openSettings', () => {
			vscode.commands.executeCommand('workbench.action.openSettings', '@ext:sigmanor.vscode-chutes-quota');
		});

	   this.context.subscriptions.push(showDetailsCommand, refreshCommand, setTokenCommand, openSettingsCommand);
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
				// Show cached data with refresh indicator if available, otherwise show loading
				if (this.hasCachedData()) {
					this.showCachedDataWithRefreshIndicator();
				} else {
					this.statusBarItem.text = '$(sync~spin) Chutes: Loading...';
					this.statusBarItem.tooltip = 'Fetching quota information...';
					this.statusBarItem.backgroundColor = undefined;
				}
		try {
			const response = await axios.get<ChutesQuotaResponse>(
				'https://api.chutes.ai/users/me/quota_usage/me',
				{
					headers: {
            'Authorization': `Bearer ${apiToken}`,
						'Content-Type': 'application/json'
					},
					timeout: 30000 // 30 second timeout
				}
			);

			const { quota, used } = response.data;
			const percentage = Math.round((used / quota) * 100);
			const remaining = quota - used;

			
						// Update status bar using cached display method
						this.updateStatusBarDisplay(quota, used, percentage);
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

	private updateStatusBarDisplay(quota: number, used: number, percentage: number): void {
		// Update cached values
		this.cachedQuota = quota;
		this.cachedUsed = used;
		this.cachedPercentage = percentage;
		this.lastSuccessfulUpdate = new Date();
		
		// Update status bar text
		this.statusBarItem.text = `$(pulse) Chutes: ${Math.round(used)}/${quota} (${percentage}%)`;
		
		// Update tooltip
		const remaining = quota - used;
		this.statusBarItem.tooltip = this.createTooltip(quota, used, remaining, percentage);
		this.statusBarItem.backgroundColor = undefined;
	}

	private hasCachedData(): boolean {
		return this.cachedQuota !== null && this.cachedUsed !== null && this.cachedPercentage !== null;
	}

	private showCachedDataWithRefreshIndicator(): void {
		// Check if cached data exists
		if (this.hasCachedData() && this.cachedQuota !== null && this.cachedUsed !== null && this.cachedPercentage !== null) {
			// Show last data with sync icon instead of pulse
			this.statusBarItem.text = `$(sync~spin) Chutes: ${Math.round(this.cachedUsed)}/${this.cachedQuota} (${this.cachedPercentage}%)`;
			
			// Set tooltip with refresh information
			const remaining = this.cachedQuota - this.cachedUsed;
			this.statusBarItem.tooltip = `${this.createTooltip(this.cachedQuota, this.cachedUsed, remaining, this.cachedPercentage)}\n\nRefreshing...`;
		}
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

		// If cached data exists, show it with error icon
		if (this.hasCachedData() && this.cachedQuota !== null && this.cachedUsed !== null && this.cachedPercentage !== null) {
			// Show cached data with error icon
			this.statusBarItem.text = `$(error) Chutes: ${Math.round(this.cachedUsed)}/${this.cachedQuota} (${this.cachedPercentage}%)`;
			
			// Add information about last successful update time in tooltip
			const remaining = this.cachedQuota - this.cachedUsed;
			let tooltip = this.createTooltip(this.cachedQuota, this.cachedUsed, remaining, this.cachedPercentage);
			
			if (this.lastSuccessfulUpdate) {
				const timeString = this.lastSuccessfulUpdate.toLocaleTimeString();
				tooltip += `\n\nLast updated: ${timeString}\nError: ${errorMessage}`;
			} else {
				tooltip += `\n\nError: ${errorMessage}`;
			}
			
			this.statusBarItem.tooltip = tooltip;
		} else {
			// No cached data, show error message
			this.statusBarItem.text = statusText;
			this.statusBarItem.tooltip = `Error fetching quota: ${errorMessage}\n\nClick to retry or check configuration`;
		}
		
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

	// Note: VSCode doesn't provide hover events for status bar items
	// This method is included for potential future use if VSCode adds this capability
	private handleStatusBarHover(isHovering: boolean): void {		
		// Only update if we have valid quota data
		if (this.statusBarItem.text.includes('Chutes:') &&
				!this.statusBarItem.text.includes('Setup Required') &&
				!this.statusBarItem.text.includes('Loading') &&
				!this.statusBarItem.text.includes('Error')) {
			// Extract current quota information from text
			const match = this.statusBarItem.text.match(/Chutes: (\d+)\/(\d+) \((\d+)%\)/);
			if (match) {
				const used = match[1];
				const quota = match[2];
				const percentage = match[3];
				this.statusBarItem.text = `${isHovering ? '$(sync)' : '$(pulse)'} Chutes: ${used}/${quota} (${percentage}%)`;
			}
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
