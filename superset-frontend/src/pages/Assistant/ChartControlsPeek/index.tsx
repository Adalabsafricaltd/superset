import { Input, Modal, Tooltip } from "antd";
import { getChartControlValues, saveChartExample, getChartExplanation } from "../assistantUtils";
import { useEffect, useState } from "react";
import { QueryFormData } from "@superset-ui/core";
import { getControlsState } from "../../../explore/store"
import { getDomAsImageByteArray } from "../contextUtils";
import Loading from "src/components/Loading";
import Button from "src/components/Button";


/** TODO Get Chart screen shot */

const { TextArea } = Input

function ChartControlsPeek(props: any) {


    const internalProps = {
        controls: props.controls || getControlsState(props, props.formData || props.form_data),
        form_data: props.formData || props.form_data || null,
        datasource: props.datasource || null,
        chart_selector: props.chart_selector || null,
    }

    console.log('ChartControlsPeek => props:', internalProps)

    // ia open state
    const [isOpen, setIsOpen] = useState(false);
    const [formDataLcl, setFormDataLcl] = useState(internalProps.form_data);
    const [chartImage, setChartImage] = useState(null);
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (internalProps.chart_selector && isOpen) {
            getDomAsImageByteArray(internalProps.chart_selector).then(imageData => {
                setChartImage(imageData);
            });
        }
    }, [internalProps.chart_selector, isOpen]);

    useEffect(() => {

        if (!chartImage) {
            return;
        }
        setIsLoading(true);
        // get chart explanation
        getChartExplanation(internalProps.datasource, internalProps.controls, internalProps.form_data, chartImage)
            .then(explanation => {
                setDescription({
                    ...explanation,
                });

            }).finally(() => {
                setIsLoading(false);
            });

    }, [chartImage]);

    const handleSaveExample = () => {
        console.log('ChartControlsPeek => handleSaveExample => To be removed')
        const { controls, form_data, datasource } = internalProps;
        const cleaned_controls = {
            ...controls
        }
        delete cleaned_controls.datasource.user

        let imageData = null;

        if (internalProps.chart_selector) {
            imageData = getDomAsImageByteArray(internalProps.chart_selector);
        }
        // saveChartExample(formDataLcl.viz_type, cleaned_controls, formDataLcl);
    };

    const handleUpdateData = () => {
        const { setExploreControls, onQuery } = props.actions
        // console.log('ChartControlsPeek => handleUpdateData => setExploreControls:', setExploreControls)
        console.log('ChartControlsPeek => handleUpdateData =>:', formDataLcl)
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
        setDescription(textareaValue);
    };

    const handleApplyAssistant = async () => {
        console.log('ChartControlsPeek => handleApplyAssistant: STARTED', props)
        // const { assistant, controls } = props;
        // if (!assistant || !assistant.enabled || !assistant.selected) {
        //     return;
        // }
        // const { selected } = assistant;
        // console.log('ChartControlsPeek => handleApplyAssistant: selected', selected)
        // console.log('ChartControlsPeek => handleApplyAssistant: datasource', controls.datasource.datasource)

        const formData = await getChartControlValues(description, internalProps.controls, formDataLcl);
        // Update current form data with the assistant form data .. new data may not have all the keys
        console.log('===========CONTROL CHECK', formData)
        const newFormData: QueryFormData = {
            ...formDataLcl,
            ...formData
        };
        setFormDataLcl(newFormData);

    };

    return (
        <div
            style={{
                position: 'absolute',
                bottom: '5px',
                right: '5px',
                zIndex: 1000,
            }}
        >
            <Modal
                title="Assistant Chart Instructions"
                visible={isOpen}
                onCancel={handleClose}
                width="50%"
                footer={[
                    <Button key={"controls"} onClick={handleApplyAssistant}>Fetch Assist Controls</Button>,
                    <Button key={"apply"} onClick={handleUpdateData}>Apply Assistant Controls</Button>
                ]}
            >
                <TextArea
                    value={description}
                    onChange={handleTextareaChange}
                    placeholder="Chart creation instructions..."
                />
            </Modal>
            {!isOpen && (
                <Tooltip title="What does this mean?">
                    <img
                        src="/static/assets/images/assistant_logo_b_w.svg"
                        alt="Assistant"
                        style={{ width: '20px', height: '20px', marginRight: '5px' }}
                        onClick={handleOpen}
                    />
                </Tooltip>
            )}
        </div>


    )
}


export default ChartControlsPeek;