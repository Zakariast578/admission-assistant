import re


def sanitize_input(text: str) -> str:
    """Strips dangerous control characters and trims white space."""
    cleaned = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", text)
    return cleaned.strip()