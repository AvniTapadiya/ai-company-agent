# test_openrouter.py

from openrouter_client import client

response = client.chat.completions.create(
    model="openai/gpt-oss-20b:free",
    messages=[
        {
            "role": "user",
            "content": "Say hello"
        }
    ]
)

print(response.choices[0].message.content)