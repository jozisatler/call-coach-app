import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors, sharedStyles } from '../styles/shared';

interface CreateEffectScreenProps {
  onBack: () => void;
  showToast: (msg: string) => void;
}

export default function CreateEffectScreen({ onBack, showToast }: CreateEffectScreenProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');

  const canPublish = name.trim().length > 0 && prompt.trim().length > 0;

  const handlePublish = () => {
    if (!canPublish) {
      showToast('Add a name and prompt first');
      return;
    }
    showToast(`“${name.trim()}” saved as draft`);
    onBack();
  };

  return (
    <SafeAreaView style={sharedStyles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.iconBtn} hitSlop={12}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Create Effect</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Soft Chrome"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
            autoCapitalize="words"
            maxLength={40}
          />

          <Text style={styles.label}>Short description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What does this effect do?"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
            maxLength={80}
          />

          <Text style={styles.label}>Prompt</Text>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Describe how to transform the main subject…"
            placeholderTextColor={colors.textSubtle}
            style={[styles.input, styles.promptInput]}
            multiline
            textAlignVertical="top"
            maxLength={800}
          />
          <Text style={styles.hint}>
            Tip: say “main subject only” and “keep the background the same” for cleaner results.
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.publishBtn,
              !canPublish && styles.publishDisabled,
              pressed && canPublish && styles.pressed,
            ]}
            onPress={handlePublish}
          >
            <Text style={styles.publishText}>Publish draft</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  label: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
  },
  promptInput: {
    minHeight: 160,
    paddingTop: 14,
  },
  hint: {
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  publishBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  publishDisabled: {
    opacity: 0.45,
  },
  publishText: {
    color: colors.bg,
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
