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
                        <Text style={[styles.cardTitle, { color: colors.text }]}>כללי</Text>
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
                        <Text style={[styles.cardTitle, { color: colors.text }]}>לבוש מתעמלים</Text>
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
                        <Text style={[styles.cardTitle, { color: colors.text }]}>כרטיסי תחרות</Text>
                    </View>
                    <Text style={[styles.text, { color: colors.text }]}>
                        • יש לרשום את כל האלמנטים ודרגות הקושי לפי סדר הביצוע בכרטיס התחרות.
                        {"\n"}• חובה להשתמש בסימבולס.
                        {"\n"}• הכרטיסים חייבים להימסר לפחות שעתיים לפני התחרות.
                        {"\n"}• כל שינוי באלמנטים יירשם על ידי שופטי דרגת הקושי.
                    </Text>
                </View>

                {/* 10-12. PROCEDURES */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="time-outline" size={28} color={colors.tint} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>נהלי תחרות</Text>
                    </View>

                    <Text style={[styles.subTitle, { color: colors.text }]}>חימום</Text>
                    <Text style={[styles.text, { color: colors.text }]}>
                        • לכל מתעמל מותר חימום על הפיבר כמספר הפסים שהוא מבצע בשלב התחרות (2 פסים במוקדמות 1, פס אחד במוקדמות 2 וכו').
                        {"\n"}• חריגה בכמות החימום - ענישה של 0.2 נקודות.
                    </Text>

                    <Text style={[styles.subTitle, { color: colors.text, marginTop: 12 }]}>תחילת הפס</Text>
                    <Text style={[styles.text, { color: colors.text }]}>
                        • כל מתעמל יתחיל בעקבות סימן שיינתן על ידי השופט הראשי.
                        {"\n\n"}• לאחר שהסימן ניתן, על המתעמל להתחיל את האלמנט הראשון בתוך 20 שניות.
                        {"\n"}  - חריגה מהזמן: ענישה של 0.2 נקודות ע"י השופט הראשי.
                        {"\n"}  - <Text style={{ fontWeight: 'bold' }}>61 שניות:</Text> המתעמל לא יורשה להתחיל, לא יינתן ניקוד והוא יסומן כ-DNS.
                        {"\n"}  - אם החריגה נגרמה עקב ציוד תקול או סיבה משמעותית אחרת (לשיקול דעת השופט הראשי), לא תתבצע הפחתת ניקוד.
                        {"\n\n"}• <Text style={{ fontWeight: 'bold' }}>שימוש במקפצה:</Text>
                        {"\n"}  - מותר להשתמש במקפצה רק לצורך התחלת האלמנט הראשון.
                        {"\n"}  - ניתן להניח אותה בכל מקום על הפיבר או על מסלול ההרצה.
                        {"\n\n"}• <Text style={{ fontWeight: 'bold' }}>ביצוע:</Text>
                        {"\n"}  - האלמנט הראשון חייב לנחות על הפיבר (גם אם התחיל במסלול ההרצה).
                        {"\n"}  - הגדרת התחלה: כאשר המתעמל מתחיל את האלמנט הראשון (ידיים נוגעות בפיבר בערבית או ניתור לכל אלמנט קדימה).
                        {"\n\n"}• לאחר שהתרגיל התחיל, דיבור או מתן סימן למתעמל על ידי המאמן יגרור ענישה של 0.6 נקודות (פעם אחת בלבד על ידי השופט הראשי).
                    </Text>

                    <Text style={[styles.subTitle, { color: colors.text, marginTop: 12 }]}>מנחי גוף נדרשים</Text>
                    <Text style={[styles.text, { color: colors.text }]}>
                        • סלטות אחוריות בודדות בגובה כתפיים ומטה ייחשבו כטמפו חוץ מבאלמנט האחרון.
                        {"\n"}• דאבל סלטה בגוף ישר מותרת עם פסיעת רגליים (מינימום 60 מעלות) אך חייבת להיסגר בשעה 3.
                    </Text>
                </View>

                {/* REPETITIONS */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="repeat-outline" size={28} color={colors.tint} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>חזרות</Text>
                    </View>
                    <Text style={[styles.text, { color: colors.text }]}>
                        • למעט: גלגלון, ערבית, פליק פלאק, קפיצת ידיים וטמפו - אסור לחזור על אלמנט באותו הפס או בין שני הפסים.
                        {"\n"}• בורג בודד מותר עד 3 פעמים בפס, ורק פעם אחת בסוף הפס (אלמנט 8).
                        {"\n"}• אלמנט חוזר לא יקבל ערך דרגת קושי.
                    </Text>
                </View>

                {/* INTERRUPTING THE PASS */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="hand-left-outline" size={28} color={colors.tint} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>הפרעת תרגיל</Text>
                    </View>
                    <Text style={[styles.text, { color: colors.text }]}>
                        הפרעת תרגיל נחשבת כאשר:
                        {"\n"}• מאמן שומר.
                        {"\n"}• צעדי ביניים או עצירה.
                        {"\n"}• נפילה באמצע הפס.
                        {"\n"}• יציאה מתחום הפיבר באמצע הפס.
                        {"\n"}• ביצוע תנועה ללא סיבוב בציר המתאים.
                        {"\n"}
                        {"\n"}במקרה זה האלמנט בו התרחשה ההפרעה לא נחשב וגם כל האלמנטים שאחריו.
                    </Text>
                </View>

                {/* ENDING THE PASS */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="flag-outline" size={28} color={colors.tint} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>סיום הפס</Text>
                    </View>
                    <Text style={[styles.text, { color: colors.text }]}>• על התרגיל להסתיים על הרגליים (על הפיבר או אזור הנחיתה), אחרת האלמנט האחרון לא ייספר.</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• לאחר האלמנט האחרון יש לעמוד זקוף ולהראות יציבות לכ-3 שניות, אחרת יחולו הורדות ניקוד.</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• האלמנט האחרון חייב להתבצע מהפיבר אל אזור הנחיתה (למעט האלמנט האחרון שיכול להיות בכיוון ההפוך). אי עמידה בכך תגרור ענישה של 0.4 נקודות ע"י השופט הראשי.</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• נחיתה ללא הכנה: אם המתעמל נוגע ברגליים בקרקע אך נופל מיד (פנים/ברכיים/ידיים וברכיים) ללא שליטה, האלמנט לא ייספר (ללא הורדה נוספת על הנפילה).</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• סיום בסלטה: חובה לסיים בסלטה. אי ביצוע סלטה בסיום יגרור ענישה של 2.0 נקודות ע"י השופט הראשי.</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• ביצוע יותר מ-8 אלמנטים: יגרור הורדה של 1.0 נקודה ע"י שופטי הביצוע.</Text>
                </View>

                {/* 16. SCORING */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="calculator-outline" size={28} color={colors.tint} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>ניקוד</Text>
                    </View>
                    <Text style={[styles.text, { color: colors.text, marginBottom: 16 }]}>
                        <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Score = E (max 20) + D - P</Text>
                    </Text>

                    {/* Difficulty (D) */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.tint }]}>D - דרגת קושי</Text>

                        {/* Values Table */}
                        {/* Values Table - Redesigned */}
                        <View style={styles.difficultyContainer}>

                            {/* Basic Elements */}
                            <View style={styles.difficultySection}>
                                <Text style={styles.difficultyTitle}>אלמנטים בסיסיים</Text>
                                <View style={styles.difficultyRow}><Text style={styles.difficultyLabel}>גלגלון, ערבית, פליק, קפיצת ידיים</Text><Text style={styles.difficultyValue}>0.1</Text></View>
                                <View style={styles.difficultyRow}><Text style={styles.difficultyLabel}>טמפו</Text><Text style={styles.difficultyValue}>0.2</Text></View>
                                <View style={styles.difficultyRow}><Text style={styles.difficultyLabel}>סלטה</Text><Text style={styles.difficultyValue}>0.5</Text></View>
                            </View>

                            {/* Single Salto Bonuses */}
                            <View style={styles.difficultySection}>
                                <Text style={styles.difficultyTitle}>בונוסים לסלטה בודדת</Text>
                                <View style={styles.difficultyRow}><Text style={styles.difficultyLabel}>ללא בורג: מנח קיפול או גוף ישר</Text><Text style={styles.difficultyValue}>+0.1</Text></View>
                                <View style={styles.difficultyRow}><Text style={styles.difficultyLabel}>סלטה קדימה</Text><Text style={styles.difficultyValue}>+0.1</Text></View>
                            </View>

                            {/* Single Salto Twisting */}
                            <View style={styles.difficultySection}>
                                <Text style={styles.difficultyTitle}>ברגים בסלטה בודדת</Text>
                                <View style={styles.difficultyRow}><Text style={styles.difficultyLabel}>חצי בורג (180°)</Text><Text style={styles.difficultyValue}>0.2</Text></View>
                                <View style={styles.difficultyRow}><Text style={styles.difficultyLabel}>כל חצי בורג נוסף מעל 2 ברגים (720°)</Text><Text style={styles.difficultyValue}>0.3</Text></View>
                                <View style={styles.difficultyRow}><Text style={styles.difficultyLabel}>כל חצי בורג נוסף מעל 3 ברגים (1080°)</Text><Text style={styles.difficultyValue}>0.4</Text></View>
                            </View>

                            {/* Double Salto Twisting */}
                            <View style={styles.difficultySection}>
                                <Text style={styles.difficultyTitle}>ברגים בדאבל סלטה</Text>
                                <View style={styles.difficultyRow}><Text style={styles.difficultyLabel}>חצי בורג (180°)</Text><Text style={styles.difficultyValue}>0.1</Text></View>
                                <View style={styles.difficultyRow}><Text style={styles.difficultyLabel}>כל חצי בורג נוסף מעל בורג אחד (360°)</Text><Text style={styles.difficultyValue}>0.2</Text></View>
                                <View style={styles.difficultyRow}><Text style={styles.difficultyLabel}>כל חצי בורג נוסף מעל 2 ברגים (720°)</Text><Text style={styles.difficultyValue}>0.3</Text></View>
                                <View style={styles.difficultyRow}><Text style={styles.difficultyLabel}>כל חצי בורג נוסף מעל 3 ברגים (1080°)</Text><Text style={styles.difficultyValue}>0.4</Text></View>
                            </View>

                            {/* Triple Salto Twisting */}
                            <View style={styles.difficultySection}>
                                <Text style={styles.difficultyTitle}>ברגים בטריפל סלטה</Text>
                                <View style={styles.difficultyRow}><Text style={styles.difficultyLabel}>כל חצי בורג (עד 360°)</Text><Text style={styles.difficultyValue}>0.3</Text></View>
                                <View style={styles.difficultyRow}><Text style={styles.difficultyLabel}>כל חצי בורג נוסף מעל בורג אחד (360°)</Text><Text style={styles.difficultyValue}>0.4</Text></View>
                            </View>

                            {/* Multiple Salto Bonuses */}
                            <View style={styles.difficultySection}>
                                <Text style={styles.difficultyTitle}>בונוסים בסלטות מרובות (עם/בלי בורג)</Text>

                                <Text style={{ color: colors.text, marginTop: 4, textDecorationLine: 'underline', fontWeight: 'bold', fontSize: 14, textAlign: 'right' }}>מנח קיפול:</Text>
                                <View style={styles.difficultyRow}><Text style={styles.difficultyLabel}>דאבל / טריפל / קוואדרופל</Text><Text style={styles.difficultyValue}>0.1 / 0.2 / 0.3</Text></View>

                                <Text style={{ color: colors.text, marginTop: 8, textDecorationLine: 'underline', fontWeight: 'bold', fontSize: 14, textAlign: 'right' }}>מנח גוף ישר:</Text>
                                <View style={styles.difficultyRow}><Text style={styles.difficultyLabel}>דאבל / טריפל</Text><Text style={styles.difficultyValue}>0.2 / 0.4</Text></View>
                            </View>

                        </View>

                        <Text style={[styles.text, { color: colors.text, marginTop: 8, fontSize: 14 }]}>
                            * נשים: בונוס 1.0 על כל אלמנט מעל D=2.0 (החל מהשני).
                            {"\n"}* גברים: בונוס 1.0 על כל אלמנט מעל D=4.4 (החל מהשני).
                            {"\n"}* דאבל סלטה בפישוק מקבלת ניקוד זהה לגוף ישר.
                            {"\n"}* בסלטות כפולות - הערך של האלמנט (כולל ברגים ובונוס מנח) מוכפל.
                        </Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Execution (E) - Detailed 19.2 */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.tint }]}>E - ביצוע</Text>
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
                            <View style={styles.tableRow}><Text style={styles.tableText}>יציאה מהפיבר/נחיתה בחוץ/אלמנט נוסף</Text><Text style={styles.tableText}>1.0</Text></View>
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
                            {"\n"}• אלמנט אחרון לא יוצא מהפיבר (אלא אם הפוך): 0.4.
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
                        {"\n"}שולט על המתקנים, מנהל את התחרות, קובע לגבי ניסיון שני, מחיל ענישות (P) על יציאה מהפיבר, לבוש, זמן, ועוד.
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
    text: { fontSize: 16, lineHeight: 26, textAlign: 'right', marginBottom: 6, width: '100%', paddingHorizontal: 4 },
    subTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 6, textAlign: 'right', color: '#666', width: '100%' },
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
    tableTextBold: { textAlign: 'right', fontSize: 15, fontWeight: 'bold', flex: 1 },
    difficultyContainer: { gap: 12 },
    difficultySection: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, marginBottom: 8 },
    difficultyTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, textAlign: 'right', color: '#fa7e1e' },
    difficultyRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
    difficultyLabel: { flex: 1, textAlign: 'right', fontSize: 15, paddingLeft: 8, flexWrap: 'wrap' },
    difficultyValue: { fontSize: 15, fontWeight: 'bold', textAlign: 'left', minWidth: 40 }
});
