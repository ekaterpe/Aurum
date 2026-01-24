from openai import OpenAI

client = OpenAI()

user_content = ''
content = ''

response = client.chat.completions.create(
    model="gpt-5-mini",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": content}
    ]
)

print(response.choices[0].message.content)