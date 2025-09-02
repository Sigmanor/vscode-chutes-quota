import * as vscode from 'vscode';
import axios, { AxiosError } from 'axios';

// Interface for the API response
interface ChutesQuotaResponse {
	quota: number;
	used: number;
}

// Interface for extension configuration
interface ChutesQuotaConfig {
	apiToken: string;
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
		
		// Initial load
		this.updateQuota();
		this.setupAutoRefresh();
		
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

		this.context.subscriptions.push(showDetailsCommand, refreshCommand);
	}

	private getConfiguration(): ChutesQuotaConfig {
		const config = vscode.workspace.getConfiguration('chutesQuota');
		return {
			apiToken: config.get<string>('apiToken', ''),
			refreshInterval: config.get<number>('refreshInterval', 5)
		};
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
		
		if (!config.apiToken.trim()) {
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
						'Authorization': `Bearer ${config.apiToken}`,
						'Content-Type': 'application/json'
					},
					timeout: 10000 // 10 second timeout
				}
			);

			const { quota, used } = response.data;
			const percentage = Math.round((used / quota) * 100);
			const remaining = quota - used;

			// Update status bar
			this.statusBarItem.text = `Chutes: ${Math.round(used)}/${quota} (${percentage}%)`;
			this.statusBarItem.tooltip = this.createTooltip(quota, used, remaining, percentage);
			this.statusBarItem.backgroundColor = undefined;

		} catch (error) {
			this.handleError(error);
		} finally {
			this.isRefreshing = false;
		}
	}

	private createTooltip(quota: number, used: number, remaining: number, percentage: number): string {
		return `Chutes.ai API Quota
Used: ${Math.round(used)}
Total: ${quota}
Remaining: ${Math.round(remaining)}
Usage: ${percentage}%

Click for details or use Ctrl+Shift+P → "Chutes Quota: Show Details"`;
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
		const config = this.getConfiguration();
		
		if (!config.apiToken.trim()) {
			const result = await vscode.window.showWarningMessage(
				'Chutes.ai API token not configured. Would you like to set it up now?',
				'Open Settings',
				'Cancel'
			);
			
			if (result === 'Open Settings') {
				vscode.commands.executeCommand('workbench.action.openSettings', 'chutesQuota.apiToken');
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
