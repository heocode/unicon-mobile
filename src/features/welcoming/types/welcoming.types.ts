export type WelcomingIndex = 0 | 1 | 2 | 3;

export type WelcomingTextSegment = Readonly<{
  text: string;
  emphasized?: boolean;
}>;

export type WelcomingSlideConfig = Readonly<{
  id: 'unicon' | 'students' | 'notifications' | 'clubs';
  index: WelcomingIndex;
  title: string;
  subtitle: readonly WelcomingTextSegment[];
  riveSource: number;
  accessibilityLabel: string;
}>;
