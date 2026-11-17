#!/bin/bash
# Bismillah
#
# winpc-window.sh - v1
# Opens a program with a real window on winpc (the Windows computer of the user, `ssh winpc`) in the session of the
# user, and brings back a picture of only that window and a short log (the window, its place, the middle of the
# screen, whether its browser left a window behind). WHY: a program started over SSH has no desktop, so a real window
# (an Edge app window, later WebView2) can only be seen through a scheduled task in the session of the user.
#
# Usage (from the root of the repository; the program must close itself, Ex: after(8000) { close }):
#   _ai-tools/winpc-window.sh --title "probe" --out <scratchpad>/window.png \
#       --dir 'C:\Users\Gaming\claude\ozdenui-ruby' --exe 'C:\Ruby40-x64\bin\ruby.exe' --args '-Ilib examples\counter.rb'
#   --title   a part of the title of the window to find (the program sets it)
#   --wait    seconds after the window is found, before the picture (default 2.5)
#   --env     NAME=value for the program (more than one: --env twice)
# Before a picture of a browser window: say so to the user (a window opens on the screen of winpc for a few seconds).
# The picture holds only the window, never the whole screen. Nothing is left on winpc: the task is removed.
#
# Started Date: November 2026
# Webpage: https://bug7a.github.io/js-components/
#
# Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
# Licensed under the Apache License, Version 2.0
# SPDX-License-Identifier: Apache-2.0

set -e
TITLE=""; OUT=""; DIR=""; EXE=""; ARGS=""; WAIT="2.5"; ENVS=""
while [ $# -gt 0 ]; do
    case "$1" in
        --title) TITLE="$2"; shift 2 ;;
        --out) OUT="$2"; shift 2 ;;
        --dir) DIR="$2"; shift 2 ;;
        --exe) EXE="$2"; shift 2 ;;
        --args) ARGS="$2"; shift 2 ;;
        --wait) WAIT="$2"; shift 2 ;;
        --env) ENVS="$ENVS$2"$'\n'; shift 2 ;;
        *) echo "unknown option: $1 (see the top of $0)" >&2; exit 2 ;;
    esac
done
if [ -z "$TITLE" ] || [ -z "$OUT" ] || [ -z "$DIR" ] || [ -z "$EXE" ]; then
    echo "needs --title, --out, --dir and --exe (see the top of $0)" >&2
    exit 2
fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
REMOTE='claude\winpc-window'

# The settings of this run, read by the script on winpc
{
    echo "title=$TITLE"; echo "dir=$DIR"; echo "exe=$EXE"; echo "args=$ARGS"; echo "wait=$WAIT"
    printf '%s' "$ENVS" | sed '/^$/d; s/^/env=/'
} > "$WORK/settings.txt"

cat > "$WORK/window.ps1" <<'PS1'
# Bismillah
# Runs in the session of the user (a scheduled task): starts the program, takes a picture of its window only.
$ErrorActionPreference = "Continue"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$log = "$here\window.log"
"start $(Get-Date -Format o)" | Out-File $log -Encoding utf8
$settings = @{}; $envs = @()
Get-Content "$here\settings.txt" -Encoding utf8 | ForEach-Object {
    $name, $value = $_ -split "=", 2
    if ($name -eq "env") { $envs += $value } else { $settings[$name] = $value }
}
foreach ($pair in $envs) { $n, $v = $pair -split "=", 2; Set-Item -Path "env:$n" -Value $v }
Add-Type -AssemblyName System.Drawing, System.Windows.Forms
Add-Type @"
using System; using System.Runtime.InteropServices;
public class WinpcWindow { [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
 [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out Box r);
 [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
 public struct Box { public int Left, Top, Right, Bottom; } }
"@
[WinpcWindow]::SetProcessDPIAware() | Out-Null
$startArgs = @{ FilePath = $settings.exe; WorkingDirectory = $settings.dir; PassThru = $true; WindowStyle = "Hidden";
    RedirectStandardOutput = "$here\out.txt"; RedirectStandardError = "$here\err.txt" }
if ($settings.args) { $startArgs.ArgumentList = $settings.args }
$program = Start-Process @startArgs
$window = $null
for ($i = 0; $i -lt 80 -and -not $window; $i++) {
    Start-Sleep -Milliseconds 250
    $window = Get-Process | Where-Object { $_.MainWindowTitle -like "*$($settings.title)*" } | Select-Object -First 1
}
if (-not $window) { "no window with the title '$($settings.title)' in 20 s" | Out-File $log -Append -Encoding utf8 } else {
    "window: $($window.ProcessName) '$($window.MainWindowTitle)' after $($i * 250) ms" | Out-File $log -Append -Encoding utf8
    Start-Sleep -Milliseconds ([int]([double]$settings.wait * 1000))
    [WinpcWindow]::SetForegroundWindow($window.MainWindowHandle) | Out-Null
    Start-Sleep -Milliseconds 400
    $r = New-Object WinpcWindow+Box
    [WinpcWindow]::GetWindowRect($window.MainWindowHandle, [ref]$r) | Out-Null
    $w = $r.Right - $r.Left; $h = $r.Bottom - $r.Top
    $area = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
    "place: $($r.Left),$($r.Top), size $w x $h; its middle $($r.Left + $w / 2),$($r.Top + $h / 2); the middle of the screen $($area.Width / 2),$($area.Height / 2)" | Out-File $log -Append -Encoding utf8
    $bitmap = New-Object System.Drawing.Bitmap $w, $h
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($r.Left, $r.Top, 0, 0, $bitmap.Size)
    $bitmap.Save("$here\window.png")
    $graphics.Dispose(); $bitmap.Dispose()
}
$program.WaitForExit(30000) | Out-Null
"program ended: $($program.HasExited)" | Out-File $log -Append -Encoding utf8
"windows left with that title: $(@(Get-Process | Where-Object { $_.MainWindowTitle -like "*$($settings.title)*" }).Count)" | Out-File $log -Append -Encoding utf8
"done" | Out-File $log -Append -Encoding utf8
PS1

ssh -o BatchMode=yes winpc "New-Item -ItemType Directory -Force -Path \"\$env:USERPROFILE\\$REMOTE\" | Out-Null; Remove-Item \"\$env:USERPROFILE\\$REMOTE\\*\" -ErrorAction SilentlyContinue" 2>&1 | grep -v '^\*\*' || true
scp -q "$WORK/window.ps1" "$WORK/settings.txt" "winpc:$(echo "$REMOTE" | tr '\\' '/')/"
# WHY Interactive: the task runs in the session of the user that is open on the screen, so the window is seen
ssh -o BatchMode=yes winpc '
$d = "$env:USERPROFILE\'"$REMOTE"'"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$d\window.ps1`""
$user = (Get-CimInstance Win32_ComputerSystem).UserName
if (-not $user) { "nobody is signed in on the screen of winpc: no window can be seen"; exit 1 }
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive
Register-ScheduledTask -TaskName "ClaudeWindow" -Action $action -Principal $principal -Force | Out-Null
Start-ScheduledTask -TaskName "ClaudeWindow"
for ($i = 0; $i -lt 90; $i++) { Start-Sleep 1; if ((Test-Path "$d\window.log") -and (Select-String -Path "$d\window.log" -Pattern "^done" -Quiet)) { break } }
Unregister-ScheduledTask -TaskName "ClaudeWindow" -Confirm:$false
Get-Content "$d\window.log"
if ((Test-Path "$d\err.txt") -and (Get-Item "$d\err.txt").Length -gt 0) { "--- the errors of the program:"; Get-Content "$d\err.txt" | Select-Object -Last 15 }
' 2>&1 | grep -v '^\*\*'
if scp -q "winpc:$(echo "$REMOTE" | tr '\\' '/')/window.png" "$OUT" 2>/dev/null; then echo "picture: $OUT"; else echo "no picture"; fi
