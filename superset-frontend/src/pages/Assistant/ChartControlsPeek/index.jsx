import { Input, Modal, Tooltip, Button } from 'antd';
import { useState } from 'react';
import { getControlsState } from '../../../explore/store';
import { getChartControlValues } from '../assistantUtils';

const { TextArea } = Input;

function ChartControlsPeek(props) {
  const internalProps = {
    controls:
      props.controls ||
      getControlsState(props, props.formData || props.form_data),
    form_data: props.formData || props.form_data || null,
    datasource: props.datasource || null,
    chart_selector: props.chart_selector || null,
  };
  const [isOpen, setIsOpen] = useState(false);
  const [formDataLcl, setFormDataLcl] = useState(internalProps.form_data);
  const [description, setDescription] = useState('');
  const handleUpdateData = () => {
    const { setExploreControls, onQuery } = props.actions;
    setExploreControls(formDataLcl);
    onQuery();
  };
  const handleClose = () => {
    setIsOpen(false);
  };
  const handleOpen = () => {
    setIsOpen(true);
  };
  const handleTextareaChange = (event) => {
    const textareaValue = event.target.value;
    setDescription(textareaValue);
  };
  const handleApplyAssistant = async () => {
    console.log('ChartControlsPeek => handleApplyAssistant: STARTED', props);
    const formData = await getChartControlValues(
      description,
      internalProps.controls,
      formDataLcl,
    );
    // Update current form data with the assistant form data .. new data may not have all the keys
    const newFormData = {
      ...formDataLcl,
      ...formData,
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
          <Button key={'controls'} onClick={handleApplyAssistant}>
            Fetch Assist Controls
          </Button>,
          <Button key={'apply'} onClick={handleUpdateData}>
            Apply Assistant Controls
          </Button>,
        ]}
      >
        <TextArea
          value={description}
          onChange={handleTextareaChange}
          placeholder="Chart creation instructions..."
        />
      </Modal>
      {!isOpen && (
        <Tooltip title="Peek controls?">
          <img
            src="/static/assets/images/assistant_logo_b_w.svg"
            alt="Assistant"
            style={{ width: '20px', height: '20px', marginRight: '5px', cursor: 'pointer' }}
            onClick={handleOpen}
          />
        </Tooltip>
      )}
    </div>
  );
}export default ChartControlsPeek;