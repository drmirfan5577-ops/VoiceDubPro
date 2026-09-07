// Powered by OnSpace.AI — Library Tab
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { useStudio } from '@/hooks/useStudio';
import { useAlert } from '@/template';
import { ProjectCard } from '@/components/feature/ProjectCard';
import { AppHeader } from '@/components/layout/AppHeader';
import { GoldButton } from '@/components/ui/GoldButton';
import { DubProject } from '@/contexts/StudioContext';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLanguage();
  const { projects, createProject, deleteProject, setActiveProject } = useStudio();
  const { showAlert } = useAlert();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const filtered = search
    ? projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  const handleCreate = () => {
    if (newName.trim().length < 2) {
      showAlert('Error', 'Project name must be at least 2 characters');
      return;
    }
    const proj = createProject(newName.trim());
    setNewName('');
    setCreating(false);
    setActiveProject(proj);
    router.push('/(tabs)/studio');
  };

  const handleOpen = (project: DubProject) => {
    setActiveProject(project);
    router.push('/(tabs)/studio');
  };

  const handleDelete = (id: string) => {
    showAlert('Delete Project', 'This cannot be undone.', [
      { text: t.cancel, style: 'cancel' },
      { text: t.delete_track, style: 'destructive', onPress: () => deleteProject(id) },
    ]);
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />
      <AppHeader showLangPicker />

      {/* Hero banner */}
      <View style={styles.heroBanner}>
        <Image
          source={require('@/assets/images/waveform_bg.png')}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={200}
        />
        <LinearGradient
          colors={['rgba(8,8,8,0.4)', 'rgba(8,8,8,0.85)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.heroContent}>
          <Text style={[styles.heroTitle, isRTL && { textAlign: 'right' }]}>
            {t.recent_projects}
          </Text>
          <Text style={styles.heroSub}>
            {projects.length} {projects.length === 1 ? 'Project' : 'Projects'} · Multi-Language
          </Text>
        </View>
        <GoldButton
          label={`+ ${t.start_dubbing}`}
          onPress={() => setCreating(true)}
          size="sm"
          style={styles.heroBtn}
        />
      </View>

      {/* Search */}
      <View style={[styles.searchRow, isRTL && { flexDirection: 'row-reverse' }]}>
        <MaterialIcons name="search" size={20} color={Colors.textMuted} />
        <TextInput
          style={[styles.searchInput, isRTL && { textAlign: 'right' }]}
          placeholder="Search projects..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <MaterialIcons name="close" size={18} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Create modal */}
      {creating ? (
        <View style={styles.createBox}>
          <Text style={styles.createTitle}>New Project</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="Project name..."
            placeholderTextColor={Colors.textMuted}
            value={newName}
            onChangeText={setNewName}
            autoFocus
          />
          <View style={styles.createActions}>
            <GoldButton label={t.cancel} onPress={() => setCreating(false)} variant="ghost" size="sm" />
            <GoldButton label={t.save} onPress={handleCreate} size="sm" />
          </View>
        </View>
      ) : null}

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Image
            source={require('@/assets/images/empty_library.png')}
            style={styles.emptyImage}
            contentFit="contain"
            transition={200}
          />
          <Text style={styles.emptyTitle}>{t.no_projects}</Text>
          <Text style={styles.emptySub}>{t.recording_tip}</Text>
          <GoldButton
            label={`+ ${t.start_dubbing}`}
            onPress={() => setCreating(true)}
            size="lg"
            fullWidth
            style={{ marginTop: Spacing.lg }}
          />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ProjectCard
              project={item}
              onPress={() => handleOpen(item)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  heroBanner: {
    height: 110,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  heroContent: { gap: 4 },
  heroTitle: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: Typography.bold },
  heroSub: { color: Colors.primary, fontSize: Typography.sm },
  heroBtn: { zIndex: 1 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.base,
    height: 44,
    includeFontPadding: false,
  },
  createBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    ...Shadow.gold,
    gap: Spacing.md,
  },
  createTitle: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: Typography.semibold },
  nameInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  createActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  emptyImage: { width: 140, height: 140, marginBottom: Spacing.md },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    textAlign: 'center',
  },
  emptySub: {
    color: Colors.textMuted,
    fontSize: Typography.base,
    textAlign: 'center',
    lineHeight: Typography.base * 1.6,
  },
});
