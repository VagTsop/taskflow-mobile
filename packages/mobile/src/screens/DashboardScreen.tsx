import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Surface, useTheme, FAB, Divider, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/client';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/CreateTaskModal';
import { useTaskStore } from '../stores/taskStore';

export default function DashboardScreen({ navigation }: any) {
  const theme = useTheme();
  const { user } = useAuthStore();
  const { createTask } = useTaskStore();
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    try {
      const d = await api.getDashboard();
      setData(d);
    } catch {}
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleCreate = async (taskData: any) => {
    await createTask(taskData);
    load();
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (!data) return null;

  const { stats, upcoming, overdueTasks, recentlyCompleted, projectStats } = data;
  const totalDone = data.byStatus?.find((s: any) => s.status === 'done')?.count || 0;
  const completion = stats.totalTasks > 0 ? totalDone / stats.totalTasks : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{getGreeting()}</Text>
            <Text variant="headlineSmall" style={styles.name}>{user?.name?.split(' ')[0]}</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: user?.avatar_color || theme.colors.primary }]}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <Surface style={[styles.statCard, { borderLeftColor: '#1976d2' }]} elevation={1}>
            <MaterialCommunityIcons name="clipboard-list" size={24} color="#1976d2" />
            <Text variant="headlineSmall" style={styles.statNum}>{stats.totalTasks}</Text>
            <Text variant="labelSmall" style={styles.statLabel}>Total Tasks</Text>
          </Surface>
          <Surface style={[styles.statCard, { borderLeftColor: '#4caf50' }]} elevation={1}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#4caf50" />
            <Text variant="headlineSmall" style={styles.statNum}>{stats.completedToday}</Text>
            <Text variant="labelSmall" style={styles.statLabel}>Done Today</Text>
          </Surface>
          <Surface style={[styles.statCard, { borderLeftColor: '#ff9800' }]} elevation={1}>
            <MaterialCommunityIcons name="progress-clock" size={24} color="#ff9800" />
            <Text variant="headlineSmall" style={styles.statNum}>{stats.inProgress}</Text>
            <Text variant="labelSmall" style={styles.statLabel}>In Progress</Text>
          </Surface>
          <Surface style={[styles.statCard, { borderLeftColor: '#d32f2f' }]} elevation={1}>
            <MaterialCommunityIcons name="alert-circle" size={24} color="#d32f2f" />
            <Text variant="headlineSmall" style={styles.statNum}>{stats.overdue}</Text>
            <Text variant="labelSmall" style={styles.statLabel}>Overdue</Text>
          </Surface>
        </View>

        {/* Progress */}
        <Surface style={styles.section} elevation={1}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Overall Progress</Text>
            <Text variant="labelLarge" style={{ color: theme.colors.primary }}>{Math.round(completion * 100)}%</Text>
          </View>
          <ProgressBar progress={completion} color={theme.colors.primary} style={styles.progressBar} />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            {totalDone} of {stats.totalTasks} tasks completed
          </Text>
        </Surface>

        {/* Overdue */}
        {overdueTasks.length > 0 && (
          <Surface style={[styles.section, { borderLeftWidth: 3, borderLeftColor: '#d32f2f' }]} elevation={1}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: '#d32f2f' }]}>
              <MaterialCommunityIcons name="alert" size={18} color="#d32f2f" /> Overdue Tasks
            </Text>
            {overdueTasks.map((t: any) => (
              <TaskCard key={t.id} task={t} compact onPress={() => navigation.navigate('TaskDetail', { taskId: t.id })} />
            ))}
          </Surface>
        )}

        {/* Upcoming */}
        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Upcoming Tasks</Text>
          {upcoming.length === 0 ? (
            <Text variant="bodyMedium" style={{ opacity: 0.5, padding: 8 }}>No upcoming tasks</Text>
          ) : (
            upcoming.slice(0, 5).map((t: any) => (
              <TaskCard key={t.id} task={t} compact onPress={() => navigation.navigate('TaskDetail', { taskId: t.id })} />
            ))
          )}
        </Surface>

        {/* Projects */}
        {projectStats.length > 0 && (
          <Surface style={styles.section} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Projects</Text>
            {projectStats.map((p: any) => (
              <View key={p.id} style={styles.projectRow}>
                <View style={[styles.projectDot, { backgroundColor: p.color }]} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{p.name}</Text>
                  <ProgressBar progress={p.total > 0 ? p.done / p.total : 0} color={p.color} style={styles.miniProgress} />
                </View>
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>{p.done}/{p.total}</Text>
              </View>
            ))}
          </Surface>
        )}

        {/* Recently Completed */}
        {recentlyCompleted.length > 0 && (
          <Surface style={styles.section} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Recently Completed</Text>
            {recentlyCompleted.map((t: any) => (
              <TaskCard key={t.id} task={t} compact onPress={() => navigation.navigate('TaskDetail', { taskId: t.id })} />
            ))}
          </Surface>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <FAB icon="plus" onPress={() => setShowCreate(true)} style={[styles.fab, { backgroundColor: theme.colors.primary }]} color="white" />

      <CreateTaskModal visible={showCreate} onDismiss={() => setShowCreate(false)} onSave={handleCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  name: { fontWeight: '700' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontSize: 18, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, minWidth: '46%', padding: 14, borderRadius: 12, borderLeftWidth: 3, alignItems: 'flex-start' },
  statNum: { fontWeight: '700', marginTop: 4 },
  statLabel: { opacity: 0.6, marginTop: 2 },
  section: { padding: 16, borderRadius: 12, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontWeight: '700', marginBottom: 12 },
  progressBar: { height: 8, borderRadius: 4 },
  projectRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  projectDot: { width: 12, height: 12, borderRadius: 6 },
  miniProgress: { height: 4, borderRadius: 2, marginTop: 4 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
