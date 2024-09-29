import { ChatMessageProps, ChatMessage } from './ChatMessage';

export interface ChatMessagesProps {
  messages: ChatMessageProps[];
}

export function ChatMessages(props: ChatMessagesProps) {
  return (
    <>
      {props.messages.map((message, index) => (
        <ChatMessage key={index} {...message} />
      ))}
    </>
  );
}
