param(
    [string]$SourceDir = ".\hugo-src",
    [string]$DestinationDir = ".\site-hugo"
)

$ErrorActionPreference = "Stop"

$hugo = Get-Command hugo -ErrorAction SilentlyContinue
if (-not $hugo) {
    throw "Hugo is not available in this terminal. Run: winget install Hugo.Hugo.Extended --accept-package-agreements --accept-source-agreements"
}

$sourcePath = [System.IO.Path]::GetFullPath($SourceDir)
$destinationPath = [System.IO.Path]::GetFullPath($DestinationDir)

& $hugo.Source --source $sourcePath --destination $destinationPath --cleanDestinationDir

Write-Host "Hugo site generated at $destinationPath"
