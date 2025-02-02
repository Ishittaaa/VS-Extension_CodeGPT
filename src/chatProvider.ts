import * as vscode from "vscode";
import axios from "axios";
import * as path from "path";
import * as fs from "fs";
import type { TerminalManager } from "./terminalManager";
import type { DocumentManager } from "./documentManager";

export class ChatProvider {
  private panel: vscode.WebviewPanel | undefined;
  private readonly API_URL = "http://localhost:8000/codepilot/v1";
  private context: vscode.ExtensionContext;
  private lastCommand: string = '';
  private lastContent: string = '';
  private lastResponse: any = null;
  private isProcessing: boolean = false;

  constructor(
    context: vscode.ExtensionContext,
    private terminalManager: TerminalManager,
    private documentManager: DocumentManager,
  ) {
    this.context = context;
    this.initializeWebview();
  }

  private initializeWebview(): void {
    this.panel = vscode.window.createWebviewPanel(
      "codepilot",
      "Code Pilot",
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(this.context.extensionPath, 'webview'))
        ]
      }
    );

    const htmlUri = this.panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(this.context.extensionPath, 'webview', 'chat.html'))
    );

    this.panel.webview.html = this.getWebviewContent(htmlUri);

    this.panel.webview.onDidReceiveMessage(async (message) => {
        if (this.isProcessing) return;
        
        try {
          this.isProcessing = true;
          const response = await this.processWithAI(message.command, message.text, message.isUserPrompt === true);
          
          this.panel?.webview.postMessage({
            type: "response",
            content: response,
            isError: false
          });
        } catch (error) {
          this.panel?.webview.postMessage({
            type: "response",
            content: `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`,
            isError: true
          });
        } finally {
          this.isProcessing = false;
        }
      });
    }


  private getWebviewContent(htmlUri: vscode.Uri): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Debug Bot</title>
    <base href="${htmlUri.toString()}">
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
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
        color: #000; /* Changed from rgba to full black */
    }
    .message {
        margin-bottom: 15px;
        padding: 10px;
        border-radius: 5px;
        line-height: 1.6;
        color: #333; /* Added default text color */
    }
    .user-message {
        background-color: rgb(166, 209, 255);
        text-align: right;
    }
    .bot-message {
        background-color: #f0f0f0;
        text-align: left;
        color: #000; /* Changed from rgba to full black */
    }
    .error {
        color: #d9534f;
        background-color: #ffecec !important;
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

    /* Enhanced Markdown code highlighting */
    .message code {
        background-color: #f0f0f0;
        padding: 2px 4px;
        border-radius: 3px;
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.9em;
        color: #d14;
        border: 1px solid #e1e1e8;
    }
    .message pre {
        background-color: #f8f8f8;
        padding: 10px;
        border-radius: 5px;
        overflow-x: auto;
        max-width: 100%;
        white-space: pre-wrap;
        word-wrap: break-word;
        border: 1px solid #e1e1e8;
        color: #333;
    }
    .message pre code {
        background-color: transparent;
        padding: 0;
        border: none;
        color: #333;
    }
    .message h1, .message h2, .message h3 {
        margin-top: 10px;
        margin-bottom: 10px;
        color: #333;
    }
    .message ul, .message ol {
        padding-left: 20px;
        margin-bottom: 10px;
    }
    .message a {
        color: #007bff;
        text-decoration: none;
    }
    .message a:hover {
        text-decoration: underline;
    }
</style>
</head>
<body>
<div id="chat-container">
    <div id="messages"></div>
    <div class="input-container">
        <select id="actionSelector">
                <option value="analyze">Explain Code</option>
                <option value="debug">Debug Code</option>
        </select>
        <input type="text" id="userInput" placeholder="Ask about your code...">
        <button id="sendButton">Send</button>
    </div>
</div>

<script>
    marked.setOptions({
        breaks: true,
        gfm: true,
        highlight: function(code, lang) {
            return ;
        }
    });

    const vscode = acquireVsCodeApi();
    const messagesContainer = document.getElementById('messages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const actionSelector = document.getElementById('actionSelector');

    function addMessage(message, isUser = false, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
        
        if (isError) {
            messageDiv.classList.add('error');
            messageDiv.textContent = message;
        } else {
            // Use marked to render Markdown
            messageDiv.innerHTML = marked.parse(message);
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function sendMessage() {
        const text = userInput.value.trim();
        if (text) {
            addMessage(text, true);
            const isUserPrompt = messagesContainer.children.length > 0;
            vscode.postMessage({
                command: actionSelector.value,
                text: text,
                isUserPrompt:isUserPrompt
            });
            
            console.log("dgshdgshdgsdusgdshdgs",userInput.value);
            userInput.value='';
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
        console.log("Received message from extension:", message);
        if (message.type === 'response') {
            addMessage(message.content, false, message.isError);
        }
        else if(message.type=='error'){
            addMessage(message.content, false, true);
        }
    });
</script>
</body>
</html>`;
}

private async processWithAI(command: string, content: string, isUserPrompt: boolean = false): Promise<string> {
    if (!isUserPrompt && this.lastResponse && this.lastCommand === command && this.lastContent === content) {
      return this.formatResponseByCommand(command, this.lastResponse, content);
    }

    const activeEditor = vscode.window.activeTextEditor;
    const payload = {
      context: activeEditor?.document.getText() || null,
      user_prompt: content,
      previous_content: isUserPrompt ? this.lastContent : undefined,
      previous_command: isUserPrompt ? this.lastCommand : undefined,
      is_follow_up: isUserPrompt,
      code: isUserPrompt ? this.lastContent : content,
      logs: command === "debug" ? content : undefined,
      type: command === "debug" ? "terminal_logs" : undefined,
      format: command === "debug" ? "text" : undefined
    };

    console.log('Sending payload:', payload);
    const response = await axios.post(`${this.API_URL}/${command}`, payload);
    
    this.lastResponse = response.data;
    this.lastCommand = command;
    this.lastContent = content;

    return this.formatResponseByCommand(command, response.data, content);
  }


  private formatAnalyzeResponse(data: any, content: string): string {
    let formattedResponse = "### Code Analysis\n\n";
    if (!data.isUserPrompt) {
      formattedResponse += "#### Code:\n```\n" + content + "\n```\n\n";
    }
    
    if (data.analysis || data.content) {
      formattedResponse += "#### Analysis:\n" + (data.analysis || data.content) + "\n\n";
    }

    if (data.suggestions) {
      formattedResponse += "#### Suggestions:\n";
      data.suggestions.forEach((suggestion: string) => {
        formattedResponse += `- ${suggestion}\n`;
      });
      formattedResponse += "\n";
    }

    return formattedResponse;
  }

  private formatDebugResponse(data: any, content: string): string {
    let formattedResponse = "### Debug Analysis\n\n";
    if (!data.isUserPrompt) {
      formattedResponse += "#### Error Logs:\n```\n" + content + "\n```\n\n";
    }

    if (data.analysis) {
      formattedResponse += "#### Analysis:\n" + data.analysis + "\n\n";
    }

    if (data.suggestions) {
      formattedResponse += "#### Suggestions:\n";
      data.suggestions.forEach((suggestion: string) => {
        formattedResponse += `- ${suggestion}\n`;
      });
      formattedResponse += "\n";
    }

    if (data.code_snippets) {
      formattedResponse += "#### Code Solutions:\n";
      data.code_snippets.forEach((snippet: any) => {
        formattedResponse += "```typescript\n" + snippet.code + "\n```\n\n";
      });
    }

    return formattedResponse;
  }


  public async sendToChat(command: string, content: string): Promise<void> {
    if (this.isProcessing) return;
    
    try {
      this.isProcessing = true;
      const response = await this.processWithAI(command, content);
      this.panel?.webview.postMessage({
        type: "response",
        content: response,
        isError: false
      });
    } finally {
      this.isProcessing = false;
    }
  }

  private formatResponseByCommand(command: string, data: any, content: string): string {
    switch (command) {
      case "analyze":
        return this.formatAnalyzeResponse(data, content);
      case "debug":
        return this.formatDebugResponse(data, content);
      default:
        return "Unknown command";
    }
  }

  

  public dispose(): void {
    this.panel?.dispose();
  }
}