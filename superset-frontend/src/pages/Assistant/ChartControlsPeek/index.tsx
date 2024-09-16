import { Button, Image, Modal, Spin, Tooltip } from "antd";
import { getChartControlValues, saveChartExample, getChartExplanation } from "../assistantUtils";
import { useEffect, useState } from "react";
import { QueryFormData } from "@superset-ui/core";
import { getControlsState } from "../../../explore/store"
import { getDomAsImageByteArray } from "../contextUtils";
import Loading from "src/components/Loading";


/** TODO Get Chart screen shot */


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
    const [description, setDescription] = useState<{
        analysis?: string;
        insights?: string;
        recommendations?: string;
        take_away?: string;
    }>({});
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
                bottom: '5px',
                right: '5px',
                zIndex: 1000,
            }}
        >

            <Modal
                title="Assistant Analysis"
                visible={isOpen}
                onCancel={handleClose}
                width="80%"
                footer={[
                    <Button key="back" onClick={handleClose}> Close </Button>,
                    // <Button key="save" onClick={handleUpdateData}> Update Form Data </Button>,
                    // <Button key="apply-assist" onClick={handleApplyAssistant}> Apply Assistant </Button>,
                    // <Button key="save-example" onClick={handleSaveExample}> Save Example </Button>
                ]}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                    }}>
                    <div
                        style={{
                            height: 'wrap-content',
                            maxWidth: '60%',
                        }}
                    >

                        {!chartImage && (
                            <Loading />
                        )}
                        {chartImage && (
                            <>
                                <img src={chartImage} alt="Chart" width={'100%'} />
                                {!isLoading && (
                                    <>
                                        <div>
                                            <h4>Analysis</h4>
                                            <p>{description.analysis}</p>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            height: 'wrap-content',
                            maxWidth: '40%',
                        }}
                    >
                        {isLoading && (
                            <Spin />
                        )}
                        {!isLoading && (
                            <>

                                <div>
                                    <h4>Insights</h4>
                                    <p>{description.insights}</p>
                                </div>
                                <div>
                                    <h4>Recommendations</h4>
                                    <p>{description.recommendations}</p>
                                </div>
                                <div>
                                    <h4>Takeaway</h4>
                                    <p>{description.take_away}</p>
                                </div>
                            </>
                        )}

                    </div>

                </div>

                {/* <textarea
                    value={JSON.stringify(formDataLcl, null, 2)}
                    onChange={handleTextareaChange} // Add the textarea change handler
                    style={{
                        width: '100%',
                        height: 'auto',
                        minHeight: '400px',
                        marginTop: '10px'
                    }}
                /> */}
            </Modal>

            {/* // button with icon /static/assets/images/assistant_logo_b_w.svg */}
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