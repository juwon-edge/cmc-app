import { Ionicons } from "@expo/vector-icons";
import { type Dispatch, type SetStateAction } from "react";
import { Pressable, StyleSheet } from "react-native";
import { TargetCameraPosition } from "react-native-vision-camera";

type Props = {
  setCameraPosition: Dispatch<SetStateAction<TargetCameraPosition>>;
};

const RotateCamBtn = ({ setCameraPosition }: Props) => {
  return (
    <Pressable
      onPress={() =>
        setCameraPosition((prev) => (prev === "back" ? "front" : "back"))
      }
      onLongPress={() =>
        setCameraPosition((prev) => (prev === "external" ? "back" : "external"))
      }
    >
      <Ionicons name="reload-circle" size={64} />
    </Pressable>
  );
};

export default RotateCamBtn;

const styles = StyleSheet.create({});
