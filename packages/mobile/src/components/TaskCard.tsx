import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Chip, useTheme, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#d32f2f',
  high: '#f57c00',
  medium: '#1976d2',
  low: '#757575',
};

const PRIORITY_ICONS: Record<string, string> = {
  urgent: 'alert-circle',
  high: 'arrow-up-bold',
  medium: 'minus',
  low: 'arrow-down-bold',
};

interface Props {
  task: any;
  onPress: () => void;
  compact?: boolean;
}

export default function TaskCard({ task, onPress, compact }: Props) {
  const theme = useTheme();
  const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date(new Date().toISOString().slice(0, 10));
  const isToday = task.due_date === new Date().toISOString().slice(0, 10);

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d === today.toISOString().slice(0, 10)) return 'Today';
    if (d === tomorrow.toISOString().slice(0, 10)) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (compact) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.compactRow, { borderLeftColor: PRIORITY_COLORS[task.priority] }]}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium" numberOfLines={1} style={task.status === 'done' ? styles.doneText : undefined}>{task.title}</Text>
            {task.project_name && <Text variant="labelSmall" style={{ color: task.project_color || theme.colors.primary }}>{task.project_name}</Text>}
          </View>
          {task.due_date && (
            <Text variant="labelSmall" style={{ color: isOverdue ? '#d32f2f' : isToday ? '#f57c00' : theme.colors.onSurfaceVariant }}>
              {formatDate(task.due_date)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Surface style={styles.card} elevation={1}>
        <View style={styles.topRow}>
          <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
          <MaterialCommunityIcons
            name={PRIORITY_ICONS[task.priority] as any}
            size={14}
            color={PRIORITY_COLORS[task.priority]}
          />
          <Text variant="labelSmall" style={{ color: PRIORITY_COLORS[task.priority], marginLeft: 2, textTransform: 'capitalize' }}>
            {task.priority}
          </Text>
        </View>

        <Text variant="titleSmall" style={[styles.title, task.status === 'done' ? styles.doneText : undefined]} numberOfLines={2}>
          {task.title}
        </Text>

        {task.description ? (
          <Text variant="bodySmall" style={styles.desc} numberOfLines={2}>{task.description}</Text>
        ) : null}

        {task.labels?.length > 0 && (
          <View style={styles.labelsRow}>
            {task.labels.slice(0, 3).map((l: any) => (
              <View key={l.id} style={[styles.labelChip, { backgroundColor: l.color + '22' }]}>
                <Text variant="labelSmall" style={{ color: l.color, fontSize: 10 }}>{l.name}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          {task.project_name && (
            <View style={styles.projectBadge}>
              <View style={[styles.projectDot, { backgroundColor: task.project_color }]} />
              <Text variant="labelSmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>{task.project_name}</Text>
            </View>
          )}
          {task.due_date && (
            <View style={[styles.dueBadge, isOverdue ? styles.overdueBadge : isToday ? styles.todayBadge : undefined]}>
              <MaterialCommunityIcons name="calendar" size={12} color={isOverdue ? '#d32f2f' : isToday ? '#f57c00' : '#757575'} />
              <Text variant="labelSmall" style={{ color: isOverdue ? '#d32f2f' : isToday ? '#f57c00' : '#757575', marginLeft: 2 }}>
                {formatDate(task.due_date)}
              </Text>
            </View>
          )}
        </View>
      </Surface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 12, marginBottom: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  priorityDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  title: { fontWeight: '600', marginBottom: 4 },
  doneText: { textDecorationLine: 'line-through', opacity: 0.5 },
  desc: { opacity: 0.6, marginBottom: 8 },
  labelsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
  labelChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  projectBadge: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 4 },
  projectDot: { width: 8, height: 8, borderRadius: 4 },
  dueBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  overdueBadge: { backgroundColor: '#d32f2f15' },
  todayBadge: { backgroundColor: '#f57c0015' },
  compactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderLeftWidth: 3, gap: 8 },
});
