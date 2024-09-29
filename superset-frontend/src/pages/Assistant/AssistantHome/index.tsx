import React, { Component } from 'react';
import {
  AssistantCategoriesProps,
  AssistantSuggestionCategories,
} from './AssistantSuggestionCategories';
import { AssistantWelcomeMessage } from './AssistantWelcomeMessage';
import { AssistantPrompt } from './AssistantPrompt';
import { DatasourceProps } from '../ContextBuilder/Datasource';
import { cleanDatasourceProps } from '../assistantUtils';
import { AssistantActionsType } from '../actions';
import Loading from 'src/components/Loading';
import { ChatMessages } from '../ChatMessages';
import { ChatMessageProps } from '../ChatMessages/ChatMessage';

export interface AssistantProps {
  user: {
    userId: number;
    firstName: string;
    lastName: string;
  };
  data: DatasourceProps[];
  actions: AssistantActionsType;
  conversation: ChatMessageProps[];
}

export interface AssistantState extends AssistantProps {
  categories: AssistantCategoriesProps;
  currentContext?: DatasourceProps;
  isLoadingSuggestions: boolean;
}

/**
 * This is the main page for the Assistant: Superset. This page will be the first page that the user sees when they open the Assistant.
 */
export class AssistantHome extends Component<AssistantProps, AssistantState> {
  timer: any;

  // constructor
  constructor(props: AssistantProps) {
    super(props);
    this.state = {
      ...this.props,
      isLoadingSuggestions: false,
      categories: {
        categories: [],
      },
      currentContext: cleanDatasourceProps(this.props.data),
    };
  }

  async componentDidUpdate(prevProps: AssistantProps) {
    if (prevProps.data !== this.props.data) {
      this.setState({
        currentContext: cleanDatasourceProps(this.props.data),
      });
    }
    if (prevProps.conversation !== this.props.conversation) {
      this.setState(
        {
          conversation: this.props.conversation,
        },
        this.chatScrollToEnd,
      );
    }
  }

  chatScrollToEnd() {
    const chatContainerDiv = document.getElementById('chat-container-div');
    if (chatContainerDiv) {
      chatContainerDiv.scrollBy({
        behavior: 'smooth',
        top: chatContainerDiv.scrollHeight,
      });
    }
  }

  componentDidMount() {
    this.chatScrollToEnd();
  }

  render() {
    const { user } = this.props;
    const { categories, isLoadingSuggestions, conversation } = this.state;

    return (
      <>
        <div
          id="assistant-container"
          style={{
            flexGrow: 1,
            flexShrink: 1,
            display: 'flex',
            flexDirection: 'column',
            flexFlow: 'column',
            width: '960px',
            maxWidth: '100%',
            margin: '0 auto',
            maxHeight: 'calc(100vh - 130px)',
          }}
        >
          <style>
            {`
                @media (max-width: 960px) {
                  #assistant-container {
                    width: 100vw !important
                  }
                }
              `}
          </style>
          <div
            style={{
              flex: '0 0 auto',
              width: '100%',
            }}
          >
            {(!conversation || conversation.length === 0) && (
              <AssistantWelcomeMessage userFirsrName={user.firstName} />
            )}
            {(!conversation || conversation.length === 0) && (
              <AssistantSuggestionCategories {...categories} />
            )}
          </div>
          <div
            id="chat-container-div"
            style={{
              flexShrink: 1,
              flexGrow: 1,
              overflowY: 'auto',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {conversation && <ChatMessages messages={conversation} />}
          </div>
          <div
            style={{
              flex: '0 0 auto',
              display: 'flex',
              alignSelf: 'flex-end',
              width: '100%',
            }}
          >
            <AssistantPrompt
              context={this.state.currentContext}
              actions={this.props.actions}
              conversation={conversation}
            />
          </div>
        </div>
        {isLoadingSuggestions && <Loading />}
      </>
    );
  }
}
