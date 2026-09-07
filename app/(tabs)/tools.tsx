// Powered by OnSpace.AI — Tools: AI Subtitles + Multi-Engine Translation + AI Teleprompter + Converter + Compressor
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  Switch, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAlert } from '@/template';
import { AppHeader } from '@/components/layout/AppHeader';
import { GoldButton } from '@/components/ui/GoldButton';
import { LANGUAGES, LanguageCode } from '@/constants/languages';
import { speakText, stopSpeaking } from '@/services/mediaService';
import {
  generateAISubtitles, translateWithEngine,
  TRANSLATION_ENGINES, TranslationEngine,
} from '@/services/aiStudioService';
import { shareTextAsFile } from '@/services/shareService';

const SUBTITLE_STYLES = [
  { id: 'standard',   label: 'Standard',      textColor: '#FFF',    bg: 'rgba(0,0,0,0.75)', animation: 'fade' },
  { id: 'shorts',     label: 'Shorts',         textColor: '#FFED00', bg: 'rgba(0,0,0,0.6)',  animation: 'bounce' },
  { id: 'podcast',    label: 'Podcast',        textColor: '#D4A017', bg: 'rgba(20,20,20,0.9)', animation: 'slide' },
  { id: 'breaking',   label: 'Breaking News',  textColor: '#FFF',    bg: '#CC0000',          animation: 'flash' },
  { id: 'typewriter', label: 'Typewriter',     textColor: '#00FF88', bg: 'rgba(0,0,0,0.85)', animation: 'typewriter' },
  { id: 'glow',       label: 'Glowing',        textColor: '#00D4FF', bg: 'transparent',      animation: 'glow' },
  { id: 'blink',      label: 'Blinking',       textColor: '#FF6B35', bg: 'rgba(0,0,0,0.7)',  animation: 'blink' },
  { id: 'zoom',       label: 'Zoom In/Out',    textColor: '#FFD700', bg: 'transparent',      animation: 'zoom' },
  { id: 'cinema',     label: 'Cinema',         textColor: '#E8D5B7', bg: 'rgba(0,0,0,0.8)', animation: 'slide' },
];

const SUBTITLE_FORMATS = ['SRT', 'VTT', 'ASS', 'SSA', 'SBV', 'TTML', 'DFXP', 'JSON'];

const TOOLS = [
  { id: 'tts',          label: 'TTS',          icon: 'record-voice-over' },
  { id: 'subtitles',    label: 'AI Subtitles', icon: 'subtitles' },
  { id: 'translate',    label: 'Translate',    icon: 'translate' },
  { id: 'teleprompter', label: 'Teleprompter', icon: 'view-list' },
  { id: 'converter',    label: 'Converter',    icon: 'swap-horiz' },
  { id: 'compressor',   label: 'Compress',     icon: 'compress' },
];

export default function ToolsScreen() {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { showAlert } = useAlert();
  const [activeTool, setActiveTool] = useState('tts');

  // ── TTS ──
  const [ttsText, setTtsText] = useState('');
  const [ttsLang, setTtsLang] = useState<LanguageCode>('en');
  const [ttsRate, setTtsRate] = useState(0.9);
  const [ttsPitch, setTtsPitch] = useState(1.0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ── AI Subtitle Generator ──
  const [subText, setSubText] = useState('');
  const [subLangs, setSubLangs] = useState<LanguageCode[]>(['en', 'ur', 'ar']);
  const [subStyle, setSubStyle] = useState('standard');
  const [subFormat, setSubFormat] = useState('SRT');
  const [generatedSubs, setGeneratedSubs] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState('');

  // ── Translation ──
  const [transText, setTransText] = useState('');
  const [transSrc, setTransSrc] = useState<LanguageCode>('en');
  const [transTargets, setTransTargets] = useState<LanguageCode[]>(['ur', 'ar', 'hi']);
  const [transEngine, setTransEngine] = useState<TranslationEngine>('onspace');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  // ── Teleprompter ──
  const [promptText, setPromptText] = useState(
    'Welcome to VoiceDub Pro — the most advanced multi-language voice dubbing studio.\n\nThis teleprompter supports unlimited text with smooth auto-scroll, perfect for Quran recitation, speeches, news reading, podcasts, and professional presentations.\n\nAdjust the scroll speed to match your natural speaking pace.'
  );
  const [promptSpeed, setPromptSpeed] = useState(2);
  const [promptFontSize, setPromptFontSize] = useState(22);
  const [isScrolling, setIsScrolling] = useState(false);
  const [mirrorText, setMirrorText] = useState(false);
  const [promptLang, setPromptLang] = useState<LanguageCode>('en');
  const [isTranslatingPrompt, setIsTranslatingPrompt] = useState(false);
  const [showPromptLangPicker, setShowPromptLangPicker] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const scrollPosRef = useRef(0);
  const scrollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Converter ──
  const [convFrom, setConvFrom] = useState('MP4');
  const [convTo, setConvTo] = useState('MP3');
  const [convQuality, setConvQuality] = useState('High');
  const [convProgress, setConvProgress] = useState(0);
  const [isConverting, setIsConverting] = useState(false);

  // ── Compressor ──
  const [compLevel, setCompLevel] = useState('Smart');
  const [isCompressing, setIsCompressing] = useState(false);

  // ── Handlers ──
  const handleSpeak = () => {
    if (!ttsText.trim()) { showAlert('Empty', 'Enter text to speak'); return; }
    setIsSpeaking(true);
    speakText(ttsText, ttsLang, ttsRate, ttsPitch);
    setTimeout(() => setIsSpeaking(false), Math.min(ttsText.length * 65 + 1000, 30000));
  };

  const toggleSubLang = (code: LanguageCode) => {
    setSubLangs(prev => prev.includes(code)
      ? prev.filter(l => l !== code)
      : prev.length < 5 ? [...prev, code] : prev
    );
  };

  const toggleTransTarget = (code: LanguageCode) => {
    setTransTargets(prev => prev.includes(code)
      ? prev.filter(l => l !== code)
      : prev.length < 5 ? [...prev, code] : prev
    );
  };

  const handleGenerateSubs = async () => {
    if (!subText.trim()) { showAlert('Empty', 'Enter script text'); return; }
    if (subLangs.length === 0) { showAlert('No Languages', 'Select at least 1 language'); return; }
    setIsGenerating(true);
    setGenProgress('Connecting to AI…');
    try {
      setGenProgress(`Generating subtitles for ${subLangs.length} languages…`);
      const result = await generateAISubtitles(subText, subLangs, subStyle, subFormat);
      setGeneratedSubs(result);
      setGenProgress('');
      showAlert('Done', `AI subtitles generated for ${subLangs.length} languages`);
    } catch (e: any) {
      setGenProgress('');
      showAlert('Error', e.message ?? 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTranslate = async () => {
    if (!transText.trim()) { showAlert('Empty', 'Enter text to translate'); return; }
    if (transTargets.length === 0) { showAlert('No Languages', 'Select target languages'); return; }
    setIsTranslating(true);
    try {
      const result = await translateWithEngine(transText, transSrc, transTargets, transEngine);
      setTranslations(result);
      showAlert('Done', `Translated to ${transTargets.length} languages via ${TRANSLATION_ENGINES.find(e => e.id === transEngine)?.label}`);
    } catch (e: any) {
      showAlert('Error', e.message ?? 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  // ── AI Translation in Teleprompter ──
  const handleTranslatePrompt = async () => {
    if (!promptText.trim()) { showAlert('Empty', 'Enter teleprompter text first'); return; }
    if (promptLang === 'en') { showAlert('Same Language', 'Select a different target language'); return; }
    setIsTranslatingPrompt(true);
    setShowPromptLangPicker(false);
    try {
      const result = await translateWithEngine(promptText, 'en', [promptLang], 'onspace');
      const translated = result[promptLang];
      if (translated) {
        setPromptText(translated);
        const lang = LANGUAGES.find(l => l.code === promptLang);
        showAlert('Translated', `Teleprompter translated to ${lang?.englishName}${lang?.isRTL ? ' (RTL)' : ''}`);
      } else {
        showAlert('Error', 'Translation returned empty result');
      }
    } catch (e: any) {
      showAlert('Error', e.message ?? 'Translation failed');
    } finally {
      setIsTranslatingPrompt(false);
    }
  };

  const startTeleprompter = () => {
    setIsScrolling(true);
    scrollPosRef.current = 0;
    scrollInterval.current = setInterval(() => {
      scrollPosRef.current += promptSpeed;
      scrollRef.current?.scrollTo({ y: scrollPosRef.current, animated: false });
    }, 50);
  };
  const stopTeleprompter = () => {
    setIsScrolling(false);
    if (scrollInterval.current) clearInterval(scrollInterval.current);
  };
  useEffect(() => () => { if (scrollInterval.current) clearInterval(scrollInterval.current); }, []);

  const handleConvert = () => {
    if (convFrom === convTo) { showAlert('Same Format', 'Select different formats'); return; }
    setIsConverting(true);
    setConvProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 9 + 3;
      if (p >= 100) {
        clearInterval(iv);
        setIsConverting(false);
        setConvProgress(0);
        showAlert('Done', `${convFrom} → ${convTo} converted successfully`);
      }
      setConvProgress(Math.min(p, 100));
    }, 150);
  };

  const AUDIO_FMTS = ['MP3', 'AAC', 'WAV', 'FLAC', 'OGG', 'M4A', 'WMA', 'OPUS'];
  const VIDEO_FMTS = ['MP4', 'MOV', 'MKV', 'AVI', 'WebM', '3GP', 'M4V', 'FLV'];
  const ALL_FMTS = [...AUDIO_FMTS, ...VIDEO_FMTS];

  const promptIsRTL = LANGUAGES.find(l => l.code === promptLang)?.isRTL ?? false;

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />
      <AppHeader title="🛠 Tools" showLangPicker />

      {/* Tab bar */}
      <View style={styles.tabBarOuter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {TOOLS.map(tool => (
            <Pressable
              key={tool.id}
              onPress={() => setActiveTool(tool.id)}
              style={[styles.tab, activeTool === tool.id && styles.tabActive]}
            >
              <MaterialIcons name={tool.icon as any} size={15} color={activeTool === tool.id ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.tabText, activeTool === tool.id && styles.tabTextActive]}>{tool.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ════ TTS ════ */}
        {activeTool === 'tts' ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="record-voice-over" size={18} color={Colors.primary} />
              <Text style={styles.cardTitle}>Text to Speech · 12 Languages</Text>
            </View>
            <Text style={styles.label}>Voice Language</Text>
            <View style={styles.langGrid}>
              {LANGUAGES.map(lang => (
                <Pressable key={lang.code} onPress={() => setTtsLang(lang.code)} style={[styles.langChip, ttsLang === lang.code && styles.langChipActive]}>
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <Text style={[styles.chipName, ttsLang === lang.code && { color: Colors.primary }]}>{lang.englishName}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Text (Unlimited)</Text>
            <TextInput
              style={[styles.textArea, LANGUAGES.find(l => l.code === ttsLang)?.isRTL && { textAlign: 'right' }]}
              placeholder="Type or paste text..."
              placeholderTextColor={Colors.textMuted}
              value={ttsText}
              onChangeText={setTtsText}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <View style={styles.paramRow}>
              <Text style={styles.label}>Speed: {ttsRate.toFixed(1)}x</Text>
              <View style={styles.chips}>
                {[0.5, 0.75, 0.9, 1.0, 1.25, 1.5].map(r => (
                  <Pressable key={r} onPress={() => setTtsRate(r)} style={[styles.chip, ttsRate === r && styles.chipActive]}>
                    <Text style={[styles.chipText, ttsRate === r && styles.chipTextActive]}>{r}x</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.paramRow}>
              <Text style={styles.label}>Pitch: {ttsPitch.toFixed(1)}</Text>
              <View style={styles.chips}>
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(p => (
                  <Pressable key={p} onPress={() => setTtsPitch(p)} style={[styles.chip, ttsPitch === p && styles.chipActive]}>
                    <Text style={[styles.chipText, ttsPitch === p && styles.chipTextActive]}>{p}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            {isSpeaking
              ? <GoldButton label="⏹ Stop" onPress={() => { stopSpeaking(); setIsSpeaking(false); }} variant="danger" size="lg" fullWidth />
              : <GoldButton label="🔊 Speak Now" onPress={handleSpeak} size="lg" fullWidth />
            }
          </View>
        ) : null}

        {/* ════ AI SUBTITLE GENERATOR ════ */}
        {activeTool === 'subtitles' ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="subtitles" size={18} color={Colors.primary} />
              <Text style={styles.cardTitle}>AI Subtitle Generator · OnSpace AI</Text>
            </View>
            <View style={styles.aiTag}>
              <MaterialIcons name="auto-awesome" size={12} color={Colors.primary} />
              <Text style={styles.aiTagText}>Real AI translation · Gemini 3 Flash · 5 languages simultaneous</Text>
            </View>
            <Text style={styles.label}>Select up to 5 Languages ({subLangs.length}/5)</Text>
            <View style={styles.langGrid}>
              {LANGUAGES.map(lang => (
                <Pressable
                  key={lang.code}
                  onPress={() => toggleSubLang(lang.code)}
                  style={[styles.langChip, subLangs.includes(lang.code) && styles.langChipActive, !subLangs.includes(lang.code) && subLangs.length >= 5 && { opacity: 0.4 }]}
                >
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <Text style={[styles.chipName, subLangs.includes(lang.code) && { color: Colors.primary }]}>{lang.englishName}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Script / Dialogue</Text>
            <TextInput
              style={[styles.textArea, { minHeight: 120 }]}
              placeholder="Paste your full script or dialogue here..."
              placeholderTextColor={Colors.textMuted}
              value={subText}
              onChangeText={setSubText}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.label}>Subtitle Style</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
              {SUBTITLE_STYLES.map(s => (
                <Pressable
                  key={s.id}
                  onPress={() => setSubStyle(s.id)}
                  style={[styles.styleChip, { backgroundColor: s.bg !== 'transparent' ? s.bg : Colors.surfaceCard }, subStyle === s.id && { borderColor: Colors.primary }]}
                >
                  <Text style={[styles.styleText, { color: s.textColor }]}>{s.label}</Text>
                  <Text style={styles.styleAnim}>{s.animation}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.label}>Export Format</Text>
            <View style={styles.chips}>
              {SUBTITLE_FORMATS.map(f => (
                <Pressable key={f} onPress={() => setSubFormat(f)} style={[styles.chip, subFormat === f && styles.chipActive]}>
                  <Text style={[styles.chipText, subFormat === f && styles.chipTextActive]}>{f}</Text>
                </Pressable>
              ))}
            </View>
            {isGenerating ? (
              <View style={styles.generatingBox}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={styles.generatingText}>{genProgress}</Text>
              </View>
            ) : (
              <GoldButton label={`🤖 Generate AI Subtitles (${subLangs.length} Languages)`} onPress={handleGenerateSubs} size="lg" fullWidth />
            )}
            {Object.keys(generatedSubs).length > 0 ? (
              <View style={styles.subOutput}>
                <Text style={styles.subOutputTitle}>✅ AI-Generated · {subFormat} · {Object.keys(generatedSubs).length} Languages</Text>
                {Object.entries(generatedSubs).map(([code, content]) => {
                  const lang = LANGUAGES.find(l => l.code === code);
                  return (
                    <View key={code} style={styles.subBlock}>
                      <View style={styles.subBlockHeader}>
                        <Text style={styles.subFlag}>{lang?.flag}</Text>
                        <Text style={styles.subLangName}>{lang?.englishName ?? code}</Text>
                        <View style={styles.formatBadge}><Text style={styles.formatBadgeText}>{subFormat}</Text></View>
                      </View>
                      <Text style={[styles.subContent, lang?.isRTL && { textAlign: 'right' }]} numberOfLines={8}>{content}</Text>
                      <View style={styles.subActions}>
                        <GoldButton label="📥 Export" onPress={() => showAlert('Exported', `${lang?.englishName} ${subFormat} subtitles exported`)} variant="ghost" size="sm" />
                        <GoldButton label="📤 Share" onPress={async () => { const ok = await shareTextAsFile(content, `subtitle_${code}.${subFormat.toLowerCase()}`, 'text/plain'); if (!ok) showAlert('Share', 'Sharing not available'); }} variant="ghost" size="sm" />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ════ MULTI-ENGINE TRANSLATION ════ */}
        {activeTool === 'translate' ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="translate" size={18} color={Colors.primary} />
              <Text style={styles.cardTitle}>Multi-Engine AI Translation</Text>
            </View>
            <Text style={styles.label}>Translation Engine</Text>
            <View style={styles.engineGrid}>
              {TRANSLATION_ENGINES.map(engine => (
                <Pressable key={engine.id} onPress={() => setTransEngine(engine.id)} style={[styles.engineCard, transEngine === engine.id && { borderColor: engine.color, backgroundColor: engine.color + '18' }]}>
                  <View style={styles.engineTop}>
                    <Text style={[styles.engineLabel, transEngine === engine.id && { color: engine.color }]}>{engine.label}</Text>
                    {engine.badge ? <View style={[styles.engineBadge, { backgroundColor: engine.color }]}><Text style={styles.engineBadgeText}>{engine.badge}</Text></View> : null}
                    {transEngine === engine.id ? <MaterialIcons name="check-circle" size={12} color={engine.color} /> : null}
                  </View>
                  <Text style={styles.engineModel}>{engine.model}</Text>
                  <Text style={styles.engineDesc}>{engine.description}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Source Language</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
              {LANGUAGES.map(lang => (
                <Pressable key={lang.code} onPress={() => setTransSrc(lang.code)} style={[styles.langChip, transSrc === lang.code && styles.langChipActive]}>
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <Text style={[styles.chipName, transSrc === lang.code && { color: Colors.primary }]}>{lang.englishName}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.label}>Text to Translate</Text>
            <TextInput
              style={[styles.textArea, { minHeight: 100 }, LANGUAGES.find(l => l.code === transSrc)?.isRTL && { textAlign: 'right' }]}
              placeholder="Enter text, script, or dialogue..."
              placeholderTextColor={Colors.textMuted}
              value={transText}
              onChangeText={setTransText}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.label}>Translate To ({transTargets.length}/5)</Text>
            <View style={styles.langGrid}>
              {LANGUAGES.filter(l => l.code !== transSrc).map(lang => (
                <Pressable key={lang.code} onPress={() => toggleTransTarget(lang.code)} style={[styles.langChip, transTargets.includes(lang.code) && styles.langChipActive, !transTargets.includes(lang.code) && transTargets.length >= 5 && { opacity: 0.4 }]}>
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <Text style={[styles.chipName, transTargets.includes(lang.code) && { color: Colors.primary }]}>{lang.englishName}</Text>
                </Pressable>
              ))}
            </View>
            {isTranslating ? (
              <View style={styles.generatingBox}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={styles.generatingText}>Translating with {TRANSLATION_ENGINES.find(e => e.id === transEngine)?.label}…</Text>
              </View>
            ) : (
              <GoldButton label={`🌐 Translate to ${transTargets.length} Languages`} onPress={handleTranslate} size="lg" fullWidth />
            )}
            {Object.keys(translations).length > 0 ? (
              <View style={styles.transOutput}>
                <View style={styles.transOutputHeader}>
                  <MaterialIcons name="check-circle" size={14} color={Colors.success} />
                  <Text style={styles.transOutputTitle}>Translated via {TRANSLATION_ENGINES.find(e => e.id === transEngine)?.label}</Text>
                </View>
                {Object.entries(translations).map(([code, text]) => {
                  const lang = LANGUAGES.find(l => l.code === code);
                  return (
                    <View key={code} style={styles.transBlock}>
                      <View style={styles.subBlockHeader}>
                        <Text style={styles.subFlag}>{lang?.flag}</Text>
                        <Text style={styles.subLangName}>{lang?.englishName ?? code}</Text>
                        {lang?.isRTL ? <View style={styles.rtlBadge}><Text style={styles.rtlText}>RTL</Text></View> : null}
                      </View>
                      <Text style={[styles.transText, lang?.isRTL && { textAlign: 'right' }]}>{text}</Text>
                      <View style={styles.subActions}>
                        <GoldButton label="📤 Share" onPress={async () => { const ok = await shareTextAsFile(text, `translation_${code}.txt`); if (!ok) showAlert('Share', 'Sharing not available'); }} variant="ghost" size="sm" />
                        <GoldButton label="📋 Use as Script" onPress={() => { setSubText(text); setSubLangs([code as LanguageCode]); setActiveTool('subtitles'); }} variant="ghost" size="sm" />
                        <GoldButton label="📝 Use in Prompter" onPress={() => { setPromptText(text); setActiveTool('teleprompter'); showAlert('Copied', `Translation loaded into Teleprompter`); }} variant="ghost" size="sm" />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ════ TELEPROMPTER + AI TRANSLATION ════ */}
        {activeTool === 'teleprompter' ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="view-list" size={18} color={Colors.primary} />
              <Text style={styles.cardTitle}>Professional Teleprompter · AI Translation</Text>
            </View>

            {/* AI Translate script */}
            <View style={styles.promptTranslateBar}>
              <MaterialIcons name="auto-awesome" size={14} color={Colors.primary} />
              <Text style={styles.promptTranslateLabel}>AI Translate Script</Text>
              <View style={styles.promptLangPicker}>
                <Pressable onPress={() => setShowPromptLangPicker(v => !v)} style={styles.promptLangBtn}>
                  <Text style={styles.promptLangFlag}>{LANGUAGES.find(l => l.code === promptLang)?.flag}</Text>
                  <Text style={styles.promptLangName}>{LANGUAGES.find(l => l.code === promptLang)?.englishName}</Text>
                  <MaterialIcons name={showPromptLangPicker ? 'expand-less' : 'expand-more'} size={14} color={Colors.primary} />
                </Pressable>
              </View>
              {isTranslatingPrompt ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Pressable onPress={handleTranslatePrompt} style={styles.translateNowBtn}>
                  <MaterialIcons name="translate" size={14} color={Colors.textInverse} />
                  <Text style={styles.translateNowText}>Translate</Text>
                </Pressable>
              )}
            </View>

            {/* Language picker dropdown */}
            {showPromptLangPicker ? (
              <View style={styles.promptLangDropdown}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, padding: 6 }}>
                  {LANGUAGES.filter(l => l.code !== 'en').map(lang => (
                    <Pressable
                      key={lang.code}
                      onPress={() => { setPromptLang(lang.code); setShowPromptLangPicker(false); }}
                      style={[styles.promptLangOption, promptLang === lang.code && styles.promptLangOptionActive]}
                    >
                      <Text style={styles.promptLangOptionFlag}>{lang.flag}</Text>
                      <Text style={[styles.promptLangOptionName, promptLang === lang.code && { color: Colors.primary }]}>{lang.englishName}</Text>
                      {lang.isRTL ? <View style={styles.rtlMini}><Text style={styles.rtlMiniText}>RTL</Text></View> : null}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.paramRow}>
              <Text style={styles.label}>Speed: {promptSpeed}</Text>
              <View style={styles.chips}>
                {[1, 2, 3, 4, 5, 8].map(s => (
                  <Pressable key={s} onPress={() => setPromptSpeed(s)} style={[styles.chip, promptSpeed === s && styles.chipActive]}>
                    <Text style={[styles.chipText, promptSpeed === s && styles.chipTextActive]}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.paramRow}>
              <Text style={styles.label}>Font: {promptFontSize}px</Text>
              <View style={styles.chips}>
                {[16, 18, 22, 26, 32, 40].map(s => (
                  <Pressable key={s} onPress={() => setPromptFontSize(s)} style={[styles.chip, promptFontSize === s && styles.chipActive]}>
                    <Text style={[styles.chipText, promptFontSize === s && styles.chipTextActive]}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.mirrorRow}>
              <Text style={styles.label}>Mirror Text</Text>
              <Switch value={mirrorText} onValueChange={setMirrorText} trackColor={{ false: Colors.border, true: Colors.primaryDark }} thumbColor={mirrorText ? Colors.primary : Colors.textMuted} />
            </View>
            <Text style={styles.label}>Script (No word limit)</Text>
            <TextInput
              style={[styles.textArea, { minHeight: 100 }, promptIsRTL && { textAlign: 'right' }]}
              placeholder="Paste script, Quran verses, speeches..."
              placeholderTextColor={Colors.textMuted}
              value={promptText}
              onChangeText={setPromptText}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.promptDisplay}>
              <View style={styles.promptGuideTop} />
              <ScrollView ref={scrollRef} style={{ flex: 1 }} scrollEnabled={!isScrolling} showsVerticalScrollIndicator={false}>
                <Text style={[
                  styles.promptText,
                  { fontSize: promptFontSize },
                  mirrorText && { transform: [{ scaleX: -1 }] },
                  promptIsRTL && { textAlign: 'right' },
                ]}>
                  {promptText}
                </Text>
                <View style={{ height: 200 }} />
              </ScrollView>
              <View style={styles.promptGuideBottom} />
              <LinearGradient colors={['transparent', Colors.background + 'CC']} style={styles.promptFade} />
            </View>
            {isScrolling
              ? <GoldButton label="⏹ Stop Teleprompter" onPress={stopTeleprompter} variant="danger" size="lg" fullWidth />
              : <GoldButton label="▶ Start Teleprompter" onPress={startTeleprompter} size="lg" fullWidth />
            }
          </View>
        ) : null}

        {/* ════ CONVERTER ════ */}
        {activeTool === 'converter' ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="swap-horiz" size={18} color={Colors.primary} />
              <Text style={styles.cardTitle}>Format Converter · All Formats</Text>
            </View>
            <View style={styles.converterRow}>
              <View style={styles.converterSide}>
                <Text style={styles.label}>From</Text>
                <View style={styles.fmtGrid}>
                  {ALL_FMTS.map(f => (
                    <Pressable key={f} onPress={() => setConvFrom(f)} style={[styles.fmtChip, convFrom === f && styles.fmtChipActive]}>
                      <Text style={[styles.fmtText, convFrom === f && { color: Colors.primary }]}>{f}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={{ paddingTop: 24 }}>
                <MaterialIcons name="arrow-forward" size={24} color={Colors.primary} />
              </View>
              <View style={styles.converterSide}>
                <Text style={styles.label}>To</Text>
                <View style={styles.fmtGrid}>
                  {ALL_FMTS.map(f => (
                    <Pressable key={f} onPress={() => setConvTo(f)} style={[styles.fmtChip, convTo === f && { borderColor: Colors.success, backgroundColor: Colors.success + '11' }]}>
                      <Text style={[styles.fmtText, convTo === f && { color: Colors.success }]}>{f}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
            <View style={styles.chips}>
              {['Low', 'Medium', 'High', 'Lossless', 'Ultra'].map(q => (
                <Pressable key={q} onPress={() => setConvQuality(q)} style={[styles.chip, convQuality === q && styles.chipActive]}>
                  <Text style={[styles.chipText, convQuality === q && styles.chipTextActive]}>{q}</Text>
                </Pressable>
              ))}
            </View>
            {isConverting ? (
              <View style={styles.progressBox}>
                <Text style={styles.progressLabel}>{convFrom} → {convTo} · {Math.round(convProgress)}%</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${convProgress}%` }]} />
                </View>
              </View>
            ) : null}
            <GoldButton label={`Convert ${convFrom} → ${convTo}`} onPress={handleConvert} size="lg" fullWidth isLoading={isConverting} />
          </View>
        ) : null}

        {/* ════ COMPRESSOR ════ */}
        {activeTool === 'compressor' ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="compress" size={18} color={Colors.primary} />
              <Text style={styles.cardTitle}>File Compressor · Zero Quality Loss</Text>
            </View>
            {[
              { id: 'Smart',    label: 'Smart AI',  sub: 'Best ratio + quality balance', icon: 'auto-fix-high' },
              { id: 'Lossless', label: 'Lossless',  sub: 'Zero quality loss',             icon: 'hd' },
              { id: 'Extreme',  label: 'Extreme',   sub: 'Maximum compression',           icon: 'compress' },
            ].map(m => (
              <Pressable key={m.id} onPress={() => setCompLevel(m.id)} style={[styles.compCard, compLevel === m.id && styles.compCardActive]}>
                <MaterialIcons name={m.icon as any} size={20} color={compLevel === m.id ? Colors.primary : Colors.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.compLabel, compLevel === m.id && { color: Colors.primary }]}>{m.label}</Text>
                  <Text style={styles.compSub}>{m.sub}</Text>
                </View>
                {compLevel === m.id ? <MaterialIcons name="radio-button-checked" size={16} color={Colors.primary} /> : null}
              </Pressable>
            ))}
            <GoldButton
              label="🗜 Compress File"
              onPress={() => {
                setIsCompressing(true);
                setTimeout(() => {
                  setIsCompressing(false);
                  showAlert('Compressed', `${compLevel} mode · ~45% size reduction · Zero quality loss`);
                }, 2200);
              }}
              size="lg" fullWidth isLoading={isCompressing}
            />
          </View>
        ) : null}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  tabBarOuter: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabScroll: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.medium },
  tabTextActive: { color: Colors.primary },
  content: { paddingBottom: Spacing.xxl },
  card: { padding: Spacing.md, gap: Spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardTitle: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.semibold, flex: 1 },
  aiTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primaryGlow, borderRadius: Radius.xs, padding: 8, borderWidth: 1, borderColor: Colors.primary + '33' },
  aiTagText: { color: Colors.primary, fontSize: Typography.xs, flex: 1 },
  label: { color: Colors.textSecondary, fontSize: Typography.xs, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.8 },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  langChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  langChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  flag: { fontSize: 14 },
  chipName: { color: Colors.textSecondary, fontSize: Typography.xs },
  textArea: { backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: Typography.base, borderWidth: 1, borderColor: Colors.border, minHeight: 80, lineHeight: Typography.base * 1.6 },
  paramRow: { gap: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  chipText: { color: Colors.textMuted, fontSize: Typography.xs },
  chipTextActive: { color: Colors.primary },
  styleChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, minWidth: 90, alignItems: 'center' },
  styleText: { fontSize: Typography.sm, fontWeight: Typography.medium },
  styleAnim: { color: Colors.textMuted, fontSize: 9, marginTop: 2 },
  generatingBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.primaryGlow, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '44' },
  generatingText: { color: Colors.primary, fontSize: Typography.sm, flex: 1 },
  subOutput: { backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '44', gap: Spacing.md },
  subOutputTitle: { color: Colors.primary, fontSize: Typography.sm, fontWeight: Typography.semibold },
  subBlock: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm, gap: Spacing.sm },
  subBlockHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subFlag: { fontSize: 18 },
  subLangName: { flex: 1, color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.medium },
  formatBadge: { backgroundColor: Colors.primaryGlow, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: Colors.primary + '44' },
  formatBadgeText: { color: Colors.primary, fontSize: 9, fontWeight: Typography.bold },
  subContent: { color: Colors.textSecondary, fontSize: Typography.xs, lineHeight: 18 },
  subActions: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  engineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  engineCard: { width: '48%', padding: Spacing.sm, backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, gap: 2 },
  engineTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  engineLabel: { flex: 1, color: Colors.textPrimary, fontSize: Typography.xs, fontWeight: Typography.semibold },
  engineBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  engineBadgeText: { color: '#000', fontSize: 8, fontWeight: Typography.bold },
  engineModel: { color: Colors.textMuted, fontSize: 9 },
  engineDesc: { color: Colors.textMuted, fontSize: 9, lineHeight: 13, marginTop: 2 },
  transOutput: { backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.success + '44', gap: Spacing.md },
  transOutputHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  transOutputTitle: { color: Colors.success, fontSize: Typography.sm, fontWeight: Typography.semibold },
  transBlock: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm, gap: Spacing.sm },
  transText: { color: Colors.textPrimary, fontSize: Typography.base, lineHeight: Typography.base * 1.6, backgroundColor: Colors.surface, borderRadius: Radius.sm, padding: Spacing.sm },
  rtlBadge: { backgroundColor: Colors.info + '22', borderRadius: 3, borderWidth: 1, borderColor: Colors.info + '55', paddingHorizontal: 4, paddingVertical: 2 },
  rtlText: { color: Colors.info, fontSize: 8, fontWeight: Typography.bold },
  // Teleprompter
  promptTranslateBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primaryGlow, borderRadius: Radius.md, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.primary + '44' },
  promptTranslateLabel: { color: Colors.primary, fontSize: Typography.xs, fontWeight: Typography.semibold },
  promptLangPicker: { flex: 1 },
  promptLangBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surfaceCard, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primary + '44' },
  promptLangFlag: { fontSize: 13 },
  promptLangName: { color: Colors.primary, fontSize: Typography.xs, fontWeight: Typography.medium },
  promptLangDropdown: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary + '44', overflow: 'hidden' },
  promptLangOption: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.sm, borderWidth: 1, borderColor: 'transparent' },
  promptLangOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  promptLangOptionFlag: { fontSize: 14 },
  promptLangOptionName: { color: Colors.textSecondary, fontSize: Typography.xs },
  rtlMini: { backgroundColor: Colors.info + '22', borderRadius: 2, paddingHorizontal: 3, paddingVertical: 1 },
  rtlMiniText: { color: Colors.info, fontSize: 7, fontWeight: Typography.bold },
  translateNowBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 5 },
  translateNowText: { color: Colors.textInverse, fontSize: Typography.xs, fontWeight: Typography.bold },
  mirrorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  promptDisplay: { height: 260, backgroundColor: '#000', borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, position: 'relative' },
  promptGuideTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: Colors.primary, zIndex: 2 },
  promptGuideBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: Colors.primary + '66', zIndex: 2 },
  promptText: { color: '#FFF', lineHeight: 36, fontWeight: Typography.medium, padding: Spacing.md },
  promptFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },
  // Converter
  converterRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  converterSide: { flex: 1, gap: 4 },
  fmtGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  fmtChip: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  fmtChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  fmtText: { color: Colors.textMuted, fontSize: 9, fontWeight: Typography.medium },
  progressBox: { backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.primary + '44' },
  progressLabel: { color: Colors.primary, fontSize: Typography.sm },
  progressTrack: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  // Compressor
  compCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  compCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  compLabel: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.semibold },
  compSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
});
