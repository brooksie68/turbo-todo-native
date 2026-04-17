import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase/client';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Auth working — todo list goes here</Text>
      <TouchableOpacity onPress={() => supabase.auth.signOut()}>
        <Text style={styles.signOut}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003759',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    color: '#F6CD75',
    fontSize: 16,
  },
  signOut: {
    color: '#025f96',
    fontSize: 14,
  },
});
