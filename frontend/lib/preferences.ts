export type Preferences = {
  connection_goal: string;
  connection_style: string;
  exclusivity: string;
  meeting_frequency: string;
};

export const preferenceOptions = {
  connection_goal: [
    ["situationship", "Situationship"],
    ["casual_dating", "Casual dating"],
    ["companionship", "Companionship"],
    ["friendship_romantic", "Friendship with romantic potential"],
    ["open_to_relationship", "Open to relationship"],
  ],
  connection_style: [
    ["emotional", "Emotional"],
    ["romantic", "Romantic"],
    ["physical", "Physical"],
    ["social", "Social/companionship"],
    ["combination", "Combination"],
  ],
  exclusivity: [["yes", "Yes"], ["no", "No"], ["not_sure", "Not sure"]],
  meeting_frequency: [
    ["weekly", "Once a week"],
    ["monthly", "2-3 times a month"],
    ["occasionally", "Occasionally"],
    ["flexible", "Flexible"],
  ],
} as const;

export type PreferenceField = keyof typeof preferenceOptions;

export const preferenceSections: { key: PreferenceField; title: string; description: string }[] = [
  { key: "connection_goal", title: "Connection goal", description: "What kind of connection are you open to?" },
  { key: "connection_style", title: "Connection style", description: "What would you like your connection to feel like?" },
  { key: "exclusivity", title: "Exclusivity", description: "How do you feel about an exclusive connection?" },
  { key: "meeting_frequency", title: "Meeting frequency", description: "How often would you like to spend time together?" },
];
