# DeskLink Agent Provisioning Script
# This script ensures the agent is registered for auto-start and running in the background.

$AgentDir = "$HOME\.desklink"
$AgentExe = "$AgentDir\DeskLinkAgent.exe"
$RegistryPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$AppName = "DeskLinkAgent"

if (!(Test-Path $AgentDir)) {
    New-Item -ItemType Directory -Path $AgentDir -Force
}

Write-Output "[DeskLink] Registering agent for auto-start..."
Set-ItemProperty -Path $RegistryPath -Name $AppName -Value "$AgentExe"

Write-Output "[DeskLink] Provisioning complete. The agent will now start automatically with Windows."

# Optional: Start it now if it's not running
$Process = Get-Process -Name $AppName -ErrorAction SilentlyContinue
if (!$Process) {
    Write-Output "[DeskLink] Starting agent now..."
    Start-Process -FilePath $AgentExe -WindowStyle Hidden
} else {
    Write-Output "[DeskLink] Agent is already running."
}
