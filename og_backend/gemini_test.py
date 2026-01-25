import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv("keys.env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY not found in keys.env")
    exit(1)

genai.configure(api_key=GEMINI_API_KEY)

# Load the system prompt
with open("gemini_prompt.txt", "r") as f:
    system_instruction = f.read()

model = genai.GenerativeModel(
    model_name="gemini-flash-latest",
    system_instruction=system_instruction
)

chat = model.start_chat(history=[])

print("--- Yap2Learn Gemini Test ---")
print("Type 'quit' to exit.")

while True:
    user_input = input("\nYou: ")
    if user_input.lower() in ["quit", "exit"]:
        break
    
    response = chat.send_message(user_input)
    print(f"Gemini: {response.text}")
