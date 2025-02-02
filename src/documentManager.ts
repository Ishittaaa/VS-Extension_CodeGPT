import * as vscode from 'vscode';
 
export class DocumentManager {
    public getActiveDocumentContent(): string | undefined {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showInformationMessage("Please open a file to analyze");
            return undefined;
        }
        if (!activeEditor.document.getText().trim()) {
            vscode.window.showInformationMessage("The file is empty");
            return undefined;
        }
        return activeEditor.document.getText();
    }
 
    public getSelectedText(): string | undefined {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showInformationMessage("Please open a file first");
            return undefined;
        }
        const selectedText = activeEditor.document.getText(activeEditor.selection);
        if (!selectedText.trim()) {
            // If no text is selected, return the entire document content
            return activeEditor.document.getText();
        }
        return selectedText;
    }
}