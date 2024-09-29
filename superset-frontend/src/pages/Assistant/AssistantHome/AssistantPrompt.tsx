import { PureComponent } from 'react';
import { Input, Spin, Tag } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { AssistantActionsType } from '../actions';
import { DatasourceProps } from '../ContextBuilder/Datasource';
import { assistantPrompt } from '../assistantUtils';
import { ChatMessageProps } from '../ChatMessages/ChatMessage';

const { TextArea } = Input;

export interface AssistantProps {
  context?: DatasourceProps;
  actions: AssistantActionsType;
  conversation: ChatMessageProps[];
}

export interface AssistantPromptState extends AssistantProps {
  prompt: string;
  isLoading: boolean;
}

export class AssistantPrompt extends PureComponent<
  AssistantProps,
  AssistantPromptState
> {
  constructor(props: AssistantProps) {
    super(props);
    this.state = {
      ...props,
      prompt: '',
      isLoading: false,
      conversation: []
    };
  }

  componentDidUpdate(
    prevProps: Readonly<AssistantProps>,
    prevState: Readonly<AssistantPromptState>,
    snapshot?: any,
  ): void {
    if (prevProps.context !== this.props.context) {
      this.setState({
        context: this.props.context,
      });
    }

    if (prevProps.conversation !== this.props.conversation) {
      this.setState({
        conversation: this.props.conversation,
      });
    }
  }

  handlePrompt = async () => {
    this.setState({ isLoading: true });
    const { prompt, context, conversation } = this.state;
    const promptId = `id-${conversation.length}`;
    if (prompt.length > 0 && context) {
      this.props.actions.newPrompt(promptId, { prompt });
      const { ai_response, sql_query, viz_type } = await assistantPrompt(
        context,
        conversation,
        prompt,
      );
      this.props.actions.updatePromptResponse(promptId, {
        message: ai_response,
        sql_query: sql_query || '',
        viz_type: viz_type || [],
        can_be_visualized: viz_type ? 'true' : 'false',
      });
      this.setState({prompt: ''})
    }
    this.setState({ isLoading: false});
  };
  handlePromptInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ prompt: event.target.value });
    console.log(event.target.value);
  };

  render() {
    const { isLoading, prompt, context } = this.state;

    return (
      <div
        style={{
          flex: '0 1 auto',
          alignSelf: 'flex-end',
          borderRadius: '15px',
          width: '100%',
          position: 'relative',
          margin: '24px',
        }}
      >
        <TextArea
          placeholder="Tell the assistant what you want to visualize"
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            borderRadius: '24px',
            paddingRight: '100px',
            paddingLeft: '16px',
            paddingTop: '16px',
            paddingBottom: '16px',
          }}
          autoSize={{
            minRows: 3,
            maxRows: 10,
          }}
          value={prompt}
          onChange={this.handlePromptInput}
        />
        {!context && (
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Tag icon={<ExclamationCircleOutlined />} color="error">
              {' '}
              No context selected!!{' '}
            </Tag>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flex: 'row',
            position: 'absolute',
            right: '12px',
            bottom: '12px',
          }}
        >
          <span
              style={{
                height: '40px',
                width: '40px',
                color: 'white',
                alignContent: 'center',
                alignItems: 'center',
              }}
              onClick={this.handlePrompt}
            >
              {isLoading && <Spin size="small" />}
              {!isLoading && (
                <img
                  src="/static/assets/images/assistant_prompt_send.svg"
                  alt="v_logo"
                />
              )}
            </span>
        </div>
      </div>
    );
  }
}