param(
    [string]$SiteDir = ".\site",
    [string]$ContentDir = ".\hugo-src\content"
)

$ErrorActionPreference = "Stop"

$siteRoot = [System.IO.Path]::GetFullPath($SiteDir)
$contentRoot = [System.IO.Path]::GetFullPath($ContentDir)

function Convert-ToYamlString {
    param([string]$Value)

    if ($null -eq $Value) {
        $Value = ""
    }

    return "'" + ($Value -replace "'", "''") + "'"
}

function Get-FirstMatch {
    param(
        [string]$Text,
        [string]$Pattern
    )

    $match = [regex]::Match($Text, $Pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor [System.Text.RegularExpressions.RegexOptions]::Singleline)
    if ($match.Success) {
        return [System.Net.WebUtility]::HtmlDecode($match.Groups[1].Value.Trim())
    }

    return ""
}

function Get-ContentOutputPath {
    param([string]$RelativeHtmlPath)

    $normalized = $RelativeHtmlPath -replace "\\", "/"

    if ($normalized -eq "index.html") {
        return (Join-Path $contentRoot "_index.md")
    }

    if ($normalized -eq "products/index.html") {
        return (Join-Path $contentRoot "products\_index.md")
    }

    if ($normalized.EndsWith("/index.html")) {
        $folder = $normalized.Substring(0, $normalized.Length - "/index.html".Length)
        return (Join-Path $contentRoot ($folder -replace "/", [System.IO.Path]::DirectorySeparatorChar)) + [System.IO.Path]::DirectorySeparatorChar + "index.md"
    }

    $withoutExt = [System.IO.Path]::ChangeExtension($normalized, ".md")
    return Join-Path $contentRoot ($withoutExt -replace "/", [System.IO.Path]::DirectorySeparatorChar)
}

if (Test-Path -LiteralPath $contentRoot) {
    Remove-Item -LiteralPath $contentRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $contentRoot | Out-Null

$htmlFiles = Get-ChildItem -LiteralPath $siteRoot -Recurse -Filter "*.html" -File |
    Where-Object { $_.FullName -notmatch "\\cdn-cgi\\" }

foreach ($file in $htmlFiles) {
    $html = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $relative = $file.FullName.Substring($siteRoot.Length).TrimStart("\", "/")

    $title = Get-FirstMatch $html "<title>\s*(.*?)\s*</title>"
    $description = Get-FirstMatch $html "<meta\s+name=['""]description['""]\s+content=['""](.*?)['""]"
    $keywords = Get-FirstMatch $html "<meta\s+name=['""]keywords['""]\s+content=['""](.*?)['""]"
    $mainMatch = [regex]::Match($html, "<main[^>]*>(.*?)</main>", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor [System.Text.RegularExpressions.RegexOptions]::Singleline)

    if (-not $mainMatch.Success) {
        continue
    }

    $body = $mainMatch.Groups[1].Value.Trim()
    $styles = [System.Collections.Generic.List[string]]::new()
    foreach ($styleMatch in [regex]::Matches($html, "<link[^>]+rel=['""]stylesheet['""][^>]+href=['""]([^'""]+)['""]", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)) {
        $href = $styleMatch.Groups[1].Value.Trim()
        if ($href.StartsWith("https://xfpcb.com/")) {
            $href = $href.Substring("https://xfpcb.com".Length)
        }
        if (-not $styles.Contains($href)) {
            $styles.Add($href)
        }
    }

    $outputPath = Get-ContentOutputPath $relative
    New-Item -ItemType Directory -Force -Path (Split-Path $outputPath -Parent) | Out-Null

    $frontMatter = [System.Collections.Generic.List[string]]::new()
    $frontMatter.Add("---")
    $frontMatter.Add("title: " + (Convert-ToYamlString $title))
    $frontMatter.Add("seoTitle: " + (Convert-ToYamlString $title))
    if (-not [string]::IsNullOrWhiteSpace($description)) {
        $frontMatter.Add("description: " + (Convert-ToYamlString $description))
    }
    if (-not [string]::IsNullOrWhiteSpace($keywords)) {
        $frontMatter.Add("keywords: " + (Convert-ToYamlString $keywords))
    }
    if ($styles.Count -gt 0) {
        $frontMatter.Add("styles:")
        foreach ($style in $styles) {
            $frontMatter.Add("  - " + (Convert-ToYamlString $style))
        }
    }
    $frontMatter.Add("---")
    $frontMatter.Add("")
    $frontMatter.Add($body)

    [System.IO.File]::WriteAllText($outputPath, ($frontMatter -join [Environment]::NewLine), [System.Text.Encoding]::UTF8)
}

Write-Host "Extracted $($htmlFiles.Count) HTML pages into $contentRoot"
