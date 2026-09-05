import { Colors } from "@/constants/theme";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "react-native";

const AppTab = () => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Snap</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="camera.fill"
          md="photo_camera"
          renderingMode="template"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="live">
        <NativeTabs.Trigger.Label>Live</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="video.fill"
          md="videocam"
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
};

export default AppTab;
