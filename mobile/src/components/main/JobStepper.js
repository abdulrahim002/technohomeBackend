import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';

/**
 * JobStepper - Visual progress tracking for the technician.
 * هذا المكون مسؤول عن عرض التقدم البصري للمهمة (الطلب) التي يعمل عليها الفني.   
 * يعتمد على حالة الطلب (status) لتحديد أي مرحلة تم إنجازها وأيها لا يزال ينتظر.       
 * لعرض خط سير العملية (مقبولة، وصلت، انتهت).   
 */
const JobStepper = ({ status }) => {
  const isFinished = (s) => ['completed'].includes(s);
  const isStarted = (s) => !['waiting_for_confirmation'].includes(s);
  const isArrived = (s) => ['arrived', 'in_progress', 'completed'].includes(s);

  return (
    <View style={styles.stepperContainer}>
       <View style={styles.stepGroup}>
          <View style={[styles.stepDot, { backgroundColor: isStarted(status) ? '#10B981' : '#E2E8F0' }]}>
             {isStarted(status) && <CheckCircle2 size={12} color="white" />}
          </View>
          <Text style={styles.stepLabel}>مقبولة</Text>
       </View>
       
       <View style={[styles.stepLink, { backgroundColor: isArrived(status) ? '#10B981' : '#E2E8F0' }]} />
       
       <View style={styles.stepGroup}>
          <View style={[styles.stepDot, { backgroundColor: isArrived(status) ? '#10B981' : '#E2E8F0' }]}>
             {isArrived(status) && <CheckCircle2 size={12} color="white" />}
          </View>
          <Text style={styles.stepLabel}>وصلت</Text>
       </View>
       
       <View style={[styles.stepLink, { backgroundColor: isFinished(status) ? '#10B981' : '#E2E8F0' }]} />
       
       <View style={styles.stepGroup}>
          <View style={[styles.stepDot, { backgroundColor: isFinished(status) ? '#10B981' : '#E2E8F0' }]}>
             {isFinished(status) && <CheckCircle2 size={12} color="white" />}
          </View>
          <Text style={styles.stepLabel}>انتهت</Text>
       </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stepperContainer: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  stepGroup: { alignItems: 'center' },
  stepDot: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  stepLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginTop: 6 },
  stepLink: { width: 60, height: 2, marginBottom: 16 },
});

export default memo(JobStepper);
