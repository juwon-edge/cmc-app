import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useEffect } from "react";
import { Button, StyleSheet } from "react-native";
import { BoTSort } from "react-native-botsort";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";

const LiveVideoFeed = () => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  useEffect(() => {
    BoTSort.initialize("", false);
  }, []);

  if (!hasPermission) {
    return (
      <ThemedView style={styles.permissionContainer}>
        <ThemedText style={styles.text}>
          Camera permission is required
        </ThemedText>
        {/* <Pressable onPress={requestPermission}>
          <ThemedText>Allow Camera</ThemedText>
        </Pressable> */}
        <Button title="Allow Camera" onPress={requestPermission} />
      </ThemedView>
    );
  }

  if (device == null) {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} />
    </ThemedView>
  );
};

export default LiveVideoFeed;

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: { fontSize: 18, marginBottom: 20 },
  container: {
    flex: 1,
  },
});
