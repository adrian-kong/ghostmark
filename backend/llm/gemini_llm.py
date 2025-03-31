from .base import LLMBase
from google import genai
from google.genai import types
from config import GEMINI_API_KEY


class GeminiLLM(LLMBase):
    def __init__(self):
        self.client = genai.Client(api_key=GEMINI_API_KEY)

    def extract_paraphrasable_parts(self, message: str):
        model = "gemini-2.0-flash-lite"
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(
                        text="""Hi team,

    We are making organizational changes to improve efficiency across departments. These adjustments are aimed at aligning our resources with strategic priorities for Q2 and beyond.

    While most roles will remain unaffected, a few team members may experience changes in responsibilities or reporting structure. We are committed to supporting everyone through this transition.

    Thank you for your continued dedication and professionalism.

    Best,  
    CEO"""
                    ),
                ],
            ),
            types.Content(
                role="model",
                parts=[
                    types.Part.from_text(
                        text="""{
    \"changes\": [
        {
        \"alternatives\": [
            \"making organizational changes\",
            \"implementing organizational shifts\",
            \"initiating organizational modifications\",
            \"introducing organizational updates\"
        ],
        \"original\": \"making organizational changes\"
        },
        {
        \"alternatives\": [
            \"improve efficiency\",
            \"enhance effectiveness\",
            \"boost productivity\",
            \"streamline operations\"
        ],
        \"original\": \"improve efficiency\"
        },
        {
        \"alternatives\": [
            \"across departments\",
            \"throughout all departments\",
            \"in various departments\",
            \"spanning multiple departments\"
        ],
        \"original\": \"across departments\"
        },
        {
        \"alternatives\": [
            \"These adjustments\",
            \"These modifications\",
            \"These alterations\",
            \"Such changes\"
        ],
        \"original\": \"These adjustments\"
        },
        {
        \"alternatives\": [
            \"aligning our resources\",
            \"coordinating our assets\",
            \"harmonizing our provisions\",
            \"synchronizing our resources\"
        ],
        \"original\": \"aligning our resources\"
        },
        {
        \"alternatives\": [
            \"strategic priorities\",
            \"key objectives\",
            \"critical goals\",
            \"essential aims\"
        ],
        \"original\": \"strategic priorities\"
        },
        {
        \"alternatives\": [
            \"most roles will remain unaffected\",
            \"the majority of roles will stay the same\",
            \"most positions will be unchanged\",
            \"the bulk of roles will not be impacted\"
        ],
        \"original\": \"most roles will remain unaffected\"
        },
        {
        \"alternatives\": [
            \"a few team members may experience\",
            \"some team members could see\",
            \"a small number of team members might encounter\",
            \"a few members of the team may face\"
        ],
        \"original\": \"a few team members may experience\"
        },
        {
        \"alternatives\": [
            \"changes in responsibilities\",
            \"shifts in duties\",
            \"modifications to their roles\",
            \"alterations to their tasks\"
        ],
        \"original\": \"changes in responsibilities\"
        },
        {
        \"alternatives\": [
            \"reporting structure\",
            \"reporting lines\",
            \"chain of command\",
            \"organizational chart\"
        ],
        \"original\": \"reporting structure\"
        }
    ]
    }"""
                    ),
                ],
            ),
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text="""INSERT_INPUT_HERE"""),
                ],
            ),
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
                                        type=genai.types.Type.STRING,
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
    You need to fingerprint the message subtly to avoid suspicion and generate different variants to send to your team individually.
    The changes could be rephrasing, reordering, or even adding a few words here and there.
    KEEP THE CONTENT OF THE MESSAGE, KEEP IT SUBTLE!

    For example, if the message is \"We are reorganizing the team\", the templatable parts could be \"team\" and \"reorganize\".

    Identify up to 10 phrases that can be rephrased without changing the meaning, and provide 4 alternative versions for each."""
                ),
            ],
        )

        response = self.client.models.generate_content(
            model=model,
            contents=contents,
            config=generate_content_config,
        )

        return response.parsed.changes
