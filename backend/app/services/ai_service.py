import anthropic
import os

_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = (
    "You are a friendly cybersecurity tutor for students aged 12-18. "
    "Give helpful hints that guide without giving away the full answer. "
    "Keep responses concise and encouraging."
)


def get_hint(challenge_title: str, student_input: str, attempt_number: int) -> str:
    message = _client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=300,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Challenge: {challenge_title}\n"
                    f"Student attempt #{attempt_number}: {student_input}\n"
                    "Give a helpful hint."
                ),
            }
        ],
    )
    return message.content[0].text
