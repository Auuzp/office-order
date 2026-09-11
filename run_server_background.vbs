Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\servi\OneDrive\Desktop\office order"
WshShell.Run "cmd.exe /c ""set PATH=C:\Program Files\nodejs;%PATH% && node server/index.js""", 0, False
