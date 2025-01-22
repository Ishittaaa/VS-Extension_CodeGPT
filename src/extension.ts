import * as vscode from 'vscode';
import { ChatProvider } from './chatProvider';
import { TerminalManager } from './terminalManager';
import { DocumentManager } from './documentManager';
 
export function activate(context: vscode.ExtensionContext) {
    const terminalManager = new TerminalManager();
    const documentManager = new DocumentManager();
    let chatProvider: ChatProvider | undefined;
 
    const ensureChatProvider = () => {
        if (!chatProvider) {
            chatProvider = new ChatProvider(context, terminalManager, documentManager);
        }
        return chatProvider;
    };
 
    const getSelectedOrFullText = (editor: vscode.TextEditor): string => {
        const selection = editor.selection;
        return selection.isEmpty
            ? editor.document.getText()
            : editor.document.getText(selection);
    };
 
    let explainCommand = vscode.commands.registerCommand('api-debug-bot.explain', async () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showInformationMessage('Please open a file to explain');
            return;
        }
 
        const text = getSelectedOrFullText(activeEditor);
        if (!text.trim()) {
            vscode.window.showInformationMessage('No code selected to explain');
            return;
        }
 
        ensureChatProvider().sendToChat('analyze', text);
    });
 
    let debugCommand = vscode.commands.registerCommand('api-debug-bot.debug', async () => {
        const logs = terminalManager.getCurrentLogs();
        if (!logs || logs.length === 0) {
            vscode.window.showInformationMessage('No terminal logs found');
            return;
        }
 
        // Join the logs array into a single string with newlines
        const logsText = logs.join('\n');
        ensureChatProvider().sendToChat('debug', logsText);
    });
 
    let refactorCommand = vscode.commands.registerCommand('api-debug-bot.refactor', async () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showInformationMessage('Please open a file to refactor');
            return;
        }
 
        const text = getSelectedOrFullText(activeEditor);
        if (!text.trim()) {
            vscode.window.showInformationMessage('No code selected to refactor');
            return;
        }
 
        ensureChatProvider().sendToChat('refactor', text);
    });
 
    context.subscriptions.push(explainCommand, debugCommand, refactorCommand);
}
 
export function deactivate() {}