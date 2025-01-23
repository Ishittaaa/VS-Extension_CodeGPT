import * as vscode from "vscode";
import axios from 'axios';
import * as path from 'path';
import * as fs from 'fs';
import type { TerminalManager } from "./terminalManager";
import type { DocumentManager } from "./documentManager";

export class ChatProvider {
    private panel: vscode.WebviewPanel | undefined;
    private readonly API_URL = 'http://localhost:8000/api/v1';
    private context: vscode.ExtensionContext;

    constructor(
        context: vscode.ExtensionContext,
        private terminalManager: TerminalManager,
        private documentManager: DocumentManager
    ) {
        this.context = context;
        this.initializeWebview();
    }

    private initializeWebview(): void {
        this.panel = vscode.window.createWebviewPanel(
            "api-debug-bot",
            "API Debug Bot",
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(this.context.extensionPath, 'webview'))
                ]
            }
        );

        // Get the path to the chat.html file
        const htmlPath = vscode.Uri.file(
            path.join(this.context.extensionPath, 'webview', 'chat.html')
        );

        // Convert the path to a webview URI
        const htmlUri = this.panel.webview.asWebviewUri(htmlPath);

        // Read the HTML file content
        const htmlContent = this.getWebviewContent(htmlUri);
        this.panel.webview.html = htmlContent;

        // Set up message handling
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case "analyze": {
                        try {
                            const response = await this.processWithAI("analyze", message.text);
                            this.panel?.webview.postMessage({ 
                                type: "response", 
                                content: response,
                                isError: false 
                            });
                        } catch (error) {
                            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                            this.panel?.webview.postMessage({
                                type: "response",
                                content: `Error: ${errorMessage}`,
                                isError: true
                            });
                        }
                        break;
                    }
                    default:
                        console.warn(`Unknown command: ${message.command}`);
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    private getWebviewContent(htmlUri: vscode.Uri): string {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Debug Bot</title>
    <base href="${htmlUri.toString()}">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
        }
        #chat-container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        #messages {
            flex-grow: 1;
            overflow-y: auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .message {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 5px;
        }
        .user-message {
            background-color: #e6f2ff;
            text-align: right;
        }
        .bot-message {
            background-color: #f0f0f0;
            text-align: left;
        }
        .input-container {
            display: flex;
            padding: 20px;
            background-color: white;
            border-top: 1px solid #eee;
        }
        #userInput {
            flex-grow: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin-right: 10px;
        }
        #sendButton {
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .loading {
            text-align: center;
            color: #666;
            padding: 10px;
        }
    </style>
</head>
<body>
    <div id="chat-container">
        <div id="messages"></div>
        <div class="input-container">
            <input type="text" id="userInput" placeholder="Ask about your code...">
            <button id="sendButton">Send</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const messagesContainer = document.getElementById('messages');
        const userInput = document.getElementById('userInput');
        const sendButton = document.getElementById('sendButton');

        function addMessage(message, isUser = false, isError = false) {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message');
            messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
            
            if (isError) {
                messageDiv.classList.add('error');
                messageDiv.textContent = message;
            } else {
                messageDiv.textContent = message;
            }
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function sendMessage() {
            const text = userInput.value.trim();
            if (text) {
                addMessage(text, true);
                
                vscode.postMessage({
                    command: 'analyze',
                    text: text
                });
                
                userInput.value = '';
            }
        }

        sendButton.addEventListener('click', sendMessage);

        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'response') {
                addMessage(message.content, false, message.isError);
            }
        });
    </script>
</body>
</html>`;
    }

    private async processWithAI(command: string, content: string): Promise<string> {
        try {
            switch (command) {
                case "analyze": {
                    const response = await axios.post(`${this.API_URL}/code/analyze`, { 
                        code: content, 
                        context: null 
                    });
                    
                    return response.data.content || 
                           response.data.analysis || 
                           'No analysis received';
                }
                case "debug": {
                    const response = await axios.post(`${this.API_URL}/debug/debug`, { code: content });
                    return response.data.debug || 'No debug information received';
                }
                case "refactor": {
                    const response = await axios.post(`${this.API_URL}/refactor/refactor`, { code: content });
                    return response.data.refactor || 'No refactoring suggestions received';
                }
                default:
                    return `Unknown command: ${command}`;
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                vscode.window.showErrorMessage(`API Error: ${error.message}`);
                return `Error communicating with API: ${error.message}`;
            }
            vscode.window.showErrorMessage('An unexpected error occurred');
            return 'An error occurred while processing your request';
        }
    }

    public async sendToChat(command: string, content: string): Promise<void> {
        try {
            const response = await this.processWithAI(command, content);
            
            if (this.panel) {
                this.panel.webview.postMessage({
                    type: "response",
                    content: response,
                    isError: false
                });
            }
        } catch (error) {
            if (this.panel) {
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                this.panel.webview.postMessage({
                    type: "response",
                    content: `Error: ${errorMessage}`,
                    isError: true
                });
            }
        }
    }

    public dispose(): void {
        if (this.panel) {
            this.panel.dispose();
        }
    }
}