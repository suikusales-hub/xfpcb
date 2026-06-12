param(
    [string]$Root = (Resolve-Path ".").Path,
    [int]$Port = 8788
)

$ErrorActionPreference = "Stop"

$rootPath = [System.IO.Path]::GetFullPath($Root)
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css" = "text/css; charset=utf-8"
    ".js" = "text/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".xml" = "text/xml; charset=utf-8"
    ".txt" = "text/plain; charset=utf-8"
    ".png" = "image/png"
    ".jpg" = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".webp" = "image/webp"
    ".svg" = "image/svg+xml"
    ".ico" = "image/x-icon"
}

Write-Host "Serving $rootPath at http://127.0.0.1:$Port/"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    try {
        $requestPath = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart("/"))
        if ([string]::IsNullOrWhiteSpace($requestPath)) {
            $requestPath = "index.html"
        }

        $localPath = [System.IO.Path]::GetFullPath((Join-Path $rootPath ($requestPath -replace "/", [System.IO.Path]::DirectorySeparatorChar)))
        if (-not $localPath.StartsWith($rootPath, [System.StringComparison]::OrdinalIgnoreCase)) {
            $context.Response.StatusCode = 403
            $context.Response.Close()
            continue
        }

        if ((Test-Path -LiteralPath $localPath -PathType Container)) {
            $localPath = Join-Path $localPath "index.html"
        }
        elseif (-not (Test-Path -LiteralPath $localPath) -and -not [System.IO.Path]::GetExtension($localPath)) {
            $localPath = Join-Path $localPath "index.html"
        }

        if (-not (Test-Path -LiteralPath $localPath -PathType Leaf)) {
            $context.Response.StatusCode = 404
            $context.Response.Close()
            continue
        }

        $extension = [System.IO.Path]::GetExtension($localPath).ToLowerInvariant()
        $context.Response.ContentType = if ($mimeTypes.ContainsKey($extension)) { $mimeTypes[$extension] } else { "application/octet-stream" }
        $bytes = [System.IO.File]::ReadAllBytes($localPath)
        $context.Response.ContentLength64 = $bytes.Length
        $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        $context.Response.Close()
    }
    catch {
        try {
            $context.Response.StatusCode = 500
            $context.Response.Close()
        }
        catch {
        }
    }
}
