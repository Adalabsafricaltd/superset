import { ChatMessageProps, ChatMessage } from './ChatMessage';

export interface ChatMessagesProps {
  messages: ChatMessageProps[]
}


export const testProps: ChatMessagesProps = {
  messages: [
    {
      id: '1',
      prompt: {
        prompt: 'Hello'
      },
      response: {
        message: 'Hi there!',
        sql_query: 'SELECT * FROM table',
        can_be_visualized: 'Yes'
      }
    },
    {
      id: '2',
      prompt: {
        prompt: 'How are you?'
      },
      response: {
        message: 'I am doing well, thanks for asking!',
        sql_query: 'SELECT * FROM table WHERE name="John"',
        can_be_visualized: 'No'
      }
    }
  ]
}


export function ChatMessages(props: ChatMessagesProps) {

  return (
    <>
    {props.messages.map((message, index) => (
        <ChatMessage
          key={index}
          {...message}
        />
      ))}
    </>
  )

}