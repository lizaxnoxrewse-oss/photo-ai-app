
export interface PresetBlock {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
}

export interface CustomTextConfig {
  text: string;
  style: string;
}

export interface PhotoPreset {
  id: string;
  blocks: PresetBlock[];
  originalImage?: string;
  aspectRatio?: string;
  styleOverride?: string;
  textConfig?: CustomTextConfig;
  timestamp: number;
}

export enum BlockId {
  SUBJECT = "subject_context",
  STYLE = "style_visual_language",
  LIGHTING = "lighting_design",
  COMPOSITION = "composition_framing",
  CAMERA = "camera_optics",
  COLOR = "color_tonality",
  DETAILS = "details_texture",
  MOOD = "mood_emotional_tone",
  POST = "post_processing_logic",
  NEGATIVE = "negative_parameters"
}
