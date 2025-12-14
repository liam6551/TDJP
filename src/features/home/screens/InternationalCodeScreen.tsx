import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InternationalCodeScreen() {
    const { colors } = useAppTheme();
    const navigation = useNavigation();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-forward" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>חוקה בינלאומית 2025-2028</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* A. GENERAL */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="book-outline" size={28} color={colors.tint} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>A. כללי</Text>
                    </View>
                    <Text style={[styles.text, { color: colors.text }]}>
                        פס טאמבלינג מורכב מ-8 אלמנטים וצריך להראות מגוון של אלמנטים קדימה, אחורה והצידה.
                        הפס צריך להראות שליטה טובה, טכניקה, ביצוע ושמירה על קצב.
                        טאמבלינג מאופיין באלמנטים סיבוביים מהירים ורציפים (ידיים-רגליים ורגליים-רגליים) ללא היסוס או צעדי ביניים.
                    </Text>
                </View>

                {/* 1. INDIVIDUAL COMPETITION */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="person-outline" size={28} color={colors.tint} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>תחרות אישית</Text>
                    </View>

                    {/* Qualifications */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.tint }]}>מוקדמות</Text>

                        <Text style={[styles.subTitle, { color: colors.text }]}>מוקדמות 1</Text>
                        <Text style={[styles.text, { color: colors.text }]}>
                            • כל המתעמלים הרשומים משתתפים.
                            {"\n"}• מבצעים 2 פסים.
                            {"\n"}• <Text style={{ fontWeight: 'bold' }}>אין לחזור על אלמנטים</Text> בין שני הפסים.
                            {"\n"}• סדר ההופעה נקבע בהגרלה.
                            {"\n"}• המתעמלים מחולקים לקבוצות של עד 12 מתעמלים.
                            {"\n"}• הדירוג הסופי של מוקדמות 1 קובע את העולים למוקדמות 2 או לגמר (במידה ואין מוקדמות 2).
                        </Text>

                        <Text style={[styles.subTitle, { color: colors.text, marginTop: 12 }]}>מוקדמות 2</Text>
                        <Text style={[styles.text, { color: colors.text }]}>
                            • מתקיים רק בהתאם למספר הנרשמים:
                            {"\n"}  - 1-31 נרשמים: אין מוקדמות 2.
                            {"\n"}  - 32-47 נרשמים: עולים 16 מתעמלים.
                            {"\n"}  - 48+ נרשמים: עולים 24 מתעמלים.
                            {"\n"}• מקסימום 3 מתעמלים לכל מדינה.
                            {"\n"}• הניקוד מתאפס.
                            {"\n"}• מבצעים פס אחד.
                        </Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Finals */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.tint }]}>גמרים</Text>
                        <Text style={[styles.text, { color: colors.text }]}>
                            • סדר ההופעה נקבע בהגרלה (מדורגים 5-8 אחרי המוקדמות מוגרלים למקומות 1-4, מדורגים 1-4 אחרי המוקדמות מוגרלים למקומות 5-8).
                            {"\n"}• מקסימום 2 מתעמלים למדינה בגמרים.
                        </Text>

                        <Text style={[styles.subTitle, { color: colors.text, marginTop: 12 }]}>גמר 1</Text>
                        <Text style={[styles.text, { color: colors.text }]}>
                            • 8 המתעמלים הטובים ביותר.
                            {"\n"}• הניקוד מתאפס.
                            {"\n"}• מבצעים פס אחד.
                            {"\n"}• 4 הטובים ביותר עולים לשלב הבא, השאר מדורגים 5-8.
                        </Text>

                        <Text style={[styles.subTitle, { color: colors.text, marginTop: 12 }]}>גמר 2</Text>
                        <Text style={[styles.text, { color: colors.text }]}>
                            • 4 המתעמלים מתחרים על המדליות ותואר האליפות.
                            {"\n"}• הניקוד מתאפס.
                            {"\n"}• מבצעים פס אחד. המנצח הוא בעל הניקוד הגבוה ביותר.
                            {"\n"}• במקרה של שוויון, יחולו חוקי שובר שוויון.
                        </Text>
                    </View>
                </View>

                {/* 2. TEAM COMPETITION */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="people-outline" size={28} color={colors.tint} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>תחרות קבוצתית</Text>
                    </View>
                    <Text style={[styles.text, { color: colors.text }]}>
                        • קבוצה מורכבת מ-3 עד 4 מתעמלים.
                        {"\n\n"}
                        <Text style={{ fontWeight: 'bold' }}>מוקדמות:</Text>
                        {"\n"}• מוקדמות 1 משמשת כמוקדמות לגמר הקבוצתי.
                        {"\n"}• הניקוד הקבוצתי הוא סכום 3 התוצאות הגבוהות ביותר במוקדמות 1. רק פס אחד של כל מתעמל נספר לציון הקבוצתי.
                        {"\n\n"}
                        <Text style={{ fontWeight: 'bold' }}>גמרים:</Text>
                        {"\n"}• עולות 8 הקבוצות הטובות ביותר (אם יש 12+), או 5 (אם יש 5-11).
                        {"\n"}• הקבוצה מורכבת מ-3 מתעמלים. כל אחד מבצע פס אחד.
                        {"\n"}• הגמר מורכב מ-3 סבבים (מתעמל מכל קבוצה בכל סבב). סדר ההופעה הוא בסדר הפוך לדירוג: המתעמל מהקבוצה המדורגת במקום ה-8 (בהתאם למספר הכולל של הקבוצות המתחרות), יתחרה ראשון. המתעמל מהקבוצה המדורגת במקום ה-7 יתחרה במקום השני, וכן הלאה.
                        {"\n"}• הדירוג נקבע בשיטת ניקוד לכל מיקום בכל סבב. המנצחת היא הקבוצה עם סכום הנקודות הגבוה ביותר.
                    </Text>

                    {/* Points Table */}
                    <View style={[styles.table, { borderColor: '#000', borderWidth: 1, overflow: 'hidden' }]}>
                        {/* Main Header */}
                        <View style={[styles.tableRow, { backgroundColor: colors.card, padding: 0, borderBottomColor: '#000', borderBottomWidth: 1 }]}>
                            <View style={[styles.tableCell, { flex: 2.5, borderLeftWidth: 1, borderLeftColor: '#000', paddingTop: 18 }]}>
                                <Text style={[styles.tableTextBold, { textAlign: 'center' }]}>קבוצות בגמר</Text>
                            </View>
                            <View style={{ flex: 8 }}>
                                <View style={{ borderBottomWidth: 1, borderBottomColor: '#000', paddingVertical: 4 }}>
                                    <Text style={[styles.tableTextBold, { textAlign: 'center' }]}>מיקום</Text>
                                </View>
                                <View style={{ flexDirection: 'row-reverse' }}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((place) => (
                                        <View key={place} style={[styles.tableCell, { flex: 1, borderLeftWidth: place !== 8 ? 1 : 0, borderLeftColor: '#000', paddingVertical: 4 }]}>
                                            <Text style={[styles.tableTextBold, { textAlign: 'center', fontSize: 13 }]}>{place}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* Data Rows */}
                        {[
                            { label: '8 קבוצות', values: ['10', '8', '6', '5', '4', '3', '2', '1'] },
                            { label: '5 קבוצות', values: ['10', '8', '6', '5', '4', '-', '-', '-'] }
                        ].map((row, index, arr) => (
                            <View key={index} style={[styles.tableRow, { padding: 0, borderBottomColor: '#000', borderBottomWidth: index === arr.length - 1 ? 0 : 1 }]}>
                                <View style={[styles.tableCell, { flex: 2.5, borderLeftWidth: 1, borderLeftColor: '#000', paddingVertical: 8 }]}>
                                    <Text style={[styles.tableText, { textAlign: 'center', fontWeight: 'bold' }]}>{row.label}</Text>
                                </View>
                                <View style={{ flex: 8, flexDirection: 'row-reverse' }}>
                                    {row.values.map((val, i) => (
                                        <View key={i} style={[styles.tableCell, { flex: 1, borderLeftWidth: i !== 7 ? 1 : 0, borderLeftColor: '#000', paddingVertical: 8 }]}>
                                            <Text style={[styles.tableText, { textAlign: 'center' }]}>{val}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <Text style={[styles.subTitle, { color: colors.text }]}>גמר קבוצתי קרב-רב</Text>
                    <Text style={[styles.text, { color: colors.text }]}>
                        • הקבוצה כוללת מתעמל אחד ומתעמלת אחת מכל ענף: טרמפולינה אישית, טרמפולינה מסונכרנת, טאמבלינג, ודאבל-מיני.
                        {"\n"}• מוקדמות 1 ישמשו כמוקדמות לגמר קרב רב הקבוצתי.
                        {"\n"}• הניקוד הוא סכום ההישג הגבוה ביותר של מתעמל אחד בכל קטגוריה במוקדמות 1.
                        {"\n"}• 5 הנבחרות הטובות ביותר עולות לגמר.
                    </Text>
                </View>

                {/* 3. EXERCISES */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="refresh-outline" size={28} color={colors.tint} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>ביצוע פסים</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>מבנה הפס</Text>
                        <Text style={[styles.text, { color: colors.text }]}>
                            • כל פס מורכב מ-8 אלמנטים.
                            {"\n"}• במוקדמות 1 (שני הפסים) אין לחזור על אלמנטים (למעט פליק פלאק, טמפו, ערבית ועד 3 ברגים בפס).
                            {"\n"}• במוקדמות 2 ניתן לחזור על אלמנטים שבוצעו במוקדמות 1.
                            {"\n"}• בגמרים (1 ו-2) אין לחזור על אותו אלמנט בתוך אותו גמר, אך מותר לבצע אלמנטים שבוצעו במוקדמות.
                            {"\n"}• הפס חייב לנוע בכיוון אחד בלבד (למעט אלמנט סיום - שיכול לנוע בכיוון ההפוך).
                            {"\n"}• חובה לסיים כל פס בסלטה.
                            {"\n"}• ניסיון שני לפס אינו מותר (למעט הפרעה מוכחת).
                        </Text>
                    </View>
                </View>

                {/* 4. DRESS CODE */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="shirt-outline" size={28} color={colors.tint} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>4. לבוש מתעמלים</Text>
                    </View>
                    <Text style={[styles.text, { color: colors.text }]}>
                        <Text style={{ fontWeight: 'bold' }}>גברים:</Text>
                        {"\n"}• בגד גוף ללא שרוולים או עם שרוול קצר.
                        {"\n"}• מכנסי התעמלות קצרים.
                        {"\n"}• ניתן גרביים לבנות או כיסוי רגליים מיוחד בצבע לבן בלבד.
                        {"\n\n"}
                        <Text style={{ fontWeight: 'bold' }}>נשים:</Text>
                        {"\n"}• בגד גוף או אוברול צמוד לגוף.
                        {"\n"}• ניתן ללבוש טייץ ארוך (חייב להיות צמוד ובצבע זהה לבגד הגוף).
                        {"\n"}• ניתן ללבוש מכנסיים קצרים (חייבים להיות צמודים).
                        {"\n"}• ניתן לחבוש כיסוי ראש (חייב להיות צמוד).
                        {"\n"}• כל "לבוש" אחר שאינו צמוד – אסור.
                        {"\n"}• מטעמי בטיחות, אסור לכסות את הפנים.
                        {"\n"}• ניתן גרביים לבנות או כיסוי רגליים מיוחד בצבע לבן בלבד.
                        {"\n"}• מחשוף (קדמי ואחורי) חייב להיות הולם: המפתח אופציונלי אך לא יעלה על מחצית עצם החזה ולא נמוך מהקו התחתון של השכמות.
                        {"\n"}• רצועות כתף ברוחב מינימלי של 2 ס"מ.
                        {"\n"}• מפתח הרגל לא יעלה מעבר לעצם האגן.
                        {"\n"}• אורך המכנס לא יעלה על הקו האופקי סביב הרגל (לא יותר מ-2 ס"מ מתחת לישבן).
                        {"\n"}• בגד גוף עם תחרה חייב להיות עם בטנה (מהגוף עד החזה).
                        {"\n\n"}
                        <Text style={{ fontWeight: 'bold' }}>כללי ובטיחות:</Text>
                        {"\n"}• שיער חייב להיות אסוף צמוד לראש. שיער פזור הוא על אחריות המתעמל, עלול לגרום לבעיות בטיחות ולהפסקת תרגיל.
                        {"\n"}• אסור לענוד תכשיטים, פירסינג או שעונים. טבעות ללא אבנים מותרות אם הן מכוסות בטייפ.
                        {"\n"}• תחבושות או אביזרי תמיכה לא צריכים ליצור ניגוד בולט לצבע העור.
                        {"\n"}• לבוש תחתון לא יהיה גלוי.
                        {"\n\n"}
                        <Text style={{ fontWeight: 'bold' }}>ענישה:</Text>
                        {"\n"}• הפרה של הכללים תגרור ענישה של 0.2 נקודות על ידי השופט הראשי מהציון הסופי.
                        {"\n"}• הפרה חמורה עלולה להוביל לפסילה מהסבב בו בוצעה העבירה (החלטת השופט הראשי).
                        {"\n\n"}
                        <Text style={{ fontWeight: 'bold' }}>קבוצות:</Text>
                        {"\n"}• חברי הקבוצה חייבים ללבוש תלבושת אחידה. אי עמידה בכך עלולה להוביל לפסילת הקבוצה מהאירוע הקבוצתי (החלטת השופט הראשי).
                        {"\n"}• <Text style={{ fontWeight: 'bold' }}>סמל:</Text> סמל המדינה או הפדרציה (ראה חוקת TRA).
                        {"\n\n"}
                        <Text style={{ fontWeight: 'bold' }}>מאמנים:</Text>
                        {"\n"}• בגד/חליפה ייצוגית של הנבחרת או מכנסיים קצרים וטי-שירט, ונעלי ספורט.
                    </Text>
                </View>

                {/* 5. COMPETITION CARDS */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="document-text-outline" size={28} color={colors.tint} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>5. כרטיסי תחרות</Text>
                    </View>
                    <Text style={[styles.text, { color: colors.text }]}>
                        • יש לרשום את כל האלמנטים ודרגות הקושי לפי סדר הביצוע בכרטיס התחרות.
                        {"\n"}• חובה להשתמש בשיטה המספרית של FIG.
                        {"\n"}• הכרטיסים חייבים להימסר לפחות שעתיים לפני התחרות.
                        {"\n"}• כל שינוי חייב להירשם על ידי שופטי הקושי.
                    </Text>
                </View>

                {/* 10-12. PROCEDURES */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="time-outline" size={28} color={colors.tint} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>נהלי תחרות</Text>
                    </View>

                    <Text style={[styles.subTitle, { color: colors.text }]}>10. חימום</Text>
                    <Text style={[styles.text, { color: colors.text }]}>
                        • לכל מתעמל מותר חימום על המסלול כמספר הפסים שהוא מבצע בשלב התחרות (2 במוקדמות 1, 1 במוקדמות 2 וכו').
                        {"\n"}• חריגה בכמות החימום - ענישה של 0.2 נקודות.
                    </Text>

                    <Text style={[styles.subTitle, { color: colors.text, marginTop: 12 }]}>11. תחילת הפס</Text>
                    <Text style={[styles.text, { color: colors.text }]}>
                        • יש להתחיל בתוך 20 שניות מסימן השופט הראשי (אחרת ענישה 0.2). מעבר ל-60 שניות - פסילה (DNS).
                        {"\n"}• מותר להשתמש במקפצה רק לאלמנט הראשון.
                        {"\n"}• הפס נחשב שהתחיל ברגע שהמתעמל מבצע את האלמנט הראשון.
                        {"\n"}• אסור למאמן לדבר או לסמן למתעמל לאחר התחלת הפס (ענישה 0.6).
                    </Text>

                    <Text style={[styles.subTitle, { color: colors.text, marginTop: 12 }]}>12. מנחי גוף נדרשים</Text>
                    <Text style={[styles.text, { color: colors.text }]}>
                        • סלטות אחוריות בודדות בגובה כתפיים ומטה ייחשבו כטמפו (Whipback).
                        {"\n"}• דאבל סלטה בגוף ישר מותרת עם פישוק רגליים (מינימום 90 מעלות) אך חייבת להיסגר ב-3/4 מהסלטה.
                    </Text>
                </View>

                {/* 13-15. EXECUTION RULES */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="alert-circle-outline" size={28} color={colors.tint} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>חוקי ביצוע</Text>
                    </View>

                    <Text style={[styles.subTitle, { color: colors.text }]}>13. חזרות</Text>
                    <Text style={[styles.text, { color: colors.text }]}>
                        • למעט: גלגלונים, ערביות, פליק פלאק, קפיצות ידיים וטמפו - אסור לחזור על אלמנט במוקדמות 1.
                        {"\n"}• בורג (Full twist back) מותר עד 3 פעמים בפס, ורק פעם אחת כאלמנט מסיים (אלמנט 8).
                        {"\n"}• אלמנט חוזר לא יקבל ערך דרגת קושי.
                    </Text>

                    <Text style={[styles.subTitle, { color: colors.text, marginTop: 12 }]}>14. הפסקת פס</Text>
                    <Text style={[styles.text, { color: colors.text }]}>
                        הפס נחשב מופסק (ולא ינוקד האלמנט בו קרתה ההפסקה) במקרים:
                        {"\n"}• מגע ספוטר.
                        {"\n"}• צעדי ביניים או עצירה.
                        {"\n"}• נפילה.
                        {"\n"}• נגיעה מחוץ לקווים.
                        {"\n"}• ביצוע תנועה ללא סיבוב בציר המתאים.
                    </Text>

                    <Text style={[styles.subTitle, { color: colors.text, marginTop: 12 }]}>15. סיום הפס</Text>
                    <Text style={[styles.text, { color: colors.text }]}>
                        • הפס חייב להסתיים על הרגליים.
                        {"\n"}• חובה לעמוד יציב כ-3 שניות.
                        {"\n"}• אם הפס לא מסתיים בסלטה - ענישה של 2.0 נקודות.
                        {"\n"}• אם יש יותר מ-8 אלמנטים - הורדה של 1.0 נקודה.
                    </Text>
                </View>

                {/* 16. SCORING */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="calculator-outline" size={28} color={colors.tint} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>16. ניקוד (Score)</Text>
                    </View>
                    <Text style={[styles.text, { color: colors.text, marginBottom: 16 }]}>
                        <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Score = E (max 20) + D - P</Text>
                    </Text>

                    {/* Difficulty (D) */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.tint }]}>D - דרגת קושי</Text>

                        {/* Values Table */}
                        <View style={styles.table}>
                            <View style={styles.tableRow}><Text style={styles.tableTextBold}>אלמנט</Text><Text style={styles.tableTextBold}>ניקוד</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableText}>גלגלון, ערבית, פליק, קפיצת ידיים</Text><Text style={styles.tableText}>0.1</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableText}>טמפו (Whipback)</Text><Text style={styles.tableText}>0.2</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableText}>סלטה (360°)</Text><Text style={styles.tableText}>0.5</Text></View>

                            <View style={styles.tableRow}><Text style={styles.tableTextBold}>בונוסים וסיבובים:</Text><Text style={styles.tableText}></Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableText}>סלטה בודדת ישרה/מקופלת</Text><Text style={styles.tableText}>+0.1 בונוס</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableText}>סלטה קדימה</Text><Text style={styles.tableText}>+0.1 בונוס</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableText}>חצי בורג (180°)</Text><Text style={styles.tableText}>0.2</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableText}>כל 1/2 בורג נוסף (מעל דאבל/טריפל)</Text><Text style={styles.tableText}>+0.2 / +0.3 / +0.4</Text></View>

                            <View style={styles.tableRow}><Text style={styles.tableTextBold}>אלמנטים מרובי סלטות:</Text><Text style={styles.tableText}></Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableText}>דאבל סלטה (בסיס קיפול)</Text><Text style={styles.tableText}>2.0</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableText}>טריפל סלטה (בסיס קיפול)</Text><Text style={styles.tableText}>4.5</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableText}>בונוס גוף ישר (דאבל/טריפל)</Text><Text style={styles.tableText}>+0.2 / +0.4</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableText}>בונוס גוף מקופל (דאבל/טריפל)</Text><Text style={styles.tableText}>+0.1 / +0.3</Text></View>
                        </View>

                        <Text style={[styles.text, { color: colors.text, marginTop: 8, fontSize: 14 }]}>
                            * נשים: בונוס 1.0 על כל אלמנט מעל D=2.0 (החל מהשני).
                            {"\n"}* גברים: בונוס 1.0 על כל אלמנט מעל D=4.4 (החל מהשני).
                            {"\n"}* דאבל סלטה בפישוק מקבלת ניקוד זהה לגוף ישר.
                            {"\n"}* בסלטות כפולות/משולשות - מכפילים/משלשים את הערך כולל הבונוסים.
                        </Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Execution (E) - Detailed 19.2 */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.tint }]}>E - ביצוע (19.2)</Text>
                        <Text style={[styles.text, { color: colors.text }]}>
                            הציון מתחיל מ-20 נקודות.
                            {"\n"}הורדות על כל אלמנט (0.1-0.5):
                        </Text>
                        <View style={styles.table}>
                            <View style={styles.tableRow}><Text style={styles.tableTextBold}>שגיאה</Text><Text style={styles.tableTextBold}>הורדה</Text></View>

                            <View style={styles.tableRow}><Text style={styles.tableText}>מנח ידיים (פתיחה בבורג/לא צמודות)</Text><Text style={styles.tableText}>0.1</Text></View>

                            <View style={styles.tableRow}><Text style={styles.tableText}>מנח רגליים (ברכיים כפופות/פישוק/פוינט)</Text><Text style={styles.tableText}>0.1-0.2</Text></View>

                            <View style={styles.tableRow}><Text style={styles.tableText}>פתיחת אלמנט (Opening)</Text><Text style={styles.tableText}></Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableText}>- חוסר פתיחה (זווית 180° ב-12:00)</Text><Text style={styles.tableText}>0.1</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableText}>- סלטה בודדת/דאבל ללא בורג לא נפתחת</Text><Text style={styles.tableText}>0.3</Text></View>

                            <View style={styles.tableRow}><Text style={styles.tableText}>סיום בורג (Twisting) מאוחר</Text><Text style={styles.tableText}>0.2</Text></View>

                            <View style={styles.tableRow}><Text style={styles.tableText}>אי שמירה על גוף ישר (Pike down)</Text><Text style={styles.tableText}></Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableText}>- זווית 136°-170°</Text><Text style={styles.tableText}>0.1</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableText}>- זווית קטנה מ-135°</Text><Text style={styles.tableText}>0.2</Text></View>

                            <View style={styles.tableRow}><Text style={styles.tableTextBold}>נחיתה וחוסר יציבות (פעם אחת לפס):</Text><Text style={styles.tableText}></Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableText}>חוסר עמידה זקופה/תזוזה (3 שניות)</Text><Text style={styles.tableText}>0.1-0.3</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableText}>שכח לעמוד 3 שניות</Text><Text style={styles.tableText}>0.3</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableText}>נגיעה בידיים בנחיתה</Text><Text style={styles.tableText}>0.5</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableText}>נחיתה/נפילה על גוף/ברכיים/ידיים</Text><Text style={styles.tableText}>1.0</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableText}>עזרה מספוטר בנחיתה</Text><Text style={styles.tableText}>1.0</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableText}>יציאה מהמסלול/נחיתה בחוץ/אלמנט נוסף</Text><Text style={styles.tableText}>1.0</Text></View>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Penalties (P) */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.tint }]}>P - ענישות (Penalties)</Text>
                        <Text style={[styles.text, { color: colors.text }]}>
                            • נחיתה מחוץ לאזור הנחיתה: 1.0.
                            {"\n"}• יציאה מאזור הנחיתה לאחר נחיתה: 0.2.
                            {"\n"}• הפרת קוד לבוש: 0.2.
                            {"\n"}• דיבור עם מאמן בזמן פס: 0.6.
                            {"\n"}• אי עמידה בזמן (20 שניות): 0.2.
                            {"\n"}• שימוש בחימום יתר: 0.2.
                            {"\n"}• אי ביצוע סלטה בסיום: 2.0.
                            {"\n"}• אלמנט אחרון לא יוצא מהמסלול (אלא אם הפוך): 0.4.
                        </Text>
                    </View>
                </View>

                {/* 17. JUDGES */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="eye-outline" size={28} color={colors.tint} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>פאנל שיפוט</Text>
                    </View>
                    <Text style={[styles.text, { color: colors.text }]}>
                        הרכב הפאנל:
                        {"\n"}• 1 שופט ראשי (CJP).
                        {"\n"}• 6 שופטי ביצוע (E).
                        {"\n"}• 2 שופטי דרגת קושי (D).
                        {"\n"}סה"כ: 9 שופטים.
                        {"\n\n"}
                        <Text style={{ fontWeight: 'bold' }}>תפקידי השופט הראשי (CJP):</Text>
                        {"\n"}שולט על המתקנים, מנהל את התחרות, קובע לגבי ניסיון שני, מחיל ענישות (P) על יציאה מהמסלול, לבוש, זמן, ועוד.
                        {"\n\n"}
                        <Text style={{ fontWeight: 'bold' }}>תפקידי שופטי ביצוע (E):</Text>
                        {"\n"}מעריכים את הביצוע (0.0-0.5) ורושמים הורדות. ציון הביצוע מחושב מתוך מקסימום 20 (מפחיתים את חציון ההורדות).
                        {"\n\n"}
                        <Text style={{ fontWeight: 'bold' }}>תפקידי שופטי דרגת קושי (D):</Text>
                        {"\n"}בודקים ורושמים את האלמנטים וערכיהם בכרטיס התחרות.
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row-reverse', // RTL header
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 16, gap: 16 },
    card: {
        borderRadius: 12, borderWidth: 1, padding: 16,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }
    },
    cardHeader: {
        flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 16,
        borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 12
    },
    cardTitle: { fontSize: 22, fontWeight: 'bold' },
    text: { fontSize: 16, lineHeight: 26, textAlign: 'right', marginBottom: 6 },
    subTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 6, textAlign: 'right', color: '#666' },
    subText: { fontSize: 14, textAlign: 'right' },
    section: { marginTop: 12 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'right' },
    divider: { height: 1, marginVertical: 16 },
    scoreRow: { flexDirection: 'row-reverse', gap: 12, marginBottom: 12 },
    scoreBadge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    scoreBadgeText: { color: '#fff', fontWeight: 'bold' },
    ruleItem: { marginBottom: 12 },
    ruleTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2, textAlign: 'right' },
    tableHeader: { flexDirection: 'row-reverse', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8, marginBottom: 8 },
    tableHeadText: { textAlign: 'right', fontWeight: 'bold', fontSize: 14 },
    table: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginTop: 8 },
    tableRow: { flexDirection: 'row-reverse', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    tableCell: { justifyContent: 'center' },
    tableText: { textAlign: 'right', fontSize: 15, flex: 1 },
    tableTextBold: { textAlign: 'right', fontSize: 15, fontWeight: 'bold', flex: 1 }
});
