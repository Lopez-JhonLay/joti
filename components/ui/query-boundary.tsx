import { Component, type PropsWithChildren } from 'react';
import { Button } from '@/components/ui/button';
import { ScreenFrame } from '@/components/ui/screen-frame';
import { Feedback } from '@/components/ui/feedback';
import { requestErrorMessage } from '@/lib/request-errors';

export class QueryBoundary extends Component<
  PropsWithChildren<{ title: string; onBack?: () => void }>,
  { error: unknown; attempt: number }
> {
  state = { error: null as unknown, attempt: 0 };
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  render() {
    if (this.state.error)
      return (
        <ScreenFrame title={this.props.title} onBack={this.props.onBack}>
          <Feedback error message={requestErrorMessage(this.state.error)} />
          <Button
            title="Retry"
            variant="secondary"
            onPress={() =>
              this.setState(({ attempt }) => ({
                error: null,
                attempt: attempt + 1,
              }))
            }
          />
        </ScreenFrame>
      );
    return (
      <QueryAttempt key={this.state.attempt}>
        {this.props.children}
      </QueryAttempt>
    );
  }
}

function QueryAttempt({ children }: PropsWithChildren) {
  return children;
}
