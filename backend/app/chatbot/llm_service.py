import os
import logging
import time
from typing import Optional

import requests


DEFAULT_OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
DEFAULT_FREE_MODEL = 'google/gemma-3-4b-it:free'
DEFAULT_FALLBACK_MODELS = [
    'google/gemma-3-4b-it:free',
    'meta-llama/llama-3.2-3b-instruct:free',
]
_LLM_SETUP_WARNED = False
_LLM_RATE_LIMITED_UNTIL = 0.0
_LLM_LAST_RATE_LIMIT_LOG_AT = 0.0


APP_KNOWLEDGE = """
You are WeAssist Assistant for a hostel issue/event platform.

Core facts:
- Roles: student, admin.
- Student account starts pending_verification and must be approved by admin.
- Issue lifecycle: reported -> in_progress -> resolved_by_admin -> closed.
- Admin cannot directly close issue; reporter confirms resolution to close.
- Students report issues with title, description, category, and location (hostel/floor/room).
- Events support registration status: upcoming/open/closed.

Style:
- Keep replies concise, practical, and friendly.
- If data is unknown, clearly say what user should do next.
- Never invent private account data.
""".strip()


def llm_enabled() -> bool:
    return bool(os.getenv('OPENROUTER_API_KEY'))


def _llm_key_is_placeholder(api_key: str) -> bool:
    lowered = api_key.strip().lower()
    placeholder_tokens = (
        'your-openrouter-api-key-here',
        'your-key',
        'change-this',
        '<set-in-render-env>',
    )
    return any(token in lowered for token in placeholder_tokens)


def _warn_llm_setup_once() -> None:
    global _LLM_SETUP_WARNED
    if _LLM_SETUP_WARNED:
        return

    api_key = (os.getenv('OPENROUTER_API_KEY') or '').strip()
    if not api_key:
        logging.warning('LLM disabled: OPENROUTER_API_KEY is missing. Chatbot will use rule-based fallback.')
        _LLM_SETUP_WARNED = True
        return

    if _llm_key_is_placeholder(api_key):
        logging.warning('LLM disabled: OPENROUTER_API_KEY appears to be a placeholder value.')
        _LLM_SETUP_WARNED = True
        return


def _get_model_candidates() -> list[str]:
    configured_primary = os.getenv('OPENROUTER_MODEL', DEFAULT_FREE_MODEL).strip()
    env_fallbacks = os.getenv('OPENROUTER_FALLBACK_MODELS', '')
    parsed_env_fallbacks = [m.strip() for m in env_fallbacks.split(',') if m.strip()]

    models: list[str] = [configured_primary]
    for model in parsed_env_fallbacks + DEFAULT_FALLBACK_MODELS:
        if model not in models:
            models.append(model)

    return models


def _parse_openrouter_error_message(response: requests.Response) -> str:
    try:
        body = response.json()
        error = body.get('error', {})
        message = error.get('message') or body.get('message')
        if message:
            return str(message)
    except Exception:
        pass

    return response.text[:220] if response.text else 'unknown OpenRouter error'


def _is_openrouter_rate_limited(response: requests.Response, error_message: str) -> bool:
    if response.status_code != 429:
        return False

    lowered = (error_message or '').lower()
    return any(token in lowered for token in ('rate limit', 'free-models-per-day', 'too many requests', 'quota'))


def generate_assistant_reply(
    user_message: str,
    additional_context: Optional[str] = None,
    max_tokens: int = 280,
) -> Optional[str]:
    """Call OpenRouter model and return generated text or None on failure."""
    global _LLM_RATE_LIMITED_UNTIL
    global _LLM_LAST_RATE_LIMIT_LOG_AT

    _warn_llm_setup_once()

    api_key = os.getenv('OPENROUTER_API_KEY')
    if not api_key or _llm_key_is_placeholder(api_key):
        return None

    endpoint = os.getenv('OPENROUTER_API_URL', DEFAULT_OPENROUTER_URL)
    timeout_seconds = int(os.getenv('OPENROUTER_TIMEOUT_SECONDS', '20'))
    cooldown_seconds = int(os.getenv('OPENROUTER_RATE_LIMIT_COOLDOWN_SECONDS', '900'))

    now = time.time()
    if now < _LLM_RATE_LIMITED_UNTIL:
        # Log at most once per minute while in cooldown to avoid log noise.
        if now - _LLM_LAST_RATE_LIMIT_LOG_AT > 60:
            remaining = int(_LLM_RATE_LIMITED_UNTIL - now)
            logging.warning(f'OpenRouter temporarily skipped due to previous rate limit. Cooldown remaining: {remaining}s')
            _LLM_LAST_RATE_LIMIT_LOG_AT = now
        return None

    prompt_text = APP_KNOWLEDGE
    if additional_context:
        prompt_text += f"\n\nRuntime context:\n{additional_context.strip()}"
    prompt_text += f"\n\nUser question:\n{user_message.strip()}"

    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
        'HTTP-Referer': os.getenv('OPENROUTER_SITE_URL', 'http://localhost:5173'),
        'X-Title': os.getenv('OPENROUTER_APP_NAME', 'WeAssist'),
    }

    for model in _get_model_candidates():
        payload = {
            'model': model,
            'temperature': 0.3,
            'max_tokens': max_tokens,
            # Some free providers reject system-role instructions; single user prompt is more compatible.
            'messages': [
                {'role': 'user', 'content': prompt_text},
            ],
        }

        try:
            response = requests.post(endpoint, json=payload, headers=headers, timeout=timeout_seconds)
            if response.status_code >= 400:
                error_message = _parse_openrouter_error_message(response)
                if _is_openrouter_rate_limited(response, error_message):
                    _LLM_RATE_LIMITED_UNTIL = time.time() + max(60, cooldown_seconds)
                    _LLM_LAST_RATE_LIMIT_LOG_AT = time.time()
                    logging.warning(
                        f'OpenRouter rate-limited for model={model}. '
                        f'Entering cooldown for {max(60, cooldown_seconds)}s. '
                        f'Error: {error_message}'
                    )
                    return None
                logging.warning(f'OpenRouter call failed for model={model} status={response.status_code}: {error_message}')
                continue

            data = response.json()
            choices = data.get('choices') or []
            if not choices:
                continue

            content = (choices[0].get('message') or {}).get('content')
            if not content:
                continue

            return content.strip()
        except Exception as exc:
            logging.warning(f'OpenRouter exception for model={model}: {exc}')
            continue

    return None
