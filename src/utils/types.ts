import { TensorDataType } from "react-native-fast-tflite/lib/typescript/specs/Tflite.nitro";

export type ModelInfo = {
  inputInfo: {
    shape: number[];
    dataType: TensorDataType;
    height: number;
    width: number;
    channels: number;
  };
  outputInfo: { dataType: TensorDataType; size: number };
  isQuantized: boolean;
};

export type Prediction = {
  label: string;
  index: number;
  confidence: number;
};
