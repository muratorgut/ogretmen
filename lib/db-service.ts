import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { AppConfig } from "@/components/wizard/store";

const COLLECTION = "teachers";

export const getUserConfig = async (uid: string): Promise<Partial<AppConfig> | null> => {
    try {
        const docRef = doc(db, COLLECTION, uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as Partial<AppConfig>;
        } else {
            console.log("No config found for user:", uid);
            return null;
        }
    } catch (error) {
        console.error("Error fetching user config:", error);
        return null;
    }
};

export const saveUserConfig = async (uid: string, config: AppConfig) => {
    try {
        const docRef = doc(db, COLLECTION, uid);
        // Merge true allows us to update only parts of the document if needed,
        // though here we largely save the whole config object.
        await setDoc(docRef, config, { merge: true });
        console.log("Config saved successfully for user:", uid);
    } catch (error) {
        console.error("Error saving user config:", error);
        throw error;
    }
};
