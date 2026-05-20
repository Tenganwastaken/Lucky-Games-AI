# Lucky Games AI

Εκπαιδευτικό web εργαλείο αξιολόγησης κινδύνου στα ψηφιακά τυχερά παιχνίδια, βασισμένο σε ένα διαφανές rule-based μοντέλο που έχει ως θεμέλιο τη σύγχρονη επιστημονική βιβλιογραφία.

> ⚠️ **Προσοχή:** Πρόκειται για εκπαιδευτικό demo και όχι για κλινικό εργαλείο. Δεν αποτελεί διάγνωση. Για βοήθεια σχετικά με τον τζόγο: ΚΕΘΕΑ-ΑΛΦΑ (210 9215776, https://www.kethea.gr).

## Ακαδημαϊκό πλαίσιο

Η εφαρμογή αποτελεί το εφαρμοσμένο μέρος της πτυχιακής εργασίας με τίτλο _«Ανάλυση Κινδύνου Εθισμού στα Ψηφιακά Τυχερά Παιχνίδια με Χρήση Python Analytics»_. Η μεθοδολογία αξιολόγησης ακολουθεί τους συμπεριφορικούς δείκτες που εντοπίζονται στη διεθνή βιβλιογραφία (Auer et al., 2024· Tani et al., 2024· Hopfgartner et al., 2025) και έχει ως μεθοδολογική επιλογή το rule-based μοντέλο για λόγους ερμηνευσιμότητας και συμμόρφωσης με το άρθρο 22 του GDPR.

## Χαρακτηριστικά

- 🌍 **Παγκόσμιος χάρτης:** Διάδοση τυχερών παιχνιδιών ανά χώρα με ρυθμιστικά πλαίσια.
- 🎯 **Αξιολόγηση κινδύνου:** Πολυπαραγοντική φόρμα με δείκτες τεκμηριωμένους στη βιβλιογραφία (chasing, deposit velocity, night-time play κ.λπ.).
- 🤖 **AI advisor:** Εξατομικευμένη ανατροφοδότηση με χρήση LLM (Groq SDK).
- 📊 **PGSI-9 screener:** Σύντομη ψυχομετρικά εγκυροποιημένη κλίμακα.
- 🧠 **Διαδραστική επίδειξη γνωστικών στρεβλώσεων:** Gambler's Fallacy, near-miss, illusion of control.

## Τεχνολογική στοίβα

- **Frontend:** Next.js 16 (App Router), React 19
- **Database:** Prisma 7 + SQLite (better-sqlite3 adapter)
- **Auth:** bcryptjs (custom session-based)
- **LLM:** groq-sdk
- **Γραφήματα:** chart.js, react-chartjs-2
- **Χάρτης:** d3-geo, topojson-client, world-atlas

## Setup

```bash
npm install
cp .env.example .env   # συμπλήρωσε τα κλειδιά
npx prisma migrate dev
npm run dev
```

Άνοιξε [http://localhost:3000](http://localhost:3000) στον browser.

## Δομή φακέλων

```
src/app/        Next.js App Router σελίδες & API routes
src/components/ Reusable UI components
src/lib/        Βοηθητικές βιβλιοθήκες (rule engine, helpers)
prisma/         Schema & migrations
data/           Στατικά δεδομένα χωρών
scripts/        Utility scripts
```

## Βιβλιογραφία (επιλεγμένη)

- Auer, M., Hopfgartner, N., & Griffiths, M. D. (2024). Machine-learning approaches in identifying problem gambling using behavioural tracking data. _Journal of Behavioral Addictions_.
- Auer, M., & Griffiths, M. D. (2015). Testing normative and self-appraisal feedback in an online slot-machine pop-up. _Frontiers in Psychology_, 6, 339.
- Blaszczynski, A., Ladouceur, R., & Shaffer, H. J. (2004). A science-based framework for responsible gambling: The Reno Model. _Journal of Gambling Studies_, 20(3), 301–317.
- Ferris, J., & Wynne, H. (2001). _The Canadian Problem Gambling Index: Final Report_.
- Hopfgartner, N., Auer, M., et al. (2025). Detecting problematic gambling behavior using machine learning. _arXiv preprint_.
- Tani, F., et al. (2024). Behavioral profiling of online gamblers using shapelets. _Computers in Human Behavior_.

## Άδεια

Εκπαιδευτική χρήση. Για άλλη χρήση επικοινωνία με τον συγγραφέα.
