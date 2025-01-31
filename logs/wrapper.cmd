@echo off
set PROMPT=$G
echo Terminal started > "c:\Users\ishita.porwal\Desktop\vscode-api-debug-bot\api-debug-bot\logs\temp_output.log"
cmd.exe /k "for /f "tokens=*" %i in ('more') do (echo %i >> "c:\Users\ishita.porwal\Desktop\vscode-api-debug-bot\api-debug-bot\logs\temp_output.log")"