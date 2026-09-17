from pathlib import Path

path = Path('index.html')
html = path.read_text()
marker = '</head>'
style = '''
    <style id="critical-about-mobile">
      @media (max-width: 900px) {
        .about-page { overflow: hidden !important; }
        .about-hero { max-width: 100% !important; min-width: 0 !important; width: 100% !important; }
        .about-hero h1 { font-size: clamp(42px, 13vw, 64px) !important; line-height: .94 !important; max-width: 100% !important; }
        .about-hero p, .about-intro p, .about-section-heading p, .about-phase p, .about-vision-card p { font-size: 12px !important; line-height: 1.75 !important; overflow-wrap: anywhere !important; }
        .about-hero__stats { display: grid !important; gap: 16px !important; grid-template-columns: repeat(3, minmax(0, 1fr)) !important; width: 100% !important; }
        .about-intro { max-width: 100% !important; min-width: 0 !important; }
        .about-intro > div:last-child, .about-phase, .about-vision-card { min-width: 0 !important; }
        .about-phase-grid, .about-vision-grid { grid-template-columns: minmax(0, 1fr) !important; }
      }
      @media (max-width: 390px) {
        .about-intro { flex-direction: column !important; }
      }
    </style>
'''
if 'id="critical-about-mobile"' not in html:
    html = html.replace(marker, style + marker, 1)
path.write_text(html)
