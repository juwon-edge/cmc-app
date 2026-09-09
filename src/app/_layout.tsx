import "@/global.css";
import AppTab from "@/components/app-tabs";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import ClassificationModelProvider from "@/providers/classification-model-provider";
import DetectionModelProvider from "@/providers/detection-model-provider";
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import { useEffect } from "react";
import { Button, StyleSheet, useColorScheme } from "react-native";
import { useCameraPermission } from "react-native-vision-camera";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <ClassificationModelProvider>
        <DetectionModelProvider>
          {!hasPermission && (
            <ThemedView style={styles.permissionContainer}>
              <ThemedText style={styles.text}>
                Camera permission is required
              </ThemedText>
              {/* <Pressable onPress={requestPermission}>
            <ThemedText>Allow Camera</ThemedText>
          </Pressable> */}
              <Button title="Allow Camera" onPress={requestPermission} />
            </ThemedView>
          )}
          <AppTab />
        </DetectionModelProvider>
      </ClassificationModelProvider>
    </ThemeProvider>
  );
}

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
