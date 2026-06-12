param(
    [string]$BaseUrl = "https://xfpcb.com/",
    [string]$OutputDir = (Resolve-Path ".").Path,
    [string]$ManifestPath = "",
    [bool]$LocalizeSameOriginAssets = $true
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Net.Http

$root = [System.IO.Path]::GetFullPath($OutputDir)
$base = [Uri]$BaseUrl
$allowedHosts = @($base.Host)

$client = [System.Net.Http.HttpClient]::new()
$client.Timeout = [TimeSpan]::FromSeconds(45)
$client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (compatible; XFPCB-Site-Mirror/1.0)")

$seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$queued = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$queue = [System.Collections.Generic.Queue[Uri]]::new()
$results = [System.Collections.Generic.List[object]]::new()

function Get-NormalizedUrl {
    param([Uri]$Uri)

    if ($Uri.Scheme -notin @("http", "https")) {
        return $null
    }

    $builder = [UriBuilder]$Uri
    $builder.Fragment = ""
    if (($builder.Scheme -eq "https" -and $builder.Port -eq 443) -or ($builder.Scheme -eq "http" -and $builder.Port -eq 80)) {
        $builder.Port = -1
    }

    return $builder.Uri.AbsoluteUri
}

function Add-QueueUrl {
    param(
        [string]$RawUrl,
        [Uri]$ContextUrl
    )

    if ([string]::IsNullOrWhiteSpace($RawUrl)) {
        return
    }

    $candidate = $RawUrl.Trim()
    if ($candidate -match "^(?i)(mailto:|tel:|javascript:|data:|blob:)") {
        return
    }

    try {
        $uri = [Uri]::new($ContextUrl, $candidate)
    }
    catch {
        return
    }

    if ($allowedHosts -notcontains $uri.Host) {
        return
    }

    $normalized = Get-NormalizedUrl $uri
    if ($null -eq $normalized) {
        return
    }

    if ($queued.Add($normalized)) {
        $queue.Enqueue([Uri]$normalized)
    }
}

function Get-LocalPath {
    param(
        [Uri]$Uri,
        [string]$ContentType
    )

    $path = [Uri]::UnescapeDataString($Uri.AbsolutePath)
    if ([string]::IsNullOrWhiteSpace($path) -or $path -eq "/") {
        $relative = "index.html"
    }
    else {
        $relative = $path.TrimStart("/")
        $relative = $relative -replace "/", [System.IO.Path]::DirectorySeparatorChar

        $extension = [System.IO.Path]::GetExtension($relative)
        if ($path.EndsWith("/") -or [string]::IsNullOrWhiteSpace($extension) -or $ContentType -match "text/html") {
            $relative = Join-Path $relative "index.html"
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($Uri.Query)) {
        $sha256 = [System.Security.Cryptography.SHA256]::Create()
        $hashBytes = $sha256.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($Uri.Query))
        $hash = [System.BitConverter]::ToString($hashBytes).Replace("-", "").Substring(0, 10).ToLowerInvariant()
        $directory = Split-Path $relative -Parent
        $fileName = [System.IO.Path]::GetFileNameWithoutExtension($relative)
        $extension = [System.IO.Path]::GetExtension($relative)
        if ([string]::IsNullOrWhiteSpace($directory)) {
            $relative = "$fileName.query-$hash$extension"
        }
        else {
            $relative = Join-Path $directory "$fileName.query-$hash$extension"
        }
    }

    $target = [System.IO.Path]::GetFullPath((Join-Path $root $relative))
    if (-not $target.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to write outside output directory: $target"
    }

    return $target
}

function Get-RelativeSavedPath {
    param(
        [string]$RootPath,
        [string]$TargetPath
    )

    $rootFull = [System.IO.Path]::GetFullPath($RootPath).TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)
    $targetFull = [System.IO.Path]::GetFullPath($TargetPath)
    $rootPrefix = $rootFull + [System.IO.Path]::DirectorySeparatorChar

    if ($targetFull.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        return $targetFull.Substring($rootPrefix.Length)
    }

    return $targetFull
}

function Get-TextContent {
    param(
        [byte[]]$Bytes,
        [string]$ContentType
    )

    $encodingName = $null
    if ($ContentType -match "charset=([^;\s]+)") {
        $encodingName = $Matches[1].Trim('"')
    }

    try {
        if ($encodingName) {
            return [System.Text.Encoding]::GetEncoding($encodingName).GetString($Bytes)
        }
    }
    catch {
    }

    return [System.Text.Encoding]::UTF8.GetString($Bytes)
}

function Add-UrlsFromText {
    param(
        [string]$Text,
        [Uri]$ContextUrl
    )

    $attrPattern = "(?is)\b(?:href|src|action|poster)\s*=\s*(['""]?)([^'""\s>]+)\1"
    foreach ($match in [regex]::Matches($Text, $attrPattern)) {
        Add-QueueUrl $match.Groups[2].Value $ContextUrl
    }

    $srcsetPattern = "(?is)\bsrcset\s*=\s*(['""])(.*?)\1"
    foreach ($match in [regex]::Matches($Text, $srcsetPattern)) {
        $items = $match.Groups[2].Value -split ","
        foreach ($item in $items) {
            $url = ($item.Trim() -split "\s+")[0]
            Add-QueueUrl $url $ContextUrl
        }
    }

    $cssUrlPattern = "(?is)url\(\s*(['""]?)(.*?)\1\s*\)"
    foreach ($match in [regex]::Matches($Text, $cssUrlPattern)) {
        Add-QueueUrl $match.Groups[2].Value $ContextUrl
    }
}

function Add-UrlsFromCss {
    param(
        [string]$Text,
        [Uri]$ContextUrl
    )

    $cssUrlPattern = "(?is)url\(\s*(['""]?)(.*?)\1\s*\)"
    foreach ($match in [regex]::Matches($Text, $cssUrlPattern)) {
        Add-QueueUrl $match.Groups[2].Value $ContextUrl
    }

    $importPattern = "(?is)@import\s+(?:url\()?['""]([^'""]+)['""]"
    foreach ($match in [regex]::Matches($Text, $importPattern)) {
        Add-QueueUrl $match.Groups[1].Value $ContextUrl
    }
}

function Add-UrlsFromJavaScript {
    param(
        [string]$Text,
        [Uri]$ContextUrl
    )

    $importPattern = "(?is)\b(?:import|export)\s+(?:[^'""]*?\s+from\s+)?['""]([^'""]+)['""]|import\(\s*['""]([^'""]+)['""]\s*\)"
    foreach ($match in [regex]::Matches($Text, $importPattern)) {
        $url = if ($match.Groups[1].Success) { $match.Groups[1].Value } else { $match.Groups[2].Value }
        Add-QueueUrl $url $ContextUrl
    }
}

function Add-UrlsFromSitemap {
    param(
        [string]$Text,
        [Uri]$ContextUrl
    )

    foreach ($match in [regex]::Matches($Text, "(?is)<loc>\s*(.*?)\s*</loc>")) {
        Add-QueueUrl $match.Groups[1].Value $ContextUrl
    }
}

function Convert-SameOriginAssetLinks {
    param(
        [string]$RootPath,
        [Uri]$BaseUri
    )

    $origin = $BaseUri.GetLeftPart([System.UriPartial]::Authority).TrimEnd("/")
    $assetFolders = @("css", "js", "images", "cdn-cgi")
    $htmlFiles = Get-ChildItem -LiteralPath $RootPath -Recurse -Filter "*.html" -File

    foreach ($file in $htmlFiles) {
        $text = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $updated = $text
        foreach ($folder in $assetFolders) {
            $updated = $updated.Replace("href=`"$origin/$folder/", "href=`"/$folder/")
            $updated = $updated.Replace("src=`"$origin/$folder/", "src=`"/$folder/")
            $updated = $updated.Replace("href='$origin/$folder/", "href='/$folder/")
            $updated = $updated.Replace("src='$origin/$folder/", "src='/$folder/")
        }

        if ($updated -ne $text) {
            [System.IO.File]::WriteAllText($file.FullName, $updated, [System.Text.Encoding]::UTF8)
        }
    }
}

Add-QueueUrl "/" $base
Add-QueueUrl "/robots.txt" $base
Add-QueueUrl "/sitemap.xml" $base

while ($queue.Count -gt 0) {
    $current = $queue.Dequeue()
    $normalized = Get-NormalizedUrl $current
    if (-not $seen.Add($normalized)) {
        continue
    }

    try {
        $response = $client.GetAsync($current).GetAwaiter().GetResult()
        $status = [int]$response.StatusCode
        if (-not $response.IsSuccessStatusCode) {
            $location = $response.Headers.Location
            $note = "Skipped non-success response"
            if ($status -in @(301, 302, 303, 307, 308) -and $null -ne $location) {
                Add-QueueUrl $location.OriginalString $current
                $note = "Redirect queued"
            }

            $failedContentType = if ($response.Content.Headers.ContentType) { $response.Content.Headers.ContentType.ToString() } else { "" }
            $results.Add([pscustomobject]@{
                url = $normalized
                status = $status
                saved_to = $null
                content_type = $failedContentType
                bytes = 0
                note = $note
            })
            continue
        }

        $bytes = $response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
        $contentType = if ($response.Content.Headers.ContentType) { $response.Content.Headers.ContentType.ToString() } else { "" }
        $target = Get-LocalPath $current $contentType
        $directory = Split-Path $target -Parent
        New-Item -ItemType Directory -Force -Path $directory | Out-Null
        [System.IO.File]::WriteAllBytes($target, $bytes)

        $relativeSavedPath = Get-RelativeSavedPath $root $target
        $results.Add([pscustomobject]@{
            url = $normalized
            status = $status
            saved_to = $relativeSavedPath
            content_type = $contentType
            bytes = $bytes.Length
            note = "Saved"
        })

        if ($contentType -match "text/html|text/css|xml|javascript|json") {
            $text = Get-TextContent $bytes $contentType
            if ($contentType -match "xml" -or $current.AbsolutePath.EndsWith(".xml")) {
                Add-UrlsFromSitemap $text $current
            }
            elseif ($contentType -match "text/html") {
                Add-UrlsFromText $text $current
            }
            elseif ($contentType -match "text/css") {
                Add-UrlsFromCss $text $current
            }
            elseif ($contentType -match "javascript") {
                Add-UrlsFromJavaScript $text $current
            }
        }
    }
    catch {
        $results.Add([pscustomobject]@{
            url = $normalized
            status = $null
            saved_to = $null
            content_type = $null
            bytes = 0
            note = $_.Exception.Message
        })
    }
}

if ($LocalizeSameOriginAssets) {
    Convert-SameOriginAssetLinks $root $base
}

if ([string]::IsNullOrWhiteSpace($ManifestPath)) {
    $manifestPath = Join-Path $root "download-manifest.json"
}
else {
    $manifestPath = [System.IO.Path]::GetFullPath($ManifestPath)
    $manifestDirectory = Split-Path $manifestPath -Parent
    New-Item -ItemType Directory -Force -Path $manifestDirectory | Out-Null
}
$savedCount = @($results | Where-Object { $_.saved_to }).Count
$skippedCount = @($results | Where-Object { -not $_.saved_to -and ($_.note -eq "Redirect queued" -or $_.note -eq "Skipped non-success response") }).Count
$failedCount = @($results | Where-Object { -not $_.saved_to -and $_.note -ne "Redirect queued" -and $_.note -ne "Skipped non-success response" }).Count
$summary = [pscustomobject]@{
    base_url = $BaseUrl
    downloaded_at = (Get-Date).ToString("s")
    output_dir = $root
    total_items = $results.Count
    saved_items = $savedCount
    skipped_items = $skippedCount
    failed_items = $failedCount
    localized_same_origin_assets = $LocalizeSameOriginAssets
    items = $results
}

$summary | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

Write-Host "Downloaded $($summary.saved_items) items into $root"
Write-Host "Manifest: $manifestPath"
