from .base import LLMBase


class DummyLLM(LLMBase):
    def extract_paraphrasable_parts(self, message: str):
        return [
            {
                "original": "organizational changes",
                "alternatives": [
                    "team restructuring",
                    "internal reorganization",
                    "department updates",
                ],
            },
            {
                "original": "improve efficiency",
                "alternatives": [
                    "boost productivity",
                    "streamline operations",
                    "increase effectiveness",
                ],
            },
            {
                "original": "Your role may be affected",
                "alternatives": [
                    "Your position might change",
                    "You could be impacted",
                    "There may be changes to your responsibilities",
                ],
            },
        ]
