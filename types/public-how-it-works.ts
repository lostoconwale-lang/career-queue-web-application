export interface PublicHowItWorksStepDTO {
  word: string;
  imageUrl: string;
  title: string;
  body: string;
}

// The "How it works" content shown to visitors on the home page.
export interface PublicHowItWorksDTO {
  eyebrow: string;
  subtext: string;
  steps: PublicHowItWorksStepDTO[];
}
