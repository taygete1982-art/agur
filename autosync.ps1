$interval = 120
Set-Location $PSScriptRoot
while ($true) {
    $status = git status --porcelain
    if ($status) {
        git add -A
        git commit -m "autosync $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        git push
        Write-Host "[autosync] запушено в $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
    }
    Start-Sleep -Seconds $interval
}
