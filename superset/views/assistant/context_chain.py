
system_instruction = """

"""



class ContextQuestionnaire:



    def nextQuestion(conversation_history):
        """
        Returns Next Question
        {
            questionText: string markdown
            isEnd: false
        }

        or if llm sends a stop signal
        {
            isEnd: true
        }
        """
        # TODO replace with llm message
        nextQuestion = {
            "questionText": "Some Text question",
            "isEnd": "False"
        }

        return nextQuestion;
    

    def summarize(conversation):
        """
        Returns Summary 
        {
            questionnaire: [
                {
                    question: string,
                    answer: string,
                }
            ]
            kpi:[
                string
            ]
        }
        """
        return None