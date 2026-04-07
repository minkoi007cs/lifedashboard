export type ThemePreset =
  | 'aurora'
  | 'modernist'
  | 'heritage'
  | 'vintage'
  | 'noir';

export type ThemePresetDefinition = {
  value: ThemePreset;
  label: string;
  era: string;
  description: string;
  mood: string;
  preview: {
    from: string;
    via: string;
    to: string;
    surface: string;
    ink: string;
  };
};

export const themePresets: ThemePresetDefinition[] = [
  {
    value: 'aurora',
    label: 'Aurora Pop',
    era: 'Playful default',
    description: 'Warm gradients, rounded glass cards and upbeat energy.',
    mood: 'Bright, cheerful, social',
    preview: {
      from: '#fb923c',
      via: '#ec4899',
      to: '#d946ef',
      surface: '#fff7ed',
      ink: '#172033',
    },
  },
  {
    value: 'modernist',
    label: 'Modernist',
    era: 'Ultra modern',
    description: 'Sharper frames, cool contrast and restrained digital polish.',
    mood: 'Crisp, technical, focused',
    preview: {
      from: '#0f172a',
      via: '#0891b2',
      to: '#38bdf8',
      surface: '#eef6ff',
      ink: '#08111f',
    },
  },
  {
    value: 'heritage',
    label: 'Heritage',
    era: 'Very classic',
    description: 'Editorial serif voice, ivory panels and tailored accents.',
    mood: 'Calm, formal, timeless',
    preview: {
      from: '#7c2d12',
      via: '#a16207',
      to: '#f59e0b',
      surface: '#f9f4ea',
      ink: '#2f1e14',
    },
  },
  {
    value: 'vintage',
    label: 'Vintage Postcard',
    era: 'Retro vintage',
    description: 'Faded paper tones, olive accents and nostalgic framing.',
    mood: 'Cozy, nostalgic, analog',
    preview: {
      from: '#6b5d3d',
      via: '#8b7a4f',
      to: '#c7a86a',
      surface: '#f4ecd7',
      ink: '#3e3421',
    },
  },
  {
    value: 'noir',
    label: 'Noir Signal',
    era: 'Night modern',
    description: 'Inky layers, neon highlights and cinematic contrast.',
    mood: 'Bold, moody, futuristic',
    preview: {
      from: '#111827',
      via: '#7c3aed',
      to: '#22d3ee',
      surface: '#151a27',
      ink: '#ecfeff',
    },
  },
];
