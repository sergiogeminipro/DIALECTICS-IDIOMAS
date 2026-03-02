---
description: Fix MCP server errors caused by corrupted npm/npx cache (ECOMPROMISED, Cannot find module, Lock compromised, EOF)
---

# Fix MCP Cache Errors

Use this workflow when an MCP server (firebase, supabase, stripe, github, etc.) fails to initialize with errors like:
- `npm error code ECOMPROMISED`
- `npm error Lock compromised`
- `Cannot find module 'registry-url'`
- `calling "initialize": EOF`

## Steps

// turbo-all

1. Clean the npm cache:
```powershell
npm cache clean --force
```

2. Delete the corrupted npx cache folder:
```powershell
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\npm-cache\_npx" -ErrorAction SilentlyContinue; Write-Host "npx cache cleared"
```

3. Verify the specific MCP tool installs correctly (replace `<package>` with the relevant one):

| MCP Server           | Verification Command                                      |
|----------------------|------------------------------------------------------------|
| firebase-mcp-server  | `npx -y firebase-tools@latest --version`                   |
| github-mcp-server    | `npx -y @modelcontextprotocol/server-github --help`        |
| supabase-mcp-server  | `npx -y @supabase/mcp-server-supabase@latest --help`       |
| stripe               | `npx -y @stripe/mcp --help`                                |

4. Once the verification command succeeds, **restart Antigravity** so it re-initializes the MCP server connections.

## Notes
- The MCP config file is at: `C:\Users\Geral\.gemini\antigravity\mcp_config.json`
- This issue typically happens when npm updates or installs get interrupted mid-process.
- If the problem persists after clearing cache, try deleting the global npm cache folder entirely: `Remove-Item -Recurse -Force "$env:LOCALAPPDATA\npm-cache"` and then re-running the verification step.
