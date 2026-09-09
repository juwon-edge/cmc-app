import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "@/constants/theme";
import * as ImagePicker from "expo-image-picker";

type Props = {
  onImagePicked: (pickedImage: ImagePicker.ImagePickerAsset) => void;
};

const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
  });
  if (!result.canceled) return result.assets[0];
};

const ImagePickerBtn = (props: Props) => {
  return (
    <Pressable
      onPress={async () => {
        const pickedImage = await pickImage();
        if (pickedImage) props.onImagePicked(pickedImage);
      }}
      className="p-2 rounded-full flex items-center justify-center border transition-all active:scale-90"
      style={{ borderColor: C.border }}
    >
      <Ionicons name="image" size={48} />
    </Pressable>
  );
};

export default ImagePickerBtn;

const styles = StyleSheet.create({});
