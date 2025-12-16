import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, Modal, Alert, Image,
    LayoutAnimation, UIManager
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import PersonaToggle from '../components/PersonaToggle';
import { ChatStorageService, ChatSession, ChatMessage } from '../services/ChatStorageService';
import { AIService, AIMode } from '../services/AIService';

export default function AIChatScreen() {
    const { colors } = useAppTheme();
    const { lang } = useLang();
    const isRTL = lang === 'he';
    const navigation = useNavigation();

    // State
    const [mode, setMode] = useState<AIMode>('twist');
    const [inputText, setInputText] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);

    // Active Sessions Map (Mode -> SessionID)
    const [activeSessions, setActiveSessions] = useState<Record<AIMode, string | null>>({
        twist: null,
        flicki: null,
        discussion: null
    });

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    const [historyVisible, setHistoryVisible] = useState(false);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadHistory();
        initializeSessions();
    }, []);

    useEffect(() => {
        switchSessionForMode(mode);
    }, [mode]);

    const loadHistory = async () => {
        const loaded = await ChatStorageService.getSessions();
        setSessions(loaded);
    };

    const initializeSessions = () => {
        startNewSessionForMode('twist');
    };

    const switchSessionForMode = async (targetMode: AIMode) => {
        const targetSessionId = activeSessions[targetMode];

        if (targetSessionId) {
            const stored = sessions.find(s => s.id === targetSessionId);
            if (stored) {
                setMessages(stored.messages);
                setCurrentSessionId(targetSessionId);
            } else {
                startNewSessionForMode(targetMode);
            }
        } else {
            startNewSessionForMode(targetMode);
        }

        setInputText('');
        setSelectedImage(null);
    };

    const startNewSessionForMode = (targetMode: AIMode) => {
        const newSession = ChatStorageService.createSession();
        newSession.mode = targetMode;

        // Use Rich Intros from Localization
        let initialMessages: ChatMessage[] = [];

        if (targetMode === 'discussion') {
            const twistMsg: ChatMessage = {
                id: 'welcome-twist-' + Date.now(),
                text: t(lang, 'aiChat.discussionIntroTwist' as any),
                sender: 'twist',
                timestamp: Date.now()
            };
            const flickiMsg: ChatMessage = {
                id: 'welcome-flicki-' + Date.now(),
                text: t(lang, 'aiChat.discussionIntroFlicki' as any),
                sender: 'flicki',
                timestamp: Date.now() + 100
            };
            initialMessages = [twistMsg, flickiMsg];
        } else {
            let welcomeText = '';
            if (targetMode === 'twist') welcomeText = t(lang, 'aiChat.welcomeTwist' as any);
            else if (targetMode === 'flicki') welcomeText = t(lang, 'aiChat.welcomeFlicki' as any);

            const welcomeMsg: ChatMessage = {
                id: 'welcome-' + Date.now(),
                text: welcomeText,
                sender: targetMode,
                timestamp: Date.now()
            };
            initialMessages = [welcomeMsg];
        }

        newSession.messages = initialMessages;

        setActiveSessions(prev => ({ ...prev, [targetMode]: newSession.id }));
        setCurrentSessionId(newSession.id);
        setMessages(newSession.messages);
    };

    const toggleMenu = () => {
        // Significantly slower animation to ensure user notices the "opening" feel
        LayoutAnimation.configureNext(LayoutAnimation.create(
            800,
            LayoutAnimation.Types.easeInEaseOut,
            LayoutAnimation.Properties.opacity
        ));
        setMenuOpen(!menuOpen);
    };

    const startNewChat = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        startNewSessionForMode(mode);
        setMenuOpen(false);
    };

    const loadSessionFromHistory = (session: ChatSession) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const sessionMode = session.mode as AIMode || 'twist';
        setActiveSessions(prev => ({ ...prev, [sessionMode]: session.id }));
        setCurrentSessionId(session.id);
        setMessages(session.messages);
        setMode(sessionMode);
        setHistoryVisible(false);
        setSelectedImage(null);
        setMenuOpen(false);
    };

    const deleteSession = async (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        await ChatStorageService.deleteSession(id);
        await loadHistory();
        if (currentSessionId === id) startNewChat();
    };

    const handleSend = async () => {
        if (!inputText.trim() && !selectedImage) return;
        if (!currentSessionId) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
            timestamp: Date.now(),
            imageUri: selectedImage || undefined
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInputText('');
        const prevImage = selectedImage;
        setSelectedImage(null);
        setIsTyping(true);

        const title = messages.length <= 1 ? ChatStorageService.generateTitle(userMsg.text) : undefined;
        let currentSession = sessions.find(s => s.id === currentSessionId);
        if (!currentSession) {
            currentSession = {
                id: currentSessionId,
                title: title || 'New Chat',
                preview: userMsg.text,
                timestamp: Date.now(),
                mode: mode,
                messages: updatedMessages
            };
        } else {
            currentSession.messages = updatedMessages;
            currentSession.timestamp = Date.now();
            currentSession.preview = userMsg.text;
            if (title) currentSession.title = title;
        }
        await ChatStorageService.saveSession(currentSession);

        try {
            // Get Array of Responses (1 or 2)
            // Pass history (excluding current temp user msg which is raw input text)
            const aiResponses = await AIService.sendMessage(userMsg.text, mode, lang, messages);

            let finalSessionMessages = [...updatedMessages];

            // Add responses sequentially
            for (let i = 0; i < aiResponses.length; i++) {
                const response = aiResponses[i];
                const aiMsg: ChatMessage = {
                    id: (Date.now() + i).toString(),
                    text: response.text,
                    sender: response.sender as any, // 'twist' | 'flicki' | 'discussion'
                    timestamp: Date.now() + i
                };

                finalSessionMessages.push(aiMsg);
                setMessages([...finalSessionMessages]); // Animates addition in list?

                // Small delay between Discussion messages to feel natural
                if (i < aiResponses.length - 1) {
                    await new Promise<void>(r => setTimeout(r, 800));
                }
            }

            // Save Final State
            currentSession.messages = finalSessionMessages;
            await ChatStorageService.saveSession(currentSession);
            setSessions(await ChatStorageService.getSessions()); // Refresh local

        } catch (error) {
            console.error(error);
        } finally {
            setIsTyping(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled && result.assets[0].uri) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    // --- RENDER HELPERS ---

    const getThemeColors = () => {
        if (mode === 'flicki') return { main: '#f97316', gradient: ['#fff7ed', '#fed7aa'] };
        if (mode === 'discussion') return { main: '#8b5cf6', gradient: ['#f3e8ff', '#d8b4fe'] };
        return { main: '#3b82f6', gradient: ['#eff6ff', '#bfdbfe'] };
    };

    const { main: themeColor, gradient: gradientColors } = getThemeColors();
    let personaTitle = t(lang, `aiChat.${mode}Name` as any) || mode;
    if (mode === 'discussion') personaTitle = t(lang, 'aiChat.discussionMode' as any);

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.sender === 'user';
        let bubbleColor = themeColor;
        let iconName: any = "glasses";
        let senderName = "";

        if (item.sender === 'twist') { bubbleColor = '#3b82f6'; iconName = "glasses"; senderName = t(lang, 'aiChat.twistName' as any); }
        else if (item.sender === 'flicki') { bubbleColor = '#f97316'; iconName = "flash"; senderName = t(lang, 'aiChat.flickiName' as any); }
        else if (item.sender === 'discussion') { bubbleColor = '#8b5cf6'; iconName = "people"; senderName = t(lang, 'aiChat.discussionMode' as any); }

        if (isUser) bubbleColor = themeColor;

        const alignStyle = isUser ? styles.msgRowUser : styles.msgRowAi;

        return (
            <View style={[styles.msgRow, alignStyle]}>
                {!isUser && (
                    <View style={[styles.avatar, { backgroundColor: bubbleColor, elevation: 4 }]}>
                        <Ionicons name={iconName} size={16} color="#fff" />
                    </View>
                )}
                <View style={[
                    styles.bubble,
                    isUser
                        ? { backgroundColor: bubbleColor, borderBottomRightRadius: 4, marginRight: 10 }
                        : { backgroundColor: '#fff', borderTopLeftRadius: 4, elevation: 2, marginLeft: 10, flexShrink: 1 }
                ]}>
                    {!isUser && mode === 'discussion' && (
                        <Text style={{
                            fontSize: 10,
                            fontWeight: 'bold',
                            color: bubbleColor,
                            marginBottom: 4,
                            textAlign: isRTL ? 'right' : 'left'
                        }}>
                            {senderName}
                        </Text>
                    )}

                    {item.imageUri && (
                        <Image source={{ uri: item.imageUri }} style={styles.msgImage} />
                    )}

                    <Text
                        textBreakStrategy="simple"
                        style={{
                            color: isUser ? '#fff' : '#1e293b',
                            textAlign: isRTL ? 'right' : 'left',
                            writingDirection: isRTL ? 'rtl' : 'ltr',
                            fontSize: 16,
                            lineHeight: 24,
                            paddingHorizontal: 12, // More padding
                            paddingVertical: 2
                        }}
                    >
                        {item.text.split(/(`[^`]+`)/g).map((part, index) => {
                            if (index % 2 === 1) {
                                // Code Pill (Technical Term)
                                const content = part.slice(1, -1); // remove backticks
                                return (
                                    <Text key={index} style={{
                                        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                                        backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                                        color: isUser ? '#fff' : '#0f172a',
                                        fontSize: 14,
                                        fontWeight: 'bold',
                                    }}>
                                        {" "}{content}{" "}
                                    </Text>
                                );
                            }
                            // Normal Text
                            return <Text key={index}>{part}</Text>;
                        })}
                        {/* Transparent dot hack to force layout engine to reserve space at the end of line */}
                        <Text style={{ color: 'transparent' }}>.</Text>
                    </Text>
                </View>
            </View >
        );
    };

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <LinearGradient colors={gradientColors as any} style={StyleSheet.absoluteFill} />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* HEADER REDESIGNED with SWAPPED ORDER for RTL logic */}
                <View style={[
                    styles.header,
                    { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }
                ]}>

                    {/* LEFT SIDE (LTR Start / RTL End): BACK BUTTON */}
                    {/* In RTL (row-reverse), this renders LAST (Right side). User wants Back on Right side in Hebrew. Correct. */}
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[styles.iconBtn]}
                    >
                        <Ionicons name="arrow-back" size={24} color={themeColor} style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }} />
                    </TouchableOpacity>

                    {/* CENTER: PERSONA TOGGLE */}
                    <View style={styles.centerHeader}>
                        <PersonaToggle activePersona={mode as any} onToggle={setMode} />
                    </View>

                    {/* RIGHT SIDE (LTR End / RTL Start): MENU */}
                    {/* In RTL (row-reverse), this renders FIRST (Left side). User wants Menu on Left side in Hebrew. Correct. */}
                    <View style={{ zIndex: 10 }}>
                        <TouchableOpacity
                            onPress={toggleMenu}
                            style={[styles.iconBtn, { backgroundColor: '#fff' }]}
                        >
                            <Ionicons name={menuOpen ? "close" : "menu"} size={24} color={themeColor} />
                        </TouchableOpacity>

                        {/* DROPDOWN MENU */}
                        {menuOpen && (
                            <View style={[
                                styles.dropdownMenu,
                                { alignSelf: 'center' }
                            ]}>
                                {/* NEW CHAT BTN */}
                                <TouchableOpacity
                                    onPress={startNewChat}
                                    style={[styles.menuOptionBtn, { backgroundColor: themeColor, marginBottom: 8 }]}
                                >
                                    <Ionicons name="add" size={24} color="#fff" />
                                </TouchableOpacity>

                                {/* HISTORY BTN */}
                                <TouchableOpacity
                                    onPress={() => {
                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                        setMenuOpen(false);
                                        setHistoryVisible(true);
                                    }}
                                    style={[styles.menuOptionBtn, { backgroundColor: '#fff' }]}
                                >
                                    <Ionicons name="time-outline" size={24} color={themeColor} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* Chat Area */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={{ padding: 16, paddingBottom: 20, gap: 16 }}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={isTyping ? <Text style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', marginTop: 10 }}>Typing...</Text> : null}
                />

                {/* Input Area */}
                <View style={[styles.inputContainer]}>
                    {selectedImage && (
                        <View style={styles.previewContainer}>
                            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                            <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removePreviewBtn}>
                                <Ionicons name="close-circle" size={24} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.inputWrapper}>
                        {/* Show Image Upload ONLY for Flicki */}
                        {mode === 'flicki' && (
                            <TouchableOpacity onPress={pickImage} style={styles.attachBtn}>
                                <Ionicons name="images-outline" size={24} color={themeColor} />
                            </TouchableOpacity>
                        )}

                        <TextInput
                            style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                            placeholder={t(lang, 'aiChat.inputPlaceholder' as any)}
                            placeholderTextColor="#94a3b8"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            style={[styles.sendBtn, { backgroundColor: themeColor }]}
                        >
                            <Ionicons name="send" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* HISTORY MODAL */}
                <Modal visible={historyVisible} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: '#fff', direction: isRTL ? 'rtl' : 'ltr' }]}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{t(lang, 'aiChat.history' as any) || 'History'}</Text>
                                <TouchableOpacity onPress={() => setHistoryVisible(false)}>
                                    <Ionicons name="close" size={24} color="#000" />
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={sessions}
                                keyExtractor={item => item.id}
                                contentContainerStyle={{ padding: 16 }}
                                ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#94a3b8', marginTop: 50 }}>No history yet</Text>}
                                renderItem={({ item }) => (
                                    <View style={styles.historyItem}>
                                        <View style={{ marginRight: isRTL ? 0 : 10, marginLeft: isRTL ? 10 : 0 }}>
                                            <Ionicons
                                                name={item.mode === 'flicki' ? 'flash' : (item.mode === 'discussion' ? 'people' : 'glasses')}
                                                size={20}
                                                color="#64748b"
                                            />
                                        </View>
                                        <TouchableOpacity
                                            style={{ flex: 1 }}
                                            onPress={() => loadSessionFromHistory(item)}
                                        >
                                            <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
                                            <Text style={styles.historyPreview} numberOfLines={1}>{item.preview}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => deleteSession(item.id)} style={{ padding: 8 }}>
                                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                        </View>
                    </View>
                </Modal>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 5,
        zIndex: 5
    },
    headerSide: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    centerHeader: {
        flex: 1,
        alignItems: 'center',
    },
    personaTitle: {
        marginTop: 6,
        fontSize: 14,
        fontWeight: 'bold',
        opacity: 0.9,
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 }
    },
    msgRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        maxWidth: '90%', // Widened to fill phone screen better as requested
    },
    msgRowUser: {
        alignSelf: 'flex-end', // Right side
        flexDirection: 'row-reverse',
    },
    msgRowAi: {
        alignSelf: 'flex-start', // Left side
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // ...
    bubble: {
        paddingVertical: 12,
        paddingHorizontal: 20, // Increased padding
        borderRadius: 20,
        minWidth: 40,
    },
    msgImage: {
        width: 200,
        height: 150,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#eee'
    },
    inputContainer: {
        padding: 16,
        paddingTop: 10,
    },
    previewContainer: {
        flexDirection: 'row',
        marginBottom: 8,
        marginLeft: 12,
    },
    previewImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    removePreviewBtn: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#fff',
        borderRadius: 12
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 30,
        paddingHorizontal: 12,
        paddingVertical: 6,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 }
    },
    attachBtn: {
        padding: 8,
        marginRight: 4
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#1e293b'
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        height: '70%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b'
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    historyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2
    },
    historyPreview: {
        fontSize: 13,
        color: '#64748b'
    },
    dropdownMenu: {
        position: 'absolute',
        top: 50,
        backgroundColor: 'transparent',
        alignItems: 'center',
        padding: 4,
        zIndex: 100
    },
    menuOptionBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 }
    }
});
