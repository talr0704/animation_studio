# פופה — חבילת שילוב למשחק דפדפן

החבילה כוללת את הדמות, ההרכבה ונקודות הציר המעודכנות, תשע האנימציות והבעות
הפנים האוטומטיות. היא משתמשת ב־HTML, CSS ו־JavaScript ללא תלות בספרייה חיצונית.

## התחלה מהירה

1. חלצי את ZIP והעתיקי את תיקיית `popa-browser` בשלמותה לפרויקט המשחק.
2. הוסיפי קישור ל־CSS ואלמנט שבו תוצג פופה.
3. טעני את המודול וקראי ל־`createPopa`.

```html
<link rel="stylesheet" href="./popa-browser/popa-browser.css">
<div id="my-popa"></div>
<script type="module">
  import { createPopa } from './popa-browser/popa-browser.js';

  const popa = await createPopa(document.querySelector('#my-popa'), {
    scale: 0.65,
    autoplay: 'idle',
  });

  // למשל: כששחקנית לוחצת על כפתור תנועה:
  // popa.play('walk');
  // כשהתנועה מסתיימת:
  // popa.stop();
</script>
```

יש לפתוח דרך שרת HTTP של המשחק או שרת פיתוח. לפתיחת הדוגמה המקומית:

```sh
python3 -m http.server 4173
```

לאחר מכן פתחי את `popa-browser/example.html` דרך השרת. פתיחה ישירה של קובץ HTML
מהדיסק עלולה לחסום מודולים וטעינת קובץ ההרכבה.

## הפעלת אנימציות

```js
popa.play('idle');      // נשימה, 3 שניות בלולאה
popa.play('walk');      // הליכה במקום, 0.8 שניות בלולאה
await popa.play('happy'); // קפיצה, 1.2 שניות
popa.play('wave');      // נפנוף, 1.6 שניות
popa.play('curious');   // סקרנות, 2 שניות
popa.play('interact');  // אינטראקציה, 1.1 שניות
popa.play('hold');      // החזקת פריט, 2.5 שניות בלולאה
popa.play('pet');       // תגובה לליטוף, 1.8 שניות
popa.play('rest');      // מנוחה, 4 שניות בלולאה
popa.stop();            // חזרה רכה לעמידה
```

`play` מחזירה Promise: באנימציה חד־פעמית הוא מסתיים בסיום או בביטול; בלולאה
הוא מסתיים כשהלולאה התחילה. מעברי הכניסה והיציאה בני 220 מילישניות נוספים
למשכי הקטעים. `autoplay: false` משאיר את הדמות בעמידה ללא אנימציה.

הבעות הפנים נבחרות אוטומטית בכל אנימציה. העיניים הפקוחות גדולות מהעצומות,
בהתאם לסידור שאושר. המיקום במשחק נקבע על ידי האלמנט שמכיל את פופה:

```css
#my-popa { position: absolute; left: 120px; bottom: 40px; }
```

ההליכה היא במקום, כך שהמשחק יכול לעדכן את מיקום האלמנט בהתאם לקלט.
אין לשנות את ה־transform של חלקי הגוף או של השכבות הפנימיות בזמן אנימציה.

## פעולה במשחק והחזקת פריט

```js
popa.element.addEventListener('popa:interact', event => {
  // מופעל פעם אחת ברגע המגע, 0.55 שניות מתחילת הקטע.
  collectNearbyItem();
});
popa.play('interact');

const apple = document.createElement('img');
apple.src = './items/apple.png';
apple.alt = 'תפוח';
popa.attachItem(apple);
popa.play('hold');

// לשחרור הפריט:
popa.clearItem();
popa.stop();
```

אירוע המגע מבוטל אם האנימציה נקטעת לפני המגע. פריטים מותאמים לתיבה של
44 × 44 ומוצגים בין השמלה לכפות. אפשר לגשת לעוגן דרך `popa.itemAnchor`.

## גודל, כמה דמויות וניקוי

```js
popa.setScale(0.5);
console.log(popa.action); // שם האנימציה הנוכחית
console.log(popa.clips);  // תשעת השמות הזמינים

const other = await createPopa(document.querySelector('#another-popa'), {
  scale: 0.4, autoplay: 'rest',
});

// כשמסירים את הדמות או עוזבים את סצנת המשחק:
popa.destroy();
other.destroy();
```

כל מופע עצמאי. אין משתנה גלובלי משותף, פאנל עריכה או שינוי ב־CSS של דף המשחק.
הדמות מסירה רק את התוכן שהיא עצמה הוסיפה. אחרי `destroy` אפשר ליצור מופע חדש
באותו אלמנט. החבילה מכבדת את העדפת צמצום התנועה של המשתמשת.

## מה לשמור יחד

יש להשאיר יחד את כל תוכן תיקיית `popa-browser`: קובצי המודולים, ה־CSS,
`assets/characters/popa/assembly.json` ותיקיית `assets/characters/popa/parts`. הנתיבים של קובצי הדמות נפתרים ביחס
למודול עצמו, ולכן אפשר להעביר את כל התיקייה לתוך תיקיית נכסים במשחק.

למפתחות: מקורות החבילה נמצאים בשורש המאגר. אחרי עדכון הדמות, בנו מחדש עם
`python3 scripts/build-popa-browser.py`. הפקודה מעדכנת את `portable-popa` ואת
`downloads/popa-browser.zip` מאותה גרסה של המקורות.
