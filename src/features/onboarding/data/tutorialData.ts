import { ImageSourcePropType } from 'react-native';

export type TutorialStepData = {
    text: string;
    image: ImageSourcePropType;
    pose: 'point_right' | 'point_left' | 'thinking' | 'celebrating' | 'thumbs_up' | 'arms_crossed' | 'hands_behind_back' | 'hands_on_hips' | 'adjusting_tie' | 'hand_behind_head';
};

export const TUTORIAL_DATA: Record<string, TutorialStepData> = {
    'home_quick_actions': {
        text: 'ברוך הבא לבית החדש שלך! כאן בלוח הבקרה תמצא גישה מהירה לכל מה שחשוב – מבחנים, סטטיסטיקות וחומר עיוני.',
        image: require('@/assets/images/twist/point_right.png'),
        pose: 'point_right'
    },
    'guest_login_prompt': {
        text: 'בשביל להמשיך את הסיור ולהכיר את כל הפונקציות, עליך להירשם או להתחבר למערכת. זה לוקח דקה!',
        image: require('@/assets/images/twist/point_right.png'),
        pose: 'point_right'
    },
    'tabs_nav': {
        text: 'זהו מרכז העצבים. דרך כאן תוכל לזוז בין המחשבון, דפי הטריף, הכרטיסיות והמבחנים בכל רגע.',
        image: require('@/assets/images/twist/point_left.png'), // Using point_left as it points down/general
        pose: 'point_left'
    },
    'tariff_create': {
        text: 'כאן הקסם קורה! בנה את דפי הטריף שלך, חשב דרגות קושי ובדוק שאין שגיאות חוקה. אני אשגיח שהכל תקין.',
        image: require('@/assets/images/twist/thinking.png'),
        pose: 'thinking'
    },
    'tariff_export': {
        text: 'סיימת לבנות? מצוין! בלחיצה אחת תוכל לשמור את הדף או לייצא אותו כקובץ PDF רשמי לתחרויות.',
        image: require('@/assets/images/twist/celebrating.png'),
        pose: 'celebrating'
    },
    'calc_keyboard': {
        text: 'צריך חישוב מהיר באמצע אימון? המחשבון הזה מכיר את כל האלמנטים בחוקה. פשוט הקלד וקבל תוצאה.',
        image: require('@/assets/images/twist/point_right.png'),
        pose: 'point_right'
    },
    'flashcards_card': {
        text: 'רוצה לחדד את הידע? הכרטיסיות והמבחנים יעזרו לך לשנן את החוקה ולהישאר חד לקראת השיפוט הבא.',
        image: require('@/assets/images/twist/thumbs_up.png'),
        pose: 'thumbs_up'
    },
    'settings_account': {
        text: 'כאן תוכל לנהל את הפרופיל שלך, לשנות סיסמה ולהתאים את האפליקציה בדיוק אליך.',
        image: require('@/assets/images/twist/hands_behind_back.png'),
        pose: 'hands_behind_back'
    },
    'finish': {
        text: 'זה הכל! אתה מוכן לצאת לדרך. שיהיה בהצלחה בשיפוט!',
        image: require('@/assets/images/twist/celebrating.png'),
        pose: 'celebrating'
    }
};

// Map step names to image assets directly for easier Require
export const TWIST_IMAGES = {
    point_right: require('@/assets/images/twist/point_right.png'),
    point_left: require('@/assets/images/twist/point_left.png'),
    thinking: require('@/assets/images/twist/thinking.png'),
    celebrating: require('@/assets/images/twist/celebrating.png'),
    thumbs_up: require('@/assets/images/twist/thumbs_up.png'),
    arms_crossed: require('@/assets/images/twist/arms_crossed.png'),
    hands_behind_back: require('@/assets/images/twist/hands_behind_back.png'),
    hands_on_hips: require('@/assets/images/twist/hands_on_hips.png'),
    adjusting_tie: require('@/assets/images/twist/adjusting_tie.png'),
    hand_behind_head: require('@/assets/images/twist/hand_behind_head.png'),
};
