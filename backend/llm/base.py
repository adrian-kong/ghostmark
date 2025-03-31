from abc import ABC, abstractmethod


class LLMBase(ABC):
    @abstractmethod
    def extract_paraphrasable_parts(self, message: str) -> list:
        pass
