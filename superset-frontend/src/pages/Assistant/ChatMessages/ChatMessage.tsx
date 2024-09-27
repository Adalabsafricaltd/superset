import React from 'react'
import MarkDownPreview from '@uiw/react-markdown-preview'
import { UserOutlined } from '@ant-design/icons'
import  { t } from '@superset-ui/core'
import { InfoCircleOutlined } from '@ant-design/icons'


export interface UserPromptProps {
  prompt: string
}

export interface PromptResponseProps {
  message: string,
  sql_query: string,
  viz_type: any[],
  can_be_visualized: string
}

export interface ChatMessageProps {
  id: string,
  prompt?: UserPromptProps;
  response?: PromptResponseProps;
}


function UserPrompt(props: UserPromptProps) {
  let { prompt } = props;
  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignContent: 'center',
          justifyContent: 'left',
          marginTop: '24px'
        }}
      >
        <div style={{
          height: '36px',
          width: '36px',
          borderRadius: '18px',
          background: '#ddd',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <UserOutlined />
        </div>
        <strong><p style={{ alignSelf: 'center', padding: '8px', fontSize: '16px' }} > { t('You') } </p></strong>
      </div>
      <div style={{ marginLeft: '46px', marginBottom: '16px'}}>
        <MarkDownPreview style={{
          all: 'unset',
          background: '#fff',
          color: '#333'
        }}
          wrapperElement={{
            "data-color-mode": "light"
          }}
          source={prompt} />
      </div>
    </div>
  )
}

function PromptResponse(props: PromptResponseProps) {
  let { message, sql_query, can_be_visualized } = props;
  let complete_message = (sql_query && sql_query.length > 0) ? message + `\n\`\`\` sql\n${sql_query}\n\`\`\`` : message;
  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignContent: 'center',
          justifyContent: 'left'
        }}
      >
        <div style={{
          height: '36px',
          width: '36px',
          borderRadius: '18px',
          background: '#ddd',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <UserOutlined />
        </div>
        <strong><p style={{ alignSelf: 'center', height: '100%', padding: '10px', fontSize: '16px' }} > { t('Assistant') } </p></strong>
      </div>
      <div style={{ marginLeft: '46px', marginTop: '-8px'}}>
        <div style={{ position: 'relative'}}>
          <MarkDownPreview style={{
            all: 'unset',
            background: '#fff',
            color: '#333',
          }}
            wrapperElement={{
              "data-color-mode": "light"
            }}
            source={complete_message} />
          <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
            <InfoCircleOutlined />
          </div>
        </div>
      </div>
    </div>
  )
}
export class ChatMessage extends React.Component<ChatMessageProps> {




  render() {
    const { prompt, response } = this.props;



    return (
      <div
        style={{
         
        }}
      >
        { prompt && <UserPrompt {...prompt} /> }
        {response && <PromptResponse {...response} />}
      </div>
    );
  }
}