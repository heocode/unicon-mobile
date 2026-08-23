import type { WelcomingSlideConfig } from '../types/welcoming.types';

export const WELCOMING_STATE_MACHINE = 'WelcomingIllustration';
export const WELCOMING_VIEW_MODEL = 'WelcomingIllustration';

export const welcomingSlides = [
  {
    id: 'unicon',
    index: 0,
    title: 'Unicon',
    subtitle: [
      { text: 'Everything around ' },
      { text: 'your college life', emphasized: true },
      { text: ',\n' },
      { text: 'in one place', emphasized: true },
      { text: '.' },
    ],
    riveSource: require('../../../../assets/rive/unicon.riv'),
    accessibilityLabel: 'Unicon illustration',
  },
  {
    id: 'students',
    index: 1,
    title: 'Students Only',
    subtitle: [
      { text: 'Everyone here is ' },
      { text: 'verified', emphasized: true },
      { text: '\nthrough their ' },
      { text: 'college email', emphasized: true },
      { text: '.' },
    ],
    riveSource: require('../../../../assets/rive/students.riv'),
    accessibilityLabel: 'Verified student illustration',
  },
  {
    id: 'notifications',
    index: 2,
    title: 'Stay Updated',
    subtitle: [
      { text: 'See what’s happening around college\nand ' },
      { text: 'never miss an update', emphasized: true },
      { text: '.' },
    ],
    riveSource: require('../../../../assets/rive/notifications.riv'),
    accessibilityLabel: 'College notification illustration',
  },
  {
    id: 'clubs',
    index: 3,
    title: 'Clubs',
    subtitle: [
      { text: 'Find ' },
      { text: 'clubs and communities', emphasized: true },
      { text: '\nyou’d ' },
      { text: 'actually want to join', emphasized: true },
      { text: '.' },
    ],
    riveSource: require('../../../../assets/rive/clubs.riv'),
    accessibilityLabel: 'Student clubs illustration',
  },
] as const satisfies readonly WelcomingSlideConfig[];
