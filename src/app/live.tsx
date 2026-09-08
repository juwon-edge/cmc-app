import { ThemedView } from "@/components/themed-view";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { BoTSort } from "react-native-botsort";
import {
  Camera,
  type TargetCameraPosition,
  useCameraDevice,
  useFrameOutput,
} from "react-native-vision-camera";

const LiveVideoFeed = () => {
  const [targetCamera, setTargetCamera] =
    useState<TargetCameraPosition>("back");
  const device = useCameraDevice(targetCamera);
  const frameOutput = useFrameOutput({
    targetResolution: { width: 320, height: 640 },
    pixelFormat: "yuv",
    onFrame(frame) {},
  });

  useEffect(() => {
    BoTSort.initialize("", false);
  }, []);

  if (device == null) return null;

  return (
    <ThemedView style={styles.container}>
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
