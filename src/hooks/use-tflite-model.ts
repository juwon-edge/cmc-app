import { dataTypeToArrayTypeMap, isAllowedDataType } from "@/utils/helper";
import { ModelMetadata } from "@/utils/types";
import { useCallback } from "react";
import { Platform } from "react-native";
import {
  TensorflowModelDelegate,
  useTensorflowModel,
} from "react-native-fast-tflite";
import { Frame } from "react-native-vision-camera";
import { useResizer } from "react-native-vision-camera-resizer";

type Props = {
  modelPath: string;
  modelMetadata: ModelMetadata;
  useGpu: boolean;
};

const hostIsAndroid = Platform.OS === "android";

const useTFLiteModel = ({
  modelPath,
  modelMetadata,
  useGpu = false,
}: Props) => {
  const delegate: TensorflowModelDelegate[] = useGpu
    ? [hostIsAndroid ? "android-gpu" : "core-ml"]
    : [];
  const { model, state } = useTensorflowModel(require(modelPath), delegate);
  // const dequantizedOuputArray = useMemo(() => {
  //   if (!model) return new Float32Array();
  //   const output_shape = model.outputs[0].shape;
  //   const output_size = output_shape.reduce(
  //     (prev, current) => prev * current,
  //     1,
  //   );
  //   return new Float32Array(output_size);
  // }, []);

  const {
    resizer,
    state: resizerState,
    error,
  } = useResizer({
    height: model?.inputs[0].shape[1] ?? 0,
    width: model?.inputs[0].shape[2] ?? 0,
    channelOrder: "rgb",
    dataType: "uint8",
    scaleMode: "contain",
    pixelLayout: "interleaved",
  });

  const isReady = state !== "loaded" || resizerState !== "ready";

  const runInference = useCallback((frame: Frame, disposeFrame = true) => {
    if (!resizer || !model) throw new Error("model not initialised");

    const inputTensor = model.inputs[0];
    const outputTensor = model.outputs[0];
    const modelQuantized =
      inputTensor.dataType === "uint8" || inputTensor.dataType === "int8";

    if (!isAllowedDataType(inputTensor.dataType))
      throw new Error("Unsupported input data type");
    if (!isAllowedDataType(outputTensor.dataType))
      throw new Error("Unsupported output data type");

    const resizedFrame = resizer.resize(frame);
    if (disposeFrame) frame.dispose();
    const sharedBufferArray = new Uint8Array(resizedFrame.getPixelBuffer());
    const InputDataArray = dataTypeToArrayTypeMap(inputTensor.dataType);
    let pixelArray;
    if (modelQuantized) {
      // Quantized model
      pixelArray = new InputDataArray(sharedBufferArray.length);
      const scale = modelMetadata.normalised
        ? modelMetadata.quantization.input.scale * 255
        : modelMetadata.quantization.input.scale;
      const zeroPoint = modelMetadata.quantization.input.zeroPoint;
      for (let index = 0; index < sharedBufferArray.length; index++)
        pixelArray[index] = Math.round(
          sharedBufferArray[index] / scale + zeroPoint,
        );
    } else {
      pixelArray = new InputDataArray(sharedBufferArray);
      if (modelMetadata.normalised)
        for (let index = 0; index < pixelArray.length; index++)
          pixelArray[index] /= 255.0;
    }
    resizedFrame.dispose();
    const output = model.runSync([pixelArray.buffer]);
    const OutputDataArray = dataTypeToArrayTypeMap(outputTensor.dataType);
    const rawOutputArray = new OutputDataArray(output[0]);
    if (modelQuantized) {
      const dequantizedOuputArray = new Float32Array(rawOutputArray.length);
      const scale = modelMetadata.quantization.output.scale;
      const zeroPoint = modelMetadata.quantization.output.zeroPoint;
      for (let index = 0; index < rawOutputArray.length; index++)
        dequantizedOuputArray[index] =
          (rawOutputArray[index] - zeroPoint) * scale;
      return dequantizedOuputArray;
    }

    return rawOutputArray;
  }, []);
  return {
    model,
    isReady,
    runInference,
    error,
  };
};

export default useTFLiteModel;
