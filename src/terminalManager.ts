// import * as vscode from 'vscode';
// import * as fs from 'fs';
// import * as path from 'path';
// import * as os from 'os';
 
// export class TerminalManager {
//     private terminalData: Map<string, string[]> = new Map();
//     private terminals: Map<string, vscode.Terminal> = new Map();
//     private outputChannel: vscode.OutputChannel;
//     private terminalProcessIds: Set<number> = new Set();
 
//     constructor() {
//         this.outputChannel = vscode.window.createOutputChannel('Terminal Logs');
//         this.initializeTerminalListeners();
//     }
 
//     private initializeTerminalListeners(): void {
//         // Handle existing terminals
//         vscode.window.terminals.forEach(terminal => {
//             this.setupTerminal(terminal);
//         });
 
//         // Handle new terminals
//         vscode.window.onDidOpenTerminal(terminal => {
//             this.setupTerminal(terminal);
//         });
 
//         // Handle terminal closure
//         vscode.window.onDidCloseTerminal(terminal => {
//             this.cleanupTerminal(terminal);
//         });
//     }
 
//     private async setupTerminal(terminal: vscode.Terminal): Promise<void> {
//         const processId = await terminal.processId;
//         if (processId && !this.terminalProcessIds.has(processId)) {
//             this.terminalProcessIds.add(processId);
//             this.terminals.set(terminal.name, terminal);
//             this.terminalData.set(terminal.name, []);
 
//             // Configure terminal output
//             this.configureTerminal(terminal);
//             // Setup output capture
//             await this.setupOutputCapture(terminal);
//         }
//     }
 
//     // private configureTerminal(terminal: vscode.Terminal): void {
//     //     // Set up basic terminal configuration
//     //     if (process.platform === 'win32') {
//     //         terminal.sendText('@echo on');
//     //         terminal.sendText('set PROMPT=$G');
//     //     } else {
//     //         terminal.sendText('export PS1="$ "');
//     //         terminal.sendText('stty echo');
//     //     }
//     // }
//     private configureTerminal(terminal: vscode.Terminal): void {
//         // Simplified configuration that won't interfere with normal operation
//         if (process.platform === 'win32') {
//             terminal.sendText('prompt $G', false);  // Using 'false' to not execute immediately
//         } else {
//             terminal.sendText('export PS1="\\$ "', false);  // Using standard prompt
//         }
//     }
 
//     private async setupOutputCapture(terminal: vscode.Terminal): Promise<void> {
//         const tmpDir = path.join(os.tmpdir(), 'vscode-terminal-logs');
//         // Ensure temp directory exists
//         if (!fs.existsSync(tmpDir)) {
//             fs.mkdirSync(tmpDir, { recursive: true });
//         }
 
//         const logFile = path.join(tmpDir, `${terminal.name}-${Date.now()}.log`);
 
//         // Set up command output redirection
//         const redirectCommand = this.getRedirectCommand(logFile);
//         terminal.sendText(redirectCommand);
 
//         // Watch the log file
//         this.watchLogFile(logFile, terminal.name);
//     }



//     // private async setupOutputCapture(terminal: vscode.Terminal): Promise<void> {
//     //     // Use user's home directory instead of temp
//     //     const logDir = path.join(os.homedir(), '.vscode-terminal-logs');
//     //     if (!fs.existsSync(logDir)) {
//     //         fs.mkdirSync(logDir, { recursive: true });
//     //     }
    
//     //     const logFile = path.join(logDir, `${terminal.name}-${Date.now()}.log`);
//     //     const redirectCommand = this.getRedirectCommand(logFile);
//     //     terminal.sendText(redirectCommand);
//     //     this.watchLogFile(logFile, terminal.name);
//     // }
    
 
//     // private getRedirectCommand(logFile: string): string {
//     //     if (process.platform === 'win32') {
//     //         return `echo Terminal Output > "${logFile}" && type con > "${logFile}"`;
//     //     } else {
//     //         return `exec 1> >(tee -a "${logFile}") 2>&1`;
//     //     }
//     // }
 
//     private getRedirectCommand(logFile: string): string {
//         if (process.platform === 'win32') {
//             return `cmd /c echo %DATE% %TIME% ^> "${logFile}" && cmd /c type con ^> "${logFile}"`;
//         } else {
//             return `exec 1> >(tee -a "${logFile}") 2>&1`;
//         }
//     }
    
//     public getErrorLogs(terminalName?: string): string[] {
//         // Enhanced error detection
//         const errorPatterns = [
//             /error/i,
//             /exception/i,
//             /failed/i,
//             /not found/i,
//             /cannot/i
//         ];
        
//         const logs = this.getCurrentLogs(terminalName);
//         return logs.filter(log => 
//             errorPatterns.some(pattern => pattern.test(log))
//         );
//     }

//     private watchLogFile(logFile: string, terminalName: string): void {
//         let buffer = '';
//         // Create file if it doesn't exist
//         if (!fs.existsSync(logFile)) {
//             fs.writeFileSync(logFile, '');
//         }
 
//         const watcher = fs.watch(logFile, (eventType) => {
//             if (eventType === 'change') {
//                 try {
//                     const content = fs.readFileSync(logFile, 'utf8');
//                     const newContent = content.slice(buffer.length);
//                     if (newContent) {
//                         buffer = content;
//                         this.processOutput(terminalName, newContent);
//                     }
//                 } catch (error) {
//                     console.error(`Error reading log file: ${error}`);
//                 }
//             }
//         });
 
//         // Cleanup watcher when terminal closes
//         vscode.window.onDidCloseTerminal(closedTerminal => {
//             if (closedTerminal.name === terminalName) {
//                 watcher.close();
//                 try {
//                     fs.unlinkSync(logFile);
//                 } catch (error) {
//                     console.error(`Error deleting log file: ${error}`);
//                 }
//             }
//         });
//     }
 
//     private processOutput(terminalName: string, output: string): void {
//         const lines = output.split('\n')
//             .map(line => line.trim())
//             .filter(line => line.length > 0);
 
//         if (lines.length > 0) {
//             const terminalLogs = this.terminalData.get(terminalName) || [];
//             lines.forEach(line => {
//                 terminalLogs.push(line);
//                 this.outputChannel.appendLine(`[${terminalName}] ${line}`);
//             });
 
//             this.terminalData.set(terminalName, terminalLogs);
//         }
//     }
 
//     private cleanupTerminal(terminal: vscode.Terminal): void {
//         terminal.processId.then(pid => {
//             if (pid) {
//                 this.terminalProcessIds.delete(pid);
//             }
//         });
//         this.terminals.delete(terminal.name);
//         this.terminalData.delete(terminal.name);
//     }
 
//     public createDebugTerminal(name: string): vscode.Terminal {
//         const existingTerminal = this.terminals.get(name);
//         if (existingTerminal) {
//             existingTerminal.show();
//             return existingTerminal;
//         }
 
//         const terminalOptions: vscode.TerminalOptions = {
//             name,
//             shellPath: process.platform === 'win32' ? 'cmd.exe' : 'bash',
//             shellArgs: process.platform === 'win32' ? ['/K'] : ['-l'],
//             iconPath: new vscode.ThemeIcon('debug'),
//             location: vscode.TerminalLocation.Panel
//         };
 
//         const terminal = vscode.window.createTerminal(terminalOptions);
//         this.setupTerminal(terminal);
//         terminal.show();
//         return terminal;
//     }
 
//     public getCurrentLogs(terminalName?: string): string[] {
//         if (terminalName) {
//             return this.terminalData.get(terminalName) || [];
//         }
//         return Array.from(this.terminalData.values()).flat();
//     }
 
//     // public getErrorLogs(terminalName?: string): string[] {
//     //     const logs = this.getCurrentLogs(terminalName);
//     //     return logs.filter(log => 
//     //         log.toLowerCase().includes('error') ||
//     //         log.toLowerCase().includes('exception')
//     //     );
//     // }
 
//     public clearLogs(terminalName?: string): void {
//         if (terminalName) {
//             this.terminalData.set(terminalName, []);
//         } else {
//             this.terminalData.clear();
//         }
//         this.outputChannel.clear();
//     }
 
//     public dispose(): void {
//         this.outputChannel.dispose();
//         this.terminals.forEach(terminal => terminal.dispose());
//         this.terminals.clear();
//         this.terminalData.clear();
//         this.terminalProcessIds.clear();
//     }
// }



// import * as vscode from 'vscode';
// import * as fs from 'fs';
// import * as path from 'path';
// import * as os from 'os';

// export class TerminalManager {
//     private terminalData: Map<string, string[]> = new Map();
//     private terminals: Map<string, vscode.Terminal> = new Map();
//     private outputChannel: vscode.OutputChannel;
//     private terminalProcessIds: Set<number> = new Set();
//     private logFiles: Map<string, string> = new Map();

//     constructor() {
//         this.outputChannel = vscode.window.createOutputChannel('Terminal Logs');
//         this.initializeTerminalListeners();
//     }

//     private initializeTerminalListeners(): void {
//         vscode.window.terminals.forEach(terminal => {
//             this.setupTerminal(terminal);
//         });

//         vscode.window.onDidOpenTerminal(terminal => {
//             this.setupTerminal(terminal);
//         });

//         vscode.window.onDidCloseTerminal(terminal => {
//             this.cleanupTerminal(terminal);
//         });

//         // Add data event listener
//         vscode.window.onDidWriteTerminalData(event => {
//             this.handleTerminalData(event.terminal.name, event.data);
//         });
//     }

//     private async setupTerminal(terminal: vscode.Terminal): Promise<void> {
//         const processId = await terminal.processId;
//         if (processId && !this.terminalProcessIds.has(processId)) {
//             this.terminalProcessIds.add(processId);
//             this.terminals.set(terminal.name, terminal);
//             this.terminalData.set(terminal.name, []);

//             // Create log file
//             const logFile = this.createLogFile(terminal.name);
//             this.logFiles.set(terminal.name, logFile);

//             // Minimal terminal configuration
//             await this.configureTerminal(terminal);
//         }
//     }

//     private createLogFile(terminalName: string): string {
//         const logDir = path.join(os.tmpdir(), 'vscode-terminal-logs');
//         if (!fs.existsSync(logDir)) {
//             fs.mkdirSync(logDir, { recursive: true });
//         }
//         const logFile = path.join(logDir, `${terminalName}-${Date.now()}.log`);
//         fs.writeFileSync(logFile, ''); // Create empty file
//         return logFile;
//     }

//     private async configureTerminal(terminal: vscode.Terminal): Promise<void> {
//         // Minimal configuration to avoid interference
//         if (process.platform === 'win32') {
//             terminal.sendText('prompt $G', true);
//         } else {
//             terminal.sendText('export PS1="\\$ "', true);
//         }
//     }

//     private handleTerminalData(terminalName: string, data: string): void {
//         // Process incoming terminal data
//         const logFile = this.logFiles.get(terminalName);
//         if (logFile) {
//             // Append to log file
//             fs.appendFileSync(logFile, data);
            
//             // Update in-memory data
//             const lines = data.split('\n').filter(line => line.trim().length > 0);
//             if (lines.length > 0) {
//                 const terminalLogs = this.terminalData.get(terminalName) || [];
//                 terminalLogs.push(...lines);
//                 this.terminalData.set(terminalName, terminalLogs);
                
//                 // Update output channel
//                 lines.forEach(line => {
//                     this.outputChannel.appendLine(`[${terminalName}] ${line}`);
//                 });
//             }
//         }
//     }

//     public getErrorLogs(terminalName?: string): string[] {
//         const errorPatterns = [
//             /error/i,
//             /exception/i,
//             /failed/i,
//             /not found/i,
//             /cannot/i,
//             /undefined/i,
//             /null/i,
//             /invalid/i
//         ];
        
//         const logs = this.getCurrentLogs(terminalName);
//         return logs.filter(log => 
//             errorPatterns.some(pattern => pattern.test(log))
//         );
//     }

//     public getCurrentLogs(terminalName?: string): string[] {
//         if (terminalName) {
//             const logFile = this.logFiles.get(terminalName);
//             if (logFile && fs.existsSync(logFile)) {
//                 try {
//                     const content = fs.readFileSync(logFile, 'utf8');
//                     return content.split('\n').filter(line => line.trim().length > 0);
//                 } catch (error) {
//                     console.error(`Error reading log file: ${error}`);
//                 }
//             }
//             return this.terminalData.get(terminalName) || [];
//         }
//         return Array.from(this.terminalData.values()).flat();
//     }

//     private cleanupTerminal(terminal: vscode.Terminal): void {
//         const logFile = this.logFiles.get(terminal.name);
//         if (logFile && fs.existsSync(logFile)) {
//             try {
//                 fs.unlinkSync(logFile);
//             } catch (error) {
//                 console.error(`Error deleting log file: ${error}`);
//             }
//         }
        
//         this.logFiles.delete(terminal.name);
//         this.terminals.delete(terminal.name);
//         this.terminalData.delete(terminal.name);
        
//         terminal.processId.then(pid => {
//             if (pid) {
//                 this.terminalProcessIds.delete(pid);
//             }
//         });
//     }

//     public dispose(): void {
//         this.outputChannel.dispose();
//         this.terminals.forEach(terminal => terminal.dispose());
        
//         // Cleanup all log files
//         this.logFiles.forEach((logFile) => {
//             if (fs.existsSync(logFile)) {
//                 try {
//                     fs.unlinkSync(logFile);
//                 } catch (error) {
//                     console.error(`Error deleting log file: ${error}`);
//                 }
//             }
//         });
        
//         this.terminals.clear();
//         this.terminalData.clear();
//         this.terminalProcessIds.clear();
//         this.logFiles.clear();
//     }
// }

// import * as vscode from 'vscode';
// import * as fs from 'fs';
// import * as path from 'path';
// import * as os from 'os';

// class ErrorMonitor {
//     private errorFile: string;
//     private lastError: string = "";
//     private errorPatterns: string[] = [
//         "Traceback",
//         "Error:",
//         "Exception:",
//         "Failed:",
//         "SyntaxError",
//         "TypeError",
//         "ValueError",
//         "ImportError",
//         "AttributeError",
//         "NameError",
//         "ZeroDivisionError",
//         "IndexError",
//         "KeyError"
//     ];

//     constructor(private claudeSolver: any) {
//         this.errorFile = path.join(os.tmpdir(), 'vscode_errors.json');
//         this.initializeErrorFile();
//         console.log(`Monitoring errors in: ${this.errorFile}`);
//     }

//     private initializeErrorFile() {
//         if (!fs.existsSync(this.errorFile)) {
//             fs.writeFileSync(this.errorFile, JSON.stringify({ errors: [] }, null, 2));
//         }
//     }

//     private isErrorMessage(text: string): boolean {
//         return this.errorPatterns.some(pattern => text.includes(pattern));
//     }

//     public async monitorTerminal() {
//         console.log("Starting error monitoring...");
//         console.log("Waiting for errors in your terminal...");

//         vscode.window.onDidWriteTerminalData(event => {
//             const output = event.data;
//             if (this.isErrorMessage(output)) {
//                 this.logError(output);
//             }
//         });

//         // Start monitoring the error file
//         this.watchErrorFile();
//     }

//     private watchErrorFile() {
//         fs.watchFile(this.errorFile, async (curr, prev) => {
//             if (curr.mtime > prev.mtime) {
//                 try {
//                     const data = JSON.parse(fs.readFileSync(this.errorFile, 'utf8'));
//                     const errors = data.errors || [];
//                     if (errors.length > 0) {
//                         const latestError = errors[errors.length - 1];
//                         if (latestError !== this.lastError) {
//                             await this.processError(latestError);
//                             this.lastError = latestError;
//                         }
//                     }
//                 } catch (error) {
//                     console.error("Error reading error file:", error);
//                 }
//             }
//         });
//     }

//     private async processError(errorText: string) {
//         try {
//             const solution = await this.claudeSolver.getSolution(errorText);
//             this.claudeSolver.displaySolution(errorText, solution);
//         } catch (error) {
//             console.error("Error processing solution:", error);
//         }
//     }

//     public static logError(errorText: string) {
//         const errorFile = path.join(os.tmpdir(), 'vscode_errors.json');

//         try {
//             const data = fs.existsSync(errorFile) ? JSON.parse(fs.readFileSync(errorFile, 'utf8')) : { errors: [] };
//             data.errors.push(errorText);
//             fs.writeFileSync(errorFile, JSON.stringify(data, null, 2));
//         } catch (error) {
//             console.error("Error writing to error file:", error);
//         }
//     }
// }

// export default ErrorMonitor;

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

    // private async processError(errorText: string) {
    //     console.log('Processing error:', errorText);
    //     try {
    //         const solution = await this.solver.getSolution(errorText);
    //         console.log('Got solution:', solution);
    //         await this.displaySolution(errorText, solution);
    //     } catch (error) {
    //         console.error("Error processing solution:", error);
    //         vscode.window.showErrorMessage("Failed to get solution");
    //     }
    // }
    private async processError(errorText: string) {
        console.log('Processing error:', errorText);
        try {
            const solution = await this.solver.getSolution(errorText);
            console.log('Got solution:', solution);
            // await this.displaySolution(errorText, solution);
            await this.sendSolutionToChat(errorText, solution);
        } catch (error) {
            console.error("Error processing solution:", error);
            vscode.window.showErrorMessage("Failed to get solution");
        }
    }

    // private async displaySolution(error: string, solution: any) {
    //     const panel = vscode.window.createWebviewPanel(
    //         'errorSolution',
    //         'Error Solution',
    //         vscode.ViewColumn.Two,
    //         {}
    //     );
    
    //     // Format the suggestions into HTML
    //     const suggestionsHtml = solution.suggestions
    //         ? solution.suggestions
    //             .map((suggestion: string, index: number) => 
    //                 `<li>${suggestion}</li>`)
    //             .join('\n')
    //         : '';
    
    //     // Format code snippets if they exist
    //     const snippetsHtml = solution.code_snippets
    //         ? solution.code_snippets
    //             .map((snippet: any) => 
    //                 `<pre><code>${snippet.code}</code></pre>`)
    //             .join('\n')
    //         : '';
    
    //     panel.webview.html = `
    //         <!DOCTYPE html>
    //         <html>
    //             <head>
    //                 <style>
    //                     body { 
    //                         padding: 15px; 
    //                         font-family: system-ui;
    //                         line-height: 1.5;
    //                     }
    //                     .error { 
    //                         color: red; 
    //                         margin-bottom: 15px; 
    //                         white-space: pre-wrap;
    //                         padding: 10px;
    //                         background-color: #f8f8f8;
    //                         border-radius: 4px;
    //                     }
    //                     .solution { 
    //                         white-space: pre-wrap;
    //                     }
    //                     .suggestions {
    //                         margin-top: 15px;
    //                     }
    //                     .suggestions li {
    //                         margin-bottom: 8px;
    //                     }
    //                     pre {
    //                         background-color: #f5f5f5;
    //                         padding: 10px;
    //                         border-radius: 4px;
    //                         overflow-x: auto;
    //                     }
    //                 </style>
    //             </head>
    //             <body>
    //                 <h3>Error:</h3>
    //                 <div class="error">${error}</div>
    //                 ${snippetsHtml ? '<h3>Code Snippets:</h3>' + snippetsHtml : ''}
    //                 <h3>Suggestions:</h3>
    //                 <ul class="suggestions">
    //                     ${suggestionsHtml}
    //                 </ul>
    //             </body>
    //         </html>
    //     `;
    // }
    
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