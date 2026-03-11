import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { Text, useTheme, Chip, Menu, IconButton, Searchbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useTaskStore } from '../stores/taskStore';
import { useProjectStore } from '../stores/projectStore';
import KanbanColumn from '../components/KanbanColumn';
import CreateTaskModal from '../components/CreateTaskModal';

const STATUSES = ['todo', 'in_progress', 'review', 'done'] as const;
const SCREEN_WIDTH = Dimensions.get('window').width;
const COLUMN_WIDTH = Math.max(SCREEN_WIDTH * 0.72, 280);

export default function KanbanScreen({ navigation }: any) {
  const theme = useTheme();
  const { kanban, fetchKanban, createTask } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();
  const [selectedProject, setSelectedProject] = useState<string | undefined>();
  const [showCreate, setShowCreate] = useState(false);
  const [createStatus, setCreateStatus] = useState('todo');
  const [refreshing, setRefreshing] = useState(false);

  const load = () => {
    fetchKanban(selectedProject);
    fetchProjects();
  };

  useFocusEffect(useCallback(() => { load(); }, [selectedProject]));

  const onRefresh = async () => { setRefreshing(true); await fetchKanban(selectedProject); setRefreshing(false); };

  const handleCreate = async (data: any) => {
    await createTask(data);
    load();
  };

  const openCreate = (status: string) => {
    setCreateStatus(status);
    setShowCreate(true);
  };

  return (
    <View style={styles.container}>
      {/* Project Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        <Chip
          selected={!selectedProject}
          onPress={() => setSelectedProject(undefined)}
          style={styles.filterChip}
          compact
        >
          All Projects
        </Chip>
        {projects.map((p) => (
          <Chip
            key={p.id}
            selected={selectedProject === p.id}
            onPress={() => setSelectedProject(selectedProject === p.id ? undefined : p.id)}
            style={styles.filterChip}
            selectedColor={p.color}
            compact
          >
            {p.name}
          </Chip>
        ))}
      </ScrollView>

      {/* Kanban Board */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.boardContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={kanban[status] || []}
            width={COLUMN_WIDTH}
            onTaskPress={(task) => navigation.navigate('TaskDetail', { taskId: task.id })}
            onAddPress={() => openCreate(status)}
          />
        ))}
      </ScrollView>

      <CreateTaskModal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        onSave={handleCreate}
        initialStatus={createStatus}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterRow: { maxHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e0e0e0' },
  filterContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  filterChip: { marginRight: 4 },
  boardContent: { padding: 12 },
});
