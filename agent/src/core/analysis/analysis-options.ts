export type ThienLuongElementSource = "TVTH" | "NP2";
export type ThatSatElementSource = "TVTH Nam Bắc tinh" | "TVTH bài thơ 1";
export type EarthLifeStageSource = "TVTH" | "NP2";
export type ThaiTueElementSource = "TVTH" | "NP1";
export type TuanStrengthReading = "không xét" | "TVTH tr.73–74: mạnh ở cung dương" | "TVTH tr.135–137: mạnh ở cung âm";

export interface AnalysisOptions {
  readonly thienLuongElement: ThienLuongElementSource;
  readonly thatSatElement: ThatSatElementSource;
  readonly earthLifeStages: EarthLifeStageSource;
  readonly thaiTueElement: ThaiTueElementSource;
  readonly tuanStrength: TuanStrengthReading;
}

export const DEFAULT_ANALYSIS_OPTIONS: AnalysisOptions = {
  thienLuongElement: "TVTH",
  thatSatElement: "TVTH Nam Bắc tinh",
  earthLifeStages: "TVTH",
  thaiTueElement: "TVTH",
  tuanStrength: "không xét",
};
