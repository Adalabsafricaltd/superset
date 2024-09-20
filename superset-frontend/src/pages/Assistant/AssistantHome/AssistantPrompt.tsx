import { Button, Input, Spin } from 'antd'
import React, { Component } from 'react';
import { AssistantActionsType } from '../actions';
import { DatasourceProps } from '../ContextBuilder/Datasource';
import { v4 as uuid } from 'uuid'
import { prompt } from '../assistantUtils'
const { TextArea } = Input;


export interface AssistantProps {
    context?: DatasourceProps,
    actions: AssistantActionsType
}

export interface AssistantPromptState {
    prompt: string;
    isLoading: boolean;
    attachments: any[]; // ? what type ?
}

export class AssistantPrompt extends React.Component<AssistantProps, AssistantPromptState> {

    constructor(props: AssistantProps) {
        super(props)
        this.state = {
            prompt: '',
            isLoading: false,
            attachments: []
        }
    }

    handlePrompt = async () => {
        this.setState({ isLoading: true })
        // is New ?
        const promptId = uuid()
        const inputPrompt = this.state.prompt
        this.props.actions.newPrompt(promptId, { prompt: inputPrompt })
        // Get response
        let { context } = this.props
        console.log("handlePrompt => ", promptId, inputPrompt, context)
        if (context) {
            const response = await prompt(context, this.state.prompt)
            // TODO send response action

        }
        this.props.actions.updatePromptResponse(promptId, { message: "some message that may make sense", sql_query: "SELECT SOME DATA FROM DATABASE", can_be_visualized: "true" })

        this.setState({ isLoading: false, prompt: '' })
    }

    handlePromptInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({ prompt: event.target.value })
        console.log(event.target.value)
    }
    render() {

        const { isLoading, prompt } = this.state
        console.log("Prompt state:", this.state)

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

                    <Button disabled={isLoading} onClick={this.handlePrompt} style={{
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

                        </span> &nbsp;Visualize&nbsp;
                    </Button>


                </div>

            </div>
        )
    }

}