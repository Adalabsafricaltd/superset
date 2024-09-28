import { Button, Input, Spin, Tag } from 'antd'
import React from 'react';
import { AssistantActionsType } from '../actions';
import { DatasourceProps } from '../ContextBuilder/Datasource';
import { v4 as uuid } from 'uuid'
import { assistantPrompt } from '../assistantUtils'
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { ChatMessageProps } from '../ChatMessages/ChatMessage';
const { TextArea } = Input;


export interface AssistantProps {
    context?: DatasourceProps,
    actions: AssistantActionsType,
    conversation: ChatMessageProps[]
}

export interface AssistantPromptState extends AssistantProps {
    prompt: string;
    isLoading: boolean;
    attachments: any[]; // ? what type ?
}

export class AssistantPrompt extends React.Component<AssistantProps, AssistantPromptState> {

    constructor(props: AssistantProps) {
        super(props)
        this.state = {
            ...props,
            prompt: '',
            isLoading: false,
            attachments: []
        }
    }

    componentDidMount() {

    }

    componentDidUpdate(prevProps: Readonly<AssistantProps>, prevState: Readonly<AssistantPromptState>, snapshot?: any): void {
        if (prevProps.context !== this.props.context) {
            this.setState({
                context: this.props.context
            })
        }

        if (prevProps.conversation !== this.props.conversation){
            this.setState({
                conversation: this.props.conversation
            })
        }
    }

    handlePrompt = async () => {
        this.setState({ isLoading: true })
        
        const promptId = uuid()
        const {prompt , context, conversation} = this.state
        if( prompt.length > 0 && context){
            this.props.actions.newPrompt(promptId, { prompt })
            const { ai_response, sql_query, viz_type  } = await assistantPrompt(context,conversation, prompt)
            this.props.actions.updatePromptResponse(promptId, {
                message: ai_response,
                sql_query: sql_query? sql_query : "",
                viz_type: viz_type,
                can_be_visualized: viz_type ? "true" : "false"
            })
        }
        
        this.setState({ isLoading: false, prompt: '' })
    }

    handlePromptInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({ prompt: event.target.value })
        console.log(event.target.value)
    }

    render() {

        const { isLoading, prompt, context } = this.state
        

        return (
            <div style={{
                flex: '0 1 auto',
                alignSelf: 'flex-end',
                backgroundColor: 'white',
                borderRadius: '15px',
                width: '100%',
                position: 'relative',
                margin: '24px'
            }}>
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
                        paddingBottom: '16px'
                    }}
                    autoSize={{
                        minRows: 3,
                        maxRows: 10
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
                        <Tag icon={<ExclamationCircleOutlined/>} color='error'> No context selected!! </Tag>
                    </div>
                )}

                <div
                    style={{
                        display: 'flex',
                        flex: 'row',
                        position: 'absolute',
                        right: '12px',
                        bottom: '12px'
                    }}>
                    <span style={{
                        cursor: 'pointer',
                        height: '40px',
                        width: '40px',
                        alignContent: 'center',
                        alignItems: 'center',
                    }}>
                        <img src='/static/assets/images/assistant_prompt_attachment.svg' alt='Attachment' />
                    </span>

                    <Button disabled={!context ||  isLoading} onClick={this.handlePrompt} style={{
                        padding: '20px',
                        background: `linear-gradient(90deg, #7472FF 0%, #265AD0 100%)`,
                        color: 'white',
                        border: 'none',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        width: 'fill-content',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        alignContent: 'center',
                    }}>
                        <span style={{
                            height: '40px',
                            width: '40px',
                            color: 'white',
                            alignContent: 'center',
                            alignItems: 'center',
                        }}>
                            {isLoading && <Spin size='small' />}
                            {!isLoading && <img src='/static/assets/images/assistant_prompt_send.svg' alt='v_logo' />}

                        </span> 
                        {/* &nbsp;Visualize&nbsp; */}
                    </Button>
                </div>

            </div>
        )
    }

}