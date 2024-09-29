// This components Serves questions one at a time to the user

import React from 'react';
import { ChatMessageProps } from '../ChatMessages/ChatMessage';

export interface QuestionnairProps {
  isDone: boolean;
  conversation: ChatMessageProps[];
}

export interface QuestionnairState extends QuestionnairProps {}

export class Questionnaire extends React.Component<QuestionnairProps> {
  constructor(props: QuestionnairProps) {
    super(props);
    this.state = {
      ...props,
    };
  }

  componentDidMount() {}

  componentDidUpdate(
    prevProps: Readonly<QuestionnairProps>,
    prevState: Readonly<{}>,
    snapshot?: any,
  ): void {}

  render() {}
}
