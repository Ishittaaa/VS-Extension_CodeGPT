import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
 
export class TerminalManager {
    private terminalData: Map<string, string[]> = new Map();
    private terminals: Map<string, vscode.Terminal> = new Map();
    private outputChannel: vscode.OutputChannel;
    private terminalProcessIds: Set<number> = new Set();
 
    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Terminal Logs');
        this.initializeTerminalListeners();
    }
 
    private initializeTerminalListeners(): void {
        // Handle existing terminals
        vscode.window.terminals.forEach(terminal => {
            this.setupTerminal(terminal);
        });
 
        // Handle new terminals
        vscode.window.onDidOpenTerminal(terminal => {
            this.setupTerminal(terminal);
        });
 
        // Handle terminal closure
        vscode.window.onDidCloseTerminal(terminal => {
            this.cleanupTerminal(terminal);
        });
    }
 
    private async setupTerminal(terminal: vscode.Terminal): Promise<void> {
        const processId = await terminal.processId;
        if (processId && !this.terminalProcessIds.has(processId)) {
            this.terminalProcessIds.add(processId);
            this.terminals.set(terminal.name, terminal);
            this.terminalData.set(terminal.name, []);
 
            // Configure terminal output
            this.configureTerminal(terminal);
            // Setup output capture
            await this.setupOutputCapture(terminal);
        }
    }
 
    private configureTerminal(terminal: vscode.Terminal): void {
        // Set up basic terminal configuration
        if (process.platform === 'win32') {
            terminal.sendText('@echo on');
            terminal.sendText('set PROMPT=$G');
        } else {
            terminal.sendText('export PS1="$ "');
            terminal.sendText('stty echo');
        }
    }
 
    private async setupOutputCapture(terminal: vscode.Terminal): Promise<void> {
        const tmpDir = path.join(os.tmpdir(), 'vscode-terminal-logs');
        // Ensure temp directory exists
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
 
        const logFile = path.join(tmpDir, `${terminal.name}-${Date.now()}.log`);
 
        // Set up command output redirection
        const redirectCommand = this.getRedirectCommand(logFile);
        terminal.sendText(redirectCommand);
 
        // Watch the log file
        this.watchLogFile(logFile, terminal.name);
    }
 
    private getRedirectCommand(logFile: string): string {
        if (process.platform === 'win32') {
            return `echo Terminal Output > "${logFile}" && type con > "${logFile}"`;
        } else {
            return `exec 1> >(tee -a "${logFile}") 2>&1`;
        }
    }
 
    private watchLogFile(logFile: string, terminalName: string): void {
        let buffer = '';
        // Create file if it doesn't exist
        if (!fs.existsSync(logFile)) {
            fs.writeFileSync(logFile, '');
        }
 
        const watcher = fs.watch(logFile, (eventType) => {
            if (eventType === 'change') {
                try {
                    const content = fs.readFileSync(logFile, 'utf8');
                    const newContent = content.slice(buffer.length);
                    if (newContent) {
                        buffer = content;
                        this.processOutput(terminalName, newContent);
                    }
                } catch (error) {
                    console.error(`Error reading log file: ${error}`);
                }
            }
        });
 
        // Cleanup watcher when terminal closes
        vscode.window.onDidCloseTerminal(closedTerminal => {
            if (closedTerminal.name === terminalName) {
                watcher.close();
                try {
                    fs.unlinkSync(logFile);
                } catch (error) {
                    console.error(`Error deleting log file: ${error}`);
                }
            }
        });
    }
 
    private processOutput(terminalName: string, output: string): void {
        const lines = output.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
 
        if (lines.length > 0) {
            const terminalLogs = this.terminalData.get(terminalName) || [];
            lines.forEach(line => {
                terminalLogs.push(line);
                this.outputChannel.appendLine(`[${terminalName}] ${line}`);
            });
 
            this.terminalData.set(terminalName, terminalLogs);
        }
    }
 
    private cleanupTerminal(terminal: vscode.Terminal): void {
        terminal.processId.then(pid => {
            if (pid) {
                this.terminalProcessIds.delete(pid);
            }
        });
        this.terminals.delete(terminal.name);
        this.terminalData.delete(terminal.name);
    }
 
    public createDebugTerminal(name: string): vscode.Terminal {
        const existingTerminal = this.terminals.get(name);
        if (existingTerminal) {
            existingTerminal.show();
            return existingTerminal;
        }
 
        const terminalOptions: vscode.TerminalOptions = {
            name,
            shellPath: process.platform === 'win32' ? 'cmd.exe' : 'bash',
            shellArgs: process.platform === 'win32' ? ['/K'] : ['-l'],
            iconPath: new vscode.ThemeIcon('debug'),
            location: vscode.TerminalLocation.Panel
        };
 
        const terminal = vscode.window.createTerminal(terminalOptions);
        this.setupTerminal(terminal);
        terminal.show();
        return terminal;
    }
 
    public getCurrentLogs(terminalName?: string): string[] {
        if (terminalName) {
            return this.terminalData.get(terminalName) || [];
        }
        return Array.from(this.terminalData.values()).flat();
    }
 
    public getErrorLogs(terminalName?: string): string[] {
        const logs = this.getCurrentLogs(terminalName);
        return logs.filter(log => 
            log.toLowerCase().includes('error') ||
            log.toLowerCase().includes('exception')
        );
    }
 
    public clearLogs(terminalName?: string): void {
        if (terminalName) {
            this.terminalData.set(terminalName, []);
        } else {
            this.terminalData.clear();
        }
        this.outputChannel.clear();
    }
 
    public dispose(): void {
        this.outputChannel.dispose();
        this.terminals.forEach(terminal => terminal.dispose());
        this.terminals.clear();
        this.terminalData.clear();
        this.terminalProcessIds.clear();
    }
}