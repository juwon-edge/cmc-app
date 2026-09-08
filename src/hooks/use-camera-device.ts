import { useState } from "react";
import {
  type TargetCameraPosition,
  useCameraDevice as useInBuiltCameraDevice,
} from "react-native-vision-camera";

const useCameraDevice = (initialPosition: TargetCameraPosition) => {
  const [cameraPosition, setCameraPosition] =
    useState<TargetCameraPosition>(initialPosition);
  const device = useInBuiltCameraDevice(cameraPosition);

  return [device, setCameraPosition] as const;
};

export default useCameraDevice;
