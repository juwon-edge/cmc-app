import RotateCamBtn from "@/components/rotate-cam-btn";
import { ThemedView } from "@/components/themed-view";
import useCameraDevice from "@/hooks/use-camera-device";
import useDetectionnModel from "@/hooks/use-detection-model";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { BoTSort } from "react-native-botsort";
import { Camera, useFrameOutput } from "react-native-vision-camera";

const LiveVideoFeed = () => {
  const [device, setCameraPosition] = useCameraDevice("back");
  const detectionModel = useDetectionnModel();

  const frameOutput = useFrameOutput({
    targetResolution: { width: 320, height: 640 },
    pixelFormat: "yuv",
    onFrame(frame) {
      const output = detectionModel.runInference(frame);
      console.log(output);
    },
  });

  useEffect(() => {
    BoTSort.initialize("", false);
  }, []);

  if (device == null) return null;

  return (
    <ThemedView style={styles.container}>
      <RotateCamBtn setCameraPosition={setCameraPosition} />
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        outputs={[frameOutput]}
      />
    </ThemedView>
  );
};

export default LiveVideoFeed;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
