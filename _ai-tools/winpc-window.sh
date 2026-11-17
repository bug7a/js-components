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
#   --keys    keys typed into the window before the picture (SendKeys: {ENTER}, {TAB}, ^a = Ctrl+A; + ^ % ~ ( ) { }
#             are special: {+}). --keys-after: after the picture (Ex: {ENTER} that closes a dialog).
#   --no-hide the program is started as it is, not hidden: a program whose own window is the window (WebView2 of
#             OzdenUI for Go). WHY: a hidden start hides the first window of the program too; it is there so the
#             console of a script (ruby.exe) does not show. Build such a program with -ldflags -H=windowsgui.
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
TITLE=""; OUT=""; DIR=""; EXE=""; ARGS=""; WAIT="2.5"; ENVS=""; HIDE="1"; KEYS=""; KEYS_AFTER=""
while [ $# -gt 0 ]; do
    case "$1" in
        --title) TITLE="$2"; shift 2 ;;
        --out) OUT="$2"; shift 2 ;;
        --dir) DIR="$2"; shift 2 ;;
        --exe) EXE="$2"; shift 2 ;;
        --args) ARGS="$2"; shift 2 ;;
        --wait) WAIT="$2"; shift 2 ;;
        --env) ENVS="$ENVS$2"$'\n'; shift 2 ;;
        --no-hide) HIDE="0"; shift ;;
        --keys) KEYS="$2"; shift 2 ;;
        --keys-after) KEYS_AFTER="$2"; shift 2 ;;
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
    echo "title=$TITLE"; echo "dir=$DIR"; echo "exe=$EXE"; echo "args=$ARGS"; echo "wait=$WAIT"; echo "hide=$HIDE"; echo "keys=$KEYS"; echo "keysafter=$KEYS_AFTER"
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
 [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc f, IntPtr p);
 [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
 [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr h, System.Text.StringBuilder s, int n);
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint id);
 delegate bool EnumProc(IntPtr h, IntPtr p);
 public static IntPtr Found; public static string FoundTitle;
 // WHY every window and not the main window of a process: a dialog of a program is not the main window of its process
 public static int Find(string part) { Found = IntPtr.Zero; int count = 0; EnumWindows((h, p) => {
   if (!IsWindowVisible(h)) return true; var text = new System.Text.StringBuilder(512); GetWindowText(h, text, 512);
   if (text.ToString().Contains(part)) { count++; if (Found == IntPtr.Zero) { Found = h; FoundTitle = text.ToString(); } } return true; }, IntPtr.Zero); return count; }
 [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, System.Text.StringBuilder s, int n);
 // WHY the class: Windows Terminal is one process with many windows, so a count of processes misses a new console
 public static int Consoles() { int count = 0; EnumWindows((h, p) => { if (!IsWindowVisible(h)) return true;
   var name = new System.Text.StringBuilder(256); GetClassName(h, name, 256); var c = name.ToString();
   if (c == "ConsoleWindowClass" || c == "CASCADIA_HOSTING_WINDOW_CLASS") count++; return true; }, IntPtr.Zero); return count; }
 public struct Box { public int Left, Top, Right, Bottom; } }
"@
[WinpcWindow]::SetProcessDPIAware() | Out-Null
$startArgs = @{ FilePath = $settings.exe; WorkingDirectory = $settings.dir; PassThru = $true; WindowStyle = "Hidden";
    RedirectStandardOutput = "$here\out.txt"; RedirectStandardError = "$here\err.txt" }
if ($settings.args) { $startArgs.ArgumentList = $settings.args }
if ($settings.hide -eq "0") { $startArgs.Remove("WindowStyle") }
$consoleQuery = { [WinpcWindow]::Consoles() }
$consolesBefore = & $consoleQuery  # WHY: the console of this script itself (Windows Terminal ignores -WindowStyle Hidden)
$program = Start-Process @startArgs
$handle = [IntPtr]::Zero
for ($i = 0; $i -lt 80 -and $handle -eq [IntPtr]::Zero; $i++) {
    Start-Sleep -Milliseconds 250
    if ([WinpcWindow]::Find($settings.title) -gt 0) { $handle = [WinpcWindow]::Found }
}
if ($handle -eq [IntPtr]::Zero) { "no window with the title '$($settings.title)' in 20 s" | Out-File $log -Append -Encoding utf8 } else {
    $ownerId = [uint32]0; [WinpcWindow]::GetWindowThreadProcessId($handle, [ref]$ownerId) | Out-Null
    "window: $((Get-Process -Id $ownerId).ProcessName) '$([WinpcWindow]::FoundTitle)' after $($i * 250) ms" | Out-File $log -Append -Encoding utf8
    Start-Sleep -Milliseconds ([int]([double]$settings.wait * 1000))
    [WinpcWindow]::SetForegroundWindow($handle) | Out-Null
    Start-Sleep -Milliseconds 400
    if ($settings.keys) { [System.Windows.Forms.SendKeys]::SendWait($settings.keys); Start-Sleep -Milliseconds 800; "keys sent" | Out-File $log -Append -Encoding utf8 }
    $r = New-Object WinpcWindow+Box
    [WinpcWindow]::GetWindowRect($handle, [ref]$r) | Out-Null
    $w = $r.Right - $r.Left; $h = $r.Bottom - $r.Top
    $area = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
    "place: $($r.Left),$($r.Top), size $w x $h; its middle $($r.Left + $w / 2),$($r.Top + $h / 2); the middle of the screen $($area.Width / 2),$($area.Height / 2)" | Out-File $log -Append -Encoding utf8
    $bitmap = New-Object System.Drawing.Bitmap $w, $h
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($r.Left, $r.Top, 0, 0, $bitmap.Size)
    $bitmap.Save("$here\window.png")
    # WHY: a program without a console (-H windowsgui, pythonw, rubyw) that starts powershell shows its console window
    "new console windows: $((& $consoleQuery) - $consolesBefore)" | Out-File $log -Append -Encoding utf8
    $graphics.Dispose(); $bitmap.Dispose()
    if ($settings.keysafter) {
        [WinpcWindow]::SetForegroundWindow($handle) | Out-Null
        Start-Sleep -Milliseconds 300
        [System.Windows.Forms.SendKeys]::SendWait($settings.keysafter); "keys after the picture sent" | Out-File $log -Append -Encoding utf8
    }
}
$program.WaitForExit(30000) | Out-Null
"program ended: $($program.HasExited)" | Out-File $log -Append -Encoding utf8
# WHY: a program that did not close itself (a dialog waits for a person) must not stay on the screen of the user
if (-not $program.HasExited) { taskkill /T /F /PID $program.Id | Out-Null; "program and its children stopped" | Out-File $log -Append -Encoding utf8 }
Start-Sleep -Milliseconds 500
"windows left with that title: $([WinpcWindow]::Find($settings.title))" | Out-File $log -Append -Encoding utf8
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
