// import * as vscode from "vscode";
// import axios from "axios";
// import * as path from "path";
// import * as fs from "fs";
// import type { TerminalManager } from "./terminalManager";
// import type { DocumentManager } from "./documentManager";

// export class ChatProvider {
//   private panel: vscode.WebviewPanel | undefined;
//   private readonly API_URL = "http://localhost:8000/api/v1";
//   private context: vscode.ExtensionContext;
//   private lastCommand: string = ''; // Track the last command type
//   private lastContent: string = ''; // Track the last code/error content

//   constructor(
//     context: vscode.ExtensionContext,
//     private terminalManager: TerminalManager,
//     private documentManager: DocumentManager,
//   ) {
//     this.context = context;
//     this.initializeWebview();
//   }


//     private initializeWebview(): void {
//         this.panel = vscode.window.createWebviewPanel(
//             "api-debug-bot",
//             "API Debug Bot",
//             vscode.ViewColumn.Two,
//             {
//                 enableScripts: true,
//                 localResourceRoots: [
//                     vscode.Uri.file(path.join(this.context.extensionPath, 'webview'))
//                 ]
//             }
//         );

//         // Get the path to the chat.html file
//         const htmlPath = vscode.Uri.file(
//             path.join(this.context.extensionPath, 'webview', 'chat.html')
//         );

//         // Convert the path to a webview URI
//         const htmlUri = this.panel.webview.asWebviewUri(htmlPath);

//         // Read the HTML file content
//         const htmlContent = this.getWebviewContent(htmlUri);
//         this.panel.webview.html = htmlContent;

        
//         // Set up message handling
//         this.panel.webview.onDidReceiveMessage(
//             async (message) => {
//                 switch (message.command) {
//                     case "analyze": 
//                     case "debug":
//                     case "refactor": {
//                         try {
//                             const response = await this.processWithAI(message.command, message.text);
//                             this.panel?.webview.postMessage({ 
//                                 type: "response", 
//                                 content: response,
//                                 isError: false 
//                             });
//                         } catch (error) {
//                             const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
//                             this.panel?.webview.postMessage({
//                                 type: "response",
//                                 content: `Error: ${errorMessage}`,
//                                 isError: true
//                             });
//                         }
//                         break;
//                     }
//                     default:
//                         console.warn(`Unknown command: ${message.command}`);
//                 }
//             },
//             undefined,
//             this.context.subscriptions
//         );

//     }

//     private getWebviewContent(htmlUri: vscode.Uri): string {
//         return `<!DOCTYPE html>
//     <html>
//     <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>API Debug Bot</title>
//         <base href="${htmlUri.toString()}">
//         <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
//         <style>
//             body {
//             font-family: Arial, sans-serif;
//             margin: 0;
//             padding: 20px;
//             background-color: #f4f4f4;
//         }
//         #chat-container {
//             max-width: 800px;
//             margin: 0 auto;
//             background-color: white;
//             border-radius: 8px;
//             box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//             display: flex;
//             flex-direction: column;
//             height: 100vh;
//         }
//         #messages {
//             flex-grow: 1;
//             overflow-y: auto;
//             padding: 20px;
//             background-color: #f9f9f9;
//             color: #000; /* Changed from rgba to full black */
//         }
//         .message {
//             margin-bottom: 15px;
//             padding: 10px;
//             border-radius: 5px;
//             line-height: 1.6;
//             color: #333; /* Added default text color */
//         }
//         .user-message {
//             background-color: rgb(166, 209, 255);
//             text-align: right;
//         }
//         .bot-message {
//             background-color: #f0f0f0;
//             text-align: left;
//             color: #000; /* Changed from rgba to full black */
//         }
//         .error {
//             color: #d9534f;
//             background-color: #ffecec !important;
//         }
//         .input-container {
//             display: flex;
//             padding: 20px;
//             background-color: white;
//             border-top: 1px solid #eee;
//         }
//         #userInput {
//             flex-grow: 1;
//             padding: 10px;
//             border: 1px solid #ddd;
//             border-radius: 4px;
//             margin-right: 10px;
//         }
//         #sendButton {
//             padding: 10px 20px;
//             background-color: #007bff;
//             color: white;
//             border: none;
//             border-radius: 4px;
//             cursor: pointer;
//         }
//         .loading {
//             text-align: center;
//             color: #666;
//             padding: 10px;
//         }

//         /* Enhanced Markdown code highlighting */
//         .message code {
//             background-color: #f0f0f0;
//             padding: 2px 4px;
//             border-radius: 3px;
//             font-family: 'Courier New', Courier, monospace;
//             font-size: 0.9em;
//             color: #d14;
//             border: 1px solid #e1e1e8;
//         }
//         .message pre {
//             background-color: #f8f8f8;
//             padding: 10px;
//             border-radius: 5px;
//             overflow-x: auto;
//             max-width: 100%;
//             white-space: pre-wrap;
//             word-wrap: break-word;
//             border: 1px solid #e1e1e8;
//             color: #333;
//         }
//         .message pre code {
//             background-color: transparent;
//             padding: 0;
//             border: none;
//             color: #333;
//         }
//         .message h1, .message h2, .message h3 {
//             margin-top: 10px;
//             margin-bottom: 10px;
//             color: #333;
//         }
//         .message ul, .message ol {
//             padding-left: 20px;
//             margin-bottom: 10px;
//         }
//         .message a {
//             color: #007bff;
//             text-decoration: none;
//         }
//         .message a:hover {
//             text-decoration: underline;
//         }
//     </style>
// </head>
// <body>
//     <div id="chat-container">
//         <div id="messages"></div>
//         <div class="input-container">
//             <select id="actionSelector">
//                     <option value="analyze">Explain Code</option>
//                     <option value="debug">Debug Code</option>
//                     <option value="refactor">Refactor Code</option>
//             </select>
//             <input type="text" id="userInput" placeholder="Ask about your code...">
//             <button id="sendButton">Send</button>
//         </div>
//     </div>

//     <script>
//         marked.setOptions({
//             breaks: true,
//             gfm: true,
//             highlight: function(code, lang) {
//                 return ;
//             }
//         });

//         const vscode = acquireVsCodeApi();
//         const messagesContainer = document.getElementById('messages');
//         const userInput = document.getElementById('userInput');
//         const sendButton = document.getElementById('sendButton');
//         const actionSelector = document.getElementById('actionSelector');

//         function addMessage(message, isUser = false, isError = false) {
//             const messageDiv = document.createElement('div');
//             messageDiv.classList.add('message');
//             messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
            
//             if (isError) {
//                 messageDiv.classList.add('error');
//                 messageDiv.textContent = message;
//             } else {
//                 // Use marked to render Markdown
//                 messageDiv.innerHTML = marked.parse(message);
//             }
            
//             messagesContainer.appendChild(messageDiv);
//             messagesContainer.scrollTop = messagesContainer.scrollHeight;
//         }

//         function sendMessage() {
//             const text = userInput.value.trim();
//             if (text) {
//                 addMessage(text, true);
                
//                 vscode.postMessage({
//                     command: actionSelector.value,
//                     text: text
//                 });
                
//                 console.log("dgshdgshdgsdusgdshdgs",userInput.value);
//                 userInput.value='';
//             }
//         }

//         sendButton.addEventListener('click', sendMessage);

//         userInput.addEventListener('keypress', (e) => {
//             if (e.key === 'Enter') {
//                 sendMessage();
//             }
//         });

//         window.addEventListener('message', event => {
//             const message = event.data;
//             if (message.type === 'response') {
//                 addMessage(message.content, false, message.isError);
//             }
//             else if(message.type=='error'){
//                 addMessage(message.content, false, true);
//             }
//         });
//     </script>
// </body>
// </html>`;
//     }

//     private async processWithAI(command: string, content: string, isFollowUp: boolean = false): Promise<string> {
//         try {
//             const activeEditor = vscode.window.activeTextEditor;
//             const activeFileContent = activeEditor ? activeEditor.document.getText() : null;
//             const activeFilePath = activeEditor ? activeEditor.document.fileName : null;
            
//             const contextData = {
//                 activeFileContent,
//                 activeFilePath,
//                 workspace: vscode.workspace.name
//             };

//             if (isFollowUp) {
//                 const response = await axios.post(`${this.API_URL}/chat/follow-up`, {
//                   previous_command: this.lastCommand,
//                   previous_content: this.lastContent,
//                   user_prompt: content,
//                   context: contextData
//                 });
//                 return response.data.content || "No response received";
//       }
//           this.lastCommand = command;
//           this.lastContent = content;

//           switch (command) {
//             case "analyze": {
//                 console.log("code to analyze:111111111111111111111",);
//               const response = await axios.post(`${this.API_URL}/code/analyze`, {
//                 code: content,
//                 context: activeFileContent,
//                 user_prompt: content  
//                 });
//               console.log("userrrr promptttttt44444444444444444444444444:", content);  
//                 //   return response.data || response.data || "No analysis received";
//                 // Format the analysis response similar to debug
//                 let formattedResponse = "### Code Analysis\n\n";
                
//                 // Add the code being analyzed
//                 formattedResponse += "#### Code:\n```\n" + content + "\n```\n\n";
                
//                 // Add analysis
//                 if (response.data.analysis || response.data.content) {
//                     formattedResponse += "#### Analysis:\n" + (response.data.analysis || response.data.content) + "\n\n";
//                 }

//                 // Add any additional insights if present
//                 if (response.data.suggestions) {
//                     formattedResponse += "#### Suggestions:\n";
//                     response.data.suggestions.forEach((suggestion: string) => {
//                         formattedResponse += `- ${suggestion}\n`;
//                     });
//                     formattedResponse += "\n";
//                 }

//                 return formattedResponse || "No analysis received";
//             }
//             case "debug": {
//                 try {
//                     console.log("Terminal logs to analyze:", content);
//                     console.log("context data 1111111111111111111",contextData);
//                     const response = await axios.post(`${this.API_URL}/debug/debug`, {
//                         logs: content,
//                         type: "terminal_logs",
//                         format: "text",
//                         context: activeFileContent,
//                         user_prompt: content
//                     });

//                     console.log("AI Response:", response.data);

//                     // Format the debug response for chat display
//                     let formattedResponse = "### Debug Analysis\n\n";

//                     // Add error logs if present
//                     if (content) {
//                         formattedResponse += "#### Error Logs:\n```\n" + content + "\n```\n\n";
//                     }

//                     // Add analysis if present
//                     if (response.data.analysis) {
//                         formattedResponse += "#### Analysis:\n" + response.data.analysis + "\n\n";
//                     }

//                     // Add suggestions if present
//                     if (response.data.suggestions && response.data.suggestions.length > 0) {
//                         formattedResponse += "#### Suggestions:\n";
//                         response.data.suggestions.forEach((suggestion: string) => {
//                             formattedResponse += `- ${suggestion}\n`;
//                         });
//                         formattedResponse += "\n";
//                     }

//                     // Add code snippets if present
//                     if (response.data.code_snippets && response.data.code_snippets.length > 0) {
//                         formattedResponse += "#### Code Solutions:\n";
//                         response.data.code_snippets.forEach((snippet: any) => {
//                             formattedResponse += "```typescript\n" + snippet.code + "\n```\n\n";
//                         });
//                     }

//                     return formattedResponse || "No debug information received";
//                 } catch (error) {
//                     console.error("Debug analysis error:", error);
//                     throw error;
//                 }
//             }
//             case "refactor": {
//               const response = await axios.post(`${this.API_URL}/refactor/refactor`, { code: content });
//               return response.data.refactor || "No refactoring suggestions received";
//             }
//             default:
//               return `Unknown command: ${command}`;
//           }
//         } catch (error) {
//           if (axios.isAxiosError(error)) {
//             vscode.window.showErrorMessage(`API Error: ${error.message}`);
//             return `Error communicating with API: ${error.message}`;
//           }
//           vscode.window.showErrorMessage("An unexpected error occurred");
//           return "An error occurred while processing your request";
//         }
//       }
    
//       public async sendToChat(command: string, content: string): Promise<void> {
//         try {
//           const response = await this.processWithAI(command, content);
    
//           if (this.panel) {
//             this.panel.webview.postMessage({
//               type: "response",
//               content: response,
//               isError: false,
//             });
//           }
//         } catch (error) {
//           if (this.panel) {
//             const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
//             this.panel.webview.postMessage({
//               type: "response",
//               content: `Error: ${errorMessage}`,
//               isError: true,
//             });
//           }
//         }
//       }
    
//       async getSolution(errorText: string): Promise<any> {
//         try {
//             const response = await axios.post(`${this.API_URL}/debug/debug`, {
//                 logs: errorText,
//                 type: "error_logs",
//                 format: "text",
//                 context: "",
//             });
//             console.log("111111111111111111111111111",response);
//             // Return the complete response data object
//             return {
//                 suggestions: response.data.suggestions || [],
//                 code_snippets: response.data.code_snippets || [],
//                 analysis: response.data.analysis || "No detailed analysis available"
//             };
//         } catch (error) {
//             console.error("Error getting solution:", error);
//             throw error;
//         }
//     }

//       public dispose(): void {
//         if (this.panel) {
//           this.panel.dispose();
//         }
//       }
//     }
    







// tryiing that chat part:

import * as vscode from "vscode";
import axios from "axios";
import * as path from "path";
import * as fs from "fs";
import type { TerminalManager } from "./terminalManager";
import type { DocumentManager } from "./documentManager";

export class ChatProvider {
  private panel: vscode.WebviewPanel | undefined;
  private readonly API_URL = "http://localhost:8000/api/v1";
  private context: vscode.ExtensionContext;
  private lastCommand: string = ''; // Track the last command type
  private lastContent: string = ''; // Track the last code/error content

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
                try {
                    let response;
                    const text = message.text;
                    const command = message.command;
                    const isUserPrompt = message.isUserPrompt === true;
                    console.log("Received message:", { command, text, isUserPrompt });
                    // If it's a user prompt, use the same endpoint as the original command
                    if (isUserPrompt && this.lastCommand) {
                        console.log("Processing user prompt:", message.text);
                        response = await this.processWithAI(this.lastCommand, message.text, true);
                    } else {
                        console.log("Processing command:", message.command);
                        this.lastCommand = message.command;
                        response = await this.processWithAI(message.command, message.text, false);
                    }
    
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
                    <option value="refactor">Refactor Code</option>
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
        try {
            const activeEditor = vscode.window.activeTextEditor;
            const activeFileContent = activeEditor ? activeEditor.document.getText() : null;
            const activeFilePath = activeEditor ? activeEditor.document.fileName : null;
            
            const contextData = {
                activeFileContent,
                activeFilePath,
                workspace: vscode.workspace.name
            };
            console.log("content from other function 1111111111",content);

            // const payload = {
            //     context: activeFileContent,
            //     user_prompt: content
            // };
            let payload: any;
            payload={
                context: activeFileContent,
                user_prompt: content,
            };

            if (isUserPrompt) {
                payload = {
                    ...payload,
                    previous_content: this.lastContent,  // Include the previous code/content
                    previous_command: this.lastCommand,  // Include the previous command type
                    is_follow_up: true
                };
            } else {
                // If it's a new command, store the content for future reference
                this.lastContent = content;
                this.lastCommand = command;
            }

            switch (command) {
                case "analyze":
                    payload["code"] = isUserPrompt ? this.lastContent : content;
                    break;
                case "debug":
                    payload["logs"] = isUserPrompt ? this.lastContent : content;
                    payload["code"] = isUserPrompt ? this.lastContent : content;
                    payload["type"] = "terminal_logs";
                    payload["format"] = "text";
                   
                    break;
                case "refactor":
                    payload["code"] = isUserPrompt ? this.lastContent : content;
                    break;
            }

            if (!isUserPrompt) {
                this.lastContent = content;
            }
        //   this.lastCommand = command;
        //   this.lastContent = content;
             
        const response = await axios.post(`${this.API_URL}/${command}`, payload);
        // Format the response based on the command
        let formattedResponse = "";
        switch (command) {
            case "analyze":
                formattedResponse = this.formatAnalyzeResponse(response.data, content);
                break;
            case "debug":
                formattedResponse = this.formatDebugResponse(response.data, content);
                break;
            case "refactor":
                formattedResponse = response.data.refactor || "No refactoring suggestions received";
                break;
        }

        return formattedResponse;
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}

// Helper methods to format responses
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
    //       switch (command) {
    //         case "analyze": {
    //             console.log("code to analyze:111111111111111111111",);
    //           const response = await axios.post(`${this.API_URL}/code/analyze`, {
    //             code: content,
    //             context: activeFileContent,
    //             user_prompt: content  
    //             });
    //           console.log("userrrr promptttttt44444444444444444444444444:", content);  
    //             //   return response.data || response.data || "No analysis received";
    //             // Format the analysis response similar to debug
    //             let formattedResponse = "### Code Analysis\n\n";
                
    //             // Add the code being analyzed
    //             formattedResponse += "#### Code:\n```\n" + content + "\n```\n\n";
                
    //             // Add analysis
    //             if (response.data.analysis || response.data.content) {
    //                 formattedResponse += "#### Analysis:\n" + (response.data.analysis || response.data.content) + "\n\n";
    //             }

    //             // Add any additional insights if present
    //             if (response.data.suggestions) {
    //                 formattedResponse += "#### Suggestions:\n";
    //                 response.data.suggestions.forEach((suggestion: string) => {
    //                     formattedResponse += `- ${suggestion}\n`;
    //                 });
    //                 formattedResponse += "\n";
    //             }

    //             return formattedResponse || "No analysis received";
    //         }
    //         case "debug": {
    //             try {
    //                 console.log("Terminal logs to analyze:", content);
    //                 console.log("context data 1111111111111111111",contextData);
    //                 const response = await axios.post(`${this.API_URL}/debug/debug`, {
    //                     logs: content,
    //                     type: "terminal_logs",
    //                     format: "text",
    //                     context: activeFileContent,
    //                     user_prompt: content
    //                 });

    //                 console.log("AI Response:", response.data);

    //                 // Format the debug response for chat display
    //                 let formattedResponse = "### Debug Analysis\n\n";

    //                 // Add error logs if present
    //                 if (content) {
    //                     formattedResponse += "#### Error Logs:\n```\n" + content + "\n```\n\n";
    //                 }

    //                 // Add analysis if present
    //                 if (response.data.analysis) {
    //                     formattedResponse += "#### Analysis:\n" + response.data.analysis + "\n\n";
    //                 }

    //                 // Add suggestions if present
    //                 if (response.data.suggestions && response.data.suggestions.length > 0) {
    //                     formattedResponse += "#### Suggestions:\n";
    //                     response.data.suggestions.forEach((suggestion: string) => {
    //                         formattedResponse += `- ${suggestion}\n`;
    //                     });
    //                     formattedResponse += "\n";
    //                 }

    //                 // Add code snippets if present
    //                 if (response.data.code_snippets && response.data.code_snippets.length > 0) {
    //                     formattedResponse += "#### Code Solutions:\n";
    //                     response.data.code_snippets.forEach((snippet: any) => {
    //                         formattedResponse += "```typescript\n" + snippet.code + "\n```\n\n";
    //                     });
    //                 }

    //                 return formattedResponse || "No debug information received";
    //             } catch (error) {
    //                 console.error("Debug analysis error:", error);
    //                 throw error;
    //             }
    //         }
    //         case "refactor": {
    //           const response = await axios.post(`${this.API_URL}/refactor/refactor`, { code: content });
    //           return response.data.refactor || "No refactoring suggestions received";
    //         }
    //         default:
    //           return `Unknown command: ${command}`;
    //       }
    //     } catch (error) {
    //       if (axios.isAxiosError(error)) {
    //         vscode.window.showErrorMessage(`API Error: ${error.message}`);
    //         return `Error communicating with API: ${error.message}`;
    //       }
    //       vscode.window.showErrorMessage("An unexpected error occurred");
    //       return "An error occurred while processing your request";
    //     }
      }
    
        public async sendToChat(command: string, content: string): Promise<void> {
        try {
          const response = await this.processWithAI(command, content);
    
          if (this.panel) {
            this.panel.webview.postMessage({
              type: "response",
              content: response,
              isError: false,
            });
          }
        } catch (error) {
          if (this.panel) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            this.panel.webview.postMessage({
              type: "response",
              content: `Error: ${errorMessage}`,
              isError: true,
            });
          }
        }
      }
    
      async getSolution(errorText: string): Promise<any> {

        try {
            const activeEditor = vscode.window.activeTextEditor;
            const activeFileContent = activeEditor ? activeEditor.document.getText() : null;
            const response = await axios.post(`${this.API_URL}/debug`, {
                logs: errorText,
                type: "error_logs",
                format: "text",
                context: "",
                code : activeFileContent
            });
            console.log("111111111111111111111111111",response);
            // Return the complete response data object
            return {
                suggestions: response.data.suggestions || [],
                code_snippets: response.data.code_snippets || [],
                analysis: response.data.analysis || "No detailed analysis available"
            };
        } catch (error) {
            console.error("Error getting solution:", error);
            throw error;
        }
    }

      public dispose(): void {
        if (this.panel) {
          this.panel.dispose();
        }
      }
    }
    