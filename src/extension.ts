import * as vscode from "vscode";
import { ChatProvider } from "./chatProvider";
import { TerminalManager } from "./terminalManager";
import { DocumentManager } from "./documentManager";
 
export function activate(context: vscode.ExtensionContext) {
    const documentManager = new DocumentManager();
    const chatProvider = new ChatProvider(context, null as any, documentManager);
    const terminalManager = new TerminalManager(chatProvider);
 
    // Command to explain code
    const explainCommand = vscode.commands.registerCommand("codepilot.explain", async () => {
        const content = documentManager.getActiveDocumentContent();
        if (!content) {
            return; // Message already shown by documentManager
        }
       
        await chatProvider.sendToChat("analyze", content);
    });
 
    // Command to debug terminal output
    const debugCommand = vscode.commands.registerCommand("codepilot.debug", async () => {
        vscode.window.showInformationMessage("Error monitoring is active. Any errors will be processed automatically.");
    });
 
    // Start monitoring terminals
    terminalManager.monitorTerminal().catch((error) => {
        console.error("Error starting terminal monitoring:", error);
        vscode.window.showErrorMessage("Failed to start terminal monitoring");
    });
 
    // Register all commands
    context.subscriptions.push(explainCommand, debugCommand);
 
    // Ensure proper cleanup
    context.subscriptions.push({
        dispose: () => {
            terminalManager.dispose();
            chatProvider.dispose();
        },
    });
}
 
export function deactivate() {}
