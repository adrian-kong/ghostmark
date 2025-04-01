from .base import LLMBase
from google import genai
from google.genai import types
from config import GEMINI_API_KEY
import logging


class GeminiLLM(LLMBase):
    def __init__(self):
        self.client = genai.Client(api_key=GEMINI_API_KEY)

    def extract_paraphrasable_parts(self, message: str):
        model = "gemini-2.0-flash-lite"
        contents = [
            types.Content(role="user", parts=[types.Part.from_text(text=message)])
        ]
        generate_content_config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=genai.types.Schema(
                type=genai.types.Type.OBJECT,
                required=["changes"],
                properties={
                    "changes": genai.types.Schema(
                        type=genai.types.Type.ARRAY,
                        items=genai.types.Schema(
                            type=genai.types.Type.OBJECT,
                            required=["original", "alternatives"],
                            properties={
                                "original": genai.types.Schema(
                                    type=genai.types.Type.STRING,
                                ),
                                "alternatives": genai.types.Schema(
                                    type=genai.types.Type.ARRAY,
                                    items=genai.types.Schema(
                                        type=genai.types.Type.STRING
                                    ),
                                ),
                            },
                        ),
                    ),
                },
            ),
            system_instruction=[
                types.Part.from_text(
                    text="""You are a fingerprinting assistant, there is a mole in your company that is leaking internal messages publicly.
    You need to fingerprint the message subtly to avoid suspicion, generate different variants to send to your team individually.
    The changes could be rephrasing, reordering, or even adding a few words.
    KEEP THE CONTENT OF THE MESSAGE, KEEP IT SUBTLE!

    For example, if the message is "We are reorganizing the team", the templatable parts could be "team" and "reorganize".

    Identify 10 phrases that can be rephrased without changing the meaning, and provide 4 alternative versions for each."""
                ),
            ],
        )

        response = self.client.models.generate_content(
            model=model,
            contents=contents,
            config=generate_content_config,
        )

        logging.info(response.parsed["changes"])

        return response.parsed["changes"]
