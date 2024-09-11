import { Button, Modal, Tooltip } from "antd";
import { getChartControlValues, saveChartExample } from "../assistantUtils";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { QueryFormData } from "@superset-ui/core";


function ChartControlsPeek(props: any) {
    const dispatch = useDispatch();

    console.log('ChartControlsPeek => props:', props)

    // ia open state
    const [isOpen, setIsOpen] = useState(false);
    const [formDataLcl, setFormDataLcl] = useState(props.form_data);

    const handleSaveExample = () => {
        console.log('ChartControlsPeek => handleSaveExample => To be removed')
        const { controls, form_data, datasource } = props;
        const cleaned_controls = {
            ...controls
        }
        delete cleaned_controls.datasource.user
        // saveChartExample(formDataLcl.viz_type, cleaned_controls, formDataLcl);
    };

    const handleUpdateData = () => {
        const { setExploreControls, onQuery } = props.actions
        console.log('ChartControlsPeek => handleUpdateData => setExploreControls:', setExploreControls)
        console.log('ChartControlsPeek => handleUpdateData => onQuery:', onQuery)
        setExploreControls(formDataLcl);
        onQuery();
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleOpen = () => {
        setIsOpen(true);
    }

    const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const textareaValue = event.target.value;
        try {
            const formQuery: QueryFormData = JSON.parse(textareaValue);
            // Do something with the formQuery object
            console.log('FormQuery:', formQuery);
            setFormDataLcl(formQuery);
        } catch (error) {
            console.error('Invalid JSON format');
        }
    };

    const handleApplyAssistant = async () => {
        console.log('ChartControlsPeek => handleApplyAssistant: STARTED', props)
        const { assistant, controls } = props;
        if (!assistant || !assistant.enabled || !assistant.selected) {
            return;
        }
        const { selected } = assistant;
        console.log('ChartControlsPeek => handleApplyAssistant: selected', selected)
        console.log('ChartControlsPeek => handleApplyAssistant: datasource', controls.datasource.datasource)

        const formData = await getChartControlValues(selected.llm_optimized, selected.viz_type, controls.datasource.datasource);
        // Update current form data with the assistant form data .. new data may not have all the keys
        const newFormData: QueryFormData = {
            ...formDataLcl,
            ...formData
        };
        setFormDataLcl(newFormData);

    };

    return (
        // div stuck to top right corner of parent container
        <div
            style={{
                position: 'absolute',
                top: '20px',
                right: '34px',
                zIndex: 1000,
            }}
        >

            <Modal
                title="Form Data Values"
                visible={isOpen}
                onCancel={handleClose}
                width="80%"
                footer={[
                    <Button key="back" onClick={handleClose}> Close </Button>,
                    <Button key="save" onClick={handleUpdateData}> Update Form Data </Button>,
                    <Button key="apply-assist" onClick={handleApplyAssistant}> Apply Assistant </Button>,
                    <Button key="save-example" onClick={handleSaveExample}> Save Example </Button>
                ]}
            >
                <textarea
                    value={JSON.stringify(formDataLcl, null, 2)}
                    onChange={handleTextareaChange} // Add the textarea change handler
                    style={{
                        width: '100%',
                        height: 'auto',
                        minHeight: '400px',
                        marginTop: '10px'
                    }}
                />
            </Modal>

            {/* // button with icon /static/assets/images/assistant_logo_b_w.svg */}

            <Tooltip title="What does this mean?">
            <img 
                src="/static/assets/images/assistant_logo_b_w.svg" 
                alt="Assistant" 
                style={{ width: '20px', height: '20px', marginRight: '5px' }} 
                onClick={handleOpen}
                />
            </Tooltip>

        </div>
    )
}

export default ChartControlsPeek;