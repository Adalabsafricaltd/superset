import { Button, Image, Modal, Spin, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { getDomAsImageByteArray } from "../contextUtils";
import { getChartControlValues, getChartExplanation } from "../assistantUtils";
import { getControlsState } from "../../../explore/store"
import Loading from "src/components/Loading";


export interface ChartExplainerProps {
    formData: FormData
}

export function ChartExplainer(props: any) {

    const internalProps = {
        controls: props.controls || getControlsState(props, props.formData || props.form_data),
        form_data: props.formData || props.form_data || null,
        datasource: props.datasource || null,
        chart_selector: props.chart_selector || null,
    }

    console.log('ChartExplainer => props:', internalProps)

    const [isOpen, setIsOpen] = useState(false);
    const [chartImage, setChartImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [description, setDescription] = useState<{
        analysis?: string;
        insights?: string;
        recommendations?: string;
        take_away?: string;
    }>({});

    
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

    
    const handleClose = () => {
        setIsOpen(false);
    };

    const handleOpen = () => {
        setIsOpen(true);
    }
    
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