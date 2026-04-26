param(
  [string]$ExePath,
  [string]$ScriptPath
)

$proc = Start-Process -FilePath $ExePath -ArgumentList '-r', $ScriptPath -PassThru -NoNewWindow
$proc.WaitForExit()
exit $proc.ExitCode