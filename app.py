from flask import Flask, render_template, jsonify
import csv, json, math
from pathlib import Path

BASE = Path(__file__).resolve().parent
DATA_FILE = BASE / 'latihan1.csv'
app = Flask(__name__)


def load_data():
    # The supplied CSV stores each row as one quoted comma-separated field.
    with open(DATA_FILE, newline='', encoding='utf-8-sig') as f:
        parsed = [row for row in csv.reader(f) if row]

    # Support both normal CSV files (10 columns per row) and the quoted
    # single-column CSV format used by some versions of latihan1.csv.
    raw = []
    for row in parsed:
        if len(row) == 1 and ',' in row[0]:
            raw.append([cell.strip() for cell in row[0].split(',')])
        else:
            raw.append([cell.strip() for cell in row])

    headers = [h.strip() for h in raw[0]]
    records = []
    numeric = {'Student_ID','Age','Study_Hours','Sleep_Hours','Attendance','Exam_Score','Monthly_Spending','Screen_Hours','Satisfaction'}
    for row in raw[1:]:
        if len(row) != len(headers):
            continue
        rec = dict(zip(headers, row))
        for key in numeric:
            rec[key] = float(rec[key]) if '.' in rec[key] else int(rec[key])
        records.append(rec)
    return records


def mean(values):
    return sum(values) / len(values) if values else 0


def median(values):
    s = sorted(values)
    n = len(s)
    if not n: return 0
    return s[n//2] if n % 2 else (s[n//2-1] + s[n//2]) / 2


def std(values):
    if len(values) < 2: return 0
    m = mean(values)
    return math.sqrt(sum((x-m)**2 for x in values)/(len(values)-1))


def corr(a, b):
    if len(a) < 2: return 0
    ma, mb = mean(a), mean(b)
    da = [x-ma for x in a]; db = [y-mb for y in b]
    den = math.sqrt(sum(x*x for x in da) * sum(y*y for y in db))
    return sum(x*y for x,y in zip(da,db))/den if den else 0


def dashboard_payload():
    data = load_data()
    scores = [r['Exam_Score'] for r in data]
    study = [r['Study_Hours'] for r in data]
    attendance = [r['Attendance'] for r in data]
    screen = [r['Screen_Hours'] for r in data]
    bands = [('Below 60', lambda x: x < 60), ('60–69', lambda x: 60 <= x < 70), ('70–79', lambda x: 70 <= x < 80), ('80–89', lambda x: 80 <= x < 90), ('90–100', lambda x: x >= 90)]
    gender = {}
    for g in ['F','M']:
        rows = [r for r in data if r['Gender']==g]
        gender[g] = {
            'count': len(rows), 'mean_score': round(mean([r['Exam_Score'] for r in rows]),2),
            'attendance': round(mean([r['Attendance'] for r in rows]),2),
            'study': round(mean([r['Study_Hours'] for r in rows]),2),
            'satisfaction': round(mean([r['Satisfaction'] for r in rows]),2)
        }
    return {
        'data': data,
        'stats': {
            'count': len(data), 'mean': round(mean(scores),2), 'median': round(median(scores),2),
            'std': round(std(scores),2), 'min': min(scores), 'max': max(scores),
            'corr_study': round(corr(study,scores),3), 'corr_attendance': round(corr(attendance,scores),3),
            'corr_screen': round(corr(screen,scores),3), 'at_risk': sum(s < 60 for s in scores),
            'high_performers': sum(s >= 80 for s in scores), 'avg_attendance': round(mean(attendance),2),
            'avg_study': round(mean(study),2), 'avg_satisfaction': round(mean([r['Satisfaction'] for r in data]),2)
        },
        'bands': [{'label': label, 'count': sum(fn(s) for s in scores)} for label,fn in bands],
        'gender': gender,
        'correlations': [
            {'label':'Attendance', 'value':round(corr(attendance,scores),3)},
            {'label':'Screen Time', 'value':round(corr(screen,scores),3)},
            {'label':'Study Hours', 'value':round(corr(study,scores),3)},
        ]
    }


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data')
def api_data():
    return jsonify(dashboard_payload())

if __name__ == '__main__':
    import os
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)
