import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Modal, Portal, TextInput, Button, Text, useTheme, SegmentedButtons, Chip, IconButton, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useProjectStore } from '../stores/projectStore';
import { api } from '../api/client';

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  initialStatus?: string;
}

export default function CreateTaskModal({ visible, onDismiss, onSave, initialData, initialStatus }: Props) {
  const theme = useTheme();
  const { projects, fetchProjects } = useProjectStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [labels, setLabels] = useState<any[]>([]);
  const [allLabels, setAllLabels] = useState<any[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchProjects();
      api.getLabels().then(setAllLabels).catch(() => {});
      if (initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setPriority(initialData.priority || 'medium');
        setStatus(initialData.status || 'todo');
        setProjectId(initialData.project_id || null);
        setDueDate(initialData.due_date || '');
        setSelectedLabels(initialData.labels?.map((l: any) => l.id) || []);
      } else {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setStatus(initialStatus || 'todo');
        setProjectId(null);
        setDueDate('');
        setSelectedLabels([]);
      }
    }
  }, [visible, initialData, initialStatus]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        project_id: projectId,
        due_date: dueDate || null,
        labels: selectedLabels,
      });
      onDismiss();
    } catch {}
    setSaving(false);
  };

  const toggleLabel = (id: string) => {
    setSelectedLabels((prev) => prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]);
  };

  const setQuickDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().slice(0, 10));
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text variant="titleLarge" style={styles.modalTitle}>{initialData ? 'Edit Task' : 'New Task'}</Text>

          <TextInput label="Title" value={title} onChangeText={setTitle} mode="outlined" style={styles.input} />
          <TextInput label="Description" value={description} onChangeText={setDescription} mode="outlined" multiline numberOfLines={3} style={styles.input} />

          <Text variant="labelLarge" style={styles.sectionLabel}>Priority</Text>
          <SegmentedButtons value={priority} onValueChange={setPriority} buttons={PRIORITIES} style={styles.segmented} />

          <Text variant="labelLarge" style={styles.sectionLabel}>Status</Text>
          <SegmentedButtons value={status} onValueChange={setStatus} buttons={STATUSES} density="small" style={styles.segmented} />

          <Text variant="labelLarge" style={styles.sectionLabel}>Project</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <Chip
              selected={!projectId}
              onPress={() => setProjectId(null)}
              style={styles.chip}
              compact
            >
              None
            </Chip>
            {projects.map((p) => (
              <Chip
                key={p.id}
                selected={projectId === p.id}
                onPress={() => setProjectId(p.id)}
                style={styles.chip}
                compact
                selectedColor={p.color}
              >
                {p.name}
              </Chip>
            ))}
          </ScrollView>

          <Text variant="labelLarge" style={styles.sectionLabel}>Due Date</Text>
          <TextInput
            label="YYYY-MM-DD"
            value={dueDate}
            onChangeText={setDueDate}
            mode="outlined"
            style={styles.input}
            right={dueDate ? <TextInput.Icon icon="close" onPress={() => setDueDate('')} /> : undefined}
          />
          <View style={styles.quickDates}>
            <Chip compact onPress={() => setQuickDate(0)} icon="calendar-today">Today</Chip>
            <Chip compact onPress={() => setQuickDate(1)} icon="calendar-arrow-right">Tomorrow</Chip>
            <Chip compact onPress={() => setQuickDate(7)} icon="calendar-week">Next Week</Chip>
          </View>

          {allLabels.length > 0 && (
            <>
              <Text variant="labelLarge" style={styles.sectionLabel}>Labels</Text>
              <View style={styles.labelsWrap}>
                {allLabels.map((l) => (
                  <Chip
                    key={l.id}
                    selected={selectedLabels.includes(l.id)}
                    onPress={() => toggleLabel(l.id)}
                    style={[styles.chip, { borderColor: l.color }]}
                    selectedColor={l.color}
                    compact
                  >
                    {l.name}
                  </Chip>
                ))}
              </View>
            </>
          )}

          <View style={styles.actions}>
            <Button mode="outlined" onPress={onDismiss} style={styles.actionBtn}>Cancel</Button>
            <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving || !title.trim()} style={styles.actionBtn}>
              {initialData ? 'Save' : 'Create'}
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: { margin: 16, padding: 24, borderRadius: 16, maxHeight: '90%' },
  modalTitle: { fontWeight: '700', marginBottom: 16 },
  input: { marginBottom: 12 },
  sectionLabel: { fontWeight: '600', marginTop: 8, marginBottom: 8 },
  segmented: { marginBottom: 8 },
  chipScroll: { marginBottom: 8 },
  chip: { marginRight: 6, marginBottom: 4 },
  quickDates: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  labelsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  actionBtn: { minWidth: 100 },
});
