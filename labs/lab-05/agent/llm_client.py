"""LLM client - OpenAI-compatible by default.

Configure with environment variables:

    LLM_BASE_URL   e.g. https://open-webui.rc.virginia.edu/api
    LLM_API_KEY    your Rivanna GenAI token (RC GenAI portal -> Settings -> Account -> API keys)
    LLM_MODEL      e.g. moonshotai/kimi-k2-instruct

If you are running against the Rivanna GenAI service, copy the
endpoint URL, key, and exact model string from the RC GenAI portal:
https://open-webui.rc.virginia.edu/

For a quick local fallback (no Rivanna), point LLM_BASE_URL at any
local OpenAI-compatible server such as `vllm`, `text-generation-webui`,
`llama-cpp-server`, or `ollama`'s OpenAI-compatible endpoint.
"""

import os
import json
from typing import Any

import httpx


class LLMError(RuntimeError):
    pass


class LLMClient:
    def __init__(
        self,
        base_url: str | None = None,
        api_key: str | None = None,
        model: str | None = None,
        timeout: float = 60.0,
    ):
        self.base_url = (base_url or os.environ.get("LLM_BASE_URL", "")).rstrip("/")
        self.api_key = api_key or os.environ.get("LLM_API_KEY", "")
        self.model = model or os.environ.get("LLM_MODEL", "")
        if not self.base_url or not self.api_key or not self.model:
            raise LLMError(
                "LLM client not configured. Set LLM_BASE_URL, LLM_API_KEY, "
                "and LLM_MODEL environment variables. See agent/.env.example."
            )
        self._client = httpx.Client(timeout=timeout)

    def chat(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 512,
        stop: list[str] | None = None,
    ) -> str:
        """One round-trip. Returns the assistant's reply as a plain string."""
        url = f"{self.base_url}/chat/completions"
        body: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if stop:
            body["stop"] = stop
        try:
            r = self._client.post(
                url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=body,
            )
        except httpx.HTTPError as e:
            raise LLMError(f"network error: {e}") from e

        if r.status_code != 200:
            raise LLMError(f"LLM HTTP {r.status_code}: {r.text[:300]}")

        try:
            data = r.json()
            return data["choices"][0]["message"]["content"]
        except (KeyError, json.JSONDecodeError) as e:
            raise LLMError(f"unexpected response shape: {r.text[:300]}") from e
