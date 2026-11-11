# מדריך עבודה: יצירת אנימציה טובה, מאוזנת וטבעית לדמות מפורקת לאיברים

מסמך זה מסכם את העקרונות, התיקונים והלקחים שעלו במהלך בניית דמות הרובוט המורכבת מקובצי SVG נפרדים. המטרה היא לשמור על אנימציה נעימה, הגיונית למבנה הדמות, קריאה לצופה, וללא עיוותים של הראש, הידיים, הרגליים או הגוף.

## מטרות האיכות של האנימציה

אנימציה טובה לדמות כזו צריכה לעמוד בארבע מטרות מרכזיות:

1. **איזון חזותי** — הדמות צריכה להרגיש יציבה, גם כשהיא זזה, קופצת או מנופפת.
2. **תנועה טבעית** — כל איבר צריך לזוז סביב נקודת חיבור הגיונית, ולא כאילו הוא נגרר או נמתח.
3. **שמירה על מבנה הגוף** — אין להשתמש במתיחה, כיווץ או סיבוב קיצוני שגורמים לאיבר להיראות מעוות.
4. **המשכיות בין מצבים** — מעבר בין Idle, Inspired, Wave, Talk ו-Stop צריך להחזיר את הדמות למצב בסיס תקין ולא לצבור סטיות.

## מבנה הדמות והפרדת איברים

הדמות בנויה משכבות SVG נפרדות: ראש, גוף, שתי ידיים ושתי רגליים. שיטה זו מאפשרת שליטה מדויקת בכל איבר, אך מחייבת הקפדה על חיבורים נכונים בין החלקים.

עקרונות עבודה:

- כל איבר מקבל מיקום בסיס משלו: `left`, `top`, `width`, `x`, `y`, `rotate`, `scale`, `scaleX`, `scaleY`, `transformOrigin` ו-`zIndex`.
- יש לשמור את מיקום הבסיס כנקודת אמת, ולהחזיר אליה איברים בסוף אנימציות זמניות.
- שינויי אנימציה צריכים להתבצע בעיקר ב-`x`, `y` ו-`rotate`; שינויי `scaleX`/`scaleY` צריכים להיות נדירים מאוד כדי לא לעוות את האיברים.
- שכבות `zIndex` חייבות לתמוך בהיגיון הגוף: איברים קדמיים מעל הגוף, איברים אחוריים מאחור, והראש מעל הגוף.

## נקודות ציר נכונות (`transformOrigin`)

אחד הלקחים החשובים ביותר הוא שנקודת הציר קובעת אם התנועה מרגישה טבעית או שבורה.

הנחיות:

- ראש צריך להסתובב מאזור הצוואר/החיבור לגוף, לא ממרכז הראש בלבד.
- יד צריכה להסתובב מאזור הכתף או החיבור לגוף.
- רגל צריכה להסתובב מאזור האגן או החלק העליון של הרגל.
- אם איבר “בורח” מהגוף בזמן סיבוב, יש לתקן קודם את `transformOrigin` לפני שמוסיפים עוד keyframes.
- נקודות ציר שונות בין מצב בסיס לבין אנימציה עלולות לגרום לקפיצה חזותית, לכן יש להשתמש באותה נקודת ציר לאורך אותה תנועה.

## טווחי תנועה מאוזנים

תנועה טבעית אינה חייבת להיות גדולה. ברוב המקרים, תנועה קטנה ומדויקת נראית טוב יותר מתנועה מוגזמת.

הנחיות מומלצות:

- לראש: סיבובים קטנים עד בינוניים מספיקים לרוב. כדאי להימנע מסיבוב חד מדי שמנתק אותו מהגוף.
- לידיים: יש לשמור על תחושת חיבור לכתף. בזמן נפנוף, עדיף טווח זוויות קצר ורך מאשר סיבוב גדול שמרגיש כמו פירוק זרוע.
- לרגליים: תנועה צריכה לתמוך במשקל הגוף. רגליים לא צריכות להסתובב כאילו הן צפות ללא קשר למרכז הגוף.
- לגוף כולו: תנועות `y` ו-`rotate` קטנות מייצרות נשימה/ריחוף בלי לגרום לדמות לאבד יציבות.

## קצב, easing ותזמון

התנועה בדמות משתמשת בעיקר ב-easing רך כמו `sine.inOut`, `sine.in`, `sine.out` ו-`power`. זה חשוב כדי למנוע תנועה מכנית או חדה מדי.

עקרונות:

- לתנועות מחזוריות כמו Idle או ריחוף: להשתמש ב-`sine.inOut` כדי לקבל תנועה חלקה הלוך ושוב.
- לתחילת פעולה: אפשר להשתמש ב-`sine.out` או `power1.out` כדי לתת יציאה רכה.
- לסיום פעולה: להחזיר את האיברים בהדרגה למצב בסיס, לא בקפיצה.
- לא כל איבר חייב לזוז באותו רגע בדיוק; סטייה קטנה בזמנים יוצרת תחושה אורגנית יותר.
- יש להימנע מתנועות קצרות מדי עם זוויות גדולות, כי הן נראות כמו תקלה או קפיצה.

## שמירה על מצב בסיס ואיפוס

כדי למנוע הצטברות טעויות, חשוב מאוד לשמור עותק של תצורת הבסיס ולהשתמש בו בכל מצב חדש.

לקחים חשובים:

- לפני הפעלת אנימציה חדשה, לעצור או להרוג אנימציות שעלולות להתנגש איתה.
- בסיום פעולה זמנית כמו Wave, להחזיר את היד והראש למצב הבסיס.
- Talk צריך להשפיע בעיקר על הראש והגוף, ולא להשאיר את הדמות במצב ביניים.
- Stop צריך לאפס את החלקים ואת הצל כדי שהדמות תחזור למבנה תקין.
- שימוש בפונקציות עזר כמו `base`, `baseTransform` ו-`resetPartToBase` מונע כפילות ומקטין סיכוי לשגיאות.

## מניעת עיוותים של איברי גוף

עיוותים מופיעים בדרך כלל כשמשתמשים במתיחה, קנה מידה לא אחיד או סיבוב מנקודת ציר לא נכונה.

כללי מניעה:

- להעדיף `rotate` ו-`translate` על פני `scaleX`/`scaleY`.
- אם חייבים להשתמש ב-scale, לשמור על ערכים קרובים ל-1 ולבדוק שהאיבר לא נראה מתוח.
- לא לשנות רוחב (`width`) בזמן אנימציה רגילה; רוחב שייך להרכבה הראשונית של הדמות.
- לא לאפשר לאיבר להתנתק מנקודת החיבור שלו לגוף בזמן תנועה.
- לבדוק כל תנועה גם בתחילת האנימציה, גם באמצע וגם בסופה — לפעמים העיוות מופיע רק בפריים ביניים.

## עיצוב Idle טבעי

Idle טוב צריך להרגיש כאילו הדמות חיה, אבל לא כאילו היא מבצעת פעולה גדולה.

הנחיות:

- תנועה קטנה של הראש מוסיפה אופי.
- תנועה קלה של הידיים והרגליים מוסיפה איזון, אבל לא צריכה למשוך יותר מדי תשומת לב.
- ריחוף עדין של כל הדמות עוזר ליצור חיים, במיוחד כשהוא מסונכרן עם צל הקרקע.
- הצל צריך להשתנות בעדינות עם גובה הדמות כדי לחזק את תחושת המרחב.

## עיצוב פעולת Inspired

Inspired היא פעולה יותר אנרגטית מ-Idle, ולכן מותר להגדיל מעט את טווח התנועה, אך עדיין לשמור על מבנה הגוף.

הנחיות:

- הגוף יכול לעלות מעט ולחזור, כאילו הדמות מתלהבת.
- הראש יכול להסתובב מעט יותר מהרגיל, אבל עדיין להישאר מחובר לגוף.
- הידיים והרגליים צריכות לתמוך בתחושת ההתלהבות בלי להיראות מנותקות.
- הצל צריך להתכווץ/להיטשטש מעט כשהדמות עולה, ולחזור כשהיא נוחתת.

## עיצוב Wave טבעי

Wave צריך להרגיש כמו נפנוף מהכתף, לא כמו סיבוב אקראי של תמונה.

הנחיות:

- להשתמש ביד אחת כיד הפעילה, ולהשאיר את שאר הגוף יציב יחסית.
- נקודת הציר של היד חייבת להיות באזור החיבור לגוף.
- טווח הזוויות צריך להיות קצר, רך וחוזר, כדי לא לשבור את הזרוע.
- תנועת ראש קטנה במקביל יכולה להוסיף תגובה אנושית, אבל לא לגנוב את הפוקוס מהנפנוף.
- בסיום הנפנוף, להחזיר את היד והראש למצב בסיס ורק אז להמשיך Idle אם הוא היה פעיל.

## עיצוב Talk טבעי

Talk צריך להיות עדין ומהיר יחסית, עם תנועת ראש וגוף קטנה.

הנחיות:

- לא להזיז את כל הגוף באופן מוגזם בזמן דיבור.
- הראש יכול לבצע תנועות קטנות של `y` ו-`rotate` כדי לדמות דיבור.
- הגוף יכול להגיב בתנועה מינימלית כדי למנוע ראש “צף”.
- יש לשמור על מחזור קצר אך לא עצבני, עם הפסקה קטנה בין חזרות.
- עצירת Talk צריכה להחזיר את הראש והגוף למיקום הבסיס בצורה רכה.

## כלי debug ועריכת תצורה

כלי debug פנימי עוזר למצוא מיקומים, נקודות ציר וטווחי תנועה נכונים לפני שמקבעים אותם בקוד.

דרך עבודה מומלצת:

1. להפעיל debug רק בזמן כיוון (`DEBUG_ROBOT = true`).
2. לבחור איבר ולכוון קודם `left`, `top` ו-`width` עד שההרכבה נראית נכונה.
3. לכוון `transformOrigin` ולבדוק סיבוב קטן כדי לוודא שהאיבר מחובר נכון.
4. לכוון `x`, `y` ו-`rotate` למצב הבסיס.
5. להעתיק את התצורה הסופית לקוד ולכבות debug.

## Checklist לפני אישור אנימציה

לפני שמאשרים אנימציה חדשה או שינוי קיים, כדאי לבדוק:

- [ ] האם כל איבר נשאר מחובר לגוף לאורך כל האנימציה?
- [ ] האם אין מתיחה או כיווץ לא טבעיים של איברים?
- [ ] האם נקודות הציר הגיוניות אנטומית/מבנית?
- [ ] האם המעבר מתחיל ומסתיים במצב בסיס נקי?
- [ ] האם הצל תומך בתנועת הגוף ולא סותר אותה?
- [ ] האם האנימציה נראית טוב גם לאחר כמה לופים רצופים?
- [ ] האם לחיצה על Stop מחזירה את הדמות למבנה תקין?
- [ ] האם מעבר בין כפתורי האנימציה לא יוצר קפיצה או מצב ביניים שבור?

## כללי זהב להמשך העבודה

- קודם מרכיבים דמות יציבה, ורק אחר כך מוסיפים תנועה.
- קודם מתקנים נקודת ציר, ורק אחר כך מתקנים keyframes.
- תנועה קטנה עם easing נכון עדיפה על תנועה גדולה עם תיקונים מאולצים.
- לא נותנים לאנימציות להצטבר זו על זו בלי איפוס.
- כל פעולה זמנית חייבת לדעת איך לחזור למצב הבסיס.
- אם משהו נראה “לא טבעי”, לבדוק לפי הסדר: חיבור איבר, נקודת ציר, טווח תנועה, easing, ואז תזמון.

## English AI instructions for creating new site animations

Use this section as a practical prompt or checklist for any AI agent that needs to add a new animation to this website.

### 1. Understand the character before animating

The character is built from separate SVG body parts: head, body, left hand, right hand, left leg and right leg. Each part already has a carefully tuned base position in `ROBOT_CONFIG`. Before creating a new animation, inspect the existing base values and treat them as the source of truth. Do not randomly resize, stretch or reposition parts unless the base assembly itself is being corrected.

### 2. Start every animation from the base pose

A new animation should begin from the current base pose returned by `base(partName)`. Use helper patterns such as `base('head').x`, `base('rightHand').rotate` and `resetPartToBase(partName)` instead of hardcoding unrelated values. This keeps animations compatible with future character alignment fixes.

### 3. Animate only safe transform properties

Prefer animating these properties:

- `x`
- `y`
- `rotate`
- occasionally uniform `scale`

Avoid animating these properties unless there is a very specific reason:

- `width`
- `left`
- `top`
- large `scaleX` or `scaleY` changes
- unrelated `transformOrigin` changes during the animation

Changing `scaleX` and `scaleY` separately can visually deform body parts, so use them only for very subtle squash/stretch effects and always return them to `1` or the configured base value.

### 4. Keep pivots anatomically logical

Every part should rotate around a believable joint:

- Head rotates near the neck connection.
- Hands rotate near the shoulder/body connection.
- Legs rotate near the hip/top-leg connection.
- The full robot rotates around its visual center of mass.

If a limb appears detached while rotating, fix the `transformOrigin` first. Do not compensate by adding many extra `x`/`y` keyframes unless the pivot is already correct.

### 5. Keep motion ranges small and readable

Natural animation usually comes from small, controlled offsets. As a default rule:

- Head rotation should be subtle unless the action is intentionally expressive.
- Arms should not swing far enough to look broken or detached.
- Legs should support the character weight and should not float independently.
- Whole-body motion should be small enough that the character still feels balanced.

If the animation looks exciting but the character structure looks wrong, reduce the range of motion.

### 6. Use soft easing and staggered timing

Use smooth easing such as `sine.inOut`, `sine.out`, `sine.in`, `power1.out` or `power1.inOut`. Avoid abrupt linear movement for organic character motion unless the animation intentionally needs a mechanical effect.

Small timing offsets between parts can make the motion feel more alive. For example, let the head react slightly after the body, or let a hand settle a little after the main movement.

### 7. Manage animation conflicts

Before starting a new main animation, stop or pause timelines that might conflict with it. Follow the existing site pattern:

- Use `stopAllAnimations({ reset: true })` for full mode changes.
- Use `ensureFloatTimeline()` when the global floating motion should continue.
- Kill temporary timelines before starting a new temporary action.
- Resume the previous idle timeline only if that behavior is intentional.

Never allow multiple timelines to fight over the same body part transform at the same time.

### 8. Return cleanly to the base pose

Any one-shot animation must restore the affected parts when it completes. Use `resetPartToBase` or animate the parts back to `base(...)` values. A user should be able to click animation buttons repeatedly without the character drifting, accumulating rotations or ending in a broken pose.

### 9. Update the UI if the animation is user-triggered

If the new animation has a button:

1. Add a button in `index.html` with `data-action="newActionName"`.
2. Add a matching function in `script.js`.
3. Register that function in the `actions` object used by the controls click handler.
4. Call `setActiveButton('newActionName')` when the animation starts.
5. Clear or restore the active button state when the animation ends.

### 10. Test visually and programmatically

After adding an animation, check these things:

- The character starts from a valid pose.
- No body part stretches, flips, detaches or changes size unexpectedly.
- The animation loops cleanly if it is a looping animation.
- A one-shot animation returns to base pose.
- Switching between buttons does not create jumps or stuck intermediate poses.
- `Stop` restores the character and the ground shadow.
- Browser console has no JavaScript errors.

### Suggested implementation template

```js
function newAnimationName() {
  stopAllAnimations({ reset: true });
  ensureFloatTimeline();

  const headBase = base('head');
  const handBase = base('rightHand');

  const timeline = gsap.timeline({
    defaults: { overwrite: 'auto', ease: 'sine.inOut' },
    onComplete: () => {
      resetPartToBase('head');
      resetPartToBase('rightHand');
      setActiveButton(null);
    },
  });

  timeline
    .to(partElements.head, {
      x: headBase.x,
      y: headBase.y - 2,
      rotate: headBase.rotate + 3,
      duration: 0.25,
    })
    .to(partElements.rightHand, {
      x: handBase.x + 4,
      y: handBase.y - 3,
      rotate: handBase.rotate + 8,
      duration: 0.3,
    }, '<')
    .to(partElements.head, {
      x: headBase.x,
      y: headBase.y,
      rotate: headBase.rotate,
      duration: 0.25,
    })
    .to(partElements.rightHand, {
      x: handBase.x,
      y: handBase.y,
      rotate: handBase.rotate,
      duration: 0.25,
    }, '<');

  setActiveButton('newAnimationName');

  return timeline;
}
```

Use this template as a starting point, but always adapt the motion to the character structure and the emotional purpose of the animation.
