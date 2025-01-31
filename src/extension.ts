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

