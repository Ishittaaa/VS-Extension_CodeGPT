import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class TerminalManager {
    private errorFile: string;
    private lastError: string = "";
    private disposables: vscode.Disposable[] = [];
    private terminalListeners: Map<vscode.Terminal, vscode.Disposable> = new Map();
    
    private errorPatterns: string[] = [
        "Traceback",
        "Error:",
        "Exception:",
        "Failed:",
        "SyntaxError",
        "TypeError",
        "ValueError",
        "ImportError",
        "AttributeError",
        "NameError",
        "ZeroDivisionError",
        "IndexError",
        "KeyError",
        "RuntimeError",
        "SystemError"
    ];

    constructor(private solver: any) {
        this.errorFile = path.join(os.tmpdir(), 'vscode_errors.json');
        this.initializeErrorFile();
        console.log(`Monitoring errors in: ${this.errorFile}`);
    }

    private initializeErrorFile() {
        if (!fs.existsSync(this.errorFile)) {
            fs.writeFileSync(this.errorFile, JSON.stringify({ errors: [] }, null, 2));
        }
    }

    public async monitorTerminal() {
        console.log("Starting error monitoring...");
        
        // Monitor existing terminals
        vscode.window.terminals.forEach(terminal => {
            this.attachTerminalListener(terminal);
        });

        // Monitor new terminals
        this.disposables.push(
            vscode.window.onDidOpenTerminal(terminal => {
                this.attachTerminalListener(terminal);
            })
        );

        // Clean up closed terminals
        this.disposables.push(
            vscode.window.onDidCloseTerminal(terminal => {
                this.removeTerminalListener(terminal);
            })
        );

        this.watchErrorFile();
    }

    private attachTerminalListener(terminal: vscode.Terminal) {
        console.log('Attaching terminal listener');
        
        const listener = vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document.uri.scheme === 'output') {
                const text = event.document.getText();
                console.log('Checking output:', text);
                if (this.isErrorMessage(text)) {
                    this.logError(text);
                }
            }
        });
        
        this.terminalListeners.set(terminal, listener);
    }

    private removeTerminalListener(terminal: vscode.Terminal) {
        const listener = this.terminalListeners.get(terminal);
        if (listener) {
            listener.dispose();
            this.terminalListeners.delete(terminal);
        }
    }

    private isErrorMessage(text: string): boolean {
        const hasError = this.errorPatterns.some(pattern => text.includes(pattern));
        console.log('Checking text for errors:', text, 'Result:', hasError);
        return hasError;
    }

    private async logError(errorText: string) {
        console.log('Logging error:', errorText);
        try {
            const data = fs.existsSync(this.errorFile) 
                ? JSON.parse(fs.readFileSync(this.errorFile, 'utf8')) 
                : { errors: [] };
            
            data.errors.push(errorText);
            fs.writeFileSync(this.errorFile, JSON.stringify(data, null, 2));
            
            await this.processError(errorText);
        } catch (error) {
            console.error("Error writing to error file:", error);
        }
    }

    private watchErrorFile() {
        fs.watchFile(this.errorFile, async (curr, prev) => {
            if (curr.mtime > prev.mtime) {
                try {
                    const data = JSON.parse(fs.readFileSync(this.errorFile, 'utf8'));
                    const errors = data.errors || [];
                    if (errors.length > 0) {
                        const latestError = errors[errors.length - 1];
                        if (latestError !== this.lastError) {
                            await this.processError(latestError);
                            this.lastError = latestError;
                        }
                    }
                } catch (error) {
                    console.error("Error reading error file:", error);
                }
            }
        });
    }
    private async processError(errorText: string) {
        try {
            await this.solver.sendToChat('debug', errorText);
        } catch (error) {
            console.error("Error processing solution:", error);
            vscode.window.showErrorMessage("Failed to get solution");
        }
    }

    // Update the processError method to handle the solution object
    private async sendSolutionToChat(error: string, solution: any) {
        // Format the message for chat
        let chatMessage = `### Error Detected:\n\`\`\`\n${error}\n\`\`\`\n\n`;

        if (solution.suggestions && Array.isArray(solution.suggestions)) {
            chatMessage += '### Suggestions:\n';
            solution.suggestions.forEach((suggestion: string) => {
                chatMessage += `- ${suggestion}\n`;
            });
        }

        if (solution.code_snippets && Array.isArray(solution.code_snippets)) {
            chatMessage += '\n### Code Snippets:\n';
            solution.code_snippets.forEach((snippet: any) => {
                chatMessage += `\`\`\`\n${snippet.code}\n\`\`\`\n`;
            });
        }

        // Send the formatted message to chat
        await this.solver.sendToChat('debug', chatMessage);
    }

    public dispose() {
        this.disposables.forEach(d => d.dispose());
        this.terminalListeners.forEach(listener => listener.dispose());
        this.terminalListeners.clear();
        fs.unwatchFile(this.errorFile);
    }
}