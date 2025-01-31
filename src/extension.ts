// import * as vscode from 'vscode';
// import { ChatProvider } from './chatProvider';
// import { TerminalManager } from './terminalManager';
// import { DocumentManager } from './documentManager';

// export function activate(context: vscode.ExtensionContext) {
//     // Initialize with context
//     const terminalManager = new TerminalManager(context);
//     const documentManager = new DocumentManager();
//     let chatProvider: ChatProvider | undefined;

//     const ensureChatProvider = () => {
//         if (!chatProvider) {
//             chatProvider = new ChatProvider(context, terminalManager, documentManager);
//         }
//         return chatProvider;
//     };

//     const getSelectedOrFullText = (editor: vscode.TextEditor): string => {
//         const selection = editor.selection;
//         return selection.isEmpty
//             ? editor.document.getText()
//             : editor.document.getText(selection);
//     };

//     // Command to explain code
//     let explainCommand = vscode.commands.registerCommand('api-debug-bot.explain', async () => {
//         const activeEditor = vscode.window.activeTextEditor;
//         if (!activeEditor) {
//             vscode.window.showInformationMessage('Please open a file to explain');
//             return;
//         }

//         const text = getSelectedOrFullText(activeEditor);
//         if (!text.trim()) {
//             vscode.window.showInformationMessage('No code selected to explain');
//             return;
//         }

//         ensureChatProvider().sendToChat('analyze', text);
//     });

//     // Command to debug terminal output
//     let debugCommand = vscode.commands.registerCommand('api-debug-bot.debug', async () => {
//         try {
//             // Get all logs instead of just current logs
//             const logs = terminalManager.getAllLogs();
//             console.log('Available logs:', logs.length);  // Debug output
            
//             if (!logs || logs.length === 0) {
//                 const message = 'No terminal logs found. Please run your command in the Debug Terminal first.';
//                 vscode.window.showInformationMessage(message);
                
//                 // Show the debug terminal to make it clear where to run commands
//                 await terminalManager.executeCommand('echo "Run your commands here to capture output"');
//                 return;
//             }

//             // Get the latest log for analysis
//             const latestLog = terminalManager.getLatestLog();
//             if (!latestLog) {
//                 vscode.window.showInformationMessage('No recent terminal output found');
//                 return;
//             }
            
//             // Log for debugging
//             console.log('Sending log to chat:', latestLog.substring(0, 200) + '...');
            
//             // Send to chat provider for analysis
//             ensureChatProvider().sendToChat('debug', latestLog);
//         } catch (error) {
//             console.error('Error in debug command:', error);
//             vscode.window.showErrorMessage(`Error processing debug logs: ${error}`);
//         }
//     });

//     // Command to refactor code
//     let refactorCommand = vscode.commands.registerCommand('api-debug-bot.refactor', async () => {
//         const activeEditor = vscode.window.activeTextEditor;
//         if (!activeEditor) {
//             vscode.window.showInformationMessage('Please open a file to refactor');
//             return;
//         }

//         const text = getSelectedOrFullText(activeEditor);
//         if (!text.trim()) {
//             vscode.window.showInformationMessage('No code selected to refactor');
//             return;
//         }

//         ensureChatProvider().sendToChat('refactor', text);
//     });

//     // Command to clear logs
//     let clearLogsCommand = vscode.commands.registerCommand('api-debug-bot.clearLogs', () => {
//         try {
//             terminalManager.clearLogs();
//             vscode.window.showInformationMessage('Terminal logs cleared');
//         } catch (error) {
//             console.error('Error clearing logs:', error);
//             vscode.window.showErrorMessage(`Error clearing logs: ${error}`);
//         }
//     });

//     // Command to execute in debug terminal
//     let executeCommand = vscode.commands.registerCommand('api-debug-bot.execute', async () => {
//         try {
//             const command = await vscode.window.showInputBox({
//                 prompt: 'Enter command to execute in Debug Terminal',
//                 placeHolder: 'e.g., npm test'
//             });

//             if (command) {
//                 const output = await terminalManager.executeCommand(command);
//                 console.log('Command output captured:', output.substring(0, 200) + '...');
//                 vscode.window.showInformationMessage('Command executed. Use "Debug Output" to analyze the results.');
//             }
//         } catch (error) {
//             console.error('Error executing command:', error);
//             vscode.window.showErrorMessage(`Error executing command: ${error}`);
//         }
//     });

//     // Register all commands
//     context.subscriptions.push(
//         explainCommand,
//         debugCommand,
//         refactorCommand,
//         clearLogsCommand,
//         executeCommand
//     );

//     // Ensure proper cleanup
//     context.subscriptions.push({
//         dispose: () => {
//             terminalManager.dispose();
//             if (chatProvider) {
//                 chatProvider.dispose();
//             }
//         }
//     });
// }

// export function deactivate() {}

import * as vscode from "vscode";
import { ChatProvider } from "./chatProvider";
import { TerminalManager } from "./terminalManager";
import { DocumentManager } from "./documentManager";

export function activate(context: vscode.ExtensionContext) {
  const documentManager = new DocumentManager();
  const chatProvider = new ChatProvider(context, null as any, documentManager);
  const terminalManager = new TerminalManager(chatProvider);

  // Command to explain code
  const explainCommand = vscode.commands.registerCommand("api-debug-bot.explain", async () => {
    const activeEditor = vscode.window.activeTextEditor;
    console.log("gsgtws111111111111111111111111111111111111111111111",activeEditor);
    if (!activeEditor) {
      vscode.window.showInformationMessage("Please open a file to explain");
      return;
    }

    const text = getSelectedOrFullText(activeEditor);
    if (!text.trim()) {
      vscode.window.showInformationMessage("No code selected to explain");
      return;
    }

    chatProvider.sendToChat("analyze", text);
  });

  // Command to debug terminal output
  const debugCommand = vscode.commands.registerCommand("api-debug-bot.debug", async () => {
    vscode.window.showInformationMessage("Error monitoring is active. Any errors will be processed automatically.");
  });

  // Command to refactor code
  const refactorCommand = vscode.commands.registerCommand("api-debug-bot.refactor", async () => {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      vscode.window.showInformationMessage("Please open a file to refactor");
      return;
    }

    const text = getSelectedOrFullText(activeEditor);
    if (!text.trim()) {
      vscode.window.showInformationMessage("No code selected to refactor");
      return;
    }

    chatProvider.sendToChat("refactor", text);
  });

  // Start monitoring terminals
  terminalManager.monitorTerminal().catch((error) => {
    console.error("Error starting terminal monitoring:", error);
    vscode.window.showErrorMessage("Failed to start terminal monitoring");

  });

  // Register all commands
  context.subscriptions.push(explainCommand, debugCommand, refactorCommand);

  // Ensure proper cleanup
  context.subscriptions.push({
    dispose: () => {
      terminalManager.dispose();
      chatProvider.dispose();
    },
  });
}

export function deactivate() {}

function getSelectedOrFullText(editor: vscode.TextEditor): string {
  const selection = editor.selection;
  return selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
}

