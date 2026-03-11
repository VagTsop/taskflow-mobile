import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Text, useTheme, FAB, Chip, Surface } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { useTaskStore } from '../stores/taskStore';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/CreateTaskModal';

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#d32f2f',
  high: '#f57c00',
  medium: '#1976d2',
  low: '#757575',
};

export default function CalendarScreen({ navigation }: any) {
  const theme = useTheme();
  const { calendarTasks, fetchCalendar, createTask } = useTaskStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [currentMonth, setCurrentMonth] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [showCreate, setShowCreate] = useState(false);

  useFocusEffect(useCallback(() => {
    fetchCalendar(currentMonth.month, currentMonth.year);
  }, [currentMonth]));

  const markedDates: any = {};
  calendarTasks.forEach((t: any) => {
    if (!t.due_date) return;
    if (!markedDates[t.due_date]) {
      markedDates[t.due_date] = { dots: [] };
    }
    const color = PRIORITY_COLORS[t.priority] || '#1976d2';
    if (markedDates[t.due_date].dots.length < 3 && !markedDates[t.due_date].dots.find((d: any) => d.color === color)) {
      markedDates[t.due_date].dots.push({ key: t.id, color });
    }
  });

  if (markedDates[selectedDate]) {
    markedDates[selectedDate] = { ...markedDates[selectedDate], selected: true, selectedColor: theme.colors.primary };
  } else {
    markedDates[selectedDate] = { selected: true, selectedColor: theme.colors.primary };
  }

  const dayTasks = calendarTasks.filter((t: any) => t.due_date === selectedDate);

  const handleCreate = async (data: any) => {
    await createTask({ ...data, due_date: selectedDate });
    fetchCalendar(currentMonth.month, currentMonth.year);
  };

  const formatSelectedDate = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    const today = new Date().toISOString().slice(0, 10);
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    if (selectedDate === today) return 'Today';
    if (selectedDate === tmr.toISOString().slice(0, 10)) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <Calendar
        markedDates={markedDates}
        markingType="multi-dot"
        onDayPress={(day: any) => setSelectedDate(day.dateString)}
        onMonthChange={(m: any) => setCurrentMonth({ month: m.month, year: m.year })}
        theme={{
          backgroundColor: theme.colors.surface,
          calendarBackground: theme.colors.surface,
          textSectionTitleColor: theme.colors.onSurfaceVariant,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: '#ffffff',
          todayTextColor: theme.colors.primary,
          dayTextColor: theme.colors.onSurface,
          textDisabledColor: theme.colors.onSurfaceVariant + '44',
          arrowColor: theme.colors.primary,
          monthTextColor: theme.colors.onSurface,
        }}
        style={styles.calendar}
      />

      <View style={styles.daySection}>
        <View style={styles.dayHeader}>
          <Text variant="titleMedium" style={styles.dayTitle}>{formatSelectedDate()}</Text>
          <Chip compact icon="plus" onPress={() => setShowCreate(true)}>Add Task</Chip>
        </View>

        {dayTasks.length === 0 ? (
          <Surface style={styles.emptyCard} elevation={0}>
            <Text variant="bodyMedium" style={{ opacity: 0.5, textAlign: 'center' }}>No tasks scheduled for this day</Text>
          </Surface>
        ) : (
          <FlatList
            data={dayTasks}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }) => (
              <TaskCard task={item} onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })} />
            )}
            contentContainerStyle={styles.taskList}
          />
        )}
      </View>

      <CreateTaskModal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        onSave={handleCreate}
        initialData={{ due_date: selectedDate }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  calendar: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e0e0e0' },
  daySection: { flex: 1, padding: 16 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dayTitle: { fontWeight: '700' },
  emptyCard: { padding: 32, borderRadius: 12, alignItems: 'center' },
  taskList: { paddingBottom: 16 },
});
