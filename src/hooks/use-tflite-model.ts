import { useCallback } from "react";
import { Platform } from "react-native";
import {
  TensorflowModelDelegate,
  useTensorflowModel,
} from "react-native-fast-tflite";
import { Frame } from "react-native-vision-camera";
import { DataType, useResizer } from "react-native-vision-camera-resizer";

type Props = {
  modelPath: string;
  useGpu: boolean;
};
const allowedDataTypes = ["int8", "uint8", "float32", "float16"] as const;
type AllowedDataTypes = typeof allowedDataTypes;

const isAllowedDataType = (value: unknown): value is AllowedDataTypes => {
  return allowedDataTypes.some((dataType) => dataType === value);
};

const hostIsAndroid = Platform.OS === "android";

const useClassificationModel = ({ modelPath, useGpu = false }: Props) => {
  const delegate: TensorflowModelDelegate[] = useGpu
    ? [hostIsAndroid ? "android-gpu" : "core-ml"]
    : [];
  const { model, state } = useTensorflowModel(require(modelPath), delegate);

  const inputTensor = model?.inputs[0];
  const outputTensor = model?.outputs[0];

  const {
    resizer,
    state: resizerState,
    error,
  } = useResizer({
    height: inputTensor?.shape[1] ?? 0,
    width: inputTensor?.shape[2] ?? 0,
    channelOrder: "rgb",
    dataType: isAllowedDataType(inputTensor?.dataType)
      ? (inputTensor.dataType as DataType)
      : "int8",
    scaleMode: "contain",
    pixelLayout: "interleaved",
  });

  if (inputTensor && !isAllowedDataType(inputTensor.dataType))
    throw new Error("Unsupported input data type");
  if (outputTensor && !isAllowedDataType(outputTensor.dataType))
    throw new Error("Unsupported output data type");

  const isReady = state !== "loaded" || resizerState !== "ready";

  const runInference = useCallback((frame: Frame) => {
    if (!resizer || !model) throw new Error("model not initialised");
    const resizedFrame = resizer.resize(frame);
    const output = model.runSync([resizedFrame.getPixelBuffer()]);

    switch (outputTensor?.dataType) {
      case "float32":
        return new Float32Array(output[0]);
      case "float16":
        return new Float16Array(output[0]);
      default:
        return new Int8Array(output[0]);
    }
  }, []);

  return {
    model,
    isReady,
    runInference,
    error,
  };
};

export default useClassificationModel;
