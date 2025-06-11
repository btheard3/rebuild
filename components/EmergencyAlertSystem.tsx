import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { tavusService } from '@/services/tavusService';
import { elevenLabsService } from '@/services/elevenLabsService';
import { analyticsService } from '@/services/analyticsService';
import { TriangleAlert as AlertTriangle, Volume2, Video, X, Send } from 'lucide-react-native';

interface EmergencyAlertSystemProps {
  visible: boolean;
  onClose: () => void;
  onAlertGenerated?: (alertData: any) => void;
}

export default function EmergencyAlertSystem({ 
  visible, 
  onClose, 
  onAlertGenerated 
}: EmergencyAlertSystemProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [alertText, setAlertText] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [location, setLocation] = useState('');
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<any>(null);

  const severityOptions = [
    { id: 'low', label: 'Low', color: colors.success, description: 'Information update' },
    { id: 'medium', label: 'Medium', color: colors.warning, description: 'Important notice' },
    { id: 'high', label: 'High', color: colors.error, description: 'Urgent alert' },
    { id: 'critical', label: 'Critical', color: '#8B0000', description: 'Emergency alert' },
  ];

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setAlertText('');
      setSeverity('medium');
      setLocation('');
      setInstructions(['']);
      setGeneratedAudio(null);
      setGeneratedVideo(null);
    }
  }, [visible]);

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  const generateAlert = async () => {
    if (!alertText.trim()) {
      Alert.alert('Error', 'Please enter alert text');
      return;
    }

    if (alertText.length > 500) {
      Alert.alert('Error', 'Alert text must be 500 characters or less');
      return;
    }

    setIsGenerating(true);
    analyticsService.trackEvent('emergency_alert_generation_started', {
      severity,
      textLength: alertText.length,
      hasLocation: !!location,
      instructionCount: instructions.filter(i => i.trim()).length
    });

    try {
      // Generate emergency alert script
      const script = tavusService.generateEmergencyAlertScript({
        alertText,
        severity,
        location: location || undefined,
        timestamp: new Date(),
        instructions: instructions.filter(i => i.trim())
      });

      // Generate both audio and video simultaneously
      const [audioUrl, videoResult] = await Promise.all([
        elevenLabsService.generateEmergencyAlert(script),
        user?.isPremium ? tavusService.generateVideo(script, user.id) : Promise.resolve(null)
      ]);

      setGeneratedAudio(audioUrl);
      setGeneratedVideo(videoResult);

      // Play audio immediately for emergency alerts
      if (audioUrl) {
        await elevenLabsService.playAudio(audioUrl);
      }

      const alertData = {
        id: Date.now().toString(),
        text: alertText,
        severity,
        location,
        instructions: instructions.filter(i => i.trim()),
        script,
        audioUrl,
        videoResult,
        timestamp: new Date(),
      };

      onAlertGenerated?.(alertData);

      analyticsService.trackEvent('emergency_alert_generated', {
        severity,
        hasAudio: !!audioUrl,
        hasVideo: !!videoResult,
        textLength: alertText.length
      });

      Alert.alert(
        'Alert Generated',
        'Emergency alert has been generated and audio is playing. Video generation may take a few minutes.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Emergency alert generation failed:', error);
      analyticsService.trackError('emergency_alert_generation_failed', 'EmergencyAlertSystem', {
        error: error.message,
        severity
      });
      
      Alert.alert(
        'Generation Failed',
        'Failed to generate emergency alert. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const playGeneratedAudio = async () => {
    if (generatedAudio) {
      try {
        await elevenLabsService.playAudio(generatedAudio);
      } catch (error) {
        console.error('Audio playback failed:', error);
        Alert.alert('Error', 'Failed to play audio');
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <AlertTriangle size={24} color={colors.error} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Emergency Alert System
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={[styles.warningBox, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
            <AlertTriangle size={16} color={colors.error} />
            <Text style={[styles.warningText, { color: colors.error }]}>
              This system generates professional emergency alerts with audio and video components.
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.label, { color: colors.text }]}>Alert Text (max 500 characters)</Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: colors.surface, 
                color: colors.text,
                borderColor: colors.border
              }]}
              placeholder="Enter emergency alert message..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={500}
              value={alertText}
              onChangeText={setAlertText}
            />
            <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
              {alertText.length}/500 characters
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.label, { color: colors.text }]}>Severity Level</Text>
            <View style={styles.severityOptions}>
              {severityOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.severityOption,
                    {
                      backgroundColor: severity === option.id ? option.color + '20' : colors.surface,
                      borderColor: severity === option.id ? option.color : colors.border,
                    }
                  ]}
                  onPress={() => setSeverity(option.id as any)}
                >
                  <Text style={[
                    styles.severityLabel,
                    { color: severity === option.id ? option.color : colors.text }
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[
                    styles.severityDescription,
                    { color: severity === option.id ? option.color : colors.textSecondary }
                  ]}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.label, { color: colors.text }]}>Location (optional)</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.surface, 
                color: colors.text,
                borderColor: colors.border
              }]}
              placeholder="e.g., Downtown area, Highway 101"
              placeholderTextColor={colors.textSecondary}
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.label, { color: colors.text }]}>Safety Instructions</Text>
            {instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionRow}>
                <TextInput
                  style={[styles.instructionInput, { 
                    backgroundColor: colors.surface, 
                    color: colors.text,
                    borderColor: colors.border
                  }]}
                  placeholder={`Instruction ${index + 1}`}
                  placeholderTextColor={colors.textSecondary}
                  value={instruction}
                  onChangeText={(value) => updateInstruction(index, value)}
                />
                {instructions.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeInstruction(index)}
                    style={[styles.removeButton, { backgroundColor: colors.error + '20' }]}
                  >
                    <X size={16} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity
              onPress={addInstruction}
              style={[styles.addButton, { backgroundColor: colors.primary + '20' }]}
            >
              <Text style={[styles.addButtonText, { color: colors.primary }]}>
                + Add Instruction
              </Text>
            </TouchableOpacity>
          </View>

          {generatedAudio && (
            <View style={[styles.generatedSection, { backgroundColor: colors.success + '20' }]}>
              <Text style={[styles.generatedTitle, { color: colors.success }]}>
                Alert Generated Successfully
              </Text>
              <TouchableOpacity
                onPress={playGeneratedAudio}
                style={[styles.playButton, { backgroundColor: colors.success }]}
              >
                <Volume2 size={20} color="white" />
                <Text style={styles.playButtonText}>Play Audio Alert</Text>
              </TouchableOpacity>
              {generatedVideo && (
                <Text style={[styles.videoStatus, { color: colors.textSecondary }]}>
                  Video: {generatedVideo.status}
                </Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.generateButton,
              { 
                backgroundColor: alertText.trim() ? colors.error : colors.disabled,
                opacity: isGenerating ? 0.7 : 1
              }
            ]}
            onPress={generateAlert}
            disabled={!alertText.trim() || isGenerating}
          >
            <Send size={20} color="white" />
            <Text style={styles.generateButtonText}>
              {isGenerating ? 'Generating Alert...' : 'Generate Emergency Alert'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 48,
  },
  severityOptions: {
    gap: 8,
  },
  severityOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  severityLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  severityDescription: {
    fontSize: 14,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  instructionInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 48,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  generatedSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  generatedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  playButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  videoStatus: {
    fontSize: 12,
    marginTop: 8,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});