import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    getDocs,
    deleteDoc
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { UserStats, Word, Story, SRSItem, AppSettings, AIChatMessage, AIListeningExercise } from '../types';



// ─── User Profile ─────────────────────────────────────────────
export const saveUserProfile = async (uid: string, data: { email: string; displayName?: string }) => {
    await setDoc(doc(db, 'users', uid, 'data', 'profile'), {
        ...data,
        updatedAt: Date.now()
    }, { merge: true });
};

// ─── User Initialization (Root Document) ───────────────────────
export const initializeNewUser = async (uid: string, email: string, displayName?: string) => {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    // Only create if it doesn't exist
    if (!userDoc.exists()) {
        await setDoc(userRef, {
            uid,
            email,
            displayName: displayName || email.split('@')[0], // Default name if null
            createdAt: Date.now(),
            progress: {
                level: 1,
                xp: 0,
                streak: 0,
                wordsLearned: 0
            }
        });
    }
};

// ─── User Stats ───────────────────────────────────────────────
export const saveUserStats = async (uid: string, stats: UserStats) => {
    await setDoc(doc(db, 'users', uid, 'data', 'stats'), {
        ...stats,
        updatedAt: Date.now()
    }, { merge: true });
};

export const getUserStats = async (uid: string): Promise<UserStats | null> => {
    const snap = await getDoc(doc(db, 'users', uid, 'data', 'stats'));
    return snap.exists() ? (snap.data() as UserStats) : null;
};

// ─── Global Settings (course name, etc) ───────────────────────
export const saveGlobalSettings = async (uid: string, settings: { course2Name?: string }) => {
    await setDoc(doc(db, 'users', uid, 'data', 'globalSettings'), {
        ...settings,
        updatedAt: Date.now()
    }, { merge: true });
};

export const getGlobalSettings = async (uid: string) => {
    const snap = await getDoc(doc(db, 'users', uid, 'data', 'globalSettings'));
    return snap.exists() ? snap.data() : null;
};

// ─── Custom Modules List ──────────────────────────────────────
interface CustomModule {
    id: string;
    title: string;
    color: string;
    level: string;
}

export const saveCustomModules = async (uid: string, modules: CustomModule[]) => {
    await setDoc(doc(db, 'users', uid, 'data', 'customModules'), {
        modules,
        updatedAt: Date.now()
    });
};

export const getCustomModules = async (uid: string): Promise<CustomModule[] | null> => {
    const snap = await getDoc(doc(db, 'users', uid, 'data', 'customModules'));
    if (snap.exists()) {
        return snap.data().modules as CustomModule[];
    }
    return null;
};

// ─── Module Data (words, stories, srs, settings) ──────────────
export interface ModuleData {
    words: Word[];
    stories: Story[];
    srs: Record<string, SRSItem>;
    settings: AppSettings;
    deletedIds: string[];
}

export const saveModuleData = async (uid: string, moduleId: string, data: Partial<ModuleData>) => {
    await setDoc(doc(db, 'users', uid, 'modules', moduleId), {
        ...data,
        updatedAt: Date.now()
    }, { merge: true });
};

export const getModuleData = async (uid: string, moduleId: string): Promise<Partial<ModuleData> | null> => {
    const snap = await getDoc(doc(db, 'users', uid, 'modules', moduleId));
    return snap.exists() ? (snap.data() as Partial<ModuleData>) : null;
};

// ─── AI Content Persistence ───────────────────────────────────

export const saveAIChatHistory = async (uid: string, lessonId: string, messages: AIChatMessage[]) => {
    await setDoc(doc(db, 'users', uid, 'ai_chats', lessonId), {
        messages,
        updatedAt: Date.now()
    });
};

export const getAIChatHistory = async (uid: string, lessonId: string): Promise<AIChatMessage[] | null> => {
    const snap = await getDoc(doc(db, 'users', uid, 'ai_chats', lessonId));
    return snap.exists() ? (snap.data().messages as AIChatMessage[]) : null;
};

export const saveAIListeningExercise = async (uid: string, exercise: AIListeningExercise) => {
    await setDoc(doc(db, 'users', uid, 'ai_listening', exercise.id), {
        ...exercise,
        updatedAt: Date.now()
    });
};

export const getAIListeningExercises = async (uid: string, moduleId?: string): Promise<AIListeningExercise[]> => {
    const coll = collection(db, 'users', uid, 'ai_listening');
    const snap = await getDocs(coll);
    const results = snap.docs.map(d => d.data() as AIListeningExercise);
    if (moduleId) {
        return results.filter(r => r.moduleId === moduleId);
    }
    return results;
};

export const deleteModuleData = async (uid: string, moduleId: string) => {

    await deleteDoc(doc(db, 'users', uid, 'modules', moduleId));
};

// ─── Migration: localStorage → Firestore ──────────────────────
export const migrateLocalStorageToFirestore = async (uid: string) => {
    try {
        // Check if migration already happened
        const profile = await getDoc(doc(db, 'users', uid, 'data', 'profile'));
        if (profile.exists() && profile.data()?.migrated) {
            return; // Already migrated
        }

        // Stats
        const savedStats = localStorage.getItem('global_user_stats');
        if (savedStats) {
            await saveUserStats(uid, JSON.parse(savedStats));
        }

        // Course name
        const courseName = localStorage.getItem('course2_name');
        if (courseName) {
            await saveGlobalSettings(uid, { course2Name: courseName });
        }

        // Custom modules list
        const savedMods = localStorage.getItem('custom_modules_list');
        if (savedMods) {
            await saveCustomModules(uid, JSON.parse(savedMods));
        }

        // Module data (both base and custom modules)
        const allModuleIds: string[] = ['mod1', 'mod2', 'mod3', 'mod4', 'mod5'];
        if (savedMods) {
            const customMods = JSON.parse(savedMods);
            customMods.forEach((m: CustomModule) => allModuleIds.push(m.id));
        }

        for (const modId of allModuleIds) {
            const moduleData: Partial<ModuleData> = {};

            const words = localStorage.getItem(`words_${modId}`);
            if (words) moduleData.words = JSON.parse(words);

            const stories = localStorage.getItem(`stories_${modId}`);
            if (stories) moduleData.stories = JSON.parse(stories);

            const srs = localStorage.getItem(`srs_${modId}`);
            if (srs) moduleData.srs = JSON.parse(srs);

            const settings = localStorage.getItem(`settings_${modId}`);
            if (settings) moduleData.settings = JSON.parse(settings);

            const deletedIds = localStorage.getItem(`deleted_ids_${modId}`);
            if (deletedIds) moduleData.deletedIds = JSON.parse(deletedIds);

            if (Object.keys(moduleData).length > 0) {
                await saveModuleData(uid, modId, moduleData);
            }
        }

        // Mark as migrated
        await setDoc(doc(db, 'users', uid, 'data', 'profile'), {
            migrated: true,
            migratedAt: Date.now()
        }, { merge: true });

        console.log('✅ Migración exitosa de localStorage → Firestore');
    } catch (error) {
        console.error('Error durante migración:', error);
    }
};
