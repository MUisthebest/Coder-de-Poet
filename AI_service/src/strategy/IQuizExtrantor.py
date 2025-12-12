from abc import ABC, abstractmethod
from .. import GenerateLessonQuizCommand

class IQuizExtractor (ABC):
    @abstractmethod
    def extract(self, cmd : GenerateLessonQuizCommand) -> None:
        pass
    