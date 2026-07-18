import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { sharedStyles } from '../styles/shared';

interface PracticeScreenProps {
  onGoBack: () => void;
}

const OBJECTIONS = [
  {
    objection: "It's too expensive.",
    response: "Acknowledge and pivot to value: 'I completely understand that price is a major factor. If we set price aside for a moment, does our solution actually solve the core problem you are facing?'"
  },
  {
    objection: "We already use a competitor.",
    response: "Validate and explore gaps: 'That's great that you're already investing in this area. Just out of curiosity, what is the one thing you wish your current provider did better?'"
  },
  {
    objection: "Send me an email with more info.",
    response: "Prevent the brush-off: 'I'd be happy to send you some materials. To make sure I only send what's actually relevant to you, what specific challenges are you hoping the info will address?'"
  },
  {
    objection: "We don't have the budget right now.",
    response: "Find the timeline or priority: 'I hear you. If budget wasn't an issue, is this a priority for your team right now? When does your new budget cycle begin?'"
  }
];

const Flashcard = ({ objection, response }: { objection: string, response: string }) => {
  const [revealed, setRevealed] = useState(false);

  return (
    <Pressable onPress={() => setRevealed(!revealed)} style={styles.card}>
      <Text style={styles.cardLabel}>OBJECTION</Text>
      <Text style={styles.objectionText}>"{objection}"</Text>
      
      {revealed ? (
        <View style={styles.responseContainer}>
          <Text style={styles.cardLabel}>RECOMMENDED RESPONSE</Text>
          <Text style={styles.responseText}>{response}</Text>
        </View>
      ) : (
        <Text style={styles.tapPrompt}>Tap to reveal response</Text>
      )}
    </Pressable>
  );
};

export default function PracticeScreen({ onGoBack }: PracticeScreenProps) {
  return (
    <SafeAreaView style={sharedStyles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={onGoBack} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Practice Objections</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Tap a card to reveal the recommended handling technique.</Text>
        
        {OBJECTIONS.map((obj, i) => (
          <Flashcard key={i} objection={obj.objection} response={obj.response} />
        ))}
        
        <Pressable onPress={onGoBack} style={styles.footerButton}>
          <Text style={styles.footerButtonText}>End Practice</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center'
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 80 },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 24, lineHeight: 24 },
  card: {
    backgroundColor: '#1f1f1f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  cardLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  objectionText: { color: '#ffffff', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  responseContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  responseText: { color: '#a78bfa', fontSize: 16, lineHeight: 24, fontWeight: '500' },
  tapPrompt: { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '500', textAlign: 'center', marginTop: 12 },
  footerButton: {
    marginTop: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  footerButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
