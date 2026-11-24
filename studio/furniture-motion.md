# Separate character and furniture animation

`index.html?edit=1` edits Popa in the original character timeline. Optional furniture references are static fitting guides. They have their own local storage, can be dragged/hidden/resized, and never become character tracks or enter character JSON exports. Sitting templates create ordinary `sit-enter`, `sit-hold`, `sit-exit` animation entries without overwriting existing animations. The old dedicated character-with-furniture editor has been removed; its URL redirects to the normal character editor and its drafts can be copied with the explicit legacy import button.

`studio.html?category=furniture` edits furniture only, with no character. It uses the existing layered prop timeline. The catalogue lists four furniture rigs and default independent clips:

- Sofa: frame, back cushion, seat cushion; `sofa/animations/cushion-bounce.json`.
- Cabinet: frame and two doors; `cabinet/animations/open.json`. Animated `scaleX` folds a door about its existing side hinge without moving the frame.
- Lamp: base and shade; `lamp/animations/sway.json`. The shade pivot is at its lower centre.
- Window: frame and two curtains; `window/animations/breeze.json`. Each curtain rotates about its top attachment.

Furniture pivots are calibrated by moving anchor and position together, so all original illustration pixels stay in place in the game. Rig geometry lives in each furniture's `assembly.json`, motion lives under its `animations/`, and PNGs stay under `images/`. Drafts save per rig under `popaPropDraftV1:<rig ID>`. Export assembly and motion JSON for review/integration. Furniture motion drafts do not change gameplay automatically.

`studio.html` continues to show salon props only. Its existing tools, storage and preview workflow are preserved. The new optional motion `scaleX`/`scaleY` fields default to 1, so older rotation/translation clips remain compatible.

### סידור המראה הקבוע במשחק

ב״מצב עריכה״ בחרי ״מראה קבוע במשחק — בלי אנימציה״. הגרירה והשדות
משנים את ההרכבה בלבד; ציר הזמן מוסתר והתצוגה אינה מפעילה אף פריים.
כפתור ״שמירת המראה במשחק״ שומר את מיקום החלקים, הצירים, הגדלים,
השכבות וההורות תחת `popaPropAppearanceV1:<prop id>` בדפדפן.
החדר, מסך הארון, כלי המספרה והרהיט לדוגמה בעורך פופה קוראים את
הסידור בפתיחה או ברענון. טיוטת האנימציה נפרדת ואינה נשמרת במשחק.

לשיתוף לכל השחקנים: ייצאי `assembly.json` והחליפי אותו בנתיב המוצג בעורך.
זו שמירת נתונים בלבד; האיורים אינם משתנים. אפשר להסיר את הסידור המקומי
ב״החזרת מראה המשחק לגרסת הפרויקט״. הפעולה אינה מוחקת את טיוטת הסטודיו.
