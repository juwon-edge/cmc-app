import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useEffect } from "react";
import { Button, StyleSheet } from "react-native";
import { Camera, useCameraPermission } from "react-native-vision-camera";

const LiveVideoFeed = () => {
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

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

  return (
    <ThemedView style={styles.container}>
      <Camera style={StyleSheet.absoluteFill} isActive={true} device="back" />
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
