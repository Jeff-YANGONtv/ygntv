from pathlib import Path

path = Path('index.html')
html = path.read_text()
needle = 'id="critical-about-mobile"'
extra = '''
      @media (max-width: 1200px), (pointer: coarse) {
        .about-page, .about-hero, .about-intro, .about-roadmap, .about-vision { display: block !important; }
        .about-hero, .about-intro, .about-roadmap, .about-vision { width: 100% !important; max-width: 100% !important; }
        .about-hero h1, .about-hero p, .about-section-heading, .about-intro > div, .about-phase-grid, .about-vision-grid { display: block !important; width: 100% !important; max-width: 100% !important; }
        .about-hero h1 { margin-top: 15px !important; margin-bottom: 20px !important; font-size: clamp(42px, 13vw, 64px) !important; line-height: .94 !important; }
        .about-hero p { margin: 0 !important; }
        .about-hero__stats { display: grid !important; width: 100% !important; grid-template-columns: repeat(3, minmax(0, 1fr)) !important; margin-top: 28px !important; }
        .about-intro { margin-top: 38px !important; }
        .about-intro__mark { margin-bottom: 14px !important; }
        .about-intro h2 { margin-top: 7px !important; }
        .about-phase-grid, .about-vision-grid { display: grid !important; gap: 14px !important; grid-template-columns: 1fr !important; }
        .about-phase, .about-vision-card { width: 100% !important; min-width: 0 !important; }
      }
'''
if 'about mobile vertical flow' not in html:
    html = html.replace('</style>\n</head>', extra + '    </style>\n</head>', 1)
    html = html.replace('id="critical-about-mobile"', 'id="critical-about-mobile" data-about-vertical="true"', 1)
path.write_text(html)
