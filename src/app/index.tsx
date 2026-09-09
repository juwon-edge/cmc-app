import RotateCamBtn from "@/components/rotate-cam-btn";
import { C } from "@/constants/theme";
import useCameraDevice from "@/hooks/use-camera-device";
import useClassificationModel from "@/hooks/use-classification-model";
import useDetectionnModel from "@/hooks/use-detection-model";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera } from "react-native-vision-camera";

SplashScreen.preventAutoHideAsync();
export default function Index() {
  const classificationModel = useClassificationModel();
  const detectionModel = useDetectionnModel();
  const [device, setCameraPosition] = useCameraDevice("back");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (classificationModel.isReady && detectionModel.isReady)
      SplashScreen.hideAsync();
  }, [classificationModel.isReady, detectionModel.isReady]);

  if (!device) return;

  return (
    <View style={styles.container}>
      <Camera style={StyleSheet.absoluteFill} device={device} isActive />

      <SafeAreaView
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "none" : "translateY(12px)",
          transition: "opacity 0.5s 0.2s, transform 0.5s 0.2s",
        }}
      >
        <Pressable
          onPress={trigger}
          className="w-11 h-11 rounded-full flex items-center justify-center border transition-all active:scale-90"
          style={{ borderColor: C.border }}
        ></Pressable>

        <View className="relative flex items-center justify-center">
          <View
            className="absolute rounded-full"
            style={{
              width: 72,
              height: 72,
              border: `1px solid ${C.ink}`,
              animation: "pulse-ring 2s ease-out infinite",
            }}
          />
          <Pressable
            onPress={trigger}
            className="relative rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ width: 72, height: 72, border: `1.5px solid ${C.ink}` }}
          >
            <View
              className="rounded-full"
              style={{ width: 54, height: 54, background: C.ink }}
            />
          </Pressable>

          <RotateCamBtn setCameraPosition={setCameraPosition} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
