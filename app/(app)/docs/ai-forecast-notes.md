- When there is no API available, simply fetch html source is not enough because nowadays websites are quite dynamic.
- Most AI services do not search external sources real-time because of limited tooling by default.
- [Claude API](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector#authentication) with [Browserbase remote MCP]([https://www.browserbase.com/](https://docs.browserbase.com/integrations/mcp/introduction)) does work. e.g.
  ```
  curl https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: mcp-client-2025-11-20" \
  -d '{
    "model": "claude-opus-4-6",
    "max_tokens": 1000,
    "messages": [{"role": "user", "content": "Is it safe to swim at Jenkins Bay according to https://safeswim.org.nz/locations/jenkins-bay? Do not use tool browserbase_screenshot."}],
    "mcp_servers": [{
      "type": "url",
      "url": "https://server.smithery.ai/@browserbasehq/mcp-browserbase",
      "name": "browserbase",
      "authorization_token": "BROWSERBASE_TOKEN"
    }],
    "tools": [{
      "type": "mcp_toolset",
      "mcp_server_name": "browserbase"
    }]
  }'
  ```
- Claude API and Browserbase both incur additional cost.
- For development, I'll use the existing Claude Code Max subscription:
  ```
  claude --dangerously-skip-permissions --model "haiku" --strict-mcp-config --mcp-config ".mcp-playwright.json" --output-format "text" --print "When are the tide turning times according to https://tides.niwa.co.nz/?latitude=-36.97484844433063&longitude=174.62043566419308&startDate=2026-02-13&numberOfDays=14 Respond in JSON format without any explanation. Use playwright-headless MCP."
  ```
  ```
  claude --dangerously-skip-permissions --model "sonnet" --strict-mcp-config --mcp-config ".mcp-playwright.json" --output-format "text" --print < "app/(app)/docs/ai-forecast-prompt.md"
  ```
