import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, useTheme, Surface, FAB, ProgressBar, IconButton, Portal, Dialog, TextInput, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useProjectStore } from '../stores/projectStore';

const PROJECT_COLORS = ['#1976d2','#9c27b0','#2e7d32','#ff9800','#d32f2f','#0288d1','#7b1fa2','#f44336','#00897b','#5c6bc0'];

export default function ProjectsScreen({ navigation }: any) {
  const theme = useTheme();
  const { projects, loading, fetchProjects, createProject, updateProject, deleteProject } = useProjectStore();
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#1976d2');
  const [showDeleteId, setShowDeleteId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { fetchProjects(); }, []));

  const onRefresh = async () => { setRefreshing(true); await fetchProjects(); setRefreshing(false); };

  const openCreate = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setColor(PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]);
    setShowDialog(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description || '');
    setColor(p.color);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editingId) {
      await updateProject(editingId, { name, description, color });
    } else {
      await createProject({ name, description, color });
    }
    setShowDialog(false);
    fetchProjects();
  };

  const handleDelete = async () => {
    if (showDeleteId) {
      await deleteProject(showDeleteId);
      setShowDeleteId(null);
    }
  };

  const renderProject = ({ item }: any) => {
    const progress = item.task_count > 0 ? item.done_count / item.task_count : 0;
    return (
      <Surface style={styles.card} elevation={1}>
        <View style={styles.cardHeader}>
          <View style={[styles.colorBar, { backgroundColor: item.color }]} />
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={styles.cardTitle}>{item.name}</Text>
            {item.description ? <Text variant="bodySmall" style={{ opacity: 0.6 }} numberOfLines={2}>{item.description}</Text> : null}
          </View>
          <View style={styles.cardActions}>
            <IconButton icon="pencil" size={18} onPress={() => openEdit(item)} />
            <IconButton icon="delete" size={18} iconColor="#d32f2f" onPress={() => setShowDeleteId(item.id)} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="clipboard-list" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>{item.task_count} tasks</Text>
          </View>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#4caf50" />
            <Text variant="labelMedium" style={{ color: '#4caf50' }}>{item.done_count} done</Text>
          </View>
          <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: '700' }}>{Math.round(progress * 100)}%</Text>
        </View>

        <ProgressBar progress={progress} color={item.color} style={styles.progressBar} />
      </Surface>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={renderProject}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="folder-plus" size={64} color={theme.colors.onSurfaceVariant + '44'} />
            <Text variant="bodyLarge" style={{ opacity: 0.5, marginTop: 12 }}>No projects yet</Text>
            <Button mode="contained" onPress={openCreate} style={{ marginTop: 16 }}>Create Project</Button>
          </View>
        }
      />

      <FAB icon="plus" onPress={openCreate} style={[styles.fab, { backgroundColor: theme.colors.primary }]} color="white" />

      {/* Create/Edit Dialog */}
      <Portal>
        <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)}>
          <Dialog.Title>{editingId ? 'Edit Project' : 'New Project'}</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Project Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
            <TextInput label="Description (optional)" value={description} onChangeText={setDescription} mode="outlined" multiline style={styles.input} />
            <Text variant="labelMedium" style={{ marginBottom: 8 }}>Color</Text>
            <View style={styles.colorPicker}>
              {PROJECT_COLORS.map((c) => (
                <View key={c} style={[styles.colorOption, { backgroundColor: c }, color === c ? styles.colorSelected : undefined]}
                  onTouchEnd={() => setColor(c)} />
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDialog(false)}>Cancel</Button>
            <Button onPress={handleSave} disabled={!name.trim()}>{editingId ? 'Save' : 'Create'}</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={!!showDeleteId} onDismiss={() => setShowDeleteId(null)}>
          <Dialog.Title>Delete Project</Dialog.Title>
          <Dialog.Content>
            <Text>This will also delete all tasks in this project. Are you sure?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteId(null)}>Cancel</Button>
            <Button textColor="#d32f2f" onPress={handleDelete}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16 },
  card: { padding: 16, borderRadius: 12, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  colorBar: { width: 4, borderRadius: 2, alignSelf: 'stretch' },
  cardTitle: { fontWeight: '700' },
  cardActions: { flexDirection: 'row' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  progressBar: { height: 6, borderRadius: 3 },
  empty: { alignItems: 'center', paddingTop: 100 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  input: { marginBottom: 12 },
  colorPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorOption: { width: 32, height: 32, borderRadius: 16 },
  colorSelected: { borderWidth: 3, borderColor: 'white', elevation: 4 },
});
