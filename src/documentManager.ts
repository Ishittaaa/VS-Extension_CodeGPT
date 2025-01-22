import * as vscode from 'vscode';

export class DocumentManager {
    public getActiveDocumentContent(): string | undefined {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            return activeEditor.document.getText();
        }
        return undefined;
    }
 
    public getSelectedText(): string | undefined {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            return activeEditor.document.getText(activeEditor.selection);
        }
        return undefined;
    }
}