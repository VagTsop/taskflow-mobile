import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, useTheme, Surface, Chip, Button, IconButton, Menu, Divider, Portal, Dialog } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useTaskStore } from '../stores/taskStore';
import CreateTaskModal from '../components/CreateTaskModal';

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  todo: { label: 'To Do', icon: 'circle-outline', color: '#757575' },
  in_progress: { label: 'In Progress', icon: 'progress-clock', color: '#1976d2' },
  review: { label: 'Review', icon: 'eye-check', color: '#ff9800' },
  done: { label: 'Done', icon: 'check-circle', color: '#4caf50' },
};

const PRIORITY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  low: { label: 'Low', icon: 'arrow-down-bold', color: '#757575' },
  medium: { label: 'Medium', icon: 'minus', color: '#1976d2' },
  high: { label: 'High', icon: 'arrow-up-bold', color: '#f57c00' },
  urgent: { label: 'Urgent', icon: 'alert-circle', color: '#d32f2f' },
};

const STATUSES = ['todo', 'in_progress', 'review', 'done'];

export default function TaskDetailScreen({ route, navigation }: any) {
  const theme = useTheme();
  const { taskId } = route.params;
  const { moveTask, deleteTask } = useTaskStore();
  const [task, setTask] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const load = async () => {
    try {
      const t = await api.getTask(taskId);
      setTask(t);
    } catch {
      navigation.goBack();
    }
  };

  useEffect(() => { load(); }, [taskId]);

  const handleStatusChange = async (status: string) => {
    setShowStatusMenu(false);
    try {
      await moveTask(taskId, status);
      setTask((t: any) => ({ ...t, status }));
    } catch {}
  };

  const handleDelete = async () => {
    setShowDelete(false);
    try {
      await deleteTask(taskId);
      navigation.goBack();
    } catch {}
  };

  const handleSaveEdit = async (data: any) => {
    try {
      const updated = await api.updateTask(taskId, data);
      setTask(updated);
    } catch {}
  };

  if (!task) return null;

  const statusCfg = STATUS_CONFIG[task.status];
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const isOverdue = task.due_date && task.status !== 'done' && task.due_date < new Date().toISOString().slice(0, 10);

  const formatDate = (d: string) => {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <View style={{ flex: 1 }} />
        <IconButton icon="pencil" onPress={() => setShowEdit(true)} />
        <IconButton icon="delete" iconColor="#d32f2f" onPress={() => setShowDelete(true)} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Title & Priority */}
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name={priorityCfg.icon as any} size={24} color={priorityCfg.color} />
          <Text variant="headlineSmall" style={styles.title}>{task.title}</Text>
        </View>

        {/* Status Chips */}
        <View style={styles.chipRow}>
          <Menu
            visible={showStatusMenu}
            onDismiss={() => setShowStatusMenu(false)}
            anchor={
              <Chip
                icon={statusCfg.icon}
                selectedColor={statusCfg.color}
                selected
                onPress={() => setShowStatusMenu(true)}
                style={styles.statusChip}
              >
                {statusCfg.label}
              </Chip>
            }
          >
            {STATUSES.map((s) => (
              <Menu.Item
                key={s}
                title={STATUS_CONFIG[s].label}
                leadingIcon={STATUS_CONFIG[s].icon}
                onPress={() => handleStatusChange(s)}
                titleStyle={task.status === s ? { fontWeight: '700' } : undefined}
              />
            ))}
          </Menu>

          <Chip
            icon={priorityCfg.icon}
            selectedColor={priorityCfg.color}
            style={styles.chip}
          >
            {priorityCfg.label}
          </Chip>
        </View>

        {/* Description */}
        {task.description ? (
          <Surface style={styles.section} elevation={1}>
            <Text variant="labelLarge" style={styles.sectionLabel}>Description</Text>
            <Text variant="bodyMedium" style={{ lineHeight: 22 }}>{task.description}</Text>
          </Surface>
        ) : null}

        {/* Details */}
        <Surface style={styles.section} elevation={1}>
          <Text variant="labelLarge" style={styles.sectionLabel}>Details</Text>

          {task.project_name && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="folder" size={20} color={task.project_color || theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.detailText}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>Project: </Text>
                {task.project_name}
              </Text>
            </View>
          )}

          {task.due_date && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="calendar" size={20} color={isOverdue ? '#d32f2f' : theme.colors.onSurfaceVariant} />
              <Text variant="bodyMedium" style={[styles.detailText, isOverdue ? { color: '#d32f2f', fontWeight: '600' } : undefined]}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>Due: </Text>
                {formatDate(task.due_date)}
                {isOverdue ? ' (Overdue)' : ''}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={styles.detailText}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>Created: </Text>
              {new Date(task.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>

          {task.completed_at && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#4caf50" />
              <Text variant="bodyMedium" style={styles.detailText}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>Completed: </Text>
                {new Date(task.completed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          )}
        </Surface>

        {/* Labels */}
        {task.labels?.length > 0 && (
          <Surface style={styles.section} elevation={1}>
            <Text variant="labelLarge" style={styles.sectionLabel}>Labels</Text>
            <View style={styles.labelsWrap}>
              {task.labels.map((l: any) => (
                <Chip key={l.id} style={{ backgroundColor: l.color + '22' }} textStyle={{ color: l.color }}>
                  {l.name}
                </Chip>
              ))}
            </View>
          </Surface>
        )}

        {/* Quick Actions */}
        <Surface style={styles.section} elevation={1}>
          <Text variant="labelLarge" style={styles.sectionLabel}>Quick Move</Text>
          <View style={styles.moveRow}>
            {STATUSES.filter((s) => s !== task.status).map((s) => (
              <Button
                key={s}
                mode="outlined"
                compact
                icon={STATUS_CONFIG[s].icon}
                onPress={() => handleStatusChange(s)}
                style={styles.moveBtn}
                labelStyle={{ fontSize: 12 }}
              >
                {STATUS_CONFIG[s].label}
              </Button>
            ))}
          </View>
        </Surface>
      </ScrollView>

      <CreateTaskModal
        visible={showEdit}
        onDismiss={() => setShowEdit(false)}
        onSave={handleSaveEdit}
        initialData={task}
      />

      <Portal>
        <Dialog visible={showDelete} onDismiss={() => setShowDelete(false)}>
          <Dialog.Title>Delete Task</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete "{task.title}"?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDelete(false)}>Cancel</Button>
            <Button textColor="#d32f2f" onPress={handleDelete}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  scroll: { padding: 16, paddingTop: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  title: { fontWeight: '700', flex: 1 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statusChip: {},
  chip: {},
  section: { padding: 16, borderRadius: 12, marginBottom: 12 },
  sectionLabel: { fontWeight: '700', marginBottom: 10, opacity: 0.7 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  detailText: { flex: 1 },
  labelsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moveRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moveBtn: { flex: 1, minWidth: 100 },
});
