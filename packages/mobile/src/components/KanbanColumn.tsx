import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, useTheme, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TaskCard from './TaskCard';

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  todo: { label: 'To Do', icon: 'circle-outline', color: '#757575' },
  in_progress: { label: 'In Progress', icon: 'progress-clock', color: '#1976d2' },
  review: { label: 'Review', icon: 'eye-check', color: '#ff9800' },
  done: { label: 'Done', icon: 'check-circle', color: '#4caf50' },
};

interface Props {
  status: string;
  tasks: any[];
  onTaskPress: (task: any) => void;
  onAddPress: () => void;
  width: number;
}

export default function KanbanColumn({ status, tasks, onTaskPress, onAddPress, width }: Props) {
  const theme = useTheme();
  const cfg = STATUS_CONFIG[status];

  return (
    <View style={[styles.column, { width }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name={cfg.icon as any} size={18} color={cfg.color} />
          <Text variant="titleSmall" style={[styles.headerTitle, { color: cfg.color }]}>{cfg.label}</Text>
          <View style={[styles.badge, { backgroundColor: cfg.color + '22' }]}>
            <Text variant="labelSmall" style={{ color: cfg.color, fontWeight: '700' }}>{tasks.length}</Text>
          </View>
        </View>
        <IconButton icon="plus" size={18} onPress={onAddPress} />
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard task={item} onPress={() => onTaskPress(item)} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodySmall" style={{ opacity: 0.4 }}>No tasks</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  column: { marginRight: 12, height: '100%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 1, borderRadius: 10 },
  list: { paddingBottom: 16 },
  empty: { alignItems: 'center', paddingVertical: 32 },
});
