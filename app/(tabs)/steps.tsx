import { ThemedText } from '@/components/themed-text';
import { useUser } from '@/context/user-context';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.6;
const STROKE_WIDTH = 15;
const GOAL = 10000; // Example step goal

export default function StepCounter() {
  const [steps, setSteps] = useState<number>(0);
  const [available, setAvailable] = useState<boolean | null>(null);

  const radius = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(steps / GOAL, 1); // Ensure max 1

  // Fake step increment for demo (replace with real step tracking)
  useEffect(() => {
    const interval = setInterval  (() => {
      setSteps(prev => Math.min(prev + Math.floor(Math.random() * 50), GOAL));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  /*
  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const init = async () => {
      try {
        const isAvailable = await Pedometer.isAvailableAsync();
        setAvailable(Boolean(isAvailable));

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

        // Get initial count since today midnight
        try {
          const result = await Pedometer.getStepCountAsync(startOfDay, now);
          setSteps(result.steps ?? 0);
        } catch (err) {
          // getStepCountAsync may fail on some platforms; leave steps as 0
          console.warn('Pedometer.getStepCountAsync failed', err);
        }

        // Subscribe to step updates (gives delta steps)
        subscription = Pedometer.watchStepCount(event => {
          // event.steps is steps since the last update — add to current total
          setSteps(prev => prev + (event.steps ?? 0));
        }) as any;
      } catch (e) {
        console.warn('Pedometer not available', e);
        setAvailable(false);
      }
    };

    init();

    return () => {
      if (subscription && subscription.remove) subscription.remove();
    };
  }, []);
  */
  const { username } = useUser();

  return (
    <View style={styles.container}>
      <ThemedText style={styles.welcomeText}>Welcome, {username}!</ThemedText>
      <View style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE, justifyContent: 'center', alignItems: 'center' }}>
        <Svg
          height={CIRCLE_SIZE}
          width={CIRCLE_SIZE}
        >
          <Circle
            stroke="#E0E0E0"
            fill="none"
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={radius}
            strokeWidth={STROKE_WIDTH}
          />
          <Circle
            stroke="#4ECDC4"
            fill="none"
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={radius}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
          />
        </Svg>
        
        <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.stepsText}>{steps}</Text>
          <Text style={styles.goalText}>of {GOAL} steps</Text>
          {available === false && (
            <Text style={{ color: '#999', marginTop: 8 }}>Step counting not available on this device</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    position: 'absolute',
    top: 20,
    color: '#1a1a1a', // Changed to a darker color
  },
  stepsText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  goalText: {
    fontSize: 16,
    color: '#666',
  },
});
