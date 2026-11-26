import { AddEntryButton } from '@/components/ui/add-entry-button';
import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { Card, ActionRow, ResponsivePair } from '@/components/ui/layout';
import { Typography } from '@/components/ui/typography';
import { TextLink } from '@/components/ui/text-link';

export default function HomeScreen() {
  return (
    <PlaceholderScreen
      patterned
      title="Home"
      description="Record your work and return to your saved entries and drafts."
    >
      <ResponsivePair>
        <Card className="md:flex-1">
          <Typography
            variant="caption"
            className="uppercase tracking-widest text-link"
          >
            A little room to reflect
          </Typography>
          <Typography variant="heading">Start with a moment.</Typography>
          <Typography className="text-muted">
            An accomplishment, a kind word, a lesson learned. Your journal will
            bring them together.
          </Typography>
          <ActionRow>
            <AddEntryButton />
            <TextLink href="/history">Explore your history</TextLink>
          </ActionRow>
        </Card>
        <Card className="md:flex-1">
          <Typography variant="title">Build your story over time.</Typography>
          <Typography className="text-muted">
            Keep your journal organized by company and project.
          </Typography>
          <TextLink href="/entries">Open entries and drafts</TextLink>
          <TextLink href="/companies">View companies</TextLink>
        </Card>
      </ResponsivePair>
    </PlaceholderScreen>
  );
}
