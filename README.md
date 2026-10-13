# StudyLens — Student Performance Dashboard

Dashboard statistik deskriptif berbasis Flask untuk `latihan1.csv`.

## Deploy ke Render

Project ini sudah disiapkan untuk deployment Flask di Render.

**Build Command**
```bash
pip install -r requirements.txt
```

**Start Command**
```bash
gunicorn app:app
```

Render akan menyediakan nilai `PORT` secara otomatis. Aplikasi juga tetap bisa dijalankan lokal dengan:

```bash
python app.py
```

## Struktur
```text
dashboard_statistik_modern/
├── app.py
├── latihan1.csv
├── requirements.txt
├── render.yaml
├── README.md
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── app.js
```

## Features
- Dark minimal dashboard dengan pastel pink dan white accents.
- Filter berdasarkan gender.
- KPI otomatis: total data, mean, median, standar deviasi, data berisiko.
- Score distribution.
- Gender comparison.
- Study-hours vs exam-score scatter plot.
- Correlation widgets untuk attendance, screen time, study hours, sleep, dan satisfaction.
- Analisis statistik deskriptif dalam Bahasa Indonesia.
- Rekomendasi keputusan berdasarkan pola data.
- Search data preview.

Chart menggunakan Chart.js dari CDN, jadi browser membutuhkan koneksi internet saat membuka halaman.
