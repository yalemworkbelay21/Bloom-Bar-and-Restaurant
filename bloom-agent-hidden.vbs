Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir = "A:\Bloom Africa Inventory"

WshShell.CurrentDirectory = appDir
nodeExe = "C:\Program Files\nodejs\node.exe"
If Not fso.FileExists(nodeExe) Then
  nodeExe = "node"
End If

WshShell.Run """" & nodeExe & """ """ & appDir & "\bloom-agent.js""", 0, False
