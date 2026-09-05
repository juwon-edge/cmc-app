import type { ModelInfo, Prediction } from "@/utils/types";
import { useCallback, useState } from "react";
import { Platform } from "react-native";
import {
  loadTensorflowModel,
  TensorflowModel,
  TensorflowModelDelegate,
} from "react-native-fast-tflite";
import { Frame } from "react-native-vision-camera";
import { useResizer } from "react-native-vision-camera-resizer";

export function useTFLiteModel() {
  const [model, setModel] = useState<TensorflowModel | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { resizer, state: resizerState } = useResizer({
    height: modelInfo?.inputInfo.height || 0,
    width: modelInfo?.inputInfo.width || 0,
    channelOrder: "rgb",
    dataType: modelInfo?.inputInfo.dataType === "float32" ? "float32" : "uint8",
    scaleMode: "contain",
    pixelLayout: "interleaved",
  });

  const hostIsAndroid = Platform.OS === "android";

  const loadModel = useCallback(async (fileUri: string, useGpu = false) => {
    setLoading(true);
    setError(null);
    const delegate: TensorflowModelDelegate[] = useGpu
      ? [hostIsAndroid ? "android-gpu" : "core-ml"]
      : [];
    let loaded: TensorflowModel;
    try {
      try {
        loaded = await loadTensorflowModel({ url: fileUri }, delegate);
      } catch (err) {
        console.error(err);
        loaded = await loadTensorflowModel({ url: fileUri }, []);
      }
      const inputTensor = loaded.inputs[0];
      const outputTensor = loaded.outputs[0];
      const shape = inputTensor.shape; // typically [1, H, W, C]
      const info: ModelInfo = {
        inputInfo: {
          shape: shape,
          dataType: inputTensor.dataType,
          height: shape[1],
          width: shape[2],
          channels: shape[3] ?? 3,
        },
        outputInfo: {
          size: loaded.outputs[0].shape[loaded.outputs[0].shape.length - 1],
          dataType: outputTensor.dataType,
        },
        isQuantized:
          inputTensor.dataType === "uint8" || inputTensor.dataType === "int8",
      };
      setModel(loaded);
      setModelInfo(info);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load model");
      setModel(null);
      setModelInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLabels = useCallback((text: string) => {
    setLabels(
      text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    );
  }, []);

  const classify = useCallback(
    async (
      image: Frame,
      normalization: string = "zero_to_one",
    ): Promise<Prediction[]> => {
      if (!model || !modelInfo || resizerState !== "ready")
        throw new Error("No model loaded");

      const resizedImage = resizer.resize(image);
      const resizedImageBuffer = resizedImage.getPixelBuffer();
      const outputs = model.runSync([resizedImageBuffer]);
      const scores = new Float32Array(outputs[0]);

      const predictions: Prediction[] = scores.map((score, index) => ({
        label: labels[index] ?? `class_${index}`,
        index,
        confidence: isQuantized ? score / 255 : score,
      }));

      return predictions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);
    },
    [model, modelInfo, labels],
  );

  return {
    loadModel,
    loadLabels,
    classify,
    modelInfo,
    labels,
    loading: loading || resizerState === "loading",
    error,
  };
}
