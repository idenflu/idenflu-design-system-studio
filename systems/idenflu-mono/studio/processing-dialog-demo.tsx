import * as React from 'react';
import { Button, Dialog, Icon, NovaSpinner, Progress } from '@idenflu/mono-react';
import { Section } from './demo-layout';

type Operation = 'sync' | 'batch' | 'blocking';
const total = 120;

export function ProcessingDialogDemo() {
  const [operation, setOperation] = React.useState<Operation | null>(null);
  const [processed, setProcessed] = React.useState(0);
  const [feedback, setFeedback] = React.useState('');
  const action = React.useRef<HTMLButtonElement>(null);
  const id = React.useId();
  const complete = processed === total;
  const blocking = operation === 'blocking';
  const title = operation === 'batch' ? '프로젝트 일괄 처리' : blocking ? '변경사항 적용' : '데이터 동기화';

  React.useEffect(() => {
    if (!operation || complete) return;
    const timer = window.setInterval(() => setProcessed(value => Math.min(value + 12, total)), 450);
    return () => window.clearInterval(timer);
  }, [operation, complete]);

  React.useEffect(() => {
    if (!operation || !complete) return;
    if (blocking) {
      setFeedback('변경사항을 적용했습니다.');
      setOperation(null);
    } else action.current?.focus();
  }, [operation, complete, blocking]);

  const start = (next: Operation) => {
    setProcessed(0);
    setFeedback('');
    setOperation(next);
  };
  const close = () => {
    setFeedback(complete ? `${title}를 완료했습니다.` : `${title}를 취소했습니다.`);
    setOperation(null);
  };

  return <Section title="처리 중 인디케이터" description="스피너형·진행률형과 버튼 없이 완료를 기다리는 유형을 비교합니다. 예시는 잠시 후 완료됩니다.">
    <div className="react-studio-sample-grid">
      <div className="react-studio-example">
        <h3 className="react-studio-example-title">스피너형</h3>
        <p className="react-studio-caption">NOVA 스피너와 상태 메시지로 처리 중임을 알립니다.</p>
        <div className="react-studio-row"><Button variant="outline" onClick={() => start('sync')}>동기화 시작</Button></div>
      </div>
      <div className="react-studio-example">
        <h3 className="react-studio-example-title">진행률형</h3>
        <p className="react-studio-caption">진행률과 처리 건수로 작업이 얼마나 진행됐는지 보여줍니다.</p>
        <div className="react-studio-row"><Button variant="outline" onClick={() => start('batch')}>일괄 처리 시작</Button></div>
      </div>
      <div className="react-studio-example">
        <h3 className="react-studio-example-title">버튼 없는 처리형</h3>
        <p className="react-studio-caption">취소·닫기 버튼 없이 처리 상태를 보여주고 완료되면 자동으로 닫힙니다.</p>
        <div className="react-studio-row"><Button variant="outline" onClick={() => start('blocking')}>버튼 없는 처리 시작</Button></div>
      </div>
    </div>
    <p role="status" className="component-helper">{feedback}</p>
    <Dialog open={operation !== null} onOpenChange={open => { if (!open && !blocking) close(); }}
      aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}>
      <h2 id={`${id}-title`}>{title}</h2>
      <p id={`${id}-description`}>{operation === 'batch' ? '120개 프로젝트의 상태를 순서대로 갱신합니다.' : blocking ? '워크스페이스의 변경사항을 반영합니다.' : '워크스페이스 데이터를 최신 상태로 맞춥니다.'}</p>
      <div className="react-studio-processing-state">
        <div className={`react-studio-processing-visual${complete ? ' is-complete' : ''}`} aria-hidden="true">
          {complete ? <Icon name="check" /> : <NovaSpinner size={56} />}
        </div>
        <div className="react-studio-processing-message" role="status" aria-atomic="true">
          <strong>{complete ? '처리를 완료했습니다' : operation === 'batch' ? '프로젝트를 처리하고 있습니다' : blocking ? '변경사항을 적용하고 있습니다' : '데이터를 동기화하고 있습니다'}</strong>
          <p>{blocking ? '완료되면 자동으로 닫힙니다.' : complete ? '결과를 확인하고 창을 닫아주세요.' : '잠시만 기다려주세요.'}</p>
        </div>
        {operation === 'batch' && <div className="react-studio-processing-progress">
          <div aria-hidden="true"><span>{processed} / {total}개 처리</span><strong>{Math.round(processed / total * 100)}%</strong></div>
          <Progress value={processed} max={total} variant={complete ? 'success' : 'primary'} aria-label="프로젝트 처리 진행률" aria-valuetext={`${total}개 중 ${processed}개 처리`} />
        </div>}
      </div>
      {!blocking && <div className="dialog-actions"><Button ref={action} variant={complete ? 'default' : 'outline'} onClick={close}>{complete ? '확인' : '작업 취소'}</Button></div>}
    </Dialog>
    <p className="react-studio-caption">스피너형·진행률형은 작업 취소 버튼이나 Escape로 취소합니다. 버튼 없는 처리형은 Escape·배경 클릭으로 닫히지 않으며, 완료 후 자동으로 닫히고 실행 버튼으로 돌아갑니다.</p>
  </Section>;
}
