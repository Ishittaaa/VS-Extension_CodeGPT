import * as vscode from "vscode";
import axios from 'axios';
import type { TerminalManager } from "./terminalManager";
import type { DocumentManager } from "./documentManager";

export class ChatProvider {
    private panel!: vscode.WebviewPanel;
    private readonly API_URL = 'http://localhost:8000/api/v1'; // Replace with your FastAPI URL

    constructor(
        private context: vscode.ExtensionContext,
        private terminalManager: TerminalManager,
        private documentManager: DocumentManager,
    ) {
        this.initializeWebview();
    }

    private initializeWebview() {
        this.panel = vscode.window.createWebviewPanel(
            "api-debug-bot",
            "API Debug Bot",
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
            }
        );

        this.panel.webview.html = this.getWebviewContent();

        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case "analyze":
                        const response = await this.processWithAI("analyze", message.text);
                        this.panel.webview.postMessage({ type: "response", content: response });
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    private async processWithAI(command: string, content: string): Promise<string> {
        try {
            switch (command) {
                case "analyze": {
                    const response = await axios.post(`${this.API_URL}/code/analyze`, { code: content });
                    return response.data.analysis || 'No analysis received';
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

    private getWebviewContent() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                    }
                    #chat-container {
                        display: flex;
                        flex-direction: column;
                        height: 100vh;
                    }
                    #messages {
                        flex-grow: 1;
                        overflow-y: auto;
                        margin-bottom: 20px;
                        padding: 10px;
                        border: 1px solid #ccc;
                    }
                    #userInput {
                        padding: 8px;
                        margin-right: 10px;
                        flex-grow: 1;
                    }
                    .input-container {
                        display: flex;
                        gap: 10px;
                    }
                    .loading {
                        display: none;
                        margin: 10px 0;
                        color: #666;
                    }
                    .error {
                        color: #ff0000;
                    }
                </style>
            </head>
            <body>
                <div id="chat-container">
                    <div id="messages"></div>
                    <div id="loading" class="loading">Processing request...</div>
                    <div class="input-container">
                        <input type="text" id="userInput" placeholder="Ask about your API...">
                        <button onclick="sendMessage()" id="sendButton">Send</button>
                    </div>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    const messagesContainer = document.getElementById('messages');
                    const userInput = document.getElementById('userInput');
                    const loading = document.getElementById('loading');
                    const sendButton = document.getElementById('sendButton');

                    function setLoading(isLoading) {
                        loading.style.display = isLoading ? 'block' : 'none';
                        sendButton.disabled = isLoading;
                        userInput.disabled = isLoading;
                    }

                    function sendMessage() {
                        const text = userInput.value;
                        if (text) {
                            setLoading(true);
                            addMessage('User: ' + text);
                            vscode.postMessage({
                                command: 'analyze',
                                text: text
                            });
                            userInput.value = '';
                        }
                    }

                    function addMessage(message, isError = false) {
                        const messageDiv = document.createElement('div');
                        messageDiv.textContent = message;
                        if (isError) {
                            messageDiv.classList.add('error');
                        }
                        messagesContainer.appendChild(messageDiv);
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }

                    window.addEventListener('message', event => {
                        const message = event.data;
                        setLoading(false);
                        if (message.type === 'response') {
                            addMessage('Bot: ' + message.content, message.isError);
                        }
                    });

                    userInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            sendMessage();
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }

    public async sendToChat(command: string, content: string) {
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

    public dispose() {
        if (this.panel) {
            this.panel.dispose();
        }
    }
}