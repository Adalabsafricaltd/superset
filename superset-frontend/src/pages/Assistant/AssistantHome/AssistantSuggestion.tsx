import { readableColor, adjustOpacity } from '../contextUtils';

/**
 * Component that displays the single suggestion for the assistant
 */

/**
 * Props
 */

export interface AssistantSuggestionProps {
    title: string;
    suggestion: string;
    backgroundColor?: string; // default color: white with .5 opacity
}

/**
 * AssistantSuggestion Component
 */
export function AssistantSuggestion(props: AssistantSuggestionProps | any) {

    // bg color ensure at most 50% opacity
    const bg = adjustOpacity(props.backgroundColor || '#FFFFFF', .8)
    const textColor = readableColor(bg)

    return (
        <div style={{
            backgroundColor: bg,
            padding: '8px',
            maxWidth: '250px',
            overflow: 'hidden',
            borderRadius: '5px'
        }}>
            <h5 style={{
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                color: textColor,
            }}>{props.title}</h5>
            <p style={{
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                fontSize: '12px',
                color: textColor
            }}>{props.suggestion}</p>
        </div>
    );
}