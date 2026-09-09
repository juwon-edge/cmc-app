import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

const info = () => {
  return (
    <View style={styles.container}>
      <Image />
    </View>
  );
};

export default info;

const styles = StyleSheet.create({
  container: { flex: 1 },
});
