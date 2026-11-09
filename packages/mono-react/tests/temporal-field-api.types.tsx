import * as React from 'react';
import { NumberField, DatePicker, DateRangePicker, TimePicker, DateTimePicker, DateTimeRangePicker } from '../dist/index.js';

const input = React.createRef<HTMLInputElement>();
const endInput = React.createRef<HTMLInputElement>();
const button = React.createRef<HTMLButtonElement>();
const shared = { label:'입력', 'aria-describedby':'external-help', 'aria-invalid':false } as const;

<NumberField {...shared} ref={input} helperText={<span>숫자 안내</span>} error="숫자를 확인하세요." />;
<DatePicker {...shared} ref={input} />;
<TimePicker {...shared} ref={input} />;
<DateTimePicker {...shared} ref={input} />;
<DateRangePicker {...shared} ref={input} endInputRef={endInput} />;
<DateTimeRangePicker {...shared} ref={input} endInputRef={node => { node?.focus(); }} />;

// @ts-expect-error NumberField exposes its input, not a stepper button.
<NumberField {...shared} ref={button} />;
// @ts-expect-error DatePicker exposes its input, not its calendar trigger.
<DatePicker {...shared} ref={button} />;
// @ts-expect-error TimePicker exposes its visible input.
<TimePicker {...shared} ref={button} />;
// @ts-expect-error DateTimePicker exposes its visible input.
<DateTimePicker {...shared} ref={button} />;
// @ts-expect-error Range refs both expose inputs.
<DateRangePicker {...shared} ref={input} endInputRef={button} />;
// @ts-expect-error The standard range ref exposes the start input.
<DateTimeRangePicker {...shared} ref={button} />;
// @ts-expect-error Field errors stay strings because they set native custom validity.
<NumberField {...shared} error={<span>오류</span>} />;
// @ts-expect-error Temporal errors also retain their native validity string contract.
<DateTimeRangePicker {...shared} error={<span>오류</span>} />;
