import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { User, Wrench, ArrowLeft } from 'lucide-react-native';

/**
 * شاشة اختيار الدور (Role Selection Screen)
 * الدور: اختيار نوع الحساب (عميل أو فني) قبل التسجيل.
 * هذه الشاشة تسمح للمستخدم باختيار ما إذا كان يريد إنشاء حساب كعميل أو كفني.
 *  
 */   
const RoleSelectionScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color="#1E293B" size={24} />
        </TouchableOpacity>

        <View style={styles.header}>
           <Text style={styles.title}>انضم إلينا كـ</Text>
           <Text style={styles.subtitle}>اختر نوع الحساب الذي يناسب احتياجك</Text>
        </View>

        <View style={styles.cardsContainer}>
          {/* Customer */}
          <TouchableOpacity 
            onPress={() => navigation.navigate('RegisterCustomer')}
            activeOpacity={0.9}
            style={styles.card}
          >
             <View style={styles.iconContainer}>
                <User color="#2563eb" size={36} />
             </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>عميل</Text>
              <Text style={styles.cardSubtitle}>أبحث عن خبراء صيانة لأجهزتي</Text>
            </View>
          </TouchableOpacity>

          {/* Technician */}
          <TouchableOpacity 
            onPress={() => navigation.navigate('RegisterTechnician')}
            activeOpacity={0.9}
            style={[styles.card, styles.cardTechnician]}
          >
            <View style={[styles.iconContainer, styles.iconContainerTech]}>
              <Wrench color="#64748b" size={36} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>فني خبير</Text>
              <Text style={styles.cardSubtitle}>أرغب في تقديم خدماتي المهنية</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
           <Text style={styles.footerText}>
              انضم لأكبر شبكة صيانة منزلية في ليبيا وابدأ رحلتك الآن مع تكنو هوم
           </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 32, paddingVertical: 40 },
  backButton: { marginBottom: 40, width: 48, height: 48, backgroundColor: '#f8fafc', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'flex-end', marginBottom: 48 },
  title: { fontSize: 36, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 18, color: '#94a3b8', fontWeight: 'bold', marginTop: 8 },
  cardsContainer: { gap: 24 },
  card: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#2563eb', borderRadius: 40, padding: 32, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  cardTechnician: { borderColor: '#f1f5f9' },
  iconContainer: { backgroundColor: '#eff6ff', padding: 20, borderRadius: 28 },
  iconContainerTech: { backgroundColor: '#f8fafc' },
  cardTextContainer: { flex: 1, items: 'flex-end', marginLeft: 16 },
  cardTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a', textAlign: 'right' },
  cardSubtitle: { fontSize: 12, color: '#94a3b8', fontWeight: 'bold', textAlign: 'right', marginTop: 4 },
  footer: { marginTop: 80, padding: 24, backgroundColor: '#f8fafc', borderRadius: 30, borderWidth: 1, borderColor: '#f1f5f9' },
  footerText: { textAlign: 'center', color: '#64748b', fontWeight: 'bold', fontSize: 12, lineHeight: 20 }
});

export default RoleSelectionScreen;
