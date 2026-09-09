import useTFLiteModel from "@/hooks/use-tflite-model";
import { createContext } from "react";

type UseTFLiteModelReturnType = ReturnType<typeof useTFLiteModel>;
export const ClassificationModelContext =
  createContext<UseTFLiteModelReturnType | null>(null);

const ClassificationModelProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const model = useTFLiteModel({
    modelSource: require("@/assets/models/car_classifier_v1(int8).tflite"),
    modelMetadata: {
      quantization: null,
      normalised: false,
      classes: [],
    },
  });
  return (
    <ClassificationModelContext value={model}>
      {children}
    </ClassificationModelContext>
  );
};

export default ClassificationModelProvider;
