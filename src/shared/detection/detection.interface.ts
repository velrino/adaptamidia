export interface IApiDeepFaceGenderResult {
  Woman: number;
  Man: number;
}

export interface IApiDeepFaceRaceResult {
  asian: number;
  indian: number;
  black: number;
  white: number;
  'middle eastern': number;
  'latino hispanic': number;
}

export interface IApiDeepFaceEmotionResult {
  angry: number;
  disgust: number;
  fear: number;
  happy: number;
  sad: number;
  surprise: number;
  neutral: number;
}

export interface IApiDeepFaceAgeResult {
  max: number;
  min: number;
  average: number;
}

export interface IApiDeepFaceAnalysisResult {
  gender: IApiDeepFaceGenderResult;
  race: IApiDeepFaceRaceResult;
  emotion: IApiDeepFaceEmotionResult;
  men: number;
  women: number;
  total: number;
  age: IApiDeepFaceAgeResult;
}

export interface IApiYoloResult {
  people: number;
  confidence: number;
}

export const ApiYoloResultDefault: IApiYoloResult = {
  people: 0,
  confidence: 0,
};

export const ApiDeepFaceAnalysisResult: IApiDeepFaceAnalysisResult = {
  gender: {
    Woman: 0,
    Man: 0,
  },
  race: {
    asian: 0,
    indian: 0,
    black: 0,
    white: 0,
    'middle eastern': 0,
    'latino hispanic': 0,
  },
  emotion: {
    angry: 0,
    disgust: 0,
    fear: 0,
    happy: 0,
    sad: 0,
    surprise: 0,
    neutral: 0,
  },
  men: 0,
  women: 0,
  total: 0,
  age: {
    max: 0,
    min: 0,
    average: 0,
  },
};

export interface IApiDetectInsightface {
  gender: {
    Woman: number;
    Man: number;
  };
  men: number;
  women: number;
  total: number;
  age: {
    max: number;
    min: number;
    average: number;
  };
  method?: string;
}

export const ApiDetectInsightfaceDefault: IApiDetectInsightface = {
  gender: {
    Woman: 0,
    Man: 0,
  },
  men: 0,
  women: 0,
  total: 0,
  age: {
    max: 0,
    min: 0,
    average: 0,
  },
};
