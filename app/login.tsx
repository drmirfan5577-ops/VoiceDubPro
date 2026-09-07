// Powered by OnSpace.AI — Cloud Auth Login
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useAuth, useAlert } from '@/template';
import { useStudio } from '@/hooks/useStudio';

type AuthMode = 'login' | 'register' | 'otp';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signInWithPassword, signUpWithPassword, sendOTP, verifyOTPAndLogin, operationLoading } = useAuth();
  const { showAlert } = useAlert();
  const { setCloudSynced } = useStudio();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) { showAlert('Required', 'Enter email and password'); return; }
    const { error } = await signInWithPassword(email.trim(), password);
    if (error) { showAlert('Login Failed', error); return; }
    setCloudSynced(true);
    router.replace('/(tabs)');
  };

  const handleSendOTP = async () => {
    if (!email.trim()) { showAlert('Required', 'Enter your email address'); return; }
    const { error } = await sendOTP(email.trim());
    if (error) { showAlert('Error', error); return; }
    setOtpSent(true);
    showAlert('OTP Sent', `Verification code sent to ${email}`);
  };

  const handleRegister = async () => {
    if (!email.trim() || !password || !confirmPassword) { showAlert('Required', 'Fill all fields'); return; }
    if (password !== confirmPassword) { showAlert('Mismatch', 'Passwords do not match'); return; }
    if (password.length < 6) { showAlert('Too Short', 'Password must be at least 6 characters'); return; }

    if (!otpSent) {
      await handleSendOTP();
      return;
    }

    if (!otp.trim()) { showAlert('Required', 'Enter the OTP sent to your email'); return; }
    const { error } = await verifyOTPAndLogin(email.trim(), otp.trim(), { password });
    if (error) { showAlert('Verification Failed', error); return; }
    setCloudSynced(true);
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['rgba(212,160,23,0.15)', 'rgba(8,8,8,0)', 'rgba(8,8,8,0)']}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoRing}>
              <MaterialIcons name="cloud-sync" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Cloud Sync</Text>
            <Text style={styles.subtitle}>Sign in to sync projects across devices</Text>
          </View>

          {/* Mode tabs */}
          <View style={styles.modeTabs}>
            {(['login', 'register'] as AuthMode[]).map(m => (
              <Pressable
                key={m}
                onPress={() => { setMode(m); setOtpSent(false); setOtp(''); }}
                style={[styles.modeTab, mode === m && styles.modeTabActive]}
              >
                <Text style={[styles.modeTabText, mode === m && styles.modeTabTextActive]}>
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View style={styles.inputRow}>
                <MaterialIcons name="email" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.inputRow}>
                <MaterialIcons name="lock" size={18} color={Colors.textMuted} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPw(v => !v)} hitSlop={8}>
                  <MaterialIcons name={showPw ? 'visibility-off' : 'visibility'} size={18} color={Colors.textMuted} />
                </Pressable>
              </View>
            </View>

            {/* Confirm password (register only) */}
            {mode === 'register' ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <View style={styles.inputRow}>
                  <MaterialIcons name="lock-outline" size={18} color={Colors.textMuted} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Repeat password"
                    placeholderTextColor={Colors.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPw}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ) : null}

            {/* OTP field (register after sending) */}
            {mode === 'register' && otpSent ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Verification Code (OTP)</Text>
                <View style={[styles.inputRow, styles.otpRow]}>
                  <MaterialIcons name="verified" size={18} color={Colors.primary} />
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="4-digit code"
                    placeholderTextColor={Colors.textMuted}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                </View>
                <Pressable onPress={handleSendOTP} style={styles.resendBtn}>
                  <Text style={styles.resendText}>Resend OTP</Text>
                </Pressable>
              </View>
            ) : null}

            {/* Submit */}
            <Pressable
              onPress={mode === 'login' ? handleLogin : handleRegister}
              disabled={operationLoading}
              style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }]}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryLight, Colors.primaryDark]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {operationLoading ? (
                  <Text style={styles.submitText}>Please wait...</Text>
                ) : (
                  <>
                    <MaterialIcons
                      name={mode === 'login' ? 'login' : otpSent ? 'verified-user' : 'person-add'}
                      size={20}
                      color={Colors.textInverse}
                    />
                    <Text style={styles.submitText}>
                      {mode === 'login' ? 'Sign In & Sync' : otpSent ? 'Verify & Create Account' : 'Send Verification Code'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            {/* Skip */}
            <Pressable onPress={() => router.replace('/(tabs)')} style={styles.skipBtn}>
              <Text style={styles.skipText}>Continue without Cloud Sync</Text>
              <MaterialIcons name="arrow-forward" size={14} color={Colors.textMuted} />
            </Pressable>
          </View>

          {/* Benefits */}
          <View style={styles.benefits}>
            <Text style={styles.benefitsTitle}>Cloud Sync Benefits</Text>
            {[
              { icon: 'cloud-upload', label: 'Projects sync across all your devices' },
              { icon: 'backup', label: 'Automatic cloud backup of all recordings' },
              { icon: 'share', label: 'Share projects with collaborators' },
              { icon: 'history', label: 'Version history & recovery' },
              { icon: 'security', label: 'End-to-end encrypted storage' },
            ].map(b => (
              <View key={b.label} style={styles.benefitRow}>
                <MaterialIcons name={b.icon as any} size={16} color={Colors.primary} />
                <Text style={styles.benefitText}>{b.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.xl },
  header: { alignItems: 'center', gap: Spacing.sm },
  logoRing: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 2, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.gold,
  },
  title: { color: Colors.textPrimary, fontSize: Typography.xxl, fontWeight: Typography.bold },
  subtitle: { color: Colors.textMuted, fontSize: Typography.sm, textAlign: 'center' },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  modeTab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  modeTabActive: { backgroundColor: Colors.primaryGlow },
  modeTabText: { color: Colors.textMuted, fontSize: Typography.sm, fontWeight: Typography.medium },
  modeTabTextActive: { color: Colors.primary, fontWeight: Typography.semibold },
  form: { gap: Spacing.md },
  fieldGroup: { gap: Spacing.sm },
  fieldLabel: { color: Colors.textSecondary, fontSize: Typography.xs, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surfaceCard, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.border,
    minHeight: 52,
  },
  input: { flex: 1, color: Colors.textPrimary, fontSize: Typography.base, includeFontPadding: false },
  otpRow: { borderColor: Colors.primary + '44', backgroundColor: Colors.primaryGlow },
  otpInput: { letterSpacing: 6, fontSize: Typography.lg, fontWeight: Typography.bold, textAlign: 'center' },
  resendBtn: { alignSelf: 'flex-end' },
  resendText: { color: Colors.primary, fontSize: Typography.xs },
  submitBtn: { borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.gold },
  submitGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.md + 2,
  },
  submitText: { color: Colors.textInverse, fontSize: Typography.base, fontWeight: Typography.bold },
  skipBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.sm },
  skipText: { color: Colors.textMuted, fontSize: Typography.sm },
  benefits: {
    backgroundColor: Colors.surfaceCard, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  benefitsTitle: { color: Colors.primary, fontSize: Typography.sm, fontWeight: Typography.semibold, marginBottom: 4 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  benefitText: { color: Colors.textMuted, fontSize: Typography.sm },
});
