import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap, CheckCircle } from 'lucide-react-native';

/**
 * DiagnosisCard - Ø¹Ø±Ø¶ Ù†ØªØ§Ø¦Ø¬ Ø§Ù„ØªØ´Ø®ÙŠØµ Ø§Ù„Ø°ÙƒÙŠ AI Ø¨Ø´ÙƒÙ„ Ø§Ø­ØªØ±Ø§ÙÙŠ
 */
export const DiagnosisCard = ({ diagnosis, steps, title = 'äÊÇÆÌ ÇáÊÔÎíÕ ÇáÐßí' }) => {
  if (!diagnosis) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Zap size={20} color="#8B5CF6" fill="#8B5CF6" />
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <Text style={styles.mainText}>{diagnosis}</Text>
      
      {steps && steps.length > 0 && (
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <CheckCircle size={14} color="#10B981" />
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#F5F3FF', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#DDD6FE' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 15, gap: 10 },
  title: { fontSize: 16, fontWeight: '900', color: '#6D28D9' },
  mainText: { fontSize: 15, fontWeight: '800', color: '#5B21B6', textAlign: 'right', marginBottom: 15, lineHeight: 24 },
  stepsContainer: { gap: 10 },
  stepItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  stepText: { fontSize: 13, color: '#6D28D9', flex: 1, textAlign: 'right' }
});

