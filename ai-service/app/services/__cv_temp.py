CV_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .header {
            border-bottom: 2px solid #2c3e50;
            margin-bottom: 20px;
            padding-bottom: 15px;
        }
        .name {
            font-size: 32px;
            font-weight: bold;
            color: #2c3e50;
        }
        .contact {
            font-size: 12px;
            color: #7f8c8d;
        }
        .section {
            margin: 20px 0;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
            border-bottom: 1px solid #ecf0f1;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        .entry {
            margin: 10px 0;
        }
        .entry-title {
            font-weight: bold;
            font-size: 14px;
        }
        .entry-subtitle {
            color: #7f8c8d;
            font-style: italic;
            font-size: 12px;
        }
        .entry-description {
            margin-top: 5px;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="name">{{ full_name }}</div>
        <div class="contact">
            {{ email }} | {{ phone }} | {{ city }}
        </div>
    </div>

    {% if professional_summary %}
    <div class="section">
        <div class="section-title">Profesjonalne Podsumowanie</div>
        <p>{{ professional_summary }}</p>
    </div>
    {% endif %}

    {% if experience %}
    <div class="section">
        <div class="section-title">Doświadczenie Zawodowe</div>
        {% for job in experience %}
        <div class="entry">
            <div class="entry-title">{{ job.position }}</div>
            <div class="entry-subtitle">{{ job.company }} | {{ job.start_date }} - {{ job.end_date }}</div>
            <div class="entry-description">{{ job.description }}</div>
        </div>
        {% endfor %}
    </div>
    {% endif %}

    {% if education %}
    <div class="section">
        <div class="section-title">Edukacja</div>
        {% for edu in education %}
        <div class="entry">
            <div class="entry-title">{{ edu.degree }}</div>
            <div class="entry-subtitle">{{ edu.institution }} | {{ edu.year }}</div>
        </div>
        {% endfor %}
    </div>
    {% endif %}

    {% if skills %}
    <div class="section">
        <div class="section-title">Umiejętności</div>
        <p>{{ skills|join(', ') }}</p>
    </div>
    {% endif %}
</body>
</html>
"""

