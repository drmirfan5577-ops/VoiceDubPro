// Powered by OnSpace.AI — Onboarding Carousel (3 slides)
import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, Pressable,
  FlatList, Dimensions, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { LANGUAGES } from '@/constants/languages';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    image: require('@/assets/images/onboard_1.png'),
    title: 'Record & Dub',
    subtitle: 'Studio-grade microphone recording with real-time waveform, voice changer, and concert-grade effects.',
    badge: '🎙 12 Languages',
    features: ['Live Waveform', 'Voice Changer', 'Quran Mode'],
    accent: Colors.primary,
  },
  {
    id: '2',
    image: require('@/assets/images/onboard_2.png'),
    title: 'AI Subtitles & Translation',
    subtitle: 'Generate subtitles in 5 languages simultaneously. Translate with Gemini, GPT-5, and Google AI.',
    badge: '🤖 OnSpace AI',
    features: ['5 Languages at Once', '8 Subtitle Formats', 'Multi-Engine AI'],
    accent: '#3498DB',
  },
  {
    id: '3',
    image: require('@/assets/images/onboard_3.png'),
    title: 'Export & Share',
    subtitle: 'Ultra HD+ 8K export with Dolby Atmos, multi-track stems, cloud sync, and instant share.',
    badge: '🚀 Ultra HD+',
    features: ['8K @ 240fps', 'Dolby Atmos', 'Cloud Sync'],
    accent: Colors.primaryLight,
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { t, language, setLanguage } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotAnims = useRef(SLIDES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 120 }),
    ]).start();

    // Pulse on mic icon
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Animate active dot
  useEffect(() => {
    dotAnims.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: i === activeIndex ? 1 : 0,
        useNativeDriver: false,
        damping: 15,
        stiffness: 200,
      }).start();
    });
  }, [activeIndex]);

  const goToSlide = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setActiveIndex(index);
  };

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      goToSlide(activeIndex + 1);
    } else {
      router.replace('/(tabs)');
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => (
    <View style={styles.slide}>
      {/* Background image */}
      <Image
        source={item.image}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={300}
      />
      {/* Gradient overlay */}
      <LinearGradient
        colors={['rgba(8,8,8,0.2)', 'rgba(8,8,8,0.6)', 'rgba(8,8,8,0.96)']}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );

  const slide = SLIDES[activeIndex];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Full-screen carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        style={StyleSheet.absoluteFillObject}
        scrollEventThrottle={16}
        bounces={false}
        getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
      />

      {/* Content overlay */}
      <View style={[styles.overlay, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>

        {/* Skip button */}
        {activeIndex < SLIDES.length - 1 ? (
          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.skipBtn} hitSlop={12}>
            <Text style={styles.skipText}>Skip</Text>
            <MaterialIcons name="skip-next" size={14} color={Colors.textMuted} />
          </Pressable>
        ) : (
          <View style={{ height: 32 }} />
        )}

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Text content */}
        <Animated.View style={[styles.textBlock, { opacity: fadeAnim }]} key={activeIndex}>
          {/* Badge */}
          <View style={[styles.badge, { borderColor: slide.accent + '88', backgroundColor: slide.accent + '22' }]}>
            <Text style={[styles.badgeText, { color: slide.accent }]}>{slide.badge}</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: slide.accent }]}>{slide.title}</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>{slide.subtitle}</Text>

          {/* Feature chips */}
          <View style={styles.features}>
            {slide.features.map(f => (
              <View key={f} style={[styles.featureChip, { borderColor: slide.accent + '55', backgroundColor: slide.accent + '11' }]}>
                <MaterialIcons name="check-circle" size={11} color={slide.accent} />
                <Text style={[styles.featureText, { color: slide.accent }]}>{f}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Dot indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const width = dotAnims[i].interpolate({ inputRange: [0, 1], outputRange: [8, 28] });
            const opacity = dotAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
            return (
              <Pressable key={i} onPress={() => goToSlide(i)} hitSlop={8}>
                <Animated.View style={[styles.dot, { width, opacity, backgroundColor: SLIDES[i].accent }]} />
              </Pressable>
            );
          })}
        </View>

        {/* Language quick-select (slide 1 only) */}
        {activeIndex === 0 ? (
          <View style={styles.langRow}>
            {LANGUAGES.slice(0, 6).map(lang => (
              <Pressable
                key={lang.code}
                onPress={() => setLanguage(lang.code)}
                style={[styles.langChip, language === lang.code && styles.langChipActive]}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text style={[styles.langName, language === lang.code && { color: Colors.primary }]}>{lang.englishName}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* CTA button */}
        <Pressable
          onPress={goNext}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] }]}
        >
          <LinearGradient
            colors={[slide.accent, slide.accent + 'CC']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            {activeIndex < SLIDES.length - 1 ? (
              <>
                <Text style={styles.ctaText}>Next</Text>
                <MaterialIcons name="arrow-forward" size={20} color={Colors.textInverse} />
              </>
            ) : (
              <>
                <MaterialIcons name="play-arrow" size={22} color={Colors.textInverse} />
                <Text style={styles.ctaText}>{t.start_dubbing}</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        {/* Pro specs (last slide only) */}
        {activeIndex === SLIDES.length - 1 ? (
          <View style={styles.specRow}>
            {[
              { icon: 'speed', label: '1.5ms Latency' },
              { icon: 'hd', label: '8K Export' },
              { icon: 'surround-sound', label: 'Dolby Atmos' },
            ].map(s => (
              <View key={s.label} style={styles.spec}>
                <MaterialIcons name={s.icon as any} size={13} color={Colors.primary} />
                <Text style={styles.specText}>{s.label}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  slide: { width: SCREEN_W, height: SCREEN_H },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  skipBtn: {
    position: 'absolute',
    top: 0,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    backgroundColor: Colors.surface + 'AA',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skipText: { color: Colors.textMuted, fontSize: Typography.xs },
  textBlock: { gap: Spacing.sm },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgeText: { fontSize: Typography.xs, fontWeight: Typography.semibold, letterSpacing: 0.5 },
  title: {
    fontSize: Typography.xxl,
    fontWeight: Typography.black,
    letterSpacing: -0.5,
    lineHeight: Typography.xxl * 1.15,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    lineHeight: Typography.base * 1.6,
  },
  features: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: 4 },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  featureText: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceCard + 'CC',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  langChipActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
    ...Shadow.gold,
  },
  langFlag: { fontSize: 14 },
  langName: { color: Colors.textSecondary, fontSize: Typography.xs },
  cta: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.gold,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
  },
  ctaText: {
    color: Colors.textInverse,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    letterSpacing: 0.4,
  },
  specRow: { flexDirection: 'row', justifyContent: 'space-evenly' },
  spec: { alignItems: 'center', gap: 4 },
  specText: { color: Colors.textMuted, fontSize: 9, textAlign: 'center' },
});
